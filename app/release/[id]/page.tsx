'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const STORES = [
  // Tier 1 — Major
  { name: 'Spotify',         color: '#1DB954', category: 'Streaming' },
  { name: 'Apple Music',     color: '#FA243C', category: 'Streaming' },
  { name: 'YouTube Music',   color: '#FF0000', category: 'Streaming' },
  { name: 'Amazon Music',    color: '#FF9900', category: 'Streaming' },
  { name: 'Deezer',          color: '#A238FF', category: 'Streaming' },
  { name: 'Tidal',           color: '#00E5FF', category: 'Streaming' },
  { name: 'Pandora',         color: '#224099', category: 'Streaming' },
  { name: 'SoundCloud',      color: '#FF5500', category: 'Streaming' },
  { name: 'iHeartRadio',     color: '#C6002B', category: 'Streaming' },
  { name: 'Shazam',          color: '#0088FF', category: 'Streaming' },
  { name: 'Napster',         color: '#a78bfa', category: 'Streaming' },
  { name: 'Qobuz',           color: '#6366f1', category: 'Streaming' },
  // Social
  { name: 'TikTok',          color: '#69C9D0', category: 'Social' },
  { name: 'Instagram',       color: '#E4405F', category: 'Social' },
  { name: 'Facebook',        color: '#1877F2', category: 'Social' },
  { name: 'Snapchat',        color: '#FFFC00', category: 'Social' },
  { name: 'Triller',         color: '#FF0050', category: 'Social' },
  // Asia
  { name: 'Anghami',         color: '#A20074', category: 'Asia & Regional' },
  { name: 'Boomplay',        color: '#FF6B00', category: 'Asia & Regional' },
  { name: 'JOOX',            color: '#00D9FF', category: 'Asia & Regional' },
  { name: 'KKBOX',           color: '#0E88EB', category: 'Asia & Regional' },
  { name: 'NetEase',         color: '#E60012', category: 'Asia & Regional' },
  { name: 'QQ Music',        color: '#31C27C', category: 'Asia & Regional' },
  { name: 'JioSaavn',        color: '#2BC5B4', category: 'Asia & Regional' },
  { name: 'Gaana',           color: '#E8352D', category: 'Asia & Regional' },
  { name: 'Wynk Music',      color: '#FF0055', category: 'Asia & Regional' },
  { name: 'Hungama',         color: '#D91E36', category: 'Asia & Regional' },
  { name: 'Melon',           color: '#00CD3C', category: 'Asia & Regional' },
  { name: 'Genie',           color: '#00A0E9', category: 'Asia & Regional' },
  { name: 'LINE MUSIC',      color: '#00B900', category: 'Asia & Regional' },
  { name: 'Yandex Music',    color: '#FFCC00', category: 'Asia & Regional' },
  // Niche
  { name: 'Audiomack',       color: '#FFA200', category: 'Niche' },
  { name: 'Bandcamp',        color: '#1DA0C3', category: 'Niche' },
  { name: 'Beatport',        color: '#94D500', category: 'Niche' },
  { name: 'Twitch',          color: '#9146FF', category: 'Niche' },
  { name: 'TuneIn',          color: '#14D8CC', category: 'Niche' },
  { name: 'Audioboom',       color: '#007BFF', category: 'Niche' },
  { name: 'Mixcloud',        color: '#52aad8', category: 'Niche' },
  { name: 'ReverbNation',    color: '#E1000F', category: 'Niche' },
]

const CATEGORIES = ['Streaming', 'Social', 'Asia & Regional', 'Niche']

