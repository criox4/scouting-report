# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js (App Router). Chosen because the tracker's data layer is already TypeScript ES modules (`src/`) that server routes can import directly; runs locally now, deployable to Vercel later.

## Users

Public copy-trade scouts: people deciding whether a memecoin/DEX trader is worth following. They arrive with a wallet address (from a leaderboard, a tweet, a Telegram call, a fomo profile) and want to know quickly whether that trader is actually profitable, how they trade, and what they hold right now.

## Product Purpose

Paste any wallet on a supported chain and get an honest, fomo-style trading profile computed from public on-chain data: total PnL (realized + unrealized), win rate, best trades, open positions with average entry versus current market cap, and the full swap history. Success = a scout can judge a trader in under a minute and trust the numbers.

## Positioning

Works on any wallet, not only users of one app: fomo and similar apps only show trades made inside their own product. This tracker reconstructs trades from the chain itself (per-transaction balance deltas), so it covers every DEX, aggregator and launchpad, across Solana and EVM chains, using free data sources.

## Operating Context

- Input is a wallet address plus a chain (solana, bsc, ethereum, base, arbitrum, polygon).
- First lookup of a wallet backfills history (seconds to ~1–2 minutes for very active wallets); later lookups are incremental and fast. Loading states are a real part of the experience.
- Numbers are dense: USD amounts, percentages, compact market caps, token symbols, timestamps, transaction hashes.

## Capabilities and Constraints

- Data layer exists in `src/` (CLI: `npm run pnl -- <chain> <wallet>`): Helius for Solana, dRPC for EVM, Binance minute prices, DexScreener live prices/market cap, JSON cache in `.cache/`.
- PnL method: weighted-average cost. PnL % = PnL / total USD bought.
- Known gaps the UI must not hide or misrepresent: token→token swaps skipped; EVM bot-contract swaps and gas not counted; tokens received by transfer have no cost basis (`unmatchedSold`); some dead tokens have no symbol/price (shown by truncated address).
- v1 scope: lookup + single-wallet profile. No leaderboard, no accounts, no multi-wallet aggregation yet.
- Product name: undecided.

## Evidence on Hand

Real data only, from the live tracker. No testimonials, user counts, or performance claims exist; none may be invented.

## Product Principles

1. Trust over hype: every number traceable to on-chain transactions; show limitations instead of papering over them.
2. Judge a trader fast: the verdict (profitable or not, how consistently) comes before detail.
3. Chain-agnostic: Solana and EVM wallets feel identical.
4. Free to run: features must fit the free data tiers.
