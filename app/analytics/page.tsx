'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Analytics() {
  const router = useRouter()
  const [username, setUsername] = useState('')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    if (!isLoggedIn) { router.push('/'); return }
    setUsername(storedUsername || 'User')
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const BarChartIcon = ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="2" y="13" width="4" height="9" rx="1"/>
      <rect x="9" y="8" width="4" height="14" rx="1"/>
      <rect x="16" y="3" width="4" height="19" rx="1"/>
    </svg>
  )

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>

        <button className="btn-new-release" onClick={() => router.push('/dashboard')}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          <span>New Release</span>
        </button>

        <div className="nav-section-label">Library</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          <span>All Releases</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          <span>Drafts</span>
        </div>

        <div className="nav-section-label">Insights</div>
        <div className="nav-item active">
          <BarChartIcon size={16} color="currentColor" />
          <span>Analytics</span>
        </div>
        <div className="nav-item">
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
          </svg>
          <span>Promotion</span>
        </div>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={handleLogout} style={{ color: 'rgba(248,113,113,0.7)' }}>
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>Analytics</h1>
            <p>Track your music performance across platforms</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
            <span>{username}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Coming Soon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: '480px' }}>
            {/* Big icon */}
            <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: '6px', marginBottom: '32px', height: '80px' }}>
              {[40, 60, 80, 55, 70].map((h, i) => (
                <div key={i} style={{
                  width: '14px',
                  height: `${h}px`,
                  borderRadius: '4px 4px 2px 2px',
                  background: `rgba(99,102,241,${0.3 + i * 0.14})`,
                  animation: `barPulse 1.8s ease-in-out ${i * 0.15}s infinite alternate`
                }} />
              ))}
            </div>

            <style>{`
              @keyframes barPulse {
                from { opacity: 0.4; transform: scaleY(0.85); }
                to   { opacity: 1;   transform: scaleY(1); }
              }
            `}</style>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Analytics Coming Soon
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', marginBottom: '32px' }}>
              We're building comprehensive analytics from all major streaming platforms — all in one place.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', maxWidth: '280px', margin: '0 auto 32px' }}>
              {[
                'Real-time streaming data',
                'Revenue tracking',
                'Multi-platform insights',
                'Audience demographics',
                'Playlist placement tracking',
              ].map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 20 20" fill="#34d399">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  {feat}
                </div>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', padding: '10px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', display: 'inline-block' }}>
              Stay tuned for updates
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
