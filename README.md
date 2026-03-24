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

1. **Login** - masukkan username dan password apa saja
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

## Notes

- Data releases disimpan di localStorage browser (belum ada database)
- Email menggunakan Resend API
- Untuk production, tambahkan database (PostgreSQL, MongoDB, dll)
