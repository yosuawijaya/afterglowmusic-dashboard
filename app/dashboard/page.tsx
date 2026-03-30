'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AvatarUpload from '@/app/components/AvatarUpload'

interface Release {
  id: number
  title: string
  artist: string
  label: string
  releaseDate: string
  tracks: number
  upc: string
  territories: number
  stores: number
  cover: string
}

export default function Dashboard() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [userId, setUserId] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('release')
  const [selectedSubgenre, setSelectedSubgenre] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [tracks, setTracks] = useState<Array<{
    title: string
    artist: string
    file: File | null
    audioUrl?: string
    uploadProgress: number
    // Metadata lengkap
    featuring: string
    composer: string
    lyricist: string
    producer: string
    arranger: string
    recordingStudio: string
    mixingEngineer: string
    masteringEngineer: string
    leadVocals: string
    backgroundVocals: string
    musicians: string
    isrc: string
    pLine: string
    cLine: string
  }>>([])
  const [releases, setReleases] = useState<Release[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [newRelease, setNewRelease] = useState({
    title: '',
    artist: '',
    featuringArtists: '',
    label: 'Afterglow Music',
    releaseDate: '',
    upc: '',
    genre: '',
    format: '',
    price: 'standard',
    territories: 'worldwide',
    promotionText: '',
    spotifyUrl: '',
    appleMusicUrl: '',
    youtubeChannelUrl: '',
    claimYoutubeOAC: false
  })
  const [editingRelease, setEditingRelease] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [releaseToDelete, setReleaseToDelete] = useState<any>(null)
  const [deleteReason, setDeleteReason] = useState('')
  
  const genres: { [key: string]: string[] } = {
    'Alternative': ['Alternative Rock', 'Indie Rock', 'Grunge', 'Britpop', 'Post-Punk'],
    'Blues': ['Chicago Blues', 'Delta Blues', 'Electric Blues', 'Blues Rock'],
    'Children\'s Music': ['Lullabies', 'Educational', 'Sing-Along', 'Stories'],
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
    'World': ['African', 'Asian', 'Celtic', 'European', 'Middle Eastern', 'Latin American']
  }
  
  const [subgenres, setSubgenres] = useState<string[]>([])
  
  const handleGenreChange = (genre: string) => {
    setNewRelease({...newRelease, genre})
    setSubgenres(genres[genre] || [])
    setSelectedSubgenre('')
  }

  const goToNextTab = () => {
    const tabs = ['release', 'upload', 'tracks', 'price', 'territories', 'releasedate', 'promotion', 'submission']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const goToPreviousTab = () => {
    const tabs = ['release', 'upload', 'tracks', 'price', 'territories', 'releasedate', 'promotion', 'submission']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }
  
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    } else {
      alert('Please upload an image file (JPG, PNG)')
    }
  }

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'))
    if (files.length > 0) {
      setAudioFiles(prev => [...prev, ...files])
      // Auto-create tracks from files
      const currentYear = new Date().getFullYear()
      const newTracks = files.map(file => ({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        artist: newRelease.artist || '',
        file,
        uploadProgress: 0,
        featuring: '',
        composer: '',
        lyricist: '',
        producer: '',
        arranger: '',
        recordingStudio: '',
        mixingEngineer: '',
        masteringEngineer: '',
        leadVocals: '',
        backgroundVocals: '',
        musicians: '',
        isrc: '',
        pLine: `℗ ${currentYear} Afterglow Music`,
        cLine: `© ${currentYear} Afterglow Music`
      }))
      setTracks(prev => [...prev, ...newTracks])
    } else {
      alert('Please upload audio files (MP3, WAV, FLAC)')
    }
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(f => f.type.startsWith('audio/'))
    if (files.length > 0) {
      setAudioFiles(prev => [...prev, ...files])
      // Auto-create tracks from files
      const currentYear = new Date().getFullYear()
      const newTracks = files.map(file => ({
        title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        artist: newRelease.artist || '',
        file,
        uploadProgress: 0,
        featuring: '',
        composer: '',
        lyricist: '',
        producer: '',
        arranger: '',
        recordingStudio: '',
        mixingEngineer: '',
        masteringEngineer: '',
        leadVocals: '',
        backgroundVocals: '',
        musicians: '',
        isrc: '',
        pLine: `℗ ${currentYear} Afterglow Music`,
        cLine: `© ${currentYear} Afterglow Music`
      }))
      setTracks(prev => [...prev, ...newTracks])
    } else {
      alert('Please upload audio files (MP3, WAV, FLAC)')
    }
  }

  const removeAudioFile = (index: number) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index))
    setTracks(prev => prev.filter((_, i) => i !== index))
  }

  const updateTrack = (index: number, field: string, value: string) => {
    const newTracks = [...tracks]
    newTracks[index] = { ...newTracks[index], [field]: value }
    setTracks(newTracks)
  }

  const uploadCoverToStorage = async (): Promise<string> => {
    if (!coverFile) return ''

    const formData = new FormData()
    formData.append('file', coverFile)
    formData.append('type', 'cover')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }

    return data.url
  }

  const uploadTrackToStorage = async (index: number, file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'track')

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Upload failed')
    }

    // Update progress
    const newTracks = [...tracks]
    newTracks[index] = { ...newTracks[index], uploadProgress: 100 }
    setTracks(newTracks)

    return data.url
  }

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    } else {
      alert('Please upload an image file (JPG, PNG)')
    }
  }

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    const userId = localStorage.getItem('userId')
    
    if (!isLoggedIn) {
      router.push('/')
    } else {
      setUsername(storedUsername || 'User')
      
      // Load photoURL realtime dari Firestore
      const uid = localStorage.getItem('userId') || ''
      setUserId(uid)
      let unsubPhoto: (() => void) | null = null
      if (uid) {
        unsubPhoto = onSnapshot(doc(db, 'users', uid), (snap) => {
          if (snap.exists()) setPhotoURL(snap.data().photoURL || '')
        })
      }
      
      // Load user's submissions from Firestore (real-time)
      if (userId) {
        console.log('Loading submissions for userId:', userId)
        
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', userId)
        )
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const submissionsData: any[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            console.log('Submission found:', doc.id, data)
            submissionsData.push({
              id: doc.id,
              ...data,
              submittedAt: data.submittedAt?.toDate?.() || new Date()
            })
          })
          
          // Sort manually by submittedAt (descending)
          submissionsData.sort((a, b) => {
            const dateA = a.submittedAt instanceof Date ? a.submittedAt : new Date(a.submittedAt)
            const dateB = b.submittedAt instanceof Date ? b.submittedAt : new Date(b.submittedAt)
            return dateB.getTime() - dateA.getTime()
          })
          
          console.log('Total submissions loaded:', submissionsData.length)
          setSubmissions(submissionsData)
        }, (error) => {
          console.error('Error loading submissions:', error)
        })
        
        return () => { unsubscribe(); unsubPhoto?.() }
      }
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleEditRelease = (submission: any) => {
    setEditingRelease(submission)
    setNewRelease({
      title: submission.title,
      artist: submission.artist,
      featuringArtists: submission.featuringArtists || '',
      label: 'Afterglow Music',
      releaseDate: submission.releaseDate,
      upc: submission.upc || '',
      genre: submission.genre,
      format: submission.format,
      price: submission.price || 'standard',
      territories: submission.territories || 'worldwide',
      promotionText: submission.promotionText || '',
      spotifyUrl: submission.spotifyUrl || '',
      appleMusicUrl: submission.appleMusicUrl || '',
      youtubeChannelUrl: submission.youtubeChannelUrl || '',
      claimYoutubeOAC: submission.claimYoutubeOAC || false
    })
    setSelectedSubgenre(submission.subgenre || '')
    setSubgenres(genres[submission.genre] || [])
    
    // Convert trackDetails to tracks format
    const currentYear = new Date().getFullYear()
    const existingTracks = (submission.trackDetails || []).map((track: any) => ({
      title: track.title,
      artist: track.artist || submission.artist,
      file: null, // No file object for existing tracks
      audioUrl: track.audioUrl || '',
      uploadProgress: 100,
      featuring: track.featuring || '',
      composer: track.composer || '',
      lyricist: track.lyricist || '',
      producer: track.producer || '',
      arranger: track.arranger || '',
      recordingStudio: track.recordingStudio || '',
      mixingEngineer: track.mixingEngineer || '',
      masteringEngineer: track.masteringEngineer || '',
      leadVocals: track.leadVocals || '',
      backgroundVocals: track.backgroundVocals || '',
      musicians: track.musicians || '',
      isrc: track.isrc || '',
      pLine: track.pLine || `℗ ${currentYear} Afterglow Music`,
      cLine: track.cLine || `© ${currentYear} Afterglow Music`
    }))
    
    setTracks(existingTracks)
    setCoverPreview(submission.coverImage || '')
    setShowCreateForm(true)
    setActiveTab('release')
  }

  const handleDeleteClick = (submission: any) => {
    setReleaseToDelete(submission)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!releaseToDelete) return

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'submissions', releaseToDelete.id))

      // Send email notifications
      await fetch('/api/send-delete-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          releaseTitle: releaseToDelete.title,
          artist: releaseToDelete.artist,
          userEmail: releaseToDelete.userEmail,
          reason: deleteReason
        }),
      })

      setShowDeleteConfirm(false)
      setReleaseToDelete(null)
      setDeleteReason('')
      alert('Release deleted successfully!')
    } catch (error) {
      console.error('Error deleting release:', error)
      alert('Error deleting release: ' + (error as Error).message)
    }
  }

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDATION
    if (!newRelease.title.trim()) {
      alert('Release title is required')
      setActiveTab('release')
      return
    }
    
    if (!newRelease.artist.trim()) {
      alert('Primary artist is required')
      setActiveTab('release')
      return
    }
    
    if (!newRelease.genre) {
      alert('Genre is required')
      setActiveTab('release')
      return
    }
    
    if (!selectedSubgenre) {
      alert('Subgenre is required')
      setActiveTab('release')
      return
    }
    
    if (!newRelease.format) {
      alert('Format is required')
      setActiveTab('release')
      return
    }
    
    if (!newRelease.spotifyUrl.trim()) {
      alert('Spotify Artist URL is required')
      setActiveTab('release')
      return
    }
    
    if (!newRelease.appleMusicUrl.trim()) {
      alert('Apple Music Artist URL is required')
      setActiveTab('release')
      return
    }
    
    if (!coverFile && !coverPreview) {
      alert('Cover art is required')
      setActiveTab('release')
      return
    }
    
    if (tracks.length === 0) {
      alert('At least one track is required')
      setActiveTab('upload')
      return
    }
    
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].title.trim()) {
        alert(`Track ${i + 1}: Title is required`)
        setActiveTab('tracks')
        return
      }
      
      if (!tracks[i].file && !editingRelease) {
        alert(`Track ${i + 1}: Audio file is required`)
        setActiveTab('upload')
        return
      }
    }
    
    if (!newRelease.releaseDate) {
      alert('Release date is required')
      setActiveTab('releasedate')
      return
    }
    
    const userEmail = localStorage.getItem('userEmail') || ''
    
    if (!userEmail) {
      alert('User not logged in')
      router.push('/')
      return
    }

    setIsUploading(true)
    
    try {
      // Upload cover art (only if new file selected)
      let coverUrl = coverPreview
      if (coverFile) {
        coverUrl = await uploadCoverToStorage()
      }

      // Upload tracks (only new ones)
      const uploadedTracks = await Promise.all(
        tracks.map(async (track, index) => {
          let audioUrl = track.audioUrl || ''
          if (track.file) {
            audioUrl = await uploadTrackToStorage(index, track.file)
          }
          return {
            title: track.title,
            artist: track.artist || newRelease.artist,
            audioUrl
          }
        })
      )

      const releaseData = {
        title: newRelease.title,
        artist: newRelease.artist,
        featuringArtists: newRelease.featuringArtists || '',
        userEmail: userEmail,
        userId: localStorage.getItem('userId') || '',
        genre: newRelease.genre,
        subgenre: selectedSubgenre,
        format: newRelease.format,
        tracks: uploadedTracks.length,
        trackDetails: uploadedTracks,
        coverImage: coverUrl,
        spotifyUrl: newRelease.spotifyUrl,
        appleMusicUrl: newRelease.appleMusicUrl,
        youtubeChannelUrl: newRelease.youtubeChannelUrl || '',
        claimYoutubeOAC: newRelease.claimYoutubeOAC,
        price: newRelease.price,
        territories: newRelease.territories,
        promotionText: newRelease.promotionText,
        releaseDate: newRelease.releaseDate
      }

      if (editingRelease) {
        // UPDATE existing release
        await updateDoc(doc(db, 'submissions', editingRelease.id), {
          ...releaseData,
          updatedAt: serverTimestamp()
        })

        // Track changes for email
        const changes: string[] = []
        if (editingRelease.title !== newRelease.title) changes.push(`Title changed to "${newRelease.title}"`)
        if (editingRelease.artist !== newRelease.artist) changes.push(`Artist changed to "${newRelease.artist}"`)
        if (editingRelease.genre !== newRelease.genre) changes.push(`Genre changed to "${newRelease.genre}"`)
        if (editingRelease.format !== newRelease.format) changes.push(`Format changed to "${newRelease.format}"`)
        if (editingRelease.releaseDate !== newRelease.releaseDate) changes.push(`Release date changed`)
        if (coverFile) changes.push('Cover art updated')
        if (tracks.some(t => t.file)) changes.push('Audio files updated')

        // Send email notifications
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@afterglowmusic.com'
        await fetch('/api/send-edit-notification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            releaseTitle: newRelease.title,
            artist: newRelease.artist,
            userEmail: userEmail,
            changes: changes
          }),
        })

        alert('Release updated successfully!')
      } else {
        // CREATE new release
        await addDoc(collection(db, 'submissions'), {
          ...releaseData,
          status: 'pending',
          submittedAt: serverTimestamp()
        })

        // Send email notification
        await fetch('/api/send-release', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newRelease,
            tracks: uploadedTracks,
            coverImage: coverUrl,
            userEmail
          }),
        })

        alert('Release submitted successfully!')
      }

      // Reset form
      setShowCreateForm(false)
      setEditingRelease(null)
      setNewRelease({
        title: '',
        artist: '',
        featuringArtists: '',
        label: 'Afterglow Music',
        releaseDate: '',
        upc: '',
        genre: '',
        format: '',
        price: 'standard',
        territories: 'worldwide',
        promotionText: '',
        spotifyUrl: '',
        appleMusicUrl: '',
        youtubeChannelUrl: '',
        claimYoutubeOAC: false
      })
      setSelectedSubgenre('')
      setTracks([])
      setAudioFiles([])
      setCoverFile(null)
      setCoverPreview('')
      setUploadProgress(0)
      setActiveTab('release')
    } catch (error) {
      console.error('Error:', error)
      alert('Error submitting release: ' + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>

        <button className="btn-new-release" onClick={() => setShowCreateForm(true)}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          <span>New Release</span>
        </button>

        <div className="nav-section-label">Library</div>
        <div className="nav-item active">
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          <span>All Releases</span>
          {submissions.length > 0 && <span className="nav-badge">{submissions.length}</span>}
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          <span>Drafts</span>
        </div>

        <div className="nav-section-label">Insights</div>
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="13" width="4" height="9" rx="1"/>
            <rect x="9" y="8" width="4" height="14" rx="1"/>
            <rect x="16" y="3" width="4" height="19" rx="1"/>
          </svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item" onClick={() => router.push('/promotion')}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
          </svg>
          <span>Promotion</span>
        </div>

        <div className="sidebar-footer">
          <div className="nav-item" onClick={handleLogout} style={{ color: 'rgba(248,113,113,0.7)' }}>
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.7 }}>
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            <span>Logout</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <div className="header-left">
            <h1>All Releases</h1>
            <p>Manage and track your music catalog</p>
          </div>
          <div className="user-info">
            <AvatarUpload userId={userId} username={username} photoURL={photoURL} size={34} onUpdate={setPhotoURL} />
            <span>{username}</span>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#818cf8">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
            </div>
            <h3>Total Releases</h3>
            <div className="value">{submissions.length}</div>
            <div className="trend">↑ Active catalog</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(52,211,153,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#34d399">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
              </svg>
            </div>
            <h3>Total Tracks</h3>
            <div className="value">{submissions.reduce((sum, s) => sum + (s.tracks || 0), 0)}</div>
            <div className="trend">↑ All formats</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </div>
            <h3>Territories</h3>
            <div className="value">240</div>
            <div className="trend">↑ Worldwide</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(236,72,153,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="#ec4899">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/>
              </svg>
            </div>
            <h3>Stores</h3>
            <div className="value">120+</div>
            <div className="trend">↑ Platforms</div>
          </div>
        </div>

        <div className="actions">
          <div className="search-wrapper">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input type="text" className="search-box" placeholder="Search releases, artists..."/>
          </div>
          <button className="filter-btn">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
            </svg>
            Filter
          </button>
          <button className="btn-primary">Export</button>
        </div>

        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingRelease ? 'Edit Release' : 'One release: Audio Release, EP or Single'}</h2>
                <button className="btn-close" onClick={() => {
                  setShowCreateForm(false)
                  setEditingRelease(null)
                }}>
                  ×
                </button>
              </div>
              <div className="tabs">
                <div className={`tab ${activeTab === 'release' ? 'active' : ''}`} onClick={() => setActiveTab('release')}>
                  Release information
                </div>
                <div className={`tab ${activeTab === 'upload' ? 'active' : ''}`} onClick={() => setActiveTab('upload')}>
                  Upload
                </div>
                <div className={`tab ${activeTab === 'tracks' ? 'active' : ''}`} onClick={() => setActiveTab('tracks')}>
                  Tracks
                </div>
                <div className={`tab ${activeTab === 'price' ? 'active' : ''}`} onClick={() => setActiveTab('price')}>
                  Price
                </div>
                <div className={`tab ${activeTab === 'territories' ? 'active' : ''}`} onClick={() => setActiveTab('territories')}>
                  Territories
                </div>
                <div className={`tab ${activeTab === 'releasedate' ? 'active' : ''}`} onClick={() => setActiveTab('releasedate')}>
                  Release date
                </div>
                <div className={`tab ${activeTab === 'promotion' ? 'active' : ''}`} onClick={() => setActiveTab('promotion')}>
                  Promotion
                </div>
                <div className={`tab ${activeTab === 'submission' ? 'active' : ''}`} onClick={() => setActiveTab('submission')}>
                  Submission
                </div>
              </div>
              <form onSubmit={handleCreateRelease} className="release-form">
                {activeTab === 'release' && (
                  <>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Release title *</label>
                        <input
                          type="text"
                          value={newRelease.title}
                          onChange={(e) => setNewRelease({...newRelease, title: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-col">
                        <label>Version/Subtitle</label>
                        <input type="text" />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Primary artist *</label>
                        <input
                          type="text"
                          value={newRelease.artist}
                          onChange={(e) => setNewRelease({...newRelease, artist: e.target.value})}
                          required
                        />
                      </div>
                      <div className="form-col">
                        <label>Featuring Artists (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g., Artist 2, Artist 3"
                          value={newRelease.featuringArtists}
                          onChange={(e) => setNewRelease({...newRelease, featuringArtists: e.target.value})}
                        />
                        <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' }}>
                          Separate multiple artists with commas
                        </small>
                      </div>
                    </div>
                    
                    <div style={{ margin: '30px 0' }}>
                      <h3 style={{ marginBottom: '15px' }}>Cover Art *</h3>
                      <div 
                        className="dropzone"
                        onDrop={handleCoverDrop}
                        onDragOver={(e) => e.preventDefault()}
                        style={{
                          border: '2px dashed rgba(255,255,255,0.1)',
                          borderRadius: '10px',
                          padding: '40px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: coverPreview ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)'
                        }}
                        onClick={() => document.getElementById('cover-input')?.click()}
                      >
                        {coverPreview ? (
                          <div>
                            <img 
                              src={coverPreview} 
                              alt="Cover preview" 
                              style={{ 
                                maxWidth: '200px', 
                                maxHeight: '200px', 
                                borderRadius: '4px',
                                marginBottom: '15px'
                              }} 
                            />
                            <p style={{ color: '#34d399', fontWeight: 600, marginBottom: '5px' }}>✓ Cover art uploaded</p>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Click or drag to replace</p>
                          </div>
                        ) : (
                          <div>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 15px' }}>
                              <path d="M7 18C5.17107 18.4117 4 19.0443 4 19.7537C4 20.9943 7.58172 22 12 22C16.4183 22 20 20.9943 20 19.7537C20 19.0443 18.8289 18.4117 17 18M12 15V3M12 3L8 7M12 3L16 7" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p style={{ fontWeight: 600, marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>Drag & drop cover art here</p>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '15px' }}>or click to browse</p>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>JPG or PNG • Min 3000x3000px • Max 10MB</p>
                          </div>
                        )}
                        <input
                          id="cover-input"
                          type="file"
                          accept="image/*"
                          onChange={handleCoverSelect}
                          style={{ display: 'none' }}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="form-col">
                        <label>Production Year *</label>
                        <select>
                          <option>Select a year</option>
                          <option>2026</option>
                          <option>2025</option>
                          <option>2024</option>
                        </select>
                      </div>
                      <div className="form-col">
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Spotify Artist URL *</label>
                        <input
                          type="text"
                          placeholder="https://open.spotify.com/artist/... or type: I don't have artist profile yet"
                          value={newRelease.spotifyUrl}
                          onChange={(e) => setNewRelease({...newRelease, spotifyUrl: e.target.value})}
                          required
                        />
                        <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' }}>
                          Enter your Spotify artist URL or type "I don't have artist profile yet"
                        </small>
                      </div>
                      <div className="form-col">
                        <label>Apple Music Artist URL *</label>
                        <input
                          type="text"
                          placeholder="https://music.apple.com/artist/... or type: I don't have artist profile yet"
                          value={newRelease.appleMusicUrl}
                          onChange={(e) => setNewRelease({...newRelease, appleMusicUrl: e.target.value})}
                          required
                        />
                        <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' }}>
                          Enter your Apple Music artist URL or type "I don't have artist profile yet"
                        </small>
                      </div>
                    </div>
                    
                    <div style={{ margin: '24px 0', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <h3 style={{ marginBottom: '16px', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                        YouTube Official Artist Channel
                      </h3>
                      
                      <div className="form-row">
                        <div className="form-col">
                          <label>YouTube Channel URL</label>
                          <input
                            type="text"
                            placeholder="https://www.youtube.com/@yourartist or type: I don't have channel yet"
                            value={newRelease.youtubeChannelUrl}
                            onChange={(e) => setNewRelease({...newRelease, youtubeChannelUrl: e.target.value})}
                          />
                          <small style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'block' }}>
                            Enter your YouTube channel URL or type "I don't have channel yet"
                          </small>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={newRelease.claimYoutubeOAC}
                            onChange={(e) => setNewRelease({...newRelease, claimYoutubeOAC: e.target.checked})}
                            style={{ marginTop: '3px', width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <div>
                            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                              Claim YouTube Official Artist Channel (OAC)
                            </span>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '5px', lineHeight: '1.5' }}>
                              We will help you claim your Official Artist Channel on YouTube. This gives you access to YouTube Music analytics, 
                              artist profile customization, and the official artist badge. Required: You must have an existing YouTube channel.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Genre *</label>
                        <select
                          value={newRelease.genre}
                          onChange={(e) => handleGenreChange(e.target.value)}
                          required
                        >
                          <option value="">Select a genre</option>
                          <option>Alternative</option>
                          <option>Blues</option>
                          <option>Children's Music</option>
                          <option>Classical</option>
                          <option>Country</option>
                          <option>Dance</option>
                          <option>Electronic</option>
                          <option>Folk</option>
                          <option>Hip-Hop/Rap</option>
                          <option>Jazz</option>
                          <option>Latin</option>
                          <option>Metal</option>
                          <option>Pop</option>
                          <option>R&B/Soul</option>
                          <option>Reggae</option>
                          <option>Rock</option>
                          <option>Soundtrack</option>
                          <option>World</option>
                        </select>
                      </div>
                      <div className="form-col">
                        <label>Subgenre *</label>
                        <select 
                          value={selectedSubgenre}
                          onChange={(e) => setSelectedSubgenre(e.target.value)}
                          required 
                          disabled={!newRelease.genre}
                        >
                          <option value="">Select a sub-genre</option>
                          {subgenres.map((subgenre) => (
                            <option key={subgenre} value={subgenre}>
                              {subgenre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Producer catalogue number</label>
                        <input type="text" />
                      </div>
                      <div className="form-col">
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Label name *</label>
                        <input
                          type="text"
                          value="Afterglow Music"
                          disabled
                          style={{ background: '#f7fafc', color: '#718096' }}
                        />
                      </div>
                      <div className="form-col">
                        <label>Format *</label>
                        <select
                          value={newRelease.format}
                          onChange={(e) => setNewRelease({...newRelease, format: e.target.value})}
                          required
                        >
                          <option value="">Select a format</option>
                          <option>Single</option>
                          <option>EP</option>
                          <option>Album</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Physical/Original release date</label>
                        <input
                          type="date"
                          value={newRelease.releaseDate}
                          onChange={(e) => setNewRelease({...newRelease, releaseDate: e.target.value})}
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'upload' && (
                  <div className="upload-section">
                    <h3>Upload Audio Files</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '20px', fontSize: '13px' }}>Upload all your audio files at once. They will automatically be added to the track list.</p>
                    
                    <div 
                      className="dropzone"
                      onDrop={handleAudioDrop}
                      onDragOver={(e) => e.preventDefault()}
                      style={{
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        padding: '60px 40px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: audioFiles.length > 0 ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => document.getElementById('audio-input')?.click()}
                    >
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 18px' }}>
                        <path d="M9 18V5L21 12L9 19V18ZM9 5V19M3 5V19" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <p style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'rgba(255,255,255,0.8)' }}>
                        {audioFiles.length > 0 ? `${audioFiles.length} file(s) uploaded` : 'Drag & drop audio files here'}
                      </p>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px' }}>
                        or click to browse
                      </p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
                        MP3, WAV, FLAC • Max 200MB per file • Multiple files supported
                      </p>
                      <input
                        id="audio-input"
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={handleAudioSelect}
                        style={{ display: 'none' }}
                      />
                    </div>
                    
                    {audioFiles.length > 0 && (
                      <div style={{ marginTop: '30px' }}>
                        <h4 style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 700 }}>Uploaded Files ({audioFiles.length})</h4>
                        {audioFiles.map((file, index) => (
                          <div 
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.07)',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18V5L21 12L9 19V18ZM9 5V19M3 5V19" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, marginBottom: '2px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>{file.name}</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAudioFile(index)}
                              style={{
                                width: '28px', height: '28px',
                                background: 'rgba(239,68,68,0.12)',
                                color: '#f87171',
                                border: '1px solid rgba(239,68,68,0.18)',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'inherit'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'tracks' && (
                  <div className="tracks-section">
                    <h3>Track Details & Metadata</h3>
                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '18px', fontSize: '13px' }}>
                      {tracks.length > 0 ? 'Complete track information and credits below' : 'Please upload audio files first'}
                    </p>
                    
                    {tracks.length === 0 ? (
                      <div style={{ 
                        padding: '60px 20px', 
                        textAlign: 'center', 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '10px',
                        border: '2px dashed rgba(255,255,255,0.08)'
                      }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 20px', opacity: 0.3 }}>
                          <path d="M9 18V5L21 12L9 19V18ZM9 5V19M3 5V19" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <p style={{ fontSize: '16px', color: '#718096' }}>No audio files uploaded yet</p>
                        <p style={{ fontSize: '14px', color: '#a0aec0', marginTop: '8px' }}>Go back to Upload tab to add audio files</p>
                      </div>
                    ) : (
                      tracks.map((track, index) => (
                        <div key={index} style={{ 
                          marginBottom: '20px', 
                          padding: '20px', 
                          border: '1px solid rgba(255,255,255,0.07)', 
                          borderRadius: '10px',
                          background: 'rgba(255,255,255,0.02)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                            <div style={{ 
                              minWidth: '36px', 
                              height: '36px', 
                              background: 'rgba(99,102,241,0.2)', 
                              color: '#818cf8', 
                              borderRadius: '50%', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '14px'
                            }}>
                              {index + 1}
                            </div>
                            <div style={{ 
                              flex: 1,
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '10px',
                              padding: '9px 12px',
                              background: 'rgba(255,255,255,0.03)',
                              borderRadius: '7px',
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M9 18V5L21 12L9 19V18ZM9 5V19M3 5V19" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                                {track.file ? `${track.file.name} (${(track.file.size / (1024 * 1024)).toFixed(2)} MB)` : 'Audio file uploaded'}
                              </span>
                            </div>
                          </div>
                          
                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', color: 'rgba(255,255,255,0.85)' }}>Basic Information</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Track Title *
                              </label>
                              <input
                                type="text"
                                placeholder="Enter track title"
                                value={track.title}
                                onChange={(e) => updateTrack(index, 'title', e.target.value)}
                                required
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Primary Artist
                              </label>
                              <input
                                type="text"
                                placeholder={`Default: ${newRelease.artist || 'Primary artist'}`}
                                value={track.artist}
                                onChange={(e) => updateTrack(index, 'artist', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Featuring Artists
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Artist 2, Artist 3"
                                value={track.featuring}
                                onChange={(e) => updateTrack(index, 'featuring', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                ISRC Code
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., USRC17607839"
                                value={track.isrc}
                                onChange={(e) => updateTrack(index, 'isrc', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', color: 'rgba(255,255,255,0.85)' }}>Songwriting & Composition</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Composer/Songwriter
                              </label>
                              <input
                                type="text"
                                placeholder="Who wrote the music?"
                                value={track.composer}
                                onChange={(e) => updateTrack(index, 'composer', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Lyricist
                              </label>
                              <input
                                type="text"
                                placeholder="Who wrote the lyrics?"
                                value={track.lyricist}
                                onChange={(e) => updateTrack(index, 'lyricist', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Arranger
                              </label>
                              <input
                                type="text"
                                placeholder="Who arranged the track?"
                                value={track.arranger}
                                onChange={(e) => updateTrack(index, 'arranger', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', color: 'rgba(255,255,255,0.85)' }}>Production & Engineering</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Producer
                              </label>
                              <input
                                type="text"
                                placeholder="Who produced this track?"
                                value={track.producer}
                                onChange={(e) => updateTrack(index, 'producer', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Recording Studio
                              </label>
                              <input
                                type="text"
                                placeholder="Where was it recorded?"
                                value={track.recordingStudio}
                                onChange={(e) => updateTrack(index, 'recordingStudio', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Mixing Engineer
                              </label>
                              <input
                                type="text"
                                placeholder="Who mixed the track?"
                                value={track.mixingEngineer}
                                onChange={(e) => updateTrack(index, 'mixingEngineer', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Mastering Engineer
                              </label>
                              <input
                                type="text"
                                placeholder="Who mastered the track?"
                                value={track.masteringEngineer}
                                onChange={(e) => updateTrack(index, 'masteringEngineer', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', color: 'rgba(255,255,255,0.85)' }}>Performers & Musicians</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Lead Vocals
                              </label>
                              <input
                                type="text"
                                placeholder="Lead vocalist(s)"
                                value={track.leadVocals}
                                onChange={(e) => updateTrack(index, 'leadVocals', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Background Vocals
                              </label>
                              <input
                                type="text"
                                placeholder="Background vocalist(s)"
                                value={track.backgroundVocals}
                                onChange={(e) => updateTrack(index, 'backgroundVocals', e.target.value)}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                Musicians & Instruments
                              </label>
                              <textarea
                                placeholder="e.g., John Doe - Guitar, Jane Smith - Piano, etc."
                                value={track.musicians}
                                onChange={(e) => updateTrack(index, 'musicians', e.target.value)}
                                rows={2}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  resize: 'vertical'
                                }}
                              />
                            </div>
                          </div>

                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '15px', color: 'rgba(255,255,255,0.85)' }}>Copyright Information</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                ℗ Line (Sound Recording)
                              </label>
                              <input
                                type="text"
                                value={track.pLine}
                                disabled
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  background: '#f7fafc',
                                  color: '#718096'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                © Line (Composition)
                              </label>
                              <input
                                type="text"
                                value={track.cLine}
                                disabled
                                style={{ 
                                  width: '100%', 
                                  padding: '8px 12px', 
                                  border: '1px solid #cbd5e0', 
                                  borderRadius: '4px',
                                  fontSize: '14px',
                                  background: '#f7fafc',
                                  color: '#718096'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'price' && (
                  <div className="price-section">
                    <h3>Pricing</h3>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Price Tier *</label>
                        <select
                          value={newRelease.price}
                          onChange={(e) => setNewRelease({...newRelease, price: e.target.value})}
                        >
                          <option value="standard">Standard ($0.99 per track)</option>
                          <option value="premium">Premium ($1.29 per track)</option>
                          <option value="budget">Budget ($0.69 per track)</option>
                        </select>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '10px' }}>
                      Pricing will be automatically converted to local currencies based on store requirements.
                    </p>
                  </div>
                )}

                {activeTab === 'territories' && (
                  <div className="territories-section">
                    <h3>Distribution Territories</h3>
                    <div className="form-row">
                      <div className="form-col">
                        <label>
                          <input
                            type="radio"
                            name="territories"
                            value="worldwide"
                            checked={newRelease.territories === 'worldwide'}
                            onChange={(e) => setNewRelease({...newRelease, territories: e.target.value})}
                          />
                          <span style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>Worldwide (240 territories)</span>
                        </label>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-col">
                        <label>
                          <input
                            type="radio"
                            name="territories"
                            value="selected"
                            checked={newRelease.territories === 'selected'}
                            onChange={(e) => setNewRelease({...newRelease, territories: e.target.value})}
                          />
                          <span style={{ marginLeft: '8px', color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>Selected territories only</span>
                        </label>
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '10px' }}>
                      Your release will be distributed to 120+ platforms including Spotify, Apple Music, Amazon Music, YouTube Music, and many more worldwide.
                    </p>
                  </div>
                )}

                {activeTab === 'releasedate' && (
                  <div className="releasedate-section">
                    <h3>Release Date</h3>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Digital Release Date *</label>
                        <input
                          type="date"
                          value={newRelease.releaseDate}
                          onChange={(e) => setNewRelease({...newRelease, releaseDate: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginTop: '10px' }}>
                      Please submit at least 2 weeks before your desired release date to ensure timely distribution.
                    </p>
                  </div>
                )}

                {activeTab === 'promotion' && (
                  <div className="promotion-section">
                    <h3>Promotion</h3>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Promotional Text</label>
                        <textarea
                          rows={5}
                          placeholder="Add promotional text or press release information..."
                          value={newRelease.promotionText}
                          onChange={(e) => setNewRelease({...newRelease, promotionText: e.target.value})}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#fff', fontFamily: 'inherit', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'submission' && (
                  <div className="submission-section">
                    <h3>Review & Submit</h3>
                    <div className="review-card">
                      <h4>Release Information</h4>
                      <p><strong>Title:</strong> {newRelease.title || 'Not set'}</p>
                      <p><strong>Artist:</strong> {newRelease.artist || 'Not set'}</p>
                      <p><strong>Genre:</strong> {newRelease.genre || 'Not set'}</p>
                      <p><strong>Format:</strong> {newRelease.format || 'Not set'}</p>
                      <p><strong>Release Date:</strong> {newRelease.releaseDate || 'Not set'}</p>
                      <p><strong>Tracks:</strong> {tracks.length}</p>
                      <p><strong>Territories:</strong> {newRelease.territories === 'worldwide' ? 'Worldwide (240)' : 'Selected'}</p>
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  {activeTab !== 'release' && (
                    <button type="button" className="btn-secondary" onClick={goToPreviousTab} disabled={isUploading}>
                      ← Previous
                    </button>
                  )}
                  {activeTab !== 'submission' ? (
                    <button type="button" className="btn-primary" onClick={goToNextTab} disabled={isUploading}>
                      Next →
                    </button>
                  ) : (
                    <button type="submit" className="btn-save" disabled={isUploading}>
                      {isUploading ? 'Uploading...' : editingRelease ? 'Update Release' : 'Save & Submit'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="releases-table">
          {submissions.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-state-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
              </svg>
              <h3>No Releases Yet</h3>
              <p>Click "One release" to submit your first release</p>
            </div>
          ) : (
            submissions.map((submission) => (
              <div 
                key={submission.id} 
                className="release-card"
              >
                <div 
                  className="release-card-cover"
                  onClick={() => router.push(`/release/${submission.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {submission.coverImage ? (
                    <img 
                      src={submission.coverImage} 
                      alt={submission.title}
                    />
                  ) : (
                    <div className="release-card-cover-placeholder">🎵</div>
                  )}
                  <div 
                    className="release-card-status"
                    style={{
                      background: submission.status === 'approved' ? 'rgba(52,211,153,0.9)' : 
                                 submission.status === 'rejected' ? 'rgba(248,113,113,0.9)' : 
                                 'rgba(251,191,36,0.9)',
                      color: submission.status === 'pending' ? '#1a1a00' : 'white'
                    }}
                  >
                    {submission.status === 'approved' ? '✓ Live' : 
                     submission.status === 'rejected' ? '✗ Rejected' : 
                     '⏱ Pending'}
                  </div>
                  <div className="release-card-play">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="white">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div className="release-card-content">
                  <div 
                    className="release-card-title"
                    onClick={() => router.push(`/release/${submission.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {submission.title}
                  </div>
                  <div className="release-card-artist">By {submission.artist}</div>
                  <div className="release-card-meta">
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Format</div>
                      <div className="release-card-meta-value" style={{ textTransform: 'capitalize' }}>
                        {submission.format}
                      </div>
                    </div>
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Tracks</div>
                      <div className="release-card-meta-value">
                        {submission.tracks}
                      </div>
                    </div>
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Genre</div>
                      <div className="release-card-meta-value">
                        {submission.genre}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditRelease(submission)
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        background: 'rgba(99,102,241,0.15)',
                        color: '#818cf8',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClick(submission)
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 10px',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.18)',
                        borderRadius: '7px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        transition: 'all 0.2s',
                        fontFamily: 'inherit'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="modal-header">
              <h2>Delete Release</h2>
              <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <div style={{ 
                background: 'rgba(239,68,68,0.08)', 
                padding: '16px', 
                borderRadius: '10px', 
                marginBottom: '18px',
                border: '1px solid rgba(239,68,68,0.2)'
              }}>
                <p style={{ fontWeight: 700, marginBottom: '6px', color: '#f87171', fontSize: '14px' }}>
                  Are you sure you want to delete this release?
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                  <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{releaseToDelete?.title}</strong> by {releaseToDelete?.artist}
                </p>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '7px', fontWeight: 600, fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Reason for deletion (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g., Wrong files uploaded, need to make changes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '13px',
                    resize: 'vertical',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '18px' }}>
                This action cannot be undone. Both you and the admin will receive an email notification.
              </p>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(239,68,68,0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239,68,68,0.25)',
                    borderRadius: '9px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
                >
                  Delete Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
