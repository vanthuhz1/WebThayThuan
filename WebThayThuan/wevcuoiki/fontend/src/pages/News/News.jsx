// src/pages/News/News.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBanners } from "../../services/BannerService";
import { getBlogs, getFashionNewsFromAPI } from "../../services/BlogService";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
};

export default function News() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load blogs - ưu tiên API thời trang, fallback backend
        let blogsData;
        try {
          blogsData = await getFashionNewsFromAPI({ page, pageSize: 9 });
        } catch (err) {
          // Fallback to backend API
          console.warn("Không thể lấy tin từ API bên ngoài, sử dụng backend:", err);
          blogsData = await getBlogs({ page, pageSize: 9 });
        }
        
        if (!mounted) return;

        const blogsList = blogsData?.items ?? blogsData?.Items ?? [];
        setBlogs(Array.isArray(blogsList) ? blogsList : []);
        setTotalPages(blogsData?.totalPages ?? blogsData?.TotalPages ?? 1);

        // Load banners
        const bannersData = await getBanners();
        if (!mounted) return;
        setBanners(Array.isArray(bannersData) ? bannersData : []);
      } catch (err) {
        console.error("Lỗi tải dữ liệu", err);
        if (mounted) {
          setError(err?.message || "Không tải được dữ liệu");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [page]);

  return (
    <div className="w-full">
      {/* Banner Section */}
      {banners.length > 0 && (
        <div className="mb-12">
          <div className="mx-auto max-w-7xl px-3">
            <div className="relative w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden">
              <div className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar">
                {banners.slice(0, 3).map((banner, idx) => {
                  const key = banner.IdBanners || banner.id_banners || banner.id || `banner-${idx}`;
                  const rawImg = banner.ImageUrl || banner.image_url || banner.imageUrl;
                  let img = rawImg || "";
                  if (img && !img.startsWith("http") && !img.startsWith("/assets/")) {
                    img = `/assets/img/Banners/${img}`;
                  }
                  const linkRaw = banner.LinkUrl || banner.link_url || "#";
                  const link = linkRaw && linkRaw !== "#" && !linkRaw.startsWith("http") ? `/${linkRaw}` : (linkRaw || "#");
                  
                  if (!img) return null;
                  
                  return (
                    <div key={key} className="w-full h-full flex-none snap-center relative">
                      <a
                        href={link}
                        target={link && link !== "#" ? "_blank" : "_self"}
                        rel="noreferrer"
                        className="block w-full h-full"
                      >
                        <img
                          src={img}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-7xl px-3 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Tin Thời Trang</h1>
          <p className="text-neutral-600">Cập nhật những xu hướng thời trang mới nhất</p>
        </div>

        {/* Blog List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-neutral-100 animate-pulse aspect-[4/3]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-white p-6 text-center text-neutral-600">{error}</div>
        ) : blogs.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center">
            <p className="text-lg font-semibold text-neutral-900 mb-2">
              Chưa có bài viết nào
            </p>
            <p className="text-sm text-neutral-600">
              Các bài viết sẽ được cập nhật sớm nhất
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {blogs.map((blog) => {
                const blogId = blog.idBlogs ?? blog.IdBlogs;
                const slug = blog.slug ?? blog.Slug;
                const thumbnail = blog.thumbnail ?? blog.Thumbnail ?? "/assets/img/no-image.jpg";
                const title = blog.title ?? blog.Title ?? "Tiêu đề bài viết";
                const excerpt = blog.excerpt ?? blog.Excerpt ?? "";
                const authorName = blog.authorName ?? blog.AuthorName ?? "Admin";
                const publishedAt = blog.publishedAt ?? blog.PublishedAt;
                const link = blog.link ?? blog.Link; // Link gốc từ RSS feed
                
                // Nếu có link từ RSS, mở link gốc; nếu không, điều hướng nội bộ
                const isExternalLink = link && (link.startsWith("http://") || link.startsWith("https://"));
                const href = isExternalLink ? link : `/news/${slug || blogId}`;

                const CardContent = (
                  <div className="group block rounded-xl bg-white border border-neutral-200 overflow-hidden hover:shadow-lg transition-all">
                    {/* Thumbnail */}
                    <div className="relative w-full aspect-[4/3] overflow-hidden bg-neutral-100">
                      <img
                        src={thumbnail}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = "/assets/img/no-image.jpg";
                        }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {title}
                      </h3>
                      {excerpt && (
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-3">
                          {excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{authorName}</span>
                        {publishedAt && <span>{formatDate(publishedAt)}</span>}
                      </div>
                    </div>
                  </div>
                );

                return isExternalLink ? (
                  <a
                    key={blogId}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    {CardContent}
                  </a>
                ) : (
                  <Link key={blogId} to={href}>
                    {CardContent}
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-neutral-600">
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
