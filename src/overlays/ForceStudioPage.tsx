import { useEffect, useState } from 'react'
import { SITE } from '../lib/site'

type ForceStudioPageProps = {
  onHome: () => void
}

const STEPS = [
  {
    title: 'Unzip it',
    body: 'On the PC that runs MX Bikes. You’ll see MX Force Studio.bat.',
  },
  {
    title: 'Double-click it',
    body: 'If Windows warns you, hit More info, then Run anyway.',
  },
  {
    title: 'Leave the window open',
    body: 'First run sets itself up and puts a shortcut on the Desktop.',
  },
  {
    title: 'Start MX Bikes',
    body: 'Same PC. If the game was already open, restart it.',
  },
  {
    title: 'Connect',
    body: 'A tab opens. Click Connect once you’re on track.',
  },
] as const

const COMMITS_URL =
  'https://api.github.com/repos/arsenijfreimanis1-hub/mx-force-studio/commits?per_page=20'

type GithubCommit = {
  html_url: string
  commit: {
    message: string
    author?: { date?: string }
    committer?: { date?: string }
  }
}

type RepoUpdate = {
  iso: string
  label: string
  summary: string
  href: string
}

function useRepoUpdate(): RepoUpdate | null {
  const [update, setUpdate] = useState<RepoUpdate | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(COMMITS_URL, { headers: { Accept: 'application/vnd.github+json' } })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('GitHub'))))
      .then((commits: GithubCommit[]) => {
        if (cancelled || !Array.isArray(commits) || commits.length === 0) return
        const stamped = commits.find((commit) =>
          /^Stamp the Windows launcher\b/i.test(commit.commit.message),
        )
        const pick = stamped ?? commits[0]
        const iso = pick.commit.committer?.date ?? pick.commit.author?.date
        if (!iso) return
        const subject = pick.commit.message.split('\n')[0]?.trim() ?? ''
        const summary = subject
          .replace(/^Stamp the Windows launcher for\s+/i, '')
          .replace(/\.$/, '')
        const when = new Date(iso)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        setUpdate({
          iso,
          label: `${when.getUTCDate()} ${months[when.getUTCMonth()]} ${when.getUTCFullYear()}`,
          summary,
          href: pick.html_url,
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return update
}

export function ForceStudioPage({ onHome }: ForceStudioPageProps) {
  const updated = useRepoUpdate()
  return (
    <main className="page page--studio">
      <div className="page__glow" aria-hidden="true" />
      <div className="page__inner page__inner--wide">
        <p className="page__kicker">Force Studio</p>
        <div className="studio-brand">
          <img className="studio-brand__icon" src="/force-studio-icon.png" alt="" />
          <img className="studio-brand__mx" src="/mx-bikes-logo.png" alt="MX Bikes" />
        </div>
        <h1 className="page__title">It moves with the bike.</h1>
        <p className="page__lede">
          Leans, wheelies, jumps. Same PC as MX Bikes.
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
            <p className="studio-card__body">The plugin, the launcher, the code.</p>
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
              Unzip it next to MX Bikes. Double-click the bat file.
            </p>
            <span className="studio-card__cta">Download mx-force-studio.zip</span>
          </a>
        </div>

        {updated ? (
          <a
            className="studio-updated"
            href={updated.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            Last updated <time dateTime={updated.iso}>{updated.label}</time>
            {updated.summary ? <span>— {updated.summary}</span> : null}
          </a>
        ) : null}

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
            On track, the deck follows the bike. Close the black window when you’re done. Next
            time, use the Desktop icon.
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
