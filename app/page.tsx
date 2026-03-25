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
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      
      if (!userDoc.exists()) {
        throw new Error('User data not found')
      }

      const userData = userDoc.data()

      // Save to localStorage for quick access
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('userEmail', user.email || '')
      localStorage.setItem('username', userData.username || 'User')
      localStorage.setItem('userRole', userData.role || 'user')
      localStorage.setItem('userId', user.uid)

      // Redirect based on role
      if (userData.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      let errorMessage = 'Login failed'
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password'
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'User not found'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Wrong password'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later'
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-logo">Afterglow Music</div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
