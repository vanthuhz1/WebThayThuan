import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faEye } from "@fortawesome/free-solid-svg-icons";
import QuickViewModal from "./QuickViewModal";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

export default function ProductCard({
  id,
  name = "Tên sản phẩm",
  price = 0,
  salePrice = 0,
  images = [],
  imagesByColor,
  colors = [],
  stockQuantity = 0,
  createdAt,
  newWithinDays = 14,
  onQuickBuy,
}) {
  const [selectedColor, setSelectedColor] = useState(
    colors?.[0]?.value ?? colors?.[0]?.code ?? colors?.[0]?.name ?? null
  );
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const isSoldOut = Number(stockQuantity ?? 0) <= 0;

  const hasSale =
    Number(price ?? 0) > 0 && Number(salePrice ?? 0) > 0 && salePrice < price;

  const discountPercent = useMemo(() => {
    if (!hasSale) return 0;
    return Math.round((1 - salePrice / price) * 100);
  }, [hasSale, salePrice, price]);

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

  const swatches = (colors || [])
    .map((c) => {
      const value = c.value ?? c.code ?? c.name;
      const thumb =
        (imagesByColor && value && imagesByColor[value]?.[0]) ||
        c.imageUrl ||
        null;
      return {
        key: String(value ?? c.name ?? ""),
        value,
        name: c.name ?? String(value ?? ""),
        hex: c.hex,
        thumb,
      };
    })
    .filter((x) => x.key);

  return (
    // GIẢM ĐỒNG BỘ: 326x418 -> 300x392 (nhỏ hơn ~8%)
    <div className="group relative h-[392px] w-[300px] overflow-hidden bg-white">
      {/* border ONLY on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100 border border-[#BFD8B8]" />

      {/* reserve bar height 38px */}
      <div className="h-full pb-[38px]">
        {/* IMAGE: 270 -> 248, giữ layout y hệt */}
        <div className="relative mx-auto mt-3 h-[248px] w-[248px] overflow-hidden bg-[#F3F4F6]">
          <Link to={href} className="block h-full w-full">
            {img0 ? (
              <>
                <img
                  src={img0}
                  alt={name}
                  className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
                  loading="lazy"
                />
                {img1 && img1 !== img0 && (
                  <img
                    src={img1}
                    alt={name}
                    className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    loading="lazy"
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 bg-neutral-200" />
            )}
          </Link>

          {hasSale && (
              <div className="pointer-events-none absolute left-3 top-3 z-10">
                <span className="inline-flex h-[22px] min-w-[48px] items-center justify-center rounded-full bg-red-500 px-2 text-[10px] font-semibold text-white">
                  -{discountPercent}%
                </span>
              </div>
            )}

          {isSoldOut && (
            <div className="pointer-events-none absolute right-0 top-0 z-10">
              <span className="inline-flex items-center justify-center bg-white px-3 py-1.5 text-[12px] font-normal text-neutral-700">
                Hết hàng
              </span>
            </div>
          )}

          {isNew && (
            <div className="pointer-events-none absolute left-3 top-[44px] z-10">
              <span className="inline-flex h-[20px] min-w-[44px] items-center justify-center rounded-full bg-neutral-700 px-2 text-[9px] font-semibold text-white">
                NEW
              </span>
            </div>
          )}

        </div>

        {/* SWATCHES: giảm nhẹ 26 -> 22 để đồng bộ */}
        <div className="flex h-[34px] w-full items-center justify-center">
          {swatches.length > 0 && (
            <div className="flex items-center justify-center gap-2">
              {swatches.slice(0, 4).map((c) => {
                const active = selectedColor === c.value;
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
                    className={`h-[22px] w-[22px] overflow-hidden rounded-full border bg-white transition ${
                      active
                        ? "border-black/60"
                        : "border-black/15 hover:border-black/35"
                    }`}
                  >
                    {c.thumb ? (
                      <img
                        src={c.thumb}
                        alt={c.name}
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
            </div>
          )}
        </div>

        {/* INFO: giảm font nhẹ để khớp tỉ lệ */}
        <div className="w-full text-center">
          <Link to={href} className="block">
            <div className="mx-auto max-w-[280px] text-[13px] font-normal text-neutral-900 line-clamp-1">
              {name}
            </div>
          </Link>

          <div className="mt-1 flex items-end justify-center gap-2">
            {hasSale ? (
              <>
                <div className="text-[13px] font-bold text-neutral-900">
                  {fmtVND(salePrice)}
                </div>
                <div className="text-[12px] text-neutral-400 line-through">
                  {fmtVND(price)}
                </div>
              </>
            ) : (
              <div className="text-[13px] font-bold text-neutral-900">
                {fmtVND(price)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTION BAR: giữ đúng 38px như yêu cầu */}
      <div className="absolute inset-x-0 bottom-0 z-20 translate-y-full opacity-0 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-2 bg-black text-white">
          <button
            type="button"
            disabled={isSoldOut}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onQuickBuy) onQuickBuy({ id, selectedColor });
              else setIsQuickViewOpen(true);
            }}
            className="flex h-[38px] items-center justify-center gap-2 text-[12px] font-normal transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-600"
          >
            <FontAwesomeIcon icon={faCartShopping} className="text-[11px]" />
            Mua nhanh
          </button>

          <Link
            to={href}
            className="flex h-[38px] items-center justify-center gap-2 border-l border-white/30 text-[12px] font-normal transition hover:bg-neutral-900"
          >
            <FontAwesomeIcon icon={faEye} className="text-[11px]" />
            Xem chi tiết
          </Link>
        </div>
      </div>

      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        productId={id}
        initialColor={selectedColor}
      />
    </div>
  );
}
