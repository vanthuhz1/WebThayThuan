import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateCartItem, removeCartItem, clearCart } from "../../services/CartService";
import { isLoggedIn } from "../../services/AuthService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const ShopCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data);
    } catch (err) {
      setError(err?.message || "Không tải được giỏ hàng");
      if (err?.message?.includes("đăng nhập")) {
        navigate("/login?returnUrl=/shop-cart");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/shop-cart");
      return;
    }
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  const handleUpdateQuantity = async (item, delta) => {
    const newQty = (item.quantity || 0) + delta;
    if (newQty < 1) return; // Không cho phép < 1

    try {
      setUpdatingId(item.idCartItems);
      await updateCartItem(item.idCartItems, newQty);
      await loadCart();
    } catch (err) {
      setError(err?.message || "Không cập nhật được số lượng");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (item) => {
    try {
      setUpdatingId(item.idCartItems);
      await removeCartItem(item.idCartItems);
      await loadCart();
    } catch (err) {
      setError(err?.message || "Không xóa được sản phẩm");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      setUpdatingId("all");
      await clearCart();
      await loadCart();
    } catch (err) {
      setError(err?.message || "Không xóa được giỏ hàng");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Giỏ hàng</span>
      </div>

      {/* Title */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            GIỎ HÀNG CỦA BẠN
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {hasItems
              ? `Có ${cart?.totalQuantity || 0} sản phẩm trong giỏ hàng`
              : "Giỏ hàng của bạn đang trống."}
          </p>
        </div>

        {hasItems && (
          <button
            type="button"
            onClick={handleClearCart}
            disabled={updatingId === "all"}
            className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xóa toàn bộ giỏ hàng
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="h-32 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : !hasItems ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-neutral-700">
            Hiện chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link
            to="/collections/all"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Mua thêm sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          {/* Left: Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.idCartItems}
                className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                {/* Image */}
                <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <img
                    src={item.thumbnailUrl || "/assets/img/no-image.jpg"}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      {item.productName}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">
                      {item.color && (
                        <span className="mr-2">Màu: {item.color}</span>
                      )}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      disabled={updatingId === item.idCartItems}
                      className="mt-2 text-xs font-semibold text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Qty control */}
                    <div className="inline-flex h-9 items-stretch overflow-hidden rounded-xl border border-neutral-200 bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        disabled={item.quantity <= 1 || updatingId === item.idCartItems}
                        className={`grid w-9 place-items-center text-neutral-800 transition ${
                          item.quantity <= 1 || updatingId === item.idCartItems
                            ? "cursor-not-allowed opacity-40"
                            : "hover:bg-neutral-50"
                        }`}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <div className="grid w-11 place-items-center border-x border-neutral-200 text-sm font-semibold text-neutral-900">
                        {item.quantity}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item, 1)}
                        disabled={updatingId === item.idCartItems}
                        className="grid w-9 place-items-center text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <div className="text-sm font-bold text-neutral-900">
                        {fmtVND(item.totalPrice)}
                      </div>
                      <div className="text-xs text-neutral-500">
                        Đơn giá: {fmtVND(item.unitPrice)} / sản phẩm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Summary */}
          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-neutral-900">TÓM TẮT ĐƠN HÀNG</h2>

            <div className="mb-3 text-xs text-neutral-500">
              Chưa bao gồm phí vận chuyển. Bạn có thể nhập mã giảm giá ở bước thanh toán.
            </div>

            <div className="mb-4 border-t border-dashed border-neutral-200 pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-700">Tổng tiền hàng</span>
                <span className="text-lg font-extrabold text-neutral-900">
                  {fmtVND(cart?.subTotal || 0)}
                </span>
              </div>
              <div className="mt-1 text-xs text-neutral-500">
                ({cart?.totalQuantity || 0} sản phẩm)
              </div>
            </div>

            <button
              type="button"
              disabled={!hasItems || updatingId !== null}
              className="mb-3 flex w-full items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              TIẾN HÀNH ĐẶT HÀNG
            </button>

            <Link
              to="/collections/all"
              className="mb-4 flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              MUA THÊM SẢN PHẨM
            </Link>

            <div className="space-y-2 border-t border-neutral-200 pt-3 text-xs text-neutral-600">
              <div>Giao hàng nội thành trong 24 giờ.</div>
              <div>Đổi hàng trong vòng 30 ngày.</div>
              <div>Tổng đài hỗ trợ: 0967 284 444 (9:00 - 21:00).</div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ShopCart;
