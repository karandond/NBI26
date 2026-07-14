import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

const NAV = [
  { to: '/dashboard',          end: true,  Icon: IconGrid,     label: 'Dashboard' },
  { to: '/dashboard/profile',  end: false, Icon: IconUser,     label: 'Profile' },
  { to: '/dashboard/settings', end: false, Icon: IconSettings, label: 'Settings' },
]

const ADMIN_NAV = [
  { to: '/dashboard/users', end: false, Icon: IconUsers, label: 'User Management', adminBadge: true },
]

export default function Sidebar({ pendingCount = 0 }) {
  const { user } = useAuth()
  const avatar = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-brand-icon">N</div>
          <div>
            <div className="sidebar-brand-text">NBI 2026</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, end, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="nav-icon"><Icon /></span>
            <span>{label}</span>
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="nav-section-label">Admin</div>
            {ADMIN_NAV.map(({ to, end, Icon, label, adminBadge }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <span className="nav-icon"><Icon /></span>
                <span>{label}</span>
                {adminBadge && pendingCount > 0 && (
                  <span className="nav-badge">{pendingCount}</span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{avatar}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-email">{user?.email}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
