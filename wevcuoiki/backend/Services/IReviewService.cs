using Backend_WebBanHang.DTOs.Reviews;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend_WebBanHang.Services
{
    public interface IReviewService
    {
        Task<ReviewDto> CreateReviewAsync(CreateReviewDto dto, string userId);
        Task<List<ReviewDto>> GetReviewsByProductIdAsync(int productId);
        Task<ProductReviewSummaryDto> GetReviewSummaryByProductIdAsync(int productId);
        Task<bool> CanUserReviewProductAsync(string userId, int productId); // Kiểm tra từ Orders
    }
}
