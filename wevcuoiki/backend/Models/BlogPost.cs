using System;

namespace Backend_WebBanHang.Models
{
    public class BlogPost
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Slug { get; set; }
        public string ImageUrl { get; set; }
        public DateTime PublishedAt { get; set; }
        public bool IsAboutUs { get; set; } = false;
    }
}
