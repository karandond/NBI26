import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import AdminRoute from '../routes/AdminRoute.jsx'
import AdminUsers from './AdminUsers.jsx'
import { getUsers } from '../api/auth.js'
import { useAuth } from '../context/AuthContext.jsx'

// ── Toast ─────────────────────────────────────────────────
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-dot" data-type={t.type} />
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])
  return { toasts, push }
}

// ── Stat cards ────────────────────────────────────────────
const STATS_CONFIG = [
  { key: 'total',    label: 'Total Users',      accent: '#6366f1' },
  { key: 'pending',  label: 'Pending Approval', accent: '#f59e0b' },
  { key: 'approved', label: 'Approved',         accent: '#22c55e' },
  { key: 'rejected', label: 'Rejected',         accent: '#ef4444' },
]

function DashboardHome({ stats }) {
  return (
    <div>
      <div className="page-header">
        <h2>Overview</h2>
        <p>Welcome back. Here's what's happening.</p>
      </div>
      <div className="stat-grid">
        {STATS_CONFIG.map(({ key, label, accent }) => (
          <div className="stat-card" key={key} style={{ borderTop: `3px solid ${accent}` }}>
            <div className="stat-value" style={{ color: accent }}>{stats[key]}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Profile() {
  return (
    <div className="page-header">
      <h2>Profile</h2>
      <p>Manage your account details.</p>
    </div>
  )
}

function Settings() {
  return (
    <div className="page-header">
      <h2>Settings</h2>
      <p>Configure your preferences.</p>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { toasts, push } = useToast()
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [pendingCount, setPendingCount] = useState(0)

  function loadStats() {
    if (user?.role !== 'admin') return
    getUsers().then((res) => {
      if (!res.success) return
      const users = res.users
      const pending = users.filter((u) => u.status === 'pending').length
      setStats({
        total:    users.length,
        pending,
        approved: users.filter((u) => u.status === 'approved').length,
        rejected: users.filter((u) => u.status === 'rejected').length,
      })
      setPendingCount(pending)
    })
  }

  useEffect(() => { loadStats() }, [user])

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-area">
        <Navbar pendingCount={pendingCount} />
        <main className="page-content">
          <Routes>
            <Route index element={<DashboardHome stats={stats} />} />
            <Route path="profile"  element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <AdminUsers toast={push} onStatusChange={loadStats} />
                </AdminRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  )
}
