import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faChartLine,
  faBox,
  faShoppingCart,
  faUsers,
  faFolder,
  faNewspaper,
  faImage,
  faTag,
  faSignOutAlt,
  faHome,
} from "@fortawesome/free-solid-svg-icons";
import { logout, getCurrentUser } from "../../services/AuthService";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/admin", icon: faChartLine, label: "Dashboard" },
    { path: "/admin/products", icon: faBox, label: "Sản phẩm" },
    { path: "/admin/orders", icon: faShoppingCart, label: "Đơn hàng" },
    { path: "/admin/users", icon: faUsers, label: "Người dùng" },
    { path: "/admin/categories", icon: faFolder, label: "Danh mục" },
    { path: "/admin/blogs", icon: faNewspaper, label: "Blogs" },
    { path: "/admin/banners", icon: faImage, label: "Banners" },
    { path: "/admin/discount-codes", icon: faTag, label: "Mã giảm giá" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const user = getCurrentUser() || {};

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } bg-white border-r border-neutral-200 transition-all duration-300 overflow-hidden flex flex-col`}
      >
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-neutral-900">Admin Panel</h1>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-neutral-600 hover:text-neutral-900"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                      isActive
                        ? "bg-red-600 text-white"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
          >
            <FontAwesomeIcon icon={faHome} className="w-5" />
            <span className="font-medium">Về trang chủ</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition mt-2"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-5" />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-neutral-600 hover:text-neutral-900"
            >
              <FontAwesomeIcon icon={faBars} className="w-5" />
            </button>
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-600">
                {user.name || user.fullName || "Admin"}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

