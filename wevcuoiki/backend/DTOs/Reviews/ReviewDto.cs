namespace Backend_WebBanHang.DTOs.Reviews
{
    public class ReviewDto
    {
        public int Id { get; set; }
        public int Rating { get; set; }
        public string Content { get; set; }
        public string ImageUrl { get; set; }
        public DateTime CreatedAt { get; set; }
        public string UserName { get; set; } // Để hiển thị tên user
    }
}
