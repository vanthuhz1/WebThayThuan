import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAdminProducts, deleteProduct } from "../../../services/AdminService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEdit, faTrash, faEye } from "@fortawesome/free-solid-svg-icons";

const fmtVND = (v) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(v || 0));

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all"); // "all", "active", "inactive"

  useEffect(() => {
    loadProducts();
  }, [page, statusFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAdminProducts({ 
        page, 
        pageSize: 20,
        status: statusFilter === "all" ? null : statusFilter
      });
      setProducts(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalItems(data.totalItems || 0);
    } catch (err) {
      console.error("Lỗi tải sản phẩm", err);
      alert(err.message || "Không tải được sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await deleteProduct(id);
      alert("Xóa sản phẩm thành công");
      loadProducts();
    } catch (err) {
      alert(err.message || "Không thể xóa sản phẩm");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Quản lý Sản phẩm</h1>
          <p className="text-sm text-neutral-600 mt-1">Tổng cộng: {totalItems} sản phẩm</p>
        </div>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Thêm sản phẩm</span>
        </Link>
      </div>

      {/* Filter by Status */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-neutral-700">Lọc theo trạng thái:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1); // Reset về trang 1 khi đổi filter
            }}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="all">Tất cả</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Hình ảnh</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Giá</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Danh mục</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-700 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-sm text-neutral-500">
                      Không có sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.idProducts} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <img
                          src={product.thumbnailUrl || "/assets/img/no-image.jpg"}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{product.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{product.sku}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {product.salePrice ? (
                            <>
                              <span className="text-sm font-semibold text-red-600">{fmtVND(product.salePrice)}</span>
                              <span className="text-xs text-neutral-500 line-through">{fmtVND(product.price)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-semibold text-neutral-900">{fmtVND(product.price)}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">{product.categoryName || "N/A"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            product.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/products/${product.idProducts}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Xem chi tiết"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <Link
                            to={`/admin/products/${product.idProducts}/edit`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
                            title="Sửa"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.idProducts)}
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



