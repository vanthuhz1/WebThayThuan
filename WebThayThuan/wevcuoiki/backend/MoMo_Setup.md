# Hướng dẫn cấu hình MoMo Payment

## Bước 1: Đăng ký tài khoản MoMo Business

1. Truy cập: https://business.momo.vn/
2. Đăng ký tài khoản doanh nghiệp
3. Hoàn tất xác thực thông tin doanh nghiệp

## Bước 2: Lấy thông tin API

Sau khi đăng ký thành công, bạn sẽ nhận được:
- **Partner Code**: Mã đối tác
- **Access Key**: Khóa truy cập
- **Secret Key**: Khóa bí mật (giữ kín, không chia sẻ)

## Bước 3: Cấu hình trong appsettings.json

Mở file `appsettings.json` và cập nhật thông tin MoMo:

```json
{
  "MoMo": {
    "PartnerCode": "YOUR_PARTNER_CODE",
    "AccessKey": "YOUR_ACCESS_KEY",
    "SecretKey": "YOUR_SECRET_KEY",
    "Endpoint": "https://test-payment.momo.vn/v2/gateway/api/create"
  }
}
```

**Lưu ý:**
- **Test/Sandbox**: Sử dụng `https://test-payment.momo.vn/v2/gateway/api/create`
- **Production**: Sử dụng `https://payment.momo.vn/v2/gateway/api/create`

## Bước 4: Cấu hình Frontend URL (Optional)

Để redirect đúng về frontend sau khi thanh toán, bạn có thể set environment variable:

**Windows:**
```powershell
$env:FRONTEND_URL="http://localhost:5173"
```

**Linux/Mac:**
```bash
export FRONTEND_URL="http://localhost:5173"
```

Hoặc cập nhật trực tiếp trong `PaymentController.cs` nếu cần.

## Bước 5: Test thanh toán

1. Tạo đơn hàng với phương thức thanh toán "MoMo"
2. Hệ thống sẽ redirect đến trang thanh toán MoMo
3. Thanh toán bằng tài khoản MoMo test
4. Sau khi thanh toán thành công, sẽ redirect về `/order-success`

## API Endpoints

### 1. Tạo Payment Link
```
POST /api/Payment/create-momo-payment
Authorization: Bearer {token}
Body: { "orderId": 123 }
```

### 2. Callback từ MoMo (IPN)
```
POST /api/Payment/momo-callback
Body: { MoMo callback data }
```

### 3. Return URL (Redirect)
```
GET /api/Payment/momo-return?orderId=123&resultCode=0
```

## Lưu ý bảo mật

- **KHÔNG** commit `SecretKey` vào Git
- Sử dụng environment variables hoặc Azure Key Vault cho production
- Verify signature trong callback để đảm bảo request đến từ MoMo

## Tài liệu tham khảo

- [MoMo Developer Portal](https://developers.momo.vn/)
- [MoMo Payment API Documentation](https://developers.momo.vn/v3/vi/docs/payment/onboarding/overall/)

