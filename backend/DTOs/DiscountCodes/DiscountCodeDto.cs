// DTOs/DiscountCodes/DiscountCodeDto.cs
namespace Backend_WebBanHang.DTOs.DiscountCodes
{
    public class DiscountCodeDto
    {
        public long IdDiscountCodes { get; set; }

        public string Code { get; set; } = null!;
        public string? Description { get; set; }

        // "percent" | "fixed"
        public string DiscountType { get; set; } = null!;

        // Có thể để nullable để khớp với model (decimal?)
        public decimal? DiscountValue { get; set; }

        public decimal? MinOrderAmount { get; set; }

        public int? UsageLimit { get; set; }
        public int? UsedCount { get; set; }

        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }

        public string Status { get; set; } = null!;
    }
}
