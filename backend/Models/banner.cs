using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("banner")]
    public class Banner
    {
        [Key]
        [Column("id_banners")]
        public long IdBanners { get; set; }

        [Column("image_url")]
        [Required]
        [MaxLength(1000)]
        public string ImageUrl { get; set; } = null!;

        [Column("link_url")]
        [MaxLength(1000)]
        public string? LinkUrl { get; set; }
    }
}

