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
          {isAbout ? 'Why I’m building this.' : 'Every other motorsport has a sim. Motocross still doesn’t.'}
        </h1>
        <p className="page__lede">
          You can train cars, rally, even karts on a real machine. MX still gets a controller - or
          the dirt.
        </p>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">The gap</h2>
          <p className="vision-block__body">
            If you want to practice cars, you book a sim. If you want to practice motocross, you
            either play a video game or you risk the track. There’s nothing in between, and I think
            that’s a problem.
          </p>
        </section>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">Why that matters</h2>
          <p className="vision-block__body">
            This sport breaks people. A simulator won’t replace the track - I wouldn’t want it to.
            But it should give you a place to learn the bike without ending up in hospital.
          </p>
        </section>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">How I got here</h2>
          <p className="vision-block__body">
            I raced motocross for five years. I kept looking for a machine that felt like the real
            thing. Nobody had built one, so I started.
          </p>
        </section>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">What I’m doing now</h2>
          <p className="vision-block__body">
            Hardware, motion, and finding the people who can build it and put it somewhere you can
            ride. The cover stays on until those people are in the room.
          </p>
        </section>

        <div className="page__actions">
          <button type="button" className="page__btn" onClick={onHome}>
            Back home
          </button>
          <a className="page__btn" href={SITE.linkedIn} target="_blank" rel="noreferrer noopener">
            That’s me on LinkedIn
          </a>
          <a className="page__btn page__btn--accent" href={`mailto:${SITE.email}`}>
            Write to me
          </a>
        </div>
      </div>
    </main>
  )
}
