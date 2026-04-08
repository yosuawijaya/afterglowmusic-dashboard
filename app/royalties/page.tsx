'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useUsername } from '@/lib/useUsername'

const NAV_ICON_ROYALTY = (
  <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
  </svg>
)

export default function RoyaltiesPage() {
  const router = useRouter()
  const username = useUsername()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [royalties, setRoyalties] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const uid = localStorage.getItem('userId') || ''
    if (!isLoggedIn) { router.push('/'); return }
    if (!uid) return

    const unsubSub = onSnapshot(query(collection(db, 'submissions'), where('userId', '==', uid)), snap => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsubRoy = onSnapshot(
      query(collection(db, 'royalties'), where('userId', '==', uid), orderBy('uploadedAt', 'desc')),
      snap => setRoyalties(snap.docs.map(d => ({ id: d.id, ...d.data(), uploadedAt: d.data().uploadedAt?.toDate?.() || new Date() })))
    )
    return () => { unsubSub(); unsubRoy() }
  }, [router])

  const handleLogout = () => { localStorage.clear(); router.push('/') }

  const approvedReleases = submissions.filter(s => s.status === 'approved' || s.status === 'live')
  const periods = ['all', ...Array.from(new Set(royalties.map(r => r.period))).sort().reverse()]
  const filtered = selectedPeriod === 'all' ? royalties : royalties.filter(r => r.period === selectedPeriod)
  const totalRevenue = filtered.reduce((s, r) => s + (r.totalRevenue || 0), 0)
  const totalStreams = filtered.reduce((s, r) => s + (r.totalStreams || 0), 0)
  const hasData = royalties.length > 0

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <button className="btn-new-release" onClick={() => router.push('/new-release')}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          <span>New Release</span>
        </button>
        <div className="nav-section-label">Library</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
          <span>All Releases</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>
          <span>Drafts</span>
        </div>
        <div className="nav-section-label">Insights</div>
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="13" width="4" height="9" rx="1"/><rect x="9" y="8" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="19" rx="1"/></svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item active">{NAV_ICON_ROYALTY}<span>Royalties</span></div>
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
            <h1>Royalties & Revenue</h1>
            <p>Track your earnings across all platforms</p>
          </div>
          <div className="user-info">
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {/* Period filter */}
        {hasData && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {periods.map(p => (
              <button key={p} onClick={() => setSelectedPeriod(p)}
                style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', transition: 'all 0.2s',
                  background: selectedPeriod === p ? 'rgba(16,185,129,0.12)' : 'transparent',
                  color: selectedPeriod === p ? '#10b981' : 'rgba(255,255,255,0.4)',
                  borderColor: selectedPeriod === p ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)',
                }}>
                {p === 'all' ? 'All Periods' : p}
              </button>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="stats" style={{ marginBottom: '24px' }}>
          {[
            { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, sub: hasData ? `${filtered.length} period${filtered.length !== 1 ? 's' : ''}` : 'Pending first payout', color: '#10b981', bg: 'rgba(16,185,129,0.18)', tag: 'EARNINGS', tagColor: '#10b981', tagBg: 'rgba(16,185,129,0.12)', tagBorder: 'rgba(16,185,129,0.2)', gradient: 'rgba(16,185,129,0.1)' },
            { label: 'Total Streams', value: totalStreams.toLocaleString(), sub: hasData ? 'Across all platforms' : 'Pending data', color: '#818cf8', bg: 'rgba(99,102,241,0.15)', tag: 'STREAMS', tagColor: '#818cf8', tagBg: 'rgba(99,102,241,0.12)', tagBorder: 'rgba(99,102,241,0.2)', gradient: 'rgba(99,102,241,0.08)' },
            { label: 'Live Releases', value: String(approvedReleases.length), sub: 'Generating royalties', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', tag: 'LIVE', tagColor: '#f59e0b', tagBg: 'rgba(245,158,11,0.1)', tagBorder: 'rgba(245,158,11,0.2)', gradient: 'rgba(245,158,11,0.06)' },
            { label: 'Your Share (85%)', value: hasData ? `$${(totalRevenue * 0.85).toFixed(2)}` : '—', sub: 'After label commission', color: '#f472b6', bg: 'rgba(236,72,153,0.12)', tag: 'PAYOUT', tagColor: '#f472b6', tagBg: 'rgba(236,72,153,0.1)', tagBorder: 'rgba(236,72,153,0.2)', gradient: 'rgba(236,72,153,0.06)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: `linear-gradient(135deg, ${s.gradient} 0%, rgba(10,10,21,1) 60%)` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div className="stat-card-icon" style={{ background: s.bg, width: '40px', height: '40px', borderRadius: '11px' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill={s.color}><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: s.tagColor, background: s.tagBg, padding: '3px 8px', borderRadius: '20px', border: `1px solid ${s.tagBorder}` }}>{s.tag}</span>
              </div>
              <div className="value" style={{ fontSize: '36px' }}>{s.value}</div>
              <h3 style={{ marginBottom: '4px' }}>{s.label}</h3>
              <div className="trend">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Royalty statements or coming soon */}
        {hasData ? (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Royalty Statements</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{filtered.length} report{filtered.length !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => {
                    const rows = [['Period', 'Revenue ($)', 'Your Share (85%)', 'Streams', 'Uploaded']]
                    filtered.forEach(r => rows.push([
                      r.period, (r.totalRevenue || 0).toFixed(2),
                      ((r.totalRevenue || 0) * 0.85).toFixed(2),
                      String(r.totalStreams || 0),
                      new Date(r.uploadedAt).toLocaleDateString('en-GB')
                    ]))
                    const csv = rows.map(r => r.join(',')).join('\n')
                    const a = document.createElement('a')
                    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
                    a.download = `royalties-${selectedPeriod}-${new Date().toISOString().slice(0,10)}.csv`
                    a.click()
                  }}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '7px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                  Export CSV
                </button>
              </div>
            </div>
            {filtered.map((r, i) => (
              <div key={r.id} style={{ padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', display: 'flex', alignItems: 'center', gap: '16px', transition: 'background 0.15s', cursor: 'default' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(16,185,129,0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>Period: {r.period}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {r.rows?.length || 0} entries · {r.uploadedAt instanceof Date ? r.uploadedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '20px', fontWeight: 900, color: '#10b981', letterSpacing: '-0.5px' }}>${(r.totalRevenue || 0).toFixed(2)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{(r.totalStreams || 0).toLocaleString()} streams</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '48px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), transparent)' }} />
            <div style={{ width: '52px', height: '52px', background: 'rgba(16,185,129,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid rgba(16,185,129,0.2)' }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="#10b981"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.4px' }}>No Royalty Data Yet</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px', lineHeight: '1.6' }}>
              Your label will upload royalty reports here. Once uploaded, you'll see your earnings, streams, and payout breakdown.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Per-Platform Revenue', 'Monthly Statements', 'Payout History', 'ISRC Tracking'].map(f => (
                <span key={f} style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '20px', fontSize: '12px', color: '#10b981', fontWeight: 600 }}>{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
