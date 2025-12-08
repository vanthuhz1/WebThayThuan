const API_BASE_URL = "https://localhost:7194/api";

// Lấy danh sách sản phẩm
export async function getProducts(params = {}) {
  try {
    const { categoryId, page = 1, pageSize = 20, search, sortBy, sortOrder } = params;
    let url = `${API_BASE_URL}/Products?page=${page}&pageSize=${pageSize}`;
    
    if (categoryId) url += `&categoryId=${categoryId}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    if (sortOrder) url += `&sortOrder=${sortOrder}`;

    const res = await fetch(url);
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
      throw new Error("Không tải được chi tiết sản phẩm");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải chi tiết sản phẩm", err);
    throw err;
  }
}

