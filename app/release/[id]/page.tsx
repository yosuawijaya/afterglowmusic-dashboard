'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const STORES = [
  // Major Streaming Platforms (12)
  { name: 'Spotify', logo: 'spotify.png', icon: '🎵', color: '#1DB954', url: 'https://open.spotify.com' },
  { name: 'Apple Music', logo: 'apple-music.png', icon: '🍎', color: '#FA243C', url: 'https://music.apple.com' },
  { name: 'YouTube Music', logo: 'youtube-music.png', icon: '▶️', color: '#FF0000', url: 'https://music.youtube.com' },
  { name: 'Amazon Music', logo: 'amazon-music.png', icon: '🛒', color: '#FF9900', url: 'https://music.amazon.com' },
  { name: 'Deezer', logo: 'deezer.png', icon: '🎧', color: '#FF0092', url: 'https://www.deezer.com' },
  { name: 'Tidal', logo: 'tidal.png', icon: '🌊', color: '#000000', url: 'https://tidal.com' },
  { name: 'Pandora', logo: 'pandora.png', icon: '📻', color: '#3668FF', url: 'https://www.pandora.com' },
  { name: 'SoundCloud', logo: 'soundcloud.png', icon: '☁️', color: '#FF5500', url: 'https://soundcloud.com' },
  { name: 'iHeartRadio', logo: 'iheartradio.png', icon: '❤️', color: '#C6002B', url: 'https://www.iheart.com' },
  { name: 'Shazam', logo: 'shazam.png', icon: '🔵', color: '#0088FF', url: 'https://www.shazam.com' },
  { name: 'Napster', logo: 'napster.png', icon: '🎼', color: '#000000', url: 'https://www.napster.com' },
  { name: 'Qobuz', logo: 'qobuz.png', icon: '🎹', color: '#000000', url: 'https://www.qobuz.com' },
  
  // Social Media Platforms (5)
  { name: 'Instagram', logo: 'instagram.png', icon: '📷', color: '#E4405F', url: 'https://www.instagram.com' },
  { name: 'TikTok', logo: 'tiktok.png', icon: '🎵', color: '#000000', url: 'https://www.tiktok.com' },
  { name: 'Facebook', logo: 'facebook.png', icon: '👥', color: '#1877F2', url: 'https://www.facebook.com' },
  { name: 'Snapchat', logo: 'snapchat.png', icon: '👻', color: '#FFFC00', url: 'https://www.snapchat.com' },
  { name: 'Triller', logo: 'triller.png', icon: '🎬', color: '#FF0050', url: 'https://triller.co' },
  
  // Asian Platforms (20)
  { name: 'Anghami', logo: 'anghami.png', icon: '🎵', color: '#A20074', url: 'https://www.anghami.com' },
  { name: 'Boomplay', logo: 'boomplay.png', icon: '🎵', color: '#FF6B00', url: 'https://www.boomplay.com' },
  { name: 'JOOX', logo: 'joox.png', icon: '🎵', color: '#00D9FF', url: 'https://www.joox.com' },
  { name: 'KKBOX', logo: 'kkbox.png', icon: '🎵', color: '#0E88EB', url: 'https://www.kkbox.com' },
  { name: 'NetEase Cloud Music', logo: 'netease.png', icon: '🎵', color: '#E60012', url: 'https://music.163.com' },
  { name: 'QQ Music', logo: 'qq-music.png', icon: '🎵', color: '#31C27C', url: 'https://y.qq.com' },
  { name: 'JioSaavn', logo: 'saavn.png', icon: '🎵', color: '#2BC5B4', url: 'https://www.jiosaavn.com' },
  { name: 'Gaana', logo: 'gaana.png', icon: '🎵', color: '#E8352D', url: 'https://gaana.com' },
  { name: 'Wynk Music', logo: 'wynk.png', icon: '🎵', color: '#FF0055', url: 'https://wynk.in' },
  { name: 'Hungama', logo: 'hungama.png', icon: '🎵', color: '#D91E36', url: 'https://www.hungama.com' },
  { name: 'Resso', logo: 'resso.png', icon: '🎵', color: '#FF2E4C', url: 'https://www.resso.com' },
  { name: 'Langit Musik', logo: 'langit-musik.png', icon: '🎵', color: '#FF6B00', url: 'https://www.langitmusik.co.id' },
  { name: 'Melon', logo: 'melon.png', icon: '🎵', color: '#00CD3C', url: 'https://www.melon.com' },
  { name: 'Bugs', logo: 'bugs.png', icon: '🎵', color: '#FF0000', url: 'https://music.bugs.co.kr' },
  { name: 'Genie', logo: 'genie.png', icon: '🎵', color: '#00A0E9', url: 'https://www.genie.co.kr' },
  { name: 'FLO', logo: 'flo.png', icon: '🎵', color: '#FF3D00', url: 'https://www.music-flo.com' },
  { name: 'Vibe', logo: 'vibe.png', icon: '🎵', color: '#FF0558', url: 'https://vibe.naver.com' },
  { name: 'AWA', logo: 'awa.png', icon: '🎵', color: '#FF2D55', url: 'https://awa.fm' },
  { name: 'LINE MUSIC', logo: 'line-music.png', icon: '🎵', color: '#00B900', url: 'https://music.line.me' },
  { name: 'Yandex Music', logo: 'yandex-music.png', icon: '🎵', color: '#FFCC00', url: 'https://music.yandex.com' },
  
  // Regional & Specialized (20)
  { name: 'Audiomack', logo: 'audiomack.png', icon: '🎵', color: '#FFA200', url: 'https://audiomack.com' },
  { name: 'Bandcamp', logo: 'bandcamp.png', icon: '🎵', color: '#1DA0C3', url: 'https://bandcamp.com' },
  { name: 'Beatport', logo: 'beatport.png', icon: '🎵', color: '#94D500', url: 'https://www.beatport.com' },
  { name: 'Traxsource', logo: 'traxsource.png', icon: '🎵', color: '#FF6600', url: 'https://www.traxsource.com' },
  { name: '7digital', logo: '7digital.png', icon: '🎵', color: '#FF6600', url: 'https://www.7digital.com' },
  { name: 'Claro Música', logo: 'claro-musica.png', icon: '🎵', color: '#E60000', url: 'https://www.claromusica.com' },
  { name: 'MediaNet', logo: 'medianet.png', icon: '🎵', color: '#0066CC', url: 'https://www.mndigital.com' },
  { name: 'Nuuday', logo: 'nuuday.png', icon: '🎵', color: '#FF6B00', url: 'https://www.nuuday.dk' },
  { name: 'Gracenote', logo: 'gracenote.png', icon: '🎵', color: '#0066CC', url: 'https://www.gracenote.com' },
  { name: 'Soundtrack Your Brand', logo: 'soundtrack.png', icon: '🎵', color: '#000000', url: 'https://www.soundtrackyourbrand.com' },
  { name: 'TouchTunes', logo: 'touchtunes.png', icon: '🎵', color: '#FF6B00', url: 'https://www.touchtunes.com' },
  { name: 'Juke', logo: 'juke.png', icon: '🎵', color: '#FF0055', url: 'https://juke.com' },
  { name: 'Slacker Radio', logo: 'slacker.png', icon: '🎵', color: '#FF6600', url: 'https://www.livexlive.com' },
  { name: 'Spinlet', logo: 'spinlet.png', icon: '🎵', color: '#FF0000', url: 'https://spinlet.com' },
  { name: 'Simfy Africa', logo: 'simfy.png', icon: '🎵', color: '#00A0E9', url: 'https://www.simfyafrica.com' },
  { name: 'Mdundo', logo: 'mdundo.png', icon: '🎵', color: '#FF6B00', url: 'https://mdundo.com' },
  { name: 'Zvooq', logo: 'zvooq.png', icon: '🎵', color: '#FF0055', url: 'https://zvooq.ru' },
  { name: 'Adaptr', logo: 'adaptr.png', icon: '🎵', color: '#0066CC', url: 'https://adaptr.com' },
  { name: 'Akazoo', logo: 'akazoo.png', icon: '🎵', color: '#FF0000', url: 'https://akazoo.com' },
  { name: 'Anghami Plus', logo: 'anghami-plus.png', icon: '🎵', color: '#A20074', url: 'https://www.anghami.com' },
  
  // Fitness & Lifestyle (10)
  { name: 'Peloton', logo: 'peloton.png', icon: '🚴', color: '#000000', url: 'https://www.onepeloton.com' },
  { name: 'Fit Radio', logo: 'fitradio.png', icon: '💪', color: '#FF0055', url: 'https://fitradio.com' },
  { name: 'Rockbot', logo: 'rockbot.png', icon: '🎵', color: '#FF6B00', url: 'https://rockbot.com' },
  { name: 'Soundtrack Business', logo: 'soundtrack-business.png', icon: '🎵', color: '#000000', url: 'https://www.soundtrackyourbrand.com' },
  { name: 'Cloud Cover Music', logo: 'cloudcover.png', icon: '🎵', color: '#0066CC', url: 'https://www.cloudcovermusic.com' },
  { name: 'Mood Media', logo: 'mood.png', icon: '🎵', color: '#FF0055', url: 'https://us.moodmedia.com' },
  { name: 'PlayNetwork', logo: 'playnetwork.png', icon: '🎵', color: '#0066CC', url: 'https://www.playnetwork.com' },
  { name: 'Qsic', logo: 'qsic.png', icon: '🎵', color: '#FF6B00', url: 'https://qsic.com' },
  { name: 'Soundtrack Player', logo: 'soundtrack-player.png', icon: '🎵', color: '#000000', url: 'https://www.soundtrackyourbrand.com' },
  { name: 'Ambie', logo: 'ambie.png', icon: '🎵', color: '#00A0E9', url: 'https://ambie.fm' },
  
  // Gaming & Virtual (10)
  { name: 'Twitch', logo: 'twitch.png', icon: '🎮', color: '#9146FF', url: 'https://www.twitch.tv' },
  { name: 'Discord', logo: 'discord.png', icon: '💬', color: '#5865F2', url: 'https://discord.com' },
  { name: 'Roblox', logo: 'roblox.png', icon: '🎮', color: '#000000', url: 'https://www.roblox.com' },
  { name: 'Fortnite', logo: 'fortnite.png', icon: '🎮', color: '#000000', url: 'https://www.epicgames.com/fortnite' },
  { name: 'Beat Saber', logo: 'beatsaber.png', icon: '🎮', color: '#FF0055', url: 'https://beatsaber.com' },
  { name: 'Oculus', logo: 'oculus.png', icon: '🥽', color: '#1C1E20', url: 'https://www.oculus.com' },
  { name: 'Meta Horizon', logo: 'meta-horizon.png', icon: '🌐', color: '#0081FB', url: 'https://www.meta.com' },
  { name: 'Rec Room', logo: 'recroom.png', icon: '🎮', color: '#FF6B00', url: 'https://recroom.com' },
  { name: 'VRChat', logo: 'vrchat.png', icon: '🥽', color: '#000000', url: 'https://hello.vrchat.com' },
  { name: 'Spatial', logo: 'spatial.png', icon: '🌐', color: '#000000', url: 'https://spatial.io' },
  
  // Telecom & Carrier (10)
  { name: 'Verizon', logo: 'verizon.png', icon: '📱', color: '#CD040B', url: 'https://www.verizon.com' },
  { name: 'AT&T', logo: 'att.png', icon: '📱', color: '#00A8E0', url: 'https://www.att.com' },
  { name: 'T-Mobile', logo: 'tmobile.png', icon: '📱', color: '#E20074', url: 'https://www.t-mobile.com' },
  { name: 'Vodafone', logo: 'vodafone.png', icon: '📱', color: '#E60000', url: 'https://www.vodafone.com' },
  { name: 'Orange', logo: 'orange.png', icon: '📱', color: '#FF7900', url: 'https://www.orange.com' },
  { name: 'Telekom', logo: 'telekom.png', icon: '📱', color: '#E20074', url: 'https://www.telekom.com' },
  { name: 'Telefonica', logo: 'telefonica.png', icon: '📱', color: '#019DF4', url: 'https://www.telefonica.com' },
  { name: 'SK Telecom', logo: 'sktelecom.png', icon: '📱', color: '#EA002C', url: 'https://www.sktelecom.com' },
  { name: 'KT', logo: 'kt.png', icon: '📱', color: '#E60012', url: 'https://www.kt.com' },
  { name: 'LG U+', logo: 'lguplus.png', icon: '📱', color: '#E4007F', url: 'https://www.lguplus.com' },
  
  // Radio & Podcast (10)
  { name: 'Radio.com', logo: 'radio-com.png', icon: '📻', color: '#0066CC', url: 'https://www.audacy.com' },
  { name: 'TuneIn', logo: 'tunein.png', icon: '📻', color: '#14D8CC', url: 'https://tunein.com' },
  { name: 'Stitcher', logo: 'stitcher.png', icon: '🎙️', color: '#000000', url: 'https://www.stitcher.com' },
  { name: 'Podcast Addict', logo: 'podcastaddict.png', icon: '🎙️', color: '#FF6600', url: 'https://podcastaddict.com' },
  { name: 'Castbox', logo: 'castbox.png', icon: '🎙️', color: '#F55B23', url: 'https://castbox.fm' },
  { name: 'Overcast', logo: 'overcast.png', icon: '🎙️', color: '#FC7E0F', url: 'https://overcast.fm' },
  { name: 'Pocket Casts', logo: 'pocketcasts.png', icon: '🎙️', color: '#F43E37', url: 'https://pocketcasts.com' },
  { name: 'Player FM', logo: 'playerfm.png', icon: '🎙️', color: '#C8161D', url: 'https://player.fm' },
  { name: 'Podbean', logo: 'podbean.png', icon: '🎙️', color: '#F55B23', url: 'https://www.podbean.com' },
  { name: 'RadioPublic', logo: 'radiopublic.png', icon: '🎙️', color: '#CE0E2D', url: 'https://radiopublic.com' },
  
  // Additional Platforms (23)
  { name: 'Bmat', logo: 'bmat.png', icon: '🎵', color: '#000000', url: 'https://www.bmat.com' },
  { name: 'MusixMatch', logo: 'musixmatch.png', icon: '🎵', color: '#FF6B00', url: 'https://www.musixmatch.com' },
  { name: 'Pretzel', logo: 'pretzel.png', icon: '🎵', color: '#9B59B6', url: 'https://www.pretzel.rocks' },
  { name: 'Epidemic Sound', logo: 'epidemic.png', icon: '🎵', color: '#000000', url: 'https://www.epidemicsound.com' },
  { name: 'Artlist', logo: 'artlist.png', icon: '🎵', color: '#000000', url: 'https://artlist.io' },
  { name: 'Soundstripe', logo: 'soundstripe.png', icon: '🎵', color: '#FF6B00', url: 'https://www.soundstripe.com' },
  { name: 'Music Vine', logo: 'musicvine.png', icon: '🎵', color: '#00A0E9', url: 'https://www.musicvine.com' },
  { name: 'Jamendo', logo: 'jamendo.png', icon: '🎵', color: '#FF0055', url: 'https://www.jamendo.com' },
  { name: 'Free Music Archive', logo: 'fma.png', icon: '🎵', color: '#0066CC', url: 'https://freemusicarchive.org' },
  { name: 'ccMixter', logo: 'ccmixter.png', icon: '🎵', color: '#FF6B00', url: 'https://ccmixter.org' },
  { name: 'SoundClick', logo: 'soundclick.png', icon: '🎵', color: '#FF0000', url: 'https://www.soundclick.com' },
  { name: 'ReverbNation', logo: 'reverbnation.png', icon: '🎵', color: '#E1000F', url: 'https://www.reverbnation.com' },
  { name: 'Mixcloud', logo: 'mixcloud.png', icon: '🎵', color: '#314359', url: 'https://www.mixcloud.com' },
  { name: '8tracks', logo: '8tracks.png', icon: '🎵', color: '#2C3E50', url: 'https://8tracks.com' },
  { name: 'Hearthis.at', logo: 'hearthis.png', icon: '🎵', color: '#FF6B00', url: 'https://hearthis.at' },
  { name: 'Audioboom', logo: 'audioboom.png', icon: '🎙️', color: '#007BFF', url: 'https://audioboom.com' },
  { name: 'Spreaker', logo: 'spreaker.png', icon: '🎙️', color: '#F5821F', url: 'https://www.spreaker.com' },
  { name: 'Anchor', logo: 'anchor.png', icon: '🎙️', color: '#8E44AD', url: 'https://anchor.fm' },
  { name: 'Acast', logo: 'acast.png', icon: '🎙️', color: '#000000', url: 'https://www.acast.com' },
  { name: 'Podchaser', logo: 'podchaser.png', icon: '🎙️', color: '#FF6B00', url: 'https://www.podchaser.com' },
  { name: 'Goodpods', logo: 'goodpods.png', icon: '🎙️', color: '#FF0055', url: 'https://goodpods.com' },
  { name: 'Podimo', logo: 'podimo.png', icon: '🎙️', color: '#FF0055', url: 'https://podimo.com' },
  { name: 'Luminary', logo: 'luminary.png', icon: '🎙️', color: '#000000', url: 'https://luminarypodcasts.com' }
]

