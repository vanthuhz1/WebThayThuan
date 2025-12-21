namespace Backend_WebBanHang.DTOs.Navigation
{
    public class NavCategoryDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public List<NavCategoryDto> Children { get; set; } = new();
        public List<NavProductDto> FeaturedProducts { get; set; } = new();
    }
}

