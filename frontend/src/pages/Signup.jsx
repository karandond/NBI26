import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signup } from '../api/auth.js'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const result = await signup(email, password)
    setLoading(false)

    if (result.success) {
      setSuccess(result.message)
      setEmail('')
      setPassword('')
      setConfirm('')
    } else {
      setError(result.message || 'Signup failed. Please try again.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Create Account</h1>
        <p className="subtitle">Register to request access</p>

        {error && <div className="error-message">{error}</div>}

        {success ? (
          <div className="success-message">
            <p>{success}</p>
            <p style={{ marginTop: 12 }}>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14 }}>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
