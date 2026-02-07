import { useMemo } from 'react'

interface HeatMapProps {
  teamAScore: number
  teamBScore: number
}

export default function HeatMap({ teamAScore, teamBScore }: HeatMapProps) {
  const likelyWinners = useMemo(() => {
    const cellWinnersMap: { [key: string]: number } = {}

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cellKey = `${row}-${col}`
        let score = 0

        const scoreDiffA = Math.abs(row - (teamAScore % 10))
        const scoreDiffB = Math.abs(col - (teamBScore % 10))

        if (scoreDiffA === 0 && scoreDiffB === 0) {
          score = 100
        } else if (scoreDiffA <= 1 && scoreDiffB <= 1) {
          score = 80
        } else if (scoreDiffA <= 2 && scoreDiffB <= 2) {
          score = 60
        } else if (scoreDiffA <= 3 && scoreDiffB <= 3) {
          score = 40
        } else if (scoreDiffA <= 4 && scoreDiffB <= 4) {
          score = 20
        }

        cellWinnersMap[cellKey] = score
      }
    }

    return Object.entries(cellWinnersMap)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
  }, [teamAScore, teamBScore])

  return (
    <div className="card">
      <div className="card-title">Heat Map</div>
      <div className="card-title" style={{ fontSize: '12px', fontWeight: '400', marginTop: '-12px', marginBottom: '16px' }}>
        Likely winners based on score
      </div>
      <div className="heat-map">
        {likelyWinners.map(([cellKey, score]) => {
          const [row, col] = cellKey.split('-').map(Number)
          return (
            <div key={cellKey} className="heat-item">
              <span>
                ({row},{col})
              </span>
              <div className="heat-value" style={{ opacity: score / 100 }}></div>
              <span>{Math.round(score)}%</span>
            </div>
          )
        })}
        {likelyWinners.length === 0 && <div style={{ color: '#6b7280', fontSize: '14px' }}>No winners yet</div>}
      </div>
    </div>
  )
}
