// src/pages/Collections/CollectionPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getCategoryBySlug } from "../../services/CategoryService";
import { getProducts } from "../../services/ProductService";
import { getNavigationData } from "../../services/NavigationService";
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

  const [sort, setSort] = useState("featured");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceKey, setPriceKey] = useState(null);
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Collapsible filter states
  const [expandedFilters, setExpandedFilters] = useState({
    categories: false,
    price: false,
    color: false,
    size: true, // Size is expanded by default
  });

  // Load category info and navigation data
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Load current category
        if (slug && slug !== "all") {
          const cat = await getCategoryBySlug(slug);
          if (mounted) setCategory(cat);
        } else {
          if (mounted) setCategory(null);
        }
        
        // Load all categories for filter (giữ cấu trúc phân cấp)
        const navData = await getNavigationData();
        if (mounted) {
          const allCategories = [];
          const getCategoryData = (cat, level = 0) => ({
            id: cat.id ?? cat.Id ?? cat.idCategories ?? cat.IdCategories,
            name: cat.name ?? cat.Name,
            slug: cat.slug ?? cat.Slug,
            level, // 0 = root, 1 = child, 2 = grandchild
          });
          
          navData.forEach((root) => {
            allCategories.push(getCategoryData(root, 0));
            const children = root.children ?? root.Children ?? [];
            children.forEach((child) => {
              allCategories.push(getCategoryData(child, 1));
              const grandChildren = child.children ?? child.Children ?? [];
              grandChildren.forEach((grandchild) => {
                allCategories.push(getCategoryData(grandchild, 2));
              });
            });
          });
          setCategories(allCategories);
        }
      } catch (err) {
        console.warn("Failed to load category data", err);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Reset filter khi đổi slug
  useEffect(() => {
    setPage(1);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceKey(null);
    setSort("featured");
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

        // Map "featured" to "newest" since backend doesn't support featured
        const sortValue = sort === "featured" ? "newest" : sort;

        const res = await getProducts({
          page,
          pageSize: PAGE_SIZE,
          categoryId: catId,
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
    setSort("featured");
    setPage(1);
  };

  const toggleFilter = (filterName) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterName]: !prev[filterName],
    }));
  };

  // Separate sizes into text and numeric
  const textSizes = useMemo(() => {
    return facetSizes.filter((s) => /^[A-Z]+$/i.test(String(s).trim()));
  }, [facetSizes]);

  const numericSizes = useMemo(() => {
    return facetSizes.filter((s) => /^\d+$/.test(String(s).trim()));
  }, [facetSizes]);

  const FilterSection = ({ title, isExpanded, onToggle, children }) => (
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-neutral-900">{title}</span>
        <FontAwesomeIcon
          icon={isExpanded ? faChevronUp : faChevronDown}
          className="text-xs text-neutral-600"
        />
      </button>
      {isExpanded && <div className="pb-4">{children}</div>}
    </div>
  );

  const FiltersSidebar = () => (
    <div className="w-full rounded-lg  bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-base font-bold text-neutral-900">Bộ lọc</div>
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs font-semibold text-neutral-600 hover:text-black"
        >
          Xóa bộ lọc
        </button>
      </div>

      {/* Danh mục sản phẩm */}
      <FilterSection
        title="Danh mục sản phẩm"
        isExpanded={expandedFilters.categories}
        onToggle={() => toggleFilter("categories")}
      >
        <div className="space-y-1">
          {categories.length === 0 ? (
            <div className="text-xs text-neutral-500">Chưa có dữ liệu</div>
          ) : (
            categories.map((cat) => {
              const level = cat.level ?? 0;
              const paddingLeft = level === 0 ? "pl-2" : level === 1 ? "pl-5" : "pl-8";
              const fontSize = level === 0 ? "text-xs" : level === 1 ? "text-[11px]" : "text-[10px]";
              const fontWeight = level === 0 ? "font-semibold" : level === 1 ? "font-medium" : "font-normal";
              
              return (
                <Link
                  key={cat.id}
                  to={`/collections/${cat.slug}`}
                  className={`block rounded pr-2 py-1.5 ${paddingLeft} ${fontSize} ${fontWeight} transition hover:bg-neutral-50 ${
                    slug === cat.slug ? "bg-neutral-100 text-neutral-900" : "text-neutral-700"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })
          )}
        </div>
      </FilterSection>

      {/* Khoảng giá */}
      <FilterSection
        title="Khoảng giá"
        isExpanded={expandedFilters.price}
        onToggle={() => toggleFilter("price")}
      >
        <div className="space-y-2">
          {PRICE_RANGES.map((r) => (
            <label
              key={r.key}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-neutral-50"
            >
              <input
                type="radio"
                name="price_range"
                checked={priceKey === r.key}
                onChange={() => {
                  setPriceKey(r.key);
                  setPage(1);
                }}
                className="h-3.5 w-3.5"
              />
              <span className="text-xs font-medium text-neutral-800">{r.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Màu sắc */}
      <FilterSection
        title="Màu sắc"
        isExpanded={expandedFilters.color}
        onToggle={() => toggleFilter("color")}
      >
        <div className="flex flex-wrap gap-2">
          {facetColors.length === 0 ? (
            <div className="text-xs text-neutral-500">Chưa có dữ liệu</div>
          ) : (
            facetColors.map((c) => {
              const active = selectedColors.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleInList(c, setSelectedColors)}
                  className={`h-8 w-8 rounded-md border-2 transition ${
                    active ? "border-neutral-900 ring-2 ring-neutral-300" : "border-neutral-300 hover:border-neutral-400"
                  }`}
                  style={{ backgroundColor: getColorHex(c) }}
                  title={c}
                />
              );
            })
          )}
        </div>
      </FilterSection>

      {/* Size */}
      <FilterSection
        title="Size"
        isExpanded={expandedFilters.size}
        onToggle={() => toggleFilter("size")}
      >
        <div className="space-y-3">
          {/* Text sizes */}
          {textSizes.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {textSizes.map((s) => {
                  const active = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleInList(s, setSelectedSizes)}
                      className={`h-8 min-w-[40px] rounded border px-3 text-xs font-semibold transition ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Numeric sizes */}
          {numericSizes.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                {numericSizes.map((s) => {
                  const active = selectedSizes.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleInList(s, setSelectedSizes)}
                      className={`h-8 min-w-[40px] rounded border px-3 text-xs font-semibold transition ${
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {facetSizes.length === 0 && (
            <div className="text-xs text-neutral-500">Chưa có dữ liệu</div>
          )}
        </div>
      </FilterSection>
    </div>
  );

  const categoryName = category?.name ?? category?.Name ?? "Tất cả sản phẩm";

  return (
    <div className="mx-auto  px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm">
        <Link to="/" className="text-neutral-600 hover:text-neutral-900">
          Trang chủ
        </Link>
        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-neutral-400" />
        <span className="text-neutral-900 font-medium">{categoryName}</span>
      </nav>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* LEFT SIDEBAR - FILTERS */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0">
          <FiltersSidebar />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1">
          {/* Header with title and sort */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{categoryName}</h1>
              <p className="mt-1 text-sm text-neutral-600">
                {loading ? "Đang tải..." : `${totalItems} sản phẩm`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-neutral-700">Sắp xếp theo:</label>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PRODUCT GRID */}
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[420px] animate-pulse rounded-2xl bg-neutral-100" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-lg  bg-white px-4 py-12 text-center text-sm font-medium text-neutral-700">
              Không có sản phẩm phù hợp với bộ lọc hiện tại.
              <button
                type="button"
                onClick={resetFilters}
                className="ml-2 text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Xóa bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
                    sizes={p.availableSizes ?? p.AvailableSizes ?? []}
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
                className="grid h-10 w-10 place-items-center rounded-md border border-neutral-300 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page <= 1}
                onClick={() => setPage(1)}
              >
                «
              </button>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-neutral-300 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                    className={`grid h-10 w-10 place-items-center rounded-md border text-sm font-semibold transition ${
                      page === p
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-neutral-300 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page >= totalPages}
                onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
              >
                ›
              </button>
              <button
                className="grid h-10 w-10 place-items-center rounded-md border border-neutral-300 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
              >
                »
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
