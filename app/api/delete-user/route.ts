import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ success: false, error: 'No userId provided' }, { status: 400 })

    // Delete from Firebase Auth
    await adminAuth.deleteUser(userId)

    // Delete from Firestore users collection
    await adminDb.collection('users').doc(userId).delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
