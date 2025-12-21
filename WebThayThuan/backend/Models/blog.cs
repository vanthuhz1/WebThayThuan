using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("blog")]
    public class Blog
    {
        [Key]
        [Column("id_blogs")]
        public long IdBlogs { get; set; }

        [Column("title")]
        public string Title { get; set; } = null!;

        [Column("slug")]
        public string Slug { get; set; } = null!;

        [Column("thumbnail")]
        public string? Thumbnail { get; set; }

        [Column("excerpt")]
        public string? Excerpt { get; set; }

        [Column("content")]
        public string Content { get; set; } = null!;

        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("published_at")]
        public DateTime? PublishedAt { get; set; }

        [Column("status")]
        public string? Status { get; set; }
    }
}
