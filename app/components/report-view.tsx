'use client'

import { useEffect, useState } from 'react'
import type { Chain } from '../../src/config.ts'
import type { Analysis } from '../../src/ai.ts'
import type { Grade } from '../../src/grades.ts'
import type { Report, ReportPosition } from '../../src/report.ts'
import {
  ago, CHAIN_NAMES, compact, duration, pct, qty, short, signed, stamp as stampTime, tokenUrl, txUrl, usd, walletUrl,
} from '../lib/format.ts'
import { FormHead } from './form-head.tsx'
import { CheckIcon, CopyIcon, GradeScale, OutIcon, PenLoop, Stamp } from './marks.tsx'

type State = { log: string[], report: Report | null, error: string | null }

export function ReportView({ chain, wallet, days }: { chain: Chain, wallet: string, days: number }) {
  const [s, setS] = useState<State>({ log: [], report: null, error: null })

  useEffect(() => {
    setS({ log: [], report: null, error: null })
    const ac = new AbortController()
    const handle = (line: string) => {
      if (!line.trim()) return
      const m = JSON.parse(line)
      if (m.type === 'progress') setS(p => ({ ...p, log: [...p.log, m.message] }))
      if (m.type === 'report') setS(p => ({ ...p, report: m.report }))
      if (m.type === 'error') setS(p => ({ ...p, error: m.message }))
    }
    ;(async () => {
      const res = await fetch(`/api/report?chain=${chain}&wallet=${wallet}&days=${days}`, { signal: ac.signal })
      if (!res.body) throw new Error('The report service returned nothing.')
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += value
        let i
        while ((i = buf.indexOf('\n')) >= 0) { handle(buf.slice(0, i)); buf = buf.slice(i + 1) }
      }
      handle(buf)
    })().catch(e => {
      if (!ac.signal.aborted) setS(p => ({ ...p, error: `Could not reach the report service (${(e as Error).message}). Check that the app is running and try again.` }))
    })
    return () => ac.abort()
  }, [chain, wallet, days])

  const r = s.report
  return (
    <main className="sheet">
      <FormHead chain={chain} wallet={wallet} days={days} swaps={r?.swaps} filedAt={r?.filedAt}>
        <div className="field f-links">
          <span className="lbl">Subject on record</span>
          <span className="links">
            <CopyButton text={wallet} />
            <a href={walletUrl(chain, wallet)} target="_blank" rel="noreferrer" className="icon-link">
              {chain === 'solana' ? 'Solscan' : 'Explorer'} <OutIcon />
            </a>
          </span>
        </div>
      </FormHead>
      {s.error ? <Returned message={s.error} /> : r ? <Filed r={r} /> : <Filing log={s.log} chain={chain} days={days} />}
      <footer className="foot">
        <p>Filed from public on-chain data. Grades are formulas on this wallet&rsquo;s own numbers, not advice.</p>
        <p>Data: Helius · dRPC · Binance · DexScreener</p>
      </footer>
    </main>
  )
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="icon-link" onClick={() => navigator.clipboard.writeText(text).then(() => {
      setDone(true); setTimeout(() => setDone(false), 1600)
    })}>
      {done ? <>Copied <CheckIcon /></> : <>Copy {short(text)} <CopyIcon /></>}
    </button>
  )
}

function Filing({ log, chain, days }: { log: string[], chain: Chain, days: number }) {
  return (
    <section className="verdict filing" aria-live="polite" aria-busy="true">
      <div className="overall">
        <span className="lbl">Overall grade</span>
        <div className="grade-big typed pending" aria-hidden="true" />
        <GradeScale value={null} caret label="Overall grade" />
      </div>
      <div className="typelog">
        <h2 className="lbl">Filing report</h2>
        <p className="typed">Reading {days} days of {CHAIN_NAMES[chain]} swaps. A first report on a busy wallet can take a minute; later ones are quick.</p>
        <ol className="typed">
          {(log.length ? log : ['Opening the file']).map((l, i, a) => <li key={i} className={i === a.length - 1 ? 'now' : undefined}>{l}</li>)}
        </ol>
      </div>
    </section>
  )
}

