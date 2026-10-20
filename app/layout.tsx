import type { Metadata, Viewport } from 'next'
import { Archivo, Courier_Prime } from 'next/font/google'
import './globals.css'

// Printed form = Archivo (condensed via the wdth axis). Typed entries = Courier Prime.
const printed = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-print', display: 'swap' })
const typed = Courier_Prime({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-typed', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Scouting Report', template: '%s · Scouting Report' },
  description: 'File a scouting report on any wallet: PnL, win rate and graded trading record rebuilt from on-chain swaps.',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e2a8a' },
    { media: '(prefers-color-scheme: dark)', color: '#070917' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${printed.variable} ${typed.variable}`}>
      <body>{children}</body>
    </html>
  )
}
