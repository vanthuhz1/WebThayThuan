using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("product")]
    public class Product
    {
        [Key]
        [Column("id_products")]
        public long IdProducts { get; set; }

        [Column("id_categories")]
        public long IdCategories { get; set; }

        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("slug")]
        public string Slug { get; set; } = null!;

        [Column("short_description")]
        public string? ShortDescription { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("sku")]
        public string Sku { get; set; } = null!;

        [Column("price")]
        public decimal Price { get; set; }

        [Column("sale_price")]
        public decimal? SalePrice { get; set; }

        [Column("stock_quantity")]
        public int StockQuantity { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
