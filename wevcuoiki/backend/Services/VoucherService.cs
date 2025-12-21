using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Vouchers;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly AppDbContext _context;
        public VoucherService(AppDbContext context) { _context = context; }

        public async Task<List<VoucherDto>> GetActiveVouchersAsync()
        {
            return await _context.Vouchers.Where(v => v.IsActive && v.ExpiryDate > DateTime.UtcNow).Select(v => new VoucherDto { /* map */ }).ToListAsync();
        }

        public async Task<VoucherDto> ApplyVoucherAsync(ApplyVoucherDto dto)
        {
            var voucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == dto.Code && v.IsActive && v.ExpiryDate > DateTime.UtcNow);
            if (voucher == null || dto.CurrentOrderValue < voucher.MinOrderValue) throw new Exception("Invalid voucher.");
            return new VoucherDto { /* map */ };
        }

        public async Task<List<VoucherDto>> SuggestVouchersAsync(decimal orderValue)
        {
            return await _context.Vouchers.Where(v => v.IsActive && v.ExpiryDate > DateTime.UtcNow && v.MinOrderValue <= orderValue).Select(v => new VoucherDto { /* map */ }).ToListAsync();
        }
    }
}
