using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("product_review")]
    public class ProductReview
    {
        [Key]
        [Column("id_product_reviews")]
        public long IdProductReviews { get; set; }

        [Column("id_products")]
        public long IdProducts { get; set; }

        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("rating")]
        public byte Rating { get; set; }

        [Column("review")]
        public string? Review { get; set; }

        [Column("images")]
        public string? Images { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
