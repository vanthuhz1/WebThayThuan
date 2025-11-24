using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("order")]
    public class Order
    {
        [Key]
        [Column("id_orders")]
        public long IdOrders { get; set; }

        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("order_number")]
        public string OrderNumber { get; set; } = null!;

        [Column("status")]
        public string? Status { get; set; }

        [Column("total_amount")]
        public decimal TotalAmount { get; set; }

        [Column("shipping_fee")]
        public decimal? ShippingFee { get; set; }

        [Column("payment_method")]
        public string? PaymentMethod { get; set; }

        [Column("shipping_address")]
        public string ShippingAddress { get; set; } = null!;

        [Column("id_discount_codes")]
        public long? IdDiscountCodes { get; set; }

        [Column("discount_amount")]
        public decimal? DiscountAmount { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
