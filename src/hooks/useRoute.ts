import { useCallback, useEffect, useState } from 'react'

export type RoutePath = '/' | '/vision' | '/why-now' | '/about'

function normalizePath(pathname: string): RoutePath {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/vision') return '/vision'
  if (clean === '/why-now') return '/why-now'
  if (clean === '/about') return '/about'
  return '/'
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
