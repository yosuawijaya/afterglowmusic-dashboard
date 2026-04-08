'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUsername } from '@/lib/useUsername'

export default function Promotion() {
  const router = useRouter()
  const username = useUsername()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userId = localStorage.getItem('userId')
    if (!isLoggedIn) { router.push('/'); return }

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

  const handleLogout = () => { localStorage.clear(); router.push('/') }

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
    approved: '#10b981', pending: '#f59e0b', rejected: '#ef4444'
  }[status] || '#6b7280')

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <button className="btn-new-release" onClick={() => router.push('/dashboard')}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          <span>New Release</span>
        </button>
        <div className="nav-section-label">Library</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
          <span>All Releases</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
          <span>Drafts</span>
        </div>
        <div className="nav-section-label">Insights</div>
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="13" width="4" height="9" rx="1"/><rect x="9" y="8" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="19" rx="1"/></svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/royalties')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
          <span>Royalties</span>
        </div>
        <div className="nav-item active">
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/></svg>
          <span>Promotion</span>
        </div>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>{username.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Artist</div>
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>Promotion</h1>
            <p>Generate pre-save links for your upcoming releases</p>
          </div>
          <div className="user-info">
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        <div className="info-banner">
          <div className="info-banner-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="#818cf8"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
          </div>
          <div className="info-banner-text">
            <strong>How Pre-Save Works:</strong> Share your pre-save link with fans before release day. When they click "Pre-Save", the release gets automatically added to their Spotify library on release date. Each link is unique to your release.
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/></svg>
            <h3>No Releases Yet</h3>
            <p>Submit a release first to generate your pre-save link</p>
            <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => router.push('/dashboard')}>Go to Releases</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {submissions.map((s) => {
              const presaveUrl = getPresaveUrl(s.id)
              const isCopied = copied === s.id
              const releaseDate = s.releaseDate ? new Date(s.releaseDate) : null
              const isUpcoming = releaseDate && releaseDate > new Date()

              return (
                <div key={s.id} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '18px 22px', display: 'flex', alignItems: 'center', gap: '18px', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ width: '54px', height: '54px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    {s.coverImage ? <img src={s.coverImage} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: getStatusColor(s.status), background: `${getStatusColor(s.status)}18`, border: `1px solid ${getStatusColor(s.status)}30`, padding: '2px 8px', borderRadius: '20px', textTransform: 'capitalize' }}>{s.status}</span>
                      {isUpcoming && <span style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', padding: '2px 8px', borderRadius: '20px' }}>Pre-Save Active</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      {s.artist} · {s.format} · {releaseDate ? releaseDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '7px', padding: '7px 12px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{presaveUrl}</div>
                      <button onClick={() => copyLink(s.id)} style={{ padding: '7px 14px', background: isCopied ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)', border: `1px solid ${isCopied ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`, borderRadius: '7px', color: isCopied ? '#10b981' : '#818cf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0, transition: 'all 0.2s' }}>
                        {isCopied ? '✓ Copied!' : 'Copy Link'}
                      </button>
                      <button onClick={() => window.open(presaveUrl, '_blank')} style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                        Preview ↗
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