import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, username, role } = body

    // Validate input
    if (!email || !password || !username || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      emailVerified: true,
    })

    // Create user document in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      username,
      role: role || 'user',
      createdAt: new Date(),
    })

    return NextResponse.json({ 
      success: true, 
      userId: userRecord.uid,
      message: 'User created successfully'
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    
    let errorMessage = 'Failed to create user'
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Email already exists'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address'
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
