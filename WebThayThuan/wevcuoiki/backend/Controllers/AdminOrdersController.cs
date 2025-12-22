using Backend_WebBanHang.Data;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Linq;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class AdminOrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminOrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminOrders
        [HttpGet]
        public async Task<IActionResult> GetOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null)
        {
            if (!IsAdmin()) return Forbid();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _context.Orders.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var totalItems = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.IdOrders,
                    o.OrderNumber,
                    CustomerName = _context.Users
                        .Where(u => u.IdUsers == o.IdUsers)
                        .Select(u => u.FullName)
                        .FirstOrDefault() ?? "Khách hàng",
                    CustomerEmail = _context.Users
                        .Where(u => u.IdUsers == o.IdUsers)
                        .Select(u => u.Email)
                        .FirstOrDefault(),
                    o.TotalAmount,
                    o.Status,
                    o.ShippingAddress,
                    o.CreatedAt,
                    ItemCount = _context.OrderItems
                        .Where(oi => oi.IdOrders == o.IdOrders)
                        .Sum(oi => oi.Quantity)
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = orders
            });
        }

        // GET: api/admin/AdminOrders/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetOrder(long id)
        {
            if (!IsAdmin()) return Forbid();

            var order = await _context.Orders
                .Where(o => o.IdOrders == id)
                .FirstOrDefaultAsync();

            if (order == null) return NotFound();

            var user = await _context.Users.FindAsync(order.IdUsers);

            var items = await (from oi in _context.OrderItems
                             join v in _context.ProductVariants on oi.IdProductVariants equals v.IdProductVariants
                             join p in _context.Products on v.IdProducts equals p.IdProducts
                             where oi.IdOrders == id
                             select new
                             {
                                 oi.IdOrderItems,
                                 ProductId = p.IdProducts,
                                 ProductName = p.Name,
                                 ProductImage = _context.ProductImages
                                     .Where(i => i.IdProducts == p.IdProducts)
                                     .OrderByDescending(i => i.IsPrimary.HasValue && i.IsPrimary.Value)
                                     .ThenBy(i => i.Position ?? 0)
                                     .Select(i => i.Url)
                                     .FirstOrDefault(),
                                 v.Color,
                                 v.Size,
                                 oi.Quantity,
                                 oi.UnitPrice,
                                 SubTotal = oi.Quantity * oi.UnitPrice
                             })
                             .ToListAsync();

            return Ok(new
            {
                order.IdOrders,
                order.OrderNumber,
                Customer = new
                {
                    IdUsers = user?.IdUsers ?? 0,
                    FullName = user?.FullName ?? "Khách hàng",
                    Email = user?.Email ?? "",
                    Phone = user?.Phone ?? ""
                },
                order.TotalAmount,
                order.ShippingFee,
                order.ShippingAddress,
                order.Status,
                order.IdDiscountCodes,
                order.CreatedAt,
                order.UpdatedAt,
                Items = items
            });
        }

        // PUT: api/admin/AdminOrders/{id}/status
        [HttpPut("{id:long}/status")]
        public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] UpdateOrderStatusRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = request.Status;
            order.UpdatedAt = DateTime.Now;

            // Log status change
            var statusHistory = new OrderStatusHistory
            {
                IdOrders = id,
                NewStatus = request.Status,
                Note = request.Notes,
                CreatedAt = DateTime.Now
            };
            _context.OrderStatusHistories.Add(statusHistory);

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật trạng thái đơn hàng thành công" });
        }

        // DELETE: api/admin/AdminOrders/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteOrder(long id)
        {
            if (!IsAdmin()) return Forbid();

            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            // Lấy orderNumber để trả về cho frontend
            var orderNumber = order.OrderNumber;

            // Xóa các Payments trước (có foreign key đến Orders)
            var payments = await _context.Payments
                .Where(p => p.IdOrders == id)
                .ToListAsync();
            if (payments.Any())
            {
                _context.Payments.RemoveRange(payments);
            }

            // Xóa các order items
            var orderItems = await _context.OrderItems
                .Where(oi => oi.IdOrders == id)
                .ToListAsync();
            if (orderItems.Any())
            {
                _context.OrderItems.RemoveRange(orderItems);
            }

            // Xóa order status history
            var statusHistories = await _context.OrderStatusHistories
                .Where(osh => osh.IdOrders == id)
                .ToListAsync();
            if (statusHistories.Any())
            {
                _context.OrderStatusHistories.RemoveRange(statusHistories);
            }

            // Xóa order
            _context.Orders.Remove(order);

            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Xóa đơn hàng {orderNumber} thành công", OrderNumber = orderNumber });
        }

        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "admin";
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string Status { get; set; } = null!;
        public string? Notes { get; set; }
    }
}

