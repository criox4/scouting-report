import { getReport, validWallet } from '../../../src/report.ts'
import { parseDays } from '../../lib/format.ts'

export const dynamic = 'force-dynamic'

// Streams NDJSON: {type:'progress',message}… then {type:'report',report} or {type:'error',message}.
// The first lookup of a wallet can take a minute, so the page shows each stage as it happens.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams
  const chain = q.get('chain') ?? ''
  const wallet = q.get('wallet') ?? ''
  if (!validWallet(chain, wallet)) {
    return Response.json({ type: 'error', message: 'That is not a valid wallet address for this chain.' }, { status: 400 })
  }
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + '\n'))
      try {
        const report = await getReport(chain, wallet, parseDays(q.get('days')), message => send({ type: 'progress', message }))
        send({ type: 'report', report })
      } catch (e) {
        send({ type: 'error', message: (e as Error).message })
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'content-type': 'application/x-ndjson; charset=utf-8', 'cache-control': 'no-store' } })
}
