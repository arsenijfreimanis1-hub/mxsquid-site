import { useState } from 'react'
import type { FormEvent } from 'react'
import { SITE } from '../lib/site'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function StayTunedForm() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setMessage('That doesn’t look like an email.')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: trimmed,
          _subject: 'MXsquid — keep me posted',
          _template: 'table',
          message: 'Someone wants updates on MXsquid progress.',
        }),
      })

      if (!response.ok) throw new Error('Request failed')
      setStatus('done')
      setMessage('You’re on the list. I’ll write when there’s something worth saying.')
      setEmail('')
    } catch {
      setStatus('error')
      setMessage(`Couldn’t send it from here. Email ${SITE.email} and I’ll add you.`)
    }
  }

  if (status === 'done') {
    return <p className="stay-tuned__note stay-tuned__note--ok">{message}</p>
  }

  if (!open) {
    return (
      <button
        type="button"
        className="chapter__cta chapter__cta--button"
        onClick={() => setOpen(true)}
      >
        Keep me posted
      </button>
    )
  }

  return (
    <form className="stay-tuned" onSubmit={onSubmit} noValidate>
      <label className="stay-tuned__label" htmlFor="stay-tuned-email">
        Drop your email. I’ll write when the cover comes off.
      </label>
      <div className="stay-tuned__row">
        <input
          id="stay-tuned-email"
          className="stay-tuned__input"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="your email"
          value={email}
          autoFocus
          onChange={(event) => {
            setEmail(event.target.value)
            if (status === 'error') setStatus('idle')
          }}
          disabled={status === 'loading'}
          required
        />
        <button className="stay-tuned__submit" type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send it'}
        </button>
      </div>
      {message ? (
        <p className={`stay-tuned__note${status === 'error' ? ' stay-tuned__note--err' : ''}`}>{message}</p>
      ) : null}
    </form>
  )
}
