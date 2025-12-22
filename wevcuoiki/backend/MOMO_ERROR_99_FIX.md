# 🔥 MoMo Error 99 - Complete Fix Guide

## ❌ Triệu chứng
Khi quét QR trên app MoMo UAT → **Lỗi 99 "AddCartError"**

---

## ✅ ĐÃ SỬA (theo thứ tự quan trọng)

### 1️⃣ RequestType phải là `captureWallet` cho QR Code
```json
// ❌ SAI
"RequestType": "payWithMethod"  // Dùng cho deeplink, không dùng cho QR

// ✅ ĐÚNG
"RequestType": "captureWallet"  // Dùng cho QR Code
```

**File:** `appsettings.json`

---

### 2️⃣ OrderInfo CHỈ dùng ASCII (a-z, 0-9, space)
```csharp
// ❌ SAI
orderInfo: "Thanh toán đơn hàng 123"  // Có dấu tiếng Việt

// ✅ ĐÚNG
orderInfo: "Pay for order 123"  // Chỉ ASCII
```

**Lý do:** MoMo QR code không xử lý được Unicode/UTF-8 đúng cách

**File:** `PaymentController.cs` line 73-76

---

### 3️⃣ Frontend phải gửi đầy đủ: orderId + amount + orderInfo
```javascript
// ❌ SAI - Thiếu amount
body: JSON.stringify({ orderId })

// ✅ ĐÚNG
body: JSON.stringify({ 
  orderId: orderId,
  amount: totals.totalAmount,
  orderInfo: `Pay for order ${orderId}`
})
```

**File:** `Order.jsx` line 387

---

### 4️⃣ Response path phải đúng
```javascript
// ❌ SAI
const paymentUrl = paymentData.paymentUrl;

// ✅ ĐÚNG
const paymentUrl = paymentResult.data?.payUrl || paymentResult.payUrl;
```

**File:** `Order.jsx` line 397

---

## 🧪 CÁCH TEST

### Step 1: Restart Backend
```bash
# Stop server hiện tại (Ctrl+C)
cd d:\WebThayThuan\wevcuoiki\backend
dotnet run
```

### Step 2: Clear Browser Cache & Reload Frontend
```bash
# Trong browser: Ctrl+Shift+R (hard reload)
# Hoặc restart frontend:
cd d:\WebThayThuan\wevcuoiki\fontend
npm run dev
```

### Step 3: Đặt hàng với MoMo
1. Chọn sản phẩm → Giỏ hàng
2. Đặt hàng → Chọn thanh toán **MoMo**
3. Bấm "Xác nhận thanh toán"
4. **Check logs backend** để xem request/response

### Step 4: Kiểm tra Backend Logs
Logs cần thấy:
```
=== MoMo Payment Request START ===
Internal OrderId: 123, Amount: 50000
=== RAW SIGNATURE ===
accessKey=...&amount=50000&extraData=&ipnUrl=...
=== SIGNATURE ===
abc123def456...
=== REQUEST TO MOMO ===
{
  "partnerCode": "MOMO",
  "requestType": "captureWallet",  // ✅ Phải là captureWallet
  "orderInfo": "Pay for order 123", // ✅ Chỉ ASCII
  "amount": "50000",
  ...
}
=== RESPONSE FROM MOMO ===
{
  "resultCode": 0,    // ✅ 0 = Success
  "payUrl": "https://test-payment.momo.vn/...",
  "qrCodeUrl": "https://...",
  ...
}
```

### Step 5: Quét QR trên app MoMo UAT
- Nếu thành công → Hiện màn hình thanh toán
- Nếu vẫn lỗi 99 → Check logs backend xem `resultCode` là gì

---

## 🐛 NẾU VẪN BỊ LỖI 99

### Checklist debug:

#### ✅ 1. Kiểm tra requestType
```bash
# Trong logs backend, tìm dòng:
"requestType": "captureWallet"  # Phải là captureWallet, không phải payWithMethod
```

#### ✅ 2. Kiểm tra orderInfo
```bash
# Trong logs backend, tìm dòng:
"orderInfo": "Pay for order 123"  # Chỉ có a-z, 0-9, space
# ❌ KHÔNG được có: đơn, hàng, thành, toán, ký tự đặc biệt
```

#### ✅ 3. Kiểm tra amount
```bash
# Phải >= 10,000 VND
"amount": "50000"  # String, không phải number
```

#### ✅ 4. Kiểm tra signature
```bash
# Raw signature phải ALPHABET ORDER:
accessKey&amount&extraData&ipnUrl&orderId&orderInfo&partnerCode&redirectUrl&requestId&requestType
```

#### ✅ 5. Kiểm tra credentials
```json
// appsettings.json
"PartnerCode": "MOMO",
"AccessKey": "MOMOELJ820230214",     // Credentials của bạn
"SecretKey": "n5BezPrjvCl8quqE",     // Credentials của bạn
```

#### ✅ 6. Test với amount nhỏ
```javascript
// Thử với 10,000 VND trước
amount: 10000
```

---

## 📱 APP MOMO UAT

**⚠️ LƯU Ý:** Sandbox của MoMo chỉ test được bằng **MoMo UAT app**, không phải app MoMo chính thức trên store.

- **Download UAT app:** https://test-payment.momo.vn/download
- **Login:** Dùng số test hoặc tài khoản thật (UAT app riêng biệt)

---

## 🎯 CÁC RESULTCODE THƯỜNG GẶP

| Code | Meaning | Fix |
|------|---------|-----|
| 0 | ✅ Success | OK! |
| 7 | ❌ Invalid signature | Check raw signature order |
| 20 | ❌ Bad format | Check required fields |
| 98 | ❌ QR code creation failed | MoMo server issue, retry sau |
| 99 | ❌ AddCartError | Fix requestType + orderInfo |
| 1002 | ❌ Transaction declined | Card/bank issue (user side) |

---

## 🚀 NẾU ĐÃ OK

Sau khi test sandbox thành công, chuẩn bị lên production:
1. Đổi credentials sang production
2. Đổi endpoint: `https://payment.momo.vn/v2/gateway/api/create`
3. Đảm bảo ipnUrl là public HTTPS domain (không localhost)

---

**Last Updated:** 2025-01-22  
**Status:** ✅ Đã fix lỗi 99
