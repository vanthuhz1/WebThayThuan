import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../../services/CartService";
import { isLoggedIn, getCurrentUser } from "../../services/AuthService";
import { getProvinces, getDistricts, getWards } from "../../services/AddressService";
import { getAvailableDiscountCodes, validateDiscountCode } from "../../services/DiscountCodeService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const Order = () => {
  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Kiểm tra và xác nhận
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    shippingAddress: "",
    provinceCode: "",
    provinceName: "",
    districtCode: "",
    districtName: "",
    wardCode: "",
    wardName: "",
    note: "",
    discountCode: "",
    paymentMethod: "cod", // cod = cash on delivery
  });

  // Address data from API
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Discount code state
  const [availableDiscountCodes, setAvailableDiscountCodes] = useState([]);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(false);
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/order");
      return;
    }

    // Load từ sessionStorage nếu có (khi quay lại từ bước 2)
    const savedFormData = sessionStorage.getItem("orderFormData");
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        setFormData(prev => ({ ...prev, ...parsed }));
        // Nếu có step trong sessionStorage, chuyển về bước đó
        const savedStep = sessionStorage.getItem("orderStep");
        if (savedStep === "2") {
          setStep(2);
        }
      } catch (err) {
        console.error("Lỗi load formData từ sessionStorage", err);
      }
    } else {
      // Load user info if available
      if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.name || "",
          email: user.email || "",
        }));
      }
    }

    loadCart();
    loadProvinces();
    loadDiscountCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load available discount codes
  const loadDiscountCodes = async () => {
    try {
      setLoadingDiscountCodes(true);
      const codes = await getAvailableDiscountCodes();
      setAvailableDiscountCodes(codes || []);
    } catch (err) {
      console.error("Lỗi tải danh sách mã giảm giá", err);
      // Không hiển thị lỗi nếu API chưa có, chỉ log
      setAvailableDiscountCodes([]);
    } finally {
      setLoadingDiscountCodes(false);
    }
  };

  // Load provinces on mount
  const loadProvinces = async () => {
    try {
      setLoadingAddress(true);
      const data = await getProvinces();
      setProvinces(data);
    } catch (err) {
      console.error("Lỗi tải danh sách tỉnh/thành phố", err);
    } finally {
      setLoadingAddress(false);
    }
  };

  // Load districts when province changes
  useEffect(() => {
    if (formData.provinceCode) {
      loadDistricts(formData.provinceCode);
    } else {
      setDistricts([]);
      setWards([]);
      setFormData(prev => ({
        ...prev,
        districtCode: "",
        districtName: "",
        wardCode: "",
        wardName: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.provinceCode]);

  // Load wards when district changes
  useEffect(() => {
    if (formData.districtCode) {
      loadWards(formData.districtCode);
    } else {
      setWards([]);
      setFormData(prev => ({
        ...prev,
        wardCode: "",
        wardName: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.districtCode]);

  // Đảm bảo các giá trị name được set khi chuyển sang bước 2
  useEffect(() => {
    if (step === 2) {
      const loadAddressNames = async () => {
        const updated = { ...formData };
        let changed = false;
        
        // Lấy tên tỉnh/thành phố nếu chưa có
        if (!updated.provinceName && updated.provinceCode) {
          if (provinces.length > 0) {
            const selectedProvince = provinces.find(p => p.code === updated.provinceCode);
            if (selectedProvince?.name) {
              updated.provinceName = selectedProvince.name;
              changed = true;
            }
          } else {
            // Nếu không có trong array, gọi API để lấy
            try {
              const { getProvinceByCode } = await import("../../services/AddressService");
              const provinceData = await getProvinceByCode(updated.provinceCode);
              if (provinceData?.name) {
                updated.provinceName = provinceData.name;
                changed = true;
              }
            } catch (err) {
              console.error("Lỗi lấy tên tỉnh/thành phố", err);
            }
          }
        }
        
        // Lấy tên quận/huyện nếu chưa có - LUÔN gọi API để đảm bảo
        if (!updated.districtName && updated.districtCode) {
          try {
            const { getDistrictByCode } = await import("../../services/AddressService");
            const districtData = await getDistrictByCode(updated.districtCode);
            if (districtData?.name) {
              updated.districtName = districtData.name;
              changed = true;
            }
          } catch (err) {
            console.error("Lỗi lấy tên quận/huyện", err, "Code:", updated.districtCode);
          }
        }
        
        // Lấy tên phường/xã nếu chưa có - LUÔN gọi API để đảm bảo
        if (!updated.wardName && updated.wardCode) {
          try {
            const { getWardByCode } = await import("../../services/AddressService");
            const wardData = await getWardByCode(updated.wardCode);
            if (wardData?.name) {
              updated.wardName = wardData.name;
              changed = true;
            }
          } catch (err) {
            console.error("Lỗi lấy tên phường/xã", err, "Code:", updated.wardCode);
          }
        }
        
        if (changed) {
          setFormData(updated);
          sessionStorage.setItem("orderFormData", JSON.stringify(updated));
        }
      };
      
      // Đợi một chút để đảm bảo formData đã được load từ sessionStorage
      setTimeout(() => {
        loadAddressNames();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, formData.provinceCode, formData.districtCode, formData.wardCode]);

  const loadDistricts = async (provinceCode) => {
    try {
      setLoadingAddress(true);
      const data = await getDistricts(provinceCode);
      setDistricts(data);
    } catch (err) {
      console.error("Lỗi tải danh sách quận/huyện", err);
      setDistricts([]);
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadWards = async (districtCode) => {
    try {
      setLoadingAddress(true);
      const data = await getWards(districtCode);
      setWards(data);
    } catch (err) {
      console.error("Lỗi tải danh sách phường/xã", err);
      setWards([]);
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data);
      
      // Check if cart is empty
      if (!data.items || data.items.length === 0) {
        setError("Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
      }
    } catch (err) {
      setError(err?.message || "Không tải được giỏ hàng");
      if (err?.message?.includes("đăng nhập")) {
        navigate("/login?returnUrl=/order");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle province selection
    if (name === "provinceCode") {
      const selectedProvince = provinces.find(p => p.code === value);
      const newFormData = {
        provinceCode: value,
        provinceName: selectedProvince?.name || "",
        districtCode: "",
        districtName: "",
        wardCode: "",
        wardName: "",
      };
      setFormData(prev => {
        const updated = { ...prev, ...newFormData };
        // Lưu vào sessionStorage ngay khi thay đổi
        sessionStorage.setItem("orderFormData", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    
    // Handle district selection
    if (name === "districtCode") {
      const selectedDistrict = districts.find(d => d.code === value);
      const newFormData = {
        districtCode: value,
        districtName: selectedDistrict?.name || "",
        wardCode: "",
        wardName: "",
      };
      setFormData(prev => {
        const updated = { ...prev, ...newFormData };
        // Lưu vào sessionStorage ngay khi thay đổi
        sessionStorage.setItem("orderFormData", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    
    // Handle ward selection
    if (name === "wardCode") {
      const selectedWard = wards.find(w => w.code === value);
      const newFormData = {
        wardCode: value,
        wardName: selectedWard?.name || "",
      };
      setFormData(prev => {
        const updated = { ...prev, ...newFormData };
        // Lưu vào sessionStorage ngay khi thay đổi
        sessionStorage.setItem("orderFormData", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Lưu vào sessionStorage khi có thay đổi
      if (step === 1) {
        sessionStorage.setItem("orderFormData", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleSelectDiscountCode = async (code) => {
    if (!code) {
      setDiscountInfo(null);
      setFormData(prev => ({ ...prev, discountCode: "" }));
      setDiscountError(null);
      return;
    }

    try {
      setCheckingDiscount(true);
      setDiscountError(null);
      
      // Tìm mã giảm giá trong danh sách có sẵn
      const selectedCode = availableDiscountCodes.find(c => c.code === code);
      
      if (selectedCode) {
        // Validate mã giảm giá với API
        try {
          const validateResult = await validateDiscountCode(code);
          
          if (validateResult.isValid) {
            setDiscountInfo({
              idDiscountCodes: selectedCode.idDiscountCodes,
              code: selectedCode.code,
              discountType: selectedCode.discountType,
              discountValue: selectedCode.discountValue,
              minOrderAmount: selectedCode.minOrderAmount,
            });
            setFormData(prev => ({ ...prev, discountCode: code }));
            setDiscountError(null);
          } else {
            throw new Error(validateResult.message || "Mã giảm giá không hợp lệ");
          }
        } catch (validateErr) {
          // Nếu validate fail, vẫn cho phép chọn nhưng cảnh báo
          setDiscountInfo({
            idDiscountCodes: selectedCode.idDiscountCodes,
            code: selectedCode.code,
            discountType: selectedCode.discountType,
            discountValue: selectedCode.discountValue,
            minOrderAmount: selectedCode.minOrderAmount,
          });
          setFormData(prev => ({ ...prev, discountCode: code }));
          setDiscountError(null);
        }
      } else {
        throw new Error("Mã giảm giá không tồn tại");
      }
    } catch (err) {
      setDiscountError(err?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn");
      setDiscountInfo(null);
      setFormData(prev => ({ ...prev, discountCode: "" }));
    } finally {
      setCheckingDiscount(false);
    }
  };

  const calculateTotals = () => {
    const subTotal = cart?.subTotal || 0;
    const shippingFee = 30000; // Default shipping fee
    let discountAmount = 0;

    if (discountInfo) {
      if (discountInfo.discountType === "percentage") {
        discountAmount = (subTotal * discountInfo.discountValue) / 100;
      } else if (discountInfo.discountType === "fixed") {
        discountAmount = discountInfo.discountValue;
      }
      
      // Apply min order amount if exists
      if (discountInfo.minOrderAmount && subTotal < discountInfo.minOrderAmount) {
        discountAmount = 0;
      }
    }

    const totalAmount = subTotal + shippingFee - discountAmount;
    
    return {
      subTotal,
      shippingFee,
      discountAmount,
      totalAmount,
    };
  };

  // Helper: Lấy tên từ formData hoặc arrays
  const getProvinceName = () => {
    // Ưu tiên lấy từ formData
    if (formData.provinceName) return formData.provinceName;
    
    // Nếu không có trong formData, tìm trong provinces array
    if (formData.provinceCode) {
      if (provinces.length > 0) {
        const selected = provinces.find(p => p.code === formData.provinceCode);
        if (selected?.name) return selected.name;
      }
    }
    
    return "";
  };

  const getDistrictName = () => {
    // Ưu tiên lấy từ formData
    if (formData.districtName) return formData.districtName;
    
    // Nếu không có trong formData, tìm trong districts array
    if (formData.districtCode) {
      if (districts.length > 0) {
        const selected = districts.find(d => d.code === formData.districtCode);
        if (selected?.name) return selected.name;
      }
    }
    
    return "";
  };

  const getWardName = () => {
    // Ưu tiên lấy từ formData
    if (formData.wardName) return formData.wardName;
    
    // Nếu không có trong formData, tìm trong wards array
    if (formData.wardCode) {
      if (wards.length > 0) {
        const selected = wards.find(w => w.code === formData.wardCode);
        if (selected?.name) return selected.name;
      }
    }
    
    return "";
  };

  // Tính địa chỉ đầy đủ để hiển thị
  const getFullAddress = () => {
    // Ưu tiên lấy từ formData trước
    let provinceName = formData.provinceName || "";
    let districtName = formData.districtName || "";
    let wardName = formData.wardName || "";
    
    // Nếu không có trong formData, tìm trong arrays
    if (!provinceName && formData.provinceCode) {
      if (provinces.length > 0) {
        const selected = provinces.find(p => p.code === formData.provinceCode);
        provinceName = selected?.name || "";
      }
    }
    
    if (!districtName && formData.districtCode) {
      if (districts.length > 0) {
        const selected = districts.find(d => d.code === formData.districtCode);
        districtName = selected?.name || "";
      }
    }
    
    if (!wardName && formData.wardCode) {
      if (wards.length > 0) {
        const selected = wards.find(w => w.code === formData.wardCode);
        wardName = selected?.name || "";
      }
    }
    
    const addressParts = [
      formData.shippingAddress?.trim(),
      wardName?.trim(),
      districtName?.trim(),
      provinceName?.trim()
    ].filter(part => part && part.length > 0);
    
    return addressParts.join(", ") || formData.shippingAddress || "";
  };

  // Bước 1: Validate và chuyển sang bước kiểm tra lại
  const handleContinue = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!formData.shippingAddress.trim()) {
      setError("Vui lòng nhập địa chỉ chi tiết");
      return;
    }
    if (!formData.provinceCode) {
      setError("Vui lòng chọn tỉnh/thành phố");
      return;
    }
    if (!formData.districtCode) {
      setError("Vui lòng chọn quận/huyện");
      return;
    }
    if (!formData.wardCode) {
      setError("Vui lòng chọn phường/xã");
      return;
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      setError("Giỏ hàng của bạn đang trống");
      return;
    }

    // Đảm bảo các giá trị name được set trước khi chuyển sang bước 2
    const updatedFormData = { ...formData };
    
    // Lấy tên tỉnh/thành phố nếu chưa có
    if (!updatedFormData.provinceName && updatedFormData.provinceCode) {
      if (provinces.length > 0) {
        const selectedProvince = provinces.find(p => p.code === updatedFormData.provinceCode);
        if (selectedProvince?.name) {
          updatedFormData.provinceName = selectedProvince.name;
        }
      }
    }
    
    // Lấy tên quận/huyện nếu chưa có
    if (!updatedFormData.districtName && updatedFormData.districtCode) {
      if (districts.length > 0) {
        const selectedDistrict = districts.find(d => d.code === updatedFormData.districtCode);
        if (selectedDistrict?.name) {
          updatedFormData.districtName = selectedDistrict.name;
        }
      }
    }
    
    // Lấy tên phường/xã nếu chưa có
    if (!updatedFormData.wardName && updatedFormData.wardCode) {
      if (wards.length > 0) {
        const selectedWard = wards.find(w => w.code === updatedFormData.wardCode);
        if (selectedWard?.name) {
          updatedFormData.wardName = selectedWard.name;
        }
      }
    }
    
    // Lưu vào sessionStorage với các giá trị đã cập nhật
    sessionStorage.setItem("orderFormData", JSON.stringify(updatedFormData));
    sessionStorage.setItem("orderStep", "2");
    
    // Reload trang để đảm bảo các giá trị được load lại và update địa chỉ
    window.location.reload();
  };

  // Bước 2: Xác nhận và lưu vào database
  const handleConfirmPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const totals = calculateTotals();
      
      // Gộp tất cả thông tin địa chỉ vào 1 trường shipping_address
      // Sử dụng getFullAddress() để đảm bảo lấy đúng giá trị
      const fullAddress = getFullAddress();

      // Gọi API để lưu vào database
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";
      const token = localStorage.getItem("token");

      const orderData = {
        shippingAddress: fullAddress,
        shippingFee: totals.shippingFee,
        totalAmount: totals.totalAmount,
        idDiscountCodes: discountInfo?.idDiscountCodes || null,
        paymentMethod: formData.paymentMethod === "momo" ? "momo" : "cod",
        note: formData.note || null,
      };

      const res = await fetch(`${API_BASE_URL}/Orders`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Đặt hàng thất bại");
      }

      const orderResult = await res.json();
      
      // Xóa dữ liệu trong sessionStorage sau khi lưu thành công
      sessionStorage.removeItem("orderFormData");
      sessionStorage.removeItem("orderStep");
      
      // Redirect to success page
      navigate(`/order-success?orderId=${orderResult.idOrders || orderResult.id}`);
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const totals = cart ? calculateTotals() : { subTotal: 0, shippingFee: 0, discountAmount: 0, totalAmount: 0 };
  const items = cart?.items || [];
  const hasItems = items.length > 0;

  if (loading) {
  return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="h-32 animate-pulse rounded-xl bg-neutral-100" />
        </div>
    </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      {/* Breadcrumb */}
      <div className="mb-3 text-sm text-neutral-500">
        <Link to="/" className="hover:text-neutral-900">
          Trang chủ
        </Link>
        <span className="px-1">/</span>
        <Link to="/shop-cart" className="hover:text-neutral-900">
          Giỏ hàng
        </Link>
        <span className="px-1">/</span>
        <span className="text-neutral-900">Đặt hàng</span>
      </div>

      {/* Title */}
      <h1 className="mb-4 text-xl font-bold tracking-tight text-neutral-900">
        {step === 1 ? "THÔNG TIN ĐẶT HÀNG" : "KIỂM TRA LẠI THÔNG TIN"}
      </h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!hasItems ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-neutral-700">
            Giỏ hàng của bạn đang trống.
          </p>
          <Link
            to="/shop-cart"
            className="mt-4 inline-flex items-center justify-center rounded-full bg-black px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      ) : step === 1 ? (
        <form onSubmit={handleContinue} className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(400px,1fr)]">
          {/* Left: Form */}
          <div className="space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-2">
            {/* Thông tin thanh toán */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-neutral-900">
                THÔNG TIN THANH TOÁN
              </h2>
              
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-700">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-neutral-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Địa chỉ chi tiết <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Số nhà, tên đường"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Tỉnh/Thành phố <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="provinceCode"
                    value={formData.provinceCode}
                    onChange={handleInputChange}
                    required
                    disabled={loadingAddress || provinces.length === 0}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="districtCode"
                    value={formData.districtCode}
                    onChange={handleInputChange}
                    required
                    disabled={loadingAddress || !formData.provinceCode || districts.length === 0}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  >
                    <option value="">-- Chọn quận/huyện --</option>
                    {districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Phường/Xã <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="wardCode"
                    value={formData.wardCode}
                    onChange={handleInputChange}
                    required
                    disabled={loadingAddress || !formData.districtCode || wards.length === 0}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:bg-neutral-100"
                  >
                    <option value="">-- Chọn phường/xã --</option>
                    {wards.map((ward) => (
                      <option key={ward.code} value={ward.code}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-neutral-700">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                    placeholder="Ghi chú cho người giao hàng..."
                  />
                </div>
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-neutral-900">
                PHƯƠNG THỨC THANH TOÁN
              </h2>
              
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 p-3 transition hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === "cod"}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src="/assets/img/payment/cod.png"
                      alt="COD"
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-neutral-900">
                        Thanh toán khi nhận hàng (COD)
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        Thanh toán bằng tiền mặt khi nhận được hàng
                      </div>
                    </div>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 p-3 transition hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={formData.paymentMethod === "momo"}
                    onChange={handleInputChange}
                    className="h-4 w-4 border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src="/assets/img/payment/Logo-MoMo-Square.webp"
                      alt="MoMo"
                      className="h-8 w-8 shrink-0 object-contain"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-neutral-900">
                        Thanh toán MoMo
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        Thanh toán qua ví điện tử MoMo
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <aside className="h-fit space-y-6">
            {/* Order Summary */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-neutral-900">
                TÓM TẮT ĐƠN HÀNG
              </h2>

            {/* Items list */}
            <div className="mb-4 space-y-3 border-b border-neutral-200 pb-4">
              {items.map((item) => (
                <div key={item.idCartItems} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <img
                      src={item.thumbnailUrl || "/assets/img/no-image.jpg"}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-900 line-clamp-2">
                      {item.productName}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {item.color && <span>Màu: {item.color}</span>}
                      {item.color && item.size && <span className="mx-1">•</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="mt-1 text-xs text-neutral-600">
                      {item.quantity} x {fmtVND(item.unitPrice)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mã giảm giá */}
            <div className="mb-4 border-b border-neutral-200 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-600">Mã giảm giá</span>
                {discountInfo ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-emerald-600">
                      {discountInfo.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectDiscountCode(null)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDiscountModal(true)}
                    className="text-sm font-semibold text-neutral-900 hover:text-neutral-600"
                  >
                    Chọn mã
                  </button>
                )}
              </div>
              {discountInfo && (
                <div className="mt-1 text-xs text-emerald-600">
                  {discountInfo.discountType === "percentage" 
                    ? `Giảm ${discountInfo.discountValue}%`
                    : `Giảm ${fmtVND(discountInfo.discountValue)}`}
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-3 border-b border-neutral-200 pb-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Tạm tính</span>
                <span className="font-semibold text-neutral-900">
                  {fmtVND(totals.subTotal)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-neutral-600">Phí vận chuyển</span>
                <span className="font-semibold text-neutral-900">
                  {fmtVND(totals.shippingFee)}
                </span>
              </div>

              {discountInfo && totals.discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold">
                    -{fmtVND(totals.discountAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="mb-6 mt-4 flex items-center justify-between">
              <span className="text-base font-bold text-neutral-900">Tổng cộng</span>
              <span className="text-2xl font-extrabold text-neutral-900">
                {fmtVND(totals.totalAmount)}
              </span>
            </div>

            {/* Continue button */}
            <button
              type="submit"
              disabled={!hasItems}
              className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              TIẾP TỤC
            </button>

            <Link
              to="/shop-cart"
              className="mt-3 flex w-full items-center justify-center rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Quay lại giỏ hàng
            </Link>
            </div>
          </aside>
        </form>
      ) : (
        // Step 2: Kiểm tra lại thông tin và xác nhận thanh toán
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(400px,1fr)]">
          {/* Left: Thông tin đã nhập */}
          <div className="space-y-4">
            {/* Thông tin khách hàng */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-neutral-900">
                THÔNG TIN KHÁCH HÀNG
              </h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-neutral-700">Họ và tên:</span>
                  <span className="ml-2 text-neutral-900">{formData.fullName}</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Số điện thoại:</span>
                  <span className="ml-2 text-neutral-900">{formData.phone}</span>
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Email:</span>
                  <span className="ml-2 text-neutral-900">{formData.email}</span>
                </div>
                
                {/* Địa chỉ chi tiết */}
                <div className="mt-4 border-t border-neutral-200 pt-4">
                  <h3 className="mb-2 text-sm font-bold text-neutral-900">Địa chỉ giao hàng:</h3>
                  <div className="space-y-2 pl-2">
                    <div>
                      <span className="font-semibold text-neutral-700">Địa chỉ chi tiết:</span>
                      <span className="ml-2 text-neutral-900">{formData.shippingAddress}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Phường/Xã:</span>
                      <span className="ml-2 text-neutral-900">
                        {(formData.wardName || getWardName()) || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Quận/Huyện:</span>
                      <span className="ml-2 text-neutral-900">
                        {(formData.districtName || getDistrictName()) || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Tỉnh/Thành phố:</span>
                      <span className="ml-2 text-neutral-900">
                        {(formData.provinceName || getProvinceName()) || "—"}
                      </span>
                    </div>
                    <div className="mt-2 rounded-lg bg-neutral-50 p-2">
                      <span className="text-xs font-semibold text-neutral-600">Địa chỉ đầy đủ:</span>
                      <p className="mt-1 text-sm text-neutral-900">{getFullAddress()}</p>
                    </div>
                  </div>
                </div>
                
                {formData.note && (
                  <div>
                    <span className="font-semibold text-neutral-700">Ghi chú:</span>
                    <span className="ml-2 text-neutral-900">{formData.note}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Phương thức thanh toán */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-bold text-neutral-900">
                PHƯƠNG THỨC THANH TOÁN
              </h2>
              <div className="text-sm text-neutral-900">
                {formData.paymentMethod === "cod" ? "Thanh toán khi nhận hàng (COD)" : "Thanh toán MoMo"}
              </div>
            </div>

            {/* Nút quay lại */}
            <button
              type="button"
              onClick={() => {
                // Cập nhật sessionStorage khi quay lại
                sessionStorage.setItem("orderFormData", JSON.stringify(formData));
                sessionStorage.setItem("orderStep", "1");
                setStep(1);
              }}
              className="w-full rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
            >
              Quay lại chỉnh sửa
            </button>
          </div>

          {/* Right: Order Summary */}
          <aside className="h-fit space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-neutral-900">
                TÓM TẮT ĐƠN HÀNG
              </h2>

              {/* Items list */}
              <div className="mb-4 space-y-3 border-b border-neutral-200 pb-4">
                {items.map((item) => (
                  <div key={item.idCartItems} className="flex gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <img
                        src={item.thumbnailUrl || "/assets/img/no-image.jpg"}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-neutral-900 line-clamp-2">
                        {item.productName}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {item.color && <span>Màu: {item.color}</span>}
                        {item.color && item.size && <span className="mx-1">•</span>}
                        {item.size && <span>Size: {item.size}</span>}
                      </div>
                      <div className="mt-1 text-xs text-neutral-600">
                        {item.quantity} x {fmtVND(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-b border-neutral-200 pb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Tạm tính</span>
                  <span className="font-semibold text-neutral-900">
                    {fmtVND(totals.subTotal)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Phí vận chuyển</span>
                  <span className="font-semibold text-neutral-900">
                    {fmtVND(totals.shippingFee)}
                  </span>
                </div>

                {discountInfo && totals.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Giảm giá</span>
                    <span className="font-semibold">
                      -{fmtVND(totals.discountAmount)}
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mb-6 mt-4 flex items-center justify-between">
                <span className="text-base font-bold text-neutral-900">Tổng cộng</span>
                <span className="text-2xl font-extrabold text-neutral-900">
                  {fmtVND(totals.totalAmount)}
                </span>
              </div>

              {/* Confirm payment button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={submitting}
                className="w-full rounded-full bg-black px-6 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
              >
                {submitting ? "Đang xử lý..." : "XÁC NHẬN THANH TOÁN"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Discount Code Modal */}
      {showDiscountModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDiscountModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="text-lg font-bold text-neutral-900">
                  Chọn mã giảm giá
                </h2>
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100"
                >
                  ×
                </button>
              </div>

              {/* Content */}
              <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                {loadingDiscountCodes ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    Đang tải mã giảm giá...
                  </div>
                ) : availableDiscountCodes.length > 0 ? (
                  <div className="space-y-3">
                    {availableDiscountCodes.map((code) => {
                      const isSelected = discountInfo?.code === code.code;
                      
                      return (
                        <button
                          key={code.idDiscountCodes}
                          type="button"
                          onClick={() => {
                            handleSelectDiscountCode(code.code);
                            setShowDiscountModal(false);
                          }}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-neutral-900">
                                  {code.code}
                                </span>
                                {isSelected && (
                                  <span className="text-xs font-semibold text-emerald-600">
                                    ✓ Đã chọn
                                  </span>
                                )}
                              </div>
                              {code.description && (
                                <div className="mt-1 text-sm text-neutral-600">
                                  {code.description}
                                </div>
                              )}
                              <div className="mt-2 text-sm font-semibold text-emerald-600">
                                {code.discountType === "percentage"
                                  ? `Giảm ${code.discountValue}%`
                                  : `Giảm ${fmtVND(code.discountValue)}`}
                                {code.minOrderAmount && code.minOrderAmount > 0 && (
                                  <span className="ml-2 text-xs text-neutral-500">
                                    (Đơn tối thiểu {fmtVND(code.minOrderAmount)})
                                  </span>
                                )}
                              </div>
                              {code.validTo && (
                                <div className="mt-1 text-xs text-neutral-500">
                                  HSD: {new Date(code.validTo).toLocaleDateString("vi-VN")}
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    Hiện không có mã giảm giá nào
                  </div>
                )}

                {discountError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                    {discountError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Order;
