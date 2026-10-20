import assert from 'node:assert/strict'
import test from 'node:test'
import { computePositions } from './pnl.ts'
import { toTrade, type Trade } from './trades.ts'

const t = (side: Trade['side'], amount: number, usd: number, ts: number): Trade =>
  ({ chain: 'solana', tx: String(ts), ts, token: 'X', side, amount, usd })

test('average cost: partial sell, then mark to market', () => {
  const [p] = computePositions([
    t('buy', 100, 100, 1), // $1
    t('buy', 100, 300, 2), // $3 -> avg $2
    t('sell', 100, 500, 3), // sell at $5: +$300 realized
  ], new Map([['X', 4]]))
  assert.equal(p.realized, 300)
  assert.equal(p.qty, 100)
  assert.equal(p.cost, 200)
  assert.equal(p.unrealized, 200) // 100 * $4 - $200
  assert.equal(p.pnl, 500)
  assert.equal(p.pnlPct, 500 / 400)
  assert.equal(p.avgEntry, 2)
})

test('selling more than bought only realizes the matched part', () => {
  const [p] = computePositions([t('buy', 10, 10, 1), t('sell', 20, 40, 2)], new Map())
  assert.equal(p.realized, 10) // half the proceeds ($20) against $10 cost
  assert.equal(p.unmatchedSold, 10)
  assert.equal(p.qty, 0)
})

test('toTrade classifies by what the wallet gained and lost', async () => {
  const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  const buy = await toTrade('solana', 'a', 1, new Map([[USDC, -50], ['X', 1000]]))
  assert.deepEqual([buy?.side, buy?.amount, buy?.usd], ['buy', 1000, 50])
  const sell = await toTrade('solana', 'b', 1, new Map([[USDC, 80], ['X', -1000]]))
  assert.deepEqual([sell?.side, sell?.usd], ['sell', 80])
  assert.equal(await toTrade('solana', 'c', 1, new Map([['X', 1000]])), null) // airdrop/transfer
  assert.equal(await toTrade('solana', 'd', 1, new Map([['X', -5], ['Y', 9]])), null) // token->token
})

test('grades: formulas on the 20–80 scale', async () => {
  const { gradePositions } = await import('./grades.ts')
  const positions = computePositions([
    t('buy', 10, 100, 1), t('sell', 10, 200, 2), // +100
    { ...t('buy', 10, 100, 3), token: 'Y' }, { ...t('sell', 10, 50, 4), token: 'Y' }, // -50
  ], new Map())
  const g = gradePositions(positions)
  assert.equal(g.profit.value, 65) // roi 50/200 = 25% -> 50 + 15
  assert.equal(g.hit.value, 50) // 1 of 2
  assert.equal(g.payoff.value, 65) // 100/50 = 2x
  assert.equal(g.overall.value, 60) // 0.5*65 + 0.2*50 + 0.3*65 = 62 -> 60
  assert.equal(g.confidence, 'low')
  assert.equal(gradePositions([]).overall.value, null)
})

test('transfers out leave the position at cost; unpriced holdings are not a loss', async () => {
  const [p] = computePositions([t('buy', 100, 50, 1), { ...t('out', 60, 0, 2) }, t('sell', 40, 40, 3)], new Map())
  assert.equal(p.sentQty, 60)
  assert.equal(p.realized, 20) // 40 tokens at $0.50 cost sold for $40
  assert.equal(p.qty, 0)
  const [q] = computePositions([t('buy', 10, 30, 1)], new Map()) // no price known
  assert.equal(q.priced, false)
  assert.equal(q.unrealized, 0)
  const out = await toTrade('solana', 'e', 1, new Map([['X', -5]]))
  assert.equal(out?.side, 'out')
})
