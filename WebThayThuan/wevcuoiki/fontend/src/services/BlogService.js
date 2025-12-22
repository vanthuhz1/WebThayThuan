// Ưu tiên env, fallback localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy tin thời trang từ API bên ngoài (qua backend proxy)
export async function getFashionNewsFromAPI(params = {}) {
  try {
    const { page = 1, pageSize = 10 } = params;
    
    const qs = new URLSearchParams();
    qs.set("page", page);
    qs.set("pageSize", pageSize);

    const res = await fetch(`${API_BASE_URL}/Blogs/fashion-news?${qs.toString()}`);
    if (!res.ok) {
      throw new Error("Không tải được tin thời trang");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải tin thời trang từ API", err);
    throw err;
  }
}

// Lấy danh sách blog posts từ backend
export async function getBlogs(params = {}) {
  try {
    const { page = 1, pageSize = 10 } = params;
    
    const qs = new URLSearchParams();
    qs.set("page", page);
    qs.set("pageSize", pageSize);

    const res = await fetch(`${API_BASE_URL}/Blogs?${qs.toString()}`);
    if (!res.ok) {
      throw new Error("Không tải được bài viết");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải blog", err);
    throw err;
  }
}

// Lấy chi tiết blog post
export async function getBlogById(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/Blogs/${id}`);
    if (!res.ok) {
      throw new Error("Không tải được bài viết");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải blog", err);
    throw err;
  }
}

// Lấy blog post bằng slug
export async function getBlogBySlug(slug) {
  try {
    const res = await fetch(`${API_BASE_URL}/Blogs/by-slug/${slug}`);
    if (!res.ok) {
      throw new Error("Không tải được bài viết");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải blog", err);
    throw err;
  }
}

