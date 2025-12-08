import Navigation from './Navigation'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCartShopping, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { getCurrentUser } from '../../services/AuthService'

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [user, setUser] = useState(() => getCurrentUser && getCurrentUser())
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

  return (
    <>
      <header 
        className="sticky top-0 z-[1000] transition-all duration-300 border-b bg-white/75 backdrop-blur-md border-gray-200/80 shadow-sm"
      >
        <div className="w-full px-4 mx-auto max-w-7xl">
          <div className="hidden lg:flex items-center justify-between py-3.5 gap-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 no-underline text-gray-900 hover:text-black">
              <div className="text-2xl font-semibold tracking-tight">160 STORE</div>
            
            </Link>

            {/* Navigation */}
            <Navigation />

            {/* Icons */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    className="h-10 w-44 rounded-full border border-gray-200 bg-white/80 pl-4 pr-10 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                  </span>
                </div>
              </div>

              
              <Link 
                to="/shop-cart" 
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:text-black transition-colors"
                aria-label="Giỏ hàng"
              >
                <FontAwesomeIcon icon={faCartShopping} className="text-base" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  0
                </span>
              </Link>
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
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-800 border border-gray-200 hover:bg-white hover:text-black transition-colors"
                  aria-label="Tài khoản"
                >
                  <FontAwesomeIcon icon={faUser} className="text-base" />
                </button>
                {user && isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-gray-200 bg-white shadow-lg z-[1200]">
                    <Link
                      to="/my-account"
                      className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
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
                      className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
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
    </>
  )
}

export default Header

