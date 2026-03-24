'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Analytics() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    
    if (!isLoggedIn) {
      router.push('/')
    } else {
      setUsername(storedUsername || 'User')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    router.push('/')
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <button className="btn-new-release" onClick={() => router.push('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          One release
        </button>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          All Releases
        </div>
        <div className="nav-item">
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          Drafts
        </div>
        <div className="nav-item active">
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Analytics
        </div>
        <div className="nav-item">
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
          </svg>
          Promotion
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Analytics</h1>
          <div className="user-info">
            <span>Client: {username}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="coming-soon-container">
          <div className="coming-soon-content">
            <svg width="120" height="120" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#3182ce', marginBottom: '30px' }}>
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
            </svg>
            <h2>Analytics Coming Soon</h2>
            <p>We're working on bringing you comprehensive analytics from all major streaming platforms.</p>
            <div className="features-list">
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#48bb78' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Real-time streaming data</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#48bb78' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Revenue tracking</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#48bb78' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Multi-platform insights</span>
              </div>
              <div className="feature-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#48bb78' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>Audience demographics</span>
              </div>
            </div>
            <p style={{ marginTop: '30px', color: '#718096' }}>
              Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
