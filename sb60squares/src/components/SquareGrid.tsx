import { Fragment, useEffect, useState } from 'react'
import { supabase, SquareCell } from '../supabaseClient'
import ImageUploadModal from './ImageUploadModal'

interface SquareGridProps {
  pageId: string
  teamAScore: number
  teamBScore: number
}

const FOOTBALL_COLS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const FOOTBALL_ROWS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function SquareGrid({ pageId, teamAScore, teamBScore }: SquareGridProps) {
  const [cells, setCells] = useState<SquareCell[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [likelyWinners, setLikelyWinners] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadCells()
  }, [pageId])

  useEffect(() => {
    calculateLikelyWinners()
  }, [teamAScore, teamBScore])

  const loadCells = async () => {
    try {
      const { data, error } = await supabase
        .from('square_cells')
        .select('*')
        .eq('page_id', pageId)

      if (error) throw error
      setCells(data || [])
    } catch (err) {
      console.error('Error loading cells:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateLikelyWinners = () => {
    const possibleWinners = new Set<string>()

    FOOTBALL_COLS.forEach(col => {
      FOOTBALL_ROWS.forEach(row => {
        const cellScore = row * 10 + col * 7

        if (cellScore === (teamAScore % 100) % 10 || cellScore === (teamBScore % 100) % 10) {
          possibleWinners.add(`${row}-${col}`)
        }

        if (
          Math.abs(cellScore - (teamAScore % 100)) <= 5 ||
          Math.abs(cellScore - (teamBScore % 100)) <= 5
        ) {
          possibleWinners.add(`${row}-${col}`)
        }
      })
    })

    setLikelyWinners(possibleWinners)
  }

  const currentWinnerRow = teamAScore % 10
  const currentWinnerCol = teamBScore % 10

  const cellMap = new Map(cells.map(cell => [`${cell.row}-${cell.col}`, cell]))

  if (loading) {
    return <div className="loading">Loading squares...</div>
  }

  return (
    <>
      <div className="grid-container">
        <div className="grid">
          <div className="grid-header"></div>
          {FOOTBALL_COLS.map(col => (
            <div key={`col-${col}`} className="grid-header">
              {col}
            </div>
          ))}

          {FOOTBALL_ROWS.map(row => (
            <Fragment key={`row-${row}`}>
              <div className="grid-header">{row}</div>
              {FOOTBALL_COLS.map(col => {
                const cellKey = `${row}-${col}`
                const cell = cellMap.get(cellKey)
                const isCurrentWinner = row === currentWinnerRow && col === currentWinnerCol
                const isLikelyWinner = likelyWinners.has(cellKey)

                let cellClass = 'grid-cell'
                if (isCurrentWinner) {
                  cellClass += ' current'
                } else if (isLikelyWinner) {
                  cellClass += ' likely-winner'
                }

                return (
                  <div
                    key={cellKey}
                    className={cellClass}
                    onClick={() => setSelectedCell({ row, col })}
                  >
                    {cell?.image_url ? (
                      <img src={cell.image_url} alt="Square" className="grid-cell-image" />
                    ) : (
                      <span>{cell?.owner || ''}</span>
                    )}
                  </div>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {selectedCell && (
        <ImageUploadModal
          pageId={pageId}
          row={selectedCell.row}
          col={selectedCell.col}
          onClose={() => {
            setSelectedCell(null)
            loadCells()
          }}
        />
      )}
    </>
  )
}
