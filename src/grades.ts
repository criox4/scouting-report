import type { Position } from './pnl.ts'

// Scouting 20–80 scale. 50 = average. Every grade below is a fixed formula on the wallet's
// own numbers, printed on the report as its basis, so nothing here is a judgment call.
export type Grade = { value: number | null, label: string, basis: string }

const LABELS: [number, string][] = [
  [80, 'Elite'], [70, 'Plus-plus'], [60, 'Plus'], [55, 'Above average'], [50, 'Average'],
  [45, 'Fringe average'], [40, 'Below average'], [30, 'Well below average'], [20, 'Poor'],
]
export const gradeLabel = (g: number) => LABELS.find(([v]) => g >= v)?.[1] ?? 'Poor'

const toScale = (raw: number) => Math.min(80, Math.max(20, Math.round(raw / 5) * 5))
const grade = (raw: number | null, basis: string): Grade =>
  raw === null ? { value: null, label: 'No grade', basis } : { value: toScale(raw), label: gradeLabel(toScale(raw)), basis }

export type Grades = {
  overall: Grade
  profit: Grade // return on everything bought
  hit: Grade // share of closed positions that made money
  payoff: Grade // size of average win vs average loss
  closed: number
  wins: number
  confidence: 'low' | 'medium' | 'high'
}

export function gradePositions(positions: Position[]): Grades {
  const bought = positions.reduce((s, p) => s + p.boughtUsd, 0)
  const pnl = positions.reduce((s, p) => s + p.pnl, 0)
  const closed = positions.filter(p => p.qty === 0 && p.sells > 0)
  const winners = closed.filter(p => p.realized > 0)
  const losers = closed.filter(p => p.realized < 0)
  const mean = (ps: Position[]) => ps.reduce((s, p) => s + Math.abs(p.realized), 0) / ps.length

  const roi = bought ? pnl / bought : null
  const winRate = closed.length ? winners.length / closed.length : null
  const payoff = !winners.length && !losers.length ? null
    : !losers.length ? Infinity : !winners.length ? 0 : mean(winners) / mean(losers)

  const profit = grade(roi === null ? null : 50 + roi * 60, '50 + 60 × return on all buys (+50% → 80, −50% → 20)')
  const hit = grade(winRate === null ? null : 20 + winRate * 60, '20 + 60 × win rate on closed positions (50% → 50)')
  const pay = grade(payoff === null ? null : payoff === Infinity ? 80 : payoff === 0 ? 20 : 50 + 15 * Math.log2(payoff),
    '50 + 15 × log₂(average win ÷ average loss) (2× → 65, ½× → 35)')
  const parts = [[profit.value, 0.5], [hit.value, 0.2], [pay.value, 0.3]].filter(([v]) => v !== null) as [number, number][]
  const weight = parts.reduce((s, [, w]) => s + w, 0)
  const overall = grade(weight ? parts.reduce((s, [v, w]) => s + v * w, 0) / weight : null,
    'Weighted: 50% profit, 30% payoff, 20% hit rate')

  return {
    overall, profit, hit, payoff: pay,
    closed: closed.length,
    wins: winners.length,
    confidence: closed.length < 5 ? 'low' : closed.length < 20 ? 'medium' : 'high',
  }
}
