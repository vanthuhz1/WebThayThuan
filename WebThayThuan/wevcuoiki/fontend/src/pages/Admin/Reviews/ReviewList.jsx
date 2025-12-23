import { useState, useEffect } from "react";
import { getReviews, deleteReview, updateReview } from "../../../services/AdminReviewService";

export default function ReviewList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviews({
        page,
        pageSize: 20,
        status: status === "all" ? null : status,
        rating: rating || null,
      });
      setReviews(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [page, status, rating]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await deleteReview(id);
      loadReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateReview(id, { status: newStatus });
      loadReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: "Hiển thị", class: "bg-green-100 text-green-700" },
      visible: { label: "Hiển thị", class: "bg-green-100 text-green-700" },
      pending: { label: "Chờ duyệt", class: "bg-yellow-100 text-yellow-700" },
      hidden: { label: "Ẩn", class: "bg-gray-100 text-gray-700" },
    };
    const config = statusMap[status] || { label: status, class: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Quản lý đánh giá</h1>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hiển thị</option>
          <option value="pending">Chờ duyệt</option>
          <option value="hidden">Ẩn</option>
        </select>

        <select
          value={rating}
          onChange={(e) => {
            setRating(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
        >
          <option value="">Tất cả sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-neutral-500">Đang tải...</p>
      ) : reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-neutral-500">Chưa có đánh giá nào</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Người đánh giá</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Đánh giá</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Nội dung</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Ngày tạo</th>
                  <th className="px-4 py-3 text-center font-semibold text-neutral-700">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {reviews.map((review) => (
                  <tr key={review.idProductReviews} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-neutral-900 line-clamp-1">
                        {review.productName || `SP #${review.idProducts}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-900">{review.userName || "Ẩn danh"}</p>
                      <p className="text-xs text-neutral-500">{review.userEmail}</p>
                    </td>
                    <td className="px-4 py-3">{renderStars(review.rating)}</td>
                    <td className="px-4 py-3">
                      <p className="text-neutral-600 line-clamp-2 max-w-xs">
                        {review.review || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(review.status)}</td>
                    <td className="px-4 py-3 text-neutral-600">{formatDate(review.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {review.status !== "active" && review.status !== "visible" && (
                          <button
                            onClick={() => handleStatusChange(review.idProductReviews, "active")}
                            className="rounded bg-green-500 px-2 py-1 text-xs font-semibold text-white hover:bg-green-600"
                            title="Duyệt"
                          >
                            Duyệt
                          </button>
                        )}
                        {(review.status === "active" || review.status === "visible") && (
                          <button
                            onClick={() => handleStatusChange(review.idProductReviews, "hidden")}
                            className="rounded bg-gray-500 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-600"
                            title="Ẩn"
                          >
                            Ẩn
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.idProductReviews)}
                          className="rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                          title="Xóa"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
              >
                Trước
              </button>
              <span className="text-sm text-neutral-600">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-sm disabled:opacity-50"
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
