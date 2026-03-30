import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const releaseId = request.nextUrl.searchParams.get('releaseId') || ''
  
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/spotify/callback`,
    scope: 'user-library-modify user-read-email',
    state: releaseId,
  })

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`
  )
}
