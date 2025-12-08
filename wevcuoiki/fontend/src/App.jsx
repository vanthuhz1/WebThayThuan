import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import SignUp from './pages/SignUp/SignUp'
import ProductDetails from './pages/ProductDetails/ProductDetails'
import ShopCart from './pages/ShopCart/ShopCart'
import ShopSidebar from './pages/ShopSidebar/ShopSidebar'
import Categories from './pages/Categories/Categories'
import Checkout from './pages/Checkout/Checkout'
import Order from './pages/Order/Order'
import MyAccount from './pages/MyAccount/MyAccount'
import About from './pages/About/About'
import Contact from './pages/Contact/Contact'
import News from './pages/News/News'
import NewsDetails from './pages/NewsDetails/NewsDetails'
import NewsGrid from './pages/NewsGrid/NewsGrid'
import NewsList from './pages/NewsList/NewsList'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import ComingSoon from './pages/ComingSoon/ComingSoon'
import NotFound from './pages/NotFound/NotFound'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/product-details/:id" element={<ProductDetails />} />
          <Route path="/shop-cart" element={<ShopCart />} />
          <Route path="/shop-left-sidebar" element={<ShopSidebar />} />
          <Route path="/shop-sidebar" element={<ShopSidebar />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order" element={<Order />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/news" element={<News />} />
          <Route path="/news-details/:id" element={<NewsDetails />} />
          <Route path="/news-grid" element={<NewsGrid />} />
          <Route path="/news-list" element={<NewsList />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App

