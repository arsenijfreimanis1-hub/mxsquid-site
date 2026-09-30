type VisionPageProps = {
  onHome: () => void
}

export function VisionPage({ onHome }: VisionPageProps) {
  return (
    <main className="page page--vision">
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner">
        <p className="page__kicker">The idea</p>
        <h1 className="page__title">A bike you can ride without the dirt.</h1>
        <p className="page__lede">
          I want a machine that leans, hits, and feels like motocross - not a screen and a
          controller.
        </p>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">What I want it to feel like</h2>
          <p className="vision-block__body">
            When you get on it, it should have weight. It should lean when you lean. When you land,
            you should feel it in your arms. That’s the whole thing: something you put on a floor
            and actually ride.
          </p>
        </section>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">Where this is</h2>
          <p className="vision-block__body">
            Still under the cover. No factory. No investors. Nothing you can order. I’m building
            the first one, and I’m looking for the people who can help me finish it.
          </p>
        </section>

        <section className="vision-block glass glass--card">
          <h2 className="vision-block__title">Who I’m looking for</h2>
          <ul className="vision-list">
            <li>Engineers who care how motion feels, not just how it looks</li>
            <li>Manufacturers who can build something that lasts on a floor</li>
            <li>Investors who back the product, not the deck</li>
            <li>Venues that want to be first</li>
          </ul>
        </section>

        <div className="page__actions">
          <button type="button" className="page__btn" onClick={onHome}>
            Back home
          </button>
          <a className="page__btn page__btn--accent" href="mailto:hello@mxsquid.co">
            Write to me
          </a>
        </div>
      </div>
    </main>
  )
}
