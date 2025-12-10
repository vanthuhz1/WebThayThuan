import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { getNavigationData } from "../../services/NavigationService";
import { getProducts } from "../../services/ProductService";
import { NAVIGATION_ITEMS } from "../../constants/navigation";

const Navigation = ({ isScrolled = true, isMobile = false }) => {
  const location = useLocation();
  const [childrenMap, setChildrenMap] = useState({});
  const [hoverId, setHoverId] = useState(null);
  const [hoverChildId, setHoverChildId] = useState(null);
  const [rootMetaMap, setRootMetaMap] = useState({});
  const [previewMap, setPreviewMap] = useState({});

  useEffect(() => {
    const fetchNav = async () => {
      try {
        const data = await getNavigationData();
        const map = {};
        const rootMeta = {};
        data.forEach((root) => {
          map[root.slug] = root.children || [];
          rootMeta[root.slug] = root; // root có idCategories ở đây
        });
        setChildrenMap(map);
        setRootMetaMap(rootMeta);
      } catch (err) {
        console.warn("Navigation API fallback to static items", err);
        setChildrenMap({});
        setRootMetaMap({});
      }
    };
    fetchNav();
  }, []);

  const loadPreviewProducts = async (slug) => {
    if (!slug) return;
    if (previewMap[slug]?.items || previewMap[slug]?.loading) return;

    const root = rootMetaMap[slug];

    const catId =
      root?.idCategories ??
      root?.IdCategories ??
      root?.id_categories ??
      root?.id ??
      root?.Id ??
      null;

    if (!catId) {
      setPreviewMap((prev) => ({ ...prev, [slug]: { loading: false, items: [] } }));
      return;
    }

    setPreviewMap((prev) => ({ ...prev, [slug]: { loading: true, items: [] } }));

    try {
      // API của m là sort (newest/price_asc/...)
      const res = await getProducts({ categoryId: catId, page: 1, pageSize: 3, sort: "newest" });
      const items = res?.items ?? res?.Items ?? [];
      setPreviewMap((prev) => ({
        ...prev,
        [slug]: { loading: false, items: Array.isArray(items) ? items.slice(0, 3) : [] },
      }));
    } catch (err) {
      console.warn("Preview products error", err);
      setPreviewMap((prev) => ({ ...prev, [slug]: { loading: false, items: [] } }));
    }
  };

  // Ưu tiên slug khai báo sẵn trong NAVIGATION_ITEMS (khớp DB); fallback lấy từ path
  const itemsToRender = NAVIGATION_ITEMS.map((item) => {
    const slug = item.slug || (item.path?.startsWith("/") ? item.path.slice(1) : item.path);
    return {
      ...item,
      id: item.path || slug,
      slug,
      children: childrenMap[slug] || [],
      isCollection: item.isCollection ?? true,
    };
  });

  return (
    <nav id="mobile-menu" className="block">
      <ul
        className={`flex list-none p-0 gap-3 md:gap-4 lg:gap-5 items-center flex-wrap ${
          isMobile ? "flex-col items-start" : "justify-center"
        }`}
      >
        {itemsToRender.map((item) => {
          const isCollection = item.isCollection;
          const href = isCollection ? `/collections/${item.slug}` : item.path || "/";
          const isActive = isCollection
            ? location.pathname.startsWith(`/collections/${item.slug}`)
            : location.pathname === (item.path || "/");
          const hasChildren = item.children && item.children.length > 0;
          const rootSlug = item.slug;

          return (
            <li
              key={item.id}
              className="relative"
              onMouseEnter={() => {
                if (!isMobile) {
                  setHoverId(item.id);
                  loadPreviewProducts(rootSlug);
                }
              }}
              onMouseLeave={() => !isMobile && setHoverId(null)}
            >
              {/* ROOT CLICK => /collections/:slug */}
              <Link
                to={href}
                className={`no-underline text-[13px] font-semibold py-2 px-2 flex items-center gap-1 transition-colors relative group ${
                  isActive ? "text-gray-900" : "text-gray-800 hover:text-gray-900"
                }`}
              >
                {item.label}
                {hasChildren && <i className="fa-solid fa-chevron-down text-[10px]"></i>}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                ></span>
              </Link>

              {/* Dropdown for desktop */}
              {hasChildren && !isMobile && hoverId === item.id && (
                <div
                  className="absolute left-0 top-full bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg min-w-[520px] z-[1100] pointer-events-auto"
                  onMouseEnter={() => {
                    setHoverId(item.id);
                    setHoverChildId(null);
                  }}
                  onMouseLeave={() => {
                    setHoverId(null);
                    setHoverChildId(null);
                  }}
                >
                  <div className="flex">
                    {/* Left: level 2 */}
                    <ul className="py-2 space-y-1 w-1/2 border-r border-gray-100">
                      {item.children.map((child) => (
                        <li
                          key={child.id}
                          className="px-4 relative"
                          onMouseEnter={() => setHoverChildId(child.id)}
                        >
                          <Link
                            to={`/collections/${child.slug}`}
                            className="block py-1.5 text-sm text-gray-800 hover:bg-gray-50 hover:text-black rounded"
                          >
                            {child.name}
                          </Link>

                          {hoverChildId === child.id &&
                            child.children &&
                            child.children.length > 0 && (
                              <div className="absolute top-0 left-full ml-2 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg min-w-[220px] py-2 px-3 z-[1101]">
                                <ul className="space-y-1">
                                  {child.children.map((grand) => (
                                    <li key={grand.id}>
                                      <Link
                                        to={`/collections/${grand.slug}`}
                                        className="block py-1 text-sm text-gray-800 hover:text-primary"
                                      >
                                        {grand.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                        </li>
                      ))}
                    </ul>

                    {/* Right: preview products of ROOT */}
                    <div className="w-1/2 py-3 px-4">
                      {previewMap[rootSlug]?.loading ? (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                          Đang tải sản phẩm...
                        </div>
                      ) : (previewMap[rootSlug]?.items || []).length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                          Chưa có sản phẩm
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(previewMap[rootSlug]?.items || []).slice(0, 3).map((p, idx) => {
                            const name = p.name ?? p.Name ?? "Sản phẩm";
                            const price = p.salePrice ?? p.SalePrice ?? p.price ?? p.Price ?? 0;
                            const image =
                              p.thumbnailUrl ??
                              p.ThumbnailUrl ??
                              "/assets/img/no-image.jpg";

                            const pId = p.idProducts ?? p.IdProducts ?? p.id_products;
                            const href = pId ? `/product/${pId}` : "/";

                            return (
                              <Link to={href} key={p.idProducts ?? p.IdProducts ?? idx} className="flex gap-3">
                                <div className="h-14 w-14 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                                  <img
                                    src={image}
                                    alt={name}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                                    {name}
                                  </p>
                                  <p className="text-xs text-primary font-bold mt-1">
                                    {Number(price).toLocaleString("vi-VN")} đ
                                  </p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile nested */}
              {hasChildren && isMobile && (
                <ul className="pl-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link to={`/collections/${child.slug}`} className="block text-gray-700 hover:text-primary">
                        {child.name}
                      </Link>
                      {child.children && child.children.length > 0 && (
                        <ul className="pl-3 mt-1 space-y-1 border-l border-gray-200">
                          {child.children.map((grand) => (
                            <li key={grand.id}>
                              <Link
                                to={`/collections/${grand.slug}`}
                                className="block text-xs text-gray-600 hover:text-primary"
                              >
                                {grand.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
