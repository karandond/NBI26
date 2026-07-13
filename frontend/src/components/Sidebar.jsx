import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="sidebar">
      <div className="brand">NBI 2026</div>
      <nav>
        <NavLink to="/dashboard" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          Profile
        </NavLink>
        <NavLink to="/dashboard/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
          Settings
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/dashboard/users" className={({ isActive }) => (isActive ? 'active' : '')}>
            User Management
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
