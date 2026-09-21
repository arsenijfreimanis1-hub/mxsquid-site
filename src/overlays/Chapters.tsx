import { useScrollState } from '../hooks/useScrollContext'
import { CHAPTERS, chapterOpacity } from '../lib/scroll'
import { StayTunedForm } from './StayTunedForm'

export function Chapters() {
  const { progress, reducedMotion, navigate } = useScrollState()

  if (reducedMotion) {
    return (
      <div className="overlay overlay--static">
        <div className="static-copy">
          <img className="hero-logo hero-logo--static" src="/mxsquid-logo-clear.png" alt="MXsquid" />
          {CHAPTERS.map((chapter) => (
            <section key={chapter.id} className="static-copy__block">
              {chapter.kicker ? <p className="chapter__kicker">{chapter.kicker}</p> : null}
              <h2 className="static-copy__headline">{chapter.headline}</h2>
              <p className="chapter__body">{chapter.body}</p>
            </section>
          ))}
          <div className="chapter__actions">
            <StayTunedForm />
            <button type="button" className="chapter__cta chapter__cta--button" onClick={() => navigate('/why-now')}>
              Why now
            </button>
            <button type="button" className="chapter__cta chapter__cta--button" onClick={() => navigate('/vision')}>
              Read the vision
            </button>
            <button type="button" className="chapter__cta chapter__cta--button" onClick={() => navigate('/force-studio')}>
              Force Studio
            </button>
            <a className="chapter__cta" href="mailto:hello@mxsquid.co">
              hello@mxsquid.co
            </a>
          </div>
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

      <section
        className="chapter chapter--brand"
        style={{
          opacity: brandOpacity,
          visibility: brandOpacity < 0.02 ? 'hidden' : 'visible',
          pointerEvents: brandOpacity < 0.5 ? 'none' : 'auto',
        }}
        aria-hidden={brandOpacity < 0.5}
      >
        <img className="hero-logo" src="/mxsquid-logo-clear.png" alt="MXsquid" />
        <h1 className="chapter__headline">{CHAPTERS[0].headline}</h1>
        <p className="chapter__body">{CHAPTERS[0].body}</p>
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
            {chapter.kicker ? <p className="chapter__kicker">{chapter.kicker}</p> : null}
            <h1 className="chapter__headline">{chapter.headline}</h1>
            <p className="chapter__body">{chapter.body}</p>
            {chapter.id === 'ask' && (
              <>
                <div className="chapter__actions">
                  <StayTunedForm />
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
                  <button
                    type="button"
                    className="chapter__cta chapter__cta--button"
                    onClick={() => navigate('/force-studio')}
                  >
                    Force Studio
                  </button>
                  <a className="chapter__cta" href="mailto:hello@mxsquid.co">
                    hello@mxsquid.co
                  </a>
                </div>
              </>
            )}
          </section>
        )
      })}

      <div className="scroll-hint" style={{ opacity: progress < 0.06 ? 1 : 0 }} aria-hidden="true">
        <span className="scroll-hint__line" />
        Scroll
      </div>
    </div>
  )
}
