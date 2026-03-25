# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. Enter project name: `afterglow-music`
4. Disable Google Analytics (optional)
5. Click **Create project**

## 2. Enable Authentication

1. In Firebase Console, click **Authentication**
2. Click **Get started**
3. Click **Sign-in method** tab
4. Enable **Email/Password**
5. Click **Save**

## 3. Create Firestore Database

1. Click **Firestore Database** in sidebar
2. Click **Create database**
3. Choose **Start in production mode**
4. Select location (closest to your users)
5. Click **Enable**

## 4. Setup Firestore Rules

Go to **Firestore Database** → **Rules** tab, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /releases/{releaseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**

## 5. Get Firebase Config

1. Click **Project settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web** icon (</>)
4. Register app name: `afterglow-music-dashboard`
5. Copy the `firebaseConfig` object
6. Paste values to `.env.local`

## 6. Create First Admin User

1. Go to **Authentication** → **Users** tab
2. Click **Add user**
3. Enter email & password
4. Click **Add user**
5. Copy the **User UID**

## 7. Set Admin Role

1. Go to **Firestore Database**
2. Click **Start collection**
3. Collection ID: `users`
4. Document ID: (paste User UID from step 6)
5. Add fields:
   - `email`: (user email)
   - `username`: (any username)
   - `role`: `admin`
   - `createdAt`: (timestamp)
6. Click **Save**

## 8. Install & Run

```bash
npm install
npm run dev
```

## Features

- ✅ 50,000 free monthly active users
- ✅ Email/Password authentication
- ✅ Firestore database
- ✅ Real-time updates
- ✅ File storage (if needed)
- ✅ Google Analytics integration

## Deploy to Vercel

Add environment variables:
```
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
RESEND_API_KEY=xxx
RECIPIENT_EMAIL=xxx
```
