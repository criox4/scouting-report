import type { Trade } from './trades.ts'

export type Position = {
  token: string
  qty: number // tokens still held (according to trades)
  cost: number // USD cost basis of `qty`
  realized: number
  boughtUsd: number
  boughtQty: number
  soldUsd: number
  buys: number
  sells: number
  firstTs: number
  lastTs: number
  unmatchedSold: number // sold tokens never bought here (received via transfer)
  sentQty: number // sent to other wallets: leaves the position at cost, no PnL
  priced: boolean // false when there is no live market price (value unknown, not zero)
  price: number
  value: number
  unrealized: number
  pnl: number
  pnlPct: number
  avgEntry: number
}

// Weighted-average cost basis, same as fomo / most trackers.
export function computePositions(trades: Trade[], prices: Map<string, number>): Position[] {
  const book = new Map<string, Position>()
  for (const t of [...trades].sort((a, b) => a.ts - b.ts)) {
    let p = book.get(t.token)
    if (!p) {
      p = { token: t.token, qty: 0, cost: 0, realized: 0, boughtUsd: 0, boughtQty: 0, soldUsd: 0, buys: 0, sells: 0,
        firstTs: t.ts, lastTs: 0, unmatchedSold: 0, sentQty: 0, priced: false, price: 0, value: 0, unrealized: 0, pnl: 0, pnlPct: 0, avgEntry: 0 }
      book.set(t.token, p)
    }
    p.lastTs = t.ts
    if (t.side === 'buy') {
      p.qty += t.amount
      p.cost += t.usd
      p.boughtUsd += t.usd
      p.boughtQty += t.amount
      p.buys++
      continue
    }
    const matched = Math.min(t.amount, p.qty)
    if (t.side === 'out') {
      p.sentQty += t.amount
      if (matched) { p.cost -= p.cost * (matched / p.qty); p.qty -= matched }
      if (p.qty < p.boughtQty * 1e-9) { p.qty = 0; p.cost = 0 }
      continue
    }
    p.sells++
    p.soldUsd += t.usd
    p.unmatchedSold += t.amount - matched
    if (!matched) continue
    const costOut = p.cost * (matched / p.qty)
    p.realized += t.usd * (matched / t.amount) - costOut
    p.cost -= costOut
    p.qty -= matched
    if (p.qty < p.boughtQty * 1e-9) { p.qty = 0; p.cost = 0 } // float dust
  }
  for (const p of book.values()) {
    p.priced = prices.has(p.token)
    p.price = prices.get(p.token) ?? 0
    p.value = p.qty * p.price
    p.unrealized = p.qty && p.priced ? p.value - p.cost : 0 // no market price: value unknown, not a loss
    p.pnl = p.realized + p.unrealized
    p.pnlPct = p.boughtUsd ? p.pnl / p.boughtUsd : 0
    p.avgEntry = p.boughtQty ? p.boughtUsd / p.boughtQty : 0
  }
  return [...book.values()]
}
