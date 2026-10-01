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
  quote?: string
  attribution?: string
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'brand',
    start: 0,
    end: 0.18,
    kicker: '',
    headline: 'Still under wraps.',
    body: 'I’m building a motocross simulator you can actually sit on. Not a game - a machine. It isn’t finished yet.',
  },
  {
    id: 'empty',
    start: 0.18,
    end: 0.34,
    kicker: '',
    headline: 'Empty on purpose.',
    body: 'There’s nothing on this floor yet. That’s the point. Room for the first one.',
  },
  {
    id: 'manufacturers',
    start: 0.34,
    end: 0.5,
    kicker: '',
    headline: 'I don’t have a factory.',
    body: 'If you build hardware for a living, this space is yours. I just need someone who can make it real.',
  },
  {
    id: 'investors',
    start: 0.5,
    end: 0.66,
    kicker: '',
    headline: 'I haven’t raised a round.',
    body: 'I wanted the machine to exist before the pitch. If that sounds like you, we should talk.',
  },
  {
    id: 'approach',
    start: 0.66,
    end: 0.82,
    kicker: '',
    headline: 'Cover stays on.',
    body: 'You’ll see it when you can ride it. Until then, I’m still in the shop.',
  },
  {
    id: 'ask',
    start: 0.82,
    end: 1,
    kicker: 'A note from AJ',
    headline: 'I can’t do this alone.',
    body: 'If you know how to build machines, fund them, or put one on a floor - write to me.',
    quote: 'Make it happen.',
    attribution: 'AJ',
  },
]

/** Discrete scroll stops - one per story beat. */
/** Short facts shown above the covered machine, one per scroll stop. */
export const SIM_FACTS: Record<ChapterId, string> = {
  brand: 'This isn’t a game. It’s a machine you sit on.',
  empty: 'The first one isn’t built yet. That’s why the floor is empty.',
  manufacturers: 'It has to lean like a bike. A pad doesn’t count.',
  investors: 'You feel the weight, the throttle, the hit. All of it.',
  approach: 'Cover comes off the day you can ride it.',
  ask: 'I raced motocross for five years. That’s why this exists.',
}

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
