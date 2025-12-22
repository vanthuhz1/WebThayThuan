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

// Lấy danh sách mã giảm giá có sẵn (active và còn hạn)
export async function getAvailableDiscountCodes() {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/DiscountCodes/available`);
  } catch (err) {
    console.error("Lỗi lấy danh sách mã giảm giá", err);
    throw err;
  }
}

// Validate mã giảm giá
export async function validateDiscountCode(code) {
  try {
    return await fetchWithAuth(`${API_BASE_URL}/DiscountCodes/validate/${code}`);
  } catch (err) {
    console.error("Lỗi validate mã giảm giá", err);
    throw err;
  }
}

