import { useEffect, useState, useRef } from 'react'
import { getBanners } from '../../services/BannerService'

const fallbackBanners = [
  { id: 'fallback-1', imageUrl: '/assets/img/Banners/banner1.jpg', link: '#' },
  { id: 'fallback-2', imageUrl: '/assets/img/Banners/banner2.jpg', link: '#' },
  { id: 'fallback-3', imageUrl: '/assets/img/Banners/banner3.jpg', link: '#' },
]

const BannerSlider = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const sliderRef = useRef(null)
  const [current, setCurrent] = useState(0)
  const autoplayRef = useRef(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)

  // Fallback banners (local assets) in case API trống hoặc lỗi
 

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBanners()
        setBanners(!data || data.length === 0 ? fallbackBanners : data)
      } catch (err) {
        console.error('Error loading banners', err)
        setBanners(fallbackBanners)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Autoplay every 5s
  useEffect(() => {
    if (!sliderRef.current || banners.length === 0) return
    const goTo = (idx) => {
      const clamped = ((idx % banners.length) + banners.length) % banners.length
      setCurrent(clamped)
      const width = sliderRef.current.clientWidth
      sliderRef.current.scrollTo({
        left: clamped * width,
        behavior: 'smooth'
      })
    }

    autoplayRef.current = setInterval(() => {
      goTo(current + 1)
    }, 5000)

    return () => clearInterval(autoplayRef.current)
  }, [current, banners.length])

  // Drag to scroll
  const onMouseDown = (e) => {
    if (!sliderRef.current) return
    isDragging.current = true
    startX.current = e.pageX - sliderRef.current.offsetLeft
    scrollLeft.current = sliderRef.current.scrollLeft
  }

  const onMouseLeave = () => {
    isDragging.current = false
  }

  const onMouseUp = () => {
    isDragging.current = false
  }

  const onMouseMove = (e) => {
    if (!isDragging.current || !sliderRef.current) return
    e.preventDefault()
    const x = e.pageX - sliderRef.current.offsetLeft
    const walk = (x - startX.current) * 1.2
    sliderRef.current.scrollLeft = scrollLeft.current - walk
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      <div
        ref={sliderRef}
        className="flex h-full overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar cursor-grab active:cursor-grabbing bg-gray-50"
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
      >
        {banners.map((banner, idx) => {
          const key = banner.IdBanners || banner.id_banners || banner.id || `banner-${idx}`
          const rawImg = banner.ImageUrl || banner.image_url || banner.imageUrl
          let img = rawImg || ''
          if (img && !img.startsWith('http') && !img.startsWith('/assets/')) {
            img = `/assets/img/Banners/${img}`
          }
          const linkRaw = banner.LinkUrl || banner.link_url || '#'
          const link = linkRaw && linkRaw !== '#' && !linkRaw.startsWith('http') ? `/${linkRaw}` : (linkRaw || '#')
          if (!img) return null
          return (
            <div
              key={key}
              className="w-full h-full flex-none snap-center relative"
            >
              <a
                href={link}
                target={link && link !== '#' ? '_blank' : '_self'}
                rel="noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={img}
                  alt="Banner"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />
              </a>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default BannerSlider

