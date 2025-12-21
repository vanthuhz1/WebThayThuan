# Hướng dẫn sử dụng Tailwind CSS

## Đã cài đặt

✅ Tailwind CSS v4.1.17
✅ PostCSS
✅ Autoprefixer

## Cấu hình

- `tailwind.config.js` - Cấu hình Tailwind với custom colors và theme
- `postcss.config.js` - Cấu hình PostCSS
- `src/index.css` - Import Tailwind directives và custom styles

## Custom Colors

- `primary` - Màu đỏ chủ đạo (#ff0000)
- `primary-dark` - Màu đỏ đậm (#cc0000)
- `primary-light` - Màu đỏ nhạt (#ff3333)
- `secondary` - Màu xám đen (#1a1a1a)
- `secondary-light` - Màu xám nhạt (#333333)

## Custom Components

Đã tạo sẵn các utility classes trong `src/index.css`:

### Buttons
- `.btn-primary` - Nút chính (màu đỏ)
- `.btn-secondary` - Nút phụ (màu xám)

### Form
- `.input-field` - Input field với style đẹp

### Cards
- `.card` - Card component với shadow và hover effect

## Ví dụ sử dụng

```jsx
// Button
<button className="btn-primary">Click me</button>

// Input
<input type="text" className="input-field" placeholder="Enter text" />

// Card
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Grid Layout
<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {/* Items */}
</div>

// Flexbox
<div className="flex items-center justify-between">
  {/* Content */}
</div>
```

## Responsive Breakpoints

- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px
- `2xl:` - 1536px

## Utilities thường dùng

- `text-primary` - Màu chữ primary
- `bg-primary` - Màu nền primary
- `border-primary` - Màu viền primary
- `hover:bg-primary-dark` - Hover effect
- `transition-colors` - Transition mượt mà
- `rounded-lg` - Bo góc
- `shadow-md` - Đổ bóng
- `p-4` - Padding
- `m-4` - Margin

## Tích hợp với CSS cũ

Tailwind được import trước các CSS files cũ, nên có thể override nếu cần. Sử dụng `!important` nếu cần force style:

```jsx
<div className="!bg-red-500">Force red background</div>
```

