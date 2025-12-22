using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/admin/[controller]")]
    [Authorize]
    public class AdminDashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDashboardController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminDashboard/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            // Check if user is admin
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole != "admin")
            {
                return Forbid("Chỉ admin mới có quyền truy cập");
            }

            try
            {
                var stats = new DashboardStatsDto();

                // Tổng quan
                stats.TotalProducts = await _context.Products.CountAsync();
                stats.TotalOrders = await _context.Orders.CountAsync();
                stats.TotalUsers = await _context.Users.CountAsync();
                
                // Tổng doanh thu (từ các đơn hàng đã hoàn thành)
                stats.TotalRevenue = await _context.Orders
                    .Where(o => o.Status == "completed" || o.Status == "delivered")
                    .SumAsync(o => o.TotalAmount);

                // Đơn hàng theo trạng thái
                stats.PendingOrders = await _context.Orders.CountAsync(o => o.Status == "pending");
                stats.ProcessingOrders = await _context.Orders.CountAsync(o => o.Status == "processing" || o.Status == "shipped");
                stats.CompletedOrders = await _context.Orders.CountAsync(o => o.Status == "completed" || o.Status == "delivered");
                stats.CancelledOrders = await _context.Orders.CountAsync(o => o.Status == "cancelled");

                // Doanh thu theo tháng (12 tháng gần nhất)
                var twelveMonthsAgo = DateTime.Now.AddMonths(-12);
                var revenueByMonthRaw = await _context.Orders
                    .Where(o =>
                        o.CreatedAt.HasValue &&
                        o.CreatedAt >= twelveMonthsAgo &&
                        (o.Status == "completed" || o.Status == "delivered"))
                    .GroupBy(o => new { Year = o.CreatedAt.Value.Year, Month = o.CreatedAt.Value.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Revenue = g.Sum(o => o.TotalAmount)
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                stats.MonthlyRevenue = revenueByMonthRaw.Select(r => new MonthlyRevenueDto
                {
                    Month = $"{r.Year}-{r.Month:D2}",
                    Revenue = r.Revenue
                }).ToList();

                // Đơn hàng theo tháng
                var ordersByMonthRaw = await _context.Orders
                    .Where(o => o.CreatedAt.HasValue && o.CreatedAt >= twelveMonthsAgo)
                    .GroupBy(o => new { Year = o.CreatedAt.Value.Year, Month = o.CreatedAt.Value.Month })
                    .Select(g => new
                    {
                        Year = g.Key.Year,
                        Month = g.Key.Month,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Year)
                    .ThenBy(x => x.Month)
                    .ToListAsync();

                stats.MonthlyOrders = ordersByMonthRaw.Select(o => new MonthlyOrderDto
                {
                    Month = $"{o.Year}-{o.Month:D2}",
                    Count = o.Count
                }).ToList();

                // Top sản phẩm bán chạy (10 sản phẩm)
                var topProducts = await (from oi in _context.OrderItems
                                       join o in _context.Orders on oi.IdOrders equals o.IdOrders
                                       join v in _context.ProductVariants on oi.IdProductVariants equals v.IdProductVariants
                                       join p in _context.Products on v.IdProducts equals p.IdProducts
                                       where o.Status != "cancelled"
                                       group new { oi, p } by new { p.IdProducts, p.Name } into g
                                       select new
                                       {
                                           IdProducts = g.Key.IdProducts,
                                           Name = g.Key.Name,
                                           SoldQuantity = g.Sum(x => x.oi.Quantity),
                                           Revenue = g.Sum(x => x.oi.Quantity * x.oi.UnitPrice)
                                       })
                                       .OrderByDescending(x => x.SoldQuantity)
                                       .Take(10)
                                       .ToListAsync();

                stats.TopProducts = topProducts.Select(p => new TopProductDto
                {
                    IdProducts = p.IdProducts,
                    Name = p.Name,
                    SoldQuantity = p.SoldQuantity,
                    Revenue = p.Revenue
                }).ToList();

                // Đơn hàng gần đây (10 đơn hàng)
                var recentOrders = await _context.Orders
                    .OrderByDescending(o => o.CreatedAt)
                    .Take(10)
                    .Select(o => new RecentOrderDto
                    {
                        IdOrders = o.IdOrders,
                        OrderNumber = o.OrderNumber,
                        CustomerName = _context.Users
                            .Where(u => u.IdUsers == o.IdUsers)
                            .Select(u => u.FullName)
                            .FirstOrDefault() ?? "Khách hàng",
                        TotalAmount = o.TotalAmount,
                        Status = o.Status ?? "pending",
                        CreatedAt = o.CreatedAt
                    })
                    .ToListAsync();

                stats.RecentOrders = recentOrders;

                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi khi lấy thống kê", error = ex.Message });
            }
        }
    }
}

