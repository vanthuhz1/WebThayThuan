namespace Backend_WebBanHang.DTOs.Orders
{
    public class OrderItemDto
    {
        public long IdOrderItems { get; set; }
        public long IdProducts { get; set; }
        public string ProductName { get; set; } = null!;
        public string? Color { get; set; }
        public string? Size { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal? Discount { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}

