import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Home from "./pages/Home/Home";
import Login from "./pages/Login/Login";
import SignUp from "./pages/SignUp/SignUp";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import ShopCart from "./pages/ShopCart/ShopCart";
import Wishlist from "./pages/Wishlist/Wishlist";
import Order from "./pages/Order/Order";
import OrderSuccess from "./pages/OrderSuccess/OrderSuccess";
import MyAccount from "./pages/MyAccount/MyAccount";
import News from "./pages/News/News";
import NotFound from "./pages/NotFound/NotFound";
import CollectionPage from "./pages/Collections/CollectionPage";
import SearchPage from "./pages/Search/SearchPage";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminRoute from "./components/Admin/AdminRoute";
import AdminLogin from "./pages/Admin/AdminLogin/AdminLogin";
import Dashboard from "./pages/Admin/Dashboard/Dashboard";
import ProductList from "./pages/Admin/Products/ProductList";
import ProductCreate from "./pages/Admin/Products/ProductCreate";
import ProductEdit from "./pages/Admin/Products/ProductEdit";
import OrderList from "./pages/Admin/Orders/OrderList";
import OrderDetail from "./pages/Admin/Orders/OrderDetail";
import UserList from "./pages/Admin/Users/UserList";
import UserDetail from "./pages/Admin/Users/UserDetail";
import CategoryTree from "./pages/Admin/Categories/CategoryTree";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public & customer routes with site header/footer */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/collections/:slug" element={<CollectionPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:slugOrId" element={<ProductDetails />} />
          <Route path="/shop-cart" element={<ShopCart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/order" element={<Order />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/news" element={<News />} />
          <Route path="/not-found" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin routes without site header/footer */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductCreate />} />
          <Route path="products/:id" element={<ProductEdit />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="orders" element={<OrderList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="users" element={<UserList />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="categories" element={<CategoryTree />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
