import { CHAINS, DRPC_KEYS, NATIVE, type Chain } from './config.ts'
import { toTrade, type Trade } from './trades.ts'
import { getJson, mapLimit, readCache, withKey, writeCache } from './util.ts'

const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65' // WETH.withdraw

const rpc = (chain: Chain, method: string, params: unknown[]): Promise<any> => withKey('drpc', DRPC_KEYS, async key => {
  const r = await getJson(`https://lb.drpc.live/${chain}/${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }, `drpc ${chain} ${method}`)
  if (r.error) throw new Error(`drpc ${chain} ${method}: ${r.error.message}`)
  return r.result
})

const hex = (n: number) => '0x' + n.toString(16)

// eth_getLogs caps results (dRPC: 50k logs) and times out on huge ranges; split the range in half until it fits.
async function getLogs(chain: Chain, topics: (string | null)[], from: number, to: number): Promise<any[]> {
  try {
    return await rpc(chain, 'eth_getLogs', [{ fromBlock: hex(from), toBlock: hex(to), topics }])
  } catch (e) {
    if (from >= to || !/limit|range|too many|exceed|timed out|timeout/i.test((e as Error).message)) throw e
    const mid = Math.floor((from + to) / 2)
    return [...await getLogs(chain, topics, from, mid), ...await getLogs(chain, topics, mid + 1, to)]
  }
}

const blockTs = new Map<string, Promise<number>>()
const getBlockTs = (chain: Chain, block: string) => {
  const key = chain + block
  if (!blockTs.has(key)) blockTs.set(key, rpc(chain, 'eth_getBlockByNumber', [block, false]).then(b => Number(b.timestamp)))
  return blockTs.get(key)!
}

const decimals: Record<string, number> = readCache('decimals', {})
async function getDecimals(chain: Chain, token: string) {
  const key = `${chain}:${token}`
  if (decimals[key] === undefined) {
    decimals[key] = await rpc(chain, 'eth_call', [{ to: token, data: '0x313ce567' }, 'latest'])
      .then(r => (r && r !== '0x' ? Number(BigInt(r)) : 18), () => 18)
  }
  return decimals[key]
}

const units = (raw: string, dec: number) => Number(BigInt(raw)) / 10 ** dec

// Scans ERC-20 Transfer logs to/from the wallet, groups them per tx and turns each tx into a trade.
// ponytail: native coin received is read from WETH.withdraw events in txs the wallet sent;
// swaps executed by trading bots on the wallet's behalf are missed. Gas is not counted.
export async function evmTrades(chain: Chain, wallet: string, lastBlock: number | undefined, sinceTs: number, progress = (_: string) => {}) {
  wallet = wallet.toLowerCase()
  const head = Number(await rpc(chain, 'eth_blockNumber', []))
  let from = lastBlock !== undefined ? lastBlock + 1 : 0
  if (lastBlock === undefined) { // estimate the start block from the chain's recent block time
    const span = 100_000
    const [now, then] = await Promise.all([getBlockTs(chain, hex(head)), getBlockTs(chain, hex(head - span))])
    from = Math.max(0, head - Math.ceil((now - sinceTs) / ((now - then) / span)))
  }
  if (from > head) return { trades: [], cursor: head }

  progress(`Scanning ${(head - from).toLocaleString('en-US')} blocks for token transfers`)
  const me = '0x' + wallet.slice(2).padStart(64, '0')
  const [sent, received] = await Promise.all([
    getLogs(chain, [TRANSFER, me], from, head),
    getLogs(chain, [TRANSFER, null, me], from, head),
  ])
  const byTx = new Map<string, any[]>()
  for (const l of [...sent, ...received]) {
    if (l.topics.length !== 3 || l.data === '0x') continue // ERC-721 transfers share the topic
    byTx.set(l.transactionHash, [...byTx.get(l.transactionHash) ?? [], l])
  }

  const { wrapped, quotes } = CHAINS[chain]
  progress(`Found ${byTx.size} transactions that moved tokens`)
  let done = 0
  const results = await mapLimit([...byTx], 5, async ([hash, logs]): Promise<Trade | null> => {
    const [tx, receipt, ts] = await Promise.all([
      rpc(chain, 'eth_getTransactionByHash', [hash]),
      rpc(chain, 'eth_getTransactionReceipt', [hash]),
      getBlockTs(chain, logs[0].blockNumber),
    ])
    if (receipt.status !== '0x1') return null
    const d = new Map<string, number>()
    const add = (k: string, v: number) => d.set(k, (d.get(k) ?? 0) + v)
    for (const l of logs) {
      const token = l.address.toLowerCase()
      const v = units(l.data, await getDecimals(chain, token))
      if (l.topics[1] === me) add(token, -v)
      if (l.topics[2] === me) add(token, v)
    }
    if (tx.from.toLowerCase() === wallet) {
      add(NATIVE, -units(tx.value, 18))
      const gotCash = [...d].some(([k, v]) => quotes[k] && v > 0)
      if (!gotCash) {
        for (const l of receipt.logs) {
          if (l.address.toLowerCase() === wrapped && l.topics[0] === WITHDRAWAL) add(NATIVE, units(l.data, 18))
        }
      }
    }
    if (++done % 25 === 0) progress(`Read ${done} of ${byTx.size} transactions`)
    return toTrade(chain, hash, ts, d)
  })
  writeCache('decimals', decimals)
  return { trades: results.filter(t => t !== null), cursor: head }
}
