'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc, collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const PLATFORMS = [
  { name: 'Spotify',       logo: '/logos/spotify.png',       color: '#1DB954' },
  { name: 'Apple Music',   logo: '/logos/apple-music.png',   color: '#FA243C' },
  { name: 'YouTube Music', logo: '/logos/youtube-music.png', color: '#FF0000' },
  { name: 'Amazon Music',  logo: '/logos/amazon-music.png',  color: '#FF9900' },
  { name: 'Deezer',        logo: '/logos/deezer.png',        color: '#A238FF' },
  { name: 'Tidal',         logo: '/logos/tidal.png',         color: '#00E5FF' },
  { name: 'Pandora',       logo: '/logos/pandora.png',       color: '#224099' },
  { name: 'SoundCloud',    logo: '/logos/soundcloud.png',    color: '#FF5500' },
]

export default function PresavePage() {
  const params = useParams()
  const [release, setRelease] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'submissions', params.id as string))
        if (snap.exists()) {
          setRelease({ id: snap.id, ...snap.data() })
          const presavesSnap = await getDocs(query(
            collection(db, 'presaves'),
            where('releaseId', '==', snap.id)
          ))
          setCount(presavesSnap.size)
        }
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [params.id])

  const handlePresave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSaving(true)
    try {
      const existing = await getDocs(query(
        collection(db, 'presaves'),
        where('releaseId', '==', release.id),
        where('email', '==', email.toLowerCase())
      ))
      if (!existing.empty) { setAlreadySaved(true); setSaved(true); setSaving(false); return }
      await addDoc(collection(db, 'presaves'), {
        releaseId: release.id,
        releaseTitle: release.title,
        artist: release.artist,
        email: email.toLowerCase(),
        savedAt: serverTimestamp(),
        upc: release.upc || '',
        releaseDate: release.releaseDate || '',
      })
      setCount(c => c + 1)
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const releaseDate = release?.releaseDate ? new Date(release.releaseDate) : null
  const daysUntil = releaseDate
    ? Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#050508' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid rgba(255,255,255,0.08)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!release) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#050508', color:'rgba(255,255,255,0.4)', fontFamily:'Inter,sans-serif', fontSize:'14px' }}>
      Release not found.
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#050508', fontFamily:"'Inter',-apple-system,sans-serif", display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 16px', position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .presave-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 16px 48px rgba(99,102,241,0.55)!important}
        .presave-btn:disabled{opacity:0.5!important;cursor:not-allowed!important}
        .platform-row:hover{background:rgba(255,255,255,0.05)!important}
        .email-input:focus{border-color:rgba(99,102,241,0.6)!important;background:rgba(255,255,255,0.07)!important}
      `}</style>

      {/* Blurred bg */}
      {release.coverImage && (
        <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
          <img src={release.coverImage} alt="" style={{ position:'absolute', width:'100%', height:'100%', objectFit:'cover', filter:'blur(60px) saturate(1.8)', opacity:0.15, transform:'scale(1.1)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(5,5,8,0.5),rgba(5,5,8,0.9) 60%,#050508)' }}/>
        </div>
      )}

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'400px', animation:'fadeUp 0.5s ease-out' }}>

        <p style={{ textAlign:'center', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'2.5px', marginBottom:'24px' }}>
          Afterglow Music
        </p>

        {/* Cover */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'20px' }}>
          {release.coverImage
            ? <img src={release.coverImage} alt={release.title} style={{ width:'180px', height:'180px', objectFit:'cover', borderRadius:'14px', boxShadow:'0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)', display:'block' }}/>
            : <div style={{ width:'180px', height:'180px', background:'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'56px', border:'1px solid rgba(255,255,255,0.06)' }}>🎵</div>
          }
        </div>

        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:'16px' }}>
          <h1 style={{ fontSize:'26px', fontWeight:900, color:'#fff', letterSpacing:'-0.8px', lineHeight:1.1, marginBottom:'5px' }}>{release.title}</h1>
          <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.45)' }}>
            {release.artist}{release.featuringArtists ? ` feat. ${release.featuringArtists}` : ''}
          </p>
        </div>

        {/* Countdown */}
        {releaseDate && (
          <div style={{ display:'flex', justifyContent:'center', marginBottom:'20px' }}>
            {daysUntil !== null && daysUntil > 0 ? (
              <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', padding:'8px 18px', textAlign:'center' }}>
                <span style={{ fontSize:'22px', fontWeight:900, color:'#818cf8', letterSpacing:'-1px' }}>{daysUntil}</span>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginLeft:'6px' }}>days to go</span>
              </div>
            ) : (
              <div style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'8px', padding:'8px 18px' }}>
                <span style={{ fontSize:'13px', fontWeight:700, color:'#34d399' }}>
                  {daysUntil === 0 ? '🎉 Out Today!' : `Out ${releaseDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Count */}
        {count > 0 && (
          <p style={{ textAlign:'center', fontSize:'12px', color:'rgba(255,255,255,0.25)', marginBottom:'16px' }}>
            <strong style={{ color:'rgba(255,255,255,0.5)' }}>{count.toLocaleString()}</strong> {count === 1 ? 'person has' : 'people have'} pre-saved
          </p>
        )}

        {/* Form / Success */}
        {saved ? (
          <div style={{ background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'14px', padding:'28px 20px', textAlign:'center', marginBottom:'24px' }}>
            <div style={{ fontSize:'36px', marginBottom:'10px' }}>🎉</div>
            <h3 style={{ fontSize:'17px', fontWeight:800, color:'#34d399', marginBottom:'6px' }}>
              {alreadySaved ? 'Already saved!' : "You're on the list!"}
            </h3>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:'1.6' }}>
              {alreadySaved
                ? 'This email is already pre-saved for this release.'
                : `We'll notify you when "${release.title}" drops${releaseDate ? ` on ${releaseDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}` : ''}.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePresave} style={{ marginBottom:'24px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email to pre-save"
              required
              className="email-input"
              style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', fontSize:'14px', color:'#fff', fontFamily:'inherit', outline:'none', boxSizing:'border-box', marginBottom:'10px', transition:'all 0.2s' }}
            />
            <button type="submit" disabled={saving} className="presave-btn"
              style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'10px', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', transition:'all 0.25s', boxShadow:'0 8px 28px rgba(99,102,241,0.35)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              {saving ? 'Saving...' : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                  Pre-Save Now
                </>
              )}
            </button>
            <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.18)', marginTop:'8px' }}>
              One-time email notification on release day. No spam.
            </p>
          </form>
        )}

        {/* Platform list */}
        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden', marginBottom:'24px' }}>
          <p style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1.5px', padding:'12px 16px 8px', borderBottom:'1px solid rgba(255,255,255,0.04)', margin:0 }}>
            Available on
          </p>
          {PLATFORMS.map((p, i) => {
            const isSpotify = p.name === 'Spotify'
            return (
              <div key={p.name}
                className="platform-row"
                onClick={isSpotify ? () => { window.location.href = `/api/spotify/login?releaseId=${params.id}` } : undefined}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom: i < PLATFORMS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition:'background 0.15s', cursor: isSpotify ? 'pointer' : 'default' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'26px', height:'26px', borderRadius:'6px', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.06)' }}>
                    <img src={p.logo} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}
                      onError={e => {
                        e.currentTarget.style.display = 'none'
                        const dot = document.createElement('div')
                        dot.style.cssText = `width:10px;height:10px;border-radius:50%;background:${p.color}`
                        e.currentTarget.parentElement?.appendChild(dot)
                      }}
                    />
                  </div>
                  <span style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.7)' }}>{p.name}</span>
                </div>
                <span style={{ fontSize:'11px', color: isSpotify ? '#1DB954' : '#818cf8', fontWeight:700, display:'flex', alignItems:'center', gap:'4px' }}>
                  {isSpotify && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  )}
                  Pre-Save
                </span>
              </div>
            )
          })}
        </div>

        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.15)' }}>
          Powered by <strong style={{ color:'rgba(255,255,255,0.3)' }}>Afterglow Music</strong>
        </p>

      </div>
    </div>
  )
}
