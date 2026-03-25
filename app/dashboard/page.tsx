'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('release')
  const [selectedSubgenre, setSelectedSubgenre] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tracks, setTracks] = useState([{ title: '', artist: '', driveLink: '' }])
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
    appleMusicUrl: ''
  })
  
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
  
  const addTrack = () => {
    setTracks([...tracks, { title: '', artist: '', driveLink: '' }])
  }
  
  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index))
  }
  
  const updateTrack = (index: number, field: string, value: string) => {
    const newTracks = [...tracks]
    newTracks[index] = { ...newTracks[index], [field]: value }
    setTracks(newTracks)
  }

  const [releases, setReleases] = useState<Release[]>([])

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    const storedUsername = localStorage.getItem('username')
    
    if (!isLoggedIn) {
      router.push('/')
    } else {
      setUsername(storedUsername || 'User')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('username')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VALIDATION - Check all required fields
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
    
    if (!coverImage.trim()) {
      alert('Cover art link is required')
      setActiveTab('upload')
      return
    }
    
    // Validate cover art is a valid URL
    try {
      new URL(coverImage)
    } catch {
      alert('Cover art must be a valid URL')
      setActiveTab('upload')
      return
    }
    
    // Validate tracks
    if (tracks.length === 0) {
      alert('At least one track is required')
      setActiveTab('tracks')
      return
    }
    
    for (let i = 0; i < tracks.length; i++) {
      if (!tracks[i].title.trim()) {
        alert(`Track ${i + 1}: Title is required`)
        setActiveTab('tracks')
        return
      }
      
      if (!tracks[i].driveLink.trim()) {
        alert(`Track ${i + 1}: Google Drive link is required`)
        setActiveTab('tracks')
        return
      }
      
      // Validate drive link is a valid URL
      try {
        new URL(tracks[i].driveLink)
      } catch {
        alert(`Track ${i + 1}: Google Drive link must be a valid URL`)
        setActiveTab('tracks')
        return
      }
    }
    
    if (!newRelease.releaseDate) {
      alert('Release date is required')
      setActiveTab('releasedate')
      return
    }
    
    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail') || ''
    
    if (!userEmail) {
      alert('User not logged in')
      router.push('/')
      return
    }
    
    // Send email notification
    try {
      const response = await fetch('/api/send-release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRelease,
          tracks,
          coverImage,
          userEmail
        }),
      })

      if (response.ok) {
        // Save submission to Firestore
        try {
          await addDoc(collection(db, 'submissions'), {
            title: newRelease.title,
            artist: newRelease.artist,
            featuringArtists: newRelease.featuringArtists || '',
            userEmail: userEmail,
            userId: localStorage.getItem('userId') || '',
            genre: newRelease.genre,
            format: newRelease.format,
            tracks: tracks.length,
            trackDetails: tracks,
            coverImage: coverImage,
            spotifyUrl: newRelease.spotifyUrl,
            appleMusicUrl: newRelease.appleMusicUrl,
            price: newRelease.price,
            territories: newRelease.territories,
            promotionText: newRelease.promotionText,
            status: 'pending',
            submittedAt: serverTimestamp(),
            releaseDate: newRelease.releaseDate
          })
        } catch (error) {
          console.error('Error saving to Firestore:', error)
        }

        const release: Release = {
          id: releases.length + 1,
          title: newRelease.title,
          artist: newRelease.artist,
          label: newRelease.label,
          releaseDate: newRelease.releaseDate,
          tracks: 1,
          upc: newRelease.upc,
          territories: 240,
          stores: 17,
          cover: '🎵'
        }
        setReleases([release, ...releases])
        setShowCreateForm(false)
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
          appleMusicUrl: ''
        })
        setSelectedSubgenre('')
        setTracks([{ title: '', artist: '', driveLink: '' }])
        setCoverImage('')
        alert('Release created and email sent successfully!')
      } else {
        alert('Release created but failed to send email notification')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating release')
    }
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <div className="logo">Afterglow Music</div>
        <button className="btn-new-release" onClick={() => setShowCreateForm(true)}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          One release
        </button>
        <div className="nav-item active">
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
          </svg>
          All Releases
        </div>
        <div className="nav-item" onClick={() => router.push('/drafts')}>
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          Drafts
        </div>
        <div className="nav-item" onClick={() => router.push('/analytics')}>
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
          </svg>
          Analytics
        </div>
        <div className="nav-item">
          <svg className="nav-icon" width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z" clipRule="evenodd"/>
          </svg>
          Promotion
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>All Releases</h1>
          <div className="user-info">
            <span>Client: {username}</span>
            <button className="btn-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="stats">
          <div className="stat-card">
            <h3>Total Releases</h3>
            <div className="value">{releases.length}</div>
          </div>
          <div className="stat-card">
            <h3>Total Tracks</h3>
            <div className="value">{releases.reduce((sum, r) => sum + r.tracks, 0)}</div>
          </div>
          <div className="stat-card">
            <h3>Territories</h3>
            <div className="value">240</div>
          </div>
          <div className="stat-card">
            <h3>Stores</h3>
            <div className="value">17</div>
          </div>
        </div>

        <div className="actions">
          <div className="search-wrapper">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
            </svg>
            <input
              type="text"
              className="search-box"
              placeholder="Search releases..."
            />
          </div>
          <button className="btn-primary">Export</button>
        </div>

        {showCreateForm && (
          <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>One release: Audio Release, EP or Single</h2>
                <button className="btn-close" onClick={() => setShowCreateForm(false)}>
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
                        <small style={{ fontSize: '12px', color: '#718096', marginTop: '5px', display: 'block' }}>
                          Separate multiple artists with commas
                        </small>
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
                        <small style={{ fontSize: '12px', color: '#718096', marginTop: '5px', display: 'block' }}>
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
                        <small style={{ fontSize: '12px', color: '#718096', marginTop: '5px', display: 'block' }}>
                          Enter your Apple Music artist URL or type "I don't have artist profile yet"
                        </small>
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
                    <h3>Cover Art</h3>
                    <div className="form-row">
                      <div className="form-col">
                        <label>Google Drive Cover Art Link *</label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/file/d/..."
                          value={coverImage}
                          onChange={(e) => setCoverImage(e.target.value)}
                          required
                        />
                        <small style={{ fontSize: '12px', color: '#718096', marginTop: '5px', display: 'block' }}>
                          Upload your cover art to Google Drive and paste the shareable link here (min 3000x3000px)
                        </small>
                      </div>
                    </div>
                    {coverImage && (
                      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', border: '1px solid #bfdbfe', borderRadius: '4px' }}>
                        <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
                          ✓ Cover art link added
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'tracks' && (
                  <div className="tracks-section">
                    <h3>Track List</h3>
                    {tracks.map((track, index) => (
                      <div key={index} className="track-item">
                        <div className="track-number">{index + 1}</div>
                        <div className="track-fields">
                          <input
                            type="text"
                            placeholder="Track title *"
                            value={track.title}
                            onChange={(e) => updateTrack(index, 'title', e.target.value)}
                            required
                          />
                          <input
                            type="text"
                            placeholder="Artist"
                            value={track.artist}
                            onChange={(e) => updateTrack(index, 'artist', e.target.value)}
                          />
                          <input
                            type="url"
                            placeholder="Google Drive Link *"
                            value={track.driveLink}
                            onChange={(e) => updateTrack(index, 'driveLink', e.target.value)}
                            required
                            style={{ gridColumn: '1 / -1' }}
                          />
                        </div>
                        {tracks.length > 1 && (
                          <button type="button" className="btn-remove" onClick={() => removeTrack(index)}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-add-track" onClick={addTrack}>
                      + Add Track
                    </button>
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
                    <p style={{ color: '#718096', fontSize: '14px', marginTop: '10px' }}>
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
                          <span style={{ marginLeft: '8px' }}>Worldwide (240 territories)</span>
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
                          <span style={{ marginLeft: '8px' }}>Selected territories only</span>
                        </label>
                      </div>
                    </div>
                    <p style={{ color: '#718096', fontSize: '14px', marginTop: '10px' }}>
                      Your release will be distributed to all major platforms including Spotify, Apple Music, Amazon Music, YouTube Music, and 17+ stores.
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
                    <p style={{ color: '#718096', fontSize: '14px', marginTop: '10px' }}>
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
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
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
                    <button type="button" className="btn-secondary" onClick={goToPreviousTab}>
                      ← Previous
                    </button>
                  )}
                  {activeTab !== 'submission' ? (
                    <button type="button" className="btn-primary" onClick={goToNextTab}>
                      Next →
                    </button>
                  ) : (
                    <button type="submit" className="btn-save">
                      Save & Submit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="releases-table">
          <div className="table-header">
            <div></div>
            <div>Status</div>
            <div>Title / Artist</div>
            <div>Label</div>
            <div>Release Date</div>
            <div>Tracks</div>
            <div>UPC</div>
            <div>Action</div>
          </div>
          {releases.map((release) => (
            <div key={release.id} className="table-row">
              <div className="album-cover">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="50" height="50" rx="4" fill="#E2E8F0"/>
                  <path d="M35 15v20l-10-5-10 5V15h20z" fill="#718096"/>
                  <circle cx="25" cy="25" r="3" fill="#CBD5E0"/>
                </svg>
              </div>
              <div>
                <span className="status-badge status-active">✓</span>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{release.title}</div>
                <div style={{ fontSize: '13px', color: '#718096' }}>
                  By {release.artist}
                </div>
              </div>
              <div>{release.label}</div>
              <div>{release.releaseDate}</div>
              <div>{release.tracks} Track</div>
              <div>
                <div style={{ fontSize: '13px' }}>UPC: {release.upc}</div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  {release.territories} terr. / {release.stores} stores
                </div>
              </div>
              <div>
                <button className="btn-promote">Promote</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
