namespace Backend_WebBanHang.DTOs.Orders
{
    public class CreateOrderRequest
    {
        public string ShippingAddress { get; set; } = null!;
        public decimal ShippingFee { get; set; }
        public decimal TotalAmount { get; set; }
        public long? IdDiscountCodes { get; set; }
        public string PaymentMethod { get; set; } = null!; // "cod" or "momo"
        public string? Note { get; set; }
    }
}

