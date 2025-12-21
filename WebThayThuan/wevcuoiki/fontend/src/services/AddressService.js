// Service để lấy danh sách địa chỉ từ API Việt Nam
// Sử dụng API: https://provinces.open-api.vn/

const API_BASE_URL = "https://provinces.open-api.vn/api";

// Lấy danh sách tất cả tỉnh/thành phố
export async function getProvinces() {
  try {
    const res = await fetch(`${API_BASE_URL}/p/`);
    if (!res.ok) {
      throw new Error("Không tải được danh sách tỉnh/thành phố");
    }
    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy danh sách tỉnh/thành phố", err);
    throw err;
  }
}

// Lấy danh sách quận/huyện theo tỉnh/thành phố
export async function getDistricts(provinceCode) {
  if (!provinceCode) return [];
  
  try {
    const res = await fetch(`${API_BASE_URL}/p/${provinceCode}?depth=2`);
    if (!res.ok) {
      throw new Error("Không tải được danh sách quận/huyện");
    }
    const data = await res.json();
    return data.districts || [];
  } catch (err) {
    console.error("Lỗi lấy danh sách quận/huyện", err);
    throw err;
  }
}

// Lấy danh sách phường/xã theo quận/huyện
export async function getWards(districtCode) {
  if (!districtCode) return [];
  
  try {
    const res = await fetch(`${API_BASE_URL}/d/${districtCode}?depth=2`);
    if (!res.ok) {
      throw new Error("Không tải được danh sách phường/xã");
    }
    const data = await res.json();
    return data.wards || [];
  } catch (err) {
    console.error("Lỗi lấy danh sách phường/xã", err);
    throw err;
  }
}

// Lấy thông tin chi tiết tỉnh/thành phố theo code
export async function getProvinceByCode(provinceCode) {
  if (!provinceCode) return null;
  
  try {
    const res = await fetch(`${API_BASE_URL}/p/${provinceCode}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy thông tin tỉnh/thành phố", err);
    return null;
  }
}

// Lấy thông tin chi tiết quận/huyện theo code
export async function getDistrictByCode(districtCode) {
  if (!districtCode) return null;
  
  try {
    const res = await fetch(`${API_BASE_URL}/d/${districtCode}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy thông tin quận/huyện", err);
    return null;
  }
}

// Lấy thông tin chi tiết phường/xã theo code
export async function getWardByCode(wardCode) {
  if (!wardCode) return null;
  
  try {
    const res = await fetch(`${API_BASE_URL}/w/${wardCode}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Lỗi lấy thông tin phường/xã", err);
    return null;
  }
}

