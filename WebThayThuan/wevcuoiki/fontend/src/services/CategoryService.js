// src/services/CategoryService.js
import axios from "axios";

// Ưu tiên lấy từ env, fallback localhost để tránh undefined
const API = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

export const getCategoryBySlug = async (slug) => {
  if (!slug) throw new Error("slug is required");
  const { data } = await axios.get(`${API}/Categories/by-slug/${slug}`);
  return data;
};

// Lấy danh mục nổi bật (featured categories)
export const getFeaturedCategories = async (limit = 4) => {
  try {
    const { data } = await axios.get(`${API}/Categories/featured?limit=${limit}`);
    return data;
  } catch (error) {
    console.error("Lỗi khi lấy danh mục nổi bật:", error);
    throw error;
  }
};

// ================== ADMIN CATEGORIES ==================

const API_BASE_URL = API;

export async function getAdminCategoryTree(params = {}) {
  const { keyword, status } = params;
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  let url = `${API_BASE_URL}/admin/AdminCategories/tree`;
  const qs = [];
  if (keyword) qs.push(`keyword=${encodeURIComponent(keyword)}`);
  if (status) qs.push(`status=${encodeURIComponent(status)}`);
  if (qs.length) url += `?${qs.join("&")}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Lỗi khi gọi API");
  return res.json();
}

export async function getAdminCategory(id) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await fetch(`${API_BASE_URL}/admin/AdminCategories/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Lỗi khi gọi API");
  return res.json();
}

export async function createAdminCategory(payload) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await fetch(`${API_BASE_URL}/admin/AdminCategories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Lỗi khi gọi API");
  return res.json();
}

export async function updateAdminCategory(id, payload) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await fetch(`${API_BASE_URL}/admin/AdminCategories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Lỗi khi gọi API");
  return res.json();
}

export async function deleteAdminCategory(id) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");

  const res = await fetch(`${API_BASE_URL}/admin/AdminCategories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Lỗi khi gọi API");
  return res.json();
}