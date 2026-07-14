import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const storedUser  = localStorage.getItem('user')  || sessionStorage.getItem('user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  function loginUser(newToken, newUser, remember = true) {
    const store = remember ? localStorage : sessionStorage
    store.setItem('token', newToken)
    store.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  function logoutUser() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token),
    loginUser,
    logoutUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
