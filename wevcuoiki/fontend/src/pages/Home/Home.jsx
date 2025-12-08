import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../services/CategoryService'
import CategoryCard from '../../components/Home/CategoryCard'
import FeatureCard from '../../components/Home/FeatureCard'
import BannerSlider from '../../components/Banner/BannerSlider'
import ProductGrid from '../../components/Product/ProductGrid'

const FEATURES = [
  {
    icon: 'fa-solid fa-truck',
    title: 'Miễn phí vận chuyển',
    description: 'Cho đơn hàng trên 500.000đ',
  },
  {
    icon: 'fa-solid fa-shield-halved',
    title: 'Bảo hành chính hãng',
    description: 'Cam kết chất lượng sản phẩm',
  },
  {
    icon: 'fa-solid fa-headset',
    title: 'Hỗ trợ 24/7',
    description: 'Đội ngũ tư vấn chuyên nghiệp',
  },
]

const Home = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories()
        setCategories(data.slice(0, 20))
      } catch (error) {
        console.error('Error loading categories:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  return (
    <>
      {/* Fullscreen Banner Slider */}
      <BannerSlider />

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Danh Mục Sản Phẩm
            </h2>
            <p className="text-gray-600 text-lg">
              Khám phá bộ sưu tập đa dạng của chúng tôi
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {categories.map((category) => (
                <CategoryCard key={category.idCategories} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Không có danh mục nào</p>
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sản phẩm mới
            </h2>
            <p className="text-gray-600 text-lg">
              Bộ sưu tập được cập nhật thường xuyên
            </p>
          </div>
          <ProductGrid />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Discount Codes Section - removed while feature is unavailable */}
    </>
  )
}

export default Home

