'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const STORES = [
  { name: 'Spotify', color: '#1DB954', category: 'Streaming' },
  { name: 'Apple Music', color: '#FA243C', category: 'Streaming' },
  { name: 'YouTube Music', color: '#FF0000', category: 'Streaming' },
  { name: 'Amazon Music', color: '#FF9900', category: 'Streaming' },
  { name: 'Deezer', color: '#A238FF', category: 'Streaming' },
  { name: 'Tidal', color: '#00E5FF', category: 'Streaming' },
  { name: 'Pandora', color: '#224099', category: 'Streaming' },
  { name: 'SoundCloud', color: '#FF5500', category: 'Streaming' },
  { name: 'iHeartRadio', color: '#C6002B', category: 'Streaming' },
  { name: 'Shazam', color: '#0088FF', category: 'Streaming' },
  { name: 'Napster', color: '#a78bfa', category: 'Streaming' },
  { name: 'Qobuz', color: '#6366f1', category: 'Streaming' },
  { name: 'TikTok', color: '#69C9D0', category: 'Social' },
  { name: 'Instagram', color: '#E4405F', category: 'Social' },
  { name: 'Facebook', color: '#1877F2', category: 'Social' },
  { name: 'Snapchat', color: '#FFFC00', category: 'Social' },
  { name: 'Anghami', color: '#A20074', category: 'Asia & Regional' },
  { name: 'Boomplay', color: '#FF6B00', category: 'Asia & Regional' },
  { name: 'JOOX', color: '#00D9FF', category: 'Asia & Regional' },
  { name: 'KKBOX', color: '#0E88EB', category: 'Asia & Regional' },
  { name: 'JioSaavn', color: '#2BC5B4', category: 'Asia & Regional' },
  { name: 'Audiomack', color: '#FFA200', category: 'Niche' },
  { name: 'Beatport', color: '#94D500', category: 'Niche' },
  { name: 'Twitch', color: '#9146FF', category: 'Niche' },
]
const CATEGORIES = ['Streaming', 'Social', 'Asia & Regional', 'Niche']

