import { useState, ChangeEvent } from 'react'
import { supabase } from '../supabaseClient'

interface ImageUploadModalProps {
  pageId: string
  row: number
  col: number
  onClose: () => void
}

export default function ImageUploadModal({ pageId, row, col, onClose }: ImageUploadModalProps) {
  const [owner, setOwner] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile && !owner) {
      setError('Please add an owner name or image')
      return
    }

    setLoading(true)
    setError('')

    try {
      let imageUrl: string | undefined

      if (selectedFile) {
        const filename = `${pageId}/${row}-${col}-${Date.now()}`
        const { error: uploadError } = await supabase.storage
          .from('squares')
          .upload(filename, selectedFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('squares').getPublicUrl(filename)
        imageUrl = data.publicUrl
      }

      const { error: updateError } = await supabase
        .from('square_cells')
        .upsert({
          page_id: pageId,
          row,
          col,
          owner: owner || undefined,
          image_url: imageUrl,
        })

      if (updateError) throw updateError

      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update square')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">Edit Square ({row}, {col})</div>

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label className="label">Owner Name</label>
          <input
            type="text"
            className="input"
            value={owner}
            onChange={e => setOwner(e.target.value)}
            placeholder="e.g., John Doe"
          />
        </div>

        <div className="form-group">
          <label className="label">Add Image</label>
          <label className="file-input-label">
            <input
              type="file"
              className="file-input"
              accept="image/*"
              onChange={handleFileSelect}
            />
            Click to upload or drag and drop
          </label>
          {preview && (
            <div style={{ marginTop: '12px' }}>
              <img src={preview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '6px' }} />
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="button button-primary" onClick={handleUpload} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
