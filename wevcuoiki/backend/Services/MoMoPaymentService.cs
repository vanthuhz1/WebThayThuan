using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Backend_WebBanHang.Services
{
    public class MoMoPaymentService : IMoMoPaymentService
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<MoMoPaymentService> _logger;

        public MoMoPaymentService(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            ILogger<MoMoPaymentService> logger)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<MoMoPaymentResult> CreatePaymentRequestAsync(
            long amount,
            long orderId,
            string orderInfo,
            string redirectUrl,
            string ipnUrl)
        {
            try
            {
                _logger.LogInformation("=== MoMo Payment Request START ===");
                _logger.LogInformation("Internal OrderId: {OrderId}, Amount: {Amount}", orderId, amount);

                // Get config from appsettings.json
                var partnerCode = _configuration["MoMo:PartnerCode"] ?? "MOMO";
                var accessKey = _configuration["MoMo:AccessKey"] ?? "F8BBA842ECF85";
                var secretKey = _configuration["MoMo:SecretKey"] ?? "K951B6PE1waDMi640xX08PD3vg6EkVlz";
                var endpoint = _configuration["MoMo:Endpoint"] ?? "https://test-payment.momo.vn/v2/gateway/api/create";
                var requestType = _configuration["MoMo:RequestType"] ?? "captureWallet";

                // Validation
                if (amount < 10000)
                {
                    return new MoMoPaymentResult
                    {
                        Success = false,
                        Message = "Amount must be >= 10,000 VND"
                    };
                }

                // Generate unique IDs
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                var random = new Random().Next(1000, 9999);
                var momoOrderId = $"MM{timestamp}{random}";
                var requestId = momoOrderId;
                var amountStr = amount.ToString();
                var extraData = "";

                _logger.LogInformation("MoMo OrderId: {MomoOrderId}", momoOrderId);
                _logger.LogInformation("RequestId: {RequestId}", requestId);

                // Create raw signature (ALPHABET ORDER for API v2)
                // accessKey -> amount -> extraData -> ipnUrl -> orderId -> orderInfo -> partnerCode -> redirectUrl -> requestId -> requestType
                var rawSignature = $"accessKey={accessKey}&amount={amountStr}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={momoOrderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}";

                _logger.LogInformation("=== RAW SIGNATURE ===");
                _logger.LogInformation(rawSignature);

                // Compute HMAC SHA256 signature
                var signature = ComputeHmacSha256(rawSignature, secretKey);

                _logger.LogInformation("=== SIGNATURE ===");
                _logger.LogInformation(signature);

                // Request body for API v2
                var requestBody = new
                {
                    partnerCode = partnerCode,
                    partnerName = "Test",
                    storeId = "MomoTestStore",
                    requestId = requestId,
                    amount = amountStr,
                    orderId = momoOrderId,
                    orderInfo = orderInfo,
                    redirectUrl = redirectUrl,
                    ipnUrl = ipnUrl,
                    lang = "vi",
                    extraData = extraData,
                    requestType = requestType,
                    signature = signature
                };

                var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions { WriteIndented = true });
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _logger.LogInformation("=== REQUEST TO MOMO ===");
                _logger.LogInformation("Endpoint: {Endpoint}", endpoint);
                _logger.LogInformation("Body: {Json}", json);

                // Call MoMo API
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var response = await httpClient.PostAsync(endpoint, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                _logger.LogInformation("=== RESPONSE FROM MOMO ===");
                _logger.LogInformation("HTTP Status: {StatusCode}", (int)response.StatusCode);
                _logger.LogInformation("Body: {ResponseContent}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    return new MoMoPaymentResult
                    {
                        Success = false,
                        Message = $"HTTP {response.StatusCode}",
                        Details = responseContent
                    };
                }

                var result = JsonSerializer.Deserialize<JsonElement>(responseContent);

                // Check resultCode
                if (result.TryGetProperty("resultCode", out var resultCode))
                {
                    var resultCodeInt = resultCode.GetInt32();
                    var message = result.TryGetProperty("message", out var msg) ? msg.GetString() : "Unknown";

                    _logger.LogInformation("ResultCode: {ResultCode}, Message: {Message}", resultCodeInt, message);

                    if (resultCodeInt == 0) // Success
                    {
                        var payUrl = result.TryGetProperty("payUrl", out var pUrl) ? pUrl.GetString() : "";
                        var qrCodeUrl = result.TryGetProperty("qrCodeUrl", out var qUrl) ? qUrl.GetString() : "";
                        var deeplink = result.TryGetProperty("deeplink", out var dl) ? dl.GetString() : "";

                        _logger.LogInformation("✅ SUCCESS - PayUrl: {PayUrl}", payUrl);

                        return new MoMoPaymentResult
                        {
                            Success = true,
                            Message = message ?? "Success",
                            PayUrl = payUrl ?? "",
                            QrCodeUrl = qrCodeUrl ?? "",
                            Deeplink = deeplink ?? ""
                        };
                    }
                    else
                    {
                        // Log sub errors if exists
                        var subErrors = result.TryGetProperty("subErrors", out var se) ? se.ToString() : null;
                        _logger.LogError("❌ FAILED - ResultCode: {ResultCode}, SubErrors: {SubErrors}", resultCodeInt, subErrors);

                        return new MoMoPaymentResult
                        {
                            Success = false,
                            Message = $"MoMo error (code {resultCodeInt}): {message}",
                            Details = subErrors
                        };
                    }
                }

                return new MoMoPaymentResult
                {
                    Success = false,
                    Message = "Invalid MoMo response format",
                    Details = responseContent
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Exception in CreatePaymentRequestAsync");
                return new MoMoPaymentResult
                {
                    Success = false,
                    Message = ex.Message
                };
            }
        }

        public bool VerifySignature(
            string requestId,
            string orderId,
            string amount,
            string resultCode,
            string message,
            string signature)
        {
            try
            {
                var secretKey = _configuration["MoMo:SecretKey"] ?? "";
                var accessKey = _configuration["MoMo:AccessKey"] ?? "";

                // Build raw signature for IPN callback (different order than payment request!)
                // For IPN: accessKey -> amount -> extraData -> message -> orderId -> orderInfo -> orderType -> partnerCode -> payType -> requestId -> responseTime -> resultCode -> transId
                // Simplified version for basic verification:
                var rawSignature = $"accessKey={accessKey}&amount={amount}&message={message}&orderId={orderId}&requestId={requestId}&resultCode={resultCode}";

                var computedSignature = ComputeHmacSha256(rawSignature, secretKey);

                _logger.LogInformation("=== VERIFY SIGNATURE ===");
                _logger.LogInformation("Raw: {Raw}", rawSignature);
                _logger.LogInformation("Computed: {Computed}", computedSignature);
                _logger.LogInformation("Received: {Received}", signature);

                var isValid = computedSignature.Equals(signature, StringComparison.OrdinalIgnoreCase);
                _logger.LogInformation("Valid: {IsValid}", isValid);

                return isValid;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying signature");
                return false;
            }
        }

        private static string ComputeHmacSha256(string data, string key)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
        }
    }
}
