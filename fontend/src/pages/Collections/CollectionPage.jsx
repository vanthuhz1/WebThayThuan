// src/pages/Collections/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getCategoryBySlug } from "../../services/CategoryService";
import { getProducts } from "../../services/ProductService";
import ProductCard from "../../components/Product/ProductCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá: Tăng dần" },
  { value: "price_desc", label: "Giá: Giảm dần" },
  { value: "name_asc", label: "Tên: A → Z" },
  { value: "name_desc", label: "Tên: Z → A" },
];

const PRICE_RANGES = [
  { key: "under_200", label: "Dưới 200,000", min: null, max: 200000 },
  { key: "200_500", label: "Từ 200,000 - 500,000", min: 200000, max: 500000 },
  { key: "500_1000", label: "Từ 500,000 - 1,000,000", min: 500000, max: 1000000 },
  { key: "over_1000", label: "Trên 1,000,000", min: 1000000, max: null },
];

const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const COLOR_HEX_MAP = {
  đen: "#111827",
  den: "#111827",
  black: "#111827",
  trắng: "#f9fafb",
  trang: "#f9fafb",
  white: "#f9fafb",
  đỏ: "#dc2626",
  do: "#dc2626",
  red: "#dc2626",
  xanh: "#2563eb",
  "xanh dương": "#2563eb",
  "xanh lá": "#16a34a",
  green: "#16a34a",
  vàng: "#f59e0b",
  vang: "#f59e0b",
  yellow: "#f59e0b",
  nâu: "#92400e",
  nau: "#92400e",
  brown: "#92400e",
  be: "#e5e7eb",
  beige: "#e5e7eb",
  xám: "#9ca3af",
  xam: "#9ca3af",
  grey: "#9ca3af",
  gray: "#9ca3af",
  hồng: "#ec4899",
  hong: "#ec4899",
  pink: "#ec4899",
  tím: "#8b5cf6",
  tim: "#8b5cf6",
  purple: "#8b5cf6",
};
const getColorHex = (name) => {
  const n = (name || "").trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(n)) return n;
  if (COLOR_HEX_MAP[n]) return COLOR_HEX_MAP[n];
  return "#e5e7eb";
};
const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const buildPages = (current, total) => {
  if (total <= 1) return [];
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = [];
  pages.push(1);
  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");
  pages.push(total);

  return pages;
};

