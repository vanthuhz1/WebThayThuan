import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminUsers } from "../../../services/AdminService";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers({
        page,
        pageSize: 20,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Lỗi tải người dùng", err);
      alert(err.message || "Không tải được người dùng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "banned":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Người dùng</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-neutral-300 rounded-lg"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="banned">Bị khóa</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-neutral-500">Đang tải...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Họ tên</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Điện thoại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Vai trò</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Đơn hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Chi tiêu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Ngày tạo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-sm text-neutral-500">
                      Không có người dùng nào
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.idUsers} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{u.fullName}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{u.email}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{u.phone || "N/A"}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{u.role}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{u.ordersCount || 0}</td>
                      <td className="px-4 py-3 text-sm text-neutral-700">{fmtVND(u.totalSpent)}</td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/users/${u.idUsers}`}
                          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg text-sm font-medium"
                        >
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm text-neutral-600">
                Trang {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-neutral-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

