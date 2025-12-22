import { useState, useEffect } from "react";
import { getDashboardStats } from "../../../services/AdminService";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBox,
  faShoppingCart,
  faUsers,
  faDollarSign,
  faClock,
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        if (mounted) setStats(data);
      } catch (err) {
        console.error("Lỗi tải dashboard", err);
        if (mounted) setError(err.message || "Không tải được dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-neutral-500">Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">Không có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-600 mt-1">Tổng quan hệ thống</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={faBox}
          title="Tổng sản phẩm"
          value={stats.totalProducts?.toLocaleString() || "0"}
          color="bg-blue-500"
        />
        <StatCard
          icon={faShoppingCart}
          title="Tổng đơn hàng"
          value={stats.totalOrders?.toLocaleString() || "0"}
          color="bg-green-500"
        />
        <StatCard
          icon={faUsers}
          title="Tổng người dùng"
          value={stats.totalUsers?.toLocaleString() || "0"}
          color="bg-purple-500"
        />
        <StatCard
          icon={faDollarSign}
          title="Tổng doanh thu"
          value={fmtVND(stats.totalRevenue || 0)}
          color="bg-orange-500"
        />
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <OrderStatusCard
          icon={faClock}
          title="Chờ xử lý"
          value={stats.pendingOrders || 0}
          color="bg-yellow-500"
        />
        <OrderStatusCard
          icon={faShoppingCart}
          title="Đang xử lý"
          value={stats.processingOrders || 0}
          color="bg-blue-500"
        />
        <OrderStatusCard
          icon={faCheckCircle}
          title="Hoàn thành"
          value={stats.completedOrders || 0}
          color="bg-green-500"
        />
        <OrderStatusCard
          icon={faTimesCircle}
          title="Đã hủy"
          value={stats.cancelledOrders || 0}
          color="bg-red-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Doanh thu theo tháng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => fmtVND(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={2} name="Doanh thu" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Đơn hàng theo tháng</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyOrders || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Số đơn hàng" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {stats.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((product, index) => (
                <div key={product.idProducts} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 flex items-center justify-center bg-red-600 text-white rounded-full font-semibold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-neutral-900">{product.name}</p>
                      <p className="text-xs text-neutral-500">Đã bán: {product.soldQuantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">{fmtVND(product.revenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Chưa có dữ liệu</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Đơn hàng gần đây</h2>
          <div className="space-y-3">
            {stats.recentOrders && stats.recentOrders.length > 0 ? (
              stats.recentOrders.map((order) => (
                <div key={order.idOrders} className="p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-neutral-900">{order.orderNumber}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "completed" || order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">{order.customerName}</p>
                  <p className="text-sm font-semibold text-neutral-900 mt-1">{fmtVND(order.totalAmount)}</p>
                  {order.createdAt && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(order.createdAt).toLocaleString("vi-VN")}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">Chưa có dữ liệu</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-2">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center`}>
          <FontAwesomeIcon icon={icon} className="text-white text-xl" />
        </div>
      </div>
    </div>
  );
}

function OrderStatusCard({ icon, title, value, color }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-3">
        <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
          <FontAwesomeIcon icon={icon} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-neutral-600">{title}</p>
          <p className="text-xl font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  );
}



