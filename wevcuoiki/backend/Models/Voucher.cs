using System;

namespace Backend_WebBanHang.Models
{
    public class Voucher
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal MinOrderValue { get; set; }
        public DateTime ExpiryDate { get; set; } 
        public bool IsActive { get; set; } = true;
    }
}
