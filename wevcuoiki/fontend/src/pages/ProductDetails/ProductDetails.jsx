// src/pages/ProductDetails/ProductDetails.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarRegular, faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faCartShopping, faEye, faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { getProductDetailsBySlugOrId } from "../../services/ProductService";
import { addToCart as addToCartAPI } from "../../services/CartService";
import { addToWishlist, removeFromWishlistByProductId, checkProductInWishlist } from "../../services/WishlistService";
import CartDrawer from "../../components/Cart/CartDrawer";
import { isLoggedIn } from "../../services/AuthService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const Star = ({ filled }) => (
  <FontAwesomeIcon
    icon={faStarRegular}
    className={filled ? "text-yellow-500" : "text-neutral-300"}
  />
);

export default function ProductDetails() {
  const { slugOrId } = useParams();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  const [activeImg, setActiveImg] = useState("");
  const thumbContainerRef = useRef(null);

  const [qty, setQty] = useState(1);
  const [isWished, setIsWished] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItem, setCartItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getProductDetailsBySlugOrId(slugOrId);
        if (!mounted) return;

        const imagesArr = Array.isArray(data?.images) ? data.images : [];
        const sorted = imagesArr
          .slice()
          .sort(
            (a, b) =>
              (b?.isPrimary ? 1 : 0) - (a?.isPrimary ? 1 : 0) ||
              (a?.position ?? 0) - (b?.position ?? 0)
          );

        const firstImg = sorted?.[0]?.url || imagesArr?.[0]?.url || "";

        const variantsArr = Array.isArray(data?.variants) ? data.variants : [];
        const firstColor = variantsArr.find((v) => v?.color)?.color ?? null;

        setP(data);
        setActiveImg(firstImg);
        setSelectedColor(firstColor);
        setSelectedSize(null);
        setQty(1);
      } catch (err) {
        if (mounted) setError(err?.message || "Không tải được sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slugOrId]);

  // Check if product is in wishlist
  useEffect(() => {
    if (!p || !isLoggedIn()) {
      setIsWished(false);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const productId = p?.idProducts ?? p?.IdProducts;
        const result = await checkProductInWishlist(productId);
        if (mounted) {
          setIsWished(result?.isInWishlist || false);
        }
      } catch (err) {
        // Ignore errors
        if (mounted) setIsWished(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [p]);

  const images = useMemo(() => {
    const arr = Array.isArray(p?.images) ? p.images : [];
    return arr
      .map((x) => ({
        url: x?.url || x?.Url || "",
        isPrimary: !!(x?.isPrimary ?? x?.IsPrimary),
        position: x?.position ?? x?.Position ?? 0,
        color: x?.color ?? x?.Color ?? null,
      }))
      .filter((x) => !!x.url)
      .sort(
        (a, b) =>
          (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.position - b.position
      );
  }, [p]);

  const variants = useMemo(() => {
    const arr = Array.isArray(p?.variants) ? p.variants : [];
    return arr.map((v) => ({
      id:
        v?.idProductVariants ??
        v?.IdProductVariants ??
        v?.id_product_variants ??
        null,
      color: v?.color ?? v?.Color ?? null,
      size: v?.size ?? v?.Size ?? null,
      stock: Number(v?.stockQuantity ?? v?.StockQuantity ?? 0),
      price: v?.price ?? v?.Price ?? null,
      salePrice: v?.salePrice ?? v?.SalePrice ?? null,
      status: v?.status ?? v?.Status ?? null,
      sku: v?.sku ?? v?.Sku ?? null,
    }));
  }, [p]);

  const colors = useMemo(() => {
    const set = new Set();
    variants.forEach((v) => v.color && set.add(v.color));
    return Array.from(set);
  }, [variants]);

  const sizesForColor = useMemo(() => {
    if (!selectedColor) return [];
    const map = new Map(); // size -> stock
    variants
      .filter((v) => v.color === selectedColor)
      .forEach((v) => {
        if (!v.size) return;
        map.set(v.size, (map.get(v.size) || 0) + (v.stock ?? 0));
      });
    return Array.from(map.entries()).map(([size, stock]) => ({ size, stock }));
  }, [variants, selectedColor]);

  const matchedVariant = useMemo(() => {
    return (
      variants.find(
        (v) =>
          (selectedColor ? v.color === selectedColor : true) &&
          (selectedSize ? v.size === selectedSize : true)
      ) || null
    );
  }, [variants, selectedColor, selectedSize]);

  const stock = useMemo(() => {
    if (matchedVariant) return matchedVariant.stock ?? 0;
    const total = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
    return total || Number(p?.stockQuantity ?? p?.StockQuantity ?? 0);
  }, [matchedVariant, variants, p]);

  const price = useMemo(() => {
    const base = Number(p?.price ?? p?.Price ?? 0);
    const saleP = p?.salePrice ?? p?.SalePrice ?? null;

    const vPrice = matchedVariant?.price != null ? Number(matchedVariant.price) : null;
    const vSale = matchedVariant?.salePrice != null ? Number(matchedVariant.salePrice) : null;

    const finalBase = vPrice != null ? vPrice : base;
    const finalSale = vSale != null ? vSale : saleP != null ? Number(saleP) : 0;

    const hasSale = finalSale > 0 && finalSale < finalBase;
    return { base: finalBase, sale: finalSale, hasSale };
  }, [p, matchedVariant]);

  const rating = Number(p?.averageRating ?? p?.AverageRating ?? 0);
  const reviewCount = Number(p?.reviewCount ?? p?.ReviewCount ?? 0);
  const soldQuantity = Number(p?.soldQuantity ?? p?.SoldQuantity ?? 0);

  const inStock = stock > 0;

  const canAddToCart =
    inStock && selectedColor && (sizesForColor.length === 0 || selectedSize);

  const colorThumb = (c) =>
    images.find(
      (x) =>
        x.color &&
        String(x.color).toLowerCase() === String(c).toLowerCase()
    )?.url ||
    images?.[0]?.url ||
    "";

  const onPickColor = (c) => {
    setSelectedColor(c);

    const img = colorThumb(c);
    if (img) setActiveImg(img);

    const map = new Map();
    variants
      .filter((v) => v.color === c)
      .forEach((v) => {
        if (!v.size) return;
        map.set(v.size, (map.get(v.size) || 0) + (v.stock ?? 0));
      });

    const firstAvailable =
      Array.from(map.entries()).find(([, st]) => st > 0)?.[0] ?? null;

    setSelectedSize(firstAvailable);
    setQty(1);
  };

  const onPickSize = (s) => {
    setSelectedSize(s);
    setQty(1);
  };

  const maxQty = useMemo(() => {
    if (!inStock) return 0;
    if (sizesForColor.length > 0) {
      if (!selectedColor) return 0;
      if (!selectedSize) return 0;
      return matchedVariant?.stock ?? 0;
    }
    return stock;
  }, [inStock, sizesForColor.length, selectedColor, selectedSize, matchedVariant, stock]);

  useEffect(() => {
    setQty((q) => clamp(q, 1, Math.max(1, maxQty || 1)));
  }, [maxQty]);

  const addToCart = async () => {
    if (!isLoggedIn()) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return;
    }

    try {
      const idProducts = p?.idProducts ?? p?.IdProducts;
      await addToCartAPI(idProducts, qty, selectedColor || null, selectedSize || null);

      // Tạo cartItem để hiển thị trong drawer (tạm thời, sẽ được thay bằng dữ liệu từ API)
      setCartItem({
        idProducts,
        name: p?.name ?? p?.Name ?? "",
        image: activeImg || thumbImages[0]?.url || "/assets/img/no-image.jpg",
        price: price.base,
        salePrice: price.hasSale ? price.sale : null,
        qty,
        color: selectedColor,
        size: selectedSize,
      });

      setIsCartOpen(true);
      
      // Trigger cart update event để Header refresh cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (err) {
      alert(err.message || "Không thể thêm sản phẩm vào giỏ hàng");
    }
  };

  const buyNow = () => {
    const payload = {
      idProducts: p?.idProducts ?? p?.IdProducts,
      idProductVariants: matchedVariant?.id ?? null,
      qty,
      color: selectedColor,
      size: selectedSize,
    };
    console.log("buyNow", payload);
  };

  const thumbImages = images.length ? images : [{ url: "/assets/img/no-image.jpg" }];

  const incQty = () => setQty((q) => clamp(q + 1, 1, Math.max(1, maxQty || 1)));
  const decQty = () => setQty((q) => clamp(q - 1, 1, Math.max(1, maxQty || 1)));

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10">
        <div className="h-[520px] rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
      </div>
    );
  }

  if (error || !p) {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {error || "Không tìm thấy sản phẩm."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-10">
      <div className="grid gap-8 lg:grid-cols-[96px_1fr_420px]">
        {/* THUMBS LEFT - SCROLLABLE */}
        <div className="hidden lg:flex flex-col items-center">
          <div
            ref={thumbContainerRef}
            className="no-scrollbar flex w-full flex-col gap-2 overflow-y-auto scroll-smooth"
            style={{ maxHeight: "520px" }}
          >
            {thumbImages.map((img, idx) => {
              const url = img?.url;
              const active = (activeImg || thumbImages[0]?.url) === url;
              return (
                <button
                  key={`${url}-${idx}`}
                  type="button"
                  onClick={() => {
                    setActiveImg(url);
                    // Auto scroll to active thumbnail
                    if (thumbContainerRef.current) {
                      const button = thumbContainerRef.current.children[idx];
                      if (button) {
                        button.scrollIntoView({ behavior: "smooth", block: "nearest" });
                      }
                    }
                  }}
                  className={`aspect-square w-full shrink-0 overflow-hidden rounded-xl border transition ${
                    active
                      ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN IMAGE */}
        <div>
          <div className="relative overflow-hidden rounded-2xl bg-neutral-100">
            <div className="aspect-[4/5] w-full">
              <img
                src={activeImg || thumbImages[0]?.url}
                alt={p.name}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </div>

            {price.hasSale && (
              <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                SALE
              </span>
            )}
            {stock <= 0 && (
              <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">
                HẾT HÀNG
              </span>
            )}
          </div>

          {/* THUMBS MOBILE */}
          <div className="mt-3 grid grid-cols-5 gap-2 lg:hidden">
            {thumbImages.slice(0, 10).map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImg(img.url)}
                className={`aspect-square overflow-hidden rounded-xl border ${
                  (activeImg || thumbImages[0]?.url) === img.url
                    ? "border-black"
                    : "border-transparent"
                }`}
              >
                <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-primary">
              {p.categoryName || "Danh mục"}
            </div>

            <h1 className="text-2xl font-bold text-neutral-900">{p.name}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} filled={rating >= i + 1} />
                ))}
                <span className="ml-1 font-semibold text-neutral-900">
                  {rating ? rating.toFixed(1) : "0.0"}
                </span>
                <span>({reviewCount})</span>
              </div>
              <span className="text-neutral-300">•</span>
              <div>Đã bán: <span className="font-semibold text-neutral-900">{soldQuantity}</span></div>
            </div>

            {p.shortDescription && (
              <p className="text-sm text-neutral-600">{p.shortDescription}</p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-end gap-3">
            {price.hasSale ? (
              <>
                <div className="text-3xl font-extrabold text-neutral-900">
                  {fmtVND(price.sale)}
                </div>
                <div className="pb-1 text-sm text-neutral-500 line-through">
                  {fmtVND(price.base)}
                </div>
              </>
            ) : (
              <div className="text-3xl font-extrabold text-neutral-900">
                {fmtVND(price.base)}
              </div>
            )}
          </div>

          {/* Color */}
          {colors.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-2 text-sm font-semibold text-neutral-900">
                Màu sắc {selectedColor ? `: ${selectedColor}` : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onPickColor(c)}
                      className={`rounded-lg border px-3 py-1 text-sm font-semibold transition ${
                        active
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      title={c}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size */}
          {colors.length > 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-semibold text-neutral-900">
                  Kích cỡ {selectedSize ? `: ${selectedSize}` : ""}
                </div>
                {!selectedColor && (
                  <span className="text-xs text-neutral-500">
                    Vui lòng chọn màu trước
                  </span>
                )}
              </div>

              {!selectedColor ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                  Vui lòng chọn màu sắc trước khi chọn kích cỡ
                </div>
              ) : sizesForColor.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map(({ size: s, stock: szStock }) => {
                    const active = selectedSize === s;
                    const disabled = (szStock ?? 0) <= 0;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={disabled}
                        onClick={() => onPickSize(s)}
                        className={`rounded-lg border px-3 py-1 text-sm font-semibold transition ${
                          active
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                        title={disabled ? "Hết hàng" : s}
                      >
                        <span className={disabled ? "line-through text-neutral-400" : ""}>
                          {s}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                  Màu này không có size nào
                </div>
              )}
            </div>
          )}

          {/* QTY + STOCK */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-semibold text-neutral-700">
              Tồn kho:{" "}
              <span className="font-bold text-neutral-900">
                {stock > 0 ? stock : "Hết hàng"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-neutral-700">Số lượng</div>

              <div className="inline-flex overflow-hidden rounded-xl border border-neutral-200 bg-white">
                <button
                  type="button"
                  onClick={decQty}
                  disabled={!canAddToCart || qty <= 1}
                  className="grid h-10 w-10 place-items-center text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Giảm"
                >
                  −
                </button>

                <input
                  value={qty}
                  onChange={(e) => {
                    const v = Number(String(e.target.value).replace(/[^\d]/g, ""));
                    if (!v) return setQty(1);
                    setQty(clamp(v, 1, Math.max(1, maxQty || 1)));
                  }}
                  className="h-10 w-14 border-x border-neutral-200 text-center text-sm font-semibold outline-none"
                  inputMode="numeric"
                />

                <button
                  type="button"
                  onClick={incQty}
                  disabled={!canAddToCart || qty >= Math.max(1, maxQty || 1)}
                  className="grid h-10 w-10 place-items-center text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Tăng"
                >
                  +
                </button>
              </div>

              {canAddToCart && (
                <div className="text-xs text-neutral-500">
                  Tối đa: <span className="font-semibold">{Math.max(1, maxQty || 1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canAddToCart}
              onClick={addToCart}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-black text-[13px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
              title={
                !selectedColor
                  ? "Vui lòng chọn màu sắc"
                  : sizesForColor.length > 0 && !selectedSize
                  ? "Vui lòng chọn kích cỡ"
                  : !inStock
                  ? "Hết hàng"
                  : ""
              }
            >
              <FontAwesomeIcon icon={faCartShopping} />
              Thêm vào giỏ
            </button>

            <button
              type="button"
              disabled={!canAddToCart}
              onClick={buyNow}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-neutral-900 ring-1 ring-black/10 transition hover:bg-neutral-50 hover:ring-black/20 disabled:cursor-not-allowed disabled:opacity-40"
              title={
                !selectedColor
                  ? "Vui lòng chọn màu sắc"
                  : sizesForColor.length > 0 && !selectedSize
                  ? "Vui lòng chọn kích cỡ"
                  : !inStock
                  ? "Hết hàng"
                  : ""
              }
            >
              <FontAwesomeIcon icon={faEye} />
              Mua ngay
            </button>
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={async () => {
              if (!isLoggedIn()) {
                alert("Vui lòng đăng nhập để thêm vào yêu thích");
                return;
              }

              const productId = p?.idProducts ?? p?.IdProducts;

              if (isWished) {
                // Xóa khỏi wishlist
                if (confirm("Bạn có muốn xóa sản phẩm này khỏi danh sách yêu thích?")) {
                  try {
                    await removeFromWishlistByProductId(productId);
                    setIsWished(false);
                    window.dispatchEvent(new CustomEvent("wishlistUpdated"));
                  } catch (err) {
                    alert(err?.message || "Không thể xóa khỏi danh sách yêu thích");
                  }
                }
              } else {
                // Thêm vào wishlist
                if (confirm("Bạn có muốn thêm sản phẩm này vào danh sách yêu thích?")) {
                  try {
                    await addToWishlist(productId);
                    setIsWished(true);
                    window.dispatchEvent(new CustomEvent("wishlistUpdated"));
                  } catch (err) {
                    alert(err?.message || "Không thể thêm vào danh sách yêu thích");
                  }
                }
              }
            }}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-[13px] font-semibold text-neutral-900 transition hover:bg-neutral-50 hover:border-neutral-300 hover:text-red-500"
          >
            <FontAwesomeIcon 
              icon={isWished ? faHeartSolid : faHeartRegular} 
              className={isWished ? "text-red-500" : "text-neutral-700"}
            />
            {isWished ? "Đã yêu thích" : "Thêm vào yêu thích"}
          </button>

          {/* Description */}
          {p.description && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-sm font-bold text-neutral-900">Mô tả sản phẩm</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                {p.description}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            <div>Mã SKU: <span className="font-semibold text-neutral-900">{matchedVariant?.sku || p.sku}</span></div>
            <div className="mt-1">
              Đánh giá:{" "}
              <span className="font-semibold text-neutral-900">
                {rating ? rating.toFixed(1) : "0.0"}
              </span>{" "}
              ({reviewCount})
            </div>
          </div>

          <Link
            to="/collections/all"
            className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
          >
            ← Tiếp tục mua sắm
          </Link>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItem={cartItem}
        onCartUpdate={(cartData) => {
          // Trigger event để Header refresh cart count
          window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cartData }));
        }}
      />
    </div>
  );
}
