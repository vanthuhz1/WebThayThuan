import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getNavigationData } from '../../services/NavigationService'
import { NAVIGATION_ITEMS } from '../../constants/navigation'

const Navigation = ({ isScrolled = true, isMobile = false }) => {
  const location = useLocation()
  const [childrenMap, setChildrenMap] = useState({})
  const [hoverId, setHoverId] = useState(null)
  const [hoverChildId, setHoverChildId] = useState(null)

  useEffect(() => {
    const fetchNav = async () => {
      try {
        const data = await getNavigationData()
        // Map slug -> children từ backend (chỉ lấy danh mục con)
        const map = {}
        data.forEach((root) => {
          map[root.slug] = root.children || []
        })
        setChildrenMap(map)
      } catch (err) {
        console.warn('Navigation API fallback to static items', err)
        setChildrenMap({})
      }
    }
    fetchNav()
  }, [])

  // Dùng NAVIGATION_ITEMS làm menu gốc, chỉ đính kèm children từ backend nếu có
  const itemsToRender = NAVIGATION_ITEMS.map((item) => {
    const slug = item.path.startsWith('/') ? item.path.slice(1) : item.path
    return {
      ...item,
      id: item.path,
      children: childrenMap[slug] || []
    }
  })

  return (
    <nav id="mobile-menu" className="block">
      <ul className={`flex list-none p-0 gap-3 md:gap-4 lg:gap-5 items-center flex-wrap ${
        isMobile ? 'flex-col items-start' : 'justify-center'
      }`}>
        {itemsToRender.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          const hasChildren = item.children && item.children.length > 0
          return (
            <li
              key={item.id || item.path}
              className="relative"
              onMouseEnter={() => !isMobile && setHoverId(item.id)}
              onMouseLeave={() => !isMobile && setHoverId(null)}
            >
              <Link 
                to={item.path}
                className={`no-underline text-[13px]  font-semibold py-2 px-2 flex items-center gap-1 transition-colors relative group ${
                  isActive 
                    ? 'text-gray-900' 
                    : 'text-gray-800 hover:text-gray-900'
                }`}
              >
                {item.label}
                {hasChildren && (
                  <i className="fa-solid fa-chevron-down text-[10px]"></i>
                )}
                <span 
                  className={`absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                ></span>
              </Link>

              {/* Dropdown for desktop */}
              {hasChildren && !isMobile && hoverId === item.id && (
                <div
                  className="absolute left-0 top-full bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg min-w-[520px] z-[1100] pointer-events-auto"
                  onMouseEnter={() => {
                    setHoverId(item.id)
                    setHoverChildId(null)
                  }}
                  onMouseLeave={() => {
                    setHoverId(null)
                    setHoverChildId(null)
                  }}
                >
                  <div className="flex">
                    {/* Left: level 2 (children) */}
                    <ul className="py-2 space-y-1 w-1/2 border-r border-gray-100">
                      {item.children.map((child) => (
                        <li
                          key={child.id}
                          className="px-4 relative"
                          onMouseEnter={() => setHoverChildId(child.id)}
                        >
                          <Link
                            to={`/collections/${child.slug}`}
                            className="block py-1.5 text-sm text-gray-800 hover:bg-gray-50 hover:text-black rounded"
                          >
                            {child.name}
                          </Link>
                          {hoverChildId === child.id && child.children && child.children.length > 0 && (
                            <div className="absolute top-0 left-full ml-2 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg min-w-[220px] py-2 px-3 z-[1101]">
                              <ul className="space-y-1">
                                {child.children.map((grand) => (
                                  <li key={grand.id}>
                                    <Link
                                      to={`/collections/${grand.slug}`}
                                      className="block py-1 text-sm text-gray-800 hover:text-primary"
                                    >
                                      {grand.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Right column placeholder (kept empty to preserve width) */}
                    <div className="w-1/2 py-2 px-4 text-sm text-gray-400">
                      Hover danh mục con để xem danh mục cấp 3
                    </div>
                  </div>
                </div>
              )}

              {/* Nested list for mobile */}
              {hasChildren && isMobile && (
                <ul className="pl-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        to={`/collections/${child.slug}`}
                        className="block text-gray-700 hover:text-primary"
                      >
                        {child.name}
                      </Link>
                      {child.children && child.children.length > 0 && (
                        <ul className="pl-3 mt-1 space-y-1 border-l border-gray-200">
                          {child.children.map((grand) => (
                            <li key={grand.id}>
                              <Link
                                to={`/collections/${grand.slug}`}
                                className="block text-xs text-gray-600 hover:text-primary"
                              >
                                {grand.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default Navigation

