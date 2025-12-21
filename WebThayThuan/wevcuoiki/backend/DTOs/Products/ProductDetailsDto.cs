namespace Backend_WebBanHang.DTOs.Products
{
    public class ProductDetailsDto
    {
        public long IdProducts { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? ShortDescription { get; set; }
        public string? Description { get; set; }
        public string Sku { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? SalePrice { get; set; }
        public int StockQuantity { get; set; }
        public string? Status { get; set; }
        public long IdCategories { get; set; }
        public string? CategoryName { get; set; }
        public double? AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public int SoldQuantity { get; set; }
        public List<ProductImageDto> Images { get; set; } = new();
        public List<ProductVariantDto> Variants { get; set; } = new();
    }

    public class ProductImageDto
    {
        public long IdProductImages { get; set; }
        public string Url { get; set; } = null!;
        public bool? IsPrimary { get; set; }
        public int? Position { get; set; }
    }

    public class ProductVariantDto
    {
        public long IdProductVariants { get; set; }
        public string Sku { get; set; } = null!;
        public string? Size { get; set; }
        public string? Color { get; set; }
        public int StockQuantity { get; set; }
        public decimal? Price { get; set; }
        public decimal? SalePrice { get; set; }
        public string? Status { get; set; }
    }
}

