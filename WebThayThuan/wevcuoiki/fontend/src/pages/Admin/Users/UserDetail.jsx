import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteUser,
  getAdminUser,
  updateUserRole,
  updateUserStatus,
} from "../../../services/AdminService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState("customer");
  const [status, setStatus] = useState("active");
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getAdminUser(id);
        if (!mounted) return;
        setUser(data);
        // Map "user" cũ sang "customer" mới
        setRole(data.role === "user" ? "customer" : (data.role || "customer"));
        setStatus(data.status || "active");
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

  const handleUpdateRole = async () => {
    try {
      setSaving(true);
      await updateUserRole(id, role);
      alert("Cập nhật vai trò thành công");
      setUser((prev) => (prev ? { ...prev, role } : prev));
    } catch (err) {
      alert(err.message || "Không cập nhật vai trò");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      setSaving(true);
      await updateUserStatus(id, status);
      alert("Cập nhật trạng thái thành công");
      setUser((prev) => (prev ? { ...prev, status } : prev));
    } catch (err) {
      alert(err.message || "Không cập nhật trạng thái");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    const userName = user.fullName || "người dùng";
    const userEmail = user.email || "";
    
    if (!confirm(`⚠️ CẢNH BÁO: Bạn có chắc muốn XÓA VĨNH VIỄN tài khoản ${userName} (${userEmail})?\n\nHành động này sẽ:\n- Xóa tất cả đơn hàng của user\n- Xóa giỏ hàng, wishlist\n- Xóa tất cả dữ liệu liên quan\n- KHÔNG THỂ HOÀN TÁC!`)) return;
    
    const confirmText = prompt('Nhập "XÓA" để xác nhận xóa vĩnh viễn:');
    // Xử lý: trim whitespace, so sánh không phân biệt hoa thường, và kiểm tra null (user click Cancel)
    if (!confirmText || confirmText.trim().toUpperCase() !== "XÓA") {
      if (confirmText === null) {
        // User click Cancel
        alert("Đã hủy xóa tài khoản");
      } else {
        alert('Vui lòng nhập chính xác "XÓA" để xác nhận');
      }
      return;
    }

    try {
      setSaving(true);
      const result = await deleteUser(id);
      const message = result?.message || "Đã xóa tài khoản thành công";
      alert(message);
      navigate("/admin/users");
    } catch (err) {
      alert(err.message || "Không xóa được tài khoản");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-neutral-500">Đang tải...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!user) return <p className="text-neutral-500">Không có dữ liệu</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{user.fullName}</h1>
          <p className="text-sm text-neutral-600">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/admin/users/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faEdit} />
            Sửa thông tin
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
          >
            Quay lại
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Thông tin</h2>
          <p className="text-sm text-neutral-700">Điện thoại: {user.phone || "N/A"}</p>
          <p className="text-sm text-neutral-700">Vai trò: {user.role}</p>
          <p className="text-sm text-neutral-700">Trạng thái: {user.status}</p>
          <p className="text-sm text-neutral-700">
            Ngày tạo: {user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
          <h2 className="text-lg font-semibold text-neutral-900">Tổng quan đơn hàng</h2>
          <p className="text-sm text-neutral-700">Số đơn: {user.orderCount || 0}</p>
          <p className="text-sm text-neutral-700">Tổng chi tiêu: {fmtVND(user.totalSpent)}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">Cập nhật</h2>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Vai trò</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="button"
              onClick={handleUpdateRole}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu vai trò"}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2"
            >
              <option value="active">Hoạt động</option>
              <option value="banned">Bị khóa</option>
            </select>
            <button
              type="button"
              onClick={handleUpdateStatus}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Đang lưu..." : "Lưu trạng thái"}
            </button>
          </div>

          <div className="pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 w-full"
            >
              {saving ? "Đang xử lý..." : "Xóa tài khoản"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Đơn hàng gần đây</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          {(user.orders || []).map((o) => (
            <div key={o.idOrders} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-neutral-900">{o.orderNumber}</p>
                <p className="text-sm text-neutral-600">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">{o.status}</p>
                <p className="font-semibold text-neutral-900">{fmtVND(o.totalAmount)}</p>
              </div>
            </div>
          ))}
          {(user.orders || []).length === 0 && (
            <div className="p-4 text-sm text-neutral-500">Không có đơn hàng</div>
          )}
        </div>
      </div>
    </div>
  );
}

