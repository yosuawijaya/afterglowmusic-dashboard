'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, doc, updateDoc, orderBy, addDoc, serverTimestamp, getDocs, where, writeBatch } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AvatarUpload from '@/app/components/AvatarUpload'
import EditUsername from '@/app/components/EditUsername'


interface Submission {
  id: string
  title: string
  artist: string
  featuringArtists?: string
  userEmail: string
  genre: string
  subgenre?: string
  format: string
  tracks: number
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  releaseDate: string
  coverImage?: string
  upc?: string
  territories?: string
  price?: string
  promotionText?: string
  spotifyUrl?: string
  appleMusicUrl?: string
  youtubeChannelUrl?: string
  rejectionReason?: string
  trackDetails?: any[]
}

interface User {
  id: string
  email: string
  username: string
  role: 'admin' | 'user'
  createdAt: string
  photoURL?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'submissions' | 'users' | 'royalties' | 'audit'>('submissions')
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, email: string} | null>(null)
  const [royaltyFile, setRoyaltyFile] = useState<File | null>(null)
  const [royaltyParsed, setRoyaltyParsed] = useState<any[]>([])
  const [royaltyUploading, setRoyaltyUploading] = useState(false)
  const [royaltyPreview, setRoyaltyPreview] = useState(false)
  const [royaltyHistory, setRoyaltyHistory] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [adminSearch, setAdminSearch] = useState('')
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [adminNote, setAdminNote] = useState('')
  const [batchUpc, setBatchUpc] = useState('')
  const [editModal, setEditModal] = useState<Submission | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editReason, setEditReason] = useState('')
  const [detailModal, setDetailModal] = useState<Submission | null>(null)
  const [saving, setSaving] = useState(false)
  const [adminUserId, setAdminUserId] = useState('')
  const [adminPhoto, setAdminPhoto] = useState('')
  const [adminUsername, setAdminUsername] = useState('Admin')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userRole = localStorage.getItem('userRole')
    const uid = localStorage.getItem('userId') || ''
    if (!isLoggedIn) { router.push('/'); return }
    if (userRole !== 'admin') { router.push('/dashboard'); return }

    setAdminUserId(uid)

    const unsubPhoto = uid ? onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        setAdminPhoto(snap.data().photoURL || '')
        setAdminUsername(snap.data().username || 'Admin')
      }
    }) : null

    const submissionsQuery = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'))
    const unsubSub = onSnapshot(submissionsQuery, (snapshot) => {
      const data: Submission[] = []
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data(), submittedAt: d.data().submittedAt?.toDate().toISOString() || new Date().toISOString() } as Submission)
      })
      setSubmissions(data)
    })

    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const data: User[] = []
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate().toISOString() || new Date().toISOString() } as User)
      })
      setUsers(data)
    })

    // Royalty upload history
    const royaltyQuery = query(collection(db, 'royaltyUploads'), orderBy('uploadedAt', 'desc'))
    const unsubRoyalty = onSnapshot(royaltyQuery, (snapshot) => {
      const data: any[] = []
      snapshot.forEach(d => data.push({ id: d.id, ...d.data(), uploadedAt: d.data().uploadedAt?.toDate().toISOString() || new Date().toISOString() }))
      setRoyaltyHistory(data)
    })

    // Audit log
    const auditQuery = query(collection(db, 'auditLog'), orderBy('timestamp', 'desc'))
    const unsubAudit = onSnapshot(auditQuery, (snapshot) => {
      setAuditLog(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString() })))
    })

    return () => { unsubSub(); unsubUsers(); unsubPhoto?.(); unsubRoyalty(); unsubAudit() }
  }, [router])

  const handleLogout = () => { localStorage.clear(); router.push('/') }

  // Parse Excel file
  const handleRoyaltyFile = async (file: File) => {
    setRoyaltyFile(file)
    try {
      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
      setRoyaltyParsed(rows)
      setRoyaltyPreview(true)
    } catch (e) {
      alert('Error parsing Excel file: ' + (e as Error).message)
    }
  }

  // Save royalty data to Firestore
  const handleRoyaltyUpload = async () => {
    if (!royaltyParsed.length) return
    setRoyaltyUploading(true)
    try {
      const period = (royaltyParsed[0]?.Period || royaltyParsed[0]?.period || new Date().toISOString().slice(0, 7))
      const batch = writeBatch(db)

      // Group by userId or userEmail
      const grouped: Record<string, any[]> = {}
      for (const row of royaltyParsed) {
        const key = row.userId || row.user_id || row.UserID || row.email || row.Email || row.userEmail || 'unknown'
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      }

      // Save per-user royalty report
      for (const [userKey, rows] of Object.entries(grouped)) {
        const totalRevenue = rows.reduce((sum, r) => sum + (parseFloat(r.Revenue || r.revenue || r.Amount || r.amount || '0') || 0), 0)
        const totalStreams = rows.reduce((sum, r) => sum + (parseInt(r.Streams || r.streams || r.Plays || r.plays || '0') || 0), 0)

        const docRef = doc(collection(db, 'royalties'))
        batch.set(docRef, {
          userId: userKey,
          period,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalStreams,
          rows,
          uploadedAt: serverTimestamp(),
          uploadedBy: localStorage.getItem('userId') || 'admin',
          fileName: royaltyFile?.name || 'unknown',
        })
      }

      // Save upload history
      await addDoc(collection(db, 'royaltyUploads'), {
        fileName: royaltyFile?.name || 'unknown',
        period,
        rowCount: royaltyParsed.length,
        userCount: Object.keys(grouped).length,
        uploadedAt: serverTimestamp(),
        uploadedBy: localStorage.getItem('userId') || 'admin',
      })

      await batch.commit()
      alert(`✓ Royalty data uploaded! ${royaltyParsed.length} rows for ${Object.keys(grouped).length} users.`)
      setRoyaltyFile(null)
      setRoyaltyParsed([])
      setRoyaltyPreview(false)
    } catch (e) {
      alert('Upload error: ' + (e as Error).message)
    } finally {
      setRoyaltyUploading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId)
    if (!submission) return
    try {
      await updateDoc(doc(db, 'submissions', submissionId), { status: 'approved' })
      await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: submission.userEmail, title: submission.title, artist: submission.artist, releaseDate: submission.releaseDate })
      })
    } catch (error) { console.error('Error:', error) }
  }

  const handleReject = (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId)
    if (submission) openEdit(submission)
  }

  const handleDeleteUser = (userId: string, userEmail: string) => {
    setDeleteConfirm({ id: userId, email: userEmail })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    try {
      const res = await fetch('/api/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteConfirm.id })
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.error)
      setDeleteConfirm(null)
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error deleting user: ' + error.message)
    }
  }

  const openEdit = (s: Submission) => {
    setEditModal(s)
    setEditStatus(s.status)
    setEditReason(s.rejectionReason || '')
    setAdminNote((s as any).adminNote || '')
  }

  const handleSaveEdit = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      const updates: any = { status: editStatus }
      if (editStatus === 'rejected') updates.rejectionReason = editReason || ''
      if (editModal.upc !== undefined && editModal.upc !== null) updates.upc = editModal.upc
      if (adminNote) updates.adminNote = adminNote

      // Strip any undefined values to avoid Firestore error
      Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k])

      await updateDoc(doc(db, 'submissions', editModal.id), updates)

      // Find userId from submissions data
      const sub = submissions.find(s => s.id === editModal.id) as any
      const targetUserId = sub?.userId || ''

      if (editStatus === 'approved' && editModal.status !== 'approved') {
        await fetch('/api/send-approval', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: editModal.userEmail, title: editModal.title, artist: editModal.artist, releaseDate: editModal.releaseDate })
        })
        // Create in-app notification
        if (targetUserId) {
          await addDoc(collection(db, 'notifications'), {
            userId: targetUserId,
            title: 'Release Approved',
            message: `"${editModal.title}" has been approved and is being distributed to all platforms.`,
            type: 'approved',
            read: false,
            createdAt: serverTimestamp(),
          })
        }
      } else if (editStatus === 'rejected' && editModal.status !== 'rejected') {
        await fetch('/api/send-rejection', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: editModal.userEmail, title: editModal.title, artist: editModal.artist, reason: editReason })
        })
        // Create in-app notification
        if (targetUserId) {
          await addDoc(collection(db, 'notifications'), {
            userId: targetUserId,
            title: 'Release Needs Revision',
            message: `"${editModal.title}" requires changes. Reason: ${editReason || 'See email for details.'}`,
            type: 'rejected',
            read: false,
            createdAt: serverTimestamp(),
          })
        }
      }
      setEditModal(null)

      // Write audit log
      await addDoc(collection(db, 'auditLog'), {
        action: `status_changed_to_${editStatus}`,
        submissionId: editModal.id,
        releaseTitle: editModal.title,
        artist: editModal.artist,
        userEmail: editModal.userEmail,
        adminId: localStorage.getItem('userId') || '',
        adminUsername: adminUsername,
        previousStatus: editModal.status,
        newStatus: editStatus,
        reason: editStatus === 'rejected' ? editReason : null,
        upc: editModal.upc || null,
        note: adminNote || null,
        timestamp: serverTimestamp(),
      })
    } catch (error) { console.error('Error:', error) }
    finally { setSaving(false) }
  }

  const pending = submissions.filter(s => s.status === 'pending').length
  const approved = submissions.filter(s => s.status === 'approved').length
  const rejected = submissions.filter(s => s.status === 'rejected').length

  const filteredAdminSubmissions = submissions.filter(s => {
    if (!s || !s.id) return false
    const matchSearch = !adminSearch ||
      s.title.toLowerCase().includes(adminSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(adminSearch.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(adminSearch.toLowerCase())
    const matchStatus = adminStatusFilter === 'all' || s.status === adminStatusFilter
    return matchSearch && matchStatus
  }).sort((a, b) => {
    // Priority: pending oldest first, then others by date desc
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    if (a.status === 'pending' && b.status === 'pending') {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    }
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  })

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return
    await Promise.all(selectedIds.map(async id => {
      const sub = submissions.find(s => s.id === id)
      if (!sub || sub.status === 'approved') return
      await updateDoc(doc(db, 'submissions', id), { status: 'approved' })
      await fetch('/api/send-approval', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: sub.userEmail, title: sub.title, artist: sub.artist, releaseDate: sub.releaseDate })
      })
    }))
    setSelectedIds([])
  }

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return
    await Promise.all(selectedIds.map(async id => {
      const sub = submissions.find(s => s.id === id)
      if (!sub || sub.status === 'rejected') return
      await updateDoc(doc(db, 'submissions', id), { status: 'rejected', rejectionReason: 'Bulk rejected by admin' })
      await fetch('/api/send-rejection', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: sub.userEmail, title: sub.title, artist: sub.artist, reason: 'Bulk rejected by admin' })
      })
    }))
    setSelectedIds([])
  }

  const toggleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === filteredAdminSubmissions.length ? [] : filteredAdminSubmissions.map(s => s.id))

  const handleBatchUpc = async () => {
    if (!selectedIds.length) return
    await Promise.all(selectedIds.map(async (id, i) => {
      const upc = batchUpc || ('00' + (Date.now() + i).toString().slice(-11))
      await updateDoc(doc(db, 'submissions', id), { upc })
    }))
    setBatchUpc('')
    setSelectedIds([])
    alert(`UPC assigned to ${selectedIds.length} release(s)`)
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>

        <div className="nav-section-label">Admin Panel</div>
        <div className={`nav-item ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          <span>Submissions</span>
          {pending > 0 && <span className="nav-badge">{pending}</span>}
        </div>
        <div className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          <span>Users</span>
          <span className="nav-badge">{users.length}</span>
        </div>
        <div className={`nav-item ${activeTab === 'royalties' ? 'active' : ''}`} onClick={() => setActiveTab('royalties')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          <span>Royalties</span>
          {royaltyHistory.length > 0 && <span className="nav-badge">{royaltyHistory.length}</span>}
        </div>
        <div className={`nav-item ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
          <span>Audit Log</span>
          {auditLog.length > 0 && <span className="nav-badge">{auditLog.length}</span>}
        </div>
        <div className="nav-section-label">Navigation</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          <span>All Releases</span>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
            <AvatarUpload userId={adminUserId} username={adminUsername} photoURL={adminPhoto} size={32} onUpdate={setAdminPhoto} />
            <EditUsername userId={adminUserId} username={adminUsername} role="Label Manager" onUpdate={setAdminUsername} />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>{activeTab === 'submissions' ? 'Release Submissions' : activeTab === 'users' ? 'User Management' : activeTab === 'audit' ? 'Audit Log' : 'Royalty Reports'}</h1>
            <p>{activeTab === 'submissions' ? 'Review and manage artist submissions' : activeTab === 'users' ? 'Manage platform users and permissions' : activeTab === 'audit' ? 'Track all admin actions on submissions' : 'Upload and manage royalty data for artists'}</p>
          </div>
          <div className="user-info">
            <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
          </div>
        </div>

        {activeTab === 'submissions' ? (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                </div>
                <h3>Pending</h3>
                <div className="value">{pending}</div>
                <div className="trend" style={{ color: pending > 0 ? '#f59e0b' : '#10b981' }}>
                  {pending > 0 ? '⚠ Needs review' : '✓ All clear'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#10b981"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                </div>
                <h3>Approved</h3>
                <div className="value">{approved}</div>
                <div className="trend"><span style={{ color: '#10b981' }}>↑</span> Live releases</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#f87171"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                </div>
                <h3>Rejected</h3>
                <div className="value">{rejected}</div>
                <div className="trend" style={{ color: 'rgba(255,255,255,0.3)' }}>Total rejected</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#818cf8"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
                </div>
                <h3>Total</h3>
                <div className="value">{submissions.length}</div>
                <div className="trend"><span style={{ color: '#10b981' }}>↑</span> All submissions</div>
              </div>
            </div>

            {/* Submissions Table */}
            {/* Search + Filter + Bulk Actions */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by title, artist, email..."
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px 9px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
                <button key={s} onClick={() => setAdminStatusFilter(s)}
                  style={{ padding: '7px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid', transition: 'all 0.2s',
                    background: adminStatusFilter === s ? (s === 'pending' ? 'rgba(245,158,11,0.15)' : s === 'approved' ? 'rgba(16,185,129,0.12)' : s === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.08)') : 'transparent',
                    color: adminStatusFilter === s ? (s === 'pending' ? '#f59e0b' : s === 'approved' ? '#10b981' : s === 'rejected' ? '#f87171' : '#fff') : 'rgba(255,255,255,0.4)',
                    borderColor: adminStatusFilter === s ? (s === 'pending' ? 'rgba(245,158,11,0.3)' : s === 'approved' ? 'rgba(16,185,129,0.3)' : s === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.08)',
                  }}>
                  {s === 'all' ? `All (${submissions.length})` : s === 'pending' ? `Pending (${pending})` : s === 'approved' ? `Approved (${approved})` : `Rejected (${rejected})`}
                </button>
              ))}
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>{selectedIds.length} selected</span>
                <div style={{ flex: 1 }} />
                <input value={batchUpc} onChange={e => setBatchUpc(e.target.value)} placeholder="UPC prefix (optional)" style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px', fontFamily: 'monospace', width: '160px', outline: 'none' }} />
                <button onClick={handleBatchUpc} style={{ padding: '6px 12px', background: 'rgba(165,180,252,0.12)', color: '#a5b4fc', border: '1px solid rgba(165,180,252,0.2)', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  # Assign UPC
                </button>
                <button onClick={handleBulkApprove} style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✓ Approve All                </button>
                <button onClick={handleBulkReject} style={{ padding: '6px 14px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ✕ Reject All
                </button>
                <button onClick={() => setSelectedIds([])} style={{ padding: '6px 10px', background: 'transparent', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clear
                </button>
              </div>
            )}

            {filteredAdminSubmissions.length === 0 ? (
              <div className="admin-empty">
                <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.15, margin: '0 auto 16px' }}>
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/>
                </svg>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No submissions yet</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>
                        <input type="checkbox" checked={selectedIds.length === filteredAdminSubmissions.length && filteredAdminSubmissions.length > 0} onChange={toggleSelectAll}
                          style={{ cursor: 'pointer', accentColor: '#6366f1' }} />
                      </th>
                      <th>Release</th>
                      <th>User</th>
                      <th>Genre</th>
                      <th>Format</th>
                      <th>Tracks</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminSubmissions.map((s) => (
                      <tr key={s.id} style={{ background: selectedIds.includes(s.id) ? 'rgba(99,102,241,0.05)' : undefined }}>
                        <td>
                          <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)}
                            style={{ cursor: 'pointer', accentColor: '#6366f1' }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden',
                              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                            }}>
                              {s.coverImage ? <img src={s.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>}
                            </div>
                            <div>
                              <div
                                onClick={() => setDetailModal(s)}
                                style={{ fontWeight: 600, fontSize: '13px', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(129,140,248,0.3)' }}
                              >{s.title}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                by {s.artist}
                                {s.status === 'pending' && (() => {
                                  const days = Math.floor((Date.now() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60 * 24))
                                  return days >= 3 ? <span style={{ marginLeft: '6px', fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>{days}d waiting</span> : null
                                })()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{s.userEmail}</td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{s.genre}</td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{s.format}</td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>{s.tracks}</td>
                        <td style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(s.submittedAt).toLocaleDateString('en-GB')}
                        </td>
                        <td>
                          {s.status === 'rejected' && s.rejectionReason && (
                            <div style={{ fontSize: '10px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '4px', padding: '2px 7px', marginBottom: '4px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.rejectionReason}>
                              {s.rejectionReason}
                            </div>
                          )}
                          <span className={`status-badge ${s.status === 'approved' ? 'status-active' : s.status === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ textTransform: 'capitalize' }}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => openEdit(s)} className="btn-action-approve" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : activeTab === 'users' ? (
          <>
            {/* Users Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{users.length} registered users</p>
              </div>
              <button onClick={() => setShowAddUser(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                </svg>
                Add User
              </button>
            </div>

            {/* Users Table */}
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: u.role === 'admin' ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'rgba(255,255,255,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0,
                            overflow: 'hidden'
                          }}>
                            {u.photoURL
                              ? <img src={u.photoURL} alt={u.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : u.username?.charAt(0).toUpperCase() || '?'
                            }
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{u.username}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{u.email}</td>
                      <td>
                        <span className={`status-badge ${u.role === 'admin' ? 'status-active' : ''}`} style={{ textTransform: 'capitalize' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button onClick={() => handleDeleteUser(u.id, u.email)} className="btn-action-reject">Delete</button>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : activeTab === 'royalties' ? (
          /* ===== ROYALTIES TAB ===== */
          <div>
            {/* Upload section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              {/* Upload card */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.5), transparent)' }} />
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>Upload Royalty Report</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                  Upload an Excel (.xlsx) or CSV file. Required columns: <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>userId</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Revenue</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Streams</code>, <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '4px', fontSize: '11px' }}>Period</code>
                </p>

                {/* Dropzone */}
                <div
                  onClick={() => document.getElementById('royalty-file-input')?.click()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleRoyaltyFile(f) }}
                  onDragOver={e => e.preventDefault()}
                  style={{ border: `2px dashed ${royaltyFile ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', background: royaltyFile ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: '14px' }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={royaltyFile ? '#10b981' : 'rgba(255,255,255,0.2)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: royaltyFile ? '#10b981' : 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
                    {royaltyFile ? `✓ ${royaltyFile.name}` : 'Drop Excel or CSV file here'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    {royaltyFile ? `${royaltyParsed.length} rows parsed` : '.xlsx · .xls · .csv'}
                  </p>
                  <input id="royalty-file-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleRoyaltyFile(f) }} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {royaltyFile && (
                    <button onClick={() => setRoyaltyPreview(p => !p)}
                      style={{ flex: 1, padding: '9px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', color: '#818cf8', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {royaltyPreview ? 'Hide Preview' : `Preview (${royaltyParsed.length} rows)`}
                    </button>
                  )}
                  <button
                    onClick={handleRoyaltyUpload}
                    disabled={!royaltyFile || royaltyUploading || !royaltyParsed.length}
                    style={{ flex: 1, padding: '9px', background: royaltyFile && royaltyParsed.length ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', color: royaltyFile && royaltyParsed.length ? 'white' : 'rgba(255,255,255,0.2)', fontSize: '12px', fontWeight: 700, cursor: royaltyFile && royaltyParsed.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit', boxShadow: royaltyFile && royaltyParsed.length ? '0 4px 14px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
                    {royaltyUploading ? 'Uploading...' : '↑ Upload & Publish'}
                  </button>
                </div>
              </div>

              {/* Format guide */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>Excel Format Guide</h3>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {['Column', 'Required', 'Example'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { col: 'userId', req: true, ex: 'abc123xyz' },
                        { col: 'Period', req: true, ex: '2025-Q1' },
                        { col: 'Revenue', req: true, ex: '12.50' },
                        { col: 'Streams', req: false, ex: '4820' },
                        { col: 'Platform', req: false, ex: 'Spotify' },
                        { col: 'ReleaseTitle', req: false, ex: 'Song Name' },
                        { col: 'ISRC', req: false, ex: 'USRC17607839' },
                      ].map(({ col, req, ex }) => (
                        <tr key={col} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '7px 12px', fontFamily: 'monospace', color: '#a5b4fc', fontSize: '12px' }}>{col}</td>
                          <td style={{ padding: '7px 12px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: req ? '#10b981' : 'rgba(255,255,255,0.3)', background: req ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: '20px' }}>{req ? 'Required' : 'Optional'}</span>
                          </td>
                          <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{ex}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Artists will see their royalty data on the Royalties page after upload. Data is matched by <strong style={{ color: 'rgba(255,255,255,0.5)' }}>userId</strong>.
                </p>
              </div>
            </div>

            {/* Preview table */}
            {royaltyPreview && royaltyParsed.length > 0 && (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Preview — {royaltyParsed.length} rows</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>First 10 rows shown</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {Object.keys(royaltyParsed[0] || {}).slice(0, 8).map(k => (
                          <th key={k} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', background: 'rgba(255,255,255,0.02)', whiteSpace: 'nowrap' }}>{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {royaltyParsed.slice(0, 10).map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          {Object.values(row).slice(0, 8).map((val: any, j) => (
                            <td key={j} style={{ padding: '10px 14px', color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload history */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>Upload History</h3>
              {royaltyHistory.length === 0 ? (
                <div className="admin-empty">
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No royalty reports uploaded yet</p>
                </div>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Period</th>
                        <th>Rows</th>
                        <th>Users</th>
                        <th>Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {royaltyHistory.map(r => (
                        <tr key={r.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '28px', height: '28px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{r.fileName}</span>
                            </div>
                          </td>
                          <td><span style={{ fontSize: '12px', color: '#a5b4fc', background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: '20px', fontWeight: 600 }}>{r.period}</span></td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.rowCount?.toLocaleString()}</td>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{r.userCount}</td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(r.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ===== AUDIT LOG TAB ===== */}
        {activeTab === 'audit' && (
          <div>
            {auditLog.length === 0 ? (
              <div className="admin-empty">
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No audit entries yet</p>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Admin</th>
                      <th>Release</th>
                      <th>Action</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map(entry => (
                      <tr key={entry.id}>
                        <td style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                          {new Date(entry.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{entry.adminUsername || 'Admin'}</td>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{entry.releaseTitle}</div>
                          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{entry.artist}</div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize',
                            background: entry.newStatus === 'approved' ? 'rgba(16,185,129,0.12)' : entry.newStatus === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: entry.newStatus === 'approved' ? '#10b981' : entry.newStatus === 'rejected' ? '#f87171' : '#f59e0b',
                            border: `1px solid ${entry.newStatus === 'approved' ? 'rgba(16,185,129,0.25)' : entry.newStatus === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                          }}>
                            {entry.previousStatus} → {entry.newStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '200px' }}>
                          {entry.reason && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry.reason}>{entry.reason}</div>}
                          {entry.upc && <div style={{ fontFamily: 'monospace', color: '#a5b4fc', fontSize: '11px' }}>UPC: {entry.upc}</div>}
                          {entry.note && <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{entry.note}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="btn-close" onClick={() => setShowAddUser(false)}>×</button>
            </div>
            <form style={{ padding: '24px' }} onSubmit={async (e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              try {
                const res = await fetch('/api/create-user', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), username: fd.get('username'), role: fd.get('role') })
                })
                const result = await res.json()
                if (result.success) { alert('User created!'); setShowAddUser(false) }
                else alert('Error: ' + (result.error || 'Failed'))
              } catch { alert('Error creating user') }
            }}>
              {[
                { label: 'Email', name: 'email', type: 'email' },
                { label: 'Password', name: 'password', type: 'password' },
                { label: 'Username', name: 'username', type: 'text' },
              ].map(({ label, name, type }) => (
                <div key={name} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '7px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
                  <input type={type} name={name} required minLength={name === 'password' ? 6 : undefined}
                    style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.04)', color: '#fff', fontFamily: 'inherit' }} />
                </div>
              ))}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</label>
                <select name="role" required style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', background: '#1a1a2e', color: '#fff', fontFamily: 'inherit' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddUser(false)}>Cancel</button>
                <button type="submit" className="btn-save">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div>
                <h2>Edit Release</h2>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>Update status, UPC, and notes</p>
              </div>
              <button className="btn-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '80vh' }}>

              {/* Release info banner */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '22px', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e' }}>
                  {editModal.coverImage
                    ? <img src={editModal.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg></div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '15px', color: '#fff', marginBottom: '3px' }}>{editModal.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>by {editModal.artist}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{editModal.userEmail}</div>
                </div>
                <span className={`status-badge ${editModal.status === 'approved' ? 'status-active' : editModal.status === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ textTransform: 'capitalize', flexShrink: 0 }}>
                  {editModal.status}
                </span>
              </div>

              {/* Status selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['pending', 'approved', 'rejected'] as const).map(st => (
                    <button key={st} onClick={() => setEditStatus(st)}
                      style={{ flex: 1, padding: '11px 8px', borderRadius: '10px', border: `1px solid ${editStatus === st ? (st === 'approved' ? '#34d399' : st === 'rejected' ? '#f87171' : '#fbbf24') : 'rgba(255,255,255,0.08)'}`, background: editStatus === st ? (st === 'approved' ? 'rgba(52,211,153,0.12)' : st === 'rejected' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)') : 'rgba(255,255,255,0.03)', color: editStatus === st ? (st === 'approved' ? '#34d399' : st === 'rejected' ? '#f87171' : '#fbbf24') : 'rgba(255,255,255,0.35)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s' }}>
                      {st === 'approved' ? '✓ Approved' : st === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rejection reason with templates */}
              {editStatus === 'rejected' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Rejection Reason *</label>

                  {/* Quick templates */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '7px', fontWeight: 600 }}>Quick templates:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {[
                        { label: 'Cover not HD', text: 'Cover art does not meet our quality standards. Please upload a high-resolution image (minimum 3000×3000px, JPG or PNG).' },
                        { label: 'Cover wrong size', text: 'Cover art must be a perfect square (1:1 ratio) with minimum 3000×3000px resolution.' },
                        { label: 'Audio quality low', text: 'Audio file quality does not meet our standards. Please upload WAV files at minimum 44.1kHz / 16-bit.' },
                        { label: 'Metadata incomplete', text: 'Release metadata is incomplete or incorrect. Please review and fill in all required fields including composer, lyricist, and ISRC.' },
                        { label: 'Copyright issue', text: 'This release contains content that may violate copyright. Please ensure you own or have licensed all content before resubmitting.' },
                        { label: 'Wrong audio format', text: 'Audio files must be in WAV format. MP3 or other compressed formats are not accepted.' },
                        { label: 'Release date too soon', text: 'Release date must be at least 2 weeks from submission date to allow proper distribution setup.' },
                        { label: 'Invalid Spotify URL', text: 'The Spotify Artist URL provided is invalid or does not match the artist name on this release.' },
                        { label: 'Duplicate release', text: 'This release appears to be a duplicate of an existing submission. Please check your catalog before resubmitting.' },
                      ].map(t => (
                        <button key={t.label} onClick={() => setEditReason(t.text)}
                          style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 600, background: editReason === t.text ? 'rgba(248,113,113,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${editReason === t.text ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '20px', color: editReason === t.text ? '#f87171' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea value={editReason} onChange={e => setEditReason(e.target.value)}
                    placeholder="Or write a custom rejection reason..."
                    rows={4}
                    style={{ width: '100%', padding: '11px 13px', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', fontSize: '13px', background: 'rgba(248,113,113,0.04)', color: '#fff', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
                  />
                </div>
              )}

              {/* UPC */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>UPC Code</label>
                  <button onClick={() => setEditModal({...editModal, upc: '00' + Date.now().toString().slice(-11)})}
                    style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Auto-generate
                  </button>
                </div>
                <input type="text" value={editModal.upc || ''} onChange={e => setEditModal({...editModal, upc: e.target.value})}
                  placeholder="e.g. 00602507345678"
                  style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '8px', fontSize: '14px', background: 'rgba(16,185,129,0.04)', color: '#10b981', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              {/* Admin Notes */}
              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Internal Notes (admin only)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  rows={2}
                  style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.03)', color: '#fff', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }}
                />
              </div>

              <div className="form-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <button className="btn-secondary" onClick={() => setEditModal(null)}>Cancel</button>
                <button className="btn-save" onClick={handleSaveEdit} disabled={saving || (editStatus === 'rejected' && !editReason.trim())}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal — Full Screen */}
      {detailModal && (
        <div
          onClick={() => setDetailModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 1000, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', position: 'relative', overflow: 'hidden' }}
          >
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0, background: 'rgba(5,5,13,0.8)', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className={`status-badge ${detailModal.status === 'approved' ? 'status-active' : detailModal.status === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ textTransform: 'capitalize' }}>{detailModal.status}</span>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{detailModal.userEmail}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-save" style={{ padding: '8px 20px', fontSize: '13px' }} onClick={() => { const d = detailModal; setDetailModal(null); openEdit(d) }}>
                  Edit Status
                </button>
                <button onClick={() => setDetailModal(null)} style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>×</button>
              </div>
            </div>

            {/* Body — two column */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

              {/* LEFT — Cover + basic info */}
              <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                {/* Cover art */}
                <div style={{ position: 'relative', background: '#050510', flexShrink: 0 }}>
                  {detailModal.coverImage
                    ? <img src={detailModal.coverImage} alt={detailModal.title} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block', cursor: 'zoom-in' }} onClick={() => window.open(detailModal.coverImage, '_blank')} />
                    : <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e, #0f0f1e)' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.15)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>
                      </div>
                  }
                  {detailModal.coverImage && (
                    <div onClick={() => window.open(detailModal.coverImage, '_blank')} style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.75)', borderRadius: '7px', padding: '5px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
                      Full size
                    </div>
                  )}
                </div>

                {/* Release info below cover */}
                <div style={{ padding: '20px 22px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(165,180,252,0.5)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                    {detailModal.format} · {detailModal.genre}{detailModal.subgenre ? ` · ${detailModal.subgenre}` : ''}
                  </div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px', lineHeight: 1.2 }}>{detailModal.title}</h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '18px' }}>
                    {detailModal.artist}{detailModal.featuringArtists ? <span style={{ color: 'rgba(255,255,255,0.25)' }}> feat. {detailModal.featuringArtists}</span> : ''}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Release Date', value: detailModal.releaseDate ? new Date(detailModal.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                      { label: 'Submitted', value: new Date(detailModal.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                      { label: 'Territories', value: detailModal.territories === 'worldwide' ? 'Worldwide (240)' : detailModal.territories || '—' },
                      { label: 'Price Tier', value: detailModal.price || 'standard' },
                      { label: 'Tracks', value: String(detailModal.tracks) },
                      ...(detailModal.upc ? [{ label: 'UPC', value: detailModal.upc, mono: true }] : []),
                    ].map(({ label, value, mono }: any) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', fontWeight: mono ? 600 : 400 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT — All details */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

                {/* Rejection banner */}
                {detailModal.status === 'rejected' && detailModal.rejectionReason && (
                  <div style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '12px', padding: '14px 18px', marginBottom: '22px' }}>
                    <p style={{ fontSize: '10px', fontWeight: 800, color: '#f87171', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>⚠ Rejection Reason</p>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7' }}>{detailModal.rejectionReason}</p>
                  </div>
                )}

                {/* Links section */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Platform Links</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Spotify Artist', value: detailModal.spotifyUrl, icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      )},
                      { label: 'Apple Music', value: detailModal.appleMusicUrl, icon: (
                        <img src="/logos/apple-music.png" alt="Apple Music" width="16" height="16" style={{ objectFit: 'contain' }} />
                      )},
                      { label: 'YouTube Channel', value: detailModal.youtubeChannelUrl, icon: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                      )},
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '9px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>{label}</div>
                          {value
                            ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>{value}</a>
                            : <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>—</span>
                          }
                        </div>
                        {value && (
                          <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none', flexShrink: 0 }}>Open ↗</a>
                        )}
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '9px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '2px' }}>Claim YouTube OAC</div>
                        <span style={{ fontSize: '12px', color: (detailModal as any).claimYoutubeOAC ? '#10b981' : 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{(detailModal as any).claimYoutubeOAC ? 'Yes — requested' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Promotion text */}
                {detailModal.promotionText && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Promotion Notes</div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '9px', padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>
                      {detailModal.promotionText}
                    </div>
                  </div>
                )}

                {/* Track list */}
                {detailModal.trackDetails && detailModal.trackDetails.length > 0 && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                      Tracks ({detailModal.trackDetails.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {detailModal.trackDetails.map((t: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{t.title}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <span>{t.artist || detailModal.artist}</span>
                              {t.composer && <span>Composer: {t.composer}</span>}
                              {t.producer && <span>Producer: {t.producer}</span>}
                              {t.isrc && <span style={{ fontFamily: 'monospace', color: 'rgba(165,180,252,0.5)' }}>ISRC: {t.isrc}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                            {t.audioUrl && (
                              <a href={t.audioUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '5px 12px', borderRadius: '7px', textDecoration: 'none', fontWeight: 700 }}>
                                ▶ Play
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2>Delete User</h2>
              <button className="btn-close" onClick={() => setDeleteConfirm(null)}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>Are you sure?</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{deleteConfirm.email}</p>
              </div>
              <div className="form-actions" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-action-reject" onClick={handleDeleteConfirm} style={{ padding: '10px 20px', fontSize: '13px' }}>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