function Returned({ message }: { message: string }) {
  return (
    <section className="verdict returned" role="alert">
      <div className="overall">
        <span className="lbl">Overall grade</span>
        <div className="grade-big typed pending" aria-hidden="true" />
        <p className="stamp stamp-down">Returned</p>
      </div>
      <div className="typelog">
        <h2 className="lbl">Report could not be filed</h2>
        <p className="typed">{message}</p>
        <p className="typed">Check the address and chain above, then file again. Free data tiers sometimes rate-limit; waiting a minute usually clears it.</p>
      </div>
    </section>
  )
}

const avgOf = (ps: ReportPosition[]) => ps.length ? ps.reduce((a, p) => a + Math.abs(p.realized), 0) / ps.length : null

function Filed({ r }: { r: Report }) {
  const g = r.grades
  const t = r.totals
  const roi = t.bought ? t.pnl / t.bought : 0
  const closed = r.positions.filter(p => p.qty === 0 && p.sells > 0)
  const avgWin = avgOf(closed.filter(p => p.realized > 0))
  const avgLoss = avgOf(closed.filter(p => p.realized < 0))
  const kind = !r.swaps ? 'none' : t.pnl >= 0 ? 'up' : 'down'
  const label = (p: { symbol: string, token: string }) => p.symbol || short(p.token)

  return (
    <>
      <section className="verdict" aria-label="Grades">
        <div className="overall">
          <span className="lbl">Overall grade</span>
          <div className="grade-big typed">
            <span>{g.overall.value ?? '—'}</span>
            {g.overall.value !== null && <PenLoop seed={7} delay={150} />}
          </div>
          <p className="descriptor typed">{g.overall.label}</p>
          <GradeScale value={g.overall.value} caret delay={300} label="Overall grade" />
          <Stamp kind={kind} delay={1250} />
          <p className="verdict-line typed">
            {r.swaps ? <>
              {t.pnl >= 0 ? 'Made' : 'Lost'} <b className={t.pnl >= 0 ? 'up' : 'down'}>{signed(t.pnl)}</b> on {usd(t.bought)} bought
              ({pct(roi)}) over {r.days} days. Won {g.wins} of {g.closed} closed positions.
            </> : <>No swaps found in the last {r.days} days. Try a longer period, or check the chain.</>}
          </p>
          <dl className="record">
            <div><dt className="lbl">Tokens traded</dt><dd className="typed">{r.positions.length}</dd></div>
            <div><dt className="lbl">Buys</dt><dd className="typed">{r.positions.reduce((a, p) => a + p.buys, 0)}</dd></div>
            <div><dt className="lbl">Sells</dt><dd className="typed">{r.positions.reduce((a, p) => a + p.sells, 0)}</dd></div>
            <div><dt className="lbl">Won / lost</dt><dd className="typed">{g.wins} / {g.closed - g.wins}</dd></div>
          </dl>
          <div className="tool tool-sample">
            <span className="lbl">Sample</span>
            <p className="typed"><b>{g.confidence} confidence</b> · {g.closed} closed position{g.closed === 1 ? '' : 's'}
              {g.confidence === 'low' && ' (grades are provisional)'}</p>
          </div>
        </div>
        <div className="tools">
          <Tool name="Profit" grade={g.profit} delay={500}
            stat={r.swaps ? `${pct(roi)} on ${usd(t.bought)} bought` : 'No buys in this period'} />
          <Tool name="Hit rate" grade={g.hit} delay={700}
            stat={g.closed ? `${g.wins} of ${g.closed} closed positions won` : 'No closed positions yet'} />
          <Tool name="Payoff" grade={g.payoff} delay={900}
            stat={avgWin !== null || avgLoss !== null ? `Avg win ${avgWin === null ? '—' : usd(avgWin)} · avg loss ${avgLoss === null ? '—' : usd(avgLoss)}` : 'Nothing closed to compare'} />
        </div>
      </section>

      <section className="totals" aria-label="Totals">
        <Field lbl="Total PnL" v={signed(t.pnl)} tone={t.pnl} />
        <Field lbl="Realized" v={signed(t.realized)} tone={t.realized} />
        <Field lbl="Unrealized" v={signed(t.unrealized)} tone={t.unrealized} />
        <Field lbl="Open value" v={usd(t.openValue)} />
        <Field lbl="Bought" v={usd(t.bought)} />
        <Field lbl="Avg hold" v={duration(r.avgHoldSec)} />
        <Field lbl="Avg buy" v={r.avgBuyUsd === null ? '—' : usd(r.avgBuyUsd)} />
      </section>

      <AiScout r={r} />
      <BestCalls r={r} label={label} />
      <Positions r={r} label={label} />
      <SwapLog r={r} label={label} />

      <section className="notes-row">
        <Notes r={r} label={label} />
        <div className="method">
          <h2 className="section-h">Method &amp; limits</h2>
          <ul>
            <li>Each transaction is read as the wallet&rsquo;s net balance change. A token gained while SOL, BNB, ETH or a stablecoin was spent is a buy; the reverse is a sell. Any DEX or launchpad counts.</li>
            <li>USD values use the native coin&rsquo;s price at the minute of the swap. PnL uses weighted-average cost; PnL % is PnL ÷ total bought.</li>
            <li>Market caps at entry assume today&rsquo;s supply. Live prices come from DexScreener; holdings with no market show &ldquo;no price&rdquo; and count as neither gain nor loss.</li>
            <li>Tokens sent to another wallet leave the position at cost with no PnL. Tokens received by transfer have no cost basis, so selling them only counts against what was bought here.</li>
            <li>Not counted: token-for-token swaps, swaps routed through trading-bot contracts on EVM chains, and EVM gas.
              {r.unmatchedTokens > 0 && ` ${r.unmatchedTokens} token${r.unmatchedTokens === 1 ? ' was' : 's were'} partly received by transfer; those sales only count against what was bought here.`}</li>
            <li>Grade formulas: {g.overall.basis.toLowerCase()}. Profit: {g.profit.basis}. Hit rate: {g.hit.basis}. Payoff: {g.payoff.basis}.</li>
          </ul>
        </div>
      </section>
    </>
  )
}

