namespace Backend_WebBanHang.DTOs.Reviews
{
    public class CreateReviewDto
    {
        public int ProductId { get; set; }
        public int Rating { get; set; }
        public string Content { get; set; }
        public IFormFile Image { get; set; } // Để upload ảnh
    }
}
