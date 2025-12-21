// Navigation menu items (slug khớp với bảng categories)
// isCollection: true => link tới /collections/:slug, false => dùng path trực tiếp
export const NAVIGATION_ITEMS = [
  // Trang chủ (về trang Home)
  { path: '/', slug: 'all', label: 'TRANG CHỦ', hasDropdown: false, isCollection: false },

  // Root categories
  { path: '/collections/ao-thu-dong', slug: 'ao-thu-dong', label: 'ÁO THU ĐÔNG', hasDropdown: true, isCollection: true },
  { path: '/collections/ao-xuan-he', slug: 'ao-xuan-he', label: 'ÁO XUÂN HÈ', hasDropdown: true, isCollection: true },
  { path: '/collections/quan', slug: 'quan', label: 'QUẦN', hasDropdown: true, isCollection: true },
  { path: '/collections/phu-kien', slug: 'phu-kien', label: 'PHỤ KIỆN', hasDropdown: true, isCollection: true },

  // Static pages (đã có route trong App)
  { path: '/news', slug: 'tin-thoi-trang', label: 'TIN THỜI TRANG', hasDropdown: false, isCollection: false },
  { path: '/not-found', slug: 've-chung-toi', label: 'VỀ CHÚNG TÔI', hasDropdown: false, isCollection: false },
]

// Footer links
export const FOOTER_ACCOUNT_LINKS = [
  { path: '/order', label: 'Theo dõi đơn hàng' },
  { path: '/product-details', label: 'Chính sách giao hàng' },
  { path: '/shop-cart', label: 'Danh sách yêu thích' },
  { path: '/my-account', label: 'Thông tin tài khoản' },
  { path: '/order', label: 'Lịch sử mua hàng' },
  { path: '/contact', label: 'Hỗ trợ & đổi trả' },
]

export const FOOTER_INFO_LINKS = [
  { path: '/contact', label: 'Về MensStyle' },
  { path: '/contact', label: 'Tuyển dụng' },
  { path: '/contact', label: 'Chính sách bảo mật' },
  { path: '/contact', label: 'Điều khoản sử dụng' },
  { path: '/news-details', label: 'Tin tức thời trang nam' },
  { path: '/contact', label: 'Liên hệ' },
]

// Social media links
export const SOCIAL_LINKS = [
  { icon: 'fab fa-facebook-f', href: '#', label: 'Facebook' },
  { icon: 'fab fa-instagram', href: '#', label: 'Instagram', className: 'bg-2' },
  { icon: 'fab fa-tiktok', href: '#', label: 'TikTok' },
  { icon: 'fab fa-youtube', href: '#', label: 'YouTube' },
]

// Contact info
export const CONTACT_INFO = {
  phone: '(+84) 0912 345 678',
  email: 'support@mensstyle.vn',
  address: '123 Lê Lợi, Quận 1<br />TP. Hồ Chí Minh, Việt Nam',
}

