# Afterglow Music Dashboard

Dashboard untuk mengelola music releases dengan notifikasi email otomatis.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Resend (Email Service)

1. Daftar di [resend.com](https://resend.com)
2. Verifikasi domain kamu (atau pakai domain testing mereka)
3. Buat API Key di [resend.com/api-keys](https://resend.com/api-keys)
4. Copy API key tersebut

### 3. Setup Environment Variables

Edit file `.env.local` dan isi:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
RECIPIENT_EMAIL=email-tujuan@example.com
```

Ganti:
- `RESEND_API_KEY` dengan API key dari Resend
- `RECIPIENT_EMAIL` dengan email yang akan menerima notifikasi

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Cara Pakai

1. **Login** - gunakan salah satu test account:
   - Admin: `admin@afterglowmusic.com` / `admin123`
   - User: `user@afterglowmusic.com` / `user123`
2. **Dashboard** - lihat semua releases
3. **Create Release** - klik tombol "+ One release"
4. **Isi Form** - masukkan detail release (Title, Artist, Genre, dll)
5. **Save** - data akan tersimpan dan otomatis terkirim ke email

## Fitur

- ✅ Login sederhana
- ✅ Dashboard dengan tabel releases
- ✅ Form create release lengkap
- ✅ Email notification otomatis via Resend
- ✅ Design clean dan modern
- ✅ Responsive layout

## Tech Stack

- Next.js 14
- TypeScript
- Resend (Email API)
- React Hooks

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo-name.git
git push -u origin main
```

### 2. Deploy di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik "New Project"
4. Import repository kamu
5. Tambahkan Environment Variables:
   - `RESEND_API_KEY`: API key dari Resend
   - `RECIPIENT_EMAIL`: Email tujuan notifikasi
6. Klik "Deploy"

### 3. Verifikasi Domain di Resend (Production)

Untuk production, verifikasi domain kamu di Resend:
1. Buka [resend.com/domains](https://resend.com/domains)
2. Tambah domain kamu
3. Update DNS records sesuai instruksi
4. Update `from` email di `app/api/send-release/route.ts`

## Notes

- Authentication menggunakan localStorage (local testing only)
- Data releases disimpan di localStorage browser (belum ada database)
- Email menggunakan Resend API
- Untuk production, disarankan menggunakan Firebase Authentication (lihat `FIREBASE_SETUP.md`)
- Untuk production database, tambahkan PostgreSQL, MongoDB, atau Supabase
