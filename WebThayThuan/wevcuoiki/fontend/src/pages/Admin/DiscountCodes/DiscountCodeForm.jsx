import { useEffect, useState } from "react";

const defaultData = {
  code: "",
  discountType: "percent",
  discountValue: "",
  minOrderAmount: "",
  usageLimit: "",
  validFrom: "",
  validTo: "",
  status: "active",
};

export default function DiscountCodeForm({ mode = "create", initialData, onSubmit, submitting }) {
  const [form, setForm] = useState(defaultData);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || "",
        discountType: initialData.discountType || "percent",
        discountValue: initialData.discountValue ?? "",
        minOrderAmount: initialData.minOrderAmount ?? "",
        usageLimit: initialData.usageLimit ?? "",
        validFrom: initialData.validFrom 
          ? new Date(initialData.validFrom).toISOString().split('T')[0]
          : "",
        validTo: initialData.validTo 
          ? new Date(initialData.validTo).toISOString().split('T')[0]
          : "",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error khi user thay đổi
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.code.trim()) {
      newErrors.code = "Mã giảm giá không được để trống";
    }

    if (!form.discountValue || form.discountValue <= 0) {
      newErrors.discountValue = "Giá trị giảm giá phải > 0";
    }

    if (form.discountType === "percent" && form.discountValue > 100) {
      newErrors.discountValue = "Giảm giá theo % không được vượt quá 100%";
    }

    if (form.validFrom && form.validTo && new Date(form.validFrom) > new Date(form.validTo)) {
      newErrors.validTo = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      alert("Vui lòng kiểm tra lại thông tin");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
      usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
      validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : null,
      validTo: form.validTo ? new Date(form.validTo).toISOString() : null,
      status: form.status,
    };

    onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Mã giảm giá <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${
              errors.code ? "border-red-300" : "border-neutral-300"
            }`}
            value={form.code}
            onChange={(e) => handleChange("code", e.target.value.toUpperCase())}
            placeholder="Ví dụ: SALE2024"
            required
            disabled={mode === "edit"}
          />
          {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
          {mode === "edit" && (
            <p className="mt-1 text-xs text-neutral-500">Không thể thay đổi mã sau khi tạo</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Trạng thái</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Loại giảm giá <span className="text-red-500">*</span>
          </label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.discountType}
            onChange={(e) => handleChange("discountType", e.target.value)}
          >
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định (VND)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Giá trị giảm giá <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            max={form.discountType === "percent" ? 100 : undefined}
            step={form.discountType === "percent" ? "0.01" : "1000"}
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${
              errors.discountValue ? "border-red-300" : "border-neutral-300"
            }`}
            value={form.discountValue}
            onChange={(e) => handleChange("discountValue", e.target.value)}
            placeholder={form.discountType === "percent" ? "10 (10%)" : "50000 (50,000 VND)"}
            required
          />
          {errors.discountValue && (
            <p className="mt-1 text-xs text-red-600">{errors.discountValue}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            {form.discountType === "percent"
              ? "Nhập số phần trăm (0-100)"
              : "Nhập số tiền giảm (VND)"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Đơn hàng tối thiểu (VND)</label>
          <input
            type="number"
            min="0"
            step="1000"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.minOrderAmount}
            onChange={(e) => handleChange("minOrderAmount", e.target.value)}
            placeholder="0 (không giới hạn)"
          />
          <p className="mt-1 text-xs text-neutral-500">Đơn hàng phải đạt số tiền này mới được dùng mã</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Giới hạn sử dụng</label>
          <input
            type="number"
            min="1"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.usageLimit}
            onChange={(e) => handleChange("usageLimit", e.target.value)}
            placeholder="Không giới hạn"
          />
          <p className="mt-1 text-xs text-neutral-500">Số lần tối đa mã có thể được sử dụng</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Ngày bắt đầu hiệu lực</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.validFrom}
            onChange={(e) => handleChange("validFrom", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Ngày kết thúc hiệu lực</label>
          <input
            type="date"
            className={`mt-1 w-full rounded-lg border px-3 py-2 ${
              errors.validTo ? "border-red-300" : "border-neutral-300"
            }`}
            value={form.validTo}
            onChange={(e) => handleChange("validTo", e.target.value)}
            min={form.validFrom || undefined}
          />
          {errors.validTo && <p className="mt-1 text-xs text-red-600">{errors.validTo}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Đang lưu..." : mode === "create" ? "Tạo mã giảm giá" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}

