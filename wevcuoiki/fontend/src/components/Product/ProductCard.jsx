import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons";
import { faCartShopping, faEye } from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

export default function ProductCard({
  id,
  name = "Tên sản phẩm",
  slug = "#",
  price = 0,
  salePrice = 0,
  images = [],
  imagesByColor,
  colors = [],
  stockQuantity = 0,
  rating,
  reviewCount,
  createdAt,
  newWithinDays = 14,
  isBestSeller,
  onQuickBuy,
}) {
  const [selectedColor, setSelectedColor] = useState(
    colors?.[0]?.value ?? colors?.[0]?.code ?? colors?.[0]?.name ?? null
  );

  const isSoldOut = Number(stockQuantity ?? 0) <= 0;

  const hasSale =
    Number(price ?? 0) > 0 && Number(salePrice ?? 0) > 0 && salePrice < price;

  const discountPercent = useMemo(() => {
    if (!hasSale) return 0;
    return Math.round((1 - salePrice / price) * 100);
  }, [hasSale, salePrice, price]);

  const savings = useMemo(() => {
    if (!hasSale) return 0;
    return Math.max(0, Number(price) - Number(salePrice));
  }, [hasSale, price, salePrice]);

  const isNew = useMemo(() => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return false;
    return daysBetween(new Date(), created) <= Number(newWithinDays);
  }, [createdAt, newWithinDays]);

  const gallery = useMemo(() => {
    if (imagesByColor && selectedColor && imagesByColor[selectedColor]) {
      return imagesByColor[selectedColor];
    }
    return images;
  }, [imagesByColor, selectedColor, images]);

  const img0 = gallery?.[0] || images?.[0] || "";
  const img1 = gallery?.[1] || images?.[1] || img0;

  const href = `/product/${id}`;

  const swatches = (colors || []).map((c) => {
    const value = c.value ?? c.code ?? c.name;
    return {
      key: String(value ?? c.name ?? ""),
      value,
      name: c.name ?? String(value ?? ""),
      hex: c.hex,
      imageUrl: c.imageUrl,
    };
  });

  return (
    <div className="group relative h-[420px] w-[280px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* IMAGE */}
      <div className="relative h-[220px] w-full bg-neutral-100">
        <Link to={href} className="block h-full w-full">
          {img0 ? (
            <>
              <img
                src={img0}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
              />
              {img1 && img1 !== img0 && (
                <img
                  src={img1}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  loading="lazy"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 bg-neutral-200" />
          )}
        </Link>

        {/* BADGES */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          {hasSale && (
            <span className="w-fit rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              -{discountPercent}%
            </span>
          )}
          {isNew && (
            <span className="w-fit rounded-full bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
              NEW
            </span>
          )}
          {isBestSeller && (
            <span className="w-fit rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
              BEST
            </span>
          )}
          {isSoldOut && (
            <span className="w-fit rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-semibold text-white">
              HẾT HÀNG
            </span>
          )}
        </div>

      </div>

      {/* INFO */}
      <div className="h-[152px] w-full px-3 pt-2 pb-12">
        {/* SWATCH = IMAGE THUMB */}
        {swatches.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {swatches.slice(0, 6).map((c) => {
              const active = selectedColor === c.value;

              const thumb =
                (imagesByColor && c.value && imagesByColor[c.value]?.[0]) ||
                c.imageUrl ||
                null;

              return (
                <button
                  key={c.key}
                  type="button"
                  title={c.name}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedColor(c.value);
                  }}
                  className={`h-7 w-7 overflow-hidden rounded-lg ring-1 transition ${
                    active ? "ring-black/40" : "ring-black/10 hover:ring-black/20"
                  }`}
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="block h-full w-full"
                      style={{ backgroundColor: c.hex || "#e5e7eb" }}
                    />
                  )}
                </button>
              );
            })}
            {swatches.length > 6 && (
              <span className="text-xs text-neutral-500">
                +{swatches.length - 6}
              </span>
            )}
          </div>
        )}

        <Link to={href} className="block">
          <div className="min-h-[40px] text-[13px] font-semibold text-neutral-900 line-clamp-2">
            {name}
          </div>
        </Link>

        {Number(rating) > 0 && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-600">
            <span className="inline-flex items-center gap-1 font-semibold text-neutral-900">
              <FontAwesomeIcon icon={faStarRegular} />
              {Number(rating).toFixed(1)}
            </span>
            <span>·</span>
            <span>{Number(reviewCount ?? 0)} đánh giá</span>
          </div>
        )}

        <div className="mt-2 flex items-end gap-2">
          {hasSale ? (
            <>
              <div className="text-[15px] font-bold text-neutral-900">
                {fmtVND(salePrice)}
              </div>
              <div className="text-[12px] text-neutral-500 line-through">
                {fmtVND(price)}
              </div>
            </>
          ) : (
            <div className="text-[15px] font-bold text-neutral-900">
              {fmtVND(price)}
            </div>
          )}
        </div>

        {hasSale && savings > 0 && (
          <div className="mt-1 text-[11px] text-neutral-600">
            Tiết kiệm:{" "}
            <span className="font-semibold text-neutral-900">
              {fmtVND(savings)}
            </span>
          </div>
        )}
      </div>

      {/* ACTIONS */}
      <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-2">
          <button
            type="button"
            disabled={isSoldOut}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickBuy?.({ id, slug, selectedColor });
            }}
            className="flex h-11 items-center justify-center gap-2 bg-black text-[13px] font-semibold text-white transition hover:bg-neutral-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-neutral-400"
          >
            <FontAwesomeIcon icon={faCartShopping} />
            Mua nhanh
          </button>

          <Link
            to={href}
            className="flex h-11 items-center justify-center gap-2 bg-black text-[13px] font-semibold text-white transition hover:bg-neutral-900 active:scale-[0.99]"
          >
            <FontAwesomeIcon icon={faEye} />
            Xem chi tiết
          </Link>
        </div>
      </div>
    </div>
  );
}
