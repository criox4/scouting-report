import type { Report } from './report.ts'
import { getJson } from './util.ts'

// OpenAI-compatible chat completions. AI_MODEL is an ordered fallback list ("a,b"): if a model
// errors or times out, the next one is tried.
const BASE = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, '')
const KEY = process.env.AI_API_KEY ?? ''
const MODELS = (process.env.AI_MODEL ?? 'gpt-4o-mini').split(',').map(s => s.trim()).filter(Boolean)

export const aiEnabled = () => !!KEY

export type Analysis = { verdict: string, style: string, strengths: string[], risks: string[], copyTrade: string }

const SYSTEM = `You are a blunt, careful scout who evaluates on-chain memecoin/DEX traders for people deciding whether to copy-trade them.
You receive a wallet's trading report as JSON. Use ONLY the numbers given; never invent tokens, figures or history.
Weigh sample size (closed positions, confidence), consistency (hit rate vs payoff), concentration (is PnL from one lucky trade?), hold time and size.
Mention data caveats when they matter (tokens received/sent by transfer, unpriced holdings, short period).
Reply with ONLY a JSON object, no markdown:
{"verdict": "<one sentence, max 25 words>", "style": "<how they trade, max 40 words>", "strengths": ["<max 3 items, max 20 words each>"], "risks": ["<max 3 items, max 20 words each>"], "copyTrade": "<would you copy them and how, max 40 words>"}`

// Compact view of the report: what a scout needs, small enough to keep the prompt cheap.
function digest(r: Report) {
  const name = (p: { symbol: string, token: string }) => p.symbol || p.token.slice(0, 6)
  const pos = (p: Report['positions'][number]) => ({
    token: name(p), bought: Math.round(p.boughtUsd), pnl: Math.round(p.pnl), pnlPct: Math.round(p.pnlPct * 100),
    entryMc: p.entryMc && Math.round(p.entryMc), holdMin: Math.round((p.lastTs - p.firstTs) / 60), open: p.qty > 0,
  })
  const byPnl = [...r.positions].sort((a, b) => b.pnl - a.pnl)
  return {
    chain: r.chain, periodDays: r.days, swaps: r.swaps, tokensTraded: r.positions.length,
    totals: Object.fromEntries(Object.entries(r.totals).map(([k, v]) => [k, Math.round(v)])),
    grades: { overall: r.grades.overall.value, profit: r.grades.profit.value, hitRate: r.grades.hit.value, payoff: r.grades.payoff.value },
    closedPositions: r.grades.closed, wins: r.grades.wins, confidence: r.grades.confidence,
    avgHoldMinutes: r.avgHoldSec && Math.round(r.avgHoldSec / 60), avgBuyUsd: r.avgBuyUsd && Math.round(r.avgBuyUsd),
    tokensPartlyReceivedByTransfer: r.unmatchedTokens, tokensSentToOtherWallets: r.sentTokens,
    best: byPnl.slice(0, 6).filter(p => p.pnl > 0).map(pos),
    worst: byPnl.slice(-6).filter(p => p.pnl < 0).reverse().map(pos),
    holdingNow: r.positions.filter(p => p.qty > 0 && p.value >= 1).slice(0, 6).map(pos),
  }
}

function parse(text: string): Analysis {
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  const a = JSON.parse(json)
  const list = (v: unknown) => (Array.isArray(v) ? v : []).map(String).slice(0, 3)
  return { verdict: String(a.verdict ?? ''), style: String(a.style ?? ''), strengths: list(a.strengths), risks: list(a.risks), copyTrade: String(a.copyTrade ?? '') }
}

export async function analyze(r: Report): Promise<{ analysis: Analysis, model: string }> {
  if (!KEY) throw new Error('AI analysis is not configured (AI_API_KEY missing).')
  let last: unknown
  for (const model of MODELS) {
    try {
      const res = await getJson(`${BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
        body: JSON.stringify({
          model, max_tokens: 900, temperature: 0.3,
          messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: JSON.stringify(digest(r)) }],
        }),
      }, `ai ${model}`)
      return { analysis: parse(res.choices[0].message.content), model }
    } catch (e) {
      last = e
      console.warn(`ai: ${model} failed (${(e as Error).message.slice(0, 120)}), trying next model`)
    }
  }
  throw new Error(`The AI scout could not answer: ${(last as Error).message.slice(0, 160)}`)
}
