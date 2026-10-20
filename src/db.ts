import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

// One SQLite file holds every cache: swap history per wallet, prices, token decimals, filed
// reports (recent searches + leaderboard) and AI analyses. No separate DB/Redis container needed.
const dir = process.env.DATA_DIR ?? join(process.cwd(), '.cache')
mkdirSync(dir, { recursive: true })

export const db = new DatabaseSync(join(dir, 'tracker.db'))
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS reports (
    chain TEXT NOT NULL, wallet TEXT NOT NULL, days INTEGER NOT NULL,
    filed_at INTEGER NOT NULL, swaps INTEGER NOT NULL, grade INTEGER, pnl REAL NOT NULL, bought REAL NOT NULL,
    json TEXT NOT NULL, ai TEXT, ai_model TEXT, ai_at INTEGER,
    PRIMARY KEY (chain, wallet, days)
  );
  CREATE INDEX IF NOT EXISTS reports_recent ON reports (filed_at DESC);
`)

export function kvGet<T>(key: string, fallback: T): T {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key) as { value: string } | undefined
  return row ? JSON.parse(row.value) : fallback
}

export function kvSet(key: string, value: unknown) {
  db.prepare('INSERT INTO kv (key, value, updated) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated = excluded.updated')
    .run(key, JSON.stringify(value), Date.now())
}

export type ReportRow = { chain: string, wallet: string, days: number, filed_at: number, swaps: number, grade: number | null, pnl: number, bought: number }
const COLS = 'chain, wallet, days, filed_at, swaps, grade, pnl, bought'

export function saveReport(r: { chain: string, wallet: string, days: number, filedAt: number, swaps: number, grades: { overall: { value: number | null } }, totals: { pnl: number, bought: number } }) {
  db.prepare(`INSERT INTO reports (${COLS}, json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(chain, wallet, days) DO UPDATE SET filed_at = excluded.filed_at, swaps = excluded.swaps, grade = excluded.grade,
      pnl = excluded.pnl, bought = excluded.bought, json = excluded.json, ai = NULL, ai_model = NULL, ai_at = NULL`)
    .run(r.chain, r.wallet, r.days, r.filedAt, r.swaps, r.grades.overall.value, r.totals.pnl, r.totals.bought, JSON.stringify(r))
}

export function loadReport(chain: string, wallet: string, days: number) {
  return db.prepare(`SELECT json, filed_at, ai, ai_model FROM reports WHERE chain = ? AND wallet = ? AND days = ?`).get(chain, wallet, days) as
    { json: string, filed_at: number, ai: string | null, ai_model: string | null } | undefined
}

export function saveAnalysis(chain: string, wallet: string, days: number, ai: string, model: string) {
  db.prepare('UPDATE reports SET ai = ?, ai_model = ?, ai_at = ? WHERE chain = ? AND wallet = ? AND days = ?').run(ai, model, Date.now(), chain, wallet, days)
}

export const recentReports = (limit = 8) =>
  db.prepare(`SELECT ${COLS} FROM reports ORDER BY filed_at DESC LIMIT ?`).all(limit) as ReportRow[]

// Ranked by grade, then PnL. A wallet needs a real sample (10+ swaps) to be ranked.
export const leaderboard = (limit = 10) =>
  db.prepare(`SELECT ${COLS} FROM reports WHERE grade IS NOT NULL AND swaps >= 10 ORDER BY grade DESC, pnl DESC LIMIT ?`).all(limit) as ReportRow[]
