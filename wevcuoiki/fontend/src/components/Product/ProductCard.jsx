import { Link } from 'react-router-dom'

const ProductCard = ({ product }) => {
  const img =
    product.imageUrl ||
    product.ImageUrl ||
    product.image_url ||
    product.image ||
    '/assets/img/placeholder/product.png'

  const price =
    product.display_price ||
    product.DisplayPrice ||
    product.salePrice ||
    product.SalePrice ||
    product.price ||
    product.Price ||
    0

  return (
    <div className="group">
      <Link to={`/product-details/${product.idProducts || product.IdProducts || product.id || product.Id || product.slug || ''}`}>
        <div className="relative overflow-hidden bg-gray-50 rounded-lg aspect-[3/4]">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.target.src = '/assets/img/placeholder/product.png' }}
          />
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {price.toLocaleString('vi-VN')}₫
          </p>
        </div>
      </Link>
    </div>
  )
}

export default ProductCard

