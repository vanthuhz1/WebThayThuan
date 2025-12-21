using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("wishlist_item")]
    public class WishlistItem
    {
        [Key]
        [Column("id_wishlist_items")]
        public long IdWishlistItems { get; set; }

        [Column("id_wishlists")]
        public long IdWishlists { get; set; }

        [Column("id_products")]
        public long IdProducts { get; set; }
    }
}
