const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

const getToken = () => localStorage.getItem("token");

const fetchWithAuth = async (url, options = {}) => {
  const token = getToken();
  if (!token) {
    throw new Error("Chưa đăng nhập");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear();
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
    const errorText = await res.text();
    throw new Error(errorText || "Có lỗi xảy ra");
  }

  return res.json();
};

export async function getReviews(params = {}) {
  const { page = 1, pageSize = 20, status, rating, productId } = params;
  const qs = new URLSearchParams();
  qs.set("page", page);
  qs.set("pageSize", pageSize);
  if (status) qs.set("status", status);
  if (rating) qs.set("rating", rating);
  if (productId) qs.set("productId", productId);

  return fetchWithAuth(`${API_BASE_URL}/admin/AdminReviews?${qs.toString()}`);
}

export async function getReview(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminReviews/${id}`);
}

export async function updateReview(id, data) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminReviews/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id) {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminReviews/${id}`, {
    method: "DELETE",
  });
}

export async function getReviewStats() {
  return fetchWithAuth(`${API_BASE_URL}/admin/AdminReviews/stats`);
}
