import { useEffect, useState } from 'react'
import ProductCard from './ProductCard'
import { getProducts } from '../../services/ProductService'

const ProductGrid = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProducts({ pageSize: 8 })
        setItems(data?.items || data || [])
      } catch (err) {
        console.error('Error loading products', err)
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        Chưa có sản phẩm
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((p) => (
        <ProductCard key={p.idProducts || p.IdProducts || p.id || p.Id || p.slug} product={p} />
      ))}
    </div>
  )
}

export default ProductGrid

