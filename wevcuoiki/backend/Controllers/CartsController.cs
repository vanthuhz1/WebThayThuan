using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Cart;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CartsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Carts
        // Lấy giỏ hàng hiện tại của user
        [HttpGet]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
            {
                var empty = new CartResponse
                {
                    IdCarts = 0,
                    Items = new List<CartItemDto>(),
                    SubTotal = 0,
                    TotalQuantity = 0
                };
                return Ok(empty);
            }

            var itemsQuery =
                from ci in _context.CartItems
                join v in _context.ProductVariants on ci.IdProductVariants equals v.IdProductVariants
                join p in _context.Products on v.IdProducts equals p.IdProducts
                where ci.IdCarts == cart.IdCarts
                select new { ci, v, p };

            var itemsData = await itemsQuery.ToListAsync();

            var itemDtos = new List<CartItemDto>();
            int totalQuantity = 0;
            decimal subTotal = 0;

            foreach (var x in itemsData)
            {
                var unitPrice = x.ci.UnitPrice;
                var totalPrice = unitPrice * x.ci.Quantity;

                totalQuantity += x.ci.Quantity;
                subTotal += totalPrice;

                var thumb = await _context.ProductImages
                    .Where(i => i.IdProducts == x.p.IdProducts && i.IsPrimary == true)
                    .OrderBy(i => i.Position)
                    .Select(i => i.Url)
                    .FirstOrDefaultAsync();

                itemDtos.Add(new CartItemDto
                {
                    IdCartItems = x.ci.IdCartItems,
                    IdProductVariants = x.ci.IdProductVariants,
                    IdProducts = x.p.IdProducts,
                    ProductName = x.p.Name,
                    Size = x.v.Size,
                    Color = x.v.Color,
                    Quantity = x.ci.Quantity,
                    UnitPrice = unitPrice,
                    TotalPrice = totalPrice,
                    ThumbnailUrl = thumb
                });
            }

            var response = new CartResponse
            {
                IdCarts = cart.IdCarts,
                Items = itemDtos,
                TotalQuantity = totalQuantity,
                SubTotal = subTotal
            };

            return Ok(response);
        }

        // POST: api/Carts/items
        // Thêm sản phẩm vào giỏ: FE gửi product + size + color
        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (request.Quantity <= 0)
                return BadRequest("Quantity phải > 0.");

            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
                return Unauthorized("User không tồn tại.");

            // Lấy hoặc tạo giỏ hàng cho user
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
            {
                cart = new Cart
                {
                    IdUsers = userId.Value,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            // Tìm product
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.IdProducts == request.IdProducts);

            if (product == null)
                return BadRequest("Sản phẩm không tồn tại.");

            // Tìm variant theo product + size + color
            var variant = await _context.ProductVariants
                .FirstOrDefaultAsync(v =>
                    v.IdProducts == request.IdProducts &&
                    v.Size == request.Size &&
                    v.Color == request.Color);

            if (variant == null)
                return BadRequest("Màu Đã Hết.");

            // Tồn kho của biến thể
            var availableStock = variant.StockQuantity;

            // Đã có trong giỏ bao nhiêu
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(ci =>
                    ci.IdCarts == cart.IdCarts &&
                    ci.IdProductVariants == variant.IdProductVariants);

            var currentQtyInCart = existingItem?.Quantity ?? 0;
            var totalRequested = currentQtyInCart + request.Quantity;

            if (totalRequested > availableStock)
            {
                return BadRequest($"Không đủ tồn kho. Hiện còn {availableStock}, trong giỏ đã có {currentQtyInCart}.");
            }

            // Tính giá
            decimal unitPrice =
                variant.SalePrice ??
                variant.Price ??
                product.SalePrice ??
                product.Price;

            if (existingItem != null)
            {
                existingItem.Quantity = totalRequested;
                existingItem.UnitPrice = unitPrice;
                cart.UpdatedAt = DateTime.Now;
            }
            else
            {
                var cartItem = new CartItem
                {
                    IdCarts = cart.IdCarts,
                    IdProductVariants = variant.IdProductVariants,
                    Quantity = request.Quantity,
                    UnitPrice = unitPrice
                };
                _context.CartItems.Add(cartItem);
                cart.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return await GetMyCart();
        }


        // PUT: api/Carts/items/5
        // Cập nhật số lượng 1 item
        [HttpPut("items/{cartItemId:long}")]
        public async Task<IActionResult> UpdateItem(long cartItemId, [FromBody] UpdateCartItemRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
                return NotFound("Giỏ hàng không tồn tại.");

            var item = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.IdCartItems == cartItemId && ci.IdCarts == cart.IdCarts);

            if (item == null)
                return NotFound("Sản phẩm trong giỏ không tồn tại.");

            if (request.Quantity <= 0)
            {
                _context.CartItems.Remove(item);
            }
            else
            {
                item.Quantity = request.Quantity;
            }

            cart.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            return await GetMyCart();
        }

        // DELETE: api/Carts/items/5
        [HttpDelete("items/{cartItemId:long}")]
        public async Task<IActionResult> DeleteItem(long cartItemId)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
                return NotFound("Giỏ hàng không tồn tại.");

            var item = await _context.CartItems
                .FirstOrDefaultAsync(ci => ci.IdCartItems == cartItemId && ci.IdCarts == cart.IdCarts);

            if (item == null)
                return NotFound("Sản phẩm trong giỏ không tồn tại.");

            _context.CartItems.Remove(item);
            cart.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return await GetMyCart();
        }

        // DELETE: api/Carts/clear
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
                return NotFound("Giỏ hàng không tồn tại.");

            var items = _context.CartItems.Where(ci => ci.IdCarts == cart.IdCarts);
            _context.CartItems.RemoveRange(items);
            cart.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return await GetMyCart();
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
