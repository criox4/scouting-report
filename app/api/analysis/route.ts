import { analyze, type Analysis } from '../../../src/ai.ts'
import { validWallet } from '../../../src/config.ts'
import { loadReport, saveAnalysis } from '../../../src/db.ts'
import { normalizeWallet } from '../../../src/report.ts'
import { parseDays } from '../../lib/format.ts'

export const dynamic = 'force-dynamic'

const pending = new Map<string, Promise<{ analysis: Analysis, model: string }>>()

// AI read of a filed report. Generated once per report and stored next to it.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const chain = q.get('chain') ?? ''
  const raw = q.get('wallet') ?? ''
  if (!validWallet(chain, raw)) return Response.json({ error: 'That is not a valid wallet address for this chain.' }, { status: 400 })
  const wallet = normalizeWallet(chain, raw)
  const days = parseDays(q.get('days'))
  const row = loadReport(chain, wallet, days)
  if (!row) return Response.json({ error: 'File the report first.' }, { status: 404 })
  if (row.ai) return Response.json({ analysis: JSON.parse(row.ai), model: row.ai_model })

  const key = `${chain}:${wallet}:${days}:${row.filed_at}`
  if (!pending.has(key)) {
    pending.set(key, analyze(JSON.parse(row.json)).then(res => {
      saveAnalysis(chain, wallet, days, JSON.stringify(res.analysis), res.model)
      return res
    }).finally(() => pending.delete(key)))
  }
  try {
    return Response.json(await pending.get(key))
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 })
  }
}