export default function ReleaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [release, setRelease] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRelease = async () => {
      try {
        const releaseId = params.id as string
        const docRef = doc(db, 'submissions', releaseId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setRelease({
            id: docSnap.id,
            ...docSnap.data()
          })
        } else {
          alert('Release not found')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Error loading release:', error)
        alert('Error loading release')
      } finally {
        setLoading(false)
      }
    }

    loadRelease()
  }, [params.id, router])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Under Review',
          color: '#FFA500',
          icon: '⏱',
          description: 'Your release is being reviewed by our team'
        }
      case 'approved':
        return {
          label: 'Approved & Processing',
          color: '#27ae60',
          icon: '✓',
          description: 'Release approved! Being distributed to all platforms'
        }
      case 'rejected':
        return {
          label: 'Rejected',
          color: '#e74c3c',
          icon: '✗',
          description: 'Release needs revision. Check your email for details'
        }
      case 'live':
        return {
          label: 'Live on Stores',
          color: '#3498db',
          icon: '🎉',
          description: 'Your music is now available worldwide!'
        }
      default:
        return {
          label: 'Unknown',
          color: '#95a5a6',
          icon: '?',
          description: 'Status unknown'
        }
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#f7fafc'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p style={{ color: '#718096' }}>Loading release...</p>
        </div>
      </div>
    )
  }

  if (!release) return null

  const statusInfo = getStatusInfo(release.status)

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header */}
      <div style={{ 
        background: '#fff', 
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 40px'
      }}>
        <button 
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3498db',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {/* Release Header */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            {/* Cover Art */}
            <div>
              {release.coverImage ? (
                <img 
                  src={release.coverImage} 
                  alt={release.title}
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                />
              ) : (
                <div style={{ 
                  width: '200px', 
                  height: '200px', 
                  background: '#e2e8f0',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px'
                }}>
                  🎵
                </div>
              )}
            </div>

            {/* Release Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '10px' }}>
                {release.title}
              </h1>
              <p style={{ fontSize: '18px', color: '#718096', marginBottom: '20px' }}>
                By {release.artist}
                {release.featuringArtists && ` feat. ${release.featuringArtists}`}
              </p>

              {/* Status Badge */}
              <div style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                background: `${statusInfo.color}15`,
                border: `2px solid ${statusInfo.color}`,
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '24px' }}>{statusInfo.icon}</span>
                <div>
                  <div style={{ 
                    fontWeight: 600, 
                    color: statusInfo.color,
                    fontSize: '16px'
                  }}>
                    {statusInfo.label}
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    {statusInfo.description}
                  </div>
                </div>
              </div>

              {/* Release Details */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '20px',
                marginTop: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Format
                  </div>
                  <div style={{ fontWeight: 600 }}>{release.format}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Genre
                  </div>
                  <div style={{ fontWeight: 600 }}>{release.genre}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Tracks
                  </div>
                  <div style={{ fontWeight: 600 }}>{release.tracks} Track{release.tracks > 1 ? 's' : ''}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Release Date
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    }) : 'TBD'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Territories
                  </div>
                  <div style={{ fontWeight: 600 }}>Worldwide (240)</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0', marginBottom: '5px' }}>
                    Submitted
                  </div>
                  <div style={{ fontWeight: 600 }}>
                    {release.submittedAt?.toDate ? 
                      new Date(release.submittedAt.toDate()).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stores & Platforms */}
        <div style={{ 
          background: '#fff', 
          borderRadius: '12px', 
          padding: '30px',
          marginBottom: '30px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
              Available on 120+ Stores & Platforms
            </h2>
            {release.claimYoutubeOAC && (
              <div style={{
                padding: '8px 16px',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#856404'
              }}>
                ✓ YouTube OAC Claimed
              </div>
            )}
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
            gap: '12px'
          }}>
            {STORES.map((store) => (
              <a
                key={store.name}
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '16px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#2d3748',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  background: '#fff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = store.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={`/logos/${store.logo}`}
                    alt={store.name}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain' 
                    }}
                    onError={(e) => {
                      // Fallback to emoji if logo not found
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.parentElement!.innerHTML = `<span style="font-size: 32px">${store.icon}</span>`
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', lineHeight: '1.3' }}>
                  {store.name}
                </div>
                {release.status === 'approved' || release.status === 'live' ? (
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#27ae60', 
                    marginTop: '6px',
                    fontWeight: 600
                  }}>
                    {release.status === 'live' ? '✓ Live' : '⏱ Processing'}
                  </div>
                ) : (
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#a0aec0', 
                    marginTop: '6px'
                  }}>
                    Pending
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Track List */}
        {release.trackDetails && release.trackDetails.length > 0 && (
          <div style={{ 
            background: '#fff', 
            borderRadius: '12px', 
            padding: '30px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
              Track List
            </h2>
            {release.trackDetails.map((track: any, index: number) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '15px',
                  borderBottom: index < release.trackDetails.length - 1 ? '1px solid #e2e8f0' : 'none'
                }}
              >
                <div style={{ 
                  minWidth: '30px',
                  height: '30px',
                  background: '#f7fafc',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  color: '#718096'
                }}>
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '3px' }}>
                    {track.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>
                    {track.artist || release.artist}
                  </div>
                </div>
                {track.audioUrl && (
                  <audio 
                    controls 
                    style={{ height: '35px' }}
                    src={track.audioUrl}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
