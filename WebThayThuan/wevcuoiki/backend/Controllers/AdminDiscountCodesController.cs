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
    public class AdminDiscountCodesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminDiscountCodesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/admin/AdminDiscountCodes
        [HttpGet]
        public async Task<IActionResult> GetDiscountCodes(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? status = null,
            [FromQuery] string? discountType = null,
            [FromQuery] string? search = null)
        {
            if (!IsAdmin()) return Forbid();

            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 20;

            var query = _context.DiscountCodes.AsQueryable();

            // Filter by status
            if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
            {
                if (status.ToLower() == "expired")
                {
                    // Mã hết hạn: ValidTo < Now hoặc status = inactive
                    var now = DateTime.Now;
                    query = query.Where(d => 
                        (d.ValidTo.HasValue && d.ValidTo < now) || 
                        d.Status == "inactive");
                }
                else
                {
                    query = query.Where(d => d.Status == status);
                }
            }

            // Filter by discount type
            if (!string.IsNullOrWhiteSpace(discountType) && discountType.ToLower() != "all")
            {
                query = query.Where(d => d.DiscountType == discountType);
            }

            // Search by code
            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchLower = search.Trim().ToLower();
                query = query.Where(d => d.Code.ToLower().Contains(searchLower));
            }

            var totalItems = await query.CountAsync();

            var codes = await query
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new
                {
                    d.IdDiscountCodes,
                    d.Code,
                    d.DiscountType,
                    d.DiscountValue,
                    d.MinOrderAmount,
                    d.UsageLimit,
                    d.UsedCount,
                    d.ValidFrom,
                    d.ValidTo,
                    d.Status,
                    d.CreatedAt,
                    d.UpdatedAt,
                    // Tính số lần còn lại
                    RemainingUsage = d.UsageLimit.HasValue && d.UsedCount.HasValue
                        ? d.UsageLimit.Value - d.UsedCount.Value
                        : (int?)null,
                    // Kiểm tra hết hạn
                    IsExpired = d.ValidTo.HasValue && d.ValidTo < DateTime.Now,
                    // Kiểm tra sắp hết hạn (còn < 7 ngày)
                    IsExpiringSoon = d.ValidTo.HasValue && 
                        d.ValidTo >= DateTime.Now && 
                        d.ValidTo <= DateTime.Now.AddDays(7)
                })
                .ToListAsync();

            return Ok(new
            {
                Page = page,
                PageSize = pageSize,
                TotalItems = totalItems,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize),
                Items = codes
            });
        }

        // GET: api/admin/AdminDiscountCodes/{id}
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetDiscountCode(long id)
        {
            if (!IsAdmin()) return Forbid();

            var code = await _context.DiscountCodes.FindAsync(id);
            if (code == null) return NotFound();

            return Ok(new
            {
                code.IdDiscountCodes,
                code.Code,
                code.DiscountType,
                code.DiscountValue,
                code.MinOrderAmount,
                code.UsageLimit,
                code.UsedCount,
                code.ValidFrom,
                code.ValidTo,
                code.Status,
                code.CreatedAt,
                code.UpdatedAt
            });
        }

        // POST: api/admin/AdminDiscountCodes
        [HttpPost]
        public async Task<IActionResult> CreateDiscountCode([FromBody] CreateDiscountCodeRequest request)
        {
            if (!IsAdmin()) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Validate code unique
            var codeUpper = request.Code.Trim().ToUpper();
            var exists = await _context.DiscountCodes.AnyAsync(d => d.Code == codeUpper);
            if (exists)
                return BadRequest("Mã giảm giá đã tồn tại");

            // Validate discount type
            if (request.DiscountType != "percent" && request.DiscountType != "fixed")
                return BadRequest("DiscountType phải là 'percent' hoặc 'fixed'");

            // Validate discount value
            if (request.DiscountValue <= 0)
                return BadRequest("DiscountValue phải > 0");

            if (request.DiscountType == "percent" && request.DiscountValue > 100)
                return BadRequest("Giảm giá theo % không được vượt quá 100%");

            // Validate date range
            if (request.ValidFrom.HasValue && request.ValidTo.HasValue && request.ValidFrom > request.ValidTo)
                return BadRequest("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");

            var discountCode = new DiscountCode
            {
                Code = codeUpper,
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                MinOrderAmount = request.MinOrderAmount,
                UsageLimit = request.UsageLimit,
                UsedCount = 0,
                ValidFrom = request.ValidFrom,
                ValidTo = request.ValidTo,
                Status = request.Status ?? "active",
                CreatedAt = DateTime.Now
            };

            _context.DiscountCodes.Add(discountCode);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Tạo mã giảm giá thành công",
                IdDiscountCodes = discountCode.IdDiscountCodes,
                Code = discountCode.Code
            });
        }

        // PUT: api/admin/AdminDiscountCodes/{id}
        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateDiscountCode(long id, [FromBody] UpdateDiscountCodeRequest request)
        {
            if (!IsAdmin()) return Forbid();

            var code = await _context.DiscountCodes.FindAsync(id);
            if (code == null) return NotFound();

            // Validate code unique (nếu đổi code)
            if (!string.IsNullOrWhiteSpace(request.Code) && request.Code.Trim().ToUpper() != code.Code)
            {
                var codeUpper = request.Code.Trim().ToUpper();
                var exists = await _context.DiscountCodes.AnyAsync(d => d.Code == codeUpper && d.IdDiscountCodes != id);
                if (exists)
                    return BadRequest("Mã giảm giá đã tồn tại");
                code.Code = codeUpper;
            }

            // Validate discount type
            if (!string.IsNullOrWhiteSpace(request.DiscountType))
            {
                if (request.DiscountType != "percent" && request.DiscountType != "fixed")
                    return BadRequest("DiscountType phải là 'percent' hoặc 'fixed'");
                code.DiscountType = request.DiscountType;
            }

            // Validate discount value
            if (request.DiscountValue.HasValue)
            {
                if (request.DiscountValue <= 0)
                    return BadRequest("DiscountValue phải > 0");
                
                var discountType = request.DiscountType ?? code.DiscountType;
                if (discountType == "percent" && request.DiscountValue > 100)
                    return BadRequest("Giảm giá theo % không được vượt quá 100%");
                
                code.DiscountValue = request.DiscountValue.Value;
            }

            // Validate date range
            var validFrom = request.ValidFrom ?? code.ValidFrom;
            var validTo = request.ValidTo ?? code.ValidTo;
            if (validFrom.HasValue && validTo.HasValue && validFrom > validTo)
                return BadRequest("Ngày bắt đầu phải nhỏ hơn ngày kết thúc");

            if (request.MinOrderAmount.HasValue)
                code.MinOrderAmount = request.MinOrderAmount;

            if (request.UsageLimit.HasValue)
                code.UsageLimit = request.UsageLimit;

            if (request.ValidFrom.HasValue)
                code.ValidFrom = request.ValidFrom;

            if (request.ValidTo.HasValue)
                code.ValidTo = request.ValidTo;

            if (!string.IsNullOrWhiteSpace(request.Status))
                code.Status = request.Status;

            code.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật mã giảm giá thành công" });
        }

        // DELETE: api/admin/AdminDiscountCodes/{id}
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteDiscountCode(long id)
        {
            if (!IsAdmin()) return Forbid();

            var code = await _context.DiscountCodes.FindAsync(id);
            if (code == null) return NotFound();

            var codeValue = code.Code;

            // Kiểm tra xem có đơn hàng nào đang dùng mã này không
            var hasOrders = await _context.Orders.AnyAsync(o => o.IdDiscountCodes == id);
            if (hasOrders)
            {
                // Soft delete: chỉ đổi status thành inactive
                code.Status = "inactive";
                code.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();
                return Ok(new { Message = $"Mã {codeValue} đã được vô hiệu hóa (có đơn hàng đang sử dụng)" });
            }

            // Hard delete nếu không có đơn hàng nào dùng
            _context.DiscountCodes.Remove(code);
            await _context.SaveChangesAsync();

            return Ok(new { Message = $"Đã xóa mã {codeValue} thành công" });
        }

        private bool IsAdmin()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            return role == "admin";
        }
    }

    public class CreateDiscountCodeRequest
    {
        public string Code { get; set; } = null!;
        public string DiscountType { get; set; } = null!; // "percent" | "fixed"
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateDiscountCodeRequest
    {
        public string? Code { get; set; }
        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public string? Status { get; set; }
    }
}

