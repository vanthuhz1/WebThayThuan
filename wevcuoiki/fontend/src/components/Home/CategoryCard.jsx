import { Link } from 'react-router-dom'

const CategoryCard = ({ category }) => {
  const imageSrc = category.categoryImage
    ? category.categoryImage.startsWith('http')
      ? category.categoryImage
      : `/assets/img/${category.categoryImage}`
    : '/assets/img/icon/01.svg'

  return (
    <Link
      to={`/shop-sidebar?categoryId=${category.idCategories}`}
      className="card group hover:scale-105 transition-all duration-300"
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center p-3 group-hover:from-primary group-hover:to-primary-dark transition-all">
          <img
            src={imageSrc}
            alt={category.name}
            className="w-full h-full object-contain filter brightness-0 group-hover:brightness-100 transition-all"
            onError={(e) => {
              e.target.src = '/assets/img/icon/01.svg'
            }}
            loading="lazy"
          />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {category.name}
          </h3>
        </div>
      </div>
    </Link>
  )
}

export default CategoryCard

