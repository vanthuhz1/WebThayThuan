using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.DTOs.Orders;
using Backend_WebBanHang.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_WebBanHang.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Orders
        // Tạo đơn hàng từ giỏ hàng
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            // Lấy giỏ hàng của user
            var cart = await _context.Carts
                .FirstOrDefaultAsync(c => c.IdUsers == userId.Value);

            if (cart == null)
                return BadRequest("Giỏ hàng của bạn đang trống.");

            // Lấy cart items
            var cartItems = await _context.CartItems
                .Where(ci => ci.IdCarts == cart.IdCarts)
                .ToListAsync();

            if (cartItems == null || cartItems.Count == 0)
                return BadRequest("Giỏ hàng của bạn đang trống.");

            // Tạo order number (format: ORD-YYYYMMDD-HHMMSS-XXXX)
            var orderNumber = $"ORD-{DateTime.Now:yyyyMMdd-HHmmss}-{new Random().Next(1000, 9999)}";

            // Tạo order
            var order = new Order
            {
                IdUsers = userId.Value,
                OrderNumber = orderNumber,
                Status = "pending",
                TotalAmount = request.TotalAmount,
                ShippingFee = request.ShippingFee,
                ShippingAddress = request.ShippingAddress,
                IdDiscountCodes = request.IdDiscountCodes,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // Lưu để lấy IdOrders

            // Tạo order status history record (trạng thái đầu tiên: pending)
            var orderStatusHistory = new OrderStatusHistory
            {
                IdOrders = order.IdOrders,
                OldStatus = null, // Không có trạng thái cũ khi tạo mới
                NewStatus = "pending",
                Note = "Đơn hàng được tạo mới",
                ChangedByUsers = userId.Value,
                CreatedAt = DateTime.Now
            };
            _context.OrderStatusHistories.Add(orderStatusHistory);

            // Tạo order items từ cart items
            foreach (var cartItem in cartItems)
            {
                var orderItem = new OrderItem
                {
                    IdOrders = order.IdOrders,
                    IdProductVariants = cartItem.IdProductVariants,
                    Quantity = cartItem.Quantity,
                    UnitPrice = cartItem.UnitPrice,
                    Discount = 0 // Có thể tính từ discount code sau
                };

                _context.OrderItems.Add(orderItem);
            }

            // Tạo payment record
            var payment = new Payment
            {
                IdOrders = order.IdOrders,
                PaymentGateway = request.PaymentMethod == "cod" ? "cod" : "momo",
                Amount = request.TotalAmount,
                Status = request.PaymentMethod == "cod" ? "pending" : "pending", // COD: pending, MoMo: pending (sẽ update sau khi thanh toán)
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Payments.Add(payment);

            // Xóa cart items sau khi tạo order thành công
            _context.CartItems.RemoveRange(cartItems);
            cart.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            var response = new OrderResponse
            {
                IdOrders = order.IdOrders,
                OrderNumber = order.OrderNumber,
                Status = order.Status,
                TotalAmount = order.TotalAmount,
                ShippingFee = order.ShippingFee,
                ShippingAddress = order.ShippingAddress,
                CreatedAt = order.CreatedAt
            };

            return Ok(response);
        }

        // Helper: Lấy userId từ token
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

