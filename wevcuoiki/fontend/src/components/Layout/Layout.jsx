import Header from '../Header/Header'
import Footer from '../Footer/Footer'
import { useScriptLoader } from '../../hooks/useScriptLoader'

const Layout = ({ children }) => {
  useScriptLoader()

  return (
    <>
      {/* Preloader - sẽ ẩn sau khi page load */}
      <div id="preloader" className="preloader" style={{ display: 'none' }}>
        <div className="animation-preloader">
          <div className="spinner"></div>
          <div className="txt-loading">
            <span data-text-preloader="K" className="letters-loading">K</span>
            <span data-text-preloader="A" className="letters-loading">A</span>
            <span data-text-preloader="R" className="letters-loading">R</span>
            <span data-text-preloader="T" className="letters-loading">T</span>
            <span data-text-preloader="O" className="letters-loading">O</span>
          </div>
          <p className="text-center">Loading</p>
        </div>
        <div className="loader">
          <div className="flex flex-wrap">
            <div className="w-1/4 loader-section section-left">
              <div className="bg"></div>
            </div>
            <div className="w-1/4 loader-section section-left">
              <div className="bg"></div>
            </div>
            <div className="w-1/4 loader-section section-right">
              <div className="bg"></div>
            </div>
            <div className="w-1/4 loader-section section-right">
              <div className="bg"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Back To Top */}
      

      {/* Mouse Cursor */}
      <div className="mouse-cursor cursor-outer"></div>
      <div className="mouse-cursor cursor-inner"></div>

      {/* Main Content */}
      <div className="fix-area">
        <Header />
        <main>{children}</main>
        <Footer />
      </div>
    </>
  )
}

export default Layout

