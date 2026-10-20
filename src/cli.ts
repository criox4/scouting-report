import { parseArgs } from 'node:util'
import { getReport, validWallet } from './report.ts'

const { positionals, values } = parseArgs({ allowPositionals: true, options: { days: { type: 'string', default: '90' } } })
const [chain, wallet] = positionals
if (!chain || !wallet || !validWallet(chain, wallet)) {
  console.error('usage: npm run pnl -- <solana|bsc|ethereum|base|arbitrum|polygon> <wallet> [--days 90]')
  process.exit(1)
}

const r = await getReport(chain, wallet, Number(values.days), msg => console.error('· ' + msg))

const usd = (n: number) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
const signed = (n: number) => (n >= 0 ? '+' : '') + usd(n)
const pct = (n: number) => (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%'
const compact = (n: number | null) => n === null ? '?' : '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
const sym = (p: { symbol: string, token: string }) => p.symbol || p.token.slice(0, 6) + '…'
const g = r.grades

console.log(`\n${r.chain.toUpperCase()} ${r.wallet} · last ${r.days}d`)
console.log(`overall ${g.overall.value ?? '-'} (${g.overall.label}) · profit ${g.profit.value ?? '-'} · hit ${g.hit.value ?? '-'} · payoff ${g.payoff.value ?? '-'} · confidence ${g.confidence}`)
console.log(`swaps ${r.swaps} · won ${g.wins}/${g.closed} closed · open value ${usd(r.totals.openValue)} · realized ${signed(r.totals.realized)} · unrealized ${signed(r.totals.unrealized)} · total PnL ${signed(r.totals.pnl)}`)

console.log('\nTop trades')
console.table(r.positions.filter(p => p.pnl > 0).sort((a, b) => b.pnl - a.pnl).slice(0, 5)
  .map((p, i) => ({ '#': i + 1, token: sym(p), pnl: signed(p.pnl), '%': pct(p.pnlPct) })))

console.log('Open positions')
console.table(r.positions.filter(p => p.qty > 0 && p.value >= 1).sort((a, b) => b.value - a.value).map(p => ({
  token: sym(p), 'avg entry': compact(p.entryMc) + ' MC', now: compact(p.mcapNow) + ' MC',
  position: usd(p.value), pnl: signed(p.pnl), '%': pct(p.pnlPct),
})))

console.log('Recent swaps')
console.table(r.recent.slice(0, 15).map(t => ({
  token: sym(t), action: t.side, amount: usd(t.usd), mcap: compact(t.mcAt),
  time: new Date(t.ts * 1000).toISOString().slice(0, 16).replace('T', ' '),
})))
