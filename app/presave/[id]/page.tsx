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
  { name: 'SoundCloud',    logo: '/logos/soundcloud.png',    color: '#FF5500' },
  { name: 'TikTok',        logo: '/logos/tiktok.png',        color: '#69C9D0' },
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
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'submissions', params.id as string))
        if (snap.exists()) {
          setRelease({ id: snap.id, ...snap.data() })
          const presavesSnap = await getDocs(query(collection(db, 'presaves'), where('releaseId', '==', snap.id)))
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
      const existing = await getDocs(query(collection(db, 'presaves'), where('releaseId', '==', release.id), where('email', '==', email.toLowerCase())))
      if (!existing.empty) { setAlreadySaved(true); setSaved(true); setSaving(false); return }
      await addDoc(collection(db, 'presaves'), {
        releaseId: release.id, releaseTitle: release.title, artist: release.artist,
        email: email.toLowerCase(), savedAt: serverTimestamp(),
        upc: release.upc || '', releaseDate: release.releaseDate || '',
      })
      setCount(c => c + 1)
      setSaved(true)
    } catch (e) { console.error(e) }
    finally { setSaving(false) }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: `${release.title} — Pre-Save`, text: `Pre-save "${release.title}" by ${release.artist}`, url: shareUrl })
    } else {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const releaseDate = release?.releaseDate ? new Date(release.releaseDate) : null
  const daysUntil = releaseDate ? Math.ceil((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

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
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .presave-btn:hover:not(:disabled){transform:translateY(-2px)!important;box-shadow:0 20px 56px rgba(99,102,241,0.6)!important}
        .presave-btn:active:not(:disabled){transform:translateY(0)!important}
        .presave-btn:disabled{opacity:0.5!important;cursor:not-allowed!important}
        .platform-pill:hover{background:rgba(255,255,255,0.07)!important;transform:translateY(-1px)}
        .email-input:focus{border-color:rgba(99,102,241,0.6)!important;background:rgba(99,102,241,0.06)!important;outline:none}
        .share-btn:hover{background:rgba(255,255,255,0.1)!important}
      `}</style>

      {/* Blurred bg from cover */}
      {release.coverImage && (
        <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden' }}>
          <img src={release.coverImage} alt="" style={{ position:'absolute', width:'100%', height:'100%', objectFit:'cover', filter:'blur(80px) saturate(2)', opacity:0.18, transform:'scale(1.15)' }}/>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,rgba(5,5,8,0.4),rgba(5,5,8,0.85) 50%,#050508)' }}/>
        </div>
      )}

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px', animation:'fadeUp 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>

        {/* Label badge */}
        <div style={{ textAlign:'center', marginBottom:'28px' }}>
          <img src="/logos/logo-afterglowmusic.png" alt="Afterglow Music" style={{ height:'28px', objectFit:'contain', opacity:0.7 }} />
        </div>

        {/* Cover art */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:'22px', position:'relative' }}>
          <div style={{ position:'relative' }}>
            {release.coverImage
              ? <img src={release.coverImage} alt={release.title} style={{ width:'200px', height:'200px', objectFit:'cover', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.07)', display:'block' }}/>
              : <div style={{ width:'200px', height:'200px', background:'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>
                </div>
            }
            {/* Genre badge */}
            {release.genre && (
              <div style={{ position:'absolute', bottom:'-10px', left:'50%', transform:'translateX(-50%)', background:'rgba(10,10,20,0.95)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', padding:'4px 12px', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.6)', whiteSpace:'nowrap', backdropFilter:'blur(10px)' }}>
                {release.format} · {release.genre}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign:'center', marginBottom:'20px', marginTop:'16px' }}>
          <h1 style={{ fontSize:'28px', fontWeight:900, color:'#fff', letterSpacing:'-0.8px', lineHeight:1.1, marginBottom:'6px' }}>{release.title}</h1>
          <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.45)', fontWeight:500 }}>
            {release.artist}{release.featuringArtists ? <span style={{ color:'rgba(255,255,255,0.25)' }}> feat. {release.featuringArtists}</span> : ''}
          </p>
        </div>

        {/* Countdown + presave count */}
        <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'22px', flexWrap:'wrap' }}>
          {releaseDate && daysUntil !== null && (
            daysUntil > 0 ? (
              <div style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)', borderRadius:'10px', padding:'10px 20px', textAlign:'center' }}>
                <div style={{ fontSize:'26px', fontWeight:900, color:'#818cf8', letterSpacing:'-1px', lineHeight:1 }}>{daysUntil}</div>
                <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginTop:'2px' }}>days to go</div>
              </div>
            ) : (
              <div style={{ background:'rgba(52,211,153,0.1)', border:'1px solid rgba(52,211,153,0.25)', borderRadius:'10px', padding:'10px 20px', textAlign:'center' }}>
                <div style={{ fontSize:'14px', fontWeight:800, color:'#34d399' }}>{daysUntil === 0 ? 'Out Today' : `Out ${releaseDate.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`}</div>
              </div>
            )
          )}
          {count > 0 && (
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'10px 20px', textAlign:'center' }}>
              <div style={{ fontSize:'26px', fontWeight:900, color:'rgba(255,255,255,0.8)', letterSpacing:'-1px', lineHeight:1 }}>{count.toLocaleString()}</div>
              <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginTop:'2px' }}>pre-saves</div>
            </div>
          )}
        </div>

        {/* Form / Success */}
        {saved ? (
          <div style={{ background:'rgba(52,211,153,0.07)', border:'1px solid rgba(52,211,153,0.2)', borderRadius:'16px', padding:'28px 24px', textAlign:'center', marginBottom:'20px' }}>
            <div style={{ fontSize:'32px', marginBottom:'12px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize:'18px', fontWeight:800, color:'#34d399', marginBottom:'8px' }}>
              {alreadySaved ? 'Already saved!' : "You're on the list!"}
            </h3>
            <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.45)', lineHeight:'1.7', marginBottom:'16px' }}>
              {alreadySaved
                ? 'This email is already pre-saved for this release.'
                : `We'll notify you when "${release.title}" drops${releaseDate ? ` on ${releaseDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}` : ''}.`}
            </p>
            {/* Share button */}
            <button onClick={handleShare} className="share-btn"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'10px 20px', color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:'7px', transition:'all 0.2s' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>
              {copied ? 'Link copied!' : 'Share with friends'}
            </button>
          </div>
        ) : (
          <form onSubmit={handlePresave} style={{ marginBottom:'20px' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email to pre-save" required className="email-input"
              style={{ width:'100%', padding:'14px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', fontSize:'15px', color:'#fff', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'10px', transition:'all 0.2s' }}
            />
            <button type="submit" disabled={saving} className="presave-btn"
              style={{ width:'100%', padding:'15px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:800, cursor:'pointer', fontFamily:'inherit', transition:'all 0.25s', boxShadow:'0 10px 32px rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', letterSpacing:'-0.2px' }}>
              {saving
                ? <><div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/> Saving...</>
                : <><svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg> Pre-Save Now</>
              }
            </button>
            <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.18)', marginTop:'8px' }}>
              One-time notification on release day. No spam, ever.
            </p>
          </form>
        )}

        {/* Platform pills */}
        <div style={{ marginBottom:'28px' }}>
          <p style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1.5px', textAlign:'center', marginBottom:'12px' }}>
            Coming to all platforms
          </p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
            {PLATFORMS.map(p => (
              <div key={p.name} className="platform-pill"
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'6px 12px', transition:'all 0.18s', cursor:'default' }}>
                <div style={{ width:'16px', height:'16px', borderRadius:'4px', overflow:'hidden', flexShrink:0 }}>
                  <img src={p.logo} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'contain' }}
                    onError={e => { e.currentTarget.style.display='none' }}
                  />
                </div>
                <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.5)' }}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Share link */}
        {!saved && (
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <button onClick={handleShare} className="share-btn"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', padding:'9px 18px', color:'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:'6px', transition:'all 0.2s' }}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z"/></svg>
              {copied ? '✓ Link copied!' : 'Share this release'}
            </button>
          </div>
        )}

        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.12)' }}>
          Distributed by <strong style={{ color:'rgba(255,255,255,0.25)' }}>Afterglow Music</strong>
        </p>
      </div>
    </div>
  )
}
