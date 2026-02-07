import { useState } from 'react'
import SquareGrid from './components/SquareGrid'
import Scoreboard from './components/Scoreboard'
import HeatMap from './components/HeatMap'
import PageList from './components/PageList'
import { SquaresPage } from './supabaseClient'
import './styles.css'

export default function App() {
  const [currentPageId, setCurrentPageId] = useState<string | null>(null)
  const [teamAScore, setTeamAScore] = useState(0)
  const [teamBScore, setTeamBScore] = useState(0)

  const handlePageCreate = (page: SquaresPage) => {
    setCurrentPageId(page.id)
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1>Super Bowl Squares</h1>
        <p>Track your squares and watch the winning cells light up</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px' }}>
        <div style={{ minWidth: '300px' }}>
          <PageList
            currentPageId={currentPageId}
            onPageSelect={setCurrentPageId}
            onPageCreate={handlePageCreate}
          />
        </div>

        <div>
          {currentPageId ? (
            <>
              <div className="content-section">
                <SquareGrid
                  pageId={currentPageId}
                  teamAScore={teamAScore}
                  teamBScore={teamBScore}
                />
                <div className="sidebar">
                  <Scoreboard pageId={currentPageId} onScoreChange={(a, b) => {
                    setTeamAScore(a)
                    setTeamBScore(b)
                  }} />
                  <HeatMap teamAScore={teamAScore} teamBScore={teamBScore} />
                </div>
              </div>
            </>
          ) : (
            <div className="loading" style={{ minHeight: '400px' }}>
              Create or select a pool to get started
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
