const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Lấy danh sách đơn hàng của user
export async function getMyOrders(status = null) {
  try {
    const token = localStorage.getItem("token");
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
        "Authorization": `Bearer ${token}`,
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

