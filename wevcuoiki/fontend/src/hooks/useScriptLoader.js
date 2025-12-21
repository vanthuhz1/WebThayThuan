import { useEffect } from 'react'

/**
 * Custom hook to load external scripts in order
 */
export const useScriptLoader = () => {
  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if script already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
      })
    }

    const loadScripts = async () => {
      try {
        // Load jQuery first if not already loaded
        if (!window.jQuery) {
          await loadScript('/assets/js/jquery-3.7.1.min.js')
        }

        // Load other scripts in order
        const scripts = [
          '/assets/js/bootstrap.bundle.min.js',
          '/assets/js/viewport.jquery.js',
          '/assets/js/jquery.waypoints.js',
          '/assets/js/jquery.counterup.min.js',
          '/assets/js/jquery.nice-select.min.js',
          '/assets/js/jquery.meanmenu.min.js',
          '/assets/js/jquery.magnific-popup.min.js',
          '/assets/js/swiper-bundle.min.js',
          '/assets/js/wow.min.js',
          '/assets/js/main.js',
        ]

        for (const src of scripts) {
          await loadScript(src)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        // Initialize plugins after all scripts loaded
        if (window.jQuery) {
          setTimeout(() => {
            if (window.jQuery.fn.niceSelect) {
              window.jQuery('.nice-select').niceSelect()
            }
            if (window.WOW) {
              new window.WOW().init()
            }
          }, 500)
        }
      } catch (error) {
        console.error('Error loading scripts:', error)
      }
    }

    loadScripts()
  }, [])
}

