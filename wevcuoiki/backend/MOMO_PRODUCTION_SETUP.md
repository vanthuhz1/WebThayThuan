# MoMo Payment - Production Setup

## ⚠️ VẤN ĐỀ HIỆN TẠI

Code đang dùng URL tạm để test:
- `redirectUrl`: `https://momo.vn/return` 
- `ipnUrl`: `https://momo.vn/notify`

**Hậu quả:** Sau khi thanh toán, user bị redirect về momo.vn thay vì về website của bạn.

---

## ✅ GIẢI PHÁP CHO TEST LOCAL (Dùng ngrok)

### Bước 1: Cài ngrok
```bash
# Download: https://ngrok.com/download
# Hoặc cài qua Chocolatey (Windows):
choco install ngrok
```

### Bước 2: Chạy ngrok
```bash
# Trong terminal mới:
ngrok http https://localhost:7194
```

Bạn sẽ nhận được URL dạng:
```
Forwarding: https://abc123.ngrok-free.app -> https://localhost:7194
```

### Bước 3: Cập nhật PaymentController.cs
```csharp
// Thay đổi URLs:
var ngrokUrl = "https://abc123.ngrok-free.app"; // Copy từ ngrok
var returnUrl = $"{ngrokUrl}/api/Payment/momo-return?orderId={request.OrderId}";
var notifyUrl = $"{ngrokUrl}/api/Payment/momo-callback";
```

### Bước 4: Test
1. Tạo đơn hàng
2. Quét QR bằng app MoMo UAT
3. Sau khi thanh toán, sẽ callback về backend qua ngrok
4. Backend xử lý và redirect về frontend

---

## 🚀 GIẢI PHÁP CHO PRODUCTION

### Option 1: Deploy lên Azure/AWS
```csharp
var productionUrl = "https://yourdomain.com";
var returnUrl = $"{productionUrl}/payment/momo-return?orderId={request.OrderId}";
var notifyUrl = $"{productionUrl}/api/Payment/momo-callback";
```

### Option 2: Dùng biến môi trường
**appsettings.json:**
```json
{
  "MoMo": {
    "BaseUrl": "https://yourdomain.com"
  }
}
```

**PaymentController.cs:**
```csharp
var baseUrl = _configuration["MoMo:BaseUrl"] ?? "https://momo.vn";
var returnUrl = $"{baseUrl}/payment/momo-return?orderId={request.OrderId}";
var notifyUrl = $"{baseUrl}/api/Payment/momo-callback";
```

---

## 📱 TEST VỚI APP MOMO UAT

### Download App MoMo UAT
- **Android**: https://test-payment.momo.vn/download/momo_uat.apk
- **iOS**: Liên hệ MoMo support để được add vào TestFlight

### Tài khoản test:
- SĐT bất kỳ (10 số)
- OTP: Nhập bất kỳ 6 số
- Thanh toán test không mất tiền thật

---

## 🔍 DEBUG CHECKLIST

### Nếu vẫn lỗi 99, check:

1. ✅ **redirectUrl/ipnUrl**: HTTPS public URL
2. ✅ **orderInfo**: Không ký tự đặc biệt, không dấu
3. ✅ **amount**: >= 1000 VNĐ
4. ✅ **orderId**: Unique, format MM + timestamp
5. ✅ **signature**: Đúng thứ tự alphabet
6. ✅ **requestType**: `captureWallet` (đúng cho QR)

### Xem logs backend:
```
--------------------RAW SIGNATURE (v2 API)----------------
accessKey=F8BBA842ECF85&amount=50000&extraData=&ipnUrl=...
--------------------SIGNATURE----------------
abc123def...
Status: 200
Response Body:
{"resultCode":0,"message":"Success","payUrl":"..."}
```

Nếu `resultCode: 0` → Tạo payment thành công
Nếu `resultCode: 20` → Sai format (check URLs)
Nếu `resultCode: 7` → Sai signature

---

## 💡 QUICK FIX CHO TEST

Nếu không muốn dùng ngrok, tạm thời:

1. **Bỏ qua callback** - Chỉ test QR code hiển thị đúng
2. **Manual verify** - Sau khi quét, check trong app MoMo có hiện đơn hàng không
3. **Hardcode success** - Giả lập thanh toán thành công ở frontend

```javascript
// Frontend - Order.jsx
if (formData.paymentMethod === "momo") {
  // Tạm thời giả lập thành công
  console.log("MoMo payment initiated");
  setTimeout(() => {
    sessionStorage.clear();
    navigate(`/order-success?orderId=${orderId}&payment=momo_test`);
  }, 3000);
}
```

---

## 📞 Support

Nếu vẫn lỗi, liên hệ MoMo:
- Email: integration@momo.vn
- Hotline: 1900 54 54 41
- Portal: https://developers.momo.vn