export default function ReleaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [release, setRelease] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'submissions', params.id as string))
        if (snap.exists()) setRelease({ id: snap.id, ...snap.data() })
        else router.push('/dashboard')
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [params.id, router])

  const getStatus = (s: string) => ({
    pending:  { label: 'Under Review',      color: '#fbbf24', glow: 'rgba(251,191,36,0.3)',  desc: 'Being reviewed by our team' },
    approved: { label: 'Approved & Live',   color: '#34d399', glow: 'rgba(52,211,153,0.3)',  desc: 'Distributed to all platforms' },
    rejected: { label: 'Needs Revision',    color: '#f87171', glow: 'rgba(248,113,113,0.3)', desc: 'Check your email for details' },
    live:     { label: 'Live on Stores',    color: '#818cf8', glow: 'rgba(99,102,241,0.3)',  desc: 'Available worldwide' },
  }[s] || { label: 'Unknown', color: '#6b7280', glow: 'transparent', desc: '' })

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#050508' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid rgba(255,255,255,0.08)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!release) return null
  const st = getStatus(release.status)
  const isActive = release.status === 'approved' || release.status === 'live'

  const submittedDate = release.submittedAt?.toDate
    ? new Date(release.submittedAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A'
  const releaseDate = release.releaseDate
    ? new Date(release.releaseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD'

  return (
    <div style={{ minHeight:'100vh', background:'#050508', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .sc:hover{background:rgba(255,255,255,0.05)!important;transform:translateY(-1px)}
        .sc{transition:all 0.15s ease!important}
        .back-btn:hover{background:rgba(255,255,255,0.08)!important}
      `}</style>

      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(5,5,8,0.85)', backdropFilter:'blur(24px)', padding:'0 32px', height:'56px', display:'flex', alignItems:'center', gap:'12px' }}>
        <button className="back-btn" onClick={() => router.push('/dashboard')}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:'13px', display:'flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'8px', fontFamily:'inherit', transition:'all 0.15s' }}>
          <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
          Dashboard
        </button>
        <span style={{ color:'rgba(255,255,255,0.15)', fontSize:'13px' }}>/</span>
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'13px', maxWidth:'300px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{release.title}</span>
      </nav>

      <div style={{ maxWidth:'960px', margin:'0 auto', padding:'48px 24px', animation:'fadeUp 0.5s ease-out' }}>

        {/* ── HERO ── */}
        <div style={{ display:'flex', gap:'40px', alignItems:'flex-start', marginBottom:'40px' }}>
          {/* Cover */}
          <div style={{ flexShrink:0, position:'relative' }}>
            {release.coverImage
              ? <img src={release.coverImage} alt={release.title} style={{ width:'200px', height:'200px', objectFit:'cover', borderRadius:'14px', display:'block', boxShadow:'0 32px 64px rgba(0,0,0,0.7)' }} />
              : <div style={{ width:'200px', height:'200px', background:'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'56px', border:'1px solid rgba(255,255,255,0.06)' }}>🎵</div>
            }
            {/* Status dot on cover */}
            <div style={{ position:'absolute', bottom:'10px', right:'10px', width:'12px', height:'12px', borderRadius:'50%', background:st.color, boxShadow:`0 0 10px ${st.glow}`, border:'2px solid #050508' }} />
          </div>

          {/* Info */}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'10px' }}>
              {release.format} · {release.genre}{release.subgenre ? ` · ${release.subgenre}` : ''}
            </div>
            <h1 style={{ fontSize:'38px', fontWeight:900, letterSpacing:'-1.5px', lineHeight:1.05, marginBottom:'8px', color:'#fff', wordBreak:'break-word' }}>
              {release.title}
            </h1>
            <p style={{ fontSize:'17px', color:'rgba(255,255,255,0.45)', marginBottom:'24px', fontWeight:400 }}>
              {release.artist}{release.featuringArtists ? ` feat. ${release.featuringArtists}` : ''}
            </p>

            {/* Status badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'10px 18px', background:`${st.color}12`, border:`1px solid ${st.color}30`, borderRadius:'10px', marginBottom:'28px' }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:st.color, boxShadow:`0 0 8px ${st.glow}`, animation: release.status === 'pending' ? 'pulse 2s infinite' : 'none' }} />
              <div>
                <div style={{ fontWeight:700, color:st.color, fontSize:'13px' }}>{st.label}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'1px' }}>{st.desc}</div>
              </div>
            </div>

            {/* Meta pills */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {[
                { icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/></svg>, label: releaseDate },
                { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>, label: 'Worldwide · 240 territories' },
                { icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>, label: `${release.tracks} track${release.tracks > 1 ? 's' : ''}` },
                { icon: <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>, label: `Submitted ${submittedDate}` },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', fontSize:'12px', color:'rgba(255,255,255,0.55)', fontWeight:500 }}>
                  <span style={{ color:'rgba(255,255,255,0.35)', display:'flex', alignItems:'center' }}>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRACK LIST ── */}
        {release.trackDetails?.length > 0 && (
          <section style={{ marginBottom:'28px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
              <h2 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Tracklist</h2>
              <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.2)' }}>{release.trackDetails.length} track{release.trackDetails.length > 1 ? 's' : ''}</span>
            </div>
            <div style={{ background:'#0c0c14', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'14px', overflow:'hidden' }}>
              {release.trackDetails.map((track: any, i: number) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 20px', borderBottom: i < release.trackDetails.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#818cf8', flexShrink:0 }}>{i + 1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:'14px', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                    <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>{track.artist || release.artist}</div>
                  </div>
                  {track.isrc && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', fontFamily:'monospace', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:'4px' }}>{track.isrc}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── DISTRIBUTION ── */}
        <section>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
            <h2 style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1.5px' }}>Distribution</h2>
            <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
              {release.claimYoutubeOAC && (
                <span style={{ fontSize:'11px', fontWeight:700, color:'#fbbf24', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', padding:'4px 10px', borderRadius:'6px' }}>✓ YouTube OAC</span>
              )}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: isActive ? '#34d399' : 'rgba(255,255,255,0.2)', boxShadow: isActive ? '0 0 6px #34d399' : 'none' }} />
                {isActive ? (release.status === 'live' ? 'Live' : 'Processing') : 'Pending approval'}
              </div>
            </div>
          </div>

          {CATEGORIES.map(cat => {
            const stores = STORES.filter(s => s.category === cat)
            return (
              <div key={cat} style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'10px', paddingLeft:'2px' }}>{cat}</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {stores.map(store => (
                    <a key={store.name} href="#" onClick={e => e.preventDefault()} className="sc"
                      style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', textDecoration:'none', cursor:'default' }}>
                      {/* Color dot */}
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', background: isActive ? store.color : 'rgba(255,255,255,0.15)', flexShrink:0, boxShadow: isActive ? `0 0 6px ${store.color}80` : 'none', transition:'all 0.2s' }} />
                      <span style={{ fontSize:'12px', fontWeight:600, color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)', whiteSpace:'nowrap' }}>{store.name}</span>
                      {isActive && (
                        <span style={{ fontSize:'9px', fontWeight:700, color: release.status === 'live' ? '#34d399' : '#fbbf24', background: release.status === 'live' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)', padding:'2px 6px', borderRadius:'4px', marginLeft:'2px' }}>
                          {release.status === 'live' ? 'LIVE' : 'PROCESSING'}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}

          <div style={{ marginTop:'24px', padding:'16px 20px', background:'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'10px', display:'flex', alignItems:'center', gap:'12px' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="#818cf8" style={{ flexShrink:0 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
            <p style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:'1.5', margin:0 }}>
              Your release is being distributed to <strong style={{ color:'rgba(255,255,255,0.6)' }}>120+ stores & platforms</strong> across 240 territories worldwide. Processing typically takes 3–5 business days after approval.
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
