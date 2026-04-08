'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      if (!userDoc.exists()) throw new Error('User data not found')
      const userData = userDoc.data()

      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userEmail', user.email || '')
      localStorage.setItem('username', userData.username || 'User')
      localStorage.setItem('userRole', userData.role || 'user')
      localStorage.setItem('userId', user.uid)

      if (userData.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    } catch (err: any) {
      const code = err.code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setError('Invalid email or password')
      else if (code === 'auth/user-not-found') setError('No account found with this email')
      else if (code === 'auth/too-many-requests') setError('Too many attempts. Please try again later')
      else setError('Login failed. Please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">
          <img src="/logos/logo-afterglowmusic.png" alt="Afterglow Music" style={{ height: '80px', objectFit: 'contain', marginBottom: '8px' }} />
          <div className="login-logo-sub">Artist & Label Portal</div>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px',
              padding: '11px 14px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#f87171',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          Contact your label administrator for access
        </p>
        <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>
          <a href="/legal" style={{ color: 'rgba(165,180,252,0.4)', textDecoration: 'none' }}>Terms of Service</a>
          {' · '}
          <a href="/legal#privacy" style={{ color: 'rgba(165,180,252,0.4)', textDecoration: 'none' }}>Privacy Policy</a>
        </p>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
