import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate, useLocation } from 'react-router-dom'

const TITLES = {
  '/dashboard':          'Dashboard',
  '/dashboard/profile':  'Profile',
  '/dashboard/settings': 'Settings',
  '/dashboard/users':    'User Management',
  '/dashboard/projects': 'My Projects',
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export default function Navbar({ pendingCount = 0 }) {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const title = TITLES[pathname] || 'Dashboard'
  const avatar = user?.email?.[0]?.toUpperCase() || '?'

  function handleLogout() {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        {user?.role === 'admin' && (
          <div
            className="topbar-notif"
            title={pendingCount > 0 ? `${pendingCount} pending approval` : 'No pending requests'}
            onClick={() => navigate('/dashboard/users')}
          >
            <IconBell />
            {pendingCount > 0 && (
              <span className="notif-badge">{pendingCount > 99 ? '99+' : pendingCount}</span>
            )}
          </div>
        )}
        <span className="topbar-email">{user?.email}</span>
        <div className="topbar-avatar">{avatar}</div>
        <button className="btn-logout" onClick={handleLogout}>Sign out</button>
      </div>
    </header>
  )
}
