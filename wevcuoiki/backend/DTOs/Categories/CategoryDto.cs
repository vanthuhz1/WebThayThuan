namespace Backend_WebBanHang.DTOs.Categories
{
    public class CategoryDto
    {
        public long IdCategories { get; set; }
        public long? ParentIdCategories { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        
        public string? Status { get; set; }
        public string? CategoryImage { get; set; }
    }
}
