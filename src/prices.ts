import { CHAINS, type Chain } from './config.ts'
import { getJson, readCache, writeCache } from './util.ts'

// "SOLUSDT:<minute>" -> USD. One Binance call fills 1000 minutes around the swap
// (history is walked backwards, so centering keeps the next swaps cached too).
const minutes: Record<string, number> = readCache('native-prices', {})

export async function nativeUsdAt(chain: Chain, ts: number): Promise<number> {
  const sym = CHAINS[chain].binance
  const minute = Math.floor(ts / 60)
  const key = `${sym}:${minute}`
  if (minutes[key] === undefined) {
    const rows = await getJson(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1m&startTime=${(minute - 500) * 60_000}&limit=1000`)
    for (const r of rows) minutes[`${sym}:${r[0] / 60_000}`] = Number(r[1])
    if (minutes[key] === undefined) { // swap newer than the last closed candle
      minutes[key] = Number((await getJson(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`)).price)
    }
  }
  return minutes[key]
}

export const saveNativePrices = () => writeCache('native-prices', minutes)

export type Quote = { price: number, mcap: number, symbol: string }

const DEXSCREENER: Record<Chain, string> = {
  solana: 'solana', bsc: 'bsc', ethereum: 'ethereum', base: 'base', arbitrum: 'arbitrum', polygon: 'polygon',
}

// Live price + market cap from DexScreener (free, 30 tokens per call). Picks the most liquid pair.
export async function currentPrices(chain: Chain, tokens: string[]): Promise<Map<string, Quote>> {
  const out = new Map<string, Quote>()
  const best = new Map<string, number>()
  for (let i = 0; i < tokens.length; i += 30) {
    const batch = tokens.slice(i, i + 30)
    const pairs = await getJson(`https://api.dexscreener.com/tokens/v1/${DEXSCREENER[chain]}/${batch.join(',')}`)
    for (const p of pairs) {
      const token = batch.find(t => t.toLowerCase() === p.baseToken.address.toLowerCase())
      const liq = p.liquidity?.usd ?? 0
      if (!token || !p.priceUsd || (best.get(token) ?? -1) >= liq) continue
      best.set(token, liq)
      out.set(token, { price: Number(p.priceUsd), mcap: p.marketCap ?? p.fdv ?? 0, symbol: p.baseToken.symbol })
    }
  }
  return out
}
