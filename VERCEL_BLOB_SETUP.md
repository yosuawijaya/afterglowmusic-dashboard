# Vercel Blob Storage Setup

## Get Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `afterglowmusic-dashboard`
3. Go to **Storage** tab
4. Click **Create Database** → **Blob**
5. Name it: `afterglow-uploads`
6. Click **Create**
7. Copy the `BLOB_READ_WRITE_TOKEN`

## Add Token to Environment Variables

### Local Development (.env.local)
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

### Vercel Production
1. Go to **Settings** → **Environment Variables**
2. Add new variable:
   - Key: `BLOB_READ_WRITE_TOKEN`
   - Value: `vercel_blob_rw_xxxxxxxxxxxxx`
   - Environment: Production, Preview, Development
3. Click **Save**
4. Redeploy your app

## Features

✅ **10GB Free Storage**
✅ **Drag & Drop Upload** (cover art + audio files)
✅ **Auto CDN** (fast global delivery)
✅ **Direct URLs** (no permission issues)
✅ **Real-time Sync** to Firestore & Admin Dashboard

## File Structure

```
Vercel Blob/
├── {random-id}_cover.jpg
├── {random-id}_track1.mp3
├── {random-id}_track2.mp3
└── ...
```

## Upload Flow

1. User uploads files → `/api/upload`
2. Files stored in Vercel Blob
3. Returns public URL
4. URL saved to Firestore
5. Admin sees cover preview + audio links

## Pricing

- Free: 10GB storage
- After 10GB: $0.15/GB/month
- Bandwidth: Included in Vercel plan

## Test Upload

```bash
npm run dev
```

1. Login to dashboard
2. Click "One release"
3. Upload cover art (Release Information tab)
4. Upload audio files (Upload tab)
5. Check if files appear in Vercel Blob dashboard
6. Submit and check admin panel

## Troubleshooting

**Error: "BLOB_READ_WRITE_TOKEN is not defined"**
- Make sure token is in `.env.local`
- Restart dev server: `npm run dev`

**Error: "Upload failed"**
- Check Vercel Blob is created
- Verify token is correct
- Check file size (max 500MB per file)

**Files not appearing in admin**
- Check Firestore submissions collection
- Verify coverImage and trackDetails.audioUrl fields
- Check browser console for errors
