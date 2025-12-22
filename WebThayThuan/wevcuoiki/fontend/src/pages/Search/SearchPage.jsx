// src/pages/Search/SearchPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getProducts } from "../../services/ProductService";
import ProductCard from "../../components/Product/ProductCard";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "featured", label: "Sản phẩm nổi bật" },
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
  hồng: "#ec4899",
  hong: "#ec4899",
  pink: "#ec4899",
  xám: "#6b7280",
  xam: "#6b7280",
  gray: "#6b7280",
  grey: "#6b7280",
};

const getColorHex = (color) => {
  if (!color) return "#e5e7eb";
  const normalized = String(color).toLowerCase().trim();
  return COLOR_HEX_MAP[normalized] || "#e5e7eb";
};

const buildPages = (current, total) => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  if (end < total) pages.push(total);
  return pages;
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("featured");
  const [priceKey, setPriceKey] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Reset page when keyword changes
  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!keyword || keyword.trim() === "") {
        if (mounted) {
          setItems([]);
          setTotalPages(1);
          setTotalItems(0);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const pr = PRICE_RANGES.find((x) => x.key === priceKey) || null;

        // Map "featured" to "newest" since backend doesn't support featured
        const sortValue = sort === "featured" ? "newest" : sort;

        const res = await getProducts({
          page,
          pageSize: PAGE_SIZE,
          keyword: keyword.trim(),
          sort: sortValue,
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
  }, [keyword, page, sort, priceKey, selectedColors, selectedSizes]);

  const pages = useMemo(() => buildPages(page, totalPages), [page, totalPages]);

  const toggleInList = (value, setter) => {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
    setPage(1);
  };

  const resetFilters = () => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceKey(null);
    setSort("featured");
    setPage(1);
  };

  const toggleFilter = (filterName) => {
    setShowFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Extract unique colors and sizes from items
  const availableColors = useMemo(() => {
    const colors = [];
    items.forEach((item) => {
      const itemColors = item?.availableColors ?? item?.AvailableColors ?? [];
      if (Array.isArray(itemColors)) {
        colors.push(...itemColors);
      }
    });
    return uniq(colors);
  }, [items]);

  const availableSizes = useMemo(() => {
    const sizes = [];
    items.forEach((item) => {
      const itemSizes = item?.availableSizes ?? item?.AvailableSizes ?? [];
      if (Array.isArray(itemSizes)) {
        sizes.push(...itemSizes);
      }
    });
    return uniq(sizes);
  }, [items]);

  if (!keyword || keyword.trim() === "") {
    return (
      <div className="mx-auto max-w-7xl px-3 py-10">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Tìm kiếm sản phẩm</h1>
          <p className="text-neutral-600">Nhập từ khóa vào ô tìm kiếm để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-3 py-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
          <Link to="/" className="hover:text-neutral-900">
            Trang chủ
          </Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          <span className="text-neutral-900">Tìm kiếm: "{keyword}"</span>
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Kết quả tìm kiếm cho "{keyword}"
        </h1>
        {!loading && (
          <p className="text-sm text-neutral-600 mt-2">
            Tìm thấy {totalItems} {totalItems === 1 ? "sản phẩm" : "sản phẩm"}
          </p>
        )}
      </div>

      {/* Filters & Sort */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition"
        >
          Bộ lọc
          <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} className="text-xs" />
        </button>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-300"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {(selectedColors.length > 0 || selectedSizes.length > 0 || priceKey) && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-neutral-200 bg-white p-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Price Range */}
            <div>
              <div className="mb-2 text-sm font-semibold text-neutral-900">Khoảng giá</div>
              <div className="space-y-2">
                {PRICE_RANGES.map((pr) => (
                  <label key={pr.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceKey === pr.key}
                      onChange={() => {
                        setPriceKey(priceKey === pr.key ? null : pr.key);
                        setPage(1);
                      }}
                      className="h-4 w-4 text-neutral-900 focus:ring-neutral-300"
                    />
                    <span className="text-sm text-neutral-700">{pr.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Colors */}
            {availableColors.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-900">Màu sắc</div>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((c) => {
                    const isSelected = selectedColors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleInList(c, setSelectedColors)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sizes */}
            {availableSizes.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-neutral-900">Kích cỡ</div>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((s) => {
                    const isSelected = selectedSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleInList(s, setSelectedSizes)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-50"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white p-6 text-center text-neutral-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center">
          <p className="text-lg font-semibold text-neutral-900 mb-2">
            Không tìm thấy sản phẩm nào
          </p>
          <p className="text-sm text-neutral-600 mb-4">
            Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc
          </p>
          <Link
            to="/collections/all"
            className="inline-block rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Xem tất cả sản phẩm
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 mb-8">
            {items.map((item) => (
              <ProductCard
                key={item.idProducts ?? item.IdProducts}
                id={item.idProducts ?? item.IdProducts}
                slug={item.slug ?? item.Slug}
                name={item.name ?? item.Name}
                price={item.price ?? item.Price}
                salePrice={item.salePrice ?? item.SalePrice}
                thumbnailUrl={item.thumbnailUrl ?? item.ThumbnailUrl}
                rating={item.averageRating ?? item.AverageRating}
                reviewCount={item.reviewCount ?? item.ReviewCount}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Trước
              </button>
              {pages.map((p, idx) =>
                p === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-neutral-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      p === page
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

