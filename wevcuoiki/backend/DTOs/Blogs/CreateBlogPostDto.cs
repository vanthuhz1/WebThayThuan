namespace Backend_WebBanHang.DTOs.Blogs
{
    public class CreateBlogPostDto
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public IFormFile Image { get; set; }
        public bool IsAboutUs { get; set; }
    }
}
