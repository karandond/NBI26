import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCustomers } from '../api/customers.js'
import FileWorkspace from '../components/FileWorkspace.jsx'

// ── Icons ─────────────────────────────────────────────────
function IconChevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.15s', flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6" />
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

function IconFolder({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
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

// ── Empty state ────────────────────────────────────────────
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
export default function AdminDashboard() {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [expanded, setExpanded]   = useState({})

  // Load customers; if URL has a projectId, auto-expand its parent customer
  useEffect(() => {
    getCustomers().then((res) => {
      setLoading(false)
      if (!res.success) { setError(res.message || 'Failed to load.'); return }
      setCustomers(res.customers)
      if (projectId) {
        for (const c of res.customers) {
          if (c.projects.some((p) => p.id === projectId)) {
            setExpanded((prev) => ({ ...prev, [c.id]: true }))
            break
          }
        }
      } else if (res.customers.length === 1) {
        setExpanded({ [res.customers[0].id]: true })
      }
    })
  }, [])

  // Derive selected project from URL + loaded data
  const selection = useMemo(() => {
    if (!projectId || !customers.length) return null
    for (const customer of customers) {
      const project = customer.projects.find((p) => p.id === projectId)
      if (project) return { project, customer }
    }
    return null
  }, [projectId, customers])

  function toggleCustomer(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function openProject(projectId) {
    navigate(`/dashboard/project/${projectId}`)
  }

  return (
    <div className="admin-db-layout">
      {/* ── Left: customer / project tree ── */}
      <aside className="db-tree-panel">
        <div className="db-tree-header">
          <span className="db-tree-heading">Customers</span>
          {!loading && <span className="db-tree-count">{customers.length}</span>}
        </div>

        {error && <p className="db-tree-error">{error}</p>}

        {loading ? (
          <div className="db-tree-skeleton">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 34, borderRadius: 8 }} />)}
          </div>
        ) : customers.length === 0 ? (
          <div className="db-tree-empty">
            <span style={{ fontSize: 22 }}>🏢</span>
            <p>No customers yet.</p>
            <span>Go to Settings to add one.</span>
          </div>
        ) : (
          <ul className="db-customer-list">
            {customers.map((customer) => {
              const isOpen = !!expanded[customer.id]
              return (
                <li key={customer.id} className="db-customer-entry">
                  {/* Customer row */}
                  <button
                    className={`db-customer-row${isOpen ? ' open' : ''}`}
                    onClick={() => toggleCustomer(customer.id)}
                  >
                    <IconChevron open={isOpen} />
                    <span className="db-row-icon"><IconBuilding /></span>
                    <span className="db-customer-name">{customer.name}</span>
                    <span className="db-proj-badge">{customer.projects.length}</span>
                  </button>

                  {/* Projects sub-list */}
                  {isOpen && (
                    <ul className="db-project-list">
                      {customer.projects.length === 0 ? (
                        <li className="db-project-empty">No projects</li>
                      ) : (
                        customer.projects.map((project) => (
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
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* ── Right: project workspace ── */}
      <section className="db-view-area">
        {selection
          ? <ProjectWorkspace project={selection.project} customer={selection.customer} />
          : <NoSelection />
        }
      </section>
    </div>
  )
}
