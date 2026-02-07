import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

interface ScoreboardProps {
  pageId: string
  onScoreChange: (teamA: number, teamB: number) => void
}

export default function Scoreboard({ pageId, onScoreChange }: ScoreboardProps) {
  const [quarter, setQuarter] = useState(1)
  const [teamAScore, setTeamAScore] = useState(0)
  const [teamBScore, setTeamBScore] = useState(0)
  const [useApi, setUseApi] = useState(false)
  const [liveScore, setLiveScore] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadScores()
  }, [pageId, quarter])

  useEffect(() => {
    if (useApi) {
      fetchLiveScores()
      const interval = setInterval(fetchLiveScores, 60000)
      return () => clearInterval(interval)
    }
  }, [useApi])

  const loadScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('page_id', pageId)
        .eq('quarter', quarter)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setTeamAScore(data.team_a_score)
        setTeamBScore(data.team_b_score)
        onScoreChange(data.team_a_score, data.team_b_score)
      }
    } catch (err) {
      console.error('Error loading scores:', err)
    }
  }

  const fetchLiveScores = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2024/22?key=demo'
      )

      if (!response.ok) throw new Error('Failed to fetch scores')

      const data = await response.json()
      if (data && data.length > 0) {
        const game = data[0]
        setLiveScore({
          homeTeam: game.HomeTeam,
          awayTeam: game.AwayTeam,
          homeScore: game.HomeTeamScore,
          awayScore: game.AwayTeamScore,
          quarter: game.Quarter,
        })
        setTeamAScore(game.HomeTeamScore || 0)
        setTeamBScore(game.AwayTeamScore || 0)
        onScoreChange(game.HomeTeamScore || 0, game.AwayTeamScore || 0)
      }
    } catch (err) {
      console.error('Error fetching live scores:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveScores = async () => {
    try {
      const { error } = await supabase.from('scores').upsert({
        page_id: pageId,
        quarter,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
      })

      if (error) throw error
      onScoreChange(teamAScore, teamBScore)
    } catch (err) {
      console.error('Error saving scores:', err)
    }
  }

  return (
    <div className="scoreboard-card">
      <div className="card-title">Live Scoreboard</div>

      <div className="form-group">
        <label className="label">Quarter</label>
        <select
          className="input"
          value={quarter}
          onChange={e => setQuarter(parseInt(e.target.value))}
        >
          <option value={1}>Q1</option>
          <option value={2}>Q2</option>
          <option value={3}>Q3</option>
          <option value={4}>Q4</option>
          <option value={5}>OT</option>
        </select>
      </div>

      <div className="score-display">
        <div className="team-score">
          <div className="team-score-label">Team A</div>
          <div className="team-score-value">{teamAScore}</div>
        </div>
        <div className="vs-text">VS</div>
        <div className="team-score">
          <div className="team-score-label">Team B</div>
          <div className="team-score-value">{teamBScore}</div>
        </div>
      </div>

      {liveScore && (
        <div className="quarter-display">
          {liveScore.homeTeam} vs {liveScore.awayTeam} - Q{liveScore.quarter}
        </div>
      )}

      <div className="form-group">
        <label className="label">Manual Entry</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <input
              type="number"
              className="input"
              placeholder="Team A"
              value={teamAScore}
              onChange={e => setTeamAScore(parseInt(e.target.value) || 0)}
            />
          </div>
          <div>
            <input
              type="number"
              className="input"
              placeholder="Team B"
              value={teamBScore}
              onChange={e => setTeamBScore(parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="button button-primary" onClick={saveScores} style={{ flex: 1 }}>
          Update Score
        </button>
        <button
          className={`button ${useApi ? 'button-secondary' : 'button-secondary'}`}
          onClick={() => setUseApi(!useApi)}
          style={{ flex: 1 }}
        >
          {loading ? 'Loading...' : useApi ? 'Auto Off' : 'Auto On'}
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
        {useApi
          ? 'Using live API updates (checks every minute)'
          : 'Manual entry mode - update scores manually'}
      </div>
    </div>
  )
}
