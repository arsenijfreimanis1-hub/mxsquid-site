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
    end: 0.16,
    kicker: 'MXsquid',
    headline: 'Under wraps.',
    body: 'The first hyper-realistic motocross simulator — still being built.',
  },
  {
    id: 'empty',
    start: 0.16,
    end: 0.34,
    kicker: 'Where we are',
    headline: 'Not manufactured yet.',
    body: 'No finished machine. Only the cover — and the intention underneath.',
  },
  {
    id: 'manufacturers',
    start: 0.34,
    end: 0.5,
    kicker: 'Today',
    headline: 'No manufacturers.',
    body: 'No partners on the line. Nothing in production.',
  },
  {
    id: 'investors',
    start: 0.5,
    end: 0.66,
    kicker: 'Today',
    headline: 'No investors.',
    body: 'No round. No board. Just the vision — and the ask.',
  },
  {
    id: 'approach',
    start: 0.66,
    end: 0.84,
    kicker: 'The machine',
    headline: 'Still covered.',
    body: 'Hidden until it’s ready to be built for real.',
  },
  {
    id: 'ask',
    start: 0.84,
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
  const span = chapter.end - chapter.start
  const local = (progress - chapter.start) / span
  const fade = Math.min(span * 0.4, 0.1)
  const enter = Math.min(1, local / fade)
  const exit = Math.min(1, (chapter.end - progress) / fade)
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
