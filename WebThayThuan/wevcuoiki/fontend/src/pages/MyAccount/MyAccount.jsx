import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isLoggedIn, getCurrentUser, logout, getToken, fetchMe, updateMe, saveUserInfo } from "../../services/AuthService";
import { getMyOrders } from "../../services/OrderService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const MyAccount = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Profile form
  const [profileData, setProfileData] = useState({ fullName: "", email: "", phone: "" });
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/my-account");
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setProfileData({
        fullName: currentUser.name || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
      });
    }

    // Đồng bộ lại từ backend để lấy phone mới nhất
    (async () => {
      try {
        const me = await fetchMe();
        setUser({
          id: String(me.idUsers),
          name: me.fullName,
          email: me.email,
          phone: me.phone || "",
          role: me.role,
          token: me.token,
        });
        setProfileData({ fullName: me.fullName || "", email: me.email || "", phone: me.phone || "" });
        saveUserInfo(me);
      } catch {
        // ignore
      }
    })();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!profileData.fullName?.trim()) {
      setProfileError("Vui lòng nhập họ và tên");
      return;
    }

    try {
      setSavingProfile(true);
      const updated = await updateMe(profileData.fullName.trim(), profileData.phone);
      saveUserInfo(updated);
      setUser((prev) => ({
        ...(prev || {}),
        name: updated.fullName,
        email: updated.email,
        phone: updated.phone || "",
        token: updated.token,
      }));
      setProfileData({
        fullName: updated.fullName || "",
        email: updated.email || "",
        phone: updated.phone || "",
      });
      setProfileSuccess("Cập nhật thông tin thành công!");
    } catch (err) {
      setProfileError(err?.message || "Cập nhật thông tin thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, orderStatusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyOrders(orderStatusFilter === "all" ? null : orderStatusFilter);
      setOrders(data || []);
    } catch (err) {
      setError(err?.message || "Không tải được danh sách đơn hàng");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setChangingPassword(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";
      const token = getToken();

      const res = await fetch(`${API_BASE_URL}/Auth/change-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Đổi mật khẩu thất bại");
      }

      setPasswordSuccess("Đổi mật khẩu thành công!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(err?.message || "Có lỗi xảy ra khi đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Đang xử lý",
      processing: "Đang xử lý",
      shipping: "Đang giao hàng",
      delivered: "Đã giao hàng",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipping: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentLabel = (order) => {
    const gateway = order.paymentGateway || order.PaymentGateway;
    const paymentStatus = order.paymentStatus || order.PaymentStatus;
    const transactionCode = order.transactionCode || order.TransactionCode;

    const isPaid = !!transactionCode || String(paymentStatus || "").toLowerCase() === "success";
    if (isPaid) return "Đã thanh toán";

    if ((gateway || "").toLowerCase() === "momo") {
      return "Chưa thanh toán";
    }
    if ((gateway || "").toLowerCase() === "cod") {
      return "Chưa thanh toán";
    }
    return "Chưa thanh toán";
  };

  const getPaymentColor = (label) => {
    if (label === "Đã thanh toán") return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Tài khoản của tôi</span>
      </div>

      {/* Title */}
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-neutral-900">
        Tài khoản của tôi
      </h1>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar - Tabs */}
        <aside className="h-fit">
          <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-sm">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === "orders"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Đơn hàng của tôi
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === "profile"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Xem hồ sơ
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                activeTab === "password"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              Đổi mật khẩu
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full rounded-lg px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-h-[400px]">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold text-neutral-900">Đơn hàng của tôi</h2>

              {/* Status Filters */}
              <div className="mb-6 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
                {["all", "pending", "shipping", "delivered", "cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      orderStatusFilter === status
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {status === "all"
                      ? "Tất cả"
                      : status === "pending"
                      ? "Đang xử lý"
                      : status === "shipping"
                      ? "Đang giao hàng"
                      : status === "delivered"
                      ? "Đã giao hàng"
                      : "Đã hủy"}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              {loading ? (
                <div className="py-8 text-center text-neutral-500">Đang tải...</div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-neutral-600">Bạn chưa có đơn hàng nào</p>
                  <Link
                    to="/"
                    className="mt-4 inline-block rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Tiếp tục mua sắm
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.IdOrders || order.idOrders}
                      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      {/* Order Header */}
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
                        <div>
                          <div className="text-sm text-neutral-600">Mã đơn hàng</div>
                          <div className="text-base font-bold text-neutral-900">
                            {order.OrderNumber || order.orderNumber}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">Trạng thái</div>
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(
                              order.Status || order.status
                            )}`}
                          >
                            {getStatusLabel(order.Status || order.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">Ngày đặt</div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {order.CreatedAt || order.createdAt
                              ? new Date(order.CreatedAt || order.createdAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-neutral-600">Tổng tiền</div>
                          <div className="text-lg font-bold text-neutral-900">
                            {fmtVND(order.TotalAmount || order.totalAmount)}
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-3">
                        {(order.Items || order.items || []).map((item) => (
                          <div key={item.IdOrderItems || item.idOrderItems} className="flex gap-3">
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                              <img
                                src={item.ThumbnailUrl || item.thumbnailUrl || "/assets/img/no-image.jpg"}
                                alt={item.ProductName || item.productName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-neutral-900">
                                {item.ProductName || item.productName}
                              </div>
                              <div className="mt-1 text-xs text-neutral-500">
                                {(item.Color || item.color) && <span>Màu: {item.Color || item.color}</span>}
                                {(item.Color || item.color) && (item.Size || item.size) && <span className="mx-1">•</span>}
                                {(item.Size || item.size) && <span>Size: {item.Size || item.size}</span>}
                              </div>
                              <div className="mt-1 text-sm text-neutral-600">
                                {item.Quantity || item.quantity} x {fmtVND(item.UnitPrice || item.unitPrice)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Order Footer */}
                      <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
                        <div className="text-sm text-neutral-600">
                          Địa chỉ giao hàng: {order.ShippingAddress || order.shippingAddress}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getPaymentColor(
                              getPaymentLabel(order)
                            )}`}
                          >
                            {getPaymentLabel(order)}
                          </span>
                          <Link
                            to={`/my-account/orders/${order.IdOrders || order.idOrders}`}
                            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-neutral-900">Xem hồ sơ</h2>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {profileError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {profileError}
                  </div>
                )}
                {profileSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {profileSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">Họ và tên</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">Email (không thể thay đổi)</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">Số điện thoại</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                  {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </form>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === "password" && (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-neutral-900">Đổi mật khẩu</h2>

              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {passwordSuccess}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-neutral-700">
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                  {changingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyAccount;
