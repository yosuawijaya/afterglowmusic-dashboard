'use client'

import { useState, useRef, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface Props {
  userId: string
  username: string
  photoURL?: string
  size?: number
  onUpdate?: (url: string) => void
}

export default function AvatarUpload({ userId, username, photoURL, size = 34, onUpdate }: Props) {
  const [photo, setPhoto] = useState(photoURL || '')
  const [uploading, setUploading] = useState(false)
  const [hover, setHover] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync when photoURL prop changes (e.g. after Firestore onSnapshot updates)
  useEffect(() => {
    if (photoURL) setPhoto(photoURL)
  }, [photoURL])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setUploading(true)
    try {
      // 1. Upload to Vercel Blob via API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()

      if (!data.success) throw new Error(data.error || 'Upload failed')

      // 2. Update Firestore from client
      await updateDoc(doc(db, 'users', userId), {
        photoURL: data.url,
      })

      setPhoto(data.url)
      onUpdate?.(data.url)
    } catch (err: any) {
      console.error('Avatar upload failed:', err)
      alert('Failed to upload photo: ' + err.message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div
      style={{ position: 'relative', width: size, height: size, borderRadius: '50%', cursor: 'pointer', flexShrink: 0 }}
      onClick={() => !uploading && inputRef.current?.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {photo ? (
        <img src={photo} alt={username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff' }}>
          {username.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Hover / uploading overlay */}
      {(hover || uploading) && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {uploading ? (
            <div style={{ width: size * 0.35, height: size * 0.35, border: '2px solid rgba(255,255,255,0.25)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'avatarSpin 0.7s linear infinite' }} />
          ) : (
            <svg width={size * 0.38} height={size * 0.38} viewBox="0 0 20 20" fill="white">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
          )}
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
      <style>{`@keyframes avatarSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
