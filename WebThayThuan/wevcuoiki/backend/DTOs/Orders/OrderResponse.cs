namespace Backend_WebBanHang.DTOs.Orders
{
    public class OrderResponse
    {
        public long IdOrders { get; set; }
        public string OrderNumber { get; set; } = null!;
        public string? Status { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal? ShippingFee { get; set; }
        public string ShippingAddress { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
    }
}

