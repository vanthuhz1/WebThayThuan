import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCartShopping, faTrash } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { getCart, removeCartItem, updateCartItem } from "../../services/CartService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

export default function CartDrawer({ isOpen, onClose, cartItem, onCartUpdate }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const loadCart = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCart();
        if (!mounted) return;
        setCart(data);
        onCartUpdate?.(data);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || "Không tải được giỏ hàng");
        if (err?.message?.includes("đăng nhập")) setCart(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadCart();
    return () => {
      mounted = false;
    };
  }, [isOpen, onCartUpdate]);

  const handleRemoveItem = async (cartItemId) => {
    try {
      await removeCartItem(cartItemId);
      const data = await getCart();
      setCart(data);
      onCartUpdate?.(data);
    } catch (err) {
      setError(err?.message || "Không xóa được sản phẩm");
    }
  };

  const handleUpdateQuantity = async (cartItemId, newQuantity) => {
    // Không cho phép giảm xuống dưới 1
    if (newQuantity < 1) {
      return;
    }
    try {
      await updateCartItem(cartItemId, newQuantity);
      const data = await getCart();
      setCart(data);
      onCartUpdate?.(data);
    } catch (err) {
      setError(err?.message || "Không cập nhật được số lượng");
    }
  };

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/55 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-full max-w-md bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-neutral-200 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-neutral-900 text-white">
                  <FontAwesomeIcon icon={faCartShopping} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-neutral-900">Giỏ hàng</h2>
                  <p className="text-xs text-neutral-500">
                    {hasItems ? `${cart?.totalQuantity || 0} sản phẩm` : "Chưa có sản phẩm"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-neutral-200 text-neutral-700 transition hover:bg-neutral-50"
                aria-label="Đóng"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {cartItem && (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                ✓ Đã thêm vào giỏ hàng
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
                  <p className="text-sm font-semibold text-neutral-600">Đang tải giỏ hàng...</p>
                </div>
              </div>
            ) : hasItems ? (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.idCartItems}
                    className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5">
                        <img
                          src={item.thumbnailUrl || "/assets/img/no-image.jpg"}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-neutral-900 line-clamp-2">
                            {item.productName}
                          </h3>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.idCartItems)}
                            className="grid h-8 w-8 place-items-center rounded-xl text-red-600 transition hover:bg-red-50"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                          {item.color && (
                            <span className="rounded-full bg-neutral-100 px-2 py-1">
                              Màu: <b className="text-neutral-900">{item.color}</b>
                            </span>
                          )}
                          {item.size && (
                            <span className="rounded-full bg-neutral-100 px-2 py-1">
                              Size: <b className="text-neutral-900">{item.size}</b>
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Qty control */}
                          <div className="inline-flex h-9 items-stretch overflow-hidden rounded-xl border border-neutral-200 bg-white">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.idCartItems, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className={`grid w-10 place-items-center text-neutral-800 transition ${
                                item.quantity <= 1
                                  ? "cursor-not-allowed opacity-40"
                                  : "hover:bg-neutral-50"
                              }`}
                              aria-label="Giảm"
                              title={item.quantity <= 1 ? "Số lượng tối thiểu là 1" : "Giảm số lượng"}
                            >
                              −
                            </button>
                            <div className="grid w-11 place-items-center border-x border-neutral-200 text-sm font-bold text-neutral-900">
                              {item.quantity}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.idCartItems, item.quantity + 1)}
                              className="grid w-10 place-items-center text-neutral-800 transition hover:bg-neutral-50"
                              aria-label="Tăng"
                              title="Tăng số lượng"
                            >
                              +
                            </button>
                          </div>

                          {/* Price */}
                          <div className="text-right">
                            <div className="text-[13px] font-bold text-neutral-900">
                              {fmtVND(item.totalPrice)}
                            </div>
                            {item.unitPrice != null && (
                              <div className="text-[11px] text-neutral-500">
                                {fmtVND(item.unitPrice)} / sp
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Summary */}
                <div className="mt-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-neutral-700">Tổng tiền tạm tính</div>
                      <div className="text-xs text-neutral-500">
                        {cart?.totalQuantity || 0} sản phẩm
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-neutral-900">
                      {fmtVND(cart?.subTotal || 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-neutral-100 text-neutral-400">
                    <FontAwesomeIcon icon={faCartShopping} className="text-2xl" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-700">Giỏ hàng trống</p>
                  <p className="mt-1 text-xs text-neutral-500">Thêm sản phẩm để bắt đầu mua sắm.</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-neutral-200 bg-white p-5">
            <div className="grid gap-2">
              <Link
                to="/shop-cart"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white transition hover:opacity-90"
              >
                Xem chi tiết giỏ hàng
              </Link>

              <Link
                to="/order"
                onClick={onClose}
                className={`inline-flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  hasItems
                    ? "border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-50"
                    : "pointer-events-none border-neutral-200 bg-neutral-100 text-neutral-400"
                }`}
              >
                Tiến hành đặt hàng
              </Link>

              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
