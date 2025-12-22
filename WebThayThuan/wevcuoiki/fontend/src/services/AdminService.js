const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

// Helper function để gọi API với token
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Chưa đăng nhập");
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
    if (res.status === 401 || res.status === 403) {
      localStorage.clear();
      if (window.location.pathname.startsWith("/admin")) {
        window.location.href = "/admin/login";
      }
      throw new Error("Không có quyền truy cập");
    }
    const errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.message || errorJson.error || "Lỗi khi gọi API");
    } catch {
      throw new Error(errorText || "Lỗi khi gọi API");
    }
  }

  return res.json();
}

// Dashboard
export async function getDashboardStats() {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminDashboard/stats`);
}

// Products
export async function getAdminProducts(params = {}) {
  const { page = 1, pageSize = 20, status } = params;
  let url = `${API_BASE_URL}/admin/AdminProducts?page=${page}&pageSize=${pageSize}`;
  if (status && status !== "all") {
    url += `&status=${status}`;
  }
  return fetchWithAuth(url);
}

export async function getAdminProduct(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminProducts/${id}`);
}

export async function createProduct(productData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminProducts`, {
    method: "POST",
    body: JSON.stringify(productData),
  });
}

export async function updateProduct(id, productData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminProducts/${id}`, {
    method: "PUT",
    body: JSON.stringify(productData),
  });
}

export async function deleteProduct(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminProducts/${id}`, {
    method: "DELETE",
  });
}

// Orders
export async function getAdminOrders(params = {}) {
  const { page = 1, pageSize = 20, status } = params;
  let url = `${API_BASE_URL}/admin/AdminOrders?page=${page}&pageSize=${pageSize}`;
  if (status) url += `&status=${status}`;
  return fetchWithAuth(url);
}

export async function getAdminOrder(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminOrders/${id}`);
}

export async function updateOrderStatus(id, status, notes) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminOrders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteOrder(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminOrders/${id}`, {
    method: "DELETE",
  });
}

// Users
export async function getAdminUsers(params = {}) {
  const { page = 1, pageSize = 20, role, status } = params;
  let url = `${API_BASE_URL}/admin/AdminUsers?page=${page}&pageSize=${pageSize}`;
  if (role) url += `&role=${role}`;
  if (status) url += `&status=${status}`;
  return fetchWithAuth(url);
}

export async function getAdminUser(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers/${id}`);
}

export async function updateUserRole(id, role) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers/${id}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function updateUserStatus(id, status) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function deleteUser(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers/${id}`, {
    method: "DELETE",
  });
}

// Discount Codes
export async function getAdminDiscountCodes(params = {}) {
  const { page = 1, pageSize = 20, status, discountType, search } = params;
  let url = `${API_BASE_URL}/admin/AdminDiscountCodes?page=${page}&pageSize=${pageSize}`;
  if (status && status !== "all") url += `&status=${status}`;
  if (discountType && discountType !== "all") url += `&discountType=${discountType}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return fetchWithAuth(url);
}

export async function getAdminDiscountCode(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminDiscountCodes/${id}`);
}

export async function createDiscountCode(discountCodeData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminDiscountCodes`, {
    method: "POST",
    body: JSON.stringify(discountCodeData),
  });
}

export async function updateDiscountCode(id, discountCodeData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminDiscountCodes/${id}`, {
    method: "PUT",
    body: JSON.stringify(discountCodeData),
  });
}

export async function deleteDiscountCode(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminDiscountCodes/${id}`, {
    method: "DELETE",
  });
}

export async function createUser(userData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers`, {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id, userData) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminUsers/${id}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

