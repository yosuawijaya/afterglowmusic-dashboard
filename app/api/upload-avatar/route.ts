import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ success: false, error: 'Missing file or userId' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'File must be an image' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const blob = await put(`avatars/${userId}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error: any) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
