export const ICONS = {
  sprout: 'M12 22v-9M12 16C3 16 2 10 3 5c6 0 10 4 9 11ZM12 12c-1-6 3-10 9-10 1 6-3 10-9 10Z',
  leaf: 'M20 3C8 1 2 6 4 14s14 8 16-11ZM6 19l9-10',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5',
  book: 'M12 5C8 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-6-1-10 1Zm0 0v15M5 7l4 1M15 8l4-1',
  volume: 'M11 4 6 8H3v8h3l5 4V4ZM15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14',
  muted: 'M11 4 6 8H3v8h3l5 4V4ZM16 9l5 6M21 9l-5 6',
  expand: 'M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5',
  settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  shovel: 'M14 3h7v5l-3 3-4-4V3ZM16 9 9 16M8 13l4 4-4 4H3v-5l5-3Z',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  mouse: 'M12 3C8 3 5 6 5 10v5a7 7 0 0 0 14 0v-5c0-4-3-7-7-7ZM12 3v7',
  pin: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  play: 'm8 4 13 8-13 8V4Z',
  pause: 'M8 4v16M16 4v16',
  close: 'M6 6l12 12M18 6 6 18',
  flag: 'M5 22V3c5-4 9 4 14 0v10c-5 4-9-4-14 0',
  star: 'm12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1 3-6Z',
  shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4ZM8 12l3 3 5-6',
  clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2',
  check: 'm4 12 5 5L20 6',
  trophy: 'M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H3v4c0 3 2 4 5 4M17 5h4v4c0 3-2 4-5 4M12 15v6M7 21h10',
  heart: 'M12 21 3 12C-2 5 7 0 12 7c5-7 14-2 9 5l-9 9Z',
} as const

export type IconName = keyof typeof ICONS

/** Bare glyph, for the few slots that size the SVG themselves (e.g. the brand mark). */
export function IconSvg({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.leaf} />
    </svg>
  )
}

/** Wrapped in `<i>`, which is what the stylesheet sizes icons through. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <i className={className}>
      <IconSvg name={name} />
    </i>
  )
}
