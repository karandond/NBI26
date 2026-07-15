import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyProjects } from '../api/customers.js'

function IconFolder({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M9 21V9"/>
    </svg>
  )
}

function ProjectDetailPanel({ project, customer, onClose }) {
  const date = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'Not recorded'

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <div className="project-panel">
        <div className="project-panel-header">
          <div className="project-panel-icon">
            <IconFolder size={22} />
          </div>
          <div className="project-panel-title-wrap">
            <span className="project-panel-label">Project</span>
            <h3 className="project-panel-title">{project.name}</h3>
          </div>
          <button className="project-panel-close" onClick={onClose} title="Close">
            <IconClose />
          </button>
        </div>

        <div className="project-panel-body">
          <div className="project-detail-section">
            <h4 className="project-detail-section-title">Details</h4>
            <div className="project-detail-rows">
              <div className="project-detail-row">
                <span className="project-detail-icon"><IconBuilding /></span>
                <span className="project-detail-key">Customer</span>
                <span className="project-detail-value">{customer.name}</span>
              </div>
              <div className="project-detail-row">
                <span className="project-detail-icon"><IconCalendar /></span>
                <span className="project-detail-key">Added on</span>
                <span className="project-detail-value">{date}</span>
              </div>
              <div className="project-detail-row">
                <span className="project-detail-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </span>
                <span className="project-detail-key">Status</span>
                <span className="project-detail-value">
                  <span className="badge badge-approved" style={{ fontSize: 11 }}>
                    <span className="badge-dot" /> Active
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="project-detail-section">
            <h4 className="project-detail-section-title">Project ID</h4>
            <code className="project-id-code">{project.id}</code>
          </div>
        </div>
      </div>
    </>
  )
}

export default function MyProjects() {
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [selected, setSelected]   = useState(null)

  useEffect(() => {
    getMyProjects().then((res) => {
      setLoading(false)
      if (res.success) setData(res)
      else setError(res.message || 'Failed to load projects.')
    })
  }, [])

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 16, width: 280 }} />
        </div>
        <div className="project-tile-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="project-tile skeleton-tile">
              <div className="skeleton" style={{ height: 28, width: 28, borderRadius: '50%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 20, width: '70%' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error"><span>⚠</span> {error}</div>
  }

  if (!data?.customer) {
    return (
      <div>
        <div className="page-header">
          <h2>Projects</h2>
          <p>Projects assigned to your account will appear here.</p>
        </div>
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📂</div>
          <p>You haven't been assigned to a customer yet.</p>
          <p style={{ marginTop: 6, fontSize: 13 }}>Please contact your administrator.</p>
        </div>
      </div>
    )
  }

  const { customer, projects } = data

  return (
    <div>
      <div className="page-header">
        <h2>Projects</h2>
        <p>Projects for <strong>{customer.name}</strong></p>
      </div>

      <div className="my-projects-banner">
        <span className="my-projects-customer-label">Customer</span>
        <span className="my-projects-customer-name">{customer.name}</span>
        <span className="my-projects-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <div className="empty-state-icon">📁</div>
          <p>No projects have been added yet.</p>
        </div>
      ) : (
        <div className="project-tile-grid">
          {projects.map((project) => (
            <button
              key={project.id}
              className="project-tile"
              onClick={() => setSelected(project)}
              title="Click to view details"
            >
              <div className="project-tile-icon"><IconFolder /></div>
              <div className="project-tile-name">{project.name}</div>
              <div className="project-tile-meta">{customer.name}</div>
              <div className="project-tile-cta">View details →</div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ProjectDetailPanel
          project={selected}
          customer={customer}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