export default function ReleaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [release, setRelease] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [presaveCount, setPresaveCount] = useState(0)
  const [activeSection, setActiveSection] = useState<'overview'|'tracks'|'distribution'|'credits'>('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'submissions', params.id as string))
        if (snap.exists()) {
          setRelease({ id: snap.id, ...snap.data() })
          const ps = await getDocs(query(collection(db, 'presaves'), where('releaseId', '==', snap.id)))
          setPresaveCount(ps.size)
        } else router.push('/dashboard')
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [params.id, router])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#05050d' }}>
      <div style={{ width:'36px', height:'36px', border:'3px solid rgba(255,255,255,0.08)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (!release) return null

  const STATUS: any = {
    pending:  { label:'Under Review',    color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)',  desc:'Our team is reviewing your release' },
    approved: { label:'Approved & Live', color:'#10b981', bg:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.25)',  desc:'Distributed to all platforms' },
    rejected: { label:'Needs Revision',  color:'#f87171', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)',   desc:'Check your email for details' },
  }
  const st = STATUS[release.status] || { label:'Unknown', color:'#6b7280', bg:'rgba(107,114,128,0.1)', border:'rgba(107,114,128,0.25)', desc:'' }
  const isActive = release.status === 'approved' || release.status === 'live'
  const submittedDate = release.submittedAt?.toDate ? new Date(release.submittedAt.toDate()).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : 'N/A'
  const releaseDate = release.releaseDate ? new Date(release.releaseDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : 'TBD'

  const timelineSteps = [
    { label:'Submitted',    desc:`Received on ${submittedDate}`, done:true, color:'#10b981' },
    { label:'Under Review', desc:release.status==='pending'?'Our team is reviewing your release':'Review complete', done:release.status!=='pending', active:release.status==='pending', color:release.status==='rejected'?'#f87171':'#10b981' },
    { label:release.status==='rejected'?'Revision Required':'Approved', desc:release.status==='rejected'?(release.rejectionReason||'Check your email'):release.status==='approved'||release.status==='live'?'Release approved by label':'Pending approval', done:release.status==='approved'||release.status==='live', rejected:release.status==='rejected', color:release.status==='rejected'?'#f87171':'#10b981' },
    { label:'Distributing', desc:release.status==='approved'?'Sending to 120+ platforms (3–5 business days)':'Awaiting approval', done:release.status==='live', active:release.status==='approved', color:'#818cf8' },
    { label:'Live on Stores', desc:release.status==='live'?`Available worldwide · ${releaseDate}`:`Target: ${releaseDate}`, done:release.status==='live', color:'#818cf8' },
  ]

  const sections = [
    { id:'overview', label:'Overview' },
    { id:'tracks', label:`Tracks (${release.trackDetails?.length||0})` },
    { id:'distribution', label:'Distribution' },
    { id:'credits', label:'Credits' },
  ]

  const card = { background:'#0a0a15', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'14px' }
  const sectionLabel = { fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase' as const, letterSpacing:'1.5px' }

  return (
    <div style={{ minHeight:'100vh', background:'#05050d', color:'#fff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .stab:hover{color:rgba(255,255,255,0.75)!important}
        .sc:hover{background:rgba(255,255,255,0.06)!important}
        .sc{transition:background 0.15s!important}
        .qa:hover{opacity:0.8!important}
        .qa{transition:opacity 0.2s!important}
      `}</style>

      {/* ── MAIN ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:'100vh', width:'100%' }}>

        {/* Topbar */}
        <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(5,5,13,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 28px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px' }}>
            <span onClick={() => router.push('/dashboard')} style={{ color:'rgba(255,255,255,0.35)', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(255,255,255,0.65)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,0.35)')}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
              Dashboard
            </span>
            <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
            <span style={{ color:'rgba(255,255,255,0.65)', fontWeight:600, maxWidth:'320px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{release.title}</span>
          </div>
          <button onClick={() => router.push(`/new-release?edit=${release.id}`)}
            style={{ padding:'7px 16px', background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', color:'#a5b4fc', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}
            onMouseEnter={e=>(e.currentTarget.style.background='rgba(99,102,241,0.2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='rgba(99,102,241,0.12)')}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
            Edit Release
          </button>
          <button onClick={() => { const url = `${window.location.origin}/presave/${release.id}`; navigator.clipboard.writeText(url).then(() => alert('Pre-save link copied!')) }}
            style={{ padding:'7px 14px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/><path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/></svg>
            Share
          </button>
          {release.coverImage && (
            <a href={release.coverImage} download={`${release.title}-cover.jpg`} target="_blank" rel="noopener noreferrer"
              style={{ padding:'7px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', borderRadius:'8px', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px', textDecoration:'none' }}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
              Cover Art
            </a>
          )}        </div>

        {/* Hero */}
        <div style={{ padding:'24px 28px 0', animation:'fadeUp 0.4s ease-out', flexShrink:0 }}>
          <div style={{ display:'flex', gap:'28px', alignItems:'flex-start' }}>
            {/* Cover */}
            <div style={{ flexShrink:0, position:'relative' }}>
              {release.coverImage
                ? <img src={release.coverImage} alt={release.title} style={{ width:'160px', height:'160px', objectFit:'cover', borderRadius:'12px', display:'block', boxShadow:'0 20px 50px rgba(0,0,0,0.6)' }}/>
                : <div style={{ width:'160px', height:'160px', background:'linear-gradient(135deg,#1a1a2e,#16213e)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>
                  </div>
              }
              <div style={{ position:'absolute', bottom:'8px', right:'8px', width:'10px', height:'10px', borderRadius:'50%', background:st.color, boxShadow:`0 0 10px ${st.color}`, border:'2px solid #05050d' }}/>
            </div>
            {/* Info */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'2px', marginBottom:'8px' }}>
                {release.format} · {release.genre}{release.subgenre?` · ${release.subgenre}`:''}
              </div>
              <h1 style={{ fontSize:'32px', fontWeight:900, letterSpacing:'-1.2px', lineHeight:1.05, marginBottom:'6px', color:'#fff', wordBreak:'break-word' }}>{release.title}</h1>
              <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.45)', marginBottom:'16px' }}>
                {release.artist}{release.featuringArtists?` feat. ${release.featuringArtists}`:''}
              </p>
              {/* Status */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', padding:'8px 14px', background:st.bg, border:`1px solid ${st.border}`, borderRadius:'10px', marginBottom:'16px' }}>
                <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:st.color, boxShadow:`0 0 8px ${st.color}`, animation:release.status==='pending'?'pulse 2s infinite':'none' }}/>
                <div>
                  <div style={{ fontWeight:700, color:st.color, fontSize:'13px' }}>{st.label}</div>
                  <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'1px' }}>{st.desc}</div>
                </div>
              </div>
              {/* Meta pills */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
                {[
                  { label:releaseDate },
                  { label:'Worldwide · 240 territories' },
                  { label:`${release.tracks||0} track${(release.tracks||0)!==1?'s':''}` },
                  { label:`Submitted ${submittedDate}` },
                  ...(release.upc?[{label:`UPC: ${release.upc}`}]:[]),
                  ...(presaveCount>0?[{label:`${presaveCount} pre-saves`}]:[]),
                ].map(({label}) => (
                  <div key={label} style={{ padding:'4px 11px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', fontSize:'12px', color:'rgba(255,255,255,0.5)' }}>{label}</div>
                ))}
              </div>
            </div>
          </div>
          {/* Section tabs */}
          <div style={{ display:'flex', marginTop:'24px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
            {sections.map(s => (
              <button key={s.id} className="stab"
                onClick={() => setActiveSection(s.id as any)}
                style={{ padding:'11px 18px', background:'none', border:'none', borderBottom:`2px solid ${activeSection===s.id?'#6366f1':'transparent'}`, color:activeSection===s.id?'#a5b4fc':'rgba(255,255,255,0.4)', fontSize:'13px', fontWeight:activeSection===s.id?700:500, cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', whiteSpace:'nowrap' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section content — fills remaining space */}
        <div style={{ flex:1, padding:'20px 28px 28px', overflow:'auto' }}>

          {/* ── OVERVIEW ── */}
          {activeSection === 'overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'16px', height:'100%' }}>
              {/* Left */}
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {/* Timeline */}
                <div style={{ ...card, padding:'20px' }}>
                  <div style={{ ...sectionLabel, marginBottom:'18px' }}>Delivery Timeline</div>
                  <div style={{ display:'flex', alignItems:'flex-start' }}>
                    {timelineSteps.map((step:any, i) => (
                      <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                        {i < timelineSteps.length-1 && <div style={{ position:'absolute', top:'13px', left:'50%', width:'100%', height:'2px', background:step.done?step.color:'rgba(255,255,255,0.06)', zIndex:0 }}/>}
                        <div style={{ width:'26px', height:'26px', borderRadius:'50%', background:step.done||step.active?`${step.color}18`:'rgba(255,255,255,0.04)', border:`2px solid ${step.done||step.active?step.color:'rgba(255,255,255,0.1)'}`, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1, position:'relative', flexShrink:0 }}>
                          {step.done ? <svg width="10" height="10" viewBox="0 0 20 20" fill={step.color}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          : step.rejected ? <svg width="9" height="9" viewBox="0 0 20 20" fill="#f87171"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                          : step.active ? <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:step.color, animation:'pulse 2s infinite' }}/>
                          : <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.2)' }}>{i+1}</span>}
                        </div>
                        <div style={{ marginTop:'8px', textAlign:'center', padding:'0 3px' }}>
                          <div style={{ fontSize:'11px', fontWeight:700, color:step.done||step.active?'#fff':'rgba(255,255,255,0.3)', marginBottom:'2px' }}>{step.label}</div>
                          <div style={{ fontSize:'10px', color:step.rejected?'#f87171':'rgba(255,255,255,0.3)', lineHeight:1.4 }}>{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Release details grid */}
                <div style={{ ...card, overflow:'hidden' }}>
                  <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', ...sectionLabel }}>Release Details</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr' }}>
                    {[
                      { label:'Label', value:'Afterglow Music' },
                      { label:'Format', value:release.format },
                      { label:'Genre', value:`${release.genre}${release.subgenre?` · ${release.subgenre}`:''}` },
                      { label:'Price Tier', value:release.price==='premium'?'Premium':release.price==='budget'?'Budget':'Standard' },
                      { label:'Territories', value:release.territories==='worldwide'?'Worldwide (240)':'Selected' },
                      { label:'Tracks', value:`${release.tracks||0} track${(release.tracks||0)!==1?'s':''}` },
                      { label:'Release Date', value:releaseDate },
                      { label:'Submitted', value:submittedDate },
                      { label:'UPC', value:release.upc||'Pending assignment' },
                    ].map(({label,value}) => (
                      <div key={label} style={{ padding:'12px 16px', borderBottom:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'4px' }}>{label}</div>
                        <div style={{ fontSize:'13px', fontWeight:600, color:'rgba(255,255,255,0.8)' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracklist */}
                {release.trackDetails?.length > 0 && (
                  <div style={{ ...card, overflow:'hidden' }}>
                    <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ ...sectionLabel }}>Tracklist</div>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>{release.trackDetails.length} track{release.trackDetails.length!==1?'s':''}</span>
                    </div>
                    {release.trackDetails.map((track:any, i:number) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'11px 18px', borderBottom:i<release.trackDetails.length-1?'1px solid rgba(255,255,255,0.04)':'none', transition:'background 0.15s' }}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                        <span style={{ width:'24px', height:'24px', borderRadius:'50%', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#818cf8', flexShrink:0 }}>{i+1}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:'13px', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.35)', marginTop:'1px' }}>{track.artist||release.artist}</div>
                        </div>
                        {track.isrc && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.2)', fontFamily:'monospace', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>{track.isrc}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right */}
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {/* Pre-save */}
                <div style={{ ...card, padding:'20px' }}>
                  <div style={{ ...sectionLabel, marginBottom:'14px' }}>Promotion</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:'10px', marginBottom:'12px' }}>
                    <div style={{ width:'42px', height:'42px', background:'rgba(99,102,241,0.15)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="#a5b4fc"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize:'26px', fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>{presaveCount.toLocaleString()}</div>
                      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'2px' }}>Pre-saves collected</div>
                    </div>
                  </div>
                  {release.spotifyUrl && (
                    <a href={release.spotifyUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', background:'rgba(29,185,84,0.08)', border:'1px solid rgba(29,185,84,0.2)', borderRadius:'8px', textDecoration:'none', marginBottom:'8px' }}>
                      <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#1DB954', flexShrink:0 }}/>
                      <span style={{ fontSize:'13px', color:'#1DB954', fontWeight:600, flex:1 }}>Spotify Artist Profile</span>
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="#1DB954"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/></svg>
                    </a>
                  )}
                  {release.appleMusicUrl && (
                    <a href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 12px', background:'rgba(250,36,60,0.08)', border:'1px solid rgba(250,36,60,0.2)', borderRadius:'8px', textDecoration:'none' }}>
                      <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#FA243C', flexShrink:0 }}/>
                      <span style={{ fontSize:'13px', color:'#FA243C', fontWeight:600, flex:1 }}>Apple Music Profile</span>
                      <svg width="10" height="10" viewBox="0 0 20 20" fill="#FA243C"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/></svg>
                    </a>
                  )}
                </div>

                {/* Distribution summary */}
                <div style={{ ...card, padding:'20px' }}>
                  <div style={{ ...sectionLabel, marginBottom:'12px' }}>Distribution</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
                    <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:isActive?'#10b981':'rgba(255,255,255,0.2)', boxShadow:isActive?'0 0 8px #10b981':'none' }}/>
                    <span style={{ fontSize:'13px', color:isActive?'#10b981':'rgba(255,255,255,0.4)', fontWeight:600 }}>
                      {isActive?(release.status==='live'?'Live on all platforms':'Processing — 3–5 days'):'Pending approval'}
                    </span>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', marginBottom:'12px' }}>
                    {STORES.slice(0,9).map(store => (
                      <div key={store.name} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 9px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px' }}>
                        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:isActive?store.color:'rgba(255,255,255,0.15)' }}/>
                        <span style={{ fontSize:'11px', color:isActive?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.3)', fontWeight:500 }}>{store.name}</span>
                      </div>
                    ))}
                    <div style={{ padding:'4px 9px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>+{STORES.length-9} more</div>
                  </div>
                  <button onClick={() => setActiveSection('distribution')} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', color:'rgba(255,255,255,0.4)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'background 0.2s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.07)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}>
                    View all {STORES.length} platforms →
                  </button>
                </div>

                {/* Quick actions */}
                <div style={{ ...card, padding:'20px' }}>
                  <div style={{ ...sectionLabel, marginBottom:'12px' }}>Quick Actions</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[
                      { label:'Edit Release', color:'#a5b4fc', bg:'rgba(99,102,241,0.1)', border:'rgba(99,102,241,0.2)', action:() => router.push(`/new-release?edit=${release.id}`) },
                      { label:'Copy Pre-save Link', color:'#10b981', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.18)', action:() => navigator.clipboard.writeText(`${window.location.origin}/presave/${release.id}`) },
                      { label:'Back to Dashboard', color:'rgba(255,255,255,0.5)', bg:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.07)', action:() => router.push('/dashboard') },
                    ].map(btn => (
                      <button key={btn.label} className="qa" onClick={btn.action} style={{ padding:'10px 14px', background:btn.bg, border:`1px solid ${btn.border}`, borderRadius:'8px', color:btn.color, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TRACKS ── */}
          {activeSection === 'tracks' && (
            <div>
              {!release.trackDetails?.length ? (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>No track details available.</p>
              ) : (
                <div style={{ ...card, overflow:'hidden' }}>
                  {release.trackDetails.map((track:any, i:number) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'16px', padding:'14px 20px', borderBottom:i<release.trackDetails.length-1?'1px solid rgba(255,255,255,0.04)':'none', transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                      <span style={{ width:'28px', height:'28px', borderRadius:'50%', background:'rgba(99,102,241,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'#818cf8', flexShrink:0 }}>{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:'14px', color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{track.title}</div>
                        <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.35)', marginTop:'2px' }}>{track.artist||release.artist}</div>
                      </div>
                      <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                        {track.isrc && <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.25)', fontFamily:'monospace', background:'rgba(255,255,255,0.04)', padding:'3px 8px', borderRadius:'4px', border:'1px solid rgba(255,255,255,0.06)' }}>{track.isrc}</span>}
                        {track.composer && <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>by {track.composer}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DISTRIBUTION ── */}
          {activeSection === 'distribution' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
                <div>
                  <h2 style={{ fontSize:'16px', fontWeight:800, color:'#fff', marginBottom:'4px' }}>Distribution Status</h2>
                  <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)' }}>120+ stores across 240 territories</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:isActive?'#10b981':'rgba(255,255,255,0.2)', boxShadow:isActive?'0 0 8px #10b981':'none' }}/>
                  <span style={{ fontSize:'12px', color:isActive?'#10b981':'rgba(255,255,255,0.3)', fontWeight:600 }}>
                    {isActive?(release.status==='live'?'Live on all platforms':'Processing — 3–5 business days'):'Pending approval'}
                  </span>
                </div>
              </div>
              {CATEGORIES.map(cat => (
                <div key={cat} style={{ marginBottom:'20px' }}>
                  <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:'10px' }}>{cat}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {STORES.filter(s => s.category===cat).map(store => (
                      <div key={store.name} className="sc" style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px' }}>
                        <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:isActive?store.color:'rgba(255,255,255,0.15)', flexShrink:0, boxShadow:isActive?`0 0 6px ${store.color}80`:'none' }}/>
                        <span style={{ fontSize:'12px', fontWeight:600, color:isActive?'rgba(255,255,255,0.75)':'rgba(255,255,255,0.35)' }}>{store.name}</span>
                        {isActive && <span style={{ fontSize:'9px', fontWeight:700, color:release.status==='live'?'#10b981':'#f59e0b', background:release.status==='live'?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)', padding:'2px 6px', borderRadius:'4px' }}>{release.status==='live'?'LIVE':'PROCESSING'}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── CREDITS ── */}
          {activeSection === 'credits' && (
            <div>
              {!release.trackDetails?.length ? (
                <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'14px' }}>No credits available.</p>
              ) : release.trackDetails.map((track:any, i:number) => {
                const credits = [
                  { label:'Composer', value:track.composer },
                  { label:'Lyricist', value:track.lyricist },
                  { label:'Producer', value:track.producer },
                  { label:'Arranger', value:track.arranger },
                  { label:'Mixing Engineer', value:track.mixingEngineer },
                  { label:'Mastering Engineer', value:track.masteringEngineer },
                  { label:'Lead Vocals', value:track.leadVocals },
                  { label:'Background Vocals', value:track.backgroundVocals },
                  { label:'Musicians', value:track.musicians },
                  { label:'℗ Line', value:track.pLine },
                  { label:'© Line', value:track.cLine },
                ].filter(c => c.value)
                if (!credits.length) return null
                return (
                  <div key={i} style={{ ...card, padding:'18px', marginBottom:'12px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                      <span style={{ width:'22px', height:'22px', borderRadius:'50%', background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#818cf8' }}>{i+1}</span>
                      <span style={{ fontSize:'14px', fontWeight:700, color:'#fff' }}>{track.title}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      {credits.map(({label,value}) => (
                        <div key={label} style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:'7px' }}>
                          <div style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'3px' }}>{label}</div>
                          <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.75)', fontWeight:500 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>{/* end section content */}
      </div>{/* end main */}
    </div>
  )
}
