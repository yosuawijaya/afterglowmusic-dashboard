'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AvatarUpload from '@/app/components/AvatarUpload'
import NotificationBell from '@/app/components/NotificationBell'
import OnboardingModal from '@/app/components/OnboardingModal'
import EditUsername from '@/app/components/EditUsername'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const ITEMS_PER_PAGE = 12
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingSubmissions, setLoadingSubmissions] = useState(true)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
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
    const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.wav'))
    if (files.length === 0) {
      alert('Only WAV files are accepted. Please upload WAV format audio.')
      return
    }
    setAudioFiles(prev => [...prev, ...files])
    const currentYear = new Date().getFullYear()
    const newTracks = files.map(file => ({
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: newRelease.artist || '',
      file,
      uploadProgress: 0,
      featuring: '', composer: '', lyricist: '', producer: '',
      arranger: '', recordingStudio: '', mixingEngineer: '', masteringEngineer: '',
      leadVocals: '', backgroundVocals: '', musicians: '', isrc: '',
      pLine: `℗ ${currentYear} Afterglow Music`,
      cLine: `© ${currentYear} Afterglow Music`
    }))
    setTracks(prev => [...prev, ...newTracks])
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allFiles = Array.from(e.target.files || [])
    const wavFiles = allFiles.filter(f => f.name.toLowerCase().endsWith('.wav'))
    const rejected = allFiles.length - wavFiles.length

    if (rejected > 0) {
      alert(`${rejected} file(s) rejected — only WAV format is accepted.`)
    }
    if (wavFiles.length === 0) return

    const files = wavFiles
    setAudioFiles(prev => [...prev, ...files])
    const currentYear = new Date().getFullYear()
    const newTracks = files.map(file => ({
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: newRelease.artist || '',
      file,
      uploadProgress: 0,
      featuring: '', composer: '', lyricist: '', producer: '',
      arranger: '', recordingStudio: '', mixingEngineer: '', masteringEngineer: '',
      leadVocals: '', backgroundVocals: '', musicians: '', isrc: '',
      pLine: `℗ ${currentYear} Afterglow Music`,
      cLine: `© ${currentYear} Afterglow Music`
    }))
    setTracks(prev => [...prev, ...newTracks])
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
      
      // Show onboarding for new users
      const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding')
      if (!hasSeenOnboarding) setShowOnboarding(true)      
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
          setLoadingSubmissions(false)

          // Auto-create in-app notifications for rejected releases
          const uid2 = localStorage.getItem('userId') || ''
          if (uid2) {
            ;(async () => {
              try {
                const { getDocs: gd, query: q2, collection: col, where: wh, addDoc: ad, serverTimestamp: st2 } = await import('firebase/firestore')
                for (const sub of submissionsData) {
                  if (sub.status === 'rejected') {
                    const existing = await gd(q2(col(db, 'notifications'), wh('userId', '==', uid2), wh('releaseId', '==', sub.id)))
                    if (existing.empty) {
                      await ad(col(db, 'notifications'), {
                        userId: uid2,
                        releaseId: sub.id,
                        title: `"${sub.title}" needs revision`,
                        message: sub.rejectionReason || 'Your release requires changes. Check your email for details.',
                        type: 'rejected',
                        read: false,
                        createdAt: st2(),
                      })
                    }
                  }
                }
              } catch (e) {
                // Silently fail if permissions not set yet
                console.warn('Notification auto-create skipped:', e)
              }
            })()
          }
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

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = !searchQuery || 
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const pendingCount = submissions.filter(s => s.status === 'pending').length
  const approvedCount = submissions.filter(s => s.status === 'approved').length

  const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE)
  const paginatedSubmissions = filteredSubmissions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="dashboard">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}

      {/* ===== SIDEBAR ===== */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="logo">Afterglow Music</div>

        <button className="btn-new-release" onClick={() => { setEditingRelease(null); router.push('/new-release'); }}>
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
        <div className="nav-item" onClick={() => { router.push('/drafts'); setSidebarOpen(false); }}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          <span>Drafts</span>
        </div>

        <div className="nav-section-label">Insights</div>
        <div className="nav-item" onClick={() => { router.push('/analytics'); setSidebarOpen(false); }}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="13" width="4" height="9" rx="1"/>
            <rect x="9" y="8" width="4" height="14" rx="1"/>
            <rect x="16" y="3" width="4" height="19" rx="1"/>
          </svg>
          <span>Analytics</span>
        </div>
        <div className="nav-item" onClick={() => { router.push('/royalties'); setSidebarOpen(false); }}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
          </svg>
          <span>Royalties</span>
        </div>
        <div className="nav-item" onClick={() => { router.push('/promotion'); setSidebarOpen(false); }}>
          <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
          </svg>
          <span>Promotion</span>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
            <AvatarUpload userId={userId} username={username} photoURL={photoURL} size={32} onUpdate={setPhotoURL} />
            <EditUsername userId={userId} username={username} role="Artist" onUpdate={setUsername} />
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-content">

        {/* ===== MOBILE TOP BAR ===== */}
        <div className="mobile-topbar" style={{ display: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logos/logo-afterglowmusic.png" alt="Afterglow Music" style={{ height: '28px', objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell userId={userId} />
            <AvatarUpload userId={userId} username={username} photoURL={photoURL} size={30} onUpdate={setPhotoURL} />
          </div>
        </div>

        {/* Sticky compact header — appears on scroll */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: '252px',
          right: 0,
          height: '52px',
          background: 'rgba(5,5,13,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 36px',
          zIndex: 90,
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'opacity 0.25s ease, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          pointerEvents: scrolled ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              {username}'s Studio
            </span>
            {pendingCount > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 9px', borderRadius: '20px' }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <NotificationBell userId={userId} />
            <button className="btn-primary" onClick={() => router.push('/new-release')} style={{ padding: '7px 16px', fontSize: '12px' }}>
              + New Release
            </button>
            <button className="btn-logout" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '12px' }}>Sign Out</button>
          </div>
        </div>
        {/* ===== HERO HEADER ===== */}
        <div className="mobile-hero" style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(236,72,153,0.05) 50%, transparent 100%)',
          border: '1px solid rgba(99,102,241,0.12)',
          borderRadius: '20px',
          padding: '28px 32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '25%', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), rgba(236,72,153,0.4), transparent)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(165,180,252,0.6)', textTransform: 'uppercase', letterSpacing: '2.5px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#a5b4fc' }} />
                Artist Portal
              </div>
              <h1 className="page-title" style={{ marginBottom: '8px' }}>
                {submissions.length > 0 ? `${username}'s Studio` : `Welcome, ${username}`}
              </h1>
              <p className="page-subtitle">
                {submissions.length > 0
                  ? `${submissions.length} release${submissions.length > 1 ? 's' : ''} in your catalog · ${approvedCount} live worldwide · ${pendingCount} in review`
                  : 'Your music, distributed worldwide. Submit your first release to get started.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/></svg>
              </button>
              <NotificationBell userId={userId} />
              <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </div>

        {/* ===== COMMAND CENTER — Today's Actions ===== */}
        {(pendingCount > 0 || submissions.some(s => s.status === 'rejected') || submissions.length === 0) && (
          <div style={{ marginBottom: '28px' }}>
            <div className="section-heading">Action Required</div>
            <div className="action-items">
              {submissions.length === 0 && (
                <div className="action-item" style={{ background: 'rgba(99,102,241,0.07)', borderColor: 'rgba(99,102,241,0.2)', color: '#a5b4fc', animationDelay: '0.05s' }}
                  onClick={() => router.push('/new-release')}>
                  <div className="action-item-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="#a5b4fc"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                  </div>
                  <div className="action-item-text">
                    <div className="action-item-title">Submit your first release</div>
                    <div className="action-item-desc">Get your music on Spotify, Apple Music, and 120+ platforms</div>
                  </div>
                  <span className="action-item-arrow">→</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="action-item" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)', color: '#f59e0b', animationDelay: '0.1s' }}>
                  <div className="action-item-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="#f59e0b"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
                  </div>
                  <div className="action-item-text">
                    <div className="action-item-title">{pendingCount} release{pendingCount > 1 ? 's' : ''} under review</div>
                    <div className="action-item-desc">Our team is reviewing your submission — typically 2–3 business days</div>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', padding: '4px 10px', borderRadius: '20px' }}>In Progress</div>
                </div>
              )}
              {submissions.filter(s => s.status === 'rejected').map(s => (
                <div key={s.id} className="action-item" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.2)', color: '#f87171', animationDelay: '0.15s' }}
                  onClick={() => router.push(`/new-release?edit=${s.id}`)}>
                  <div className="action-item-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="#f87171"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  </div>
                  <div className="action-item-text">
                    <div className="action-item-title">"{s.title}" needs revision</div>
                    <div className="action-item-desc">{s.rejectionReason || 'Check your email for details and resubmit'}</div>
                  </div>
                  <span className="action-item-arrow">→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats">
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(10,10,21,1) 60%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.2)', width: '44px', height: '44px', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#a5b4fc">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                </svg>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.2)' }}>CATALOG</span>
            </div>
            <div className="value" style={{ fontSize: '40px', marginBottom: '4px' }}>{submissions.length}</div>
            <h3 style={{ marginBottom: '6px' }}>Total Releases</h3>
            <div className="trend">{approvedCount} live · {pendingCount} pending</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(10,10,21,1) 60%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.18)', width: '44px', height: '44px', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#34d399">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                </svg>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>TRACKS</span>
            </div>
            <div className="value" style={{ fontSize: '40px', marginBottom: '4px' }}>{submissions.reduce((sum, s) => sum + (s.tracks || 0), 0)}</div>
            <h3 style={{ marginBottom: '6px' }}>Total Tracks</h3>
            <div className="trend">All formats combined</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1) 0%, rgba(10,10,21,1) 60%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.18)', width: '44px', height: '44px', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', background: 'rgba(245,158,11,0.12)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(245,158,11,0.2)' }}>GLOBAL</span>
            </div>
            <div className="value" style={{ fontSize: '40px', marginBottom: '4px' }}>240</div>
            <h3 style={{ marginBottom: '6px' }}>Territories</h3>
            <div className="trend">Worldwide distribution</div>
          </div>

          <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(10,10,21,1) 60%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div className="stat-card-icon" style={{ background: 'rgba(236,72,153,0.18)', width: '44px', height: '44px', borderRadius: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#f472b6">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z"/>
                </svg>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#f472b6', background: 'rgba(236,72,153,0.12)', padding: '3px 8px', borderRadius: '20px', border: '1px solid rgba(236,72,153,0.2)' }}>STORES</span>
            </div>
            <div className="value" style={{ fontSize: '40px', marginBottom: '4px' }}>120+</div>
            <h3 style={{ marginBottom: '6px' }}>Platforms</h3>
            <div className="trend">Spotify, Apple, YouTube +</div>
          </div>
        </div>

        {/* Search + Filter + View Toggle */}
        <div className="actions">
          <div className="search-wrapper">
            <svg className="search-icon" width="15" height="15" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="search-box"
              placeholder="Search releases, artists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
              </svg>
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="status-filters">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button
              key={s}
              className={`status-filter-btn ${statusFilter === s ? `active-${s}` : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? `All (${submissions.length})` :
               s === 'pending' ? `Pending (${pendingCount})` :
               s === 'approved' ? `Live (${approvedCount})` :
               `Rejected (${submissions.filter(x => x.status === 'rejected').length})`}
            </button>
          ))}
        </div>

        {showCreateForm && (
          <div className="modal-overlay" onClick={() => { setShowCreateForm(false); setEditingRelease(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>{editingRelease ? `Editing: ${editingRelease.title}` : 'Submit New Release'}</h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {editingRelease ? 'Update your release information' : 'Single · EP · Album'}
                  </p>
                </div>
                <button className="btn-close" onClick={() => { setShowCreateForm(false); setEditingRelease(null); }}>×</button>
              </div>

              {/* Visual progress bar */}
              {(() => {
                const tabList = ['release','upload','tracks','price','territories','releasedate','promotion','submission']
                const currentIdx = tabList.indexOf(activeTab)
                const pct = Math.round(((currentIdx + 1) / tabList.length) * 100)
                return (
                  <div style={{ padding: '0 26px 0', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Step {currentIdx + 1} of {tabList.length}</span>
                      <span style={{ fontSize: '11px', color: 'rgba(165,180,252,0.7)', fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', marginBottom: '0', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #ec4899)', borderRadius: '3px', transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                  </div>
                )
              })()}

              <div className="tabs">
                {[
                  { id: 'release', label: 'Release Info', num: 1 },
                  { id: 'upload', label: 'Upload', num: 2 },
                  { id: 'tracks', label: 'Tracks', num: 3 },
                  { id: 'price', label: 'Price', num: 4 },
                  { id: 'territories', label: 'Territories', num: 5 },
                  { id: 'releasedate', label: 'Release Date', num: 6 },
                  { id: 'promotion', label: 'Promotion', num: 7 },
                  { id: 'submission', label: 'Review', num: 8 },
                ].map(t => {
                  const tabList = ['release','upload','tracks','price','territories','releasedate','promotion','submission']
                  const currentIdx = tabList.indexOf(activeTab)
                  const tIdx = tabList.indexOf(t.id)
                  const isDone = tIdx < currentIdx
                  return (
                    <div
                      key={t.id}
                      className={`tab ${activeTab === t.id ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                      onClick={() => setActiveTab(t.id)}
                    >
                      <span className="tab-step">{isDone ? '✓' : t.num}</span>
                      {t.label}
                    </div>
                  )
                })}
              </div>
              <form onSubmit={handleCreateRelease} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div className="release-form" style={{ flex: 1 }}>
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
                        WAV only · Max 200MB per file · Multiple files supported
                      </p>
                      <input
                        id="audio-input"
                        type="file"
                        accept="audio/wav,.wav"
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
                  <div>
                    {activeTab !== 'release' && (
                      <button type="button" className="btn-secondary" onClick={goToPreviousTab} disabled={isUploading}>
                        ← Back
                      </button>
                    )}
                  </div>
                  <div className="form-actions-right">
                    {activeTab !== 'submission' ? (
                      <button type="button" className="btn-save" onClick={goToNextTab} disabled={isUploading}>
                        Continue →
                      </button>
                    ) : (
                      <button type="submit" className="btn-save" disabled={isUploading}>
                        {isUploading ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            Uploading...
                          </span>
                        ) : editingRelease ? 'Update Release' : 'Submit Release'}
                      </button>
                    )}
                  </div>
                </div>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>{/* end release-form div */}
              </form>
            </div>
          </div>
        )}

        {/* ===== ACTIVITY + UPCOMING SECTION ===== */}
        {submissions.length > 0 && !searchQuery && statusFilter === 'all' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            {/* Recent Activity */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Recent Activity</span>
              </div>
              <div style={{ padding: '4px 0' }}>
                {submissions.slice(0, 5).map(s => {
                  const date = s.submittedAt instanceof Date ? s.submittedAt : new Date(s.submittedAt)
                  const diff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
                  const timeStr = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff}d ago`
                  const statusColor = s.status === 'approved' ? '#10b981' : s.status === 'rejected' ? '#f87171' : '#f59e0b'
                  const statusLabel = s.status === 'approved' ? 'went live' : s.status === 'rejected' ? 'needs revision' : 'is under review'
                  return (
                    <div key={s.id} onClick={() => router.push(`/release/${s.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {s.coverImage ? <img src={s.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: statusColor }}>"{s.title}"</span> {statusLabel}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{s.artist}</div>
                      </div>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{timeStr}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Upcoming Releases */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Upcoming Releases</span>
              </div>
              {(() => {
                const upcoming = submissions.filter(s => {
                  if (!s.releaseDate) return false
                  const rd = new Date(s.releaseDate)
                  return rd > new Date() && (s.status === 'approved' || s.status === 'pending')
                }).sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime())
                if (!upcoming.length) return (
                  <div style={{ padding: '32px 18px', textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', margin: '0 auto 8px', opacity: 0.2 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>No upcoming releases</p>
                  </div>
                )
                return upcoming.slice(0, 4).map(s => {
                  const rd = new Date(s.releaseDate)
                  const daysLeft = Math.ceil((rd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={s.id} onClick={() => router.push(`/release/${s.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,#1a1a2e,#16213e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {s.coverImage ? <img src={s.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1 7.66 20 6 20C4.34 20 3 19.1 3 18C3 16.9 4.34 16 6 16C7.66 16 9 16.9 9 18ZM21 16C21 17.1 19.66 18 18 18C16.34 18 15 17.1 15 16C15 14.9 16.34 14 18 14C19.66 14 21 14.9 21 16Z"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>{rd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#a5b4fc', letterSpacing: '-0.5px' }}>{daysLeft}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>days</div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {/* Releases Grid / List */}
        {/* Mobile: desktop-only banner */}
        <div className="mobile-desktop-banner">
          <div className="mobile-desktop-banner-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div className="mobile-desktop-banner-text">
            <div className="mobile-desktop-banner-title">Submit releases on desktop</div>
            <div className="mobile-desktop-banner-desc">Open afterglowmusic.vercel.app on your laptop or PC to submit new releases.</div>
          </div>
        </div>

        {filteredSubmissions.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span className="section-heading" style={{ marginBottom: 0 }}>Your Catalog</span>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
              {filteredSubmissions.length} release{filteredSubmissions.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className={viewMode === 'grid' ? 'releases-grid' : 'releases-list'} style={viewMode === 'grid' ? { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' } : {}}>
          {loadingSubmissions ? (
            // Skeleton loading
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton-cover" />
                <div style={{ padding: '14px 16px' }}>
                  <div className="skeleton-line" style={{ width: '70%', marginBottom: '8px' }} />
                  <div className="skeleton-line skeleton-line-sm" style={{ width: '45%', marginBottom: '14px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton-line skeleton-line-sm" style={{ width: '28%' }} />
                    <div className="skeleton-line skeleton-line-sm" style={{ width: '20%' }} />
                    <div className="skeleton-line skeleton-line-sm" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>
            ))
          ) : filteredSubmissions.length === 0 ? (
            <div className="empty-state" style={{ padding: '80px 40px' }}>
              <div className="empty-state-visual">
                <div className="empty-state-visual-ring" />
                <div className="empty-state-visual-ring" />
                <div className="empty-state-visual-ring" />
                <div className="empty-state-visual-icon">
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="rgba(165,180,252,0.6)">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                  </svg>
                </div>
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '10px' }}>
                {searchQuery || statusFilter !== 'all' ? 'No releases found' : 'Your catalog is empty'}
              </h3>
              <p style={{ fontSize: '14px', maxWidth: '380px', margin: '0 auto 28px', lineHeight: '1.7', color: 'rgba(240,240,255,0.35)' }}>
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Submit your first release and reach millions of listeners on Spotify, Apple Music, YouTube Music, and 120+ more platforms.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '14px' }} onClick={() => router.push('/new-release')}>
                  Submit Your First Release →
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            paginatedSubmissions.map((submission) => (
              <div key={submission.id} className="release-card">
                <div className="release-card-cover" onClick={() => router.push(`/release/${submission.id}`)}>
                  {submission.coverImage ? (
                    <img src={submission.coverImage} alt={submission.title} />
                  ) : (
                    <div className="release-card-cover-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1046 7.65685 20 6 20C4.34315 20 3 19.1046 3 18C3 16.8954 4.34315 16 6 16C7.65685 16 9 16.8954 9 18ZM21 16C21 17.1046 19.6569 18 18 18C16.3431 18 15 17.1046 15 16C15 14.8954 16.3431 14 18 14C19.6569 14 21 14.8954 21 16Z"/></svg>
                    </div>
                  )}
                  <div
                    className="release-card-status"
                    style={{
                      background: submission.status === 'approved'
                        ? 'rgba(16,185,129,0.9)'
                        : submission.status === 'rejected'
                        ? 'rgba(239,68,68,0.85)'
                        : 'rgba(245,158,11,0.9)',
                      color: 'white',
                      backdropFilter: 'blur(12px)',
                      boxShadow: submission.status === 'approved'
                        ? '0 2px 12px rgba(16,185,129,0.4)'
                        : submission.status === 'rejected'
                        ? '0 2px 12px rgba(239,68,68,0.4)'
                        : '0 2px 12px rgba(245,158,11,0.4)',
                    }}
                  >
                    {submission.status === 'approved' ? '● Live'
                     : submission.status === 'rejected' ? '✕ Rejected'
                     : '◌ Pending'}
                  </div>
                  {/* Hover overlay with actions */}
                  <div className="release-card-overlay">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/new-release?edit=${submission.id}`); }}
                      style={{ flex: 1, padding: '8px', background: 'rgba(99,102,241,0.85)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
                    >Edit</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(submission); }}
                      style={{ flex: 1, padding: '8px', background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
                    >Delete</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/release/${submission.id}`); }}
                      style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
                    </button>
                  </div>
                </div>
                <div className="release-card-content">
                  <div className="release-card-title" onClick={() => router.push(`/release/${submission.id}`)}>{submission.title}</div>
                  <div className="release-card-artist">{submission.artist}{submission.featuringArtists ? ` ft. ${submission.featuringArtists}` : ''}</div>
                  <div className="release-card-meta">
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Format</div>
                      <div className="release-card-meta-value">{submission.format}</div>
                    </div>
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Tracks</div>
                      <div className="release-card-meta-value">{submission.tracks}</div>
                    </div>
                    <div className="release-card-meta-item">
                      <div className="release-card-meta-label">Genre</div>
                      <div className="release-card-meta-value" style={{ fontSize: '11px' }}>{submission.genre}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            paginatedSubmissions.map((submission) => (
              <div key={submission.id} className="release-list-item">
                <div className="release-list-cover" onClick={() => router.push(`/release/${submission.id}`)}>
                  {submission.coverImage ? <img src={submission.coverImage} alt={submission.title} /> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(165,180,252,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5L21 3V16M9 18C9 19.1046 7.65685 20 6 20C4.34315 20 3 19.1046 3 18C3 16.8954 4.34315 16 6 16C7.65685 16 9 16.8954 9 18ZM21 16C21 17.1046 19.6569 18 18 18C16.3431 18 15 17.1046 15 16C15 14.8954 16.3431 14 18 14C19.6569 14 21 14.8954 21 16Z"/></svg>}
                </div>
                <div className="release-list-info" onClick={() => router.push(`/release/${submission.id}`)}>
                  <div className="release-list-title">{submission.title}</div>
                  <div className="release-list-artist">{submission.artist}</div>
                </div>
                <div className="release-list-meta">
                  <div className="release-list-meta-item">
                    <div className="release-list-meta-label">Format</div>
                    <div className="release-list-meta-value">{submission.format}</div>
                  </div>
                  <div className="release-list-meta-item">
                    <div className="release-list-meta-label">Tracks</div>
                    <div className="release-list-meta-value">{submission.tracks}</div>
                  </div>
                  <div className="release-list-meta-item">
                    <div className="release-list-meta-label">Status</div>
                    <div style={{ marginTop: '2px' }}>
                      <span className={`status-badge ${submission.status === 'approved' ? 'status-active' : submission.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                        {submission.status === 'approved' ? 'Live' : submission.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => router.push(`/new-release?edit=${submission.id}`)} style={{ padding: '6px 12px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
                    <button onClick={() => handleDeleteClick(submission)} style={{ padding: '6px 12px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: currentPage === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: p === currentPage ? '1px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.08)', background: p === currentPage ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)', color: p === currentPage ? '#818cf8' : 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '13px', fontWeight: p === currentPage ? 700 : 400, fontFamily: 'inherit' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: currentPage === totalPages ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>
              Next →
            </button>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginLeft: '8px' }}>{filteredSubmissions.length} total</span>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          username={username}
          onClose={() => {
            setShowOnboarding(false)
            localStorage.setItem('hasSeenOnboarding', 'true')
          }}
        />
      )}

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
