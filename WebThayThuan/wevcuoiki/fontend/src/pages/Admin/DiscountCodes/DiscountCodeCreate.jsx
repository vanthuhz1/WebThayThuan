import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDiscountCode } from "../../../services/AdminService";
import DiscountCodeForm from "./DiscountCodeForm";

export default function DiscountCodeCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      const result = await createDiscountCode(payload);
      alert(result?.message || "Tạo mã giảm giá thành công");
      navigate("/admin/discount-codes");
    } catch (err) {
      alert(err.message || "Không tạo được mã giảm giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Thêm mã giảm giá mới</h1>
        <p className="text-sm text-neutral-600 mt-1">Tạo mã giảm giá mới cho khách hàng</p>
      </div>

      <DiscountCodeForm mode="create" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

