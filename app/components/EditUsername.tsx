'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Props {
  userId: string
  username: string
  role?: string
  onUpdate?: (name: string) => void
}

export default function EditUsername({ userId, username, role, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(username)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!value.trim() || value === username) { setEditing(false); return }
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', userId), { username: value.trim() })
      localStorage.setItem('username', value.trim())
      onUpdate?.(value.trim())
      setEditing(false)
    } catch (e) {
      alert('Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(99,102,241,0.5)',
            borderRadius: '6px',
            padding: '5px 8px',
            fontSize: '13px',
            color: '#fff',
            fontFamily: 'inherit',
            fontWeight: 600,
            outline: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
          maxLength={32}
        />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1, padding: '4px', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '5px', color: '#a5b4fc', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {saving ? '...' : '✓'}
          </button>
          <button
            onClick={() => { setValue(username); setEditing(false) }}
            style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '5px', color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {username}
        </div>
        <button
          onClick={() => setEditing(true)}
          title="Edit name"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'rgba(255,255,255,0.2)', flexShrink: 0, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(165,180,252,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
        >
          <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
        </button>
      </div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{role || 'Artist'}</div>
    </div>
  )
}
