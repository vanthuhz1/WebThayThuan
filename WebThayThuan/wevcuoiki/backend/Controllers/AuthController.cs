using System.Security.Cryptography;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;
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
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IJwtTokenService jwtTokenService, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _jwtTokenService = jwtTokenService;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
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

        // ĐĂNG NHẬP VỚI GOOGLE
        [HttpPost("login-google")]
        public async Task<IActionResult> LoginWithGoogle([FromBody] GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Credential))
                return BadRequest("Credential không được để trống");

            try
            {
                // Verify Google token và lấy thông tin user
                var httpClient = _httpClientFactory.CreateClient();
                var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={request.Credential}");
                
                if (!response.IsSuccessStatusCode)
                    return Unauthorized("Token Google không hợp lệ");

                var content = await response.Content.ReadAsStringAsync();
                var googleUser = JsonSerializer.Deserialize<JsonElement>(content);

                var email = googleUser.GetProperty("email").GetString();
                var name = googleUser.GetProperty("name").GetString();
                var googleId = googleUser.GetProperty("sub").GetString();

                if (string.IsNullOrWhiteSpace(email))
                    return BadRequest("Không thể lấy email từ Google");

                // Tìm hoặc tạo user
                var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
                
                if (user == null)
                {
                    // Tạo user mới
                    user = new User
                    {
                        FullName = name ?? email.Split('@')[0],
                        Email = email,
                        PasswordHash = HashPassword($"google_{googleId}"), // Password hash đặc biệt cho OAuth
                        Role = "customer",
                        Status = "active",
                        CreatedAt = DateTime.Now
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                var token = _jwtTokenService.GenerateToken(user);

                var authResponse = new AuthResponse
                {
                    IdUsers = user.IdUsers,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token
                };

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                return BadRequest($"Lỗi xử lý đăng nhập Google: {ex.Message}");
            }
        }

        // ĐĂNG NHẬP VỚI FACEBOOK
        [HttpPost("login-facebook")]
        public async Task<IActionResult> LoginWithFacebook([FromBody] FacebookLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.UserId))
                return BadRequest("AccessToken và UserId không được để trống");

            try
            {
                // Verify Facebook token và lấy thông tin user
                var httpClient = _httpClientFactory.CreateClient();
                var appId = _configuration["Facebook:AppId"];
                var appSecret = _configuration["Facebook:AppSecret"];
                
                // Verify token
                var verifyResponse = await httpClient.GetAsync(
                    $"https://graph.facebook.com/debug_token?input_token={request.AccessToken}&access_token={appId}|{appSecret}");
                
                if (!verifyResponse.IsSuccessStatusCode)
                    return Unauthorized("Token Facebook không hợp lệ");

                // Lấy thông tin user
                var userInfoResponse = await httpClient.GetAsync(
                    $"https://graph.facebook.com/v18.0/{request.UserId}?fields=id,name,email&access_token={request.AccessToken}");
                
                if (!userInfoResponse.IsSuccessStatusCode)
                    return Unauthorized("Không thể lấy thông tin từ Facebook");

                var content = await userInfoResponse.Content.ReadAsStringAsync();
                var facebookUser = JsonSerializer.Deserialize<JsonElement>(content);

                var email = facebookUser.TryGetProperty("email", out var emailProp) 
                    ? emailProp.GetString() 
                    : $"{request.UserId}@facebook.com";
                var name = facebookUser.TryGetProperty("name", out var nameProp) 
                    ? nameProp.GetString() 
                    : "Facebook User";
                var facebookId = facebookUser.GetProperty("id").GetString();

                if (string.IsNullOrWhiteSpace(email))
                    email = $"{facebookId}@facebook.com";

                // Tìm hoặc tạo user
                var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);
                
                if (user == null)
                {
                    // Tạo user mới
                    user = new User
                    {
                        FullName = name ?? email.Split('@')[0],
                        Email = email,
                        PasswordHash = HashPassword($"facebook_{facebookId}"), // Password hash đặc biệt cho OAuth
                        Role = "customer",
                        Status = "active",
                        CreatedAt = DateTime.Now
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }

                var token = _jwtTokenService.GenerateToken(user);

                var authResponse = new AuthResponse
                {
                    IdUsers = user.IdUsers,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token
                };

                return Ok(authResponse);
            }
            catch (Exception ex)
            {
                return BadRequest($"Lỗi xử lý đăng nhập Facebook: {ex.Message}");
            }
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
