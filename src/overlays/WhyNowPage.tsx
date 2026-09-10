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
          {isAbout
            ? 'Why I am building MXsquid.'
            : 'Every motorsport has a simulator. Motocross still does not.'}
        </h1>
        <p className="page__lede">
          Formula, rally, GT, karting - they all have serious machines people can train on. Motocross
          racers and riders still get gamepads. Hundreds of millions of people who ride, race, or
          play MX are underserved. One of the most dangerous motorsports still has no safe, full-body
          alternative.
        </p>

        <section className="vision-block">
          <h2 className="vision-block__title">The gap</h2>
          <p className="vision-block__body">
            If you want to feel a track car, you can book time on a professional sim. If you want
            motocross, you either game it or risk the real dirt. There is almost nothing in between
            that sells the weight, the lean, the hit, and the throttle the way the sport actually
            feels.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Why it matters</h2>
          <p className="vision-block__body">
            Motocross is brutal on bodies and wallets. A hyper-realistic simulator will not replace
            the track, but it can give riders a place to train, crash, learn, and stay sharp without
            the same cost of injury. Venues get a product people will queue for. The sport gets a
            safer on-ramp.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">My story</h2>
          <p className="vision-block__body">
            I raced motocross for five years. That seat time is why this exists. I know what the
            sport takes, what it costs when something goes wrong, and how empty the market feels when
            you look for a real machine instead of another controller game. MXsquid is the build I
            wish had been there.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">What I am doing about it</h2>
          <p className="vision-block__body">
            Building the first hyper-realistic motocross simulator from the ground up - hardware,
            motion, and the partners who can manufacture and place it. The cover on the homepage is
            not theater. The product is still under wraps until the right people are in the room.
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
