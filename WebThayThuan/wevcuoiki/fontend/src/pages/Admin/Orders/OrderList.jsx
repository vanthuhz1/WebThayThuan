import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders, deleteOrder } from "../../../services/AdminService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      // Map status từ user format sang admin format để đồng bộ
      // User: "all", "pending", "shipping", "delivered", "cancelled"
      // Admin: "pending", "processing", "shipped", "delivered", "completed", "cancelled"
      let adminStatus = undefined;
      if (statusFilter === "all") {
        adminStatus = undefined; // Lấy tất cả
      } else if (statusFilter === "pending") {
        adminStatus = "pending";
      } else if (statusFilter === "shipping") {
        // "shipping" ở user = "processing" hoặc "shipped" ở admin
        // Vì API chỉ nhận 1 status, ta sẽ filter "processing" (đang xử lý/giao hàng)
        adminStatus = "processing";
      } else if (statusFilter === "delivered") {
        // "delivered" ở user = "delivered" hoặc "completed" ở admin
        adminStatus = "delivered";
      } else if (statusFilter === "cancelled") {
        adminStatus = "cancelled";
      } else {
        // Các status khác (processing, shipped, completed) giữ nguyên
        adminStatus = statusFilter;
      }
      
      const data = await getAdminOrders({ page, pageSize: 20, status: adminStatus });
      setOrders(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Lỗi tải đơn hàng", err);
      alert(err.message || "Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (orderId, orderNumber) => {
    if (!confirm(`Bạn có chắc muốn xóa đơn hàng ${orderNumber}?\n\nHành động này không thể hoàn tác.`)) return;

    try {
      const result = await deleteOrder(orderId);
      const message = result?.orderNumber 
        ? `Xóa đơn hàng ${result.orderNumber} thành công`
        : "Xóa đơn hàng thành công";
      alert(message);
      loadOrders();
    } catch (err) {
      alert(err.message || "Không thể xóa đơn hàng");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "processing":
      case "shipped":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Đơn hàng</h1>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-neutral-300 rounded-lg"
        >
          <option value="all">Tất cả</option>
          <option value="pending">Đang xử lý</option>
          <option value="shipping">Đang giao hàng</option>
          <option value="delivered">Đã giao hàng</option>
          <option value="cancelled">Đã hủy</option>
          {/* Các trạng thái chi tiết cho admin */}
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Đang tải...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Số lượng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-neutral-500">
                      Không có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.idOrders} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{order.orderNumber}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-neutral-900">{order.customerName}</p>
                        <p className="text-xs text-neutral-500">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">{fmtVND(order.totalAmount)}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{order.itemCount || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/orders/${order.idOrders}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Xem chi tiết"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(order.idOrders, order.orderNumber)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm text-neutral-600">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}



