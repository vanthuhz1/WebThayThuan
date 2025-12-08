# React Frontend - Web Ban Hang

Dự án frontend được chuyển đổi từ HTML tĩnh sang ReactJS với Vite.

## Cài đặt

```bash
npm install
```

## Chạy development server

```bash
npm run dev
```

## Build cho production

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Cấu trúc thư mục

```
src/
  components/     # Các components tái sử dụng (Header, Footer, Layout)
  pages/          # Các trang của ứng dụng
  services/       # API services và utilities
  hooks/          # Custom React hooks
  utils/          # Helper functions
```

## Notes

- Assets (CSS, images, fonts) được giữ nguyên trong thư mục `assets/`
- jQuery plugins được load động trong Layout component
- Routing sử dụng React Router v6

