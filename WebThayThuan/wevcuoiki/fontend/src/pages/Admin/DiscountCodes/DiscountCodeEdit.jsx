import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminDiscountCode, updateDiscountCode } from "../../../services/AdminService";
import DiscountCodeForm from "./DiscountCodeForm";

export default function DiscountCodeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminDiscountCode(id);
        if (!mounted) return;
        setCode(data);
      } catch (err) {
        setError(err.message || "Không tải được mã giảm giá");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await updateDiscountCode(id, payload);
      alert("Cập nhật mã giảm giá thành công");
      navigate("/admin/discount-codes");
    } catch (err) {
      alert(err.message || "Không cập nhật được mã giảm giá");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-500">Đang tải mã giảm giá...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sửa mã giảm giá</h1>
        <p className="text-sm text-neutral-600 mt-1">Cập nhật thông tin mã #{code?.code}</p>
      </div>

      <DiscountCodeForm mode="edit" initialData={code} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

