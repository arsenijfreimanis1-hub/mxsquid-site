import { useCallback, useEffect, useState } from 'react'

export type RoutePath = '/' | '/vision'

function normalizePath(pathname: string): RoutePath {
  return pathname.replace(/\/+$/, '') === '/vision' ? '/vision' : '/'
}

export function useRoute() {
  const [path, setPath] = useState<RoutePath>(() =>
    typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname),
  )

  useEffect(() => {
    const sync = () => setPath(normalizePath(window.location.pathname))
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  const navigate = useCallback((to: RoutePath) => {
    if (normalizePath(window.location.pathname) === to) {
      setPath(to)
      return
    }
    window.history.pushState({}, '', to)
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  return { path, navigate }
}
