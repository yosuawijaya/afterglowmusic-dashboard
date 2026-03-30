import { NextRequest, NextResponse } from 'next/server'
import { collection, addDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const releaseId = request.nextUrl.searchParams.get('state') || ''
  const error = request.nextUrl.searchParams.get('error')
  const base = process.env.NEXT_PUBLIC_BASE_URL!

  if (error || !code) {
    return NextResponse.redirect(`${base}/presave/${releaseId}?error=cancelled`)
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${base}/api/spotify/callback`,
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokens.access_token) throw new Error('No access token')

    // Get Spotify user profile
    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json()

    // Check duplicate
    const existing = await getDocs(query(
      collection(db, 'presaves'),
      where('releaseId', '==', releaseId),
      where('spotifyUserId', '==', profile.id)
    ))

    if (existing.empty) {
      await addDoc(collection(db, 'presaves'), {
        releaseId,
        spotifyUserId: profile.id,
        spotifyEmail: profile.email || '',
        displayName: profile.display_name || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
        savedAt: serverTimestamp(),
        spotifyConnected: true,
      })
    }

    return NextResponse.redirect(`${base}/presave/${releaseId}?success=true`)
  } catch (err) {
    console.error('Spotify callback error:', err)
    return NextResponse.redirect(`${base}/presave/${releaseId}?error=failed`)
  }
}
