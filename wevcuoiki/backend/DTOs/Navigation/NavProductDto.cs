namespace Backend_WebBanHang.DTOs.Navigation
{
    public class NavProductDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = null!;
        public string Slug { get; set; } = null!;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
    }
}

