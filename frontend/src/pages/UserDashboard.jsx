import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getMyProjects } from '../api/customers.js'
import FileWorkspace from '../components/FileWorkspace.jsx'

// ── Icons ──────────────────────────────────────────────────
function IconFolder({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function IconBuilding() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  )
}

function ProjectWorkspace({ project, customer }) {
  const date = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="pw-root">
      <div className="pw-header">
        <div className="pw-header-icon"><IconFolder size={20} /></div>
        <div>
          <div className="pw-header-customer">{customer.name}</div>
          <h1 className="pw-header-title">{project.name}</h1>
        </div>
        <div className="pw-header-chips">
          <span className="pw-chip pw-chip-active">Active</span>
          {date && <span className="pw-chip">Since {date}</span>}
        </div>
      </div>
      <div className="pw-body">
        <FileWorkspace projectId={project.id} projectName={project.name} />
      </div>
    </div>
  )
}

// ── No project selected hint ───────────────────────────────
function NoSelection() {
  return (
    <div className="pw-no-selection">
      <IconFolder size={40} />
      <p className="pw-ns-title">No project open</p>
      <p className="pw-ns-sub">Select a project from the panel on the left.</p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────
export default function UserDashboard() {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const [data, setData]       = useState(null)   // { customer, projects }
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    getMyProjects().then((res) => {
      setLoading(false)
      if (res.success) setData(res)
      else setError(res.message || 'Failed to load projects.')
    })
  }, [])

  // Derive selected project from URL
  const selection = useMemo(() => {
    if (!projectId || !data?.projects) return null
    const project = data.projects.find((p) => p.id === projectId)
    return project ? { project, customer: data.customer } : null
  }, [projectId, data])

  function openProject(id) {
    navigate(`/dashboard/project/${id}`)
  }

  return (
    <div className="admin-db-layout">
      {/* ── Left: project tree ── */}
      <aside className="db-tree-panel">
        <div className="db-tree-header">
          <span className="db-tree-heading">Projects</span>
          {!loading && data && (
            <span className="db-tree-count">{data.projects.length}</span>
          )}
        </div>

        {error && <p className="db-tree-error">{error}</p>}

        {loading ? (
          <div className="db-tree-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 34, borderRadius: 8 }} />
            ))}
          </div>
        ) : !data?.customer ? (
          <div className="db-tree-empty">
            <span style={{ fontSize: 22 }}>📂</span>
            <p>Not assigned yet.</p>
            <span>Contact your administrator.</span>
          </div>
        ) : (
          <>
            {/* Customer label */}
            <div className="db-customer-row open" style={{ cursor: 'default', pointerEvents: 'none' }}>
              <span className="db-row-icon"><IconBuilding /></span>
              <span className="db-customer-name">{data.customer.name}</span>
              <span className="db-proj-badge">{data.projects.length}</span>
            </div>

            {/* Project list */}
            <ul className="db-project-list" style={{ marginLeft: 16, marginTop: 2 }}>
              {data.projects.length === 0 ? (
                <li className="db-project-empty">No projects yet.</li>
              ) : (
                data.projects.map((project) => (
                  <li key={project.id}>
                    <button
                      className={`db-project-row${projectId === project.id ? ' active' : ''}`}
                      onClick={() => openProject(project.id)}
                    >
                      <span className="db-proj-dot" />
                      <span className="db-row-icon"><IconFolder /></span>
                      <span className="db-project-name">{project.name}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </aside>

      {/* ── Right: workspace ── */}
      <section className="db-view-area">
        {selection
          ? <ProjectWorkspace project={selection.project} customer={selection.customer} />
          : <NoSelection />
        }
      </section>
    </div>
  )
}
