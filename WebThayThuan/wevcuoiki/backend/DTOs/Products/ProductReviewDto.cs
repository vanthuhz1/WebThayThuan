namespace Backend_WebBanHang.DTOs.Products
{
    public class ProductReviewDto
    {
        public long IdProductReviews { get; set; }
        public long IdProducts { get; set; }
        public long IdUsers { get; set; }
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public byte Rating { get; set; }
        public string? Review { get; set; }
       
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}

