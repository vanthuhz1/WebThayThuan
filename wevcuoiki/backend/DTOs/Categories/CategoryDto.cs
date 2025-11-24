namespace Backend_WebBanHang.DTOs.Categories
{
    public class CategoryDto
    {
        public long IdCategories { get; set; }
        public long? ParentIdCategories { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Description { get; set; }
        public int? Position { get; set; }
        public string? Status { get; set; }
    }
}
