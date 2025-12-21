using System.Collections.Generic;

namespace Backend_WebBanHang.DTOs.Cart
{
    public class CartResponse
    {
        public long IdCarts { get; set; }
        public List<CartItemDto> Items { get; set; } = new();
        public int TotalQuantity { get; set; }
        public decimal SubTotal { get; set; }
    }
}
