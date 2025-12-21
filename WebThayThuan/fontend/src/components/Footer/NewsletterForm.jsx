import { useState } from 'react'
import { SOCIAL_LINKS } from '../../constants/navigation'

const NewsletterForm = () => {
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Implement newsletter subscription
    console.log('Subscribe:', email)
    setEmail('')
  }

  return (
    <div className="mt-5">
      <p className="text-gray-400 text-sm leading-relaxed mb-5">
        Nhận ưu đãi và xu hướng mới nhất về thời trang nam.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2.5 mb-6 md:flex-col">
          <input
            type="email"
            id="email2"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email đăng ký nhận tin"
            className="flex-1 py-3 px-4.5 border border-white/20 rounded-md bg-white/5 text-white text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white/10 focus:ring-2 focus:ring-primary/10"
          />
          <button 
            className="py-3 px-6 bg-primary text-white border-none rounded-md font-semibold text-sm cursor-pointer transition-all whitespace-nowrap hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 md:w-full" 
            type="submit"
          >
            <span>Đăng ký</span>
          </button>
        </div>
      </form>
      <div className="mt-6">
        <h6 className="text-white text-sm font-semibold mb-4">Theo dõi chúng tôi</h6>
        <div className="flex gap-3 items-center">
          {SOCIAL_LINKS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white text-base transition-all no-underline hover:bg-primary hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/30"
              aria-label={social.label}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className={social.icon}></i>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

export default NewsletterForm

