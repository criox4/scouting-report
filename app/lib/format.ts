import type { Chain } from '../../src/config.ts'

export const CHAIN_NAMES: Record<Chain, string> = {
  solana: 'Solana', bsc: 'BNB Chain', ethereum: 'Ethereum', base: 'Base', arbitrum: 'Arbitrum', polygon: 'Polygon',
}

const EXPLORERS: Record<Chain, string> = {
  solana: 'https://solscan.io', bsc: 'https://bscscan.com', ethereum: 'https://etherscan.io',
  base: 'https://basescan.org', arbitrum: 'https://arbiscan.io', polygon: 'https://polygonscan.com',
}
export const txUrl = (chain: Chain, tx: string) => `${EXPLORERS[chain]}/tx/${tx}`
export const walletUrl = (chain: Chain, w: string) => `${EXPLORERS[chain]}/${chain === 'solana' ? 'account' : 'address'}/${w}`
export const tokenUrl = (chain: Chain, token: string) => `https://dexscreener.com/${chain}/${token}`

export const PERIODS = [7, 30, 90] as const
export const parseDays = (v: unknown) => (PERIODS as readonly number[]).includes(Number(v)) ? Number(v) : 30

export const guessChain = (w: string, current: Chain): Chain =>
  w.startsWith('0x') ? (current === 'solana' ? 'bsc' : current) : w.length >= 32 ? 'solana' : current

const money = (n: number, digits = 2) =>
  '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const usd = (n: number) => (n < 0 ? '−' : '') + money(n, Math.abs(n) >= 10_000 ? 0 : 2)
export const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + money(n, Math.abs(n) >= 10_000 ? 0 : 2)
export const pct = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n * 100).toFixed(Math.abs(n) >= 10 ? 0 : 1) + '%'
export const compact = (n: number | null | undefined) =>
  n == null ? '—' : '$' + Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: n >= 1e9 ? 2 : 1 }).format(n)
export const qty = (n: number) => Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
export const short = (s: string) => s.length > 12 ? `${s.slice(0, 4)}…${s.slice(-4)}` : s

export function duration(sec: number | null) {
  if (sec === null) return '—'
  if (sec < 60) return `${Math.round(sec)}s`
  if (sec < 3600) return `${Math.round(sec / 60)}m`
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m`
  return `${Math.floor(sec / 86400)}d ${Math.round((sec % 86400) / 3600)}h`
}

export const ago = (ts: number, now = Date.now() / 1000) => {
  const s = Math.max(0, now - ts)
  return s < 3600 ? `${Math.max(1, Math.round(s / 60))}m` : s < 86400 ? `${Math.round(s / 3600)}h` : `${Math.round(s / 86400)}d`
}

export const stamp = (ms: number) => {
  const d = new Date(ms)
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${date} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}
