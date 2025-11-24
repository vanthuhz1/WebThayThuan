using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("product_image")]
    public class ProductImage
    {
        [Key]
        [Column("id_product_images")]
        public long IdProductImages { get; set; }

        [Column("id_products")]
        public long IdProducts { get; set; }

        [Column("url")]
        public string Url { get; set; } = null!;

        [Column("is_primary")]
        public bool? IsPrimary { get; set; }

        [Column("position")]
        public int? Position { get; set; }
    }
}
