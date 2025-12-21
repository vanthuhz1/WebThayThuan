using Backend_WebBanHang.Models;

namespace Backend_WebBanHang.Services
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
    }
}
