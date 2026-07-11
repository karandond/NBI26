import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logoutUser()
    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <div />
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="user-email">{user?.email}</span>
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}
