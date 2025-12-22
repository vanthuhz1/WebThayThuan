// Controllers/DiscountCodesController.cs
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.DiscountCodes;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DiscountCodesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DiscountCodesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/DiscountCodes/available
        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableDiscountCodes()
        {
            var now = DateTime.Now;
            
            var codes = await _context.DiscountCodes
                .Where(d => d.Status == "active")
                .Where(d => !d.ValidFrom.HasValue || d.ValidFrom <= now)
                .Where(d => !d.ValidTo.HasValue || d.ValidTo >= now)
                .Where(d => !d.UsageLimit.HasValue || d.UsedCount < d.UsageLimit)
                .Select(d => new
                {
                    d.IdDiscountCodes,
                    d.Code,
                    d.DiscountType,
                    d.DiscountValue,
                    d.MinOrderAmount,
                    d.ValidTo
                })
                .ToListAsync();

            return Ok(codes);
        }

        // GET: api/DiscountCodes/validate/{code}
        [HttpGet("validate/{code}")]
        public async Task<IActionResult> ValidateDiscountCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return Ok(new { isValid = false, message = "Vui lòng nhập mã giảm giá" });
            }

            var codeUpper = code.Trim().ToUpper();
            var now = DateTime.Now;

            var discountCode = await _context.DiscountCodes
                .FirstOrDefaultAsync(d => d.Code == codeUpper);

            if (discountCode == null)
            {
                return Ok(new { isValid = false, message = "Mã giảm giá không tồn tại" });
            }

            if (discountCode.Status != "active")
            {
                return Ok(new { isValid = false, message = "Mã giảm giá đã bị vô hiệu hóa" });
            }

            if (discountCode.ValidFrom.HasValue && discountCode.ValidFrom > now)
            {
                return Ok(new { isValid = false, message = "Mã giảm giá chưa có hiệu lực" });
            }

            if (discountCode.ValidTo.HasValue && discountCode.ValidTo < now)
            {
                return Ok(new { isValid = false, message = "Mã giảm giá đã hết hạn" });
            }

            if (discountCode.UsageLimit.HasValue && discountCode.UsedCount >= discountCode.UsageLimit)
            {
                return Ok(new { isValid = false, message = "Mã giảm giá đã hết lượt sử dụng" });
            }

            return Ok(new
            {
                isValid = true,
                idDiscountCodes = discountCode.IdDiscountCodes,
                code = discountCode.Code,
                discountType = discountCode.DiscountType == "percent" ? "percentage" : "fixed",
                discountValue = discountCode.DiscountValue,
                minOrderAmount = discountCode.MinOrderAmount,
                message = "Mã giảm giá hợp lệ"
            });
        }
    }
}
