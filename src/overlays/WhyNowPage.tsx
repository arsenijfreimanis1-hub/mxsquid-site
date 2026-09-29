import { SITE } from '../lib/site'

type WhyNowPageProps = {
  onHome: () => void
  variant?: 'why-now' | 'about'
}

export function WhyNowPage({ onHome, variant = 'why-now' }: WhyNowPageProps) {
  const isAbout = variant === 'about'

  return (
    <main className={`page page--story${isAbout ? ' page--about' : ''}`}>
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner">
        <p className="page__kicker">{isAbout ? 'About' : 'Why now'}</p>
        <h1 className="page__title">
          {isAbout ? 'Why I’m building this.' : 'Every motorsport has a sim. Motocross doesn’t.'}
        </h1>
        <p className="page__lede">
          Cars, rally, karts — you can train on a real machine. MX still gets a controller.
        </p>

        <section className="vision-block">
          <h2 className="vision-block__title">The gap</h2>
          <p className="vision-block__body">
            You can book a car sim. For motocross, you play a game or you risk the dirt.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Why it matters</h2>
          <p className="vision-block__body">
            The sport breaks people. A sim won’t replace the track. It gives you a place to learn
            without the hospital.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">My story</h2>
          <p className="vision-block__body">
            I raced for five years. I wanted a real machine. So I’m building one.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">What I’m doing</h2>
          <p className="vision-block__body">
            Hardware, motion, and people who can build it and put it somewhere. The cover stays on
            until they’re in the room.
          </p>
        </section>

        <div className="page__actions">
          <button type="button" className="page__btn" onClick={onHome}>
            Back to home
          </button>
          <a
            className="page__btn"
            href={SITE.linkedIn}
            target="_blank"
            rel="noreferrer noopener"
          >
            LinkedIn - {SITE.founderName}
          </a>
          <a className="page__btn page__btn--accent" href={`mailto:${SITE.email}`}>
            {SITE.email}
          </a>
        </div>
      </div>
    </main>
  )
}
