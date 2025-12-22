import { useEffect, useState } from "react";

const defaultData = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  role: "customer",
  status: "active",
};

export default function UserForm({ mode = "create", initialData, onSubmit, submitting }) {
  const [form, setForm] = useState(defaultData);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        password: "", // Không hiển thị password cũ
        phone: initialData.phone || "",
        role: initialData.role || "customer",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!form.fullName.trim()) {
      alert("Vui lòng nhập họ tên");
      return;
    }
    if (!form.email.trim()) {
      alert("Vui lòng nhập email");
      return;
    }
    if (mode === "create" && !form.password.trim()) {
      alert("Vui lòng nhập mật khẩu");
      return;
    }
    if (form.password && form.password.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || null,
      role: form.role,
      status: form.status,
    };

    // Chỉ gửi password nếu có (khi create hoặc khi edit có thay đổi password)
    if (form.password.trim()) {
      payload.password = form.password;
    }

    onSubmit(payload);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Họ tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {mode === "create" ? (
              <>
                Mật khẩu <span className="text-red-500">*</span>
              </>
            ) : (
              "Mật khẩu mới (để trống nếu không đổi)"
            )}
          </label>
          <div className="mt-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-10"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required={mode === "create"}
              minLength={mode === "create" ? 6 : 0}
              placeholder={mode === "edit" ? "Để trống nếu không đổi" : ""}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Điện thoại</label>
          <input
            type="tel"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Vai trò</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Trạng thái</label>
          <select
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khóa</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {submitting ? "Đang lưu..." : mode === "create" ? "Tạo người dùng" : "Lưu thay đổi"}
        </button>
      </div>
    </form>
  );
}

