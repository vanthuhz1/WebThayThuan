using Backend_WebBanHang.DTOs.Vouchers;
using Backend_WebBanHang.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;
        public VouchersController(IVoucherService voucherService) { _voucherService = voucherService; }

        [HttpGet]
        public async Task<IActionResult> GetActiveVouchers()
        {
            var vouchers = await _voucherService.GetActiveVouchersAsync();
            return Ok(vouchers);
        }

        [HttpPost("apply")]
        public async Task<IActionResult> ApplyVoucher(ApplyVoucherDto dto)
        {
            var voucher = await _voucherService.ApplyVoucherAsync(dto);
            return Ok(voucher);
        }

        [HttpGet("suggest")]
        public async Task<IActionResult> SuggestVouchers(decimal orderValue)
        {
            var suggestions = await _voucherService.SuggestVouchersAsync(orderValue);
            return Ok(suggestions);
        }
    }
}
