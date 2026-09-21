import { SITE } from '../lib/site'

type ForceStudioPageProps = {
  onHome: () => void
}

const STEPS = [
  {
    title: 'Download and extract',
    body: 'Save the zip on the Windows PC that runs MX Bikes, then unzip it. You should see MX Force Studio.bat in the folder.',
  },
  {
    title: 'Run the installer',
    body: 'Double-click MX Force Studio.bat. If SmartScreen says Windows protected your PC, click More info, then Run anyway.',
  },
  {
    title: 'Wait for APP READY',
    body: 'Leave the black window open. The first run downloads portable Node.js, builds the app, copies the plugin next to mxbikes.exe, and drops a Desktop shortcut.',
  },
  {
    title: 'Start MX Bikes',
    body: 'Launch MX Bikes on this same PC and go on track. If the game was already running, restart it so the plugin can load.',
  },
  {
    title: 'Connect',
    body: 'A browser tab opens at 127.0.0.1:43187. Click Connect. The garage deck follows the live bike.',
  },
] as const

export function ForceStudioPage({ onHome }: ForceStudioPageProps) {
  return (
    <main className="page page--studio">
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner page__inner--wide">
        <p className="page__kicker">Force Studio</p>
        <div className="studio-brand">
          <img className="studio-brand__icon" src="/force-studio-icon.png" alt="" />
          <img className="studio-brand__mx" src="/mx-bikes-logo.png" alt="MX Bikes" />
        </div>
        <h1 className="page__title">Garage 6DOF for MX Bikes.</h1>
        <p className="page__lede">
          A live deck that leans, wheelies, and jumps with the bike on your Windows gaming PC.
          No Node, Git, or Visual Studio required. View the source, or download and run it next
          to MX Bikes.
        </p>

        <div className="studio-actions">
          <a
            className="studio-card"
            href={SITE.forceStudio.repo}
            target="_blank"
            rel="noreferrer noopener"
          >
            <p className="studio-card__kicker">Source</p>
            <h2 className="studio-card__title">View the GitHub repo</h2>
            <p className="studio-card__body">
              Browse mx-force-studio, the plugin, and the Windows launcher. Open issues or clone
              it if you would rather build from source.
            </p>
            <span className="studio-card__cta">Open on GitHub</span>
          </a>

          <a
            className="studio-card studio-card--download"
            href={SITE.forceStudio.zip}
            download={SITE.forceStudio.zipName}
          >
            <p className="studio-card__kicker">Windows + MX Bikes</p>
            <h2 className="studio-card__title">Download for this PC</h2>
            <p className="studio-card__body">
              Direct zip of the repo. Extract it on the machine that has MX Bikes, then
              double-click MX Force Studio.bat. Steam libraries are found automatically.
            </p>
            <span className="studio-card__cta">Download mx-force-studio.zip</span>
          </a>
        </div>

        <section className="vision-block">
          <h2 className="vision-block__title">Install on the MX Bikes PC</h2>
          <ol className="studio-steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="studio-steps__item">
                <span className="studio-steps__num" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="studio-steps__title">{step.title}</h3>
                  <p className="studio-steps__body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">What you get</h2>
          <p className="vision-block__body">
            The bike sits still until you are on track, or you pick up an Xbox pad. Then the deck
            follows roll, pitch, jumps, and crashes. Logging stays off until you press it. Save
            writes a CSV next to the plugin at MX Bikes\plugins\force_studio_logs\. Close the
            black window to stop. Next time, use the Desktop icon.
          </p>
        </section>

        <section className="vision-block">
          <h2 className="vision-block__title">If Connect does nothing</h2>
          <ul className="vision-list">
            <li>Force Studio and MX Bikes must be on the same Windows PC</li>
            <li>Click Connect only after you are on track</li>
            <li>Restart MX Bikes after the first Force Studio launch</li>
            <li>Keep the black window open while you ride</li>
          </ul>
        </section>

        <div className="page__actions">
          <button type="button" className="page__btn" onClick={onHome}>
            Back to home
          </button>
          <a
            className="page__btn"
            href={SITE.forceStudio.repo}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open GitHub
          </a>
          <a
            className="page__btn page__btn--accent"
            href={SITE.forceStudio.zip}
            download={SITE.forceStudio.zipName}
          >
            Download for Windows
          </a>
        </div>
      </div>
    </main>
  )
}
