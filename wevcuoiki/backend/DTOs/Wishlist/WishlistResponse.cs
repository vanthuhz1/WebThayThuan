namespace Backend_WebBanHang.DTOs.Wishlist
{
    public class WishlistResponse
    {
        public long IdWishlists { get; set; }
        public List<WishlistItemDto> Items { get; set; } = new List<WishlistItemDto>();
        public int TotalItems { get; set; }
    }
}

