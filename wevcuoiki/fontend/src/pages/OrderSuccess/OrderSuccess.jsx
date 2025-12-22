import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isLoggedIn } from "../../services/AuthService";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const resultCode = searchParams.get("resultCode");
  const transId = searchParams.get("transId");
  const message = searchParams.get("message");
  const paymentMethod = searchParams.get("payment") || (transId && transId !== "0" ? "momo" : "cod");
  
  // Check if payment failed
  const paymentFailed = resultCode && resultCode !== "0";

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.href = "/login";
      return;
    }

    // Only clear session if payment succeeded
    if (!paymentFailed) {
      sessionStorage.removeItem("orderFormData");
      sessionStorage.removeItem("orderStep");
      console.log("[OrderSuccess] Cleared session storage");
    }
    
    console.log("[OrderSuccess] OrderId:", orderId);
    console.log("[OrderSuccess] ResultCode:", resultCode);
    console.log("[OrderSuccess] Payment:", paymentMethod);
    if (transId) console.log("[OrderSuccess] TransId:", transId);
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

      {/* Success/Error Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          {paymentFailed ? (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          ) : (
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
          )}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-2xl font-bold text-neutral-900">
          {paymentFailed ? "Thanh toán thất bại" : "Đặt hàng thành công!"}
        </h1>

        {/* Message */}
        {paymentFailed ? (
          <div className="mb-6">
            <p className="mb-2 text-red-600 font-semibold">
              Giao dịch thanh toán không thành công
            </p>
            {message && (
              <p className="text-sm text-neutral-600">
                Lý do: {decodeURIComponent(message)}
              </p>
            )}
            <p className="mt-3 text-sm text-neutral-600">
              Đơn hàng đã được tạo nhưng chưa thanh toán. Bạn có thể thử thanh toán lại hoặc chọn phương thức khác.
            </p>
          </div>
        ) : (
          <p className="mb-6 text-neutral-600">
            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được {paymentMethod === "momo" ? "thanh toán và " : ""}lưu vào hệ thống thành công.
          </p>
        )}

        {/* Order Info */}
        <div className="mb-6 space-y-3">
          {orderId && (
            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-sm text-neutral-600">Mã đơn hàng</p>
              <p className="mt-1 text-lg font-bold text-neutral-900">#{orderId}</p>
            </div>
          )}
          
          {paymentMethod === "momo" && !paymentFailed && transId && transId !== "0" && (
            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-purple-600">Thanh toán MoMo</p>
              <p className="mt-1 text-sm font-semibold text-purple-900">
                Mã giao dịch: {transId}
              </p>
              <p className="mt-1 text-xs text-purple-700">
                ✓ Đã thanh toán thành công
              </p>
            </div>
          )}

          {paymentFailed && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-900">
                ❌ Thanh toán MoMo thất bại
              </p>
              <p className="mt-1 text-xs text-red-700">
                Mã lỗi: {resultCode}
              </p>
              <p className="mt-2 text-xs text-red-600">
                Vui lòng kiểm tra lại thẻ/tài khoản hoặc thử phương thức thanh toán khác.
              </p>
            </div>
          )}

          {paymentMethod === "cod" && (
            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-sm text-amber-700">
                Thanh toán khi nhận hàng (COD)
              </p>
            </div>
          )}
        </div>

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
          {paymentFailed ? (
            <>
              <Link
                to={`/order`}
                className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Thử thanh toán lại
              </Link>
              <Link
                to="/my-account"
                className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Xem đơn hàng
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

