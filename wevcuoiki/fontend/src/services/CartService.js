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

// Lấy giỏ hàng hiện tại (tự động tạo nếu chưa có)
export async function getCart() {
  try {
    const cart = await fetchWithAuth(`${API_BASE_URL}/Carts`);
    // Backend tự động tạo giỏ hàng nếu chưa có
    return cart;
  } catch (err) {
    console.error("Lỗi lấy giỏ hàng", err);
    throw err;
  }
}

// Thêm sản phẩm vào giỏ hàng
export async function addToCart(idProducts, quantity, color, size) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Carts/items`, {
      method: "POST",
      body: JSON.stringify({
        idProducts,
        quantity,
        color: color || null,
        size: size || null,
      }),
    });
  } catch (err) {
    console.error("Lỗi thêm vào giỏ hàng", err);
    throw err;
  }
}

// Cập nhật số lượng sản phẩm trong giỏ
export async function updateCartItem(cartItemId, quantity) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Carts/items/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
  } catch (err) {
    console.error("Lỗi cập nhật giỏ hàng", err);
    throw err;
  }
}

// Xóa sản phẩm khỏi giỏ hàng
export async function removeCartItem(cartItemId) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Carts/items/${cartItemId}`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Lỗi xóa sản phẩm khỏi giỏ hàng", err);
    throw err;
  }
}

// Xóa toàn bộ giỏ hàng
export async function clearCart() {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/Carts/clear`, {
      method: "DELETE",
    });
  } catch (err) {
    console.error("Lỗi xóa giỏ hàng", err);
    throw err;
  }
}

