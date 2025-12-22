// Service để gọi API Orders
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy token từ localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Tạo đơn hàng mới
export async function createOrder(orderData) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Bạn cần đăng nhập để đặt hàng");
    }

    const res = await fetch(`${API_BASE_URL}/Orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Đặt hàng thất bại");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi tạo đơn hàng", err);
    throw err;
  }
}

// Lấy danh sách đơn hàng của user
export async function getMyOrders(status = null) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Chưa đăng nhập");
    }

    let url = `${API_BASE_URL}/Orders`;
    if (status && status !== "all") {
      url += `?status=${status}`;
    }

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Không tải được danh sách đơn hàng");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy danh sách đơn hàng", err);
    throw err;
  }
}

// Lấy chi tiết đơn hàng
export async function getOrderDetails(orderId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Bạn cần đăng nhập");
    }

    const res = await fetch(`${API_BASE_URL}/Orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error("Không tải được chi tiết đơn hàng");
    }

    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy chi tiết đơn hàng", err);
    throw err;
  }
}