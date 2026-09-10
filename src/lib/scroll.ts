export type ChapterId =
  | 'brand'
  | 'empty'
  | 'manufacturers'
  | 'investors'
  | 'approach'
  | 'ask'

export type Chapter = {
  id: ChapterId
  start: number
  end: number
  kicker: string
  headline: string
  body: string
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'brand',
    start: 0,
    end: 0.18,
    kicker: 'MXsquid',
    headline: 'Under wraps.',
    body: 'First hyper-realistic motocross simulator. Still being built.',
  },
  {
    id: 'empty',
    start: 0.18,
    end: 0.34,
    kicker: 'Where we are',
    headline: 'Empty floor.',
    body: 'Nothing on the line yet. Just space waiting for a build.',
  },
  {
    id: 'manufacturers',
    start: 0.34,
    end: 0.5,
    kicker: 'Partners',
    headline: 'No factory yet.',
    body: 'When a partner signs, this void becomes their floor.',
  },
  {
    id: 'investors',
    start: 0.5,
    end: 0.66,
    kicker: 'Capital',
    headline: 'No capital yet.',
    body: 'Vision first. Round later.',
  },
  {
    id: 'approach',
    start: 0.66,
    end: 0.82,
    kicker: 'The bay',
    headline: 'Build bay covered.',
    body: 'The room stays sealed until it is ready to show.',
  },
  {
    id: 'ask',
    start: 0.82,
    end: 1,
    kicker: 'Join the build',
    headline: 'Help make it real.',
    body: 'Engineers. Manufacturers. Investors. Venues.',
  },
]

export function getChapter(progress: number): Chapter {
  const clamped = Math.min(1, Math.max(0, progress))
  return (
    CHAPTERS.find((chapter) => clamped >= chapter.start && clamped < chapter.end) ??
    CHAPTERS[CHAPTERS.length - 1]
  )
}

export function chapterOpacity(progress: number, chapter: Chapter): number {
  const first = CHAPTERS[0]
  const last = CHAPTERS[CHAPTERS.length - 1]
  const span = chapter.end - chapter.start
  const local = (progress - chapter.start) / span
  const fade = Math.min(span * 0.4, 0.1)

  // First beat stays fully visible at progress 0 (no fade-in from zero).
  const enter = chapter.id === first.id ? 1 : Math.min(1, local / fade)
  // Last beat stays fully visible at progress 1 (no fade-out to zero).
  const exit = chapter.id === last.id ? 1 : Math.min(1, (chapter.end - progress) / fade)

  if (progress < chapter.start - fade || progress > chapter.end + fade) return 0
  if (chapter.id === first.id && progress < chapter.end) {
    return Math.min(1, exit)
  }
  if (chapter.id === last.id && progress >= chapter.start) {
    return Math.min(1, enter)
  }
  return Math.min(enter, exit)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)))
  return lerp(outMin, outMax, t)
}
