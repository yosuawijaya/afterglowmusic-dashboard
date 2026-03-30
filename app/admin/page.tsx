'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AvatarUpload from '@/app/components/AvatarUpload'


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
  const [activeTab, setActiveTab] = useState<'submissions' | 'users'>('submissions')
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, email: string} | null>(null)
  const [editModal, setEditModal] = useState<Submission | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editReason, setEditReason] = useState('')
  const [detailModal, setDetailModal] = useState<Submission | null>(null)
  const [saving, setSaving] = useState(false)
  const [adminUserId, setAdminUserId] = useState('')
  const [adminPhoto, setAdminPhoto] = useState('')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userRole = localStorage.getItem('userRole')
    const uid = localStorage.getItem('userId') || ''
    if (!isLoggedIn) { router.push('/'); return }
    if (userRole !== 'admin') { router.push('/dashboard'); return }

    setAdminUserId(uid)

    const unsubPhoto = uid ? onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) setAdminPhoto(snap.data().photoURL || '')
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

    return () => { unsubSub(); unsubUsers(); unsubPhoto?.() }
  }, [router])

  const handleLogout = () => { localStorage.clear(); router.push('/') }

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
    setRejectConfirm({ id: submissionId })
    setRejectReason('')
  }

  const handleRejectConfirm = async () => {
    if (!rejectConfirm || !rejectReason.trim()) return
    const submission = submissions.find(s => s.id === rejectConfirm.id)
    if (!submission) return
    try {
      await updateDoc(doc(db, 'submissions', rejectConfirm.id), { status: 'rejected', rejectionReason: rejectReason })
      await fetch('/api/send-rejection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: submission.userEmail, title: submission.title, artist: submission.artist, reason: rejectReason })
      })
      setRejectConfirm(null)
      setRejectReason('')
    } catch (error) { console.error('Error:', error) }
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
  }

  const handleSaveEdit = async () => {
    if (!editModal) return
    setSaving(true)
    try {
      const updates: any = { status: editStatus }
      if (editStatus === 'rejected') updates.rejectionReason = editReason
      if (editModal.upc !== undefined) updates.upc = editModal.upc

      await updateDoc(doc(db, 'submissions', editModal.id), updates)

      if (editStatus === 'approved' && editModal.status !== 'approved') {
        await fetch('/api/send-approval', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: editModal.userEmail, title: editModal.title, artist: editModal.artist, releaseDate: editModal.releaseDate })
        })
      } else if (editStatus === 'rejected' && editModal.status !== 'rejected') {
        await fetch('/api/send-rejection', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: editModal.userEmail, title: editModal.title, artist: editModal.artist, reason: editReason })
        })
      }
      setEditModal(null)
    } catch (error) { console.error('Error:', error) }
    finally { setSaving(false) }
  }

  const pending = submissions.filter(s => s.status === 'pending').length
  const approved = submissions.filter(s => s.status === 'approved').length
  const rejected = submissions.filter(s => s.status === 'rejected').length

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>

        <div className="nav-section-label">Admin</div>
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
        <div className="nav-section-label">Navigation</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          <span>All Releases</span>
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

      {/* Main */}
      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>{activeTab === 'submissions' ? 'Release Submissions' : activeTab === 'users' ? 'User Management' : 'Transfer Requests'}</h1>
            <p>{activeTab === 'submissions' ? 'Review and manage artist submissions' : activeTab === 'users' ? 'Manage platform users' : 'Manage release transfer requests'}</p>
          </div>
          <div className="user-info">
            <AvatarUpload userId={adminUserId} username="Admin" photoURL={adminPhoto} size={34} onUpdate={setAdminPhoto} />
            <span>Admin</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        {activeTab === 'submissions' ? (
          <>
            {/* Stats */}
            <div className="stats">
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#fbbf24"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                </div>
                <h3>Pending</h3>
                <div className="value">{pending}</div>
                <div className="trend" style={{ color: pending > 0 ? '#fbbf24' : '#34d399' }}>
                  {pending > 0 ? '⚠ Needs review' : '✓ All clear'}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="#34d399"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                </div>
                <h3>Approved</h3>
                <div className="value">{approved}</div>
                <div className="trend">↑ Live releases</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'rgba(248,113,113,0.12)' }}>
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
                <div className="trend">↑ All submissions</div>
              </div>
            </div>

            {/* Submissions Table */}
            {submissions.length === 0 ? (
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
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden',
                              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px'
                            }}>
                              {s.coverImage ? <img src={s.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                            </div>
                            <div>
                              <div
                                onClick={() => setDetailModal(s)}
                                style={{ fontWeight: 600, fontSize: '13px', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(129,140,248,0.3)' }}
                              >{s.title}</div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>by {s.artist}</div>
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
        ) : (
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Edit Release Status</h2>
              <button className="btn-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              {/* Release info */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  {editModal.coverImage ? <img src={editModal.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>{editModal.title}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>by {editModal.artist} · {editModal.userEmail}</div>
                </div>
              </div>

              {/* UPC */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>UPC (Afterglow)</label>
                <input type="text" value={editModal.upc || ''} onChange={e => setEditModal({...editModal, upc: e.target.value})}
                  placeholder="e.g. 00602507345678"
                  style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '8px', fontSize: '14px', background: 'rgba(52,211,153,0.05)', color: '#34d399', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              {/* Status selector */}
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['pending', 'approved', 'rejected'] as const).map(st => (
                  <button key={st} onClick={() => setEditStatus(st)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${editStatus === st ? (st === 'approved' ? '#34d399' : st === 'rejected' ? '#f87171' : '#fbbf24') : 'rgba(255,255,255,0.08)'}`, background: editStatus === st ? (st === 'approved' ? 'rgba(52,211,153,0.12)' : st === 'rejected' ? 'rgba(248,113,113,0.12)' : 'rgba(251,191,36,0.12)') : 'rgba(255,255,255,0.03)', color: editStatus === st ? (st === 'approved' ? '#34d399' : st === 'rejected' ? '#f87171' : '#fbbf24') : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {st === 'approved' ? '✓ Approved' : st === 'rejected' ? '✗ Rejected' : '⏱ Pending'}
                  </button>
                ))}
              </div>

              {/* Rejection reason */}
              {editStatus === 'rejected' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Rejection Reason *</label>
                  <textarea value={editReason} onChange={e => setEditReason(e.target.value)}
                    placeholder="Explain why this release is being rejected..."
                    rows={3}
                    style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '8px', fontSize: '13px', background: 'rgba(248,113,113,0.05)', color: '#fff', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              )}

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

      {/* Detail Modal */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>Release Details</h2>
              <button className="btn-close" onClick={() => setDetailModal(null)}>×</button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
              {/* Hero */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
                  {detailModal.coverImage ? <img src={detailModal.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎵'}
                </div>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>{detailModal.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>
                    {detailModal.artist}{detailModal.featuringArtists ? ` feat. ${detailModal.featuringArtists}` : ''}
                  </p>
                  <span className={`status-badge ${detailModal.status === 'approved' ? 'status-active' : detailModal.status === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ textTransform: 'capitalize' }}>
                    {detailModal.status}
                  </span>
                </div>
              </div>

              {/* Rejection reason banner */}
              {detailModal.status === 'rejected' && detailModal.rejectionReason && (
                <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Rejection Reason</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>{detailModal.rejectionReason}</p>
                </div>
              )}

              {/* Metadata grid */}
              {[
                { label: 'User Email', value: detailModal.userEmail },
                { label: 'Genre', value: `${detailModal.genre}${detailModal.subgenre ? ` · ${detailModal.subgenre}` : ''}` },
                { label: 'Format', value: detailModal.format },
                { label: 'Tracks', value: String(detailModal.tracks) },
                { label: 'Release Date', value: detailModal.releaseDate ? new Date(detailModal.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                { label: 'Submitted', value: new Date(detailModal.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                { label: 'Territories', value: detailModal.territories === 'worldwide' ? 'Worldwide (240)' : detailModal.territories || '—' },
                { label: 'Price Tier', value: detailModal.price || '—' },
                { label: 'UPC', value: detailModal.upc || '—' },
                { label: 'Spotify URL', value: detailModal.spotifyUrl || '—' },
                { label: 'Apple Music URL', value: detailModal.appleMusicUrl || '—' },
                { label: 'YouTube Channel', value: detailModal.youtubeChannelUrl || '—' },
              ].reduce((rows: any[][], item, i) => {
                if (i % 2 === 0) rows.push([item])
                else rows[rows.length - 1].push(item)
                return rows
              }, []).map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  {row.map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>{label}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Promotion text */}
              {detailModal.promotionText && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '6px' }}>Promotion Text</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>{detailModal.promotionText}</div>
                </div>
              )}

              {/* Track list */}
              {detailModal.trackDetails && detailModal.trackDetails.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>Tracks</div>
                  {detailModal.trackDetails.map((t: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '6px' }}>
                      <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{t.title}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{t.artist || detailModal.artist}{t.isrc ? ` · ${t.isrc}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <button className="btn-secondary" onClick={() => setDetailModal(null)}>Close</button>
                <button className="btn-save" onClick={() => { setDetailModal(null); openEdit(detailModal) }}>Edit Status</button>
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
