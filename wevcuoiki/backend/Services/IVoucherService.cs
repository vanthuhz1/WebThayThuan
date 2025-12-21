using Backend_WebBanHang.DTOs.Vouchers;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend_WebBanHang.Services
{
    public interface IVoucherService
    {
        Task<List<VoucherDto>> GetActiveVouchersAsync();
        Task<VoucherDto> ApplyVoucherAsync(ApplyVoucherDto dto);
        Task<List<VoucherDto>> SuggestVouchersAsync(decimal orderValue);
    }
}
