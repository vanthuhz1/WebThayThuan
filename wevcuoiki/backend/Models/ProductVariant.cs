using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("product_variant")]
    public class ProductVariant
    {
        [Key]
        [Column("id_product_variants")]
        public long IdProductVariants { get; set; }

        [Column("id_products")]
        public long IdProducts { get; set; }

        [Column("sku")]
        public string Sku { get; set; } = null!;

        [Column("size")]
        public string? Size { get; set; }

        [Column("color")]
        public string? Color { get; set; }

        [Column("stock_quantity")]
        public int StockQuantity { get; set; }

        [Column("price")]
        public decimal? Price { get; set; }

        [Column("sale_price")]
        public decimal? SalePrice { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
