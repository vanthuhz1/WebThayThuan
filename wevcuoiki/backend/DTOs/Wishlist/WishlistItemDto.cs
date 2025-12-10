namespace Backend_WebBanHang.DTOs.Wishlist
{
    public class WishlistItemDto
    {
        public long IdWishlistItems { get; set; }
        public long IdProducts { get; set; }
        public string ProductName { get; set; } = null!;
        public decimal Price { get; set; }
        public decimal? SalePrice { get; set; }
        public int StockQuantity { get; set; }
        public string? ThumbnailUrl { get; set; }
        public DateTime? AddedAt { get; set; }
    }
}

