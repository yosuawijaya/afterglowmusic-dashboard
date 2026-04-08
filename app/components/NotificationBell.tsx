'use client'

import { useEffect, useState, useRef } from 'react'
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'approved' | 'rejected' | 'info' | 'update'
  read: boolean
  createdAt: any
}

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userId) return
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    const unsub = onSnapshot(q, snap => {
      const data: Notification[] = []
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as Notification))
      setNotifications(data)
    })
    return () => unsub()
  }, [userId])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  const markAllRead = async () => {
    const unreadOnes = notifications.filter(n => !n.read)
    await Promise.all(unreadOnes.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true })))
  }

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true })
  }

  const typeIcon = (type: string) => {
    if (type === 'approved') return { icon: '✓', color: '#10b981', bg: 'rgba(16,185,129,0.12)' }
    if (type === 'rejected') return { icon: '✕', color: '#f87171', bg: 'rgba(239,68,68,0.12)' }
    if (type === 'update') return { icon: '↑', color: '#818cf8', bg: 'rgba(99,102,241,0.12)' }
    return { icon: 'i', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  }

  const timeAgo = (ts: any) => {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        style={{
          position: 'relative',
          width: '34px', height: '34px',
          background: open ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
          color: open ? '#818cf8' : 'rgba(255,255,255,0.5)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '16px', height: '16px',
            background: '#ef4444',
            borderRadius: '50%',
            fontSize: '9px', fontWeight: 700, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-base, #080810)',
            fontFamily: 'inherit',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          top: (() => {
            const el = ref.current?.getBoundingClientRect()
            return el ? el.bottom + 8 : 60
          })(),
          right: (() => {
            const el = ref.current?.getBoundingClientRect()
            return el ? window.innerWidth - el.right : 16
          })(),
          width: '360px',
          background: '#0d0d1a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.08)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: '11px', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', margin: '0 auto 10px', opacity: 0.2 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const t = typeIcon(n.type)
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      display: 'flex', gap: '12px', alignItems: 'flex-start',
                      background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(99,102,241,0.04)')}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: t.bg, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                      {t.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: n.read ? 'rgba(255,255,255,0.6)' : '#fff', marginBottom: '2px' }}>{n.title}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.4' }}>{n.message}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '4px' }} />}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
