import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart } from "../../services/CartService";
import { isLoggedIn, getCurrentUser } from "../../services/AuthService";
import { getProvinces, getDistricts, getWards } from "../../services/AddressService";
import { validateDiscountCode } from "../../services/DiscountCodeService";
import { createOrder } from "../../services/OrderService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(v || 0)
  );

const Order = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [step, setStep] = useState(1);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ===== FORM DATA =====
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
    paymentMethod: "cod",
  });

  // ===== ADDRESS DATA =====
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // ===== DISCOUNT =====
  const [discountInfo, setDiscountInfo] = useState(null);
  const [discountError, setDiscountError] = useState(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState("");

  // ================= INIT =================
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate("/login?returnUrl=/order");
      return;
    }

    const savedForm = sessionStorage.getItem("orderFormData");
    const savedStep = sessionStorage.getItem("orderStep");

    if (savedForm) {
      setFormData(JSON.parse(savedForm));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
      }));
    }

    if (savedStep === "2") setStep(2);

    loadCart();
    loadProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ================= LOADERS =================
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCart();
      setCart(data);
      if (!data.items?.length) setError("Giỏ hàng trống");
    } catch (err) {
      setError("Không tải được giỏ hàng");
    } finally {
      setLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      setLoadingAddress(true);
      setProvinces(await getProvinces());
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadDistricts = async (provinceCode) => {
    try {
      setLoadingAddress(true);
      setDistricts(await getDistricts(provinceCode));
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadWards = async (districtCode) => {
    try {
      setLoadingAddress(true);
      setWards(await getWards(districtCode));
    } finally {
      setLoadingAddress(false);
    }
  };

  // ================= ADDRESS CASCADE =================
  useEffect(() => {
    if (formData.provinceCode) {
      loadDistricts(formData.provinceCode);
    } else {
      setDistricts([]);
      setWards([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.provinceCode]);

  useEffect(() => {
    if (formData.districtCode) {
      loadWards(formData.districtCode);
    } else {
      setWards([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.districtCode]);


  // ================= INPUT HANDLER =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let updated = { ...formData };

    if (name === "provinceCode") {
      // Get name directly from selected option text (skip placeholder)
      const selectedOption = e.target.options[e.target.selectedIndex];
      const provinceName = value && selectedOption ? selectedOption.text : "";
      
      updated = {
        ...updated,
        provinceCode: value,
        provinceName: provinceName,
        districtCode: "",
        districtName: "",
        wardCode: "",
        wardName: "",
      };
    } 
    else if (name === "districtCode") {
      // Get name directly from selected option text (skip placeholder)
      const selectedOption = e.target.options[e.target.selectedIndex];
      const districtName = value && selectedOption ? selectedOption.text : "";
      
      updated = {
        ...updated,
        districtCode: value,
        districtName: districtName,
        wardCode: "",
        wardName: "",
      };
    } 
    else if (name === "wardCode") {
      // Get name directly from selected option text (skip placeholder)
      const selectedOption = e.target.options[e.target.selectedIndex];
      const wardName = value && selectedOption ? selectedOption.text : "";
      
      updated = {
        ...updated,
        wardCode: value,
        wardName: wardName,
      };
    } 
    else {
      updated[name] = value;
    }

    setFormData(updated);
    sessionStorage.setItem("orderFormData", JSON.stringify(updated));
  };

  // ================= DISCOUNT HANDLER =================
  const handleApplyDiscountCode = async () => {
    const code = discountCodeInput.trim();
    if (!code) {
      setDiscountError("Vui lòng nhập mã giảm giá");
      return;
    }

    try {
      setCheckingDiscount(true);
      setDiscountError(null);
      
      const validateResult = await validateDiscountCode(code);
      
      if (validateResult.isValid) {
        setDiscountInfo({
          idDiscountCodes: validateResult.idDiscountCodes,
          code: validateResult.code || code,
          discountType: validateResult.discountType,
          discountValue: validateResult.discountValue,
          minOrderAmount: validateResult.minOrderAmount,
        });
        setFormData(prev => ({ ...prev, discountCode: code }));
        setDiscountError(null);
      } else {
        throw new Error(validateResult.message || "Mã giảm giá không hợp lệ");
      }
    } catch (err) {
      setDiscountError(err?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn");
      setDiscountInfo(null);
      setFormData(prev => ({ ...prev, discountCode: "" }));
    } finally {
      setCheckingDiscount(false);
    }
  };

  const handleRemoveDiscountCode = () => {
    setDiscountInfo(null);
    setDiscountCodeInput("");
    setFormData(prev => ({ ...prev, discountCode: "" }));
    setDiscountError(null);
  };

  // ================= UTILS =================
  const getFullAddress = () =>
    [
      formData.shippingAddress,
      formData.wardName,
      formData.districtName,
      formData.provinceName,
    ].filter(Boolean).join(", ");

  const calculateTotals = () => {
    const subTotal = cart?.subTotal || 0;
    const shippingFee = 30000;
    let discountAmount = 0;

    if (discountInfo) {
      if (discountInfo.discountType === "percentage") {
        discountAmount = (subTotal * discountInfo.discountValue) / 100;
      } else {
        discountAmount = discountInfo.discountValue;
      }
      
      if (discountInfo.minOrderAmount && subTotal < discountInfo.minOrderAmount) {
        discountAmount = 0;
      }
    }

    return {
      subTotal,
      shippingFee,
      discountAmount,
      totalAmount: subTotal + shippingFee - discountAmount,
    };
  };

  // ================= STEP 1 SUBMIT =================
  const handleContinue = (e) => {
    e.preventDefault();
    setError(null);

    // Validate thông tin cơ bản
    if (!formData.fullName?.trim()) {
      setError("Vui lòng nhập họ tên");
      return;
    }
    if (!formData.phone?.trim()) {
      setError("Vui lòng nhập số điện thoại");
      return;
    }
    if (!formData.email?.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!formData.shippingAddress?.trim()) {
      setError("Vui lòng nhập địa chỉ chi tiết");
      return;
    }

    // Validate địa chỉ - cần có cả code và name
    if (!formData.provinceCode || !formData.provinceName) {
      setError("Vui lòng chọn tỉnh/thành phố");
      return;
    }
    if (!formData.districtCode || !formData.districtName) {
      setError("Vui lòng chọn quận/huyện");
      return;
    }
    if (!formData.wardCode || !formData.wardName) {
      setError("Vui lòng chọn phường/xã");
      return;
    }

    // Save to sessionStorage and move to step 2
    sessionStorage.setItem("orderFormData", JSON.stringify(formData));
    sessionStorage.setItem("orderStep", "2");
    setStep(2);
  };

  // ================= CONFIRM =================
  const handleConfirmPayment = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const totals = calculateTotals();
      const API_BASE_URL = import.meta.env.VITE_API_URL || "https://localhost:7194/api";
      const token = localStorage.getItem("token");

      const orderData = {
        shippingAddress: getFullAddress(),
        shippingFee: totals.shippingFee,
        totalAmount: totals.totalAmount,
        idDiscountCodes: discountInfo?.idDiscountCodes || null,
        paymentMethod: formData.paymentMethod === "momo" ? "momo" : "cod",
        note: formData.note || null,
      };

      // Tạo đơn hàng sử dụng OrderService
      const orderResult = await createOrder(orderData);
      const orderId = orderResult.idOrders || orderResult.IdOrders || orderResult.id;

      // Nếu là MoMo, tạo payment link và redirect
      if (formData.paymentMethod === "momo") {
        console.log("[Order] Creating MoMo payment for order:", orderId);
        
        const paymentRes = await fetch(`${API_BASE_URL}/Payment/create-momo-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            orderId: orderId,
            amount: totals.totalAmount,
            orderInfo: `Pay for order ${orderId}`
          }),
        });

        if (!paymentRes.ok) {
          const errorText = await paymentRes.text();
          throw new Error(errorText || "Tạo payment link thất bại");
        }

        const paymentResult = await paymentRes.json();
        console.log("[Order] Payment response:", paymentResult);
        
        // Check response structure
        const paymentUrl = paymentResult.data?.payUrl || paymentResult.payUrl;

        if (paymentUrl) {
          console.log("[Order] Redirecting to MoMo:", paymentUrl);
          // Redirect đến MoMo
          window.location.href = paymentUrl;
          return; // Không clear sessionStorage vì có thể quay lại
        } else {
          console.error("[Order] No payment URL in response:", paymentResult);
          throw new Error("Không nhận được payment URL từ MoMo");
        }
      }

      // Nếu là COD, xóa session và chuyển đến trang success
      sessionStorage.removeItem("orderFormData");
      sessionStorage.removeItem("orderStep");
      
      navigate(`/order-success?orderId=${orderId}`);
    } catch (err) {
      setError(err?.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ================= RENDER =================
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
              <label className="mb-2 block text-sm font-semibold text-neutral-700">
                Mã giảm giá
              </label>
              {discountInfo ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-emerald-600">
                      {discountInfo.code}
                    </span>
                    <span className="ml-2 text-xs text-emerald-600">
                      {discountInfo.discountType === "percentage" 
                        ? `(-${discountInfo.discountValue}%)`
                        : `(-${fmtVND(discountInfo.discountValue)})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDiscountCode}
                    className="text-xs font-semibold text-red-500 hover:text-red-600"
                  >
                    Xóa
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
                  />
                  <button
                    type="button"
                    onClick={handleApplyDiscountCode}
                    disabled={checkingDiscount}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-400"
                  >
                    {checkingDiscount ? "..." : "Áp dụng"}
                  </button>
                </div>
              )}
              {discountError && (
                <div className="mt-2 text-xs text-red-500">
                  {discountError}
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
                        {formData.wardName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Quận/Huyện:</span>
                      <span className="ml-2 text-neutral-900">
                        {formData.districtName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-neutral-700">Tỉnh/Thành phố:</span>
                      <span className="ml-2 text-neutral-900">
                        {formData.provinceName || "—"}
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

    </div>
  );
};

export default Order;