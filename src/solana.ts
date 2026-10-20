import { HELIUS_KEYS, NATIVE } from './config.ts'
import { toTrade, type Trade } from './trades.ts'
import { getJson, withKey } from './util.ts'

const MAX_PAGES = 50 // 1000 txs per page, 10 credits per 100 txs

// Net change per asset for `wallet` in one raw transaction (getTransaction shape).
export function solanaDeltas(tx: any, wallet: string): Map<string, number> {
  const d = new Map<string, number>()
  const add = (k: string, v: number) => d.set(k, (d.get(k) ?? 0) + v)
  const { meta, transaction } = tx
  const keys = [...transaction.message.accountKeys, ...meta.loadedAddresses?.writable ?? [], ...meta.loadedAddresses?.readonly ?? []]
  const i = keys.indexOf(wallet)
  if (i >= 0) add(NATIVE, (meta.postBalances[i] - meta.preBalances[i]) / 1e9)
  for (const [balances, sign] of [[meta.preTokenBalances, -1], [meta.postTokenBalances, 1]] as const) {
    for (const b of balances ?? []) {
      if (b.owner === wallet) add(b.mint, sign * Number(b.uiTokenAmount.amount) / 10 ** b.uiTokenAmount.decimals)
    }
  }
  return d
}

// Helius getTransactionsForAddress, filtered to txs that moved the wallet's tokens. Busy wallets are
// referenced by thousands of other people's txs (copy-trade bots etc.); this filter drops those.
// Incremental runs pass the newest block time already seen as `afterTs`.
export async function solanaTrades(wallet: string, afterTs: number | undefined, sinceTs: number, progress = (_: string) => {}) {
  const trades: Trade[] = []
  let newest = afterTs ?? 0
  let token: string | null = null
  let read = 0
  for (let page = 0; page < MAX_PAGES; page++) {
    const r = await withKey('helius', HELIUS_KEYS, async key => {
      const res = await getJson(`https://mainnet.helius-rpc.com/?api-key=${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'getTransactionsForAddress',
          params: [wallet, {
            transactionDetails: 'full', encoding: 'json', maxSupportedTransactionVersion: 1, limit: 1000,
            ...token && { paginationToken: token },
            filters: { status: 'succeeded', tokenTransfer: {}, blockTime: { gte: Math.max(sinceTs, afterTs ?? 0) } },
          }],
        }),
      }, 'helius')
      if (res.error) throw new Error(`helius: ${res.error.message}`)
      return res
    })
    const txs: any[] = r.result.data
    for (const t of txs) {
      newest = Math.max(newest, t.blockTime)
      const trade = await toTrade('solana', t.transaction.signatures[0], t.blockTime, solanaDeltas(t, wallet))
      if (trade) trades.push(trade)
    }
    read += txs.length
    if (txs.length) progress(`Read ${read.toLocaleString('en-US')} transactions, back to ${new Date(txs.at(-1).blockTime * 1000).toISOString().slice(0, 10)}`)
    token = r.result.paginationToken
    if (!token || !txs.length) break
  }
  return { trades, cursor: newest || undefined }
}
