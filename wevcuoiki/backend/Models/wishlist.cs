using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("wishlist")]
    public class Wishlist
    {
        [Key]
        [Column("id_wishlists")]
        public long IdWishlists { get; set; }

        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }
    }
}
