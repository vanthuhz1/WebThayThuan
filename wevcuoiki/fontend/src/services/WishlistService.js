const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy token từ localStorage
const getToken = () => localStorage.getItem("token");

// Helper để gọi API với auth
const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error("Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear();
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    const errorText = await res.text();
    throw new Error(errorText || "Có lỗi xảy ra");
  }

  return res.json();
};

// Lấy wishlist hiện tại (tự động tạo nếu chưa có)
export async function getWishlist() {
  try {
    const wishlist = await fetchWithAuth(`${API_BASE_URL}/Wishlists`);
    return wishlist;
  } catch (err) {
    console.error("Lỗi lấy wishlist", err);
    throw err;
  }
}

// Thêm sản phẩm vào wishlist
export async function addToWishlist(idProducts) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Wishlists/items`, {
      method: "POST",
      body: JSON.stringify({ idProducts }),
    });
  } catch (err) {
    console.error("Lỗi thêm vào wishlist", err);
    throw err;
  }
}

// Xóa sản phẩm khỏi wishlist theo wishlist item ID
export async function removeWishlistItem(wishlistItemId) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Wishlists/items/${wishlistItemId}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Lỗi xóa sản phẩm khỏi wishlist", err);
    throw err;
  }
}

// Xóa sản phẩm khỏi wishlist theo product ID
export async function removeFromWishlistByProductId(productId) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Wishlists/products/${productId}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Lỗi xóa sản phẩm khỏi wishlist", err);
    throw err;
  }
}

// Xóa toàn bộ wishlist
export async function clearWishlist() {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Wishlists/clear`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Lỗi xóa wishlist", err);
    throw err;
  }
}

// Kiểm tra sản phẩm có trong wishlist không
export async function checkProductInWishlist(productId) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Wishlists/check/${productId}`);
  } catch (err) {
    console.error("Lỗi kiểm tra wishlist", err);
    return { isInWishlist: false };
  }
}

