import { useState, useEffect } from 'react'
import { getCustomers, createCustomer, deleteCustomer, addProject, removeProject } from '../api/customers.js'

function IconChevron({ open }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export default function AdminCustomers({ toast }) {
  const [customers, setCustomers]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  const [showNewForm, setShowNewForm]     = useState(false)
  const [newName, setNewName]             = useState('')
  const [creating, setCreating]           = useState(false)

  const [expanded, setExpanded]           = useState({})
  const [projectInputs, setProjectInputs] = useState({})
  const [addingProject, setAddingProject] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(null)
  const [deleting, setDeleting]           = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)

  async function fetchCustomers() {
    setLoading(true)
    const res = await getCustomers()
    setLoading(false)
    if (res.success) setCustomers(res.customers)
    else setError(res.message || 'Failed to load customers.')
  }

  useEffect(() => { fetchCustomers() }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    const res = await createCustomer(newName.trim())
    setCreating(false)
    if (res.success) {
      setCustomers((prev) => [{ id: res.id, name: res.name, projects: [] }, ...prev])
      setNewName('')
      setShowNewForm(false)
      toast?.(`Customer "${res.name}" created.`, 'success')
    } else {
      toast?.(res.message || 'Failed to create customer.', 'error')
    }
  }

  async function handleDeleteCustomer(id) {
    setDeleting(id)
    const res = await deleteCustomer(id)
    setDeleting(null)
    setConfirmDelete(null)
    if (res.success) {
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      toast?.('Customer deleted.', 'success')
    } else {
      toast?.(res.message || 'Failed to delete customer.', 'error')
    }
  }

  async function handleAddProject(customerId) {
    const name = (projectInputs[customerId] || '').trim()
    if (!name) return
    setAddingProject(customerId)
    const res = await addProject(customerId, name)
    setAddingProject(null)
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, projects: [...c.projects, { id: res.id, name: res.name }] }
            : c
        )
      )
      setProjectInputs((prev) => ({ ...prev, [customerId]: '' }))
      toast?.(`Project "${res.name}" added.`, 'success')
    } else {
      toast?.(res.message || 'Failed to add project.', 'error')
    }
  }

  async function handleDeleteProject(customerId, projectId, projectName) {
    setDeletingProject(projectId)
    const res = await removeProject(customerId, projectId)
    setDeletingProject(null)
    setConfirmDeleteProject(null)
    if (res.success) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customerId
            ? { ...c, projects: c.projects.filter((p) => p.id !== projectId) }
            : c
        )
      )
      toast?.(`Project "${projectName}" removed.`, 'success')
    } else {
      toast?.(res.message || 'Failed to delete project.', 'error')
    }
  }

  function toggleExpand(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2>Customers</h2>
          <p>Manage customers and their projects.</p>
        </div>
        <button className="btn-new-customer" onClick={() => { setShowNewForm((v) => !v); setNewName('') }}>
          <IconPlus /> New Customer
        </button>
      </div>

      {showNewForm && (
        <div className="new-customer-form">
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              className="input-inline"
              placeholder="Customer name (e.g. MSIL)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              required
            />
            <button type="submit" className="btn-confirm" disabled={creating || !newName.trim()}>
              {creating ? 'Creating…' : 'Create'}
            </button>
            <button type="button" className="btn-cancel" onClick={() => setShowNewForm(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      {loading ? (
        <div className="customers-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="customer-card">
              <div className="customer-card-header">
                <div className="skeleton" style={{ height: 20, width: 160 }} />
                <div className="skeleton" style={{ height: 20, width: 80 }} />
              </div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">🏢</div>
          <p>No customers yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="customer-list">
          {customers.map((customer) => (
            <div key={customer.id} className="customer-card">
              <div className="customer-card-header">
                <button
                  className="customer-expand-btn"
                  onClick={() => toggleExpand(customer.id)}
                  aria-expanded={!!expanded[customer.id]}
                >
                  <span className="customer-card-name">{customer.name}</span>
                  <span className="customer-project-count">
                    {customer.projects.length} {customer.projects.length === 1 ? 'project' : 'projects'}
                  </span>
                  <IconChevron open={!!expanded[customer.id]} />
                </button>

                <div className="customer-card-actions">
                  {confirmDelete === customer.id ? (
                    <span className="confirm-inline">
                      Delete all projects too?&nbsp;
                      <button
                        className="btn-confirm-danger"
                        disabled={deleting === customer.id}
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        {deleting === customer.id ? '…' : 'Yes, delete'}
                      </button>
                      <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
                    </span>
                  ) : (
                    <button
                      className="btn-icon-delete"
                      title="Delete customer"
                      onClick={() => setConfirmDelete(customer.id)}
                    >
                      <IconTrash />
                    </button>
                  )}
                </div>
              </div>

              {expanded[customer.id] && (
                <div className="customer-body">
                  {customer.projects.length === 0 ? (
                    <p className="no-projects-hint">No projects yet. Add one below.</p>
                  ) : (
                    <ul className="project-list">
                      {customer.projects.map((project) => (
                        <li key={project.id} className="project-item">
                          <span className="project-item-dot" />
                          <span className="project-item-name">{project.name}</span>
                          {confirmDeleteProject === project.id ? (
                            <span className="confirm-inline">
                              <button
                                className="btn-confirm-danger btn-sm"
                                disabled={deletingProject === project.id}
                                onClick={() => handleDeleteProject(customer.id, project.id, project.name)}
                              >
                                {deletingProject === project.id ? '…' : 'Remove'}
                              </button>
                              <button className="btn-cancel btn-sm" onClick={() => setConfirmDeleteProject(null)}>
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              className="btn-icon-delete btn-sm"
                              title="Remove project"
                              onClick={() => setConfirmDeleteProject(project.id)}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    className="add-project-form"
                    onSubmit={(e) => { e.preventDefault(); handleAddProject(customer.id) }}
                  >
                    <input
                      className="input-inline"
                      placeholder="New project name (e.g. MTB)"
                      value={projectInputs[customer.id] || ''}
                      onChange={(e) =>
                        setProjectInputs((prev) => ({ ...prev, [customer.id]: e.target.value }))
                      }
                    />
                    <button
                      type="submit"
                      className="btn-confirm"
                      disabled={addingProject === customer.id || !(projectInputs[customer.id] || '').trim()}
                    >
                      {addingProject === customer.id ? '…' : '+ Add Project'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
