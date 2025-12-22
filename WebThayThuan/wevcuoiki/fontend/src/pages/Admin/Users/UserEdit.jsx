import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAdminUser, updateUser } from "../../../services/AdminService";
import UserForm from "./UserForm";

export default function UserEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminUser(id);
        if (!mounted) return;
        setUser(data);
      } catch (err) {
        setError(err.message || "Không tải được người dùng");
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
      await updateUser(id, payload);
      alert("Cập nhật người dùng thành công");
      navigate("/admin/users");
    } catch (err) {
      alert(err.message || "Không cập nhật được người dùng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-neutral-500">Đang tải người dùng...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Sửa người dùng</h1>
        <p className="text-sm text-neutral-600 mt-1">Cập nhật thông tin người dùng #{id}</p>
      </div>

      <UserForm mode="edit" initialData={user} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}

