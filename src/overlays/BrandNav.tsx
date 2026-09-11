import { useEffect, useId, useRef, useState } from 'react'
import { useScrollState } from '../hooks/useScrollContext'
import { CHAPTERS, CHAPTER_SNAPS } from '../lib/scroll'

const ASK_PROGRESS = CHAPTER_SNAPS[CHAPTER_SNAPS.length - 1]

const SCROLL_LABELS: Record<string, string> = {
  empty: 'Empty floor',
  manufacturers: 'No factory yet',
  investors: 'No capital yet',
  approach: 'Big reveal',
}

const SCROLL_LINKS = CHAPTERS.filter((c) => c.id !== 'brand' && c.id !== 'ask').map((chapter, index) => ({
  id: chapter.id,
  label: SCROLL_LABELS[chapter.id] ?? chapter.headline.replace(/\.$/, ''),
  // +1 because brand is snaps[0]
  progress: CHAPTER_SNAPS[index + 1],
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

  const goContact = () => {
    setOpen(false)
    if (path === '/') {
      scrollToProgress(ASK_PROGRESS)
      return
    }
    navigate('/')
    window.setTimeout(() => scrollToProgress(ASK_PROGRESS), 120)
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
        <p className="brand-nav__label">Navigate</p>
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
        <button
          type="button"
          role="menuitem"
          className="brand-nav__item"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            navigate('/why-now')
          }}
        >
          Why now
        </button>
        <button
          type="button"
          role="menuitem"
          className="brand-nav__item"
          tabIndex={open ? 0 : -1}
          onClick={() => {
            setOpen(false)
            navigate('/about')
          }}
        >
          About
        </button>

        {path === '/' && (
          <>
            <div className="brand-nav__divider" />
            <p className="brand-nav__label">Story</p>
            {SCROLL_LINKS.map((item) => (
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
          </>
        )}

        <div className="brand-nav__divider" />
        <button
          type="button"
          role="menuitem"
          className="brand-nav__item brand-nav__item--link"
          tabIndex={open ? 0 : -1}
          onClick={goContact}
        >
          Contact
        </button>
      </div>
    </nav>
  )
}
