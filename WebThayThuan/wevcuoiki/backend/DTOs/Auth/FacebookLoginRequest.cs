namespace Backend_WebBanHang.DTOs.Auth
{
    public class FacebookLoginRequest
    {
        public string AccessToken { get; set; } = null!;
        public string UserId { get; set; } = null!;
    }
}

