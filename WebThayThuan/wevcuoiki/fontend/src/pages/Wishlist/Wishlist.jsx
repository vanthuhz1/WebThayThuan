import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHeart as faHeartSolid,
  faCartShopping,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {
  getWishlist,
  removeWishlistItem,
  clearWishlist,
} from "../../services/WishlistService";
import { addToCart } from "../../services/CartService";
import { isLoggedIn } from "../../services/AuthService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const Wishlist = () => {
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const navigate = useNavigate();

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWishlist();
      setWishlist(data);
    } catch (err) {
      setError(err?.message || "Không tải được danh sách yêu thích");
      if (err?.message?.includes("đăng nhập")) {
        navigate("/login?returnUrl=/wishlist");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/wishlist");
      return;
    }
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = wishlist?.items || [];
  const hasItems = items.length > 0;

  const handleRemoveItem = async (item) => {
    try {
      setUpdatingId(item.idWishlistItems);
      await removeWishlistItem(item.idWishlistItems);
      await loadWishlist();
      window.dispatchEvent(new CustomEvent("wishlistUpdated"));
    } catch (err) {
      setError(err?.message || "Không xóa được sản phẩm");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm("Bạn có chắc muốn xóa toàn bộ danh sách yêu thích?")) return;
    try {
      setUpdatingId("all");
      await clearWishlist();
      await loadWishlist();
      window.dispatchEvent(new CustomEvent("wishlistUpdated"));
    } catch (err) {
      setError(err?.message || "Không xóa được danh sách yêu thích");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddToCart = async (item) => {
    try {
      setUpdatingId(item.idProducts);
      await addToCart(item.idProducts, 1, null, null);
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      alert("Đã thêm sản phẩm vào giỏ hàng!");
    } catch (err) {
      alert(err?.message || "Không thể thêm vào giỏ hàng");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Danh sách yêu thích</span>
      </div>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900">
            <FontAwesomeIcon icon={faHeartSolid} className="text-red-500" />
            DANH SÁCH YÊU THÍCH
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {hasItems
              ? `Có ${wishlist?.totalItems || 0} sản phẩm trong danh sách yêu thích`
              : "Danh sách yêu thích của bạn đang trống."}
          </p>
        </div>

        {hasItems && (
          <button
            type="button"
            onClick={handleClearWishlist}
            disabled={updatingId === "all"}
            className="text-sm font-semibold text-red-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xóa toàn bộ
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        // LIST DỌC (skeleton theo hàng)
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[140px] animate-pulse rounded-2xl bg-neutral-100"
            />
          ))}
        </div>
      ) : !hasItems ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
          <FontAwesomeIcon
            icon={faHeartSolid}
            className="mx-auto mb-4 text-5xl text-neutral-300"
          />
          <p className="text-sm font-semibold text-neutral-700">
            Hiện chưa có sản phẩm nào trong danh sách yêu thích.
          </p>
          <Link
            to="/collections/all"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        // HIỂN THỊ DỌC: mỗi item là 1 hàng, layout ngang
        <div className="flex flex-col gap-4">
          {items.map((item) => {
            const hasSale = item.salePrice && item.salePrice < item.price;
            const inStock = item.stockQuantity > 0;

            return (
              <div
                key={item.idWishlistItems}
                className="group flex overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* LEFT: IMAGE */}
                <Link
                  to={`/product/${item.idProducts}`}
                  className="relative h-[140px] w-[110px] flex-shrink-0 overflow-hidden bg-neutral-100 sm:h-[160px] sm:w-[130px]"
                >
                  <img
                    src={item.thumbnailUrl || "/assets/img/no-image.jpg"}
                    alt={item.productName}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    loading="lazy"
                  />
                  {!inStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="text-xs font-bold text-white">
                        Hết hàng
                      </span>
                    </div>
                  )}
                </Link>

                {/* RIGHT: CONTENT */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/product/${item.idProducts}`}
                      className="line-clamp-2 text-sm font-semibold text-neutral-900 hover:text-primary"
                    >
                      {item.productName}
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      disabled={updatingId === item.idWishlistItems}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Xóa khỏi yêu thích"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasSale ? (
                      <>
                        <span className="text-base font-bold text-primary">
                          {fmtVND(item.salePrice)}
                        </span>
                        <span className="text-sm text-neutral-500 line-through">
                          {fmtVND(item.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-base font-bold text-neutral-900">
                        {fmtVND(item.price)}
                      </span>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={!inStock || updatingId === item.idProducts}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
                      title={!inStock ? "Sản phẩm hết hàng" : "Thêm vào giỏ hàng"}
                    >
                      <FontAwesomeIcon icon={faCartShopping} className="text-xs" />
                      Thêm giỏ hàng
                    </button>

                    <Link
                      to={`/product/${item.idProducts}`}
                      className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
