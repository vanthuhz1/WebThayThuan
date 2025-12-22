import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isLoggedIn } from "../../services/AuthService";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const resultCode = searchParams.get("resultCode");
  const message = searchParams.get("message");
  const transId = searchParams.get("transId");

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return;
    }

    // Clear sessionStorage sau khi thanh toán thành công
    // (cả COD và MoMo đều sẽ vào trang này)
    sessionStorage.removeItem("orderFormData");
    sessionStorage.removeItem("orderStep");
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Đặt hàng thành công</span>
      </div>

      {/* Success Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <svg
              className="h-12 w-12 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-neutral-900">
          Đặt hàng thành công!
        </h1>

        {/* Message */}
        <p className="mb-6 text-neutral-600">
          {resultCode === "0" || !resultCode
            ? "Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được lưu vào hệ thống thành công."
            : message || "Đơn hàng của bạn đã được tạo. Vui lòng kiểm tra trạng thái thanh toán."}
        </p>

        {/* Order ID */}
        {orderId && (
          <div className="mb-6 rounded-lg bg-neutral-50 p-4">
            <p className="text-sm text-neutral-600">Mã đơn hàng</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">#{orderId}</p>
          </div>
        )}

        {/* Payment Info (nếu thanh toán MoMo thành công) */}
        {resultCode === "0" && transId && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-900">Thanh toán thành công</p>
            <p className="mt-1 text-xs text-emerald-700">Mã giao dịch: {transId}</p>
          </div>
        )}

        {/* Info */}
        <div className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left">
          <p className="mb-2 text-sm font-semibold text-neutral-900">
            Bước tiếp theo:
          </p>
          <ul className="space-y-1 text-sm text-neutral-600">
            <li>• Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất</li>
            <li>• Bạn sẽ nhận được email xác nhận đơn hàng</li>
            <li>• Bạn có thể theo dõi trạng thái đơn hàng trong mục "Tài khoản của tôi"</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/my-account"
            className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
          >
            Xem đơn hàng
          </Link>
          <Link
            to="/"
            className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

