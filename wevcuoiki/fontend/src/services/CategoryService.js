const API_BASE_URL = "https://localhost:7194/api";

// Lấy danh sách categories
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE_URL}/Categories/children`);
    if (!res.ok) {
      throw new Error("Lỗi tải danh mục");
    }
    return await res.json();
  } catch (err) {
    console.error("Không kết nối được API", err);
    throw err;
  }
}

// Lấy category tree
export async function getCategoryTree() {
  try {
    const res = await fetch(`${API_BASE_URL}/Categories/tree`);
    if (!res.ok) {
      throw new Error("Lỗi tải category tree");
    }
    return await res.json();
  } catch (err) {
    console.error("Không kết nối được API", err);
    throw err;
  }
}

