import { useState, useEffect, useRef } from 'react'
import { listFiles, uploadFiles, deleteFile, downloadFile } from '../api/files.js'

// ── File type icon ─────────────────────────────────────────
function FileIcon({ type }) {
  const t = type || ''
  let color = '#6366f1', label = 'FILE'
  if (t.startsWith('image/'))                          { color = '#ec4899'; label = 'IMG'  }
  else if (t === 'application/pdf')                    { color = '#ef4444'; label = 'PDF'  }
  else if (t.includes('spreadsheet') || t.includes('excel') || t.includes('csv'))
                                                       { color = '#22c55e'; label = 'XLS'  }
  else if (t.includes('word') || t.includes('document'))
                                                       { color = '#3b82f6'; label = 'DOC'  }
  else if (t.includes('zip') || t.includes('rar') || t.includes('tar'))
                                                       { color = '#f59e0b'; label = 'ZIP'  }
  else if (t.startsWith('video/'))                    { color = '#8b5cf6'; label = 'VID'  }
  else if (t.startsWith('text/'))                     { color = '#14b8a6'; label = 'TXT'  }

  return (
    <div className="fw-file-icon" style={{ background: color + '18', color }}>
      <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}>{label}</span>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Icons ──────────────────────────────────────────────────
function IconUpload() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  )
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  )
}

// ── Component ──────────────────────────────────────────────
export default function FileWorkspace({ projectId, projectName }) {
  const [files, setFiles]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [dragging, setDragging]     = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [error, setError]           = useState('')
  const inputRef = useRef()

  useEffect(() => {
    fetchFiles()
  }, [projectId])

  async function fetchFiles() {
    setLoading(true)
    setError('')
    const res = await listFiles(projectId)
    setLoading(false)
    if (res.success) setFiles(res.files)
    else setError(res.message || 'Failed to load files.')
  }

  async function handleUpload(fileList) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setProgress(0)
    setError('')
    const res = await uploadFiles(projectId, Array.from(fileList), setProgress)
    setUploading(false)
    setProgress(0)
    if (res.success) {
      await fetchFiles()
    } else {
      setError(res.message || 'Upload failed.')
    }
  }

  async function handleDelete(fileId) {
    setDeleting(fileId)
    const res = await deleteFile(projectId, fileId)
    setDeleting(null)
    setConfirmDel(null)
    if (res.success) setFiles((prev) => prev.filter((f) => f.id !== fileId))
    else setError(res.message || 'Delete failed.')
  }

  async function handleDownload(file) {
    setDownloading(file.id)
    try { await downloadFile(projectId, file.id, file.name) }
    catch { setError('Download failed.') }
    setDownloading(null)
  }

  // Drag & drop handlers
  function onDragOver(e)  { e.preventDefault(); setDragging(true)  }
  function onDragLeave(e) { e.preventDefault(); setDragging(false) }
  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="fw-root">
      {/* ── Header ── */}
      <div className="fw-header">
        <div>
          <h3 className="fw-title">Files</h3>
          <p className="fw-sub">{files.length} {files.length === 1 ? 'file' : 'files'} in {projectName}</p>
        </div>
        <button className="fw-upload-btn" onClick={() => inputRef.current.click()} disabled={uploading}>
          <IconUpload />
          {uploading ? `Uploading ${progress}%` : 'Upload Files'}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {error && <div className="alert alert-error" style={{ margin: '0 0 12px' }}><span>⚠</span> {error}</div>}

      {/* ── Upload progress bar ── */}
      {uploading && (
        <div className="fw-progress-wrap">
          <div className="fw-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* ── Drop zone ── */}
      <div
        className={`fw-dropzone${dragging ? ' dragging' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <IconUpload />
        <span>Drop files here or <u>browse</u></span>
        <span className="fw-dropzone-hint">Any file type · up to 50 MB each</span>
      </div>

      {/* ── File list ── */}
      {loading ? (
        <div className="fw-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="fw-empty">
          <p>No files uploaded yet.</p>
        </div>
      ) : (
        <ul className="fw-file-list">
          {files.map((file) => (
            <li key={file.id} className="fw-file-row">
              <FileIcon type={file.type} />
              <div className="fw-file-info">
                <span className="fw-file-name">{file.name}</span>
                <span className="fw-file-meta">{fmtSize(file.size)} · {fmtDate(file.createdAt)}</span>
              </div>
              <div className="fw-file-actions">
                {confirmDel === file.id ? (
                  <span className="confirm-inline">
                    <button
                      className="btn-confirm-danger btn-sm"
                      disabled={deleting === file.id}
                      onClick={() => handleDelete(file.id)}
                    >
                      {deleting === file.id ? '…' : 'Delete'}
                    </button>
                    <button className="btn-cancel btn-sm" onClick={() => setConfirmDel(null)}>Cancel</button>
                  </span>
                ) : (
                  <>
                    <button
                      className="fw-action-btn"
                      title="Download"
                      disabled={!!downloading}
                      onClick={() => handleDownload(file)}
                    >
                      {downloading === file.id ? '…' : <IconDownload />}
                    </button>
                    <button
                      className="fw-action-btn fw-action-delete"
                      title="Delete"
                      onClick={() => setConfirmDel(file.id)}
                    >
                      <IconTrash />
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
