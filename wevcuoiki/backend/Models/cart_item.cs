using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("cart_item")]
    public class CartItem
    {
        [Key]
        [Column("id_cart_items")]
        public long IdCartItems { get; set; }

        [Column("id_carts")]
        public long IdCarts { get; set; }

        [Column("id_product_variants")]
        public long IdProductVariants { get; set; }

        [Column("quantity")]
        public int Quantity { get; set; }

        [Column("unit_price")]
        public decimal UnitPrice { get; set; }
    }
}
