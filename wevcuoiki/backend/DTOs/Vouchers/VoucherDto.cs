namespace Backend_WebBanHang.DTOs.Vouchers
{
    public class VoucherDto
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal MinOrderValue { get; set; }
        public DateTime ExpiryDate { get; set; }
    }
}
