// Marks a scout makes on the printed form: pen loops around grades, the verdict stamp, small icons.

// An open, slightly wobbly loop that overshoots its start, like a quick pen circle.
function loopPath(seed: number) {
  const pts: string[] = []
  const n = 72
  const start = -2.4 + seed * 0.37
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const a = start + t * 1.1 * Math.PI * 2
    const wob = 1 + 0.035 * Math.sin(a * 3 + seed) + 0.02 * Math.sin(a * 5 + seed * 2)
    const x = 50 + (45 * wob + t * 4) * Math.cos(a)
    const y = 50 + (42 * wob + t * 3) * Math.sin(a)
    pts.push(`${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return pts.join('')
}

export function PenLoop({ seed = 1, delay = 0 }: { seed?: number, delay?: number }) {
  return (
    <svg className="pen-loop" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"
      style={{ '--d': `${delay}ms`, rotate: `${(seed % 3) - 4}deg` } as React.CSSProperties}>
      <path d={loopPath(seed)} pathLength={1} />
    </svg>
  )
}

const STEPS = Array.from({ length: 13 }, (_, i) => 20 + i * 5)

// The printed 20–80 scale. The graded value is circled in pen (or marked with a caret).
export function GradeScale({ value, caret, delay = 0, label }: { value: number | null, caret?: boolean, delay?: number, label: string }) {
  return (
    <ol className={`scale${caret ? ' scale-caret' : ''}`} aria-label={`${label}: ${value ?? 'no grade'} on the 20 to 80 scale`}>
      {STEPS.map(s => (
        <li key={s} className={s % 10 === 0 ? 'ten' : undefined} aria-hidden="true">
          <span className={s === value ? 'hit' : undefined}>
            {s}
            {s === value && !caret && <PenLoop seed={s} delay={delay} />}
          </span>
          {s === value && caret && <i className="caret" style={{ '--d': `${delay}ms` } as React.CSSProperties} />}
        </li>
      ))}
    </ol>
  )
}

export function Stamp({ kind, delay = 0 }: { kind: 'up' | 'down' | 'none', delay?: number }) {
  const text = kind === 'up' ? 'Profitable' : kind === 'down' ? 'Not profitable' : 'No record'
  return <p className={`stamp stamp-${kind}`} style={{ '--d': `${delay}ms` } as React.CSSProperties}>{text}</p>
}

const icon = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, 'aria-hidden': true } as const
export const CopyIcon = () => <svg {...icon}><rect x="5.5" y="5.5" width="8" height="8" /><path d="M10.5 3.5v-1h-8v8h1" /></svg>
export const CheckIcon = () => <svg {...icon}><path d="M3 8.5l3.2 3L13 4.5" /></svg>
export const OutIcon = () => <svg {...icon}><path d="M6.5 3.5h-3v9h9v-3M9 2.5h4.5V7M13.5 2.5L7.5 8.5" /></svg>
