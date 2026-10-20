import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { validWallet } from '../../../src/config.ts'
import { ReportView } from '../../components/report-view.tsx'
import { CHAIN_NAMES, parseDays, short } from '../../lib/format.ts'

type Props = { params: Promise<{ chain: string, wallet: string }>, searchParams: Promise<{ days?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chain, wallet } = await params
  return { title: validWallet(chain, wallet) ? `${short(wallet)} on ${CHAIN_NAMES[chain]}` : 'Unknown wallet' }
}

export default async function WalletPage({ params, searchParams }: Props) {
  const { chain, wallet } = await params
  if (!validWallet(chain, wallet)) notFound()
  const days = parseDays((await searchParams).days)
  return <ReportView chain={chain} wallet={wallet} days={days} />
}
