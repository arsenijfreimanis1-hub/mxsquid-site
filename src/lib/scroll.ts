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
    kicker: '',
    headline: 'Under wraps.',
    body: 'A real motocross simulator. Still being built.',
  },
  {
    id: 'empty',
    start: 0.18,
    end: 0.34,
    kicker: '',
    headline: 'Empty floor.',
    body: 'Nothing here yet. Just room to build.',
  },
  {
    id: 'manufacturers',
    start: 0.34,
    end: 0.5,
    kicker: '',
    headline: 'No factory yet.',
    body: 'When someone builds this with me, the floor is theirs.',
  },
  {
    id: 'investors',
    start: 0.5,
    end: 0.66,
    kicker: '',
    headline: 'No capital yet.',
    body: 'The idea first. The round after.',
  },
  {
    id: 'approach',
    start: 0.66,
    end: 0.82,
    kicker: '',
    headline: 'Stay tuned.',
    body: 'The cover stays on until it’s ready.',
  },
  {
    id: 'ask',
    start: 0.82,
    end: 1,
    kicker: '',
    headline: 'Help',
    body: '"Make it Happen" - AJ',
  },
]

/** Discrete scroll stops - one per story beat. */
export const CHAPTER_SNAPS: number[] = CHAPTERS.map((chapter, index) => {
  if (index === 0) return 0
  if (index === CHAPTERS.length - 1) return 1
  return (chapter.start + chapter.end) / 2
})

export function nearestSnapIndex(progress: number): number {
  let best = 0
  let bestDist = Infinity
  CHAPTER_SNAPS.forEach((snap, index) => {
    const dist = Math.abs(snap - progress)
    if (dist < bestDist) {
      bestDist = dist
      best = index
    }
  })
  return best
}

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
  const fade = Math.min(span * 0.48, 0.14)

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
