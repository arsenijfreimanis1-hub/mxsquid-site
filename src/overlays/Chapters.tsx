import { useRef } from 'react'
import { useScrollState } from '../hooks/useScrollContext'
import type { RoutePath } from '../hooks/useRoute'
import { CHAPTERS, chapterOpacity } from '../lib/scroll'
import { StayTunedForm } from './StayTunedForm'
import { LogoLaunch } from './LogoLaunch'

function ChapterCopy({
  chapter,
  asHeadline,
}: {
  chapter: (typeof CHAPTERS)[number]
  asHeadline: 'h1' | 'h2'
}) {
  const Headline = asHeadline
  return (
    <>
      {chapter.kicker ? <p className="chapter__kicker">{chapter.kicker}</p> : null}
      <Headline className={asHeadline === 'h2' ? 'static-copy__headline' : 'chapter__headline'}>
        {chapter.headline}
      </Headline>
      <p className="chapter__body">{chapter.body}</p>
      {chapter.quote ? (
        <blockquote className="chapter__quote">
          <p>“{chapter.quote}”</p>
          {chapter.attribution ? <cite className="chapter__attr">{chapter.attribution}</cite> : null}
        </blockquote>
      ) : null}
    </>
  )
}

function ChapterActions({ onNavigate }: { onNavigate: (path: RoutePath) => void }) {
  return (
    <div className="chapter__actions">
      <StayTunedForm />
      <button type="button" className="chapter__cta chapter__cta--button" onClick={() => onNavigate('/why-now')}>
        Why now
      </button>
      <button type="button" className="chapter__cta chapter__cta--button" onClick={() => onNavigate('/vision')}>
        The vision
      </button>
      <button type="button" className="chapter__cta chapter__cta--button" onClick={() => onNavigate('/force-studio')}>
        Force Studio
      </button>
      <a className="chapter__cta" href="mailto:hello@mxsquid.co">
        Write to me
      </a>
    </div>
  )
}

export function Chapters() {
  const { progress, reducedMotion, navigate } = useScrollState()
  const logoSlotRef = useRef<HTMLDivElement>(null)

  if (reducedMotion) {
    return (
      <div className="overlay overlay--static">
        <div className="static-copy">
          <img className="hero-logo hero-logo--static" src="/mxsquid-logo-clear.png" alt="MXsquid" />
          {CHAPTERS.map((chapter) => (
            <section key={chapter.id} className="static-copy__block">
              <ChapterCopy chapter={chapter} asHeadline="h2" />
            </section>
          ))}
          <ChapterActions onNavigate={navigate} />
        </div>
      </div>
    )
  }

  const brandOpacity = chapterOpacity(progress, CHAPTERS[0])

  return (
    <div className="overlay">
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-rail__fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      <LogoLaunch progress={progress} slotRef={logoSlotRef} />

      <section
        className="chapter chapter--brand"
        style={{
          opacity: brandOpacity,
          visibility: brandOpacity < 0.02 ? 'hidden' : 'visible',
          pointerEvents: brandOpacity < 0.5 ? 'none' : 'auto',
        }}
        aria-hidden={brandOpacity < 0.5}
      >
        <div className="hero-launch-slot" ref={logoSlotRef} aria-hidden="true" />
        <ChapterCopy chapter={CHAPTERS[0]} asHeadline="h1" />
      </section>

      {CHAPTERS.filter((chapter) => chapter.id !== 'brand').map((chapter) => {
        const opacity = chapterOpacity(progress, chapter)
        if (opacity <= 0.01) return null

        return (
          <section
            key={chapter.id}
            className={`chapter chapter--${chapter.id}`}
            style={{ opacity }}
            aria-hidden={opacity < 0.5}
          >
            <ChapterCopy chapter={chapter} asHeadline="h1" />
            {chapter.id === 'ask' ? <ChapterActions onNavigate={navigate} /> : null}
          </section>
        )
      })}

      <div className="scroll-hint" style={{ opacity: progress < 0.06 ? 1 : 0 }} aria-hidden="true">
        <span className="scroll-hint__line" />
        Keep going
      </div>
    </div>
  )
}
