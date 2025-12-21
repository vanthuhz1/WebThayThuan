import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import ShopCart from "./pages/ShopCart/ShopCart";
import Wishlist from "./pages/Wishlist/Wishlist";
import Order from "./pages/Order/Order";
import MyAccount from "./pages/MyAccount/MyAccount";
import News from "./pages/News/News";
import NotFound from "./pages/NotFound/NotFound";
import CollectionPage from "./pages/Collections/CollectionPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          <Route path="/collections/:slug" element={<CollectionPage />} />

          <Route path="/product/:slugOrId" element={<ProductDetails />} />

          <Route path="/shop-cart" element={<ShopCart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/order" element={<Order />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/news" element={<News />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
