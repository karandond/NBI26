import { useState, useEffect } from 'react'
import { getUsers, updateUserStatus } from '../api/auth.js'
import { getCustomers, assignCustomer } from '../api/customers.js'

function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'badge-pending',  label: 'Pending' },
    approved: { cls: 'badge-approved', label: 'Approved' },
    rejected: { cls: 'badge-rejected', label: 'Rejected' },
  }
  const { cls, label } = map[status] || map.pending
  return (
    <span className={`badge ${cls}`}>
      <span className="badge-dot" />
      {label}
    </span>
  )
}

function SkeletonRows() {
  return Array.from({ length: 3 }).map((_, i) => (
    <tr key={i} className="skeleton-row">
      <td><div className="skeleton" style={{ height: 32, width: '80%' }} /></td>
      <td><div className="skeleton" style={{ height: 22, width: 70 }} /></td>
      <td><div className="skeleton" style={{ height: 18, width: 80 }} /></td>
      <td><div className="skeleton" style={{ height: 28, width: 110 }} /></td>
      <td><div className="skeleton" style={{ height: 28, width: 120 }} /></td>
    </tr>
  ))
}

export default function AdminUsers({ toast, onStatusChange }) {
  const [users, setUsers]                   = useState([])
  const [customers, setCustomers]           = useState([])
  const [loading, setLoading]               = useState(true)
  const [actionLoading, setActionLoading]   = useState(null)
  const [assigningUser, setAssigningUser]   = useState(null)
  const [error, setError]                   = useState('')

  async function fetchAll() {
    setLoading(true)
    const [usersRes, custRes] = await Promise.all([getUsers(), getCustomers()])
    setLoading(false)
    if (usersRes.success) setUsers(usersRes.users)
    else setError(usersRes.message || 'Failed to load users.')
    if (custRes.success) setCustomers(custRes.customers)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleStatus(id, email, status) {
    setActionLoading(id + status)
    const res = await updateUserStatus(id, status)
    setActionLoading(null)
    if (res.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
      toast?.(`${email} has been ${status}.`, 'success')
      onStatusChange?.()
    } else {
      toast?.(res.message || 'Action failed.', 'error')
    }
  }

  async function handleAssignCustomer(userId, customerId) {
    setAssigningUser(userId)
    const res = await assignCustomer(userId, customerId || null)
    setAssigningUser(null)
    if (res.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, customerId: customerId || null } : u))
      )
      const customerName = customers.find((c) => c.id === customerId)?.name
      toast?.(customerName ? `Assigned to ${customerName}.` : 'Customer removed.', 'success')
    } else {
      toast?.(res.message || 'Failed to assign customer.', 'error')
    }
  }

  const pending = users.filter((u) => u.status === 'pending')
  const rest    = users.filter((u) => u.status !== 'pending')

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <p>Review, approve or reject registration requests and assign customers.</p>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

      {/* Pending table */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">⏳ Pending Approval</span>
          <span className="table-card-count">{loading ? '…' : pending.length}</span>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Customer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">🎉</div>
                      <p>No pending requests</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pending.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    customers={customers}
                    actionLoading={actionLoading}
                    assigningUser={assigningUser}
                    onAction={handleStatus}
                    onAssign={handleAssignCustomer}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All users table */}
      <div className="table-card">
        <div className="table-card-header">
          <span className="table-card-title">👥 All Users</span>
          <span className="table-card-count">{loading ? '…' : rest.length}</span>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Customer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : rest.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <p>No users yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rest.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    customers={customers}
                    actionLoading={actionLoading}
                    assigningUser={assigningUser}
                    onAction={handleStatus}
                    onAssign={handleAssignCustomer}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, customers, actionLoading, assigningUser, onAction, onAssign }) {
  const avatar = user.email[0].toUpperCase()
  const date = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <tr>
      <td>
        <div className="user-cell">
          <div className="user-avatar">{avatar}</div>
          <span className="user-email-text">{user.email}</span>
        </div>
      </td>
      <td><StatusBadge status={user.status} /></td>
      <td style={{ color: '#64748b', fontSize: 13 }}>{date}</td>
      <td>
        <select
          className="customer-select"
          value={user.customerId || ''}
          disabled={assigningUser === user.id}
          onChange={(e) => onAssign(user.id, e.target.value)}
        >
          <option value="">— None —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td>
        <div className="action-buttons">
          {user.status !== 'approved' && (
            <button
              className="btn-approve"
              disabled={!!actionLoading}
              onClick={() => onAction(user.id, user.email, 'approved')}
            >
              {actionLoading === user.id + 'approved' ? '…' : '✓ Approve'}
            </button>
          )}
          {user.status !== 'rejected' && (
            <button
              className="btn-reject"
              disabled={!!actionLoading}
              onClick={() => onAction(user.id, user.email, 'rejected')}
            >
              {actionLoading === user.id + 'rejected' ? '…' : '✕ Reject'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
