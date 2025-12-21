// src/services/CategoryService.js
import axios from "axios";

// Ưu tiên lấy từ env, fallback localhost để tránh undefined
const API = import.meta.env.VITE_API_URL || "https://localhost:7194/api";

export const getCategoryBySlug = async (slug) => {
  if (!slug) throw new Error("slug is required");
  const { data } = await axios.get(`${API}/Categories/by-slug/${slug}`);
  return data;
};
