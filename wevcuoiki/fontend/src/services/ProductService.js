// Ưu tiên env, fallback localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy danh sách sản phẩm (hỗ trợ filter backend)
export async function getProducts(params = {}) {
  try {
    const {
      categoryId,
      page = 1,
      pageSize = 12,
      keyword,
      minPrice,
      maxPrice,
      colors,
      sizes,
      sort = "newest",
    } = params;

    const qs = new URLSearchParams();
    qs.set("page", page);
    qs.set("pageSize", pageSize);
    if (categoryId) qs.set("categoryId", categoryId);
    if (keyword) qs.set("keyword", keyword);
    if (minPrice != null) qs.set("minPrice", minPrice);
    if (maxPrice != null) qs.set("maxPrice", maxPrice);
    if (colors && colors.length) qs.set("colors", colors.join(","));
    if (sizes && sizes.length) qs.set("sizes", sizes.join(","));
    if (sort) qs.set("sort", sort);

    const res = await fetch(`${API_BASE_URL}/Products?${qs.toString()}`);
    if (!res.ok) {
      throw new Error("Không tải được sản phẩm");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải sản phẩm", err);
    throw err;
  }
}

// Lấy chi tiết sản phẩm
export async function getProductDetails(productId) {
  try {
    const res = await fetch(`${API_BASE_URL}/Products/${productId}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Không tải được chi tiết sản phẩm");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải chi tiết sản phẩm", err);
    throw err;
  }
}

// Lấy chi tiết sản phẩm bằng slug
export async function getProductDetailsBySlug(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/Products/by-slug/${slug}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Không tải được chi tiết sản phẩm");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải chi tiết sản phẩm", err);
    throw err;
  }
}

// Lấy chi tiết theo slug hoặc id (tự động fallback)
export async function getProductDetailsBySlugOrId(slugOrId) {
  // nếu là số -> thử gọi theo id trước
  const isNumeric = /^\d+$/.test(String(slugOrId || ""));
  if (isNumeric) {
    return getProductDetails(slugOrId);
  }
  // không phải số -> dùng slug
  return getProductDetailsBySlug(slugOrId);
}

