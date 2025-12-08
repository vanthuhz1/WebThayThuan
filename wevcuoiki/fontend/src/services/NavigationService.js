const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://localhost:7194/api'

/**
 * Lấy navigation (root categories + children)
 */
export async function getNavigationData() {
  const res = await fetch(`${API_BASE_URL}/Navigation/nav`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Navigation API error ${res.status} - ${text}`)
  }
  return res.json()
}

