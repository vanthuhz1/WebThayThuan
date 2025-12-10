import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login, saveUserInfo, isLoggedIn } from '../../services/AuthService'
import { getCart } from '../../services/CartService'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Check if already logged in
    if (isLoggedIn()) {
      const returnUrl = searchParams.get('returnUrl')
      navigate(returnUrl || '/')
    }
  }, [navigate, searchParams])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu")
      setLoading(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Email không hợp lệ")
      setLoading(false)
      return
    }

    try {
      const userData = await login(email, password)
      saveUserInfo(userData)
      
      // Tự động khởi tạo giỏ hàng cho người dùng sau khi đăng nhập
      try {
        await getCart()
      } catch (cartErr) {
        // Ignore cart errors, không ảnh hưởng đến login flow
        console.log('Cart initialization failed:', cartErr)
      }
      
      const returnUrl = searchParams.get('returnUrl')
      navigate(returnUrl || '/')
    } catch (err) {
      let errorMessage = "Đăng nhập thất bại"
      if (err.message) {
        if (err.message.includes("Sai email hoặc mật khẩu")) {
          errorMessage = "Sai email hoặc mật khẩu"
        } else {
          errorMessage = err.message
        }
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="container mx-auto max-w-md">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li><a href="/" className="hover:text-primary transition-colors">Trang chủ</a></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-gray-900 font-medium">Đăng nhập</li>
          </ol>
        </nav>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
            <p className="text-gray-600">
              Chưa có tài khoản?{' '}
              <a href="/sign-up" className="text-primary hover:text-primary-dark font-semibold transition-colors">
                Đăng ký ngay
              </a>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {error}
              </p>
            </div>
          )}

          {/* Social Login */}
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <img src="/assets/img/google.png" alt="Google" className="w-5 h-5" />
              </button>
              <button className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <i className="fa-brands fa-facebook text-blue-600 text-xl"></i>
              </button>
              <button className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <i className="fa-brands fa-apple text-gray-900 text-xl"></i>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc đăng nhập bằng email</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field w-full pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <i className={`fa-regular fa-${showPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <a
                href="/forgot-password"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Quên mật khẩu?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Login

