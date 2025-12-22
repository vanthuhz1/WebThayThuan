using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

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
            if (normRole == null) return BadRequest("Role không hợp lệ (user/admin)");

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

        // DELETE: api/admin/AdminUsers/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteUser(long id)
        {
            if (!IsAdmin()) return Forbid();

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            // Soft delete: khóa tài khoản
            user.Status = "banned";
            user.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã khóa tài khoản (banned)" });
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
            return lower switch
            {
                "admin" => "admin",
                "user" => "user",
                "customer" => "user",
                _ => null
            };
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
}

