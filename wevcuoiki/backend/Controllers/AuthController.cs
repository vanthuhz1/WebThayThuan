using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Auth;
using Backend_WebBanHang.Models;
using Backend_WebBanHang.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IJwtTokenService _jwtTokenService;

        public AuthController(AppDbContext context, IJwtTokenService jwtTokenService)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
        }

        // ĐĂNG KÝ
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var exists = await _context.Users.AnyAsync(x => x.Email == request.Email);
            if (exists)
                return BadRequest("Email đã tồn tại");

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = HashPassword(request.Password),
                Phone = request.Phone,
                Role = "customer",
                Status = "active",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = _jwtTokenService.GenerateToken(user);

            var response = new AuthResponse
            {
                IdUsers = user.IdUsers,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Token = token
            };

            return Ok(response);
        }

        // ĐĂNG NHẬP
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == request.Email);

            if (user == null)
                return Unauthorized("Sai email hoặc mật khẩu");

            var hashed = HashPassword(request.Password);
            if (!string.Equals(user.PasswordHash, hashed, StringComparison.OrdinalIgnoreCase))
                return Unauthorized("Sai email hoặc mật khẩu");

            var token = _jwtTokenService.GenerateToken(user);

            var response = new AuthResponse
            {
                IdUsers = user.IdUsers,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Token = token
            };

            return Ok(response);
        }

        // LẤY THÔNG TIN USER HIỆN TẠI (DỰA TRÊN TOKEN)
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token");

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
                return Unauthorized("User không tồn tại");

            var response = new AuthResponse
            {
                IdUsers = user.IdUsers,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                // tùy, có thể tạo token mới hoặc không
                Token = _jwtTokenService.GenerateToken(user)
            };

            return Ok(response);
        }

        // ĐỔI MẬT KHẨU
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token");

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
                return Unauthorized("User không tồn tại");

            // Kiểm tra mật khẩu cũ
            var currentHash = HashPassword(request.CurrentPassword);
            if (!string.Equals(user.PasswordHash, currentHash, StringComparison.OrdinalIgnoreCase))
                return BadRequest("Mật khẩu hiện tại không đúng");

            // Cập nhật mật khẩu mới
            user.PasswordHash = HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok("Đổi mật khẩu thành công");
        }

        // HÀM HASH PASSWORD
        private static string HashPassword(string password)
        {
            using var sha = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(password);
            var hash = sha.ComputeHash(bytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
        }

        // LẤY userId TỪ TOKEN
        private long? GetUserIdFromToken()
        {
            // Ưu tiên claim NameIdentifier, fallback sang "sub"
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (claim == null) return null;

            if (long.TryParse(claim.Value, out var id))
                return id;

            return null;
        }
    }
}
