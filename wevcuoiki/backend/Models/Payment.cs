using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("payment")]
    public class Payment
    {
        [Key]
        [Column("id_payments")]
        public long IdPayments { get; set; }

        [Column("id_orders")]
        public long IdOrders { get; set; }

        [Column("payment_gateway")]
        public string PaymentGateway { get; set; } = null!;

        [Column("amount")]
        public decimal Amount { get; set; }

        [Column("transaction_code")]
        public string? TransactionCode { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("paid_at")]
        public DateTime? PaidAt { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }

        [Column("raw_response")]
        public string? RawResponse { get; set; }
    }
}

