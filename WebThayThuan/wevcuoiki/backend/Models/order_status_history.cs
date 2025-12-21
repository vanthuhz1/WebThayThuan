using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("order_status_history")]
    public class OrderStatusHistory
    {
        [Key]
        [Column("id_order_status_histories")]
        public long IdOrderStatusHistories { get; set; }

        [Column("id_orders")]
        public long IdOrders { get; set; }

        [Column("old_status")]
        public string? OldStatus { get; set; }

        [Column("new_status")]
        public string NewStatus { get; set; } = null!;

        [Column("note")]
        public string? Note { get; set; }

        [Column("changed_by_users")]
        public long? ChangedByUsers { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}

