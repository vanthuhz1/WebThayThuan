import { useNavigate } from "react-router-dom";

export default function CategoryCard({ category }) {
  const navigate = useNavigate();

  const handleClick = () => {
    const slug = category?.slug || category?.Slug;
    if (slug) navigate(`/collections/${slug}`);
  };

  const imageUrl = category?.img || category?.Img;
  const categoryName = category?.name || category?.Name || "Danh mục";

  return (
    <div
      onClick={handleClick}
      className="relative group cursor-pointer overflow-hidden rounded-lg h-[400px] md:h-[500px]"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />

      {/* White bottom strip */}
      <div className="absolute left-0 right-0 bottom-0 z-10 h-[88px] bg-white/70 backdrop-blur-md">
        <div className="h-full flex items-center justify-between px-5">
          <h3 className="text-black text-[22px] font-medium">{categoryName}</h3>

          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
