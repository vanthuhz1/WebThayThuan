namespace Backend_WebBanHang.DTOs.Blogs
{
    public class BlogPostDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Slug { get; set; }
        public string ImageUrl { get; set; }
        public DateTime PublishedAt { get; set; }
    }
}
