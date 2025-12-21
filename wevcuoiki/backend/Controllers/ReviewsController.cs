using Backend_WebBanHang.DTOs.Reviews;
using Backend_WebBanHang.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;
        public ReviewsController(IReviewService reviewService) { _reviewService = reviewService; }

        [HttpPost]
        [Authorize] // Chỉ user đăng nhập
        public async Task<IActionResult> CreateReview(CreateReviewDto dto)
        {
            var review = await _reviewService.CreateReviewAsync(dto, User.FindFirstValue("sub")); // Lấy userId từ JWT
            return Ok(review);
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetReviews(int productId)
        {
            var reviews = await _reviewService.GetReviewsByProductIdAsync(productId);
            return Ok(reviews);
        }

        [HttpGet("{productId}/summary")]
        public async Task<IActionResult> GetSummary(int productId)
        {
            var summary = await _reviewService.GetReviewSummaryByProductIdAsync(productId);
            return Ok(summary);
        }
    }
}
