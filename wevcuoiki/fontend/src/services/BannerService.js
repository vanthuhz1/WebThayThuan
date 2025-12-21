const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7194/api'

export async function getBanners() {
  const res = await fetch(`${API_BASE_URL}/Banners/public`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Banner API error ${res.status} - ${text}`)
  }
  return res.json()
}


