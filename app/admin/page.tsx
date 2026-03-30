'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Submission {
  id: string
  title: string
  artist: string
  userEmail: string
  genre: string
  format: string
  tracks: number
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  releaseDate: string
  coverImage?: string
}

interface User {
  id: string
  email: string
  username: string
  role: 'admin' | 'user'
  createdAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'submissions' | 'users'>('submissions')
  const [users, setUsers] = useState<User[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [showAddUser, setShowAddUser] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const userRole = localStorage.getItem('userRole')
    if (!isLoggedIn) { router.push('/'); return }
    if (userRole !== 'admin') { router.push('/dashboard'); return }

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

    return () => { unsubSub(); unsubUsers() }
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

  const handleReject = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId)
    if (!submission) return
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    try {
      await updateDoc(doc(db, 'submissions', submissionId), { status: 'rejected', rejectionReason: reason })
      await fetch('/api/send-rejection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: submission.userEmail, title: submission.title, artist: submission.artist, reason })
      })
    } catch (error) { console.error('Error:', error) }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Delete user: ${userEmail}?`)) return
    alert('User deletion requires Firebase Admin SDK.')
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
            <h1>{activeTab === 'submissions' ? 'Release Submissions' : 'User Management'}</h1>
            <p>{activeTab === 'submissions' ? 'Review and manage artist submissions' : 'Manage platform users'}</p>
          </div>
          <div className="user-info">
            <div className="user-avatar">A</div>
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
                              <div style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>{s.title}</div>
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
                          <span className={`status-badge ${s.status === 'approved' ? 'status-active' : s.status === 'rejected' ? 'status-rejected' : 'status-pending'}`} style={{ textTransform: 'capitalize' }}>
                            {s.status}
                          </span>
                        </td>
                        <td>
                          {s.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleApprove(s.id)} className="btn-action-approve">Approve</button>
                              <button onClick={() => handleReject(s.id)} className="btn-action-reject">Reject</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>—</span>
                          )}
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
                            fontSize: '13px', fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {u.username?.charAt(0).toUpperCase() || '?'}
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
    </div>
  )
}
