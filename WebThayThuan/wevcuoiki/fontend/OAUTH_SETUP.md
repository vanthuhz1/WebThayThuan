# Hướng dẫn cấu hình OAuth (Google & Facebook)

## Bước 1: Tạo file .env

Tạo file `.env` trong thư mục `fontend/` với nội dung sau:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com

# Facebook OAuth Configuration
VITE_FACEBOOK_APP_ID=your_facebook_app_id_here

# API URL (nếu cần thay đổi)
VITE_API_URL=https://localhost:7194/api
```

## Bước 2: Lấy Google Client ID

1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Chọn **Web application** 
6. Thêm **Authorized JavaScript origins**:
   - `http://localhost:5173` (cho development)
   - `https://yourdomain.com` (cho production)
7. Copy **Client ID** và dán vào file `.env`

## Bước 3: Lấy Facebook App ID

1. Truy cập: https://developers.facebook.com/apps/
2. Click **Create App**
3. Chọn **Consumer** hoặc **Business**
4. Điền thông tin app
5. Vào **Settings** > **Basic**
6. Copy **App ID** và dán vào file `.env`
7. Thêm **App Domains** và **Site URL**:
   - Site URL: `http://localhost:5173` (cho development)
   - App Domains: `localhost` (cho development)

## Bước 4: Cấu hình Backend (Facebook)

Thêm vào file `backend/appsettings.json`:

```json
{
  "Facebook": {
    "AppId": "your_facebook_app_id",
    "AppSecret": "your_facebook_app_secret"
  }
}
```

Lấy **App Secret** từ Facebook App Dashboard > **Settings** > **Basic** > **App Secret**

## Bước 5: Khởi động lại ứng dụng

Sau khi cấu hình xong, khởi động lại:
- Frontend: `npm run dev`
- Backend: Chạy lại project

## Lưu ý

- File `.env` không được commit lên Git (đã có trong .gitignore)
- Đảm bảo các URL trong Google và Facebook console khớp với URL bạn đang sử dụng
- Trong production, cần cập nhật các URL authorized origins

