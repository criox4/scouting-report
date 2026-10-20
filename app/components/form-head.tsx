'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { CHAINS, validWallet, type Chain } from '../../src/config.ts'
import { CHAIN_NAMES, guessChain, PERIODS, stamp } from '../lib/format.ts'

// The printed header of the form. The subject field is the lookup: edit it and file a new report.
export function FormHead({ chain, wallet = '', days, swaps, filedAt, autoFocus, children }: {
  chain: Chain
  wallet?: string
  days: number
  swaps?: number
  filedAt?: number
  autoFocus?: boolean
  children?: React.ReactNode
}) {
  const router = useRouter()
  const [w, setW] = useState(wallet)
  const [c, setC] = useState<Chain>(chain)
  const [d, setD] = useState(days)
  const [error, setError] = useState('')

  const file = (nextChain = c, nextDays = d) => {
    const addr = w.trim()
    if (!addr) return setError('Enter a wallet address to file a report.')
    if (!validWallet(nextChain, addr)) {
      return setError(nextChain === 'solana'
        ? 'That is not a Solana address. Solana addresses are 32–44 letters and digits.'
        : `That is not a ${CHAIN_NAMES[nextChain]} address. EVM addresses start with 0x and have 40 hex characters.`)
    }
    setError('')
    router.push(`/${nextChain}/${addr}?days=${nextDays}`)
  }

  return (
    <header className="head">
      <div className="head-title">
        <h1><Link href="/">Scouting Report</Link></h1>
        <p>Trader evaluation, rebuilt from on-chain swaps</p>
      </div>
      <form className="fields" onSubmit={e => { e.preventDefault(); file() }} noValidate>
        <div className="field f-subject">
          <label className="lbl" htmlFor="subject">Subject wallet</label>
          <div className="subject-row">
            <input
              id="subject" className="typed" value={w} autoFocus={autoFocus} spellCheck={false} autoComplete="off"
              placeholder="Paste a wallet address"
              aria-invalid={!!error} aria-describedby={error ? 'subject-error' : undefined}
              onChange={e => { setW(e.target.value); setError(''); setC(guessChain(e.target.value.trim(), c)) }}
            />
            <button type="submit" className="file-btn">File report</button>
          </div>
          {error && <p id="subject-error" className="field-error" role="alert">{error}</p>}
        </div>
        <div className="field f-chain">
          <label className="lbl" htmlFor="chain">Chain</label>
          <select id="chain" className="typed" value={c} onChange={e => setC(e.target.value as Chain)}>
            {(Object.keys(CHAINS) as Chain[]).map(k => <option key={k} value={k}>{CHAIN_NAMES[k]}</option>)}
          </select>
        </div>
        <fieldset className="field f-period">
          <legend className="lbl">Period</legend>
          <div className="boxes">
            {PERIODS.map(p => (
              <label key={p} className="box">
                <input type="radio" name="period" value={p} checked={d === p}
                  onChange={() => { setD(p); if (wallet && w.trim() === wallet) file(c, p) }} />
                <span className="box-mark" aria-hidden="true" />
                <span>{p} days</span>
              </label>
            ))}
          </div>
        </fieldset>
        {swaps !== undefined && (
          <div className="field f-meta">
            <span className="lbl">Swaps reviewed</span>
            <span className="typed">{swaps.toLocaleString('en-US')}</span>
          </div>
        )}
        {filedAt !== undefined && (
          <div className="field f-meta">
            <span className="lbl">Filed</span>
            <span className="typed">{stamp(filedAt)}</span>
          </div>
        )}
        {children}
      </form>
    </header>
  )
}
