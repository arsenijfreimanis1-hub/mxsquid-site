import { useScrollState } from '../hooks/useScrollContext'
import { CHAPTERS, chapterOpacity, mapRange } from '../lib/scroll'

export function Chapters() {
  const { progress, reducedMotion, navigate } = useScrollState()
  const heroFade = mapRange(progress, 0, 0.16, 1, 0)

  if (reducedMotion) {
    return (
      <div className="overlay overlay--static" aria-live="polite">
        <div className="static-copy">
          <img className="hero-logo hero-logo--static" src="/mxsquid-logo-clear.png" alt="MXsquid" />
          {CHAPTERS.map((chapter) => (
            <section key={chapter.id} className="static-copy__block">
              {chapter.kicker ? <p className="chapter__kicker">{chapter.kicker}</p> : null}
              <h2 className="static-copy__headline">{chapter.headline}</h2>
              <p className="chapter__body">{chapter.body}</p>
            </section>
          ))}
          <button type="button" className="chapter__cta chapter__cta--button" onClick={() => navigate('/why-now')}>
            Why now
          </button>
          <button type="button" className="chapter__cta chapter__cta--button" onClick={() => navigate('/vision')}>
            Read the vision
          </button>
          <a className="chapter__cta" href="mailto:hello@mxsquid.co">
            hello@mxsquid.co
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" aria-live="polite">
      <div className="progress-rail" aria-hidden="true">
        <div className="progress-rail__fill" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {CHAPTERS.map((chapter) => {
        const opacity = chapterOpacity(progress, chapter)
        if (opacity <= 0.01) return null

        if (chapter.id === 'brand') {
          return (
            <section
              key={chapter.id}
              className="chapter chapter--brand"
              style={{ opacity: Math.min(opacity, heroFade) }}
              aria-hidden={opacity < 0.5}
            >
              <img className="hero-logo" src="/mxsquid-logo-clear.png" alt="MXsquid" />
              <h1 className="chapter__headline">{chapter.headline}</h1>
              <p className="chapter__body">{chapter.body}</p>
            </section>
          )
        }

        return (
          <section
            key={chapter.id}
            className={`chapter chapter--${chapter.id}`}
            style={{ opacity }}
            aria-hidden={opacity < 0.5}
          >
            {chapter.kicker ? <p className="chapter__kicker">{chapter.kicker}</p> : null}
            <h1 className="chapter__headline">{chapter.headline}</h1>
            <p className="chapter__body">{chapter.body}</p>
            {chapter.id === 'ask' && (
              <>
                <button
                  type="button"
                  className="chapter__cta chapter__cta--button"
                  onClick={() => navigate('/why-now')}
                >
                  Why now
                </button>
                <button
                  type="button"
                  className="chapter__cta chapter__cta--button"
                  onClick={() => navigate('/vision')}
                >
                  Read the vision
                </button>
                <a className="chapter__cta" href="mailto:hello@mxsquid.co">
                  hello@mxsquid.co
                </a>
              </>
            )}
          </section>
        )
      })}

      <div className="scroll-hint" style={{ opacity: progress < 0.06 ? 1 : 0 }}>
        <span className="scroll-hint__line" />
        Scroll
      </div>
    </div>
  )
}
