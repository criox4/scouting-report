import { CHAINS, type Chain } from './config.ts'
import { nativeUsdAt } from './prices.ts'

export type Trade = {
  chain: Chain
  tx: string
  ts: number // unix seconds
  token: string // mint / contract address
  side: 'buy' | 'sell' | 'out' // out = sent to another wallet, no PnL
  amount: number // token units
  usd: number // 0 for 'out'
}

const MIN_USD = 0.5 // below this the "quote" side is just fees/rent, not a trade

// Turn one transaction's net balance changes for the wallet into a trade.
// Works for any DEX/aggregator because it only looks at what the wallet gained and lost.
// ponytail: token->token swaps (no cash side) and multi-token txs are skipped; price via a
// historical price API if those turn out to matter.
export async function toTrade(chain: Chain, tx: string, ts: number, deltas: Map<string, number>): Promise<Trade | null> {
  const quotes = CHAINS[chain].quotes
  let quoteUsd = 0
  const tokens: [string, number][] = []
  for (const [asset, d] of deltas) {
    if (!d) continue
    const q = quotes[asset]
    if (q === 'usd') quoteUsd += d
    else if (q === 'native') quoteUsd += d * await nativeUsdAt(chain, ts)
    else tokens.push([asset, d])
  }
  if (tokens.length !== 1) return null
  const [token, d] = tokens[0]
  if (d > 0 && quoteUsd <= -MIN_USD) return { chain, tx, ts, token, side: 'buy', amount: d, usd: -quoteUsd }
  if (d < 0 && quoteUsd >= MIN_USD) return { chain, tx, ts, token, side: 'sell', amount: -d, usd: quoteUsd }
  if (d < 0 && Math.abs(quoteUsd) < MIN_USD) return { chain, tx, ts, token, side: 'out', amount: -d, usd: 0 }
  return null // received by transfer: no cost basis, so sells of it count as unmatched
}
