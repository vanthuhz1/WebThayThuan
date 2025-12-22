// src/pages/ProductDetails/ProductDetails.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarRegular, faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { faCartShopping, faEye, faHeart as faHeartSolid, faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons";
import { getProductDetailsBySlugOrId, getRelatedProducts } from "../../services/ProductService";
import { addToCart as addToCartAPI } from "../../services/CartService";
import { addToWishlist, removeFromWishlistByProductId, checkProductInWishlist } from "../../services/WishlistService";
import { getProductReviews } from "../../services/ReviewService";
import ProductCard from "../../components/Product/ProductCard";
import CartDrawer from "../../components/Cart/CartDrawer";
import { isLoggedIn } from "../../services/AuthService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const Star = ({ filled }) => (
  <FontAwesomeIcon
    icon={filled ? faStarSolid : faStarRegular}
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
  const [activeTab, setActiveTab] = useState("description");
  const [reviewFilter, setReviewFilter] = useState("all"); // all, 5, 4, 3, 2, 1, withComment, withMedia, domestic
  const [reviews, setReviews] = useState([]);
  const [allReviews, setAllReviews] = useState([]); // Store all reviews for filtering
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

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

  // Fetch reviews when product changes
  useEffect(() => {
    if (!p) return;

    let mounted = true;
    (async () => {
      try {
        setReviewsLoading(true);
        const productId = p?.idProducts ?? p?.IdProducts;
        const reviewsData = await getProductReviews(productId);
        if (mounted) {
          const reviews = Array.isArray(reviewsData) ? reviewsData : [];
          setAllReviews(reviews);
        }
      } catch (err) {
        console.error("Lỗi tải đánh giá", err);
        if (mounted) {
          setAllReviews([]);
        }
      } finally {
        if (mounted) {
          setReviewsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [p]);

  // Fetch related products when product changes
  useEffect(() => {
    if (!p) return;

    let mounted = true;
    (async () => {
      try {
        setRelatedLoading(true);
        const productId = p?.idProducts ?? p?.IdProducts;
        const related = await getRelatedProducts(productId, 4);
        if (mounted) {
          setRelatedProducts(Array.isArray(related) ? related : []);
        }
      } catch (err) {
        console.error("Lỗi tải sản phẩm liên quan", err);
        if (mounted) {
          setRelatedProducts([]);
        }
      } finally {
        if (mounted) {
          setRelatedLoading(false);
        }
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

  // Filter reviews based on selected filter
  const filteredReviews = useMemo(() => {
    if (!allReviews.length) return [];
    
    let filtered = [...allReviews];
    
    if (reviewFilter === "all") {
      // Show all
    } else if (["5", "4", "3", "2", "1"].includes(reviewFilter)) {
      filtered = filtered.filter(r => r.rating === Number(reviewFilter));
    }
    
    return filtered;
  }, [allReviews, reviewFilter]);

  // Calculate review counts by rating
  const reviewCountsByRating = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating]++;
      }
    });
    return counts;
  }, [allReviews]);


  // Format username to hide part of it
  const formatUsername = (email) => {
    if (!email) return "Người dùng";
    const parts = email.split("@");
    if (parts[0].length <= 2) return parts[0] + "*****";
    return parts[0].substring(0, 1) + "*****" + parts[0].substring(parts[0].length - 1);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

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

      {/* Product Tabs - Moved below product info */}
      <div className="mt-8">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {/* Tab Headers */}
            <div className="flex flex-wrap border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab("description")}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "description"
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Mô tả sản phẩm
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "reviews"
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Đánh Giá - Nhận Xét Từ Khách Hàng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("return")}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "return"
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Chính sách đổi trả
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "privacy"
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Chính sách bảo mật
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("faq")}
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "faq"
                    ? "border-b-2 border-neutral-900 text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Câu hỏi thường gặp
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Description Tab */}
              {activeTab === "description" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2">
                    
                    <h3 className="text-base font-bold text-neutral-900">THÔNG TIN SẢN PHẨM:</h3>
                  </div>
                  <div className="space-y-2 pl-7">
                    <div className="flex items-start gap-2">
                     
                      <div className="text-sm text-neutral-700">
                        <span className="font-semibold">Tên sản phẩm:</span> {p.name || "Chưa có thông tin"}
                      </div>
                    </div>
                    {p.material && (
                      <div className="flex items-start gap-2">
                       
                        <div className="text-sm text-neutral-700">
                          <span className="font-semibold">Chất liệu:</span> {p.material}
                        </div>
                      </div>
                    )}
                    {p.fit && (
                      <div className="flex items-start gap-2">
                       
                        <div className="text-sm text-neutral-700">
                          <span className="font-semibold">Phom dáng:</span> {p.fit}
                        </div>
                      </div>
                    )}
                    {sizesForColor.length > 0 && (
                      <div className="flex items-start gap-2">
                      
                        <div className="text-sm text-neutral-700">
                          <span className="font-semibold">Size:</span> {sizesForColor.map(s => s.size).join(", ")}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                   
                      <div className="text-sm text-neutral-700">
                        <span className="font-semibold">Xuất xứ:</span> Việt Nam
                      </div>
                    </div>
                  </div>
                  {p.description && (
                    <div className="mt-4 whitespace-pre-wrap text-sm text-neutral-700">
                      {p.description}
                    </div>
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-xl font-bold text-neutral-800 mb-6">
                      ĐÁNH GIÁ SẢN PHẨM
                    </h3>
                   
                    
                    {/* Rating Summary */}
                    <div className="flex items-center gap-6 mb-6 pb-6 border-b border-neutral-200">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-orange-600 mb-2">
                          {rating ? rating.toFixed(1) : "0.0"}
                          
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FontAwesomeIcon
                              key={i}
                              icon={rating >= i + 1 ? faStarSolid : faStarRegular}
                              className={rating >= i + 1 ? "text-orange-600" : "text-neutral-300"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Filter Buttons */}
                    <div className="space-y-3 mb-6">
                      {/* Star Rating Filters */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setReviewFilter("all")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "all"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          Tất Cả
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFilter("5")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "5"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          5 Sao ({reviewCountsByRating[5]})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFilter("4")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "4"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          4 Sao ({reviewCountsByRating[4]})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFilter("3")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "3"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          3 Sao ({reviewCountsByRating[3]})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFilter("2")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "2"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          2 Sao ({reviewCountsByRating[2]})
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewFilter("1")}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg border transition ${
                            reviewFilter === "1"
                              ? "bg-red-600 text-white border-red-600"
                              : "bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400"
                          }`}
                        >
                          1 Sao ({reviewCountsByRating[1]})
                        </button>
                      </div>
                    </div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                      <div className="text-center py-12 border-t border-neutral-200">
                        <p className="text-sm text-neutral-500">Đang tải đánh giá...</p>
                      </div>
                    ) : allReviews.length === 0 ? (
                      <div className="text-center py-12 border-t border-neutral-200">
                        <p className="text-sm text-neutral-500 mb-2">
                          Chưa có đánh giá nào cho sản phẩm này.
                        </p>
                        <p className="text-sm text-neutral-500">
                          Hãy là người đầu tiên đánh giá!
                        </p>
                      </div>
                    ) : filteredReviews.length === 0 ? (
                      <div className="text-center py-12 border-t border-neutral-200">
                        <p className="text-sm text-neutral-500">
                          Không có đánh giá nào phù hợp với bộ lọc đã chọn.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6 border-t border-neutral-200 pt-6">
                        {filteredReviews.map((review) => {
                          const userName = review.userName || formatUsername(review.userEmail);
                          
                          return (
                            <div key={review.idProductReviews} className="border-b border-neutral-100 pb-6 last:border-b-0">
                              <div className="flex gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center shrink-0">
                                  <svg className="w-6 h-6 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                
                                {/* Review Content */}
                                <div className="flex-1">
                                  {/* User Info & Rating */}
                                  <div className="mb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-neutral-900">{userName}</span>
                                      <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <FontAwesomeIcon
                                            key={i}
                                            icon={i < review.rating ? faStarSolid : faStarRegular}
                                            className={i < review.rating ? "text-red-600 text-sm" : "text-neutral-300 text-sm"}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <div className="text-xs text-neutral-500 mb-2">
                                      {formatDate(review.createdAt)}
                                    </div>
                                  </div>

                                  {/* Review Text */}
                                  {review.review && (
                                    <p className="text-sm text-neutral-700 mb-3 leading-relaxed">
                                      {review.review}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Return Policy Tab */}
              {activeTab === "return" && (
                <div className="space-y-6 text-sm text-neutral-700">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">CHÍNH SÁCH ÁP DỤNG</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Áp dụng từ ngày 01/09/2018.</li>
                      <li>Trong vòng 30 ngày kể từ ngày mua sản phẩm với các sản phẩm Atino.</li>
                      <li>Áp dụng đối với sản phẩm nguyên giá và sản phẩm giảm giá ít hơn 50%.</li>
                      <li>Sản phẩm nguyên giá chỉ được đổi 01 lần duy nhất sang sản phẩm nguyên giá khác và không thấp hơn giá trị sản phẩm đã mua.</li>
                      <li>Sản phẩm giảm giá/khuyến mại ít hơn 50% được đổi 01 lần sang màu khác hoặc size khác trên cùng 1 mã trong điều kiện còn sản phẩm hoặc theo quy chế chương trình (nếu có). Nếu sản phẩm đổi đã hết hàng khi đó KH sẽ được đổi sang sản phẩm khác có giá trị ngang bằng hoặc cao hơn. Khách hàng sẽ thanh toán phần tiền chênh lệch nếu sản phẩm đổi có giá trị cao hơn sản phẩm đã mua.</li>
                      <li>Chính sách chỉ áp dụng khi sản phẩm còn hóa đơn mua hàng, còn nguyên nhãn mác, thẻ bài đính kèm sản phẩm và sản phẩm không bị dơ bẩn, hư hỏng bởi những tác nhân bên ngoài cửa hàng sau khi mua sản phẩm.</li>
                      <li>Sản phẩm đồ lót và phụ kiện không được đổi trả.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">ĐIỀU KIỆN ĐỔI SẢN PHẨM</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Đổi hàng trong vòng 07 ngày kể từ ngày khách hàng nhận được sản phẩm.</li>
                      <li>Sản phẩm còn nguyên tem, mác và chưa qua sử dụng.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">THỰC HIỆN ĐỔI SẢN PHẨM</h3>
                    <p className="mb-2">Quý khách có thể đổi hàng Online tại hệ thống cửa hàng và đại lý Atino trên toàn quốc. Lưu ý: vui lòng mang theo sản phẩm và phiếu giao hàng.</p>
                    <p className="mb-2">Nếu tại khu vực bạn không có cửa hàng Atino hoặc sản phẩm bạn muốn đổi thì vui lòng làm theo các bước sau:</p>
                    <ol className="space-y-2 list-decimal list-inside ml-4">
                      <li><strong>Bước 1:</strong> Gọi đến Tổng đài: <a href="tel:0964942121" className="text-primary hover:underline">0964942121</a> các ngày trong tuần (trừ ngày lễ), cung cấp mã đơn hàng và mã sản phẩm cần đổi.</li>
                      <li><strong>Bước 2:</strong> Vui lòng gửi hàng đổi về địa chỉ: Kho Online Atino - 1165 Giải Phóng, Thịnh Liệt, Q. Hoàng Mai, Hà Nội.</li>
                      <li><strong>Bước 3:</strong> Atino gửi đổi sản phẩm mới khi nhận được hàng. Trong trường hợp hết hàng, Atino sẽ liên hệ xác nhận.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Privacy Policy Tab */}
              {activeTab === "privacy" && (
                <div className="space-y-6 text-sm text-neutral-700">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Thu thập và sử dụng thông tin của Atino</h3>
                    <p className="mb-2">
                      Atino chỉ thu thập các loại thông tin cơ bản liên quan đến đơn đặt hàng gồm:……
                    </p>
                    <p className="mb-2">
                      Các thông tin này được sử dụng nhằm mục đích xử lý đơn hàng, nâng cao chất lượng dịch vụ, nghiên cứu thị trường, các hoạt động marketing, chăm sóc khách hàng, quản lý nội bộ hoặc theo yêu cầu của pháp luật. Khách hàng tùy từng thời điểm có thể chỉnh sửa lại các thông tin đã cung cấp để đảm bảo được hưởng đầy đủ các quyền mà Atino dành cho Khách hàng của mình.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Atino cam kết:</h3>
                    <ul className="space-y-2 list-disc list-inside">
                      <li>Thông tin cá nhân của khách hàng được sử dụng đúng vào mục đích của việc thu thập và cung cấp;</li>
                      <li>Mọi việc thu thập và sử dụng thông tin đã thu thập được của Khách hàng đều được thông qua ý kiến của Khách hàng;</li>
                      <li>Chỉ sử dụng các thông tin được Khách hàng đã cung cấp cho Atino, không sử dụng các thông tin của Khách hàng được biết đến theo các phương thức khác;</li>
                      <li>Thời gian lưu trữ và bảo mật thông tin;</li>
                      <li>Chỉ cho phép các đối tượng sau được tiếp cận với thông tin của Khách hàng:</li>
                    </ul>
                    <ul className="space-y-1 list-disc list-inside ml-6 mt-2">
                      <li>Người thực hiện việc cung cấp hàng hóa, dịch vụ từ Atino theo yêu cầu của Khách hàng;</li>
                      <li>Người thực hiện việc chăm sóc Khách hàng đã sử dụng hàng hóa, dịch vụ của Atino;</li>
                      <li>Người tiếp nhận và xử lý các thắc mắc của Khách hàng trong quá trình sử dụng hàng hóa, dịch vụ của Atino;</li>
                      <li>Cơ quan Nhà nước có thẩm quyền.</li>
                    </ul>
                    <p className="mt-2">
                      Trong quá trình chào hàng, quảng cáo và chăm sóc Khách hàng, Khách hàng hoàn toàn có thể gửi yêu cầu dừng việc sử dụng thông tin theo cách thức tương ứng mà hoạt động chào hàng, quảng cáo và chăm sóc khách hàng gửi tới Khách hàng.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Cách thức bảo mật thông tin khách hàng</h3>
                    <p className="mb-2">
                      Việc bảo mật các thông tin do Khách hàng cung cấp được dựa trên sự đảm bảo việc tuân thủ của từng cán bộ, nhân viên Atino, đối tác và hệ thống lưu trữ dữ liệu. Trong trường hợp máy chủ lưu trữ thông tin bị hacker tấn công dẫn đến mất mát dữ liệu cá nhân Khách hàng, Atino sẽ có trách nhiệm thông báo vụ việc cho cơ quan chức năng điều tra xử lý kịp thời và thông báo cho Khách hàng được biết. Tuy nhiên, do đặc điểm của môi trường internet, không một dữ liệu nào trên môi trường mạng cũng có thể được bảo mật 100%. Vì vậy, Atino không cam kết chắc chắn rằng các thông tin tiếp nhận từ Khách hàng được bảo mật tuyệt đối.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Trách nhiệm bảo mật thông tin Khách hàng</h3>
                    <p className="mb-2">
                      Khách hàng vui lòng chỉ cung cấp đúng và đủ các thông tin theo yêu cầu của Atino đặc biệt tránh cung cấp các thông tin liên quan đến tài khoản ngân hàng khi chưa được mã hóa thông tin trong các giao dịch thanh toán trực tuyến hoặc các thông tin nhạy cảm khác. Khách hàng hoàn toàn chịu trách nhiệm về tính trung thực và chính xác đối với các thông tin đã cung cấp cũng như tự chịu trách nhiệm nếu cung cấp các thông tin ngoài yêu cầu.
                    </p>
                    <p className="mb-2">
                      Trong trường hợp Khách hàng cung cấp thông tin cá nhân của mình cho nhiều tổ chức, cá nhân khác nhau, Khách hàng phải yêu cầu các bên liên quan cùng bảo mật. Mọi thông tin cá nhân của Khách hàng khi bị tiết lộ gây thiệt hại đến Khách hàng, Khách hàng phải tự xác định được nguồn tiết lộ thông tin. Atino không chịu trách nhiệm khi thông tin Khách hàng bị tiết lộ mà không có căn cứ xác đáng thể hiện Atino là bên tiết lộ thông tin.
                    </p>
                    <p>
                      Atino không chịu trách nhiệm về việc tiết lộ thông tin của Khách hàng nếu Khách hàng không tuân thủ các yêu cầu trên.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900 mb-3">Luật áp dụng khi xảy ra tranh chấp</h3>
                    <p>
                      Mọi tranh chấp xảy ra giữa Khách hàng và Atino sẽ được hòa giải. Nếu hòa giải không thành sẽ được giải quyết tại Tòa án có thẩm quyền và tuân theo pháp luật Việt Nam.
                    </p>
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === "faq" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-neutral-900 mb-4">Câu hỏi thường gặp</h3>
                  <div className="space-y-4">
                    <div className="border-b border-neutral-200 pb-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Sản phẩm có được đổi trả không?</h4>
                      <p className="text-sm text-neutral-700">
                        Có, bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem, mác và chưa qua sử dụng. Xem chi tiết tại tab "Chính sách đổi trả".
                      </p>
                    </div>
                    <div className="border-b border-neutral-200 pb-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Làm sao để chọn size phù hợp?</h4>
                      <p className="text-sm text-neutral-700">
                        Bạn có thể tham khảo bảng size trong phần mô tả sản phẩm hoặc liên hệ hotline 0964942121 để được tư vấn chọn size phù hợp nhất.
                      </p>
                    </div>
                    <div className="border-b border-neutral-200 pb-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Thời gian giao hàng là bao lâu?</h4>
                      <p className="text-sm text-neutral-700">
                        Thời gian giao hàng từ 2-5 ngày làm việc tùy thuộc vào khu vực. Đối với các đơn hàng tại Hà Nội và TP.HCM, thời gian giao hàng có thể nhanh hơn.
                      </p>
                    </div>
                    <div className="pb-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Có hỗ trợ thanh toán khi nhận hàng không?</h4>
                      <p className="text-sm text-neutral-700">
                        Có, chúng tôi hỗ trợ thanh toán COD (Cash on Delivery) cho tất cả các đơn hàng trên toàn quốc.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Sản phẩm liên quan</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {relatedProducts.map((product) => {
              const productId = product.idProducts ?? product.IdProducts;
              const slug = product.slug ?? product.Slug;
              const thumbnail = product.thumbnailUrl ?? product.ThumbnailUrl ?? "/assets/img/no-image.jpg";
              
              return (
                <div key={productId} className="flex-shrink-0">
                  <ProductCard
                    id={productId}
                    slug={slug}
                    name={product.name ?? product.Name}
                    price={product.price ?? product.Price}
                    salePrice={product.salePrice ?? product.SalePrice}
                    images={thumbnail ? [thumbnail] : []}
                    rating={product.averageRating ?? product.AverageRating}
                    reviewCount={product.reviewCount ?? product.ReviewCount}
                    colors={product.availableColors ?? product.AvailableColors ?? []}
                    sizes={product.availableSizes ?? product.AvailableSizes ?? []}
                    stockQuantity={product.stockQuantity ?? product.StockQuantity ?? 0}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

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
