import Link from 'next/link'
import type { Chain } from '../../src/config.ts'
import { leaderboard, recentReports, type ReportRow } from '../../src/db.ts'
import { ago, CHAIN_NAMES, pct, short, signed } from '../lib/format.ts'

const href = (r: ReportRow) => `/${r.chain}/${r.wallet}?days=${r.days}`
const tone = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : '')

function Wallet({ r }: { r: ReportRow }) {
  return (
    <th scope="row" className="wallet-cell">
      <Link href={href(r)}>{short(r.wallet)}</Link>
      <small>{CHAIN_NAMES[r.chain as Chain]} · {r.days}d</small>
    </th>
  )
}

// Every filed report lands in SQLite; these two ledgers read straight from it.
export function Boards() {
  const top = leaderboard(10)
  const recent = recentReports(8)
  return (
    <div className="boards">
      <section className="block" aria-labelledby="lb-h">
        <div className="section-bar"><h2 id="lb-h" className="section-h">Leaderboard</h2><span className="section-meta">Filed reports by grade · 10+ swaps</span></div>
        {top.length ? (
          <div className="table-wrap">
            <table className="ledger">
              <thead><tr><th scope="col" className="num">#</th><th scope="col">Wallet</th><th scope="col" className="num">Grade</th><th scope="col" className="num">PnL</th><th scope="col" className="num opt">Return</th></tr></thead>
              <tbody>
                {top.map((r, i) => (
                  <tr key={href(r)}>
                    <td className="num">{i + 1}</td>
                    <Wallet r={r} />
                    <td className="num up">{r.grade}</td>
                    <td className={`num ${tone(r.pnl)}`}>{signed(r.pnl)}</td>
                    <td className={`num opt ${tone(r.pnl)}`}>{r.bought ? pct(r.pnl / r.bought) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty typed">No graded reports yet. File one above and it lands here.</p>}
      </section>
      <section className="block" aria-labelledby="recent-h">
        <div className="section-bar"><h2 id="recent-h" className="section-h">Recently filed</h2><span className="section-meta">Latest lookups</span></div>
        {recent.length ? (
          <div className="table-wrap">
            <table className="ledger">
              <thead><tr><th scope="col">Wallet</th><th scope="col" className="num">Grade</th><th scope="col" className="num">PnL</th><th scope="col" className="num">When</th></tr></thead>
              <tbody>
                {recent.map(r => (
                  <tr key={href(r)}>
                    <Wallet r={r} />
                    <td className="num">{r.grade ?? '—'}</td>
                    <td className={`num ${tone(r.pnl)}`}>{signed(r.pnl)}</td>
                    <td className="num">{ago(r.filed_at / 1000)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="empty typed">Nothing filed yet.</p>}
      </section>
    </div>
  )
}
