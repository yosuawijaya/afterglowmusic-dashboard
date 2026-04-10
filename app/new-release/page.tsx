'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { upload } from '@vercel/blob/client'

const TABS = [
  { id: 'release', label: 'Release information' },
  { id: 'upload', label: 'Upload' },
  { id: 'tracks', label: 'Tracks' },
  { id: 'price', label: 'Price' },
  { id: 'territories', label: 'Territories' },
  { id: 'releasedate', label: 'Release date' },
  { id: 'promotion', label: 'Promotion' },
  { id: 'submission', label: 'Submission' },
]

const GENRES: { [key: string]: string[] } = {
  'Alternative': ['Alternative Rock', 'Indie Rock', 'Grunge', 'Britpop', 'Post-Punk'],
  'Blues': ['Chicago Blues', 'Delta Blues', 'Electric Blues', 'Blues Rock'],
  "Children's Music": ['Lullabies', 'Educational', 'Sing-Along', 'Stories'],
  'Classical': ['Baroque', 'Classical Period', 'Romantic', 'Contemporary Classical', 'Opera'],
  'Country': ['Contemporary Country', 'Country Pop', 'Bluegrass', 'Honky Tonk', 'Outlaw Country'],
  'Dance': ['House', 'Techno', 'Trance', 'Dubstep', 'Drum and Bass'],
  'Electronic': ['Ambient', 'Downtempo', 'Electro', 'IDM', 'Industrial'],
  'Folk': ['Contemporary Folk', 'Traditional Folk', 'Folk Rock', 'Americana'],
  'Hip-Hop/Rap': ['East Coast Hip Hop', 'West Coast Hip Hop', 'Trap', 'Conscious Hip Hop', 'Gangsta Rap'],
  'Jazz': ['Bebop', 'Cool Jazz', 'Free Jazz', 'Fusion', 'Smooth Jazz', 'Swing'],
  'Latin': ['Salsa', 'Reggaeton', 'Bachata', 'Merengue', 'Latin Pop', 'Bossa Nova'],
  'Metal': ['Heavy Metal', 'Death Metal', 'Black Metal', 'Thrash Metal', 'Power Metal'],
  'Pop': ['Dance Pop', 'Electropop', 'Indie Pop', 'Synth-pop', 'Teen Pop'],
  'R&B/Soul': ['Contemporary R&B', 'Neo Soul', 'Funk', 'Motown', 'Quiet Storm'],
  'Reggae': ['Roots Reggae', 'Dancehall', 'Dub', 'Ska', 'Rocksteady'],
  'Rock': ['Classic Rock', 'Hard Rock', 'Progressive Rock', 'Punk Rock', 'Soft Rock'],
  'Soundtrack': ['Film Score', 'Musical Theatre', 'Video Game Music', 'TV Soundtrack'],
  'World': ['African', 'Asian', 'Celtic', 'European', 'Middle Eastern', 'Latin American'],
}

export default function NewReleasePage() {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#05050d' }}><div style={{ width:'32px', height:'32px', border:'3px solid rgba(255,255,255,0.08)', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}>
      <NewReleaseContent />
    </Suspense>
  )
}

function NewReleaseContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [activeTab, setActiveTab] = useState('release')
  const [username, setUsername] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [editingRelease, setEditingRelease] = useState<any>(null)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [selectedSubgenre, setSelectedSubgenre] = useState('')
  const [subgenres, setSubgenres] = useState<string[]>([])

  const [form, setForm] = useState({
    title: '', artist: '', featuringArtists: '', label: 'Afterglow Music',
    releaseDate: '', upc: '', genre: '', format: '', price: 'standard',
    territories: 'worldwide', promotionText: '', spotifyUrl: '',
    appleMusicUrl: '', youtubeChannelUrl: '', claimYoutubeOAC: false,
  })

  const [tracks, setTracks] = useState<any[]>([])
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) { router.push('/'); return }
    setUsername(localStorage.getItem('username') || 'User')

    if (editId) {
      getDoc(doc(db, 'submissions', editId)).then(snap => {
        if (!snap.exists()) return
        const d = snap.data()
        setEditingRelease({ id: editId, ...d })
        setForm({
          title: d.title || '', artist: d.artist || '', featuringArtists: d.featuringArtists || '',
          label: 'Afterglow Music', releaseDate: d.releaseDate || '', upc: d.upc || '',
          genre: d.genre || '', format: d.format || '', price: d.price || 'standard',
          territories: d.territories || 'worldwide', promotionText: d.promotionText || '',
          spotifyUrl: d.spotifyUrl || '', appleMusicUrl: d.appleMusicUrl || '',
          youtubeChannelUrl: d.youtubeChannelUrl || '', claimYoutubeOAC: d.claimYoutubeOAC || false,
        })
        setSelectedSubgenre(d.subgenre || '')
        setSubgenres(GENRES[d.genre] || [])
        setCoverPreview(d.coverImage || '')
        const yr = new Date().getFullYear()
        setTracks((d.trackDetails || []).map((t: any) => ({
          ...t, file: null, uploadProgress: 100,
          pLine: t.pLine || `℗ ${yr} Afterglow Music`,
          cLine: t.cLine || `© ${yr} Afterglow Music`,
        })))
      })
    }
  }, [router, editId])

  const currentIdx = TABS.findIndex(t => t.id === activeTab)
  const progress = Math.round(((currentIdx + 1) / TABS.length) * 100)

  const goNext = () => { if (currentIdx < TABS.length - 1) setActiveTab(TABS[currentIdx + 1].id) }
  const goPrev = () => { if (currentIdx > 0) setActiveTab(TABS[currentIdx - 1].id) }

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)) }
  }
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type.startsWith('image/')) { setCoverFile(file); setCoverPreview(URL.createObjectURL(file)) }
  }
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.name.toLowerCase().endsWith('.wav'))
    if (!files.length) return
    setAudioFiles(prev => [...prev, ...files])
    const yr = new Date().getFullYear()
    setTracks(prev => [...prev, ...files.map(f => ({
      title: f.name.replace(/\.[^/.]+$/, ''), artist: form.artist, file: f, uploadProgress: 0,
      featuring: '', composer: '', lyricist: '', producer: '', arranger: '',
      recordingStudio: '', mixingEngineer: '', masteringEngineer: '',
      leadVocals: '', backgroundVocals: '', musicians: '', isrc: '',
      pLine: `℗ ${yr} Afterglow Music`, cLine: `© ${yr} Afterglow Music`,
    }))])
  }
  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.wav'))
    if (!files.length) return
    setAudioFiles(prev => [...prev, ...files])
    const yr = new Date().getFullYear()
    setTracks(prev => [...prev, ...files.map(f => ({
      title: f.name.replace(/\.[^/.]+$/, ''), artist: form.artist, file: f, uploadProgress: 0,
      featuring: '', composer: '', lyricist: '', producer: '', arranger: '',
      recordingStudio: '', mixingEngineer: '', masteringEngineer: '',
      leadVocals: '', backgroundVocals: '', musicians: '', isrc: '',
      pLine: `℗ ${yr} Afterglow Music`, cLine: `© ${yr} Afterglow Music`,
    }))])
  }
  const updateTrack = (i: number, field: string, val: string) => {
    setTracks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: val } : t))
  }

  const generateISRC = (trackIndex: number) => {
    // Format: CC-XXX-YY-NNNNN (Country-Registrant-Year-Designation)
    const year = new Date().getFullYear().toString().slice(-2)
    const rand = Math.floor(Math.random() * 99999).toString().padStart(5, '0')
    const isrc = `ID-AGM-${year}-${rand}`
    updateTrack(trackIndex, 'isrc', isrc)
  }
  const removeTrack = (i: number) => {
    setTracks(prev => prev.filter((_, idx) => idx !== i))
    setAudioFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const uploadCover = async () => {
    if (!coverFile) return coverPreview
    setUploadStatus('Uploading cover art...')
    setUploadProgress(10)
    const blob = await upload(coverFile.name, coverFile, {
      access: 'public',
      handleUploadUrl: '/api/upload-token',
    })
    setUploadProgress(30)
    return blob.url
  }

  const uploadTrack = async (file: File, idx: number) => {
    setUploadStatus(`Uploading track ${idx + 1} of ${tracks.length}...`)
    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload-token',
    })
    const pct = 30 + Math.round(((idx + 1) / tracks.length) * 60)
    setUploadProgress(pct)
    setTracks(prev => prev.map((t, i) => i === idx ? { ...t, uploadProgress: 100 } : t))
    return blob.url
  }

  const handleSubmit = async () => {
    const errors: Record<string, string> = {}
    if (!form.title.trim()) errors.title = 'Release title is required'
    if (!form.artist.trim()) errors.artist = 'Primary artist is required'
    if (!form.genre) errors.genre = 'Genre is required'
    if (!selectedSubgenre) errors.subgenre = 'Subgenre is required'
    if (!form.format) errors.format = 'Format is required'
    if (!form.spotifyUrl.trim()) errors.spotifyUrl = 'Spotify Artist URL is required'
    if (!form.appleMusicUrl.trim()) errors.appleMusicUrl = 'Apple Music Artist URL is required'
    if (!coverFile && !coverPreview) errors.cover = 'Cover art is required'
    if (!tracks.length) errors.tracks = 'At least one track is required'
    if (!form.releaseDate) errors.releaseDate = 'Release date is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Navigate to first tab with error
      if (errors.title || errors.artist || errors.genre || errors.subgenre || errors.format || errors.spotifyUrl || errors.appleMusicUrl || errors.cover) setActiveTab('release')
      else if (errors.tracks) setActiveTab('upload')
      else if (errors.releaseDate) setActiveTab('releasedate')
      return
    }
    setFormErrors({})

    const userEmail = localStorage.getItem('userEmail') || ''
    if (!userEmail) { router.push('/'); return }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus('Preparing upload...')
    try {
      const coverUrl = coverFile ? await uploadCover() : coverPreview
      setUploadStatus('Uploading audio files...')
      const uploadedTracks = await Promise.all(tracks.map(async (t, i) => ({
        title: t.title, artist: t.artist || form.artist,
        audioUrl: t.file ? await uploadTrack(t.file, i) : (t.audioUrl || ''),
        featuring: t.featuring, composer: t.composer, lyricist: t.lyricist,
        producer: t.producer, isrc: t.isrc, pLine: t.pLine, cLine: t.cLine,
      })))

      const data = {
        ...form, subgenre: selectedSubgenre,
        tracks: uploadedTracks.length, trackDetails: uploadedTracks,
        coverImage: coverUrl, userEmail,
        userId: localStorage.getItem('userId') || '',
      }

      // Deep strip undefined values — Firestore rejects them at any level
      const stripUndefined = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(stripUndefined)
        if (obj && typeof obj === 'object') {
          return Object.fromEntries(
            Object.entries(obj)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => [k, stripUndefined(v)])
          )
        }
        return obj
      }
      const cleanData = stripUndefined(data)

      setUploadProgress(95)
      setUploadStatus('Saving release...')

      if (editingRelease) {
        await updateDoc(doc(db, 'submissions', editingRelease.id), { ...cleanData, updatedAt: serverTimestamp() })
        await fetch('/api/send-edit-notification', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ releaseTitle: form.title, artist: form.artist, userEmail, changes: ['Release updated'] }),
        })
      } else {
        await addDoc(collection(db, 'submissions'), { ...cleanData, status: 'pending', submittedAt: serverTimestamp() })
        await fetch('/api/send-release', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, tracks: uploadedTracks, coverImage: coverUrl, userEmail }),
        })
      }
      setUploadProgress(100)
      setUploadStatus('Done!')
      setTimeout(() => router.push('/dashboard'), 500)
    } catch (err) {
      alert('Error: ' + (err as Error).message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatus('')
    }
  }

  const f = (field: keyof typeof form, val: any) => setForm(prev => ({ ...prev, [field]: val }))

  return (
    <div className="new-release-page">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <button className="btn-new-release" onClick={() => router.push('/new-release')}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
          <span>New Release</span>
        </button>
        <div className="nav-section-label">Library</div>
        <div className="nav-item" onClick={() => router.push('/dashboard')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/></svg>
          <span>All Releases</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd"/></svg>
          <span>Drafts</span>
        </div>
        <div className="nav-section-label">Insights</div>
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="13" width="4" height="9" rx="1"/><rect x="9" y="8" width="4" height="14" rx="1"/><rect x="16" y="3" width="4" height="19" rx="1"/></svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/promotion')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/></svg>
          <span>Promotion</span>
        </div>
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
            <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px', flexShrink: 0 }}>{username.charAt(0).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>Artist</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="new-release-content">
        {/* Top bar */}
        <div className="new-release-topbar">
          <div className="new-release-breadcrumb">
            <span className="new-release-breadcrumb-parent" onClick={() => router.push('/dashboard')}>
              <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
              All Releases
            </span>
            <span className="new-release-breadcrumb-sep">/</span>
            <span className="new-release-breadcrumb-current">
              {editingRelease ? `Edit: ${editingRelease.title}` : 'New Release'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Step {currentIdx + 1} of {TABS.length}</span>
            <button
              onClick={handleSubmit}
              disabled={isUploading || activeTab !== 'submission'}
              style={{
                padding: '7px 18px',
                background: activeTab === 'submission' ? 'linear-gradient(135deg, #6366f1, #7c3aed)' : 'rgba(255,255,255,0.06)',
                color: activeTab === 'submission' ? 'white' : 'rgba(255,255,255,0.25)',
                border: 'none', borderRadius: '7px', fontSize: '13px', fontWeight: 700,
                cursor: activeTab === 'submission' && !isUploading ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: activeTab === 'submission' ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {isUploading ? 'Saving...' : editingRelease ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="new-release-progress">
          <div className="new-release-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Tabs */}
        <div className="new-release-tabs-bar">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              className={`new-release-tab ${activeTab === t.id ? 'active' : ''} ${i < currentIdx ? 'done' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="nr-tab-num">{i < currentIdx ? '✓' : i + 1}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="new-release-body">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'release' && <ReleaseInfoTab form={form} f={f} coverPreview={coverPreview} coverFile={coverFile} handleCoverDrop={handleCoverDrop} handleCoverSelect={handleCoverSelect} selectedSubgenre={selectedSubgenre} setSelectedSubgenre={setSelectedSubgenre} subgenres={subgenres} setSubgenres={setSubgenres} errors={formErrors} />}
            {activeTab === 'upload' && <UploadTab audioFiles={audioFiles} handleAudioSelect={handleAudioSelect} handleAudioDrop={handleAudioDrop} removeTrack={removeTrack} />}
            {activeTab === 'tracks' && <TracksTab tracks={tracks} updateTrack={updateTrack} removeTrack={removeTrack} defaultArtist={form.artist} generateISRC={generateISRC} />}
            {activeTab === 'price' && <PriceTab form={form} f={f} />}
            {activeTab === 'territories' && <TerritoriesTab form={form} f={f} />}
            {activeTab === 'releasedate' && <ReleaseDateTab form={form} f={f} />}
            {activeTab === 'promotion' && <PromotionTab form={form} f={f} />}
            {activeTab === 'submission' && <SubmissionTab form={form} tracks={tracks} selectedSubgenre={selectedSubgenre} coverPreview={coverPreview} agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms} />}
          </div>
        </div>

        {/* Upload progress overlay */}
        {isUploading && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,5,13,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#0d0d1f', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '40px 48px', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(99,102,241,0.12)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.3px' }}>
                {uploadProgress === 100 ? '🎉 Done!' : 'Uploading...'}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>{uploadStatus}</p>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg, #6366f1, #ec4899)', borderRadius: '6px', transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{uploadProgress}%</div>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Footer nav */}
        <div className="nr-footer">
          <div className="nr-footer-info">
            {currentIdx > 0 && (
              <button className="btn-secondary" onClick={goPrev} disabled={isUploading} style={{ fontSize: '13px', padding: '8px 16px' }}>← Back</button>
            )}
          </div>
          <div className="nr-footer-actions">
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>{progress}% complete</span>
            {activeTab !== 'submission' ? (
              <button className="btn-save" onClick={goNext} disabled={isUploading} style={{ padding: '9px 22px' }}>Continue →</button>
            ) : (
              <button className="btn-save" onClick={handleSubmit} disabled={isUploading || !agreedToTerms} style={{ padding: '9px 22px', opacity: agreedToTerms ? 1 : 0.4 }}>
                {isUploading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Saving...
                  </span>
                ) : editingRelease ? 'Update Release' : 'Submit Release'}
              </button>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ===== TAB COMPONENTS =====

function ReleaseInfoTab({ form, f, coverPreview, coverFile, handleCoverDrop, handleCoverSelect, selectedSubgenre, setSelectedSubgenre, subgenres, setSubgenres, errors = {} }: any) {
  const err = (field: string) => errors[field] ? (
    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
      {errors[field]}
    </div>
  ) : null
  return (
    <div className="new-release-form-grid">
      {/* Cover art column */}
      <div className="new-release-cover-col">
        <div
          className="new-release-cover-box"
          onDrop={handleCoverDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('nr-cover-input')?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover" />
          ) : (
            <>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '10px' }}>
                <path d="M7 18C5.17107 18.4117 4 19.0443 4 19.7537C4 20.9943 7.58172 22 12 22C16.4183 22 20 20.9943 20 19.7537C20 19.0443 18.8289 18.4117 17 18M12 15V3M12 3L8 7M12 3L16 7"/>
              </svg>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.5 }}>Upload cover</span>
            </>
          )}
          <input id="nr-cover-input" type="file" accept="image/*" onChange={handleCoverSelect} style={{ display: 'none' }} />
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, textAlign: 'center' }}>
          JPG or PNG<br/>Min 3000×3000px · Max 10MB
        </div>
        {coverPreview && (
          <div style={{ fontSize: '12px', color: '#10b981', textAlign: 'center', fontWeight: 600 }}>✓ Cover uploaded</div>
        )}
      </div>

      {/* Fields column */}
      <div className="new-release-fields-col">
        <div className="nr-section">
          <div className="nr-section-title">Basic Information</div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Release Title <span className="nr-required">*</span></label>
              <input className="nr-input" value={form.title} onChange={e => f('title', e.target.value)} placeholder="Enter release title" style={{ borderColor: errors.title ? 'rgba(239,68,68,0.5)' : undefined }} />
              {err('title')}
            </div>
            <div className="nr-field">
              <label className="nr-label">Version / Subtitle</label>
              <input className="nr-input" placeholder="e.g. Deluxe Edition, Remix" />
            </div>
          </div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Primary Artist <span className="nr-required">*</span></label>
              <input className="nr-input" value={form.artist} onChange={e => f('artist', e.target.value)} placeholder="Artist name" style={{ borderColor: errors.artist ? 'rgba(239,68,68,0.5)' : undefined }} />
              {err('artist')}
            </div>
            <div className="nr-field">
              <label className="nr-label">Featuring Artists</label>
              <input className="nr-input" value={form.featuringArtists} onChange={e => f('featuringArtists', e.target.value)} placeholder="e.g. Artist 2, Artist 3" />
              <span className="nr-hint">Separate multiple artists with commas</span>
            </div>
          </div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Genre <span className="nr-required">*</span></label>
              <select className="nr-select" value={form.genre} onChange={e => { f('genre', e.target.value); setSubgenres(GENRES[e.target.value] || []); setSelectedSubgenre('') }}>
                <option value="">Select a genre</option>
                {Object.keys(GENRES).map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="nr-field">
              <label className="nr-label">Subgenre <span className="nr-required">*</span></label>
              <select className="nr-select" value={selectedSubgenre} onChange={e => setSelectedSubgenre(e.target.value)} disabled={!form.genre}>
                <option value="">Select a sub-genre</option>
                {subgenres.map((s: string) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Label Name</label>
              <input className="nr-input" value="Afterglow Music" disabled />
            </div>
            <div className="nr-field">
              <label className="nr-label">Format <span className="nr-required">*</span></label>
              <select className="nr-select" value={form.format} onChange={e => f('format', e.target.value)}>
                <option value="">Select a format</option>
                <option>Single</option><option>EP</option><option>Album</option>
              </select>
            </div>
          </div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Production Year</label>
              <select className="nr-select">
                <option>Select a year</option>
                {[2026,2025,2024,2023,2022].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="nr-field">
              <label className="nr-label">Physical Release Date</label>
              <input className="nr-input" type="date" value={form.releaseDate} onChange={e => f('releaseDate', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="nr-section">
          <div className="nr-section-title">Artist Profiles</div>
          <div className="nr-row">
            <div className="nr-field">
              <label className="nr-label">Spotify Artist URL <span className="nr-required">*</span></label>
              <input className="nr-input" value={form.spotifyUrl} onChange={e => f('spotifyUrl', e.target.value)} placeholder="https://open.spotify.com/artist/..." />
              <span className="nr-hint">Or type: I don't have artist profile yet</span>
            </div>
            <div className="nr-field">
              <label className="nr-label">Apple Music Artist URL <span className="nr-required">*</span></label>
              <input className="nr-input" value={form.appleMusicUrl} onChange={e => f('appleMusicUrl', e.target.value)} placeholder="https://music.apple.com/artist/..." />
              <span className="nr-hint">Or type: I don't have artist profile yet</span>
            </div>
          </div>
          <div className="nr-full">
            <div className="nr-field">
              <label className="nr-label">YouTube Channel URL</label>
              <input className="nr-input" value={form.youtubeChannelUrl} onChange={e => f('youtubeChannelUrl', e.target.value)} placeholder="https://www.youtube.com/@yourartist" />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
            <input type="checkbox" checked={form.claimYoutubeOAC} onChange={e => f('claimYoutubeOAC', e.target.checked)} style={{ marginTop: '2px', accentColor: '#6366f1' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Claim YouTube Official Artist Channel (OAC)</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '3px', lineHeight: 1.5 }}>We'll help you claim your Official Artist Channel on YouTube Music.</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}

function UploadTab({ audioFiles, handleAudioSelect, handleAudioDrop, removeTrack }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      {/* Dropzone — full area */}
      <div
        onDrop={handleAudioDrop} onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById('nr-audio-input')?.click()}
        style={{
          flex: audioFiles.length ? '0 0 auto' : 1,
          minHeight: audioFiles.length ? '160px' : '340px',
          border: `2px dashed ${audioFiles.length ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          background: audioFiles.length ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.25s',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(99,102,241,0.6)'
          el.style.background = 'rgba(99,102,241,0.07)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = audioFiles.length ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'
          el.style.background = audioFiles.length ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)'
        }}
      >
        {/* bg glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.1))', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px solid rgba(99,102,241,0.25)', position: 'relative', zIndex: 1 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5L21 3V16M9 18C9 19.1046 7.65685 20 6 20C4.34315 20 3 19.1046 3 18C3 16.8954 4.34315 16 6 16C7.65685 16 9 16.8954 9 18ZM21 16C21 17.1046 19.6569 18 18 18C16.3431 18 15 17.1046 15 16C15 14.8954 16.3431 14 18 14C19.6569 14 21 14.8954 21 16Z"/>
          </svg>
        </div>

        <p style={{ fontSize: '15px', fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginBottom: '6px', letterSpacing: '-0.3px', position: 'relative', zIndex: 1 }}>
          {audioFiles.length ? `${audioFiles.length} file${audioFiles.length > 1 ? 's' : ''} added — drop more here` : 'Drag & drop your audio files'}
        </p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          or click anywhere to browse
        </p>
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          {['WAV format only', 'Max 200MB per file', 'Multiple files'].map(tag => (
            <span key={tag} style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{tag}</span>
          ))}
        </div>
        <input id="nr-audio-input" type="file" accept=".wav" multiple onChange={handleAudioSelect} style={{ display: 'none' }} />
      </div>

      {/* File list */}
      {audioFiles.length > 0 && (
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Files ({audioFiles.length})
            </span>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
              {audioFiles.length} ready to upload
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {audioFiles.map((f: File, i: number) => (
              <div key={i}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 16px', background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99,102,241,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)' }}
              >
                <div style={{ width: '38px', height: '38px', background: 'rgba(99,102,241,0.12)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(99,102,241,0.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5L21 3V16M9 18C9 19.1046 7.65685 20 6 20C4.34315 20 3 19.1046 3 18C3 16.8954 4.34315 16 6 16C7.65685 16 9 16.8954 9 18ZM21 16C21 17.1046 19.6569 18 18 18C16.3431 18 15 17.1046 15 16C15 14.8954 16.3431 14 18 14C19.6569 14 21 14.8954 21 16Z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>WAV · {(f.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 9px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>✓ Ready</span>
                  <button onClick={() => removeTrack(i)}
                    style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.22)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                  >×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TracksTab({ tracks, updateTrack, removeTrack, defaultArtist, generateISRC }: any) {
  if (!tracks.length) return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: '15px', marginBottom: '8px' }}>No audio files uploaded yet</p>
      <p style={{ fontSize: '13px' }}>Go to the Upload tab to add audio files</p>
    </div>
  )
  return (
    <div style={{ maxWidth: '900px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Track Details & Metadata</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Complete track information and credits</p>
      {tracks.map((t: any, i: number) => (
        <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, fontSize: '12px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.06)' }}>
              {t.file ? `${t.file.name} · ${(t.file.size/1024/1024).toFixed(2)} MB` : 'Existing audio'}
            </div>
            <button onClick={() => removeTrack(i)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {[
              { label: 'Track Title *', field: 'title', placeholder: 'Enter track title' },
              { label: 'Primary Artist', field: 'artist', placeholder: defaultArtist || 'Artist name' },
              { label: 'Featuring Artists', field: 'featuring', placeholder: 'e.g. Artist 2' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="nr-field">
                <label className="nr-label">{label}</label>
                <input className="nr-input" value={t[field] || ''} onChange={e => updateTrack(i, field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
          {/* ISRC with auto-generate */}
          <div style={{ marginBottom: '12px' }}>
            <div className="nr-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="nr-label" style={{ marginBottom: 0 }}>ISRC Code</label>
                <button type="button" onClick={() => generateISRC(i)}
                  style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Auto-generate
                </button>
              </div>
              <input className="nr-input" value={t.isrc || ''} onChange={e => updateTrack(i, 'isrc', e.target.value.toUpperCase())}
                placeholder="e.g. ID-AGM-25-00001" style={{ fontFamily: 'monospace', letterSpacing: '0.5px' }} />
              {t.isrc && !/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/.test(t.isrc) && (
                <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>Format: CC-XXX-YY-NNNNN</div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {[
              { label: 'Composer', field: 'composer', placeholder: 'Who wrote the music?' },
              { label: 'Lyricist', field: 'lyricist', placeholder: 'Who wrote the lyrics?' },
              { label: 'Producer', field: 'producer', placeholder: 'Who produced this?' },
              { label: 'Mixing Engineer', field: 'mixingEngineer', placeholder: 'Who mixed this?' },
            ].map(({ label, field, placeholder }) => (
              <div key={field} className="nr-field">
                <label className="nr-label">{label}</label>
                <input className="nr-input" value={t[field] || ''} onChange={e => updateTrack(i, field, e.target.value)} placeholder={placeholder} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="nr-field">
              <label className="nr-label">℗ Line</label>
              <input className="nr-input" value={t.pLine} disabled />
            </div>
            <div className="nr-field">
              <label className="nr-label">© Line</label>
              <input className="nr-input" value={t.cLine} disabled />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PriceTab({ form, f }: any) {
  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Pricing</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Set your release price tier</p>
      <div className="nr-field">
        <label className="nr-label">Price Tier</label>
        <select className="nr-select" value={form.price} onChange={e => f('price', e.target.value)}>
          <option value="standard">Standard ($0.99 per track)</option>
          <option value="premium">Premium ($1.29 per track)</option>
          <option value="budget">Budget ($0.69 per track)</option>
        </select>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', lineHeight: 1.6 }}>Pricing will be automatically converted to local currencies based on store requirements.</p>
    </div>
  )
}

function TerritoriesTab({ form, f }: any) {
  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Distribution Territories</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Choose where your release will be available</p>
      {[
        { value: 'worldwide', label: 'Worldwide', desc: '240 territories — maximum reach' },
        { value: 'selected', label: 'Selected territories only', desc: 'Choose specific countries' },
      ].map(opt => (
        <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', background: form.territories === opt.value ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${form.territories === opt.value ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '10px', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.2s' }}>
          <input type="radio" name="territories" value={opt.value} checked={form.territories === opt.value} onChange={() => f('territories', opt.value)} style={{ marginTop: '2px', accentColor: '#6366f1' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{opt.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
          </div>
        </label>
      ))}
    </div>
  )
}

function ReleaseDateTab({ form, f }: any) {
  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Release Date</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Set your digital release date</p>
      <div className="nr-field">
        <label className="nr-label">Digital Release Date <span className="nr-required">*</span></label>
        <input className="nr-input" type="date" value={form.releaseDate} onChange={e => f('releaseDate', e.target.value)} />
      </div>
      <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', fontSize: '13px', color: 'rgba(245,158,11,0.9)', lineHeight: 1.6 }}>
        ⚠ Please submit at least 2 weeks before your desired release date to ensure timely distribution.
      </div>
    </div>
  )
}

function PromotionTab({ form, f }: any) {
  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.3px' }}>Promotion</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>Add promotional text or press release information</p>
      <div className="nr-field">
        <label className="nr-label">Promotional Text</label>
        <textarea className="nr-textarea" rows={6} value={form.promotionText} onChange={e => f('promotionText', e.target.value)} placeholder="Add a description, press release, or promotional notes for your release..." style={{ resize: 'vertical' }} />
      </div>
    </div>
  )
}

function SubmissionTab({ form, tracks, selectedSubgenre, coverPreview, agreedToTerms, setAgreedToTerms }: any) {
  const items = [
    { label: 'Title', value: form.title || '—' },
    { label: 'Artist', value: form.artist || '—' },
    { label: 'Genre', value: form.genre ? `${form.genre}${selectedSubgenre ? ` · ${selectedSubgenre}` : ''}` : '—' },
    { label: 'Format', value: form.format || '—' },
    { label: 'Release Date', value: form.releaseDate || '—' },
    { label: 'Territories', value: form.territories === 'worldwide' ? 'Worldwide (240)' : 'Selected' },
    { label: 'Price', value: form.price === 'standard' ? 'Standard' : form.price === 'premium' ? 'Premium' : 'Budget' },
    { label: 'Tracks', value: `${tracks.length} track${tracks.length !== 1 ? 's' : ''}` },
    { label: 'Cover Art', value: coverPreview ? '✓ Uploaded' : '✗ Missing' },
    { label: 'Spotify URL', value: form.spotifyUrl ? '✓ Set' : '✗ Missing' },
    { label: 'Apple Music URL', value: form.appleMusicUrl ? '✓ Set' : '✗ Missing' },
  ]
  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', letterSpacing: '-0.3px' }}>Review & Submit</h2>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Review your release details before submitting</p>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
        {items.map((item, i) => (
          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: '13px', color: item.value.startsWith('✗') ? '#f87171' : item.value.startsWith('✓') ? '#10b981' : 'var(--text-primary)', fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Distribution Agreement */}
      <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Distribution Agreement</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, marginBottom: '16px' }}>
          By submitting this release, you confirm that:<br/>
          • You own or control all rights to this content<br/>
          • The content does not infringe any third-party rights<br/>
          • You grant Afterglow Music a non-exclusive license to distribute this content worldwide<br/>
          • Afterglow Music retains 15% of net revenue as distribution fee<br/>
          • You will receive 85% of net revenue from all platforms<br/>
          • Submission does not guarantee distribution — content is subject to review
        </div>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            style={{ marginTop: '2px', width: '16px', height: '16px', accentColor: '#6366f1', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: '13px', color: agreedToTerms ? 'rgba(165,180,252,0.9)' : 'rgba(255,255,255,0.5)', lineHeight: 1.5, transition: 'color 0.2s' }}>
            I have read and agree to the distribution agreement above. I confirm I have the rights to distribute this content.
          </span>
        </label>
      </div>

      <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: '10px', fontSize: '13px', color: 'rgba(165,180,252,0.8)', lineHeight: 1.6 }}>
        After submission, our team will review your release within 2–3 business days. You'll receive an email notification when it's approved.
        {' '}<a href="/legal" target="_blank" style={{ color: 'rgba(165,180,252,0.6)', fontSize: '12px' }}>View Terms</a>
      </div>
    </div>
  )
}
