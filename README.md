# Scouting Report — on-chain trader PnL tracker

Paste any wallet and get a scout's report on how that trader actually performs: total PnL
(realized + unrealized), win rate, a graded record on the 20–80 scouting scale, best calls, open
positions with average entry vs. current market cap, the full swap log, and an AI-written
assessment. Everything is rebuilt from public on-chain data, so it works for **any** wallet, not
only users of one app, on **Solana, BNB Chain, Ethereum, Base, Arbitrum and Polygon**.

It runs on free data tiers (Helius, dRPC, Binance, DexScreener) with automatic failover to backup keys.

## Features

- **Wallet report**: overall grade and three tool grades (profit, hit rate, payoff), each printed with its formula; totals, best calls, holdings/closed positions, swap log, method & limits.
- **AI assessment**: a short scout's read (verdict, style, strengths, risks, copy-trade advice) from any OpenAI-compatible model, generated once per report and stored.
- **Leaderboard & recently filed**: every filed report is kept in SQLite; the home page ranks graded wallets (10+ swaps) and lists the latest lookups.
- **Caching**: swap history, prices, token decimals, reports and analyses live in one SQLite file. Re-opening a report within 5 minutes is instant; after that only new transactions are fetched.
- **Streaming progress**: first lookups of busy wallets backfill history (seconds to ~1 minute); the page shows each stage live.
- **Key failover**: when the primary Helius/dRPC key is rejected or out of credits, the backup key takes over for 15 minutes.
- **CLI**: the same report in the terminal.

## How PnL is computed

1. **Find the wallet's transactions.**
   - **Solana:** Helius `getTransactionsForAddress`, filtered to transactions that moved the wallet's tokens. Busy wallets also show up in thousands of other people's transactions, and this filter skips those.
   - **EVM chains:** `eth_getLogs` for ERC-20 `Transfer` events to or from the wallet, then the receipt of each transaction.
2. **Classify each transaction by the wallet's net balance change.**
   - One token up while SOL/BNB/ETH/POL or a stablecoin went down is a **buy**; the reverse is a **sell**.
   - A token leaving with no cash coming back is a **transfer out**. It reduces the position at cost and creates no PnL.
   - This needs no per-DEX decoder, so every DEX, aggregator and launchpad is covered.
3. **Price the swap.** Its USD value is the cash side. Native coins are priced at the exact minute from Binance klines.
4. **Weighted-average cost basis.**
   - Realized PnL comes from sells.
   - Unrealized PnL is the current DexScreener price × amount held − cost.
   - PnL % = PnL ÷ total bought.
5. **Grades** use the 20–80 scale, where 50 = average. The formulas are in `src/grades.ts`:
   - Profit = 50 + 60 × return
   - Hit rate = 20 + 60 × win rate
   - Payoff = 50 + 15 × log₂(average win ÷ average loss)
   - Overall = 50% profit + 30% payoff + 20% hit rate

**Known limits:**
- Token→token swaps (no cash side) are skipped.
- On EVM chains, swaps routed through trading-bot contracts and gas are not counted.
- Tokens received by transfer have no cost basis, so their sales only count against what was bought here.
- Holdings with no live market price count as neither gain nor loss.

## Setup

Requires Node.js 24+ (uses the built-in `node:sqlite`).

```bash
cp .env.example .env   # fill in the keys
npm install
npm run dev            # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `HELIUS_API_KEY`, `HELIUS_API_KEY_BACKUP` | Solana history (helius.dev; free tier works) |
| `DRPC_KEY`, `DRPC_KEY_BACKUP` | EVM chains via dRPC (`https://lb.drpc.live/<chain>/<key>`) |
| `AI_BASE_URL` | OpenAI-compatible base URL, e.g. `https://api.openai.com/v1` |
| `AI_API_KEY` | Key for the AI endpoint (AI section hides its result on error; reports still work) |
| `AI_MODEL` | Ordered fallback list, e.g. `gpt-6-sol,deepseek-v4-flash` |
| `DATA_DIR` | Folder for `tracker.db` (default `./.cache`; Docker uses `/data`) |

## Usage

**Web:** open `/`, paste a wallet, pick a period (7/30/90 days). Reports live at `/<chain>/<wallet>?days=30`.

**CLI:**

```bash
npm run pnl -- solana <wallet> --days 30
npm run pnl -- bsc 0x… --days 7
```

**API:**

| Endpoint | Returns |
|---|---|
| `GET /api/report?chain=&wallet=&days=` | NDJSON stream: `{type:"progress"}` lines, then `{type:"report"}` or `{type:"error"}` |
| `GET /api/analysis?chain=&wallet=&days=` | `{analysis, model}` for an already-filed report |

## Deploy (Docker)

One image runs everything: the Next.js standalone server, with SQLite on a volume. No database or Redis container is needed.

```bash
docker build -t pnl-tracker .
docker run -d --name pnl-tracker --restart unless-stopped \
  --env-file .env -v pnl-data:/data -p 80:3000 pnl-tracker
```

`./deploy.sh [ssh-host] [port]` does this on a remote Docker host. It copies the source and `.env` over, then builds and restarts the container there.

## Project layout

```
src/            data layer (also used by the CLI)
  solana.ts     Helius history → per-transaction balance deltas
  evm.ts        dRPC Transfer logs → per-transaction balance deltas
  trades.ts     deltas → buy / sell / transfer-out
  prices.ts     Binance minute prices, DexScreener live price + market cap
  pnl.ts        weighted-average cost positions
  grades.ts     20–80 grades with printed formulas
  report.ts     orchestration + 5-minute report cache
  ai.ts         OpenAI-compatible assessment
  db.ts         SQLite: kv cache, reports, analyses, leaderboard
  cli.ts        terminal report
app/            Next.js 16 app (report UI, API routes, home boards)
PRODUCT.md      product context · DESIGN.md design system
```

## Tests

```bash
npm test
```
