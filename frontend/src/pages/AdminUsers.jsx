import { useState, useEffect } from 'react'
import { getUsers, updateUserStatus } from '../api/auth.js'

const STATUS_LABELS = {
  pending: { label: 'Pending', color: '#b45309' },
  approved: { label: 'Approved', color: '#15803d' },
  rejected: { label: 'Rejected', color: '#b91c1c' },
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  async function fetchUsers() {
    setLoading(true)
    const result = await getUsers()
    setLoading(false)
    if (result.success) {
      setUsers(result.users)
    } else {
      setError(result.message || 'Failed to load users.')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleStatus(id, status) {
    setActionLoading(id + status)
    const result = await updateUserStatus(id, status)
    setActionLoading(null)
    if (result.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status } : u))
      )
    } else {
      alert(result.message || 'Action failed.')
    }
  }

  const pending = users.filter((u) => u.status === 'pending')
  const others = users.filter((u) => u.status !== 'pending')

  return (
    <div style={{ padding: '0 4px' }}>
      <h2 style={{ marginBottom: 20 }}>User Management</h2>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <h3 style={{ marginBottom: 12, color: '#b45309' }}>
                Pending Approval ({pending.length})
              </h3>
              <div className="user-table-wrap">
                <UserTable
                  users={pending}
                  actionLoading={actionLoading}
                  onAction={handleStatus}
                />
              </div>
              <div style={{ marginBottom: 28 }} />
            </>
          )}

          <h3 style={{ marginBottom: 12 }}>All Users</h3>
          {others.length === 0 && pending.length === 0 ? (
            <p style={{ color: '#666' }}>No users found.</p>
          ) : others.length === 0 ? (
            <p style={{ color: '#666' }}>No approved or rejected users yet.</p>
          ) : (
            <div className="user-table-wrap">
              <UserTable
                users={others}
                actionLoading={actionLoading}
                onAction={handleStatus}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UserTable({ users, actionLoading, onAction }) {
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Status</th>
          <th>Registered</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => {
          const statusStyle = STATUS_LABELS[user.status] || STATUS_LABELS.pending
          return (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>
                <span style={{
                  color: statusStyle.color,
                  fontWeight: 600,
                  fontSize: 13,
                }}>
                  {statusStyle.label}
                </span>
              </td>
              <td style={{ fontSize: 13, color: '#555' }}>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : '—'}
              </td>
              <td>
                {user.status !== 'approved' && (
                  <button
                    className="btn-approve"
                    disabled={!!actionLoading}
                    onClick={() => onAction(user.id, 'approved')}
                  >
                    {actionLoading === user.id + 'approved' ? '...' : 'Approve'}
                  </button>
                )}
                {user.status !== 'rejected' && (
                  <button
                    className="btn-reject"
                    disabled={!!actionLoading}
                    onClick={() => onAction(user.id, 'rejected')}
                  >
                    {actionLoading === user.id + 'rejected' ? '...' : 'Reject'}
                  </button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