function Tool({ name, grade, stat, delay }: { name: string, grade: Grade, stat: string, delay: number }) {
  return (
    <div className="tool">
      <div className="tool-top">
        <span className="lbl">{name}</span>
        <span className="typed tool-grade">{grade.value ?? '—'} <small>{grade.label}</small></span>
      </div>
      <GradeScale value={grade.value} delay={delay} label={name} />
      <p className="typed tool-stat">{stat}</p>
      <p className="basis">{grade.basis}</p>
    </div>
  )
}

function Field({ lbl, v, tone }: { lbl: string, v: string, tone?: number }) {
  return (
    <div className="field">
      <span className="lbl">{lbl}</span>
      <span className={`typed big${tone === undefined ? '' : tone > 0 ? ' up' : tone < 0 ? ' down' : ''}`}>{v}</span>
    </div>
  )
}

type Labeler = (p: { symbol: string, token: string }) => string

function BestCalls({ r, label }: { r: Report, label: Labeler }) {
  const best = r.positions.filter(p => p.pnl > 0).sort((a, b) => b.pnl - a.pnl).slice(0, 5)
  return (
    <section className="block" aria-labelledby="best-h">
      <div className="section-bar"><h2 id="best-h" className="section-h">Best calls</h2><span className="section-meta">Top {best.length || 0} by PnL</span></div>
      {best.length ? (
        <ol className="calls">
          {best.map((p, i) => (
            <li key={p.token}>
              <span className="rank typed">{i + 1}</span>
              <a className="call-token" href={tokenUrl(r.chain, p.token)} target="_blank" rel="noreferrer">{label(p)}</a>
              <span className="typed up call-pnl">{signed(p.pnl)}</span>
              <span className="typed call-meta">{pct(p.pnlPct)}{p.entryMc !== null && ` · in at ${compact(p.entryMc)}`}</span>
            </li>
          ))}
        </ol>
      ) : <p className="empty typed">No winning positions in this period.</p>}
    </section>
  )
}

