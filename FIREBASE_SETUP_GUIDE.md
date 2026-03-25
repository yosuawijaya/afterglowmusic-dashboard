# 🔥 Firebase Setup Guide - Afterglow Music Dashboard

## Step 1: Create Firebase Project (5 menit)

1. Buka https://console.firebase.google.com/
2. Klik "Add project" atau "Create a project"
3. Nama project: `afterglow-music` (atau nama lain)
4. Disable Google Analytics (optional, bisa enable nanti)
5. Klik "Create project"

## Step 2: Enable Authentication

1. Di Firebase Console, klik "Authentication" di sidebar
2. Klik "Get started"
3. Pilih "Email/Password" → Enable → Save
4. (Optional) Enable "Google" sign-in juga

## Step 3: Create Firestore Database

1. Di Firebase Console, klik "Firestore Database"
2. Klik "Create database"
3. Pilih "Start in production mode"
4. Pilih location: `asia-southeast1` (Singapore) atau terdekat
5. Klik "Enable"

## Step 4: Setup Firestore Rules

Di Firestore → Rules, paste ini:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Submissions collection
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

Klik "Publish"

## Step 5: Get Firebase Config (Client)

1. Di Firebase Console, klik ⚙️ (Settings) → Project settings
2. Scroll ke "Your apps" → klik Web icon (</>) 
3. App nickname: `Afterglow Dashboard`
4. Klik "Register app"
5. Copy semua nilai dari `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "afterglow-music.firebaseapp.com",
  projectId: "afterglow-music",
  storageBucket: "afterglow-music.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Paste ke `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=afterglow-music.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=afterglow-music
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=afterglow-music.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

## Step 6: Get Firebase Admin SDK (Server)

1. Di Firebase Console → ⚙️ Settings → Project settings
2. Tab "Service accounts"
3. Klik "Generate new private key"
4. Klik "Generate key" → file JSON akan download
5. Buka file JSON, copy nilai:
   - `project_id`
   - `client_email`
   - `private_key`

6. Paste ke `.env.local`:

```env
FIREBASE_PROJECT_ID=afterglow-music
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@afterglow-music.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
```

⚠️ **PENTING:** Private key harus dalam quotes dan keep `\n` nya!

## Step 7: Create Admin User

1. Di Firebase Console → Authentication → Users
2. Klik "Add user"
3. Email: `admin@afterglowmusic.com`
4. Password: (buat password kuat)
5. Klik "Add user"
6. Copy UID user yang baru dibuat

7. Di Firestore Database → Start collection:
   - Collection ID: `users`
   - Document ID: (paste UID dari step 6)
   - Fields:
     - `email`: admin@afterglowmusic.com
     - `role`: admin
     - `username`: Admin
     - `createdAt`: (timestamp)

## Step 8: Test

1. Restart dev server: `npm run dev`
2. Buka http://localhost:3000
3. Login dengan admin@afterglowmusic.com
4. Kalau berhasil → Firebase setup complete! 🎉

## Troubleshooting

**Error: "Firebase: Error (auth/invalid-api-key)"**
- Check NEXT_PUBLIC_FIREBASE_API_KEY di .env.local
- Restart dev server

**Error: "Firebase Admin: Error verifying token"**
- Check FIREBASE_PRIVATE_KEY format (harus ada quotes dan \n)
- Pastikan tidak ada extra spaces

**Error: "Missing or insufficient permissions"**
- Check Firestore Rules sudah di-publish
- Check user role di Firestore = 'admin'

## Security Checklist

✅ Firestore Rules enabled
✅ Admin SDK private key di .env.local (not committed to git)
✅ .env.local ada di .gitignore
✅ Email/Password authentication enabled
✅ Admin user created dengan role 'admin'

## Next Steps

Setelah Firebase setup:
1. Remove hardcoded users dari `app/page.tsx`
2. Test login dengan Firebase Auth
3. Test submission flow
4. Deploy to Vercel dengan environment variables

---

Need help? Check Firebase docs: https://firebase.google.com/docs
