import Navigation from './Navigation'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { faUser, faHeart } from '@fortawesome/free-regular-svg-icons'
import { getCurrentUser, isLoggedIn } from '../../services/AuthService'
import { getCart } from '../../services/CartService'
import { getWishlist } from '../../services/WishlistService'
import { getProducts } from '../../services/ProductService'
import CartDrawer from '../Cart/CartDrawer'

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser && getCurrentUser())
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [totalSearchResults, setTotalSearchResults] = useState(0)
  const userMenuRef = useRef(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Close user menu when click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search autocomplete with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchLoading(true)
      try {
        const res = await getProducts({
          keyword: searchQuery.trim(),
          page: 1,
          pageSize: 5, // Show only 5 results in dropdown
        })
        const items = res?.items ?? res?.Items ?? []
        setSearchResults(Array.isArray(items) ? items : [])
        setTotalSearchResults(res?.totalItems ?? res?.TotalItems ?? 0)
        setShowSearchResults(true)
      } catch (err) {
        console.error("Lỗi tìm kiếm", err)
        setSearchResults([])
      } finally {
        setIsSearchLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fmtVND = (v) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
      Number(v || 0)
    )

  // Load cart count
  useEffect(() => {
    if (!isLoggedIn()) {
      setCartCount(0)
      return
    }

    let mounted = true
    const loadCart = async () => {
      try {
        const cart = await getCart()
        if (mounted && cart?.totalQuantity) {
          setCartCount(cart.totalQuantity)
        } else if (mounted) {
          setCartCount(0)
        }
      } catch (err) {
        // Ignore errors, user might not be logged in
        if (mounted) setCartCount(0)
      }
    }

    loadCart()
    // Refresh cart count every 30 seconds
    const interval = setInterval(loadCart, 30000)

    // Listen for cart updates from other components
    const handleCartUpdate = () => {
      loadCart()
    }
    window.addEventListener('cartUpdated', handleCartUpdate)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('cartUpdated', handleCartUpdate)
    }
  }, [user])

  // Load wishlist count
  useEffect(() => {
    if (!isLoggedIn()) {
      setWishlistCount(0)
      return
    }

    let mounted = true
    const loadWishlist = async () => {
      try {
        const wishlist = await getWishlist()
        if (mounted && wishlist?.totalItems) {
          setWishlistCount(wishlist.totalItems)
        } else if (mounted) {
          setWishlistCount(0)
        }
      } catch (err) {
        // Ignore errors, user might not be logged in
        if (mounted) setWishlistCount(0)
      }
    }

    loadWishlist()
    // Refresh wishlist count every 30 seconds
    const interval = setInterval(loadWishlist, 30000)

    // Listen for wishlist updates from other components
    const handleWishlistUpdate = () => {
      loadWishlist()
    }
    window.addEventListener('wishlistUpdated', handleWishlistUpdate)

    return () => {
      mounted = false
      clearInterval(interval)
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate)
    }
  }, [user])

  return (
    <>
      <header 
        className="sticky top-0 z-[1000] transition-all duration-300 border-b bg-white/75 backdrop-blur-md border-gray-200/80 shadow-sm"
      >
        <div className="w-full mx-auto max-w-[1360px]">
          <div className="hidden lg:flex items-center justify-between h-[70px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline text-gray-900 hover:text-black px-6">
              <div className="text-3xl font-semibold tracking-tight">Atino</div>
            </Link>

            {/* Navigation */}
            <Navigation />

            {/* Icons */}
            <div className="flex items-center gap-2 px-6">
              {/* Search */}
              <div className="hidden lg:flex items-center" ref={searchRef}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      setShowSearchResults(false)
                      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true)
                      }
                    }}
                    placeholder="Tìm kiếm..."
                    className="h-9 w-64 rounded-full border border-gray-200 bg-white/80 pl-4 pr-9 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
                  </button>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-[2000] max-h-[500px] overflow-y-auto">
                      <div className="p-3 border-b border-gray-200">
                        <div className="text-xs font-semibold text-gray-900">
                          Kết quả tìm kiếm
                        </div>
                      </div>
                      
                      {isSearchLoading ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                          Đang tìm kiếm...
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                          Không tìm thấy sản phẩm nào
                        </div>
                      ) : (
                        <>
                          <div className="divide-y divide-gray-100">
                            {searchResults.map((product) => {
                              const productId = product.idProducts ?? product.IdProducts
                              const slug = product.slug ?? product.Slug
                              const name = product.name ?? product.Name
                              const price = product.price ?? product.Price
                              const salePrice = product.salePrice ?? product.SalePrice
                              const thumbnail = product.thumbnailUrl ?? product.ThumbnailUrl ?? "/assets/img/no-image.jpg"
                              const hasSale = salePrice && salePrice > 0 && salePrice < price

                              return (
                                <Link
                                  key={productId}
                                  to={`/product/${slug || productId}`}
                                  onClick={() => {
                                    setShowSearchResults(false)
                                    setSearchQuery("")
                                  }}
                                  className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                    <img
                                      src={thumbnail}
                                      alt={name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = "/assets/img/no-image.jpg"
                                      }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-900 line-clamp-2 mb-1">
                                      {name}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {hasSale ? (
                                        <>
                                          <span className="text-xs font-semibold text-red-600">
                                            {fmtVND(salePrice)}
                                          </span>
                                          <span className="text-[10px] text-gray-500 line-through">
                                            {fmtVND(price)}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-xs font-semibold text-gray-900">
                                          {fmtVND(price)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              )
                            })}
                          </div>
                          
                          {totalSearchResults > searchResults.length && (
                            <div className="p-3 border-t border-gray-200">
                              <Link
                                to={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                                onClick={() => {
                                  setShowSearchResults(false)
                                }}
                                className="block text-center text-xs font-semibold text-gray-900 hover:text-red-600 transition-colors"
                              >
                                Xem thêm {totalSearchResults - searchResults.length} sản phẩm
                              </Link>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Wishlist Icon */}
              <button 
                type="button"
                onClick={() => navigate('/wishlist')}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:text-black hover:border-gray-300 transition-all"
                aria-label="Yêu thích"
              >
                <FontAwesomeIcon icon={faHeart} className="text-sm" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Icon */}
              <button 
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:text-black hover:border-gray-300 transition-all"
                aria-label="Giỏ hàng"
              >
                <FontAwesomeIcon icon={faCartShopping} className="text-sm" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>
              <div 
                className="relative"
                ref={userMenuRef}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate('/login')
                      return
                    }
                    setIsUserMenuOpen((prev) => !prev)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:text-black hover:border-gray-300 transition-all"
                  aria-label="Tài khoản"
                >
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                </button>
                {user && isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-[1200]">
                    <Link
                      to="/my-account"
                      className="block px-4 py-2 text-xs text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      Xem trang cá nhân
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.clear()
                        setUser(null)
                        setIsUserMenuOpen(false)
                        navigate('/login')
                      }}
                      className="block w-full text-left px-4 py-2 text-xs text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Cart drawer for nav icon */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItem={null}
        onCartUpdate={(cartData) => {
          setCartCount(cartData?.totalQuantity || 0)
        }}
      />
    </>
  )
}

export default Header

