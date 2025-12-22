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
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(AppDbContext context, ILogger<OrdersController> logger)
        {
            _context = context;
            _logger = logger;
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

            // Log để kiểm tra dữ liệu địa chỉ
            _logger.LogInformation("=== CREATE ORDER REQUEST ===");
            _logger.LogInformation("ShippingAddress: {ShippingAddress}", request.ShippingAddress);
            _logger.LogInformation("TotalAmount: {TotalAmount}", request.TotalAmount);
            _logger.LogInformation("ShippingFee: {ShippingFee}", request.ShippingFee);
            _logger.LogInformation("PaymentMethod: {PaymentMethod}", request.PaymentMethod);

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
                ShippingAddress = request.ShippingAddress ?? "",
                IdDiscountCodes = request.IdDiscountCodes,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _logger.LogInformation("=== ORDER CREATED ===");
            _logger.LogInformation("OrderId: {OrderId}, ShippingAddress: {ShippingAddress}", 
                order.IdOrders, order.ShippingAddress);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // Lưu để lấy IdOrders
            
            _logger.LogInformation("Order saved with IdOrders: {IdOrders}", order.IdOrders);

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

            // Chỉ xóa cart items nếu là COD (thanh toán ngay)
            // Với MoMo, sẽ xóa sau khi thanh toán thành công (trong callback)
            if (request.PaymentMethod == "cod")
            {
                _context.CartItems.RemoveRange(cartItems);
                cart.UpdatedAt = DateTime.Now;
            }

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

        // GET: api/Orders
        // Lấy danh sách đơn hàng của user
        [HttpGet]
        public async Task<IActionResult> GetMyOrders([FromQuery] string? status = null)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized("Không đọc được user từ token.");

            var ordersQuery = _context.Orders
                .Where(o => o.IdUsers == userId.Value)
                .OrderByDescending(o => o.CreatedAt);

            // Filter theo status nếu có
            if (!string.IsNullOrEmpty(status) && status.ToLower() != "all")
            {
                ordersQuery = (IOrderedQueryable<Order>)ordersQuery.Where(o => o.Status == status);
            }

            var orders = await ordersQuery.ToListAsync();

            var orderDtos = new List<OrderListDto>();

            foreach (var order in orders)
            {
                // Lấy order items với thông tin sản phẩm
                var itemsQuery = from oi in _context.OrderItems
                                 join v in _context.ProductVariants on oi.IdProductVariants equals v.IdProductVariants
                                 join p in _context.Products on v.IdProducts equals p.IdProducts
                                 where oi.IdOrders == order.IdOrders
                                 select new { oi, v, p };

                var itemsData = await itemsQuery.ToListAsync();

                var itemDtos = new List<OrderItemDto>();

                foreach (var x in itemsData)
                {
                    // Lấy thumbnail
                    var thumb = await _context.ProductImages
                        .Where(i => i.IdProducts == x.p.IdProducts && i.IsPrimary == true)
                        .OrderBy(i => i.Position)
                        .Select(i => i.Url)
                        .FirstOrDefaultAsync();

                    itemDtos.Add(new OrderItemDto
                    {
                        IdOrderItems = x.oi.IdOrderItems,
                        IdProducts = x.p.IdProducts,
                        ProductName = x.p.Name,
                        Color = x.v.Color,
                        Size = x.v.Size,
                        Quantity = x.oi.Quantity,
                        UnitPrice = x.oi.UnitPrice,
                        Discount = x.oi.Discount,
                        ThumbnailUrl = thumb
                    });
                }

                orderDtos.Add(new OrderListDto
                {
                    IdOrders = order.IdOrders,
                    OrderNumber = order.OrderNumber,
                    Status = order.Status,
                    TotalAmount = order.TotalAmount,
                    ShippingFee = order.ShippingFee,
                    ShippingAddress = order.ShippingAddress,
                    CreatedAt = order.CreatedAt,
                    Items = itemDtos
                });
            }

            return Ok(orderDtos);
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

