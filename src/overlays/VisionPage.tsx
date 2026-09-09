type VisionPageProps = {
  onHome: () => void
}

export function VisionPage({ onHome }: VisionPageProps) {
  return (
    <main className="page page--vision">
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner">
        <p className="page__kicker">Vision</p>
        <h1 className="page__title">Build the first hyper-realistic motocross simulator.</h1>
        <p className="page__lede">
          Not a game pad. Not a novelty. A full-body machine that feels like dirt, throttle, and
          consequence — built for venues, athletes, and anyone who wants the real thing without
          the track.
        </p>

        <section className="vision-block">
          <h2 className="vision-block__title">What we’re after</h2>
          <p className="vision-block__body">
            Hardware that sells the ride: weight transfer, suspension response, lean, impact, and
            sound pressure. Software that reads like a living track. A product you can put on a
            floor and charge for by the minute.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Where it stands</h2>
          <p className="vision-block__body">
            The machine is still under wraps. No manufacturer line. No investors. No finished unit
            shipping. The cover is the teaser — the intention underneath is the product.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Who we need</h2>
          <ul className="vision-list">
            <li>Engineers who can turn motion into believable physics</li>
            <li>Manufacturers who can build durable venue-grade hardware</li>
            <li>Investors who fund deep product, not slideware</li>
            <li>Venues ready to host the first units</li>
          </ul>
        </section>

        <div className="page__actions">
          <button type="button" className="page__btn" onClick={onHome}>
            Back to home
          </button>
          <a className="page__btn page__btn--accent" href="mailto:hello@mxsquid.co">
            hello@mxsquid.co
          </a>
        </div>
      </div>
    </main>
  )
}
