'use client'

import { useRouter, usePathname } from 'next/navigation'
import AvatarUpload from './AvatarUpload'

interface SidebarProps {
  username: string
  userId: string
  photoURL: string
  onPhotoUpdate?: (url: string) => void
  releaseCount?: number
  onNewRelease?: () => void
}

export default function Sidebar({ username, userId, photoURL, onPhotoUpdate, releaseCount = 0, onNewRelease }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const nav = (path: string) => router.push(path)
  const isActive = (path: string) => pathname === path

  return (
    <div className="sidebar">
      <div className="logo">Afterglow Music</div>

      <button className="btn-new-release" onClick={onNewRelease || (() => nav('/dashboard'))}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
        </svg>
        <span>New Release</span>
      </button>

      <div className="nav-section-label">Library</div>
      <div className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => nav('/dashboard')}>
        <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
        </svg>
        <span>All Releases</span>
        {releaseCount > 0 && <span className="nav-badge">{releaseCount}</span>}
      </div>
      <div className={`nav-item ${isActive('/drafts') ? 'active' : ''}`} onClick={() => nav('/drafts')}>
        <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
        </svg>
        <span>Drafts</span>
      </div>

      <div className="nav-section-label">Insights</div>
      <div className={`nav-item ${isActive('/analytics') ? 'active' : ''}`} onClick={() => nav('/analytics')}>
        <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="13" width="4" height="9" rx="1"/>
          <rect x="9" y="8" width="4" height="14" rx="1"/>
          <rect x="16" y="3" width="4" height="19" rx="1"/>
        </svg>
        <span>Analytics</span>
      </div>
      <div className={`nav-item ${isActive('/promotion') ? 'active' : ''}`} onClick={() => nav('/promotion')}>
        <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
        </svg>
        <span>Promotion</span>
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', marginBottom: '8px' }}>
          <AvatarUpload userId={userId} username={username} photoURL={photoURL} size={32} onUpdate={onPhotoUpdate || (() => {})} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Artist</div>
          </div>
        </div>
        <div className="nav-item" onClick={handleLogout} style={{ color: 'rgba(248,113,113,0.7)' }}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}>
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
          </svg>
          <span>Sign Out</span>
        </div>
      </div>
    </div>
  )
}
