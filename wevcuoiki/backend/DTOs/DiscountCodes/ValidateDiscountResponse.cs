// DTOs/DiscountCodes/ValidateDiscountResponse.cs
namespace Backend_WebBanHang.DTOs.DiscountCodes
{
    public class ValidateDiscountResponse
    {
        public string Code { get; set; } = null!;
        public bool IsValid { get; set; }
        public string Message { get; set; } = null!;

        public string? DiscountType { get; set; }
        public decimal? DiscountValue { get; set; }

        public decimal? DiscountAmount { get; set; }
        public decimal? FinalAmount { get; set; }
    }
}
