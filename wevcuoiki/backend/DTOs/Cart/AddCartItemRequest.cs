namespace Backend_WebBanHang.DTOs.Cart
{
    public class AddCartItemRequest
    {
        public long IdProducts { get; set; }      // sản phẩm nào
        public string Size { get; set; } = null!; // ví dụ: "M", "L", "XL"
        public string Color { get; set; } = null!; // ví dụ: "Đen", "Trắng"
        public int Quantity { get; set; }
    }
}