function Positions({ r, label }: { r: Report, label: Labeler }) {
  const open = r.positions.filter(p => p.qty > 0).sort((a, b) => b.value - a.value)
  const closed = r.positions.filter(p => p.qty === 0).sort((a, b) => b.lastTs - a.lastTs)
  const [view, setView] = useState<'open' | 'closed'>(open.length ? 'open' : 'closed')
  const [all, setAll] = useState(false)
  const rows = view === 'open' ? open : closed
  const shown = all ? rows : rows.slice(0, 25)

  return (
    <section className="block" aria-labelledby="pos-h">
      <div className="section-bar">
        <h2 id="pos-h" className="section-h">Positions</h2>
        <div className="boxes" role="radiogroup" aria-label="Show positions">
          {(['open', 'closed'] as const).map(v => (
            <label key={v} className="box">
              <input type="radio" name="posview" checked={view === v} onChange={() => { setView(v); setAll(false) }} />
              <span className="box-mark" aria-hidden="true" />
              <span>{v === 'open' ? `Holding (${open.length})` : `Closed (${closed.length})`}</span>
            </label>
          ))}
        </div>
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col" className="num">Held</th>
                <th scope="col" className="num opt">Avg entry</th>
                <th scope="col" className="num opt">MC now</th>
                <th scope="col" className="num opt">Bought</th>
                <th scope="col" className="num">{view === 'open' ? 'Value' : 'Sold'}</th>
                <th scope="col" className="num">PnL</th>
                <th scope="col" className="num opt">%</th>
                <th scope="col" className="num opt">Last</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.token}>
                  <th scope="row"><a href={tokenUrl(r.chain, p.token)} target="_blank" rel="noreferrer">{label(p)}</a></th>
                  <td className="num">{p.qty > 0 ? qty(p.qty) : <s title="Fully sold">{qty(p.boughtQty)}</s>}</td>
                  <td className="num opt">{compact(p.entryMc)}</td>
                  <td className="num opt">{compact(p.mcapNow)}</td>
                  <td className="num opt">{usd(p.boughtUsd)}</td>
                  <td className="num">{view === 'open' ? (p.priced ? usd(p.value) : <span title="No live market price">no price</span>) : usd(p.soldUsd)}</td>
                  <td className={`num ${p.pnl > 0 ? 'up' : p.pnl < 0 ? 'down' : ''}`}>{signed(p.pnl)}</td>
                  <td className={`num opt ${p.pnl > 0 ? 'up' : p.pnl < 0 ? 'down' : ''}`}>{pct(p.pnlPct)}</td>
                  <td className="num opt">{ago(p.lastTs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty typed">{view === 'open' ? 'Nothing held right now.' : 'No positions closed in this period.'}</p>}
      {rows.length > 25 && !all && <button type="button" className="more" onClick={() => setAll(true)}>Show all {rows.length}</button>}
    </section>
  )
}

function SwapLog({ r, label }: { r: Report, label: Labeler }) {
  const [all, setAll] = useState(false)
  const shown = all ? r.recent : r.recent.slice(0, 20)
  return (
    <section className="block" aria-labelledby="log-h">
      <div className="section-bar"><h2 id="log-h" className="section-h">Swap log</h2><span className="section-meta">Most recent first</span></div>
      {shown.length ? (
        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Token</th>
                <th scope="col">Action</th>
                <th scope="col" className="num">Amount</th>
                <th scope="col" className="num opt">MC at swap</th>
                <th scope="col" className="num">When</th>
                <th scope="col" className="num"><span className="sr-only">Transaction</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(t => (
                <tr key={t.tx + t.token}>
                  <th scope="row"><a href={tokenUrl(r.chain, t.token)} target="_blank" rel="noreferrer">{label(t)}</a></th>
                  <td className={`act-${t.side}`}>{t.side === 'buy' ? 'BUY' : t.side === 'sell' ? 'SELL' : 'SENT'}</td>
                  <td className="num">{t.side === 'out' ? <span title="Sent to another wallet">{qty(t.amount)} tokens</span> : usd(t.usd)}</td>
                  <td className="num opt">{compact(t.mcAt)}</td>
                  <td className="num"><time dateTime={new Date(t.ts * 1000).toISOString()} title={stampTime(t.ts * 1000)}>{ago(t.ts)}</time></td>
                  <td className="num"><a className="icon-link" href={txUrl(r.chain, t.tx)} target="_blank" rel="noreferrer" aria-label="View transaction"><OutIcon /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="empty typed">No swaps in this period.</p>}
      {r.recent.length > 20 && !all && <button type="button" className="more" onClick={() => setAll(true)}>Show last {r.recent.length}</button>}
    </section>
  )
}

function Notes({ r, label }: { r: Report, label: Labeler }) {
  const byPnl = [...r.positions].sort((a, b) => b.pnl - a.pnl)
  const best = byPnl[0]
  const worst = byPnl.at(-1)
  const notes: string[] = []
  if (best && best.pnl > 0) notes.push(`Best call: ${label(best)}, ${signed(best.pnl)} (${pct(best.pnlPct)}), bought in around ${compact(best.entryMc)} market cap.`)
  if (worst && worst.pnl < 0) notes.push(`Worst: ${label(worst)}, ${signed(worst.pnl)} (${pct(worst.pnlPct)}).`)
  if (r.avgHoldSec !== null) notes.push(`Holds a position ${duration(r.avgHoldSec)} on average, with an average buy of ${usd(r.avgBuyUsd ?? 0)}.`)
  const open = r.positions.filter(p => p.qty > 0 && p.value >= 1)
  if (open.length) notes.push(`Currently holding ${open.length} token${open.length === 1 ? '' : 's'} worth ${usd(r.totals.openValue)}.`)
  if (r.totals.unpricedCost > 0) notes.push(`${usd(r.totals.unpricedCost)} of holdings have no live market price; they are not counted as a gain or a loss.`)
  if (r.sentTokens > 0) notes.push(`Sent ${r.sentTokens} token${r.sentTokens === 1 ? '' : 's'} to other wallets. Sent tokens leave the position at cost, with no PnL; this wallet may be one of several.`)
  if (r.grades.confidence === 'low') notes.push('Small sample: treat every grade here as provisional.')
  return (
    <div className="notes">
      <h2 className="section-h">Scout&rsquo;s notes</h2>
      {notes.length ? <ul className="typed">{notes.map(n => <li key={n}>{n}</li>)}</ul> : <p className="typed">Nothing to note: no swaps in this period.</p>}
    </div>
  )
}

type AiState = { status: 'loading' } | { status: 'error', message: string } | { status: 'done', analysis: Analysis, model: string }

// AI-written read of the report, generated once per filed report and stored with it.
function AiScout({ r }: { r: Report }) {
  const [s, setS] = useState<AiState>({ status: 'loading' })
  useEffect(() => {
    if (!r.swaps) return
    setS({ status: 'loading' })
    const ac = new AbortController()
    fetch(`/api/analysis?chain=${r.chain}&wallet=${r.wallet}&days=${r.days}`, { signal: ac.signal })
      .then(res => res.json())
      .then(d => setS(d.error ? { status: 'error', message: d.error } : { status: 'done', analysis: d.analysis, model: d.model }))
      .catch(e => { if (!ac.signal.aborted) setS({ status: 'error', message: (e as Error).message }) })
    return () => ac.abort()
  }, [r.chain, r.wallet, r.days, r.filedAt, r.swaps])
  if (!r.swaps) return null

  return (
    <section className="block" aria-labelledby="ai-h" aria-busy={s.status === 'loading'}>
      <div className="section-bar">
        <h2 id="ai-h" className="section-h">Scout&rsquo;s assessment</h2>
        <span className="section-meta">{s.status === 'done' ? `AI-written from this report · ${s.model}` : 'AI-written from this report'}</span>
      </div>
      {s.status === 'loading' && (
        <div className="typelog ai-wait"><ol className="typed"><li className="now">The scout is reading the report</li></ol></div>
      )}
      {s.status === 'error' && <p className="empty typed">{s.message} The numbers above are unaffected.</p>}
      {s.status === 'done' && (
        <div className="ai">
          <p className="ai-verdict typed">{s.analysis.verdict}</p>
          <div className="ai-grid">
            <div className="ai-cell"><h3 className="lbl">Style</h3><p className="typed">{s.analysis.style}</p></div>
            <div className="ai-cell"><h3 className="lbl">Copy-trade?</h3><p className="typed">{s.analysis.copyTrade}</p></div>
            <div className="ai-cell"><h3 className="lbl">Strengths</h3><ul className="typed">{s.analysis.strengths.map(x => <li key={x}>{x}</li>)}</ul></div>
            <div className="ai-cell"><h3 className="lbl">Risks</h3><ul className="typed down-list">{s.analysis.risks.map(x => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </div>
      )}
    </section>
  )
}
