'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function Promotion() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [submissions, setSubmissions] = useState<any[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    const userId = localStorage.getItem('userId')
    if (!isLoggedIn) { router.push('/'); return }
    setUsername(storedUsername || 'User')

    if (userId) {
      const q = query(collection(db, 'submissions'), where('userId', '==', userId))
      const unsub = onSnapshot(q, (snap) => {
        const data: any[] = []
        snap.forEach(d => data.push({ id: d.id, ...d.data() }))
        data.sort((a, b) => {
          const da = a.submittedAt?.toDate?.() || new Date(0)
          const db2 = b.submittedAt?.toDate?.() || new Date(0)
          return db2.getTime() - da.getTime()
        })
        setSubmissions(data)
      })
      return () => unsub()
    }
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const getPresaveUrl = (id: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return `${base}/presave/${id}`
  }

  const copyLink = (id: string) => {
    navigator.clipboard.writeText(getPresaveUrl(id))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const getStatusColor = (status: string) => ({
    approved: '#34d399', pending: '#fbbf24', rejected: '#f87171'
  }[status] || '#6b7280')

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
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="13" width="4" height="9" rx="1"/>
            <rect x="9" y="8" width="4" height="14" rx="1"/>
            <rect x="16" y="3" width="4" height="19" rx="1"/>
          </svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item active">
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
            <h1>Promotion</h1>
            <p>Generate pre-save links for your releases</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">{username.charAt(0).toUpperCase()}</div>
            <span>{username}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {/* Info banner */}
        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#818cf8" style={{ flexShrink: 0, marginTop: '1px' }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '3px' }}>How Pre-Save Works</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' }}>
              Share your pre-save link with fans before release day. When they click "Pre-Save", the release gets automatically added to their Spotify library on release date. Each link is unique to your release.
            </p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
            </svg>
            <h3>No Releases Yet</h3>
            <p>Submit a release first to generate your pre-save link</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.map((s) => {
              const presaveUrl = getPresaveUrl(s.id)
              const isCopied = copied === s.id
              const releaseDate = s.releaseDate ? new Date(s.releaseDate) : null
              const isUpcoming = releaseDate && releaseDate > new Date()

              return (
                <div key={s.id} style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                  {/* Cover */}
                  <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    {s.coverImage
                      ? <img src={s.coverImage} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : '🎵'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: getStatusColor(s.status), background: `${getStatusColor(s.status)}15`, border: `1px solid ${getStatusColor(s.status)}30`, padding: '2px 8px', borderRadius: '20px', flexShrink: 0, textTransform: 'capitalize' }}>{s.status}</span>
                      {isUpcoming && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: '20px', flexShrink: 0 }}>Pre-Save Active</span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                      {s.artist} · {s.format} · {releaseDate ? releaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </div>
                    {/* Link row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {presaveUrl}
                      </div>
                      <button onClick={() => copyLink(s.id)}
                        style={{ padding: '7px 14px', background: isCopied ? 'rgba(52,211,153,0.15)' : 'rgba(99,102,241,0.15)', border: `1px solid ${isCopied ? 'rgba(52,211,153,0.3)' : 'rgba(99,102,241,0.3)'}`, borderRadius: '7px', color: isCopied ? '#34d399' : '#818cf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, transition: 'all 0.2s' }}>
                        {isCopied ? (
                          <><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Copied!</>
                        ) : (
                          <><svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>Copy Link</>
                        )}
                      </button>
                      <button onClick={() => window.open(presaveUrl, '_blank')}
                        style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, transition: 'all 0.2s' }}>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
