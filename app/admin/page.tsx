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
    
    if (!isLoggedIn) {
      router.push('/')
      return
    }

    if (userRole !== 'admin') {
      router.push('/dashboard')
    }

    // Load submissions from Firestore (real-time)
    const submissionsQuery = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'))
    const unsubscribeSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      const submissionsData: Submission[] = []
      snapshot.forEach((doc) => {
        submissionsData.push({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate().toISOString() || new Date().toISOString()
        } as Submission)
      })
      setSubmissions(submissionsData)
    })

    // Load users from Firestore (real-time)
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData: User[] = []
      snapshot.forEach((doc) => {
        usersData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
        } as User)
      })
      setUsers(usersData)
    })

    return () => {
      unsubscribeSubmissions()
      unsubscribeUsers()
    }
  }, [router])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const handleApprove = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId)
    if (!submission) return

    try {
      // Update status in Firestore
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'approved'
      })

      // Send approval email
      await fetch('/api/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: submission.userEmail,
          title: submission.title,
          artist: submission.artist,
          releaseDate: submission.releaseDate
        })
      })
      
      alert('Release approved and email sent!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error approving release')
    }
  }

  const handleReject = async (submissionId: string) => {
    const submission = submissions.find(s => s.id === submissionId)
    if (!submission) return

    const reason = prompt('Reason for rejection:')
    if (!reason) return

    try {
      // Update status in Firestore
      await updateDoc(doc(db, 'submissions', submissionId), {
        status: 'rejected',
        rejectionReason: reason
      })

      // Send rejection email
      await fetch('/api/send-rejection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: submission.userEmail,
          title: submission.title,
          artist: submission.artist,
          reason
        })
      })
      
      alert('Release rejected and email sent!')
    } catch (error) {
      console.error('Error:', error)
      alert('Error rejecting release')
    }
  }

  const handleAddUser = () => {
    setShowAddUser(true)
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user: ${userEmail}?`)) return

    try {
      // Note: This only deletes from Firestore, not Firebase Auth
      // You'll need Firebase Admin SDK to delete from Auth
      alert('User deletion requires Firebase Admin SDK. Please contact developer.')
    } catch (error) {
      console.error('Error:', error)
      alert('Error deleting user')
    }
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <div 
          className={`nav-item ${activeTab === 'submissions' ? 'active' : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          Submissions
        </div>
        <div 
          className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
          </svg>
          User Management
        </div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          All Releases
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Admin - {activeTab === 'submissions' ? 'Release Submissions' : 'User Management'}</h1>
          <div className="user-info">
            <span>Admin Panel</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 0' }}>
          {activeTab === 'submissions' ? (
            <>
              <div className="stats" style={{ marginBottom: '30px' }}>
                <div className="stat-card">
                  <h3>Pending</h3>
                  <div className="value">{submissions.filter(s => s.status === 'pending').length}</div>
                </div>
                <div className="stat-card">
                  <h3>Approved</h3>
                  <div className="value">{submissions.filter(s => s.status === 'approved').length}</div>
                </div>
                <div className="stat-card">
                  <h3>Rejected</h3>
                  <div className="value">{submissions.filter(s => s.status === 'rejected').length}</div>
                </div>
                <div className="stat-card">
                  <h3>Total</h3>
                  <div className="value">{submissions.length}</div>
                </div>
              </div>

              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#718096' }}>
                  <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" style={{ margin: '0 auto 20px', opacity: 0.3 }}>
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                  <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>No Submissions Yet</h3>
                  <p>Release submissions will appear here for review</p>
                </div>
              ) : (
                <div className="releases-table">
                  <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr 1.5fr' }}>
                    <div>Title / Artist</div>
                    <div>User Email</div>
                    <div>Genre</div>
                    <div>Format</div>
                    <div>Tracks</div>
                    <div>Status</div>
                    <div>Action</div>
                  </div>
                  {submissions.map((submission) => (
                    <div key={submission.id} className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1.5fr 1.5fr' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{submission.title}</div>
                        <div style={{ fontSize: '13px', color: '#718096' }}>By {submission.artist}</div>
                      </div>
                      <div style={{ fontSize: '13px' }}>{submission.userEmail}</div>
                      <div>{submission.genre}</div>
                      <div>{submission.format}</div>
                      <div>{submission.tracks}</div>
                      <div>
                        <span className={`status-badge ${
                          submission.status === 'approved' ? 'status-active' : 
                          submission.status === 'rejected' ? 'status-rejected' : 
                          'status-pending'
                        }`} style={{ textTransform: 'capitalize' }}>
                          {submission.status}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {submission.status === 'pending' && (
                          <>
                            <button 
                              className="btn-approve" 
                              onClick={() => handleApprove(submission.id)}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '13px', 
                                background: '#27ae60', 
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-reject" 
                              onClick={() => handleReject(submission.id)}
                              style={{ 
                                padding: '6px 12px', 
                                fontSize: '13px', 
                                background: '#e74c3c', 
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', margin: 0 }}>All Users ({users.length})</h2>
                <button 
                  onClick={handleAddUser}
                  style={{ 
                    padding: '10px 20px', 
                    background: '#3498db', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  + Add User
                </button>
              </div>

              {showAddUser && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    width: '90%',
                    maxWidth: '500px'
                  }}>
                    <h2 style={{ marginBottom: '20px' }}>Add New User</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const email = formData.get('email') as string
                      const password = formData.get('password') as string
                      const username = formData.get('username') as string
                      const role = formData.get('role') as string

                      try {
                        const response = await fetch('/api/create-user', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, password, username, role })
                        })

                        const result = await response.json()
                        
                        if (result.success) {
                          alert('User created successfully!')
                          setShowAddUser(false)
                        } else {
                          alert('Error: ' + (result.error || 'Failed to create user'))
                        }
                      } catch (error) {
                        console.error('Error:', error)
                        alert('Error creating user')
                      }
                    }}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Email</label>
                        <input 
                          type="email" 
                          name="email" 
                          required 
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Password</label>
                        <input 
                          type="password" 
                          name="password" 
                          required 
                          minLength={6}
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Username</label>
                        <input 
                          type="text" 
                          name="username" 
                          required 
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 600 }}>Role</label>
                        <select 
                          name="role" 
                          required 
                          style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          type="button"
                          onClick={() => setShowAddUser(false)}
                          style={{ 
                            padding: '10px 20px', 
                            background: '#95a5a6', 
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          style={{ 
                            padding: '10px 20px', 
                            background: '#27ae60', 
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="releases-table">
                <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr' }}>
                  <div>Email</div>
                  <div>Username</div>
                  <div>Role</div>
                  <div>Created At</div>
                  <div>Action</div>
                </div>
                {users.map((user) => (
                  <div key={user.id} className="table-row" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr' }}>
                    <div>{user.email}</div>
                    <div>{user.username}</div>
                    <div>
                      <span className={`status-badge ${user.role === 'admin' ? 'status-active' : ''}`} style={{ textTransform: 'capitalize' }}>
                        {user.role}
                      </span>
                    </div>
                    <div>{new Date(user.createdAt).toLocaleDateString('en-GB')}</div>
                    <div>
                      {user.role !== 'admin' && (
                        <button 
                          className="btn-remove" 
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', height: 'auto' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
