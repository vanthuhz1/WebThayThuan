using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("cart")]
    public class Cart
    {
        [Key]
        [Column("id_carts")]
        public long IdCarts { get; set; }

        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
