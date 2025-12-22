import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../../../services/AdminService";
import UserForm from "./UserForm";

export default function UserCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (payload) => {
    try {
      setSubmitting(true);
      await createUser(payload);
      alert("Tạo người dùng thành công");
      navigate("/admin/users");
    } catch (err) {
      alert(err.message || "Không tạo được người dùng");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Thêm người dùng mới</h1>
        <p className="text-sm text-neutral-600 mt-1">Tạo tài khoản người dùng mới</p>
      </div>

      <UserForm mode="create" onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

