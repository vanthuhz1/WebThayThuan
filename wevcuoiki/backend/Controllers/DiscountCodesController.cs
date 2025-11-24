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

        // ========== CRUD cho admin ==========

        // GET: api/DiscountCodes
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _context.DiscountCodes
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new DiscountCodeDto
                {
                    IdDiscountCodes = x.IdDiscountCodes,
                    Code = x.Code,
                    Description = x.Description,
                    DiscountType = x.DiscountType,
                    DiscountValue = x.DiscountValue,
                    MinOrderAmount = x.MinOrderAmount,
                    UsageLimit = x.UsageLimit,
                    UsedCount = x.UsedCount,
                    ValidFrom = x.ValidFrom,
                    ValidTo = x.ValidTo,
                    Status = x.Status
                })
                .ToListAsync();

            return Ok(items);
        }

        // GET: api/DiscountCodes/5
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var x = await _context.DiscountCodes
                .FirstOrDefaultAsync(d => d.IdDiscountCodes == id);

            if (x == null) return NotFound();

            var dto = new DiscountCodeDto
            {
                IdDiscountCodes = x.IdDiscountCodes,
                Code = x.Code,
                Description = x.Description,
                DiscountType = x.DiscountType,
                DiscountValue = x.DiscountValue,
                MinOrderAmount = x.MinOrderAmount,
                UsageLimit = x.UsageLimit,
                UsedCount = x.UsedCount,
                ValidFrom = x.ValidFrom,
                ValidTo = x.ValidTo,
                Status = x.Status
            };

            return Ok(dto);
        }

        // POST: api/DiscountCodes
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DiscountCodeDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var exists = await _context.DiscountCodes
                .AnyAsync(x => x.Code == model.Code);
            if (exists) return BadRequest("Mã giảm giá đã tồn tại.");

            var entity = new DiscountCode
            {
                Code = model.Code.Trim(),
                Description = model.Description,
                DiscountType = model.DiscountType,
                DiscountValue = model.DiscountValue ?? 0m,
                MinOrderAmount = model.MinOrderAmount ?? 0m,
                UsageLimit = model.UsageLimit,
                UsedCount = model.UsedCount ?? 0,
                ValidFrom = model.ValidFrom,
                ValidTo = model.ValidTo,
                Status = model.Status ?? "active",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.DiscountCodes.Add(entity);
            await _context.SaveChangesAsync();

            model.IdDiscountCodes = entity.IdDiscountCodes;
            model.UsedCount = entity.UsedCount;
            model.Status = entity.Status;
            model.DiscountValue = entity.DiscountValue;
            model.MinOrderAmount = entity.MinOrderAmount;

            return CreatedAtAction(nameof(GetById),
                new { id = entity.IdDiscountCodes }, model);
        }

        // PUT: api/DiscountCodes/5
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] DiscountCodeDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (id != model.IdDiscountCodes) return BadRequest("Id không khớp.");

            var entity = await _context.DiscountCodes.FindAsync(id);
            if (entity == null) return NotFound();

            var exists = await _context.DiscountCodes
                .AnyAsync(x => x.IdDiscountCodes != id && x.Code == model.Code);
            if (exists) return BadRequest("Mã giảm giá đã tồn tại.");

            entity.Code = model.Code.Trim();
            entity.Description = model.Description;
            entity.DiscountType = model.DiscountType;
            entity.DiscountValue = model.DiscountValue ?? 0m;
            entity.MinOrderAmount = model.MinOrderAmount ?? 0m;
            entity.UsageLimit = model.UsageLimit;
            entity.ValidFrom = model.ValidFrom;
            entity.ValidTo = model.ValidTo;
            entity.Status = model.Status ?? entity.Status;
            entity.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/DiscountCodes/5
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var entity = await _context.DiscountCodes.FindAsync(id);
            if (entity == null) return NotFound();

            _context.DiscountCodes.Remove(entity);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ========== Validate mã giảm giá theo giỏ hàng hiện tại ==========

        // GET: api/DiscountCodes/validate?code=SALE10
        [HttpGet("validate")]
        public async Task<IActionResult> ValidateCode([FromQuery] string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = code ?? string.Empty,
                    IsValid = false,
                    Message = "Mã giảm giá không được để trống."
                });
            }

            var userId = GetUserIdFromToken();
            if (userId == null)
            {
                return Unauthorized("Không đọc được user từ token.");
            }

            // Lấy giỏ hàng hiện tại
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = code,
                    IsValid = false,
                    Message = "Giỏ hàng đang trống."
                });
            }

            var cartItems = await (from ci in _context.CartItems
                                   join v in _context.ProductVariants on ci.IdProductVariants equals v.IdProductVariants
                                   join p in _context.Products on v.IdProducts equals p.IdProducts
                                   where ci.IdCarts == cart.IdCarts
                                   select new { ci, v, p })
                                  .ToListAsync();

            if (!cartItems.Any())
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = code,
                    IsValid = false,
                    Message = "Giỏ hàng đang trống."
                });
            }

            decimal totalAmount = 0;

            foreach (var x in cartItems)
            {
                decimal unitPrice =
                    x.v.SalePrice ??
                    x.v.Price ??
                    x.p.SalePrice ??
                    x.p.Price;

                totalAmount += unitPrice * x.ci.Quantity;
            }

            var normalizedCode = code.Trim();
            var now = DateTime.Now;

            var entity = await _context.DiscountCodes
                .FirstOrDefaultAsync(x =>
                    x.Code == normalizedCode &&
                    x.Status == "active");

            if (entity == null)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = normalizedCode,
                    IsValid = false,
                    Message = "Mã giảm giá không tồn tại hoặc đã bị khóa."
                });
            }

            // Lấy giá trị an toàn (coi null = 0)
            // Lấy giá trị từ entity
            decimal minOrderAmount = (decimal)entity.MinOrderAmount;
            decimal discountValue = entity.DiscountValue;
            int usedCount = (int)entity.UsedCount;
            int? usageLimit = entity.UsageLimit;

            if (entity.ValidFrom.HasValue && now < entity.ValidFrom.Value)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = normalizedCode,
                    IsValid = false,
                    Message = "Mã giảm giá chưa đến thời gian sử dụng."
                });
            }

            if (entity.ValidTo.HasValue && now > entity.ValidTo.Value)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = normalizedCode,
                    IsValid = false,
                    Message = "Mã giảm giá đã hết hạn."
                });
            }

            if (usageLimit.HasValue && usedCount >= usageLimit.Value)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = normalizedCode,
                    IsValid = false,
                    Message = "Mã giảm giá đã hết lượt sử dụng."
                });
            }

            if (totalAmount < minOrderAmount)
            {
                return Ok(new ValidateDiscountResponse
                {
                    Code = normalizedCode,
                    IsValid = false,
                    Message = $"Đơn hàng tối thiểu phải đạt {minOrderAmount:N0}."
                });
            }

            decimal discountAmount;
            if (entity.DiscountType == "percent")
            {
                discountAmount = totalAmount * discountValue / 100m;
            }
            else
            {
                discountAmount = discountValue;
            }

            if (discountAmount > totalAmount) discountAmount = totalAmount;
            if (discountAmount < 0) discountAmount = 0;

            var finalAmount = totalAmount - discountAmount;

            var resp = new ValidateDiscountResponse
            {
                Code = normalizedCode,
                IsValid = true,
                Message = "Áp dụng mã giảm giá thành công.",
                DiscountType = entity.DiscountType,
                DiscountValue = discountValue,
                DiscountAmount = discountAmount,
                FinalAmount = finalAmount
            };

            return Ok(resp);
        }

        private long? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (claim == null) return null;
            if (long.TryParse(claim.Value, out var id))
                return id;

            return null;
        }
    }
}
