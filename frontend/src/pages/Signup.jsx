import { useState } from 'react'
import { Link } from 'react-router-dom'
import { signup } from '../api/auth.js'

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#e2e8f0' }
  let score = 0
  if (pw.length >= 6)  score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: '',          color: '#e2e8f0' },
    { label: 'Weak',      color: '#ef4444' },
    { label: 'Fair',      color: '#f59e0b' },
    { label: 'Good',      color: '#3b82f6' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very strong', color: '#16a34a' },
  ]
  return { score, ...levels[score] }
}

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const strength = getStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (strength.score < 2)   { setError('Please choose a stronger password.'); return }
    setLoading(true)
    const result = await signup(email, password)
    setLoading(false)
    if (result.success) {
      setSuccess(result.message)
    } else {
      setError(result.message || 'Signup failed. Please try again.')
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Request submitted!</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            {success}
          </p>
          <div className="alert alert-info" style={{ textAlign: 'left' }}>
            <span>ℹ</span> You'll be able to log in once an admin approves your account.
          </div>
          <Link to="/login" className="btn-primary" style={{ display: 'block', marginTop: 16, textDecoration: 'none', textAlign: 'center' }}>
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">N</div>
        <h1>Create account</h1>
        <p className="subtitle">Request access to NBI 2026</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-wrap">
              <span className="input-icon">✉</span>
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
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoComplete="new-password"
              />
              <button type="button" className="input-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? '🙈' : '👁'}
              </button>
            </div>
            {password && (
              <>
                <div className="strength-bar">
                  <div
                    className="strength-fill"
                    style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }}
                  />
                </div>
                <div className="strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Request access →'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
