namespace Backend_WebBanHang.DTOs.Categories
{
    public class CategoryTreeDto
    {
        public long Id { get; set; }
        public long? ParentId { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public string? Status { get; set; }
        public string? Img { get; set; }
        public List<CategoryTreeDto> Children { get; set; } = new();
    }
}
