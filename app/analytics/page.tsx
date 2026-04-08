'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUsername } from '@/lib/useUsername'

export default function Analytics() {
  const router = useRouter()
  const username = useUsername()
  const [userId, setUserId] = useState('')
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const uid = localStorage.getItem('userId') || ''
    if (!isLoggedIn) { router.push('/'); return }
    setUserId(uid)

    if (uid) {
      const q = query(collection(db, 'submissions'), where('userId', '==', uid))
      const unsub = onSnapshot(q, (snap) => {
        const data: any[] = []
        snap.forEach(d => data.push({ id: d.id, ...d.data() }))
        setSubmissions(data)
      })
      return () => unsub()
    }
  }, [router])

  const handleLogout = () => { localStorage.clear(); router.push('/') }

  const approvedCount = submissions.filter(s => s.status === 'approved').length
  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const totalTracks = submissions.reduce((sum, s) => sum + (s.tracks || 0), 0)

  const genreBreakdown = submissions.reduce((acc: Record<string, number>, s) => {
    if (s.genre) acc[s.genre] = (acc[s.genre] || 0) + 1
    return acc
  }, {})

  const formatBreakdown = submissions.reduce((acc: Record<string, number>, s) => {
    if (s.format) acc[s.format] = (acc[s.format] || 0) + 1
    return acc
  }, {})

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
        <div className="nav-item active">
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="13" width="4" height="9" rx="1"/><rect x="9" y="8" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="19" rx="1"/></svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/royalties')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
          <span>Royalties</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/promotion')}>
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
            <h1>Analytics</h1>
            <p>Overview of your catalog performance</p>
          </div>
          <div className="user-info">
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="stats">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#818cf8"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
            </div>
            <h3>Total Releases</h3>
            <div className="value">{submissions.length}</div>
            <div className="trend"><span style={{ color: '#10b981' }}>↑</span> All time</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#10b981"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            </div>
            <h3>Live Releases</h3>
            <div className="value">{approvedCount}</div>
            <div className="trend"><span style={{ color: '#10b981' }}>↑</span> Approved</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/></svg>
            </div>
            <h3>Total Tracks</h3>
            <div className="value">{totalTracks}</div>
            <div className="trend"><span style={{ color: '#10b981' }}>↑</span> All formats</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
            </div>
            <h3>Pending Review</h3>
            <div className="value">{pendingCount}</div>
            <div className="trend" style={{ color: pendingCount > 0 ? '#f59e0b' : '#10b981' }}>
              {pendingCount > 0 ? '⏱ In review' : '✓ All clear'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          {/* Genre Breakdown */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)' }} />
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', letterSpacing: '-0.2px' }}>Genre Breakdown</h3>
            {Object.keys(genreBreakdown).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No releases yet</p>
            ) : (
              Object.entries(genreBreakdown).map(([genre, count]) => (
                <div key={genre} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{genre}</span>
                    <span style={{ fontSize: '12px', color: 'var(--primary-light)', fontWeight: 700 }}>{count} release{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: '5px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(count / submissions.length) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Format Breakdown */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '22px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '18px', letterSpacing: '-0.2px' }}>Format Breakdown</h3>
            {Object.keys(formatBreakdown).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No releases yet</p>
            ) : (
              Object.entries(formatBreakdown).map(([format, count]) => (
                <div key={format} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{format}</span>
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>{count} release{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="progress-bar-wrap" style={{ height: '5px' }}>
                    <div className="progress-bar-fill" style={{ width: `${(count / submissions.length) * 100}%`, background: 'linear-gradient(90deg, #10b981, #34d399)' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(236,72,153,0.3), transparent)' }} />
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.1))', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(99,102,241,0.2)', position: 'relative' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.4px' }}>Streaming Analytics Coming Soon</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 24px', lineHeight: '1.6' }}>
            Real-time streaming data, revenue reports, audience demographics, and playlist placements — all in one place.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Spotify Streams', 'Revenue Tracking', 'Audience Demographics', 'Playlist Placements', 'Territory Data'].map(f => (
              <span key={f} style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '20px', fontSize: '12px', color: 'var(--primary-light)', fontWeight: 600 }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
