namespace Backend_WebBanHang.DTOs.Categories
{
    public class CategoryTreeDto
    {
        public long IdCategories { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public int? Position { get; set; }
        public string? Status { get; set; }
        public List<CategoryTreeDto> Children { get; set; } = new();
    }
}
