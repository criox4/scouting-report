try { process.loadEnvFile('.env') } catch {} // Next.js loads .env itself; this is for the CLI

// Primary key first, backup second. src/util.ts withKey() moves to the backup when one runs out of credits.
const keys = (...names: string[]) => names.map(n => process.env[n]).filter((k): k is string => !!k)
export const HELIUS_KEYS = keys('HELIUS_API_KEY', 'HELIUS_API_KEY_BACKUP')
export const DRPC_KEYS = keys('DRPC_KEY', 'DRPC_KEY_BACKUP')

export type Chain = 'solana' | 'bsc' | 'ethereum' | 'base' | 'arbitrum' | 'polygon'

// Assets that count as "cash". A swap's USD value comes from the quote side.
// 'native' = priced from Binance at the swap minute, 'usd' = stablecoin at $1.
type Quote = 'native' | 'usd'
type ChainConfig = { binance: string, wrapped?: string, quotes: Record<string, Quote> }

export const NATIVE = 'native'

export const CHAINS: Record<Chain, ChainConfig> = {
  solana: {
    binance: 'SOLUSDT',
    quotes: {
      native: 'native',
      So11111111111111111111111111111111111111112: 'native', // WSOL
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'usd', // USDC
      Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCecxkVp1x: 'usd', // USDT
    },
  },
  bsc: {
    binance: 'BNBUSDT',
    wrapped: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    quotes: {
      native: 'native',
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'native', // WBNB
      '0x55d398326f99059ff775485246999027b3197955': 'usd', // USDT
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'usd', // USDC
      '0xe9e7cea3dedca5984780bafc599bd69add087d56': 'usd', // BUSD
    },
  },
  ethereum: {
    binance: 'ETHUSDT',
    wrapped: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    quotes: {
      native: 'native',
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'native', // WETH
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'usd', // USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'usd', // USDT
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'usd', // DAI
    },
  },
  base: {
    binance: 'ETHUSDT',
    wrapped: '0x4200000000000000000000000000000000000006',
    quotes: {
      native: 'native',
      '0x4200000000000000000000000000000000000006': 'native', // WETH
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'usd', // USDC
    },
  },
  arbitrum: {
    binance: 'ETHUSDT',
    wrapped: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    quotes: {
      native: 'native',
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': 'native', // WETH
      '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'usd', // USDC
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'usd', // USDT
    },
  },
  polygon: {
    binance: 'POLUSDT',
    wrapped: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    quotes: {
      native: 'native',
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270': 'native', // WPOL
      '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'usd', // USDC
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'usd', // USDT
    },
  },
}

export const isChain = (s: string): s is Chain => s in CHAINS

// Wallets end up in cache file names and API URLs, so they are validated strictly.
export function validWallet(chain: string, wallet: string): chain is Chain {
  if (!isChain(chain)) return false
  return chain === 'solana' ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet) : /^0x[0-9a-fA-F]{40}$/.test(wallet)
}
