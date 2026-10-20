const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const RETRY = [429, 500, 502, 503, 504]

// fetch JSON with backoff on rate limits. Errors never include the URL (keys live in it).
export async function getJson(url: string, init?: RequestInit, label = new URL(url).host): Promise<any> {
  for (let i = 0; ; i++) {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) }).catch(e => e as Error)
    if (!(r instanceof Error) && r.ok) return r.json()
    const status = r instanceof Error ? 0 : r.status
    if (i >= 5 || (status && !RETRY.includes(status))) {
      const body = r instanceof Error ? r.message : (await r.text()).slice(0, 200)
      throw new Error(`${label} failed (${status}): ${body}`)
    }
    await sleep(500 * 2 ** i)
  }
}

// Errors that mean "this key is out of credits / not allowed", as opposed to a bad request.
const KEY_REJECTED = /\((401|402|403|429)\)|credit|quota|insufficient|unauthori[sz]ed|forbidden|payment|exhausted/i
const benched = new Map<string, number>() // key -> benched until (ms)

// Runs fn with the first usable key; on a key-level rejection benches that key for 15 minutes
// and retries with the next one (the backup).
export async function withKey<T>(name: string, keys: string[], fn: (key: string) => Promise<T>): Promise<T> {
  if (!keys.length) throw new Error(`${name}: no API key configured in .env`)
  const ready = keys.filter(k => (benched.get(k) ?? 0) < Date.now())
  let last: unknown
  for (const k of ready.length ? ready : keys) {
    try {
      return await fn(k)
    } catch (e) {
      last = e
      if (!KEY_REJECTED.test((e as Error).message)) throw e
      benched.set(k, Date.now() + 15 * 60_000)
      console.warn(`${name}: key ${keys.indexOf(k) + 1} of ${keys.length} rejected, trying the next one`)
    }
  }
  throw last
}

export async function mapLimit<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]) }
  }))
  return out
}

// Caches live in SQLite (src/db.ts); these names are kept so call sites stay simple.
export { kvGet as readCache, kvSet as writeCache } from './db.ts'
