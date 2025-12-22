using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Security.Claims;
using System;
using Backend_WebBanHang.Data;
using Backend_WebBanHang.Services;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IMoMoPaymentService _momoService;
        private readonly ILogger<PaymentController> _logger;
        private readonly IConfiguration _configuration;

        public PaymentController(
            AppDbContext context,
            IMoMoPaymentService momoService,
            ILogger<PaymentController> logger,
            IConfiguration configuration)
        {
            _context = context;
            _momoService = momoService;
            _logger = logger;
            _configuration = configuration;
        }

        private long? GetUserIdFromToken()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return userIdClaim != null ? long.Parse(userIdClaim) : null;
        }

        // POST: api/Payment/create-momo-payment
        [Authorize]
        [HttpPost("create-momo-payment")]
        public async Task<IActionResult> CreateMoMoPayment([FromBody] CreateMoMoPaymentRequest request)
        {
            try
            {
                _logger.LogInformation("📥 Creating MoMo payment for order: {OrderId}, Amount: {Amount}",
                    request.OrderId, request.Amount);

                var userId = GetUserIdFromToken();
                if (userId == null)
                    return Unauthorized();

                // Validate amount
                if (request.Amount < 10000)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Số tiền tối thiểu là 10,000 VND"
                    });
                }

                // ✅ URL ĐÚNG - Callback về frontend và backend
                var baseUrl = $"{Request.Scheme}://{Request.Host}";
                
                // Lấy Frontend URL từ config hoặc environment variable
                var frontendUrl = _configuration["MoMo:FrontendUrl"] 
                    ?? Environment.GetEnvironmentVariable("FRONTEND_URL") 
                    ?? "http://localhost:5173";
                
                // redirectUrl: User sẽ được redirect về đây sau khi thanh toán
                var redirectUrl = $"{frontendUrl}/order-success?orderId={request.OrderId}";
                
                // ipnUrl: MoMo sẽ gọi API này để thông báo kết quả (phải là public HTTPS)
                // Trong development: dùng ngrok hoặc để localhost (sẽ không nhận IPN)
                // Có thể override bằng environment variable NGROK_URL hoặc MOMO_IPN_URL
                var ngrokUrl = Environment.GetEnvironmentVariable("NGROK_URL");
                var customIpnUrl = Environment.GetEnvironmentVariable("MOMO_IPN_URL");
                var ipnBaseUrl = !string.IsNullOrEmpty(customIpnUrl) ? customIpnUrl 
                    : (!string.IsNullOrEmpty(ngrokUrl) ? ngrokUrl : baseUrl);
                var ipnUrl = $"{ipnBaseUrl}/api/Payment/momo-callback";

                _logger.LogInformation("🔗 redirectUrl: {RedirectUrl}", redirectUrl);
                _logger.LogInformation("🔗 ipnUrl: {IpnUrl}", ipnUrl);

                // Create MoMo payment
                // ⚠️ orderInfo: CHỈ dùng a-z, 0-9, space (không dấu, không ký tự đặc biệt)
                var orderInfo = string.IsNullOrEmpty(request.OrderInfo) 
                    ? $"Pay for order {request.OrderId}" 
                    : request.OrderInfo;
                
                var result = await _momoService.CreatePaymentRequestAsync(
                    amount: request.Amount,
                    orderId: request.OrderId,
                    orderInfo: orderInfo,
                    redirectUrl: redirectUrl,
                    ipnUrl: ipnUrl
                );

                if (result.Success)
                {
                    _logger.LogInformation("✅ MoMo payment created successfully");
                    _logger.LogInformation("📱 PayUrl: {PayUrl}", result.PayUrl);
                    _logger.LogInformation("📱 QRCodeUrl: {QRCodeUrl}", result.QrCodeUrl);

                    return Ok(new
                    {
                        success = true,
                        data = new
                        {
                            payUrl = result.PayUrl,
                            qrCodeUrl = result.QrCodeUrl,
                            deeplink = result.Deeplink
                        }
                    });
                }
                else
                {
                    _logger.LogError("❌ MoMo payment failed: {Message}", result.Message);
                    return BadRequest(new
                    {
                        success = false,
                        message = "Lỗi tạo payment",
                        error = result.Message,
                        details = result.Details
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Exception in CreateMoMoPayment");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Lỗi hệ thống",
                    error = ex.Message
                });
            }
        }

        // POST: api/Payment/momo-callback
        // IPN - MoMo sẽ gọi endpoint này để thông báo kết quả thanh toán
        [HttpPost("momo-callback")]
        public async Task<IActionResult> MoMoCallback([FromBody] MoMoCallbackRequest request)
        {
            try
            {
                _logger.LogInformation("🔔 === MoMo IPN Callback Received ===");
                _logger.LogInformation("📦 Full payload: {Payload}", System.Text.Json.JsonSerializer.Serialize(request));

                // Verify signature với đầy đủ thông tin
                var isValid = _momoService.VerifySignature(
                    partnerCode: request.PartnerCode,
                    orderId: request.OrderId,
                    requestId: request.RequestId,
                    amount: request.Amount,
                    orderInfo: request.OrderInfo,
                    orderType: request.OrderType,
                    payType: request.PayType,
                    transId: request.TransId,
                    responseTime: request.ResponseTime,
                    resultCode: request.ResultCode,
                    message: request.Message,
                    extraData: request.ExtraData,
                    signature: request.Signature
                );

                if (!isValid)
                {
                    _logger.LogError("❌ Invalid signature from MoMo");
                    return BadRequest(new { message = "Invalid signature" });
                }

                _logger.LogInformation("✅ Signature verified");

                // Extract internal orderId từ extraData (đã lưu khi tạo payment)
                long orderId = 0;
                if (!string.IsNullOrEmpty(request.ExtraData) && long.TryParse(request.ExtraData, out orderId))
                {
                    _logger.LogInformation("📋 Internal OrderId from extraData: {OrderId}", orderId);
                }
                else
                {
                    _logger.LogWarning("⚠️ Cannot parse orderId from extraData: {ExtraData}, MoMo OrderId: {MoMoOrderId}", 
                        request.ExtraData, request.OrderId);
                    // Fallback: thử parse từ MoMo orderId (không khuyến khích)
                    var orderIdStr = request.OrderId.Replace("MM", "").Replace("ORD-", "");
                    if (long.TryParse(orderIdStr, out var fallbackId))
                    {
                        orderId = fallbackId;
                        _logger.LogInformation("📋 Using fallback orderId: {OrderId}", orderId);
                    }
                    else
                    {
                        _logger.LogError("❌ Cannot determine internal orderId");
                        return BadRequest(new { message = "Cannot determine orderId" });
                    }
                }

                // Update payment status
                var payment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.IdOrders == orderId && p.PaymentGateway == "momo");

                if (payment != null)
                {
                    if (request.ResultCode == 0)
                    {
                        payment.Status = "success";
                        payment.PaidAt = DateTime.Now;
                        _logger.LogInformation("💰 Payment {PaymentId} marked as SUCCESS", payment.IdPayments);
                    }
                    else
                    {
                        payment.Status = "failed";
                        _logger.LogWarning("⚠️ Payment {PaymentId} marked as FAILED - resultCode: {ResultCode}",
                            payment.IdPayments, request.ResultCode);
                    }

                    payment.UpdatedAt = DateTime.Now;
                }

                // Update order status
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.IdOrders == orderId);
                if (order != null)
                {
                    if (request.ResultCode == 0)
                    {
                        order.Status = "processing";
                        _logger.LogInformation("📦 Order {OrderId} status updated to PROCESSING", orderId);

                        // Clear cart for successful payment
                        var cart = await _context.Carts.FirstOrDefaultAsync(c => c.IdUsers == order.IdUsers);
                        if (cart != null)
                        {
                            var cartItems = await _context.CartItems
                                .Where(ci => ci.IdCarts == cart.IdCarts)
                                .ToListAsync();
                            _context.CartItems.RemoveRange(cartItems);
                            cart.UpdatedAt = DateTime.Now;
                            _logger.LogInformation("🛒 Cart cleared for user {UserId}", order.IdUsers);
                        }
                    }
                    else
                    {
                        order.Status = "cancelled";
                        _logger.LogInformation("📦 Order {OrderId} status updated to CANCELLED", orderId);
                    }

                    order.UpdatedAt = DateTime.Now;
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation("✅ Database updated successfully");

                // Must return 204 No Content to MoMo
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error processing MoMo callback");
                return StatusCode(500);
            }
        }

        // GET: api/Payment/momo-return
        // User redirect - Browser sẽ redirect về đây sau khi thanh toán
        [HttpGet("momo-return")]
        public IActionResult MoMoReturn(
            [FromQuery] string orderId,
            [FromQuery] int resultCode,
            [FromQuery] string message,
            [FromQuery] string transId)
        {
            _logger.LogInformation("🔄 MoMo Return - orderId: {OrderId}, resultCode: {ResultCode}",
                orderId, resultCode);

            // Redirect to frontend với các params
            var frontendUrl = "http://localhost:5173";
            var redirectUrl = $"{frontendUrl}/order-success?orderId={orderId}&resultCode={resultCode}&message={message}&transId={transId}";

            return Redirect(redirectUrl);
        }

        // POST: api/Payment/manual-complete
        // Xử lý manual khi MoMo không callback được (localhost dev)
        [Authorize]
        [HttpPost("manual-complete")]
        public async Task<IActionResult> ManualCompletePayment([FromBody] ManualCompleteRequest request)
        {
            var userId = GetUserIdFromToken();
            if (userId == null)
                return Unauthorized();

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.IdOrders == request.OrderId && o.IdUsers == userId.Value);

            if (order == null)
                return NotFound("Order not found");

            // Update payment & order
            var payment = await _context.Payments
                .FirstOrDefaultAsync(p => p.IdOrders == request.OrderId && p.PaymentGateway == "momo");

            if (payment != null)
            {
                payment.Status = "success";
                payment.PaidAt = DateTime.Now;
                payment.UpdatedAt = DateTime.Now;
            }

            order.Status = "processing";
            order.UpdatedAt = DateTime.Now;

            // Clear cart
            var cart = await _context.Carts.FirstOrDefaultAsync(c => c.IdUsers == userId.Value);
            if (cart != null)
            {
                var cartItems = await _context.CartItems.Where(ci => ci.IdCarts == cart.IdCarts).ToListAsync();
                _context.CartItems.RemoveRange(cartItems);
                cart.UpdatedAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Order completed" });
        }
    }

    // DTOs
    public class CreateMoMoPaymentRequest
    {
        public long OrderId { get; set; }
        public long Amount { get; set; }
        public string? OrderInfo { get; set; }
    }

    public class MoMoCallbackRequest
    {
        public string PartnerCode { get; set; } = "";
        public string OrderId { get; set; } = "";
        public string RequestId { get; set; } = "";
        public long Amount { get; set; }
        public string OrderInfo { get; set; } = "";
        public string OrderType { get; set; } = "";
        public long TransId { get; set; }
        public int ResultCode { get; set; }
        public string Message { get; set; } = "";
        public string PayType { get; set; } = "";
        public long ResponseTime { get; set; }
        public string ExtraData { get; set; } = "";
        public string Signature { get; set; } = "";
    }

    public class ManualCompleteRequest
    {
        public long OrderId { get; set; }
    }
}
