// Ưu tiên env, fallback localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy danh sách reviews của sản phẩm
export async function getProductReviews(productId, params = {}) {
  try {
    const { rating } = params;
    
    const qs = new URLSearchParams();
    if (rating != null) qs.set("rating", rating);

    const url = `${API_BASE_URL}/Products/${productId}/reviews${qs.toString() ? `?${qs.toString()}` : ""}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error("Không tải được đánh giá");
    }
    
    return await res.json();
  } catch (err) {
    console.error("Lỗi tải đánh giá", err);
    throw err;
  }
}

