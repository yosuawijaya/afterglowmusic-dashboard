'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export function useUsername() {
  const [username, setUsername] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('username') || '' : ''
  )

  useEffect(() => {
    const uid = localStorage.getItem('userId')
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const name = snap.data().username || ''
        setUsername(name)
        localStorage.setItem('username', name)
      }
    })
    return () => unsub()
  }, [])

  return username
}
