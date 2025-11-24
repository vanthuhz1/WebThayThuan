namespace Backend_WebBanHang.DTOs.Products
{
    public class ProductListItemDto
    {
        public long IdProducts { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? SalePrice { get; set; }
        public long IdCategories { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}
