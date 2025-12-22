using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class AdminUsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminUsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminUsers
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? role = null,
            [FromQuery] string? status = null)
        {
            if (!IsAdmin()) return Forbid();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _context.Users.AsQueryable();

            if (!string.IsNullOrWhiteSpace(role))
            {
                var normRole = NormalizeRole(role);
                if (normRole != null) query = query.Where(u => u.Role == normRole);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normStatus = NormalizeStatus(status);
                if (normStatus != null) query = query.Where(u => u.Status == normStatus);
            }

            var totalItems = await query.CountAsync();

            var usersPage = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var userIds = usersPage.Select(u => u.IdUsers).ToList();

            var orderStats = await _context.Orders
                .Where(o => userIds.Contains(o.IdUsers))
                .GroupBy(o => o.IdUsers)
                .Select(g => new
                {
                    IdUsers = g.Key,
                    OrdersCount = g.Count(),
                    TotalSpent = g
                        .Where(o => o.Status == "completed" || o.Status == "delivered")
                        .Sum(o => (decimal?)o.TotalAmount) ?? 0
                })
                .ToListAsync();

            var statsDict = orderStats.ToDictionary(x => x.IdUsers, x => x);

            var users = usersPage.Select(u =>
            {
                statsDict.TryGetValue(u.IdUsers, out var stat);
                return new
                {
                    u.IdUsers,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Role,
                    u.Status,
                    u.CreatedAt,
                    OrdersCount = stat?.OrdersCount ?? 0,
                    TotalSpent = stat?.TotalSpent ?? 0
                };
            }).ToList();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = users
            });
        }

        // GET: api/admin/AdminUsers/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetUser(long id)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var orders = await _context.Orders
                .Where(o => o.IdUsers == id)
                .OrderByDescending(o => o.CreatedAt)
                .Take(20)
                .Select(o => new
                {
                    o.IdOrders,
                    o.OrderNumber,
                    o.TotalAmount,
                    o.Status,
                    o.CreatedAt
                })
                .ToListAsync();

            var totalSpent = await _context.Orders
                .Where(o => o.IdUsers == id && (o.Status == "completed" || o.Status == "delivered"))
                .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

            var orderCount = await _context.Orders.CountAsync(o => o.IdUsers == id);

            return Ok(new
            {
                user.IdUsers,
                user.FullName,
                user.Email,
                user.Phone,
                user.Role,
                user.Status,
                user.CreatedAt,
                user.UpdatedAt,
                TotalSpent = totalSpent,
                OrderCount = orderCount,
                Orders = orders
            });
        }

        // PUT: api/admin/AdminUsers/{id}/role
        [HttpPut("{id:long}/role")]
        public async Task<IActionResult> UpdateRole(long id, [FromBody] UpdateRoleRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var normRole = NormalizeRole(request.Role);
            if (normRole == null) return BadRequest("Role không hợp lệ (customer/admin)");

            user.Role = normRole;
            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật vai trò thành công" });
        }

        // PUT: api/admin/AdminUsers/{id}/status
        [HttpPut("{id:long}/status")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateStatusRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var normStatus = NormalizeStatus(request.Status);
            if (normStatus == null) return BadRequest("Status không hợp lệ (active/banned)");

            user.Status = normStatus;
            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật trạng thái thành công" });
        }

        // POST: api/admin/AdminUsers
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            if (!IsAdmin()) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Kiểm tra email đã tồn tại
            var exists = await _context.Users.AnyAsync(u => u.Email == request.Email);
            if (exists)
                return BadRequest("Email đã tồn tại");

            var normRole = NormalizeRole(request.Role);
            if (normRole == null)
                return BadRequest("Role không hợp lệ (customer/admin)");

            var normStatus = NormalizeStatus(request.Status ?? "active");
            if (normStatus == null)
                return BadRequest("Status không hợp lệ (active/banned)");

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                Phone = request.Phone,
                Role = normRole,
                Status = normStatus,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Tạo người dùng thành công",
                IdUsers = user.IdUsers,
                Email = user.Email
            });
        }

        // PUT: api/admin/AdminUsers/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateUser(long id, [FromBody] UpdateUserRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Kiểm tra email đã tồn tại (nếu thay đổi email)
            if (!string.IsNullOrWhiteSpace(request.Email) && request.Email != user.Email)
            {
                var exists = await _context.Users.AnyAsync(u => u.Email == request.Email && u.IdUsers != id);
                if (exists)
                    return BadRequest("Email đã tồn tại");
                user.Email = request.Email;
            }

            if (!string.IsNullOrWhiteSpace(request.FullName))
                user.FullName = request.FullName;

            if (request.Phone != null)
                user.Phone = request.Phone;

            if (!string.IsNullOrWhiteSpace(request.Password))
                user.PasswordHash = HashPassword(request.Password);

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                var normRole = NormalizeRole(request.Role);
                if (normRole == null)
                    return BadRequest("Role không hợp lệ (customer/admin)");
                user.Role = normRole;
            }

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                var normStatus = NormalizeStatus(request.Status);
                if (normStatus == null)
                    return BadRequest("Status không hợp lệ (active/banned)");
                user.Status = normStatus;
            }

            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật người dùng thành công" });
        }

        // DELETE: api/admin/AdminUsers/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Lấy thông tin user để trả về
            var userName = user.FullName;
            var userEmail = user.Email;

            // Xóa tất cả dữ liệu liên quan trước khi xóa user

            // 1. Xóa OrderStatusHistories (qua Orders)
            var orderIds = await _context.Orders
                .Where(o => o.IdUsers == id)
                .Select(o => o.IdOrders)
                .ToListAsync();
            
            if (orderIds.Any())
            {
                var statusHistories = await _context.OrderStatusHistories
                    .Where(osh => orderIds.Contains(osh.IdOrders))
                    .ToListAsync();
                if (statusHistories.Any())
                    _context.OrderStatusHistories.RemoveRange(statusHistories);

                // 2. Xóa Payments (qua Orders)
                var payments = await _context.Payments
                    .Where(p => orderIds.Contains(p.IdOrders))
                    .ToListAsync();
                if (payments.Any())
                    _context.Payments.RemoveRange(payments);

                // 3. Xóa OrderItems (qua Orders)
                var orderItems = await _context.OrderItems
                    .Where(oi => orderIds.Contains(oi.IdOrders))
                    .ToListAsync();
                if (orderItems.Any())
                    _context.OrderItems.RemoveRange(orderItems);

                // 4. Xóa Orders
                var orders = await _context.Orders
                    .Where(o => o.IdUsers == id)
                    .ToListAsync();
                if (orders.Any())
                    _context.Orders.RemoveRange(orders);
            }

            // 5. Xóa CartItems (qua Cart)
            var cartIds = await _context.Carts
                .Where(c => c.IdUsers == id)
                .Select(c => c.IdCarts)
                .ToListAsync();
            
            if (cartIds.Any())
            {
                var cartItems = await _context.CartItems
                    .Where(ci => cartIds.Contains(ci.IdCarts))
                    .ToListAsync();
                if (cartItems.Any())
                    _context.CartItems.RemoveRange(cartItems);

                // 6. Xóa Carts
                var carts = await _context.Carts
                    .Where(c => c.IdUsers == id)
                    .ToListAsync();
                if (carts.Any())
                    _context.Carts.RemoveRange(carts);
            }

            // 7. Xóa WishlistItems (qua Wishlist)
            var wishlistIds = await _context.Wishlists
                .Where(w => w.IdUsers == id)
                .Select(w => w.IdWishlists)
                .ToListAsync();
            
            if (wishlistIds.Any())
            {
                var wishlistItems = await _context.WishlistItems
                    .Where(wi => wishlistIds.Contains(wi.IdWishlists))
                    .ToListAsync();
                if (wishlistItems.Any())
                    _context.WishlistItems.RemoveRange(wishlistItems);

                // 8. Xóa Wishlists
                var wishlists = await _context.Wishlists
                    .Where(w => w.IdUsers == id)
                    .ToListAsync();
                if (wishlists.Any())
                    _context.Wishlists.RemoveRange(wishlists);
            }

            // 9. Xóa ProductReviews
            var productReviews = await _context.ProductReviews
                .Where(pr => pr.IdUsers == id)
                .ToListAsync();
            if (productReviews.Any())
                _context.ProductReviews.RemoveRange(productReviews);

            // 10. Xóa Blogs (nếu user là author)
            var blogs = await _context.Blogs
                .Where(b => b.IdUsers == id)
                .ToListAsync();
            if (blogs.Any())
                _context.Blogs.RemoveRange(blogs);

            // 11. Cuối cùng xóa User
            _context.Users.Remove(user);

            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã xóa tài khoản {userName} ({userEmail}) thành công" });
        }

        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "admin";
        }

        private string? NormalizeRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role)) return null;
            var lower = role.Trim().ToLower();
            // Đồng bộ thành 2 vai trò chính: customer và admin
            return lower switch
            {
                "admin" => "admin",
                "customer" => "customer",
                "user" => "customer", // Map "user" cũ sang "customer" mới
                _ => null
            };
        }

        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        private string? NormalizeStatus(string? status)
        {
            if (string.IsNullOrWhiteSpace(status)) return null;
            var lower = status.Trim().ToLower();
            return lower switch
            {
                "active" => "active",
                "banned" => "banned",
                _ => null
            };
        }
    }

    public class UpdateRoleRequest
    {
        public string Role { get; set; } = null!;
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = null!;
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string? Phone { get; set; }
        public string Role { get; set; } = "customer";
        public string? Status { get; set; }
    }

    public class UpdateUserRequest
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Phone { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
    }
}

