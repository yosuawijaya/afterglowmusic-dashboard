# Firebase Storage Setup

## Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/project/dashboard11-c92fb/storage)
2. Click **Get Started**
3. Choose **Start in production mode** (we'll set rules later)
4. Select your location (closest to your users)
5. Click **Done**

## Set Storage Rules

Go to **Storage** → **Rules** tab and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their own folders
    match /covers/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /tracks/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Storage Structure

```
storage/
├── covers/
│   └── {userId}/
│       └── {timestamp}_{filename}.jpg
└── tracks/
    └── {userId}/
        └── {timestamp}_{filename}.mp3
```

## Features

- ✅ Drag & drop cover art (Release Information tab)
- ✅ Drag & drop multiple audio files (Upload tab)
- ✅ Auto-detect tracks from uploaded files
- ✅ Edit track details (Tracks tab)
- ✅ Real-time upload progress
- ✅ File validation (image/audio types)
- ✅ Submissions displayed with cover art preview
- ✅ Real-time sync with Firestore

## File Limits

- Cover Art: Max 10MB (JPG, PNG)
- Audio Files: Max 200MB per file (MP3, WAV, FLAC)
- Storage Quota: 5GB free (Spark plan)

## Upgrade Storage (if needed)

If you need more storage:
- Blaze Plan: $0.026/GB/month
- Or use Vercel Blob: 10GB free, $0.15/GB after
