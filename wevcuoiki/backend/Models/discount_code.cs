using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("discount_code")]
    public class DiscountCode
    {
        [Key]
        [Column("id_discount_codes")]
        public long IdDiscountCodes { get; set; }

        [Column("code")]
        public string Code { get; set; } = null!;

        [Column("description")]
        public string? Description { get; set; }

        [Column("discount_type")]
        public string DiscountType { get; set; } = null!;

        [Column("discount_value")]
        public decimal DiscountValue { get; set; }

        [Column("min_order_amount")]
        public decimal? MinOrderAmount { get; set; }

        [Column("usage_limit")]
        public int? UsageLimit { get; set; }

        [Column("used_count")]
        public int? UsedCount { get; set; }

        [Column("valid_from")]
        public DateTime? ValidFrom { get; set; }

        [Column("valid_to")]
        public DateTime? ValidTo { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
