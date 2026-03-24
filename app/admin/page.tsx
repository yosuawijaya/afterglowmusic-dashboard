'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  username: string
  created_at: string
  role: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAdmin()
    fetchUsers()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
    }
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (data) {
      setUsers(data)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            username: newUser.username,
            role: newUser.role
          }
        }
      })

      if (error) throw error

      alert('User created successfully!')
      setShowCreateForm(false)
      setNewUser({ email: '', username: '', password: '', role: 'user' })
      fetchUsers()
    } catch (error: any) {
      alert('Error creating user: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      alert('Error deleting user: ' + error.message)
    } else {
      alert('User deleted successfully!')
      fetchUsers()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <div className="nav-item active">
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
          <h1>Admin - User Management</h1>
          <div className="user-info">
            <span>Admin Panel</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 0' }}>
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateForm(true)}
            style={{ marginBottom: '20px' }}
          >
            + Create New User
          </button>

          {showCreateForm && (
            <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                  <h2>Create New User</h2>
                  <button className="btn-close" onClick={() => setShowCreateForm(false)}>
                    ×
                  </button>
                </div>
                <form onSubmit={handleCreateUser} style={{ padding: '30px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Email *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Username *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Password *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                      minLength={6}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn-save"
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
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
                <div>{user.username || '-'}</div>
                <div>
                  <span className={`status-badge ${user.role === 'admin' ? 'status-active' : ''}`} style={{ textTransform: 'capitalize' }}>
                    {user.role}
                  </span>
                </div>
                <div>{new Date(user.created_at).toLocaleDateString('en-GB')}</div>
                <div>
                  {user.role !== 'admin' && (
                    <button 
                      className="btn-remove" 
                      onClick={() => handleDeleteUser(user.id)}
                      style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', height: 'auto' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
