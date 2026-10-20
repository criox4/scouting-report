import { Boards } from './components/boards.tsx'
import { FormHead } from './components/form-head.tsx'
import { GradeScale } from './components/marks.tsx'

export const dynamic = 'force-dynamic' // boards read the live DB

export default function Home() {
  return (
    <main className="sheet">
      <FormHead chain="solana" days={30} autoFocus />
      <section className="verdict blank" aria-label="How a report is filed">
        <div className="overall">
          <span className="lbl">Overall grade</span>
          <div className="grade-big typed pending" aria-hidden="true" />
          <GradeScale value={null} caret label="Overall grade" />
          <p className="stamp stamp-none">Awaiting subject</p>
        </div>
        <div className="typelog">
          <h2 className="lbl">Instructions to the scout</h2>
          <ol className="steps typed">
            <li>Paste any wallet into the subject field. Solana addresses and 0x addresses on BNB Chain, Ethereum, Base, Arbitrum and Polygon all work.</li>
            <li>The report is rebuilt from the chain itself: every swap on any DEX or launchpad, priced at the minute it happened.</li>
            <li>You get an overall grade on the 20–80 scouting scale, the profit, hit rate and payoff behind it, what they hold now, and every swap.</li>
          </ol>
          <p className="basis">50 is average. Every grade is a printed formula on the wallet&rsquo;s own numbers, shown on the report.</p>
        </div>
      </section>
      <Boards />
      <footer className="foot">
        <p>Filed from public on-chain data. Grades are formulas on a wallet&rsquo;s own numbers, not advice.</p>
        <p>Data: Helius · dRPC · Binance · DexScreener</p>
      </footer>
    </main>
  )
}
