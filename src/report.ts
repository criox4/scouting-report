import type { Chain } from './config.ts'
import { loadReport, saveReport } from './db.ts'
import { evmTrades } from './evm.ts'
import { gradePositions, type Grades } from './grades.ts'
import { computePositions, type Position } from './pnl.ts'
import { currentPrices, saveNativePrices } from './prices.ts'
import { solanaTrades } from './solana.ts'
import type { Trade } from './trades.ts'
import { readCache, writeCache } from './util.ts'

export { validWallet } from './config.ts'

export type ReportTrade = Trade & { symbol: string, mcAt: number | null }
export type ReportPosition = Position & { symbol: string, mcapNow: number | null, entryMc: number | null }

export type Report = {
  chain: Chain
  wallet: string
  days: number
  filedAt: number
  swaps: number
  totals: { pnl: number, realized: number, unrealized: number, openValue: number, bought: number, sold: number, unpricedCost: number }
  grades: Grades
  avgHoldSec: number | null
  avgBuyUsd: number | null
  unmatchedTokens: number // tokens sold that partly arrived by transfer (no cost basis)
  sentTokens: number // tokens partly sent to other wallets
  positions: ReportPosition[]
  recent: ReportTrade[]
}

type Saved = { trades: Trade[], cursor?: string | number, since?: number }

export async function buildReport(chain: Chain, wallet: string, days: number, progress = (_: string) => {}): Promise<Report> {
  if (chain !== 'solana') wallet = wallet.toLowerCase()
  const key = `wallet-${chain}-${wallet}`
  const sinceTs = Math.floor(Date.now() / 1000) - days * 86400
  let saved = readCache<Saved>(key, { trades: [] })
  if (saved.since === undefined || saved.since > sinceTs || typeof saved.cursor === 'string') saved = { trades: [] } // longer period or old cache format: backfill again

  progress(saved.cursor ? 'Checking for new swaps since the last report' : `Pulling ${days} days of history from ${chain}`)
  const fresh = chain === 'solana'
    ? await solanaTrades(wallet, saved.cursor as number | undefined, sinceTs, progress)
    : await evmTrades(chain, wallet, saved.cursor as number | undefined, sinceTs, progress)
  saveNativePrices()

  const seen = new Set(saved.trades.map(t => t.tx + t.token))
  const all = [...saved.trades, ...fresh.trades.filter(t => !seen.has(t.tx + t.token))]
  writeCache(key, { trades: all, cursor: fresh.cursor, since: saved.since ?? sinceTs })
  const trades = all.filter(t => t.ts >= sinceTs)

  progress(`Pricing ${new Set(trades.map(t => t.token)).size} tokens at today's market`)
  const quotes = await currentPrices(chain, [...new Set(trades.map(t => t.token))])
  const positions = computePositions(trades, new Map([...quotes].map(([k, q]) => [k, q.price])))

  // MC at a past price, assuming supply hasn't changed (the same assumption fomo's "avg entry MC" makes).
  const mcAt = (token: string, price: number) => {
    const q = quotes.get(token)
    return q?.price && q.mcap ? price * q.mcap / q.price : null
  }
  const symbol = (token: string) => quotes.get(token)?.symbol ?? ''
  const sum = (f: (p: Position) => number) => positions.reduce((s, p) => s + f(p), 0)
  const closed = positions.filter(p => p.qty === 0 && p.sells > 0)
  const buys = trades.filter(t => t.side === 'buy')
  const swaps = trades.filter(t => t.side !== 'out')

  return {
    chain, wallet, days,
    filedAt: Date.now(),
    swaps: swaps.length,
    totals: {
      pnl: sum(p => p.pnl), realized: sum(p => p.realized), unrealized: sum(p => p.unrealized),
      openValue: sum(p => p.value), bought: sum(p => p.boughtUsd), sold: sum(p => p.soldUsd),
      unpricedCost: sum(p => p.qty && !p.priced ? p.cost : 0),
    },
    grades: gradePositions(positions),
    avgHoldSec: closed.length ? closed.reduce((s, p) => s + p.lastTs - p.firstTs, 0) / closed.length : null,
    avgBuyUsd: buys.length ? buys.reduce((s, t) => s + t.usd, 0) / buys.length : null,
    unmatchedTokens: positions.filter(p => p.unmatchedSold > 0).length,
    sentTokens: positions.filter(p => p.sentQty > 0).length,
    positions: positions.map(p => ({ ...p, symbol: symbol(p.token), mcapNow: quotes.get(p.token)?.mcap || null, entryMc: mcAt(p.token, p.avgEntry) })),
    recent: [...trades].sort((a, b) => b.ts - a.ts).slice(0, 100)
      .map(t => ({ ...t, symbol: symbol(t.token), mcAt: t.usd ? mcAt(t.token, t.usd / t.amount) : null })),
  }
}

export const normalizeWallet = (chain: Chain, wallet: string) => chain === 'solana' ? wallet : wallet.toLowerCase()
const FRESH_MS = 5 * 60_000

// A report filed in the last 5 minutes is served from the DB; otherwise refresh (incrementally) and store it.
export async function getReport(chain: Chain, wallet: string, days: number, progress = (_: string) => {}): Promise<Report> {
  wallet = normalizeWallet(chain, wallet)
  const cached = loadReport(chain, wallet, days)
  if (cached && Date.now() - cached.filed_at < FRESH_MS) return JSON.parse(cached.json)
  const report = await buildReport(chain, wallet, days, progress)
  saveReport(report)
  return report
}
