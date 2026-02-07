import { useEffect, useState } from 'react'
import { supabase, SquaresPage } from '../supabaseClient'

interface PageListProps {
  currentPageId: string | null
  onPageSelect: (pageId: string) => void
  onPageCreate: (page: SquaresPage) => void
}

export default function PageList({ currentPageId, onPageSelect, onPageCreate }: PageListProps) {
  const [pages, setPages] = useState<SquaresPage[]>([])
  const [newPageName, setNewPageName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const { data, error } = await supabase.from('squares_pages').select('*').order('created_at', { ascending: false })

      if (error) throw error
      setPages(data || [])
      if (data && data.length > 0 && !currentPageId) {
        onPageSelect(data[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const createNewPage = async () => {
    if (!newPageName.trim()) {
      setError('Please enter a page name')
      return
    }

    try {
      const { data, error } = await supabase
        .from('squares_pages')
        .insert([{ name: newPageName }])
        .select()

      if (error) throw error
      if (data && data.length > 0) {
        const newPage = data[0]
        setPages([newPage, ...pages])
        onPageCreate(newPage)
        onPageSelect(newPage.id)
        setNewPageName('')
        setError('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page')
    }
  }

  return (
    <div className="card">
      <div className="card-title">Squares Pools</div>

      {error && <div className="error" style={{ marginBottom: '16px' }}>{error}</div>}

      <div className="form-group" style={{ marginBottom: '16px' }}>
        <input
          type="text"
          className="input"
          placeholder="New pool name"
          value={newPageName}
          onChange={e => setNewPageName(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && createNewPage()}
        />
        <button className="button button-primary" onClick={createNewPage} style={{ marginTop: '8px' }}>
          Create Pool
        </button>
      </div>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {pages.map(page => (
          <div
            key={page.id}
            className={`list-item ${currentPageId === page.id ? 'active' : ''}`}
            onClick={() => onPageSelect(page.id)}
            style={{
              background: currentPageId === page.id ? 'rgba(59, 130, 246, 0.2)' : undefined,
              borderColor: currentPageId === page.id ? 'rgba(59, 130, 246, 0.5)' : undefined,
              border: currentPageId === page.id ? '1px solid' : undefined,
            }}
          >
            <span>{page.name}</span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>
              {new Date(page.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>

      {loading && <div className="loading">Loading pools...</div>}
      {!loading && pages.length === 0 && <div style={{ color: '#9ca3af' }}>No pools yet. Create one!</div>}
    </div>
  )
}
