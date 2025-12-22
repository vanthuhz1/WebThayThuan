import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAdminDiscountCodes,
  deleteDiscountCode,
} from "../../../services/AdminService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faSearch } from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function DiscountCodeList() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCodes();
  }, [page, statusFilter, typeFilter, searchTerm]);

  const loadCodes = async () => {
    try {
      setLoading(true);
      const data = await getAdminDiscountCodes({
        page,
        pageSize: 20,
        status: statusFilter === "all" ? null : statusFilter,
        discountType: typeFilter === "all" ? null : typeFilter,
        search: searchTerm || null,
      });
      setCodes(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Lỗi tải mã giảm giá", err);
      alert(err.message || "Không tải được mã giảm giá");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá ${code}?`)) return;

    try {
      const result = await deleteDiscountCode(id);
      alert(result?.message || "Xóa mã giảm giá thành công");
      loadCodes();
    } catch (err) {
      alert(err.message || "Không thể xóa mã giảm giá");
    }
  };

  const getStatusBadge = (code) => {
    if (code.isExpired) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">Hết hạn</span>;
    }
    if (code.isExpiringSoon) {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Sắp hết hạn</span>;
    }
    if (code.status === "active") {
      return <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">Active</span>;
    }
    return <span className="px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">Inactive</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Mã giảm giá</h1>
          <p className="text-sm text-neutral-600 mt-1">Tổng cộng: {totalItems} mã</p>
        </div>
        <Link
          to="/admin/discount-codes/new"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm mã giảm giá</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Tìm kiếm theo mã..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Hết hạn</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Tất cả loại</option>
            <option value="percent">Phần trăm (%)</option>
            <option value="fixed">Số tiền cố định</option>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Mã</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Giá trị</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Đơn tối thiểu</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Sử dụng</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Thời hạn</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-sm text-neutral-500">
                      Không có mã giảm giá nào
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.idDiscountCodes} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{code.code}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {code.discountType === "percent" ? "Phần trăm" : "Số tiền"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-neutral-900">
                          {code.discountType === "percent"
                            ? `${code.discountValue}%`
                            : fmtVND(code.discountValue)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {code.minOrderAmount ? fmtVND(code.minOrderAmount) : "Không giới hạn"}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {code.usageLimit ? (
                          <div>
                            <p>{code.usedCount || 0} / {code.usageLimit}</p>
                            <p className="text-xs text-neutral-500">
                              Còn lại: {code.remainingUsage || 0}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p>{code.usedCount || 0} lần</p>
                            <p className="text-xs text-neutral-500">Không giới hạn</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        <div>
                          <p>Từ: {formatDate(code.validFrom)}</p>
                          <p>Đến: {formatDate(code.validTo)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(code)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/discount-codes/${code.idDiscountCodes}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Sửa"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(code.idDiscountCodes, code.code)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                            title="Xóa"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

