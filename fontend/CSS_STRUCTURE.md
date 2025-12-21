# Cấu trúc CSS

## Thứ tự load CSS (QUAN TRỌNG!)

### 1. Assets CSS (từ template gốc)
- Load đầu tiên từ `/assets/css/`
- Giữ nguyên để không phá vỡ template
- Bao gồm: Bootstrap, FontAwesome, animations, plugins CSS

### 2. Tailwind CSS
- Load sau assets CSS
- Cung cấp utility classes
- Custom colors và components

### 3. Custom CSS (overrides)
- `src/styles/custom.css` - Base styles và fixes
- `src/components/Header/Header.css` - Header styles với !important
- `src/components/Footer/Footer.css` - Footer styles với !important

## Tại sao dùng !important?

CSS từ assets có specificity cao, nên cần `!important` để override:
- Đảm bảo custom styles được áp dụng
- Tránh conflict với Bootstrap và template CSS
- Giữ được styling từ template nhưng customize được

## Cấu trúc thư mục

```
src/
├── index.css              # Main CSS file - imports tất cả
├── styles/
│   └── custom.css         # Custom base styles và utilities
└── components/
    ├── Header/
    │   └── Header.css     # Header specific styles
    └── Footer/
        └── Footer.css     # Footer specific styles
```

## Best Practices

1. **Không sửa trực tiếp CSS trong assets/** - Giữ nguyên template
2. **Dùng !important khi cần override** - Để đảm bảo styles được áp dụng
3. **Tổ chức CSS theo component** - Mỗi component có CSS riêng
4. **Comment rõ ràng** - Giải thích tại sao dùng !important

## Troubleshooting

Nếu styles không được áp dụng:
1. Kiểm tra thứ tự load CSS
2. Thêm `!important` nếu cần
3. Kiểm tra specificity của selector
4. Xem DevTools để debug conflict

