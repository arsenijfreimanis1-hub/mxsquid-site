type VisionPageProps = {
  onHome: () => void
}

export function VisionPage({ onHome }: VisionPageProps) {
  return (
    <main className="page page--vision">
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner">
        <p className="page__kicker">Vision</p>
        <h1 className="page__title">The first real motocross simulator.</h1>
        <p className="page__lede">Not a gamepad. A machine you can feel.</p>

        <section className="vision-block">
          <h2 className="vision-block__title">What we’re after</h2>
          <p className="vision-block__body">
            Weight, lean, the hit. Something you put on a floor and ride.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Where it stands</h2>
          <p className="vision-block__body">
            Still under the cover. No factory. No investors. Not shipping yet.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">Who we need</h2>
          <ul className="vision-list">
            <li>Engineers who can make motion feel real</li>
            <li>Manufacturers who can build it to last</li>
            <li>Investors who back the product, not the pitch</li>
            <li>Venues that want the first one</li>
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
