# Update Firestore Rules - PENTING!

## Langkah-langkah Update Firestore Rules:

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project: **dashboard11-c92fb**
3. Klik **Firestore Database** di menu kiri
4. Klik tab **Rules** di bagian atas
5. Copy semua isi dari file `FIRESTORE_RULES.txt`
6. Paste ke editor rules di Firebase Console
7. Klik tombol **Publish** untuk menyimpan

## Perubahan yang Dilakukan:

### Sebelumnya:
- Hanya admin yang bisa update/delete submissions

### Sekarang:
- User bisa update submission mereka sendiri
- User bisa delete submission mereka sendiri
- Admin tetap bisa update/delete semua submissions

## Kenapa Perlu Update?

Error "Missing or insufficient permissions" terjadi karena:
- User mencoba update release mereka sendiri
- Firestore rules lama tidak mengizinkan user untuk update
- Rules baru mengizinkan user update/delete submission mereka sendiri dengan validasi `resource.data.userId == request.auth.uid`

## Validasi Keamanan:

Rules tetap aman karena:
- User hanya bisa update/delete submission dengan `userId` mereka sendiri
- Admin bisa update/delete semua submissions
- Semua validasi create tetap berlaku
- Authentication tetap required untuk semua operasi

## Setelah Update:

Fitur yang akan berfungsi:
- ✅ Edit release (user bisa edit release mereka sendiri)
- ✅ Delete release (user bisa delete release mereka sendiri)
- ✅ Email notification saat edit/delete
- ✅ Admin tetap bisa manage semua submissions
