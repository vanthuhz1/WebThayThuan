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
    public class AdminReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminReviews
        [HttpGet]
        public async Task<IActionResult> GetReviews(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] int? rating = null,
            [FromQuery] long? productId = null)
        {
            if (!IsAdmin()) return Forbid();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _context.ProductReviews.AsQueryable();

            // Filter by status
            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                query = query.Where(r => r.Status == status);
            }

            // Filter by rating
            if (rating.HasValue && rating.Value >= 1 && rating.Value <= 5)
            {
                query = query.Where(r => r.Rating == rating.Value);
            }

            // Filter by product
            if (productId.HasValue)
            {
                query = query.Where(r => r.IdProducts == productId.Value);
            }

            var totalItems = await query.CountAsync();

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.IdProductReviews,
                    r.IdProducts,
                    ProductName = _context.Products
                        .Where(p => p.IdProducts == r.IdProducts)
                        .Select(p => p.Name)
                        .FirstOrDefault(),
                    r.IdUsers,
                    UserName = _context.Users
                        .Where(u => u.IdUsers == r.IdUsers)
                        .Select(u => u.FullName)
                        .FirstOrDefault(),
                    UserEmail = _context.Users
                        .Where(u => u.IdUsers == r.IdUsers)
                        .Select(u => u.Email)
                        .FirstOrDefault(),
                    r.Rating,
                    r.Review,
                    r.Status,
                    r.CreatedAt,
                    r.UpdatedAt
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = reviews
            });
        }

        // GET: api/admin/AdminReviews/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetReview(long id)
        {
            if (!IsAdmin()) return Forbid();

            var review = await _context.ProductReviews.FindAsync(id);
            if (review == null) return NotFound();

            var productName = await _context.Products
                .Where(p => p.IdProducts == review.IdProducts)
                .Select(p => p.Name)
                .FirstOrDefaultAsync();

            var user = await _context.Users
                .Where(u => u.IdUsers == review.IdUsers)
                .Select(u => new { u.FullName, u.Email })
                .FirstOrDefaultAsync();

            return Ok(new
            {
                review.IdProductReviews,
                review.IdProducts,
                ProductName = productName,
                review.IdUsers,
                UserName = user?.FullName,
                UserEmail = user?.Email,
                review.Rating,
                review.Review,
                review.Status,
                review.CreatedAt,
                review.UpdatedAt
            });
        }

        // PUT: api/admin/AdminReviews/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateReview(long id, [FromBody] UpdateReviewRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var review = await _context.ProductReviews.FindAsync(id);
            if (review == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                review.Status = request.Status;
            }

            if (request.Rating.HasValue && request.Rating.Value >= 1 && request.Rating.Value <= 5)
            {
                review.Rating = (byte)request.Rating.Value;
            }

            if (request.Review != null)
            {
                review.Review = string.IsNullOrWhiteSpace(request.Review) ? null : request.Review.Trim();
            }

            review.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật đánh giá thành công" });
        }

        // DELETE: api/admin/AdminReviews/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteReview(long id)
        {
            if (!IsAdmin()) return Forbid();

            var review = await _context.ProductReviews.FindAsync(id);
            if (review == null) return NotFound();

            _context.ProductReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa đánh giá thành công" });
        }

        // GET: api/admin/AdminReviews/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            if (!IsAdmin()) return Forbid();

            var totalReviews = await _context.ProductReviews.CountAsync();
            var pendingReviews = await _context.ProductReviews.CountAsync(r => r.Status == "pending");
            var activeReviews = await _context.ProductReviews.CountAsync(r => r.Status == "active" || r.Status == "visible");
            var hiddenReviews = await _context.ProductReviews.CountAsync(r => r.Status == "hidden");

            var avgRating = await _context.ProductReviews
                .Where(r => r.Status == "active" || r.Status == "visible")
                .Select(r => (double?)r.Rating)
                .AverageAsync() ?? 0;

            return Ok(new
            {
                TotalReviews = totalReviews,
                PendingReviews = pendingReviews,
                ActiveReviews = activeReviews,
                HiddenReviews = hiddenReviews,
                AverageRating = Math.Round(avgRating, 1)
            });
        }

        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "admin";
        }
    }

    public class UpdateReviewRequest
    {
        public string? Status { get; set; }
        public int? Rating { get; set; }
        public string? Review { get; set; }
    }
}