export default function CollectionPage() {
  const { slug } = useParams();

  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [facetColors, setFacetColors] = useState([]);
  const [facetSizes, setFacetSizes] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sort, setSort] = useState("newest");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceKey, setPriceKey] = useState(null);

  // Reset filter khi đổi slug
  useEffect(() => {
    setPage(1);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceKey(null);
    setSort("newest");
  }, [slug]);

  // Lấy facets (màu/size) cho category hiện tại
  useEffect(() => {
    let mounted = true;
    const loadFacets = async () => {
      try {
        let catId = null;
        if (slug !== "all") {
          const cat = await getCategoryBySlug(slug);
          catId =
            cat?.idCategories ??
            cat?.IdCategories ??
            cat?.id_categories ??
            cat?.Id ??
            null;
        }

        const res = await getProducts({
          page: 1,
          pageSize: 500, // chỉ để lấy facets
          categoryId: catId,
        });
        const list = res?.items ?? res?.Items ?? res ?? [];
        if (!mounted) return;

        const colors = [];
        const sizes = [];
        for (const p of list) {
          colors.push(...(p.availableColors ?? p.AvailableColors ?? []));
          sizes.push(...(p.availableSizes ?? p.AvailableSizes ?? []));
        }
        setFacetColors(uniq(colors));
        setFacetSizes(uniq(sizes));
      } catch {
        if (!mounted) return;
        setFacetColors([]);
        setFacetSizes([]);
      }
    };
    loadFacets();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Lấy sản phẩm theo filter (server-side)
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        let catId = null;
        if (slug !== "all") {
          const cat = await getCategoryBySlug(slug);
          catId =
            cat?.idCategories ??
            cat?.IdCategories ??
            cat?.id_categories ??
            cat?.Id ??
            null;
        }

        const pr = PRICE_RANGES.find((x) => x.key === priceKey) || null;

        const res = await getProducts({
          page,
          pageSize: PAGE_SIZE,
          categoryId: catId,
          sort,
          minPrice: pr?.min ?? null,
          maxPrice: pr?.max ?? null,
          colors: selectedColors,
          sizes: selectedSizes,
        });

        const list = res?.items ?? res?.Items ?? res ?? [];
        if (!mounted) return;
        setItems(Array.isArray(list) ? list : []);
        setTotalPages(res?.totalPages ?? res?.TotalPages ?? 1);
        setTotalItems(res?.totalItems ?? res?.TotalItems ?? list.length);
      } catch (err) {
        if (mounted) setError(err?.message || "Không tải được sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [slug, page, sort, priceKey, selectedColors, selectedSizes]);

  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  const toggleInList = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceKey(null);
    setSort("newest");
    setPage(1);
  };

  const FiltersBlock = () => (
    <div className="w-full rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-neutral-900">BỘ LỌC</div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-sm font-semibold text-neutral-700 hover:text-black"
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* MÀU SẮC */}
        <div>
          <div className="mb-2 text-sm font-semibold text-neutral-900">Màu sắc</div>
          <div className="flex flex-wrap gap-2">
            {facetColors.length === 0 ? (
              <div className="text-sm text-neutral-500">Chưa có dữ liệu</div>
            ) : (
              facetColors.map((c) => {
                const active = selectedColors.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleInList(c, setSelectedColors)}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1 transition ${
                      active ? "border-neutral-800 bg-neutral-50" : "border-neutral-200 hover:border-neutral-300"
                    }`}
                    title={c}
                  >
                    <span
                      className="h-6 w-6 rounded-md ring-1 ring-black/10"
                      style={{ backgroundColor: getColorHex(c) }}
                    />
                    <span className="text-xs font-semibold text-neutral-800">{c}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* KÍCH CỠ */}
        <div>
          <div className="mb-2 text-sm font-semibold text-neutral-900">Kích cỡ</div>
          <div className="max-h-[140px] space-y-2 overflow-auto pr-1">
            {facetSizes.length === 0 ? (
              <div className="text-sm text-neutral-500">Chưa có dữ liệu</div>
            ) : (
              facetSizes.map((s) => {
                const active = selectedSizes.includes(s);
                return (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleInList(s, setSelectedSizes)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-neutral-800">{s}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* KHOẢNG GIÁ */}
        <div>
          <div className="mb-2 text-sm font-semibold text-neutral-900">Khoảng giá</div>
          <div className="space-y-2">
            {PRICE_RANGES.map((r) => (
              <label
                key={r.key}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-neutral-50"
              >
                <input
                  type="radio"
                  name="price_range"
                  checked={priceKey === r.key}
                  onChange={() => {
                    setPriceKey(r.key);
                    setPage(1);
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-semibold text-neutral-800">{r.label}</span>
              </label>
            ))}

            <button
              type="button"
              onClick={() => {
                setPriceKey(null);
                setPage(1);
              }}
              className="mt-1 text-sm font-semibold text-neutral-700 hover:text-black"
            >
              Xóa giá
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-6">
      {/* HEADER STATUS */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-neutral-800">
      {loading
        ? "Đang tải sản phẩm..."
        : `Tìm thấy ${totalItems} sản phẩm`}
        </div>
        {priceKey && (
          <div className="text-xs font-semibold text-primary">
            Giá: {PRICE_RANGES.find((x) => x.key === priceKey)?.label}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FILTERS (1 KHỐI) + SORT */}
      <div className="mb-5 flex flex-col gap-3">
        <FiltersBlock />

        <div className="flex items-center justify-end gap-2">
          <div className="text-sm font-semibold text-neutral-800">Sắp xếp theo:</div>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border bg-white px-3 text-sm font-semibold"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* GRID / EMPTY / LOADING */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[420px] w-[280px] animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-12 text-center text-sm font-semibold text-neutral-700">
          Không có sản phẩm phù hợp với bộ lọc hiện tại.
          <button
            type="button"
            onClick={resetFilters}
            className="ml-2 text-primary underline underline-offset-4"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p, idx) => {
            const id = p.idProducts ?? p.IdProducts ?? p.id_products ?? idx;
            return (
              <ProductCard
                key={id}
                id={id}
                name={p.name ?? p.Name}
                slug={p.slug ?? p.Slug}
                price={p.price ?? p.Price ?? 0}
                salePrice={p.salePrice ?? p.SalePrice ?? 0}
                stockQuantity={p.stockQuantity ?? p.StockQuantity ?? 0}
                createdAt={p.createdAt ?? p.CreatedAt}
                rating={p.averageRating ?? p.AverageRating}
                reviewCount={p.reviewCount ?? p.ReviewCount}
                images={[p.thumbnailUrl ?? p.ThumbnailUrl ?? "/assets/img/no-image.jpg"]}
                colors={(p.availableColors ?? p.AvailableColors ?? []).map((c) => ({
                  name: c,
                  value: c,
                }))}
                imagesByColor={p.imagesByColor ?? p.ImagesByColor}
              />
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="grid h-10 w-10 place-items-center rounded border text-sm font-semibold hover:bg-neutral-50 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage(1)}
          >
            «
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded border text-sm font-semibold hover:bg-neutral-50 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))}
          >
            ‹
          </button>

          {pages.map((p, i) =>
            p === "..." ? (
              <div key={`dots-${i}`} className="px-2 text-sm font-semibold text-neutral-500">
                ...
              </div>
            ) : (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`grid h-10 w-10 place-items-center rounded border text-sm font-semibold transition ${
                  page === p ? "bg-neutral-900 text-white" : "hover:bg-neutral-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            className="grid h-10 w-10 place-items-center rounded border text-sm font-semibold hover:bg-neutral-50 disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
          >
            ›
          </button>
          <button
            className="grid h-10 w-10 place-items-center rounded border text-sm font-semibold hover:bg-neutral-50 disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
