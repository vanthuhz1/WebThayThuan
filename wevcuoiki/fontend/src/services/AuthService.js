const API_BASE_URL = "https://localhost:7194/api";

// Hàm đăng nhập
export async function login(email, password) {
  try {
    const res = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Đăng nhập thất bại");
    }

    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
}

// Hàm đăng ký
export async function register(fullName, email, password, phone) {
  try {
    const res = await fetch(`${API_BASE_URL}/Auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fullName: fullName,
        email: email,
        password: password,
        phone: phone
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Đăng ký thất bại");
    }

    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
}

// Hàm lưu thông tin user vào localStorage
export function saveUserInfo(userData) {
  localStorage.setItem("token", userData.token);
  localStorage.setItem("userId", userData.idUsers);
  localStorage.setItem("userName", userData.fullName);
  localStorage.setItem("userEmail", userData.email);
  localStorage.setItem("userRole", userData.role);
}

// Hàm kiểm tra đã đăng nhập chưa
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// Hàm đăng xuất
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
}

// Hàm lấy token
export function getToken() {
  return localStorage.getItem("token");
}

// Hàm lấy thông tin user hiện tại
export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  return {
    id: localStorage.getItem("userId"),
    name: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
    role: localStorage.getItem("userRole"),
    token: token
  };
}

