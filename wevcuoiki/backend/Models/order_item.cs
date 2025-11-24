using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("order_item")]
    public class OrderItem
    {
        [Key]
        [Column("id_order_items")]
        public long IdOrderItems { get; set; }

        [Column("id_orders")]
        public long IdOrders { get; set; }

        [Column("id_product_variants")]
        public long IdProductVariants { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("unit_price")]
        public decimal UnitPrice { get; set; }

        [Column("discount")]
        public decimal? Discount { get; set; }
    }
}
