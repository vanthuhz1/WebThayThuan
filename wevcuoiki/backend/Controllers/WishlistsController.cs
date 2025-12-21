using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Wishlist;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class WishlistsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WishlistsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Wishlists
        // Lấy wishlist hiện tại của user (tự động tạo nếu chưa có)
        [HttpGet]
        public async Task<IActionResult> GetMyWishlist()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            // Tự động tạo wishlist nếu chưa có
            if (wishlist == null)
            {
                wishlist = new Wishlist
                {
                    IdUsers = userId.Value,
                    CreatedAt = DateTime.Now
                };
                _context.Wishlists.Add(wishlist);
                await _context.SaveChangesAsync();

                // Trả về wishlist rỗng mới tạo
                return Ok(new WishlistResponse
                {
                    IdWishlists = wishlist.IdWishlists,
                    Items = new List<WishlistItemDto>(),
                    TotalItems = 0
                });
            }

            var itemsQuery =
                from wi in _context.WishlistItems
                join p in _context.Products on wi.IdProducts equals p.IdProducts
                where wi.IdWishlists == wishlist.IdWishlists
                select new { wi, p };

            var itemsData = await itemsQuery.ToListAsync();

            var itemDtos = new List<WishlistItemDto>();

            foreach (var x in itemsData)
            {
                // Tính stock quantity từ variants
                var totalStock = await _context.ProductVariants
                    .Where(v => v.IdProducts == x.p.IdProducts)
                    .SumAsync(v => (int?)v.StockQuantity) ?? 0;

                var thumb = await _context.ProductImages
                    .Where(i => i.IdProducts == x.p.IdProducts && i.IsPrimary == true)
                    .OrderBy(i => i.Position)
                    .Select(i => i.Url)
                    .FirstOrDefaultAsync();

                itemDtos.Add(new WishlistItemDto
                {
                    IdWishlistItems = x.wi.IdWishlistItems,
                    IdProducts = x.p.IdProducts,
                    ProductName = x.p.Name,
                    Price = x.p.Price,
                    SalePrice = x.p.SalePrice,
                    StockQuantity = totalStock,
                    ThumbnailUrl = thumb
                });
            }

            var response = new WishlistResponse
            {
                IdWishlists = wishlist.IdWishlists,
                Items = itemDtos,
                TotalItems = itemDtos.Count
            };

            return Ok(response);
        }

        // POST: api/Wishlists/items
        // Thêm sản phẩm vào wishlist
        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddWishlistItemRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            // Lấy hoặc tạo wishlist cho user
            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            if (wishlist == null)
            {
                wishlist = new Wishlist
                {
                    IdUsers = userId.Value,
                    CreatedAt = DateTime.Now
                };
                _context.Wishlists.Add(wishlist);
                await _context.SaveChangesAsync();
            }

            // Tìm product
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.IdProducts == request.IdProducts);

            if (product == null)
                return BadRequest("Sản phẩm không tồn tại.");

            // Kiểm tra xem đã có trong wishlist chưa
            var existingItem = await _context.WishlistItems
                .FirstOrDefaultAsync(wi =>
                    wi.IdWishlists == wishlist.IdWishlists &&
                    wi.IdProducts == request.IdProducts);

            if (existingItem != null)
            {
                return BadRequest("Sản phẩm đã có trong danh sách yêu thích.");
            }

            // Thêm vào wishlist
            var wishlistItem = new WishlistItem
            {
                IdWishlists = wishlist.IdWishlists,
                IdProducts = request.IdProducts
            };
            _context.WishlistItems.Add(wishlistItem);
            await _context.SaveChangesAsync();

            return await GetMyWishlist();
        }

        // DELETE: api/Wishlists/items/{wishlistItemId}
        [HttpDelete("items/{wishlistItemId:long}")]
        public async Task<IActionResult> DeleteItem(long wishlistItemId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            if (wishlist == null)
                return NotFound("Wishlist không tồn tại.");

            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(wi => wi.IdWishlistItems == wishlistItemId && wi.IdWishlists == wishlist.IdWishlists);

            if (item == null)
                return NotFound("Sản phẩm trong wishlist không tồn tại.");

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();
            return await GetMyWishlist();
        }

        // DELETE: api/Wishlists/products/{productId}
        // Xóa sản phẩm khỏi wishlist theo product ID
        [HttpDelete("products/{productId:long}")]
        public async Task<IActionResult> DeleteByProductId(long productId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            if (wishlist == null)
                return NotFound("Wishlist không tồn tại.");

            var item = await _context.WishlistItems
                .FirstOrDefaultAsync(wi => wi.IdProducts == productId && wi.IdWishlists == wishlist.IdWishlists);

            if (item == null)
                return NotFound("Sản phẩm không có trong wishlist.");

            _context.WishlistItems.Remove(item);
            await _context.SaveChangesAsync();
            return await GetMyWishlist();
        }

        // DELETE: api/Wishlists/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            if (wishlist == null)
                return NotFound("Wishlist không tồn tại.");

            var items = _context.WishlistItems.Where(wi => wi.IdWishlists == wishlist.IdWishlists);
            _context.WishlistItems.RemoveRange(items);

            await _context.SaveChangesAsync();
            return await GetMyWishlist();
        }

        // GET: api/Wishlists/check/{productId}
        // Kiểm tra sản phẩm có trong wishlist không
        [HttpGet("check/{productId:long}")]
        public async Task<IActionResult> CheckProduct(long productId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Ok(new { isInWishlist = false });

            var wishlist = await _context.Wishlists
                .FirstOrDefaultAsync(w => w.IdUsers == userId.Value);

            if (wishlist == null)
                return Ok(new { isInWishlist = false });

            var exists = await _context.WishlistItems
                .AnyAsync(wi => wi.IdWishlists == wishlist.IdWishlists && wi.IdProducts == productId);

            return Ok(new { isInWishlist = exists });
        }

        private long? GetUserIdFromToken()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)
                        ?? User.FindFirst(JwtRegisteredClaimNames.Sub);

            if (claim == null) return null;
            if (long.TryParse(claim.Value, out var id))
                return id;

            return null;
        }
    }
}

