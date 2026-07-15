import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'
import AdminRoute from '../routes/AdminRoute.jsx'
import AdminUsers from './AdminUsers.jsx'
import AdminCustomers from './AdminCustomers.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import UserDashboard from './UserDashboard.jsx'
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

function Profile() {
  return (
    <div className="page-header">
      <h2>Profile</h2>
      <p>Manage your account details.</p>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth()
  const { toasts, push } = useToast()
  const [pendingCount, setPendingCount] = useState(0)
  const intervalRef = useRef(null)
  const isAdmin = user?.role === 'admin'

  async function loadPending() {
    if (!isAdmin) return
    const res = await getUsers()
    if (res.success) {
      setPendingCount(res.users.filter((u) => u.status === 'pending').length)
    }
  }

  useEffect(() => {
    loadPending()
    if (isAdmin) {
      intervalRef.current = setInterval(loadPending, 30_000)
    }
    return () => clearInterval(intervalRef.current)
  }, [user])

  return (
    <div className="app-layout">
      <Sidebar pendingCount={pendingCount} />
      <div className="main-area">
        <Navbar pendingCount={pendingCount} />
        <main className="page-content">
          <Routes>
            {/* Home */}
            <Route
              index
              element={isAdmin ? <AdminDashboard /> : <UserDashboard />}
            />

            {/* Project workspace — shared route, component differs by role */}
            <Route
              path="project/:projectId"
              element={isAdmin ? <AdminDashboard /> : <UserDashboard />}
            />

            <Route path="profile" element={<Profile />} />

            {/* Settings: customer management for admin, generic for users */}
            <Route
              path="settings"
              element={
                isAdmin
                  ? <AdminCustomers toast={push} />
                  : <div className="page-header"><h2>Settings</h2><p>Configure your preferences.</p></div>
              }
            />

            {/* Admin only */}
            <Route
              path="users"
              element={
                <AdminRoute>
                  <AdminUsers toast={push} onStatusChange={loadPending} />
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
