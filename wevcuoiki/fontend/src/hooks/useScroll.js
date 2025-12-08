import { useState, useEffect } from 'react'

/**
 * Custom hook để detect scroll position
 * @param {number} threshold - Ngưỡng scroll để trigger (default: 50)
 * @returns {boolean} - true nếu đã scroll qua threshold
 */
export const useScroll = (threshold = 50) => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      setIsScrolled(scrollTop > threshold)
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return isScrolled
}
