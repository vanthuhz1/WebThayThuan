import { useState, useEffect } from "react";
import BannerSlider from "../../components/Banner/BannerSlider";
import CategoryCarousel from "../../components/Category/CategoryCarousel";
import { getFeaturedCategories } from "../../services/CategoryService";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch featured categories
    (async () => {
      try {
        const data = await getFeaturedCategories(100);
        if (mounted) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Lỗi tải danh mục", err);
        if (mounted) setCategories([]);
      } finally {
        if (mounted) setCategoriesLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <BannerSlider />

      {/* Featured Categories Section */}
      <div className="w-full py-8 md:py-12" style={{ paddingLeft: "50px", paddingRight: "50px" }}>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
            DANH MỤC SẢN PHẨM
          </h2>
        </div>

        {categoriesLoading ? (
          <div className="text-center py-12">
            <p className="text-sm text-neutral-500">Đang tải danh mục...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-neutral-500">Không có danh mục nào.</p>
          </div>
        ) : (
          <CategoryCarousel categories={categories} />
        )}
      </div>
    </>
  );
}
