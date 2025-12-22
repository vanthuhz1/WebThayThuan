namespace Backend_WebBanHang.Services
{
    public interface IMoMoPaymentService
    {
        Task<MoMoPaymentResult> CreatePaymentRequestAsync(
            long amount,
            long orderId,
            string orderInfo,
            string redirectUrl,
            string ipnUrl);

        bool VerifySignature(
            string requestId,
            string orderId,
            string amount,
            string resultCode,
            string message,
            string signature);

        bool VerifySignature(
            string partnerCode,
            string orderId,
            string requestId,
            long amount,
            string orderInfo,
            string orderType,
            string payType,
            long transId,
            long responseTime,
            int resultCode,
            string message,
            string extraData,
            string signature);
    }

    public class MoMoPaymentResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
        public string PayUrl { get; set; } = "";
        public string QrCodeUrl { get; set; } = "";
        public string Deeplink { get; set; } = "";
        public string? Details { get; set; }
    }
}
