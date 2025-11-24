namespace Backend_WebBanHang.DTOs.Cart
{
    public class CartItemDto
    {
        public long IdCartItems { get; set; }
        public long IdProductVariants { get; set; }
        public long IdProducts { get; set; }

        public string ProductName { get; set; } = null!;
        public string? Size { get; set; }
        public string? Color { get; set; }

        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }

        public string? ThumbnailUrl { get; set; }
    }
}
