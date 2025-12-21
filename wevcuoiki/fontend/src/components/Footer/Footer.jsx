import { Link } from 'react-router-dom'
import FooterWidget from './FooterWidget'
import NewsletterForm from './NewsletterForm'
import { FOOTER_ACCOUNT_LINKS, FOOTER_INFO_LINKS, CONTACT_INFO } from '../../constants/navigation'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pt-16 pb-8 mt-20 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Contact Widget */}
            <div>
              <FooterWidget>
                <Link to="/" className="block mb-6" aria-label="Trang chủ">
                  <img 
                    src="/assets/img/logo/red-logo.svg" 
                    alt="MensStyle Logo" 
                    className="h-[50px] w-auto brightness-0 invert transition-transform duration-300 hover:scale-105"
                  />
                </Link>
                <div className="mt-5">
                  <div className="mb-5">
                    <p className="text-gray-400 text-sm mb-2">Cần tư vấn? Gọi ngay</p>
                    <a 
                      href={`tel:${CONTACT_INFO.phone.replace(/\s/g, '')}`}
                      className="text-white text-lg font-semibold no-underline transition-colors hover:text-primary"
                    >
                      {CONTACT_INFO.phone}
                    </a>
                  </div>
                  <ul className="list-none m-0 p-0">
                    <li className="flex items-start gap-3 mb-4 text-gray-400 text-sm leading-relaxed">
                      <i className="fa-regular fa-envelope text-primary text-base mt-0.5 flex-shrink-0"></i>
                      <a 
                        href={`mailto:${CONTACT_INFO.email}`}
                        className="text-gray-400 no-underline transition-colors hover:text-primary"
                      >
                        {CONTACT_INFO.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-3 mb-4 text-gray-400 text-sm leading-relaxed">
                      <i className="fa-regular fa-location-dot text-primary text-base mt-0.5 flex-shrink-0"></i>
                      <span dangerouslySetInnerHTML={{ __html: CONTACT_INFO.address }} />
                    </li>
                  </ul>
                </div>
              </FooterWidget>
            </div>

            {/* Account Links */}
            <div className="lg:pl-5">
              <FooterWidget title="Tài khoản của tôi" links={FOOTER_ACCOUNT_LINKS} />
            </div>

            {/* Info Links */}
            <div className="lg:pl-5">
              <FooterWidget title="Thông tin" links={FOOTER_INFO_LINKS} />
            </div>

            {/* Newsletter */}
            <div>
              <FooterWidget title="Đăng ký nhận tin">
                <NewsletterForm />
              </FooterWidget>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-white/10 pt-8 mt-10">
          <div className="flex flex-wrap justify-between items-center gap-5">
            <p className="text-gray-400 text-sm m-0">
              © {currentYear} All rights reserved | by <span className="text-primary font-semibold">MensStyle.</span>
            </p>
            <div className="flex gap-4 items-center flex-wrap">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="h-10 transition-transform duration-300 hover:scale-110">
                  <img
                    src={`/assets/img/footer/0${num}.png`}
                    alt={`Payment method ${num}`}
                    className="h-full w-auto brightness-90 transition-all hover:brightness-100"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
