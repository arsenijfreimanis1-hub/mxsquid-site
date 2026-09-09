import { useEffect, useId, useRef, useState } from 'react'
import { useScrollState } from '../hooks/useScrollContext'
import { CHAPTERS } from '../lib/scroll'

const SCROLL_LINKS = CHAPTERS.filter((c) => c.id !== 'brand').map((chapter) => ({
  id: chapter.id,
  label: chapter.headline.replace(/\.$/, ''),
  progress: (chapter.start + chapter.end) / 2,
}))

export function BrandNav() {
  const { scrollToProgress, path, navigate } = useScrollState()
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<number | null>(null)
  const rootRef = useRef<HTMLElement>(null)
  const menuId = useId()

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openMenu = () => {
    clearCloseTimer()
    setOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setOpen(false), 140)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('touchstart', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('touchstart', onPointer)
      clearCloseTimer()
    }
  }, [])

  const goHome = () => {
    setOpen(false)
    if (path === '/') scrollToProgress(0)
    else navigate('/')
  }

  return (
    <nav
      ref={rootRef}
      className={`brand-nav${open ? ' brand-nav--open' : ''}`}
      aria-label="MXsquid"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node)) scheduleClose()
      }}
    >
      <div className="brand-nav__row">
        <button type="button" className="brand-nav__trigger" onClick={goHome} aria-label="MXsquid home">
          <img className="brand-nav__mark" src="/mxsquid-logo-clear.png" alt="" />
          <span className="brand-nav__word">MXsquid</span>
        </button>
        <button
          type="button"
          className="brand-nav__caret"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          <span aria-hidden="true" />
        </button>
      </div>

      <div id={menuId} className="brand-nav__menu" role="menu" aria-hidden={!open}>
        <button
          type="button"
          role="menuitem"
          className="brand-nav__item"
          tabIndex={open ? 0 : -1}
          onClick={goHome}
        >
          Home
        </button>
        <button
          type="button"
          role="menuitem"
          className="brand-nav__item"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            navigate('/vision')
          }}
        >
          Vision
        </button>
        {path === '/' &&
          SCROLL_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              className="brand-nav__item"
              tabIndex={open ? 0 : -1}
              onClick={() => {
                setOpen(false)
                scrollToProgress(item.progress)
              }}
            >
              {item.label}
            </button>
          ))}
        <a
          className="brand-nav__item brand-nav__item--link"
          role="menuitem"
          href="mailto:hello@mxsquid.co"
          tabIndex={open ? 0 : -1}
        >
          Contact
        </a>
      </div>
    </nav>
  )
}
