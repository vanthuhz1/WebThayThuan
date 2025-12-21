using Backend_WebBanHang.Models;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Reviews;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

namespace Backend_WebBanHang.Services
{
    public class ReviewService : IReviewService
    {
        private readonly AppDbContext _context; // Giả sử DbContext của bạn
        public ReviewService(AppDbContext context) { _context = context; }

        public async Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto, string userId)
        {
            if (!await CanUserReviewProductAsync(userId, dto.ProductId)) throw new Exception("User hasn't purchased this product.");

            var review = new Reviews { /* map từ dto */ };
            // Xử lý upload ảnh nếu cần (sử dụng IWebHostEnvironment)
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();
            return new ReviewDto { /* map */ };
        }

        public async Task<List<ReviewDto>> GetReviewsByProductIdAsync(int productId)
        {
            return await _context.Reviews.Where(r => r.ProductId == productId).Select(r => new ReviewDto { /* map */ }).ToListAsync();
        }

        public async Task<ProductReviewSummaryDto> GetReviewSummaryByProductIdAsync(int productId)
        {
            var reviews = await _context.Reviews.Where(r => r.ProductId == productId).ToListAsync();
            return new ProductReviewSummaryDto
            {
                AverageRating = reviews.Any() ? reviews.Average(r => r.Rating) : 0,
                ReviewCount = reviews.Count
            };
        }

        public async Task<bool> CanUserReviewProductAsync(string userId, int productId)
        {
            if (!long.TryParse(userId, out long parsedUserId)) return false;

            return await _context.Orders
                .AnyAsync(o => o.IdUsers == parsedUserId &&
                               o.OrderItems.Any(oi =>
                                   oi.IdProductVariants == productId && 
                                   o.Status == "Completed"));
        }
    }
}
