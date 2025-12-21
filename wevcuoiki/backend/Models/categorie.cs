using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend_WebBanHang.Models
{
    [Table("categorie")]
    public class Categorie
    {
        [Key]
        [Column("id_categories")]
        public long IdCategories { get; set; }

        [Column("parent_id_categories")]
        public long? ParentIdCategories { get; set; }

        [Column("name")]
        public string Name { get; set; } = null!;

        [Column("slug")]
        public string Slug { get; set; } = null!;

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        public DateTime? CreatedAt { get; set; }

        [Column("img")]
        public string? img { get; set; }
    }
}
