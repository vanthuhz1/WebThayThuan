import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminOrder, updateOrderStatus, deleteOrder } from "../../../services/AdminService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

// Đồng bộ với user page: "pending", "shipping", "delivered", "cancelled"
// Map sang admin status: "pending", "processing"/"shipped", "delivered"/"completed", "cancelled"
const statusOptions = [
  { value: "pending", label: "Đang xử lý" },
  { value: "processing", label: "Đang xử lý (processing)" },
  { value: "shipped", label: "Đang giao hàng" },
  { value: "delivered", label: "Đã giao hàng" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminOrder(id);
        if (!mounted) return;
        setOrder(data);
        setStatus(data.status || "pending");
      } catch (err) {
        setError(err.message || "Không tải được đơn hàng");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const totalItems = useMemo(
    () => (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0),
    [order]
  );

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      await updateOrderStatus(id, status, notes);
      alert("Cập nhật trạng thái thành công");
      navigate("/admin/orders");
    } catch (err) {
      alert(err.message || "Không cập nhật được trạng thái");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    
    const orderNumber = order.orderNumber || order.orderNumber || `#${id}`;
    if (!confirm(`Bạn có chắc muốn xóa đơn hàng ${orderNumber}?\n\nHành động này không thể hoàn tác.`)) return;

    try {
      const result = await deleteOrder(id);
      const message = result?.orderNumber 
        ? `Xóa đơn hàng ${result.orderNumber} thành công`
        : "Xóa đơn hàng thành công";
      alert(message);
      navigate("/admin/orders");
    } catch (err) {
      alert(err.message || "Không thể xóa đơn hàng");
    }
  };

  if (loading) return <p className="text-neutral-500">Đang tải đơn hàng...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p className="text-neutral-500">Không có dữ liệu</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Đơn hàng #{order.orderNumber}</h1>
          <p className="text-sm text-neutral-600">
            Khách: {order.customer?.fullName} ({order.customer?.email})
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTrash} />
            Xóa đơn hàng
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Thông tin đơn</h2>
          <div className="text-sm text-neutral-700 space-y-1">
            <p>Mã đơn: {order.orderNumber}</p>
            <p>Trạng thái: {order.status}</p>
            <p>Ngày tạo: {order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "N/A"}</p>
            <p>Số lượng SP: {totalItems}</p>
            <p>Tổng tiền: {fmtVND(order.totalAmount)}</p>
            {order.shippingFee != null && <p>Phí vận chuyển: {fmtVND(order.shippingFee)}</p>}
            <p>Địa chỉ: {order.shippingAddress}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Khách hàng</h2>
          <div className="text-sm text-neutral-700 space-y-1">
            <p>Họ tên: {order.customer?.fullName}</p>
            <p>Email: {order.customer?.email}</p>
            <p>Điện thoại: {order.customer?.phone}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Cập nhật trạng thái</h2>
          <div className="space-y-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Ghi chú (tùy chọn)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu trạng thái"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Sản phẩm</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          {(order.items || []).map((item) => (
            <div key={item.idOrderItems} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="font-semibold text-neutral-900">{item.productName}</p>
                <p className="text-sm text-neutral-600">
                  {item.color && <span>Màu: {item.color} </span>}
                  {item.size && <span>• Size: {item.size}</span>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">SL: {item.quantity}</p>
                <p className="font-semibold text-neutral-900">{fmtVND(item.unitPrice)}</p>
                <p className="text-sm text-neutral-600">Tạm tính: {fmtVND(item.subTotal)}</p>
              </div>
            </div>
          ))}
          {(order.items || []).length === 0 && (
            <div className="p-4 text-sm text-neutral-500">Không có sản phẩm</div>
          )}
        </div>
      </div>
    </div>
  );
}

