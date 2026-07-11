import { Routes, Route } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Sidebar from '../components/Sidebar.jsx'

function DashboardHome() {
  return <h2>Dashboard</h2>
}

function Profile() {
  return <h2>Profile</h2>
}

function Settings() {
  return <h2>Settings</h2>
}

export default function Dashboard() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <Navbar />
        <main className="content">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
