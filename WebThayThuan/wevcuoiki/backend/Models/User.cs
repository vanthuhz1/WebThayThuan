using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("user")]
    public class User
    {
        [Key]
        [Column("id_users")]
        public long IdUsers { get; set; }

        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Column("email")]
        public string Email { get; set; } = null!;

        [Column("password_hash")]
        public string PasswordHash { get; set; } = null!;

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("role")]
        public string Role { get; set; } = null!;

        [Column("status")]
        public string Status { get; set; } = null!;

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
    }
}
