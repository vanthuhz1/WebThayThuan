import Navigation from './Navigation'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { faUser, faHeart } from '@fortawesome/free-regular-svg-icons'
import { getCurrentUser, isLoggedIn } from '../../services/AuthService'
import { getCart } from '../../services/CartService'
import { getWishlist } from '../../services/WishlistService'
import CartDrawer from '../Cart/CartDrawer'

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser && getCurrentUser())
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const userMenuRef = useRef(null)
  const navigate = useNavigate()

  // Close user menu when click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <div className="w-full mx-auto max-w-7xl">
          <div className="hidden lg:flex items-center justify-between h-[70px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline text-gray-900 hover:text-black px-6">
              <div className="text-2xl font-semibold tracking-tight">160 STORE</div>
            </Link>

            {/* Navigation */}
            <Navigation />

            {/* Icons */}
            <div className="flex items-center gap-2 px-6">
              {/* Search */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="h-9 w-40 rounded-full border border-gray-200 bg-white/80 pl-4 pr-9 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-xs" />
                  </span>
                </div>
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
                      className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
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
                      className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 transition-colors"
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

