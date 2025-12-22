import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { isLoggedIn } from "../../services/AuthService";
import { createMoMoPayment, getOrderDetails } from "../../services/OrderService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/my-account");
      return;
    }

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getOrderDetails(id);
        if (!mounted) return;
        setOrder(data);
      } catch (err) {
        setError(err.message || "Không tải được chi tiết đơn hàng");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const payment = order?.payment || order?.Payment;
  const gateway = payment?.paymentGateway || payment?.PaymentGateway;
  const paymentStatus = payment?.paymentStatus || payment?.PaymentStatus;
  const transactionCode = payment?.transactionCode || payment?.TransactionCode;

  const isPaid = useMemo(() => {
    return !!transactionCode || String(paymentStatus || "").toLowerCase() === "success";
  }, [paymentStatus, transactionCode]);

  const canRepay = useMemo(() => {
    return String(gateway || "").toLowerCase() === "momo" && !isPaid;
  }, [gateway, isPaid]);

  const handleRepay = async () => {
    if (!order) return;
    try {
      setSubmitting(true);
      const res = await createMoMoPayment(order.idOrders || order.IdOrders, order.totalAmount || order.TotalAmount);
      const payUrl = res?.data?.payUrl || res?.payUrl;
      if (!payUrl) throw new Error("Không nhận được link thanh toán");
      window.location.href = payUrl;
    } catch (err) {
      alert(err.message || "Không tạo được link thanh toán");
    } finally {
      setSubmitting(false);
    }
  };

  const totalItems = useMemo(() => {
    const items = order?.items || order?.Items || [];
    return items.reduce((sum, it) => sum + (it.quantity || it.Quantity || 0), 0);
  }, [order]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center text-neutral-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center text-neutral-500">Không có dữ liệu</div>
      </div>
    );
  }

  const items = order.items || order.Items || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <Link to="/my-account" className="hover:text-neutral-900">
          Tài khoản của tôi
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Chi tiết đơn hàng</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Đơn hàng #{order.orderNumber || order.OrderNumber}</h1>
          <p className="text-sm text-neutral-600 mt-1">Số lượng sản phẩm: {totalItems}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/my-account"
            className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Quay lại
          </Link>
          {canRepay && (
            <button
              type="button"
              onClick={handleRepay}
              disabled={submitting}
              className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Đang tạo link..." : "Thanh toán lại"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Thông tin đơn</h2>
          <div className="text-sm text-neutral-700 space-y-1">
            <p>Trạng thái đơn: {order.status || order.Status}</p>
            <p>Tổng tiền: {fmtVND(order.totalAmount || order.TotalAmount)}</p>
            {order.shippingFee != null || order.ShippingFee != null ? (
              <p>Phí vận chuyển: {fmtVND(order.shippingFee || order.ShippingFee)}</p>
            ) : null}
            <p>Địa chỉ: {order.shippingAddress || order.ShippingAddress}</p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Thanh toán</h2>
          <div className="text-sm text-neutral-700 space-y-1">
            <p>Phương thức: {gateway || "—"}</p>
            <p>
              Trạng thái: {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
            </p>
            <p>Mã giao dịch: {transactionCode || "—"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Ghi chú</h2>
          <div className="text-sm text-neutral-700">{order.note || order.Note || "—"}</div>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-200 p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Sản phẩm</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          {items.map((item) => (
            <div key={item.idOrderItems || item.IdOrderItems} className="p-4 flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <img
                  src={item.productImage || item.ProductImage || item.thumbnailUrl || item.ThumbnailUrl || "/assets/img/no-image.jpg"}
                  alt={item.productName || item.ProductName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-neutral-900">{item.productName || item.ProductName}</div>
                <div className="mt-1 text-xs text-neutral-500">
                  {(item.color || item.Color) && <span>Màu: {item.color || item.Color}</span>}
                  {(item.color || item.Color) && (item.size || item.Size) && <span className="mx-1">•</span>}
                  {(item.size || item.Size) && <span>Size: {item.size || item.Size}</span>}
                </div>
                <div className="mt-1 text-sm text-neutral-600">
                  {item.quantity || item.Quantity} x {fmtVND(item.unitPrice || item.UnitPrice)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-600">Tạm tính</div>
                <div className="font-semibold text-neutral-900">{fmtVND(item.subTotal || item.SubTotal)}</div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-4 text-sm text-neutral-500">Không có sản phẩm</div>}
        </div>
      </div>
    </div>
  );
}
