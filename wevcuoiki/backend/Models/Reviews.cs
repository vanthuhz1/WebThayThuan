using System;
using System.ComponentModel.DataAnnotations;

namespace Backend_WebBanHang.Models
{
    public class Reviews
    {
        [Key]
        public int Id { get; set; }
        public int ProductId { get; set; } // Liên kết với Product
        public string UserId { get; set; } // Liên kết với User (giả sử dùng ASP.NET Identity)
        public int Rating { get; set; } // Sao (1-5)
        public string Content { get; set; } // Nội dung đánh giá
        public string ImageUrl { get; set; } // Ảnh đính kèm (lưu URL sau khi upload)
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public virtual Product Product { get; set; } // Navigation property
    }
}
