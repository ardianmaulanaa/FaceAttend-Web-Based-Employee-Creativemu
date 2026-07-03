# Creativemu FaceAttend

**Creativemu FaceAttend** adalah aplikasi absensi karyawan berbasis web untuk Creativemu. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, monitoring absensi, pengumuman internal, serta pelaporan kehadiran karyawan.

Pada versi terbaru, sistem absensi **tidak lagi menggunakan face recognition berbasis AI**. Mekanisme absensi dilakukan dengan cara karyawan mengambil foto melalui kamera browser sebagai bukti kehadiran, lalu sistem menyimpan lokasi GPS saat check-in dan check-out.

---

## Status Project

**Status:** Development

Project ini masih berada pada tahap pengembangan aktif. Beberapa bagian utama seperti autentikasi, role access, absensi berbasis foto dan GPS, manajemen karyawan, master data, pengumuman, riwayat presensi, dan dashboard admin sudah mulai dikembangkan dan terus disempurnakan.

---

## Tujuan Aplikasi

Creativemu FaceAttend dikembangkan untuk:

- Membantu perusahaan mencatat kehadiran karyawan secara digital.
- Mengurangi pencatatan absensi manual.
- Menyimpan bukti foto saat karyawan melakukan check-in dan check-out.
- Menyimpan data lokasi GPS saat absensi dilakukan.
- Membantu admin memantau status kehadiran karyawan.
- Memudahkan karyawan melihat riwayat presensi.
- Menyediakan pengumuman internal dari admin ke karyawan.
- Menyediakan dasar pengembangan sistem monitoring dan laporan kehadiran.

---

## Konsep Utama Sistem

Sistem absensi pada Creativemu FaceAttend menggunakan kombinasi:

1. **Foto dari kamera browser**
2. **Lokasi GPS dari browser**
3. **Data waktu check-in dan check-out**
4. **Validasi radius kantor**
5. **Riwayat kehadiran per bulan dan tahun**
6. **Role-based access antara admin dan karyawan**

Dengan konsep ini, setiap absensi memiliki bukti visual dan lokasi yang dapat digunakan sebagai dasar validasi kehadiran.

---

## Fitur Utama

### 1. Authentication

Aplikasi menggunakan sistem autentikasi custom berbasis cookie dan JWT.

Fitur autentikasi:

- Login karyawan dan admin.
- Password disimpan dalam bentuk hash.
- Session menggunakan cookie.
- Role-based access.
- Proteksi halaman berdasarkan role.
- Logout melalui sidebar menu.

Role yang digunakan:

- Admin
- Employee
- Role tambahan dapat dikembangkan sesuai kebutuhan sistem.

---

### 2. Dashboard Karyawan

Dashboard karyawan digunakan sebagai halaman utama setelah login.

Fitur dashboard karyawan:

- Menampilkan sapaan pengguna.
- Menampilkan informasi shift, jabatan, unit, dan divisi.
- Menampilkan waktu saat ini.
- Menampilkan status absensi hari ini.
- Tombol masuk ke halaman presensi.
- Akses cepat ke:
  - Laporan presensi
  - Face Attendance / Presensi
  - Profil
  - Izin / Cuti
- Notifikasi pengumuman baru.
- Badge notifikasi hanya muncul ketika ada pengumuman baru yang belum dibaca.

---

### 3. Attendance / Presensi

Halaman Attendance digunakan oleh karyawan untuk melakukan check-in dan check-out.

Fitur presensi:

- Kamera browser untuk mengambil foto.
- GPS browser untuk mengambil lokasi.
- Check-in berbasis foto dan lokasi.
- Check-out berbasis foto dan lokasi.
- Data latitude dan longitude disimpan.
- Data akurasi GPS disimpan.
- Sistem dapat memvalidasi jarak karyawan dari kantor.
- Status kamera ditampilkan pada UI.
- Foto terakhir dapat ditampilkan sebagai preview.
- Data absensi dikirim ke API internal aplikasi.

Alur check-in:

```txt
Karyawan membuka halaman Attendance
→ Kamera aktif
→ Karyawan melakukan check-in
→ Sistem mengambil foto dari kamera
→ Sistem mengambil lokasi GPS
→ Sistem mengirim data ke API
→ Data check-in disimpan ke database
```

Alur check-out:

```txt
Karyawan membuka halaman Attendance
→ Kamera aktif
→ Karyawan melakukan check-out
→ Sistem mengambil foto dari kamera
→ Sistem mengambil lokasi GPS
→ Sistem mengirim data ke API
→ Data check-out disimpan ke database
```

---

### 4. Riwayat Presensi

Karyawan dapat melihat riwayat presensi berdasarkan bulan, tahun, dan urutan data.

Fitur riwayat presensi:

- Filter berdasarkan bulan.
- Filter berdasarkan tahun.
- Urutan terbaru atau terlama.
- Menampilkan status kehadiran.
- Menampilkan jam check-in dan check-out.
- Menampilkan durasi kerja.
- Menampilkan keterlambatan.
- Menampilkan pulang cepat.
- Detail presensi dapat dibuka per data.

---

### 5. Detail Presensi

Halaman detail presensi menampilkan bukti absensi secara lebih lengkap.

Informasi yang ditampilkan:

- Tanggal absensi.
- Status kehadiran.
- Jam check-in.
- Jam check-out.
- Durasi kerja.
- Jumlah menit terlambat.
- Jumlah menit pulang cepat.
- Foto check-in.
- Foto check-out.
- Lokasi check-in.
- Lokasi check-out.
- Akurasi GPS.
- Jarak dari kantor.
- Status berada di dalam atau di luar radius kantor.
- Link untuk membuka lokasi di Google Maps.

---

### 6. Profil Karyawan

Halaman profil digunakan untuk melihat informasi akun karyawan.

Informasi profil:

- Foto profil.
- Nama karyawan.
- Email.
- Nomor telepon.
- Kode karyawan.
- Status akun.
- Role akun.
- Unit kerja.
- Divisi.
- Jabatan.
- Shift.
- Toleransi keterlambatan.
- Jam kerja.
- Kantor terdaftar.

Fitur profil:

- Upload foto profil.
- Ubah password.
- Menampilkan ringkasan data karyawan.
- Menampilkan informasi akun secara detail.

---

### 7. Admin Dashboard

Admin memiliki dashboard untuk mengelola data dan memantau sistem.

Fitur admin yang dikembangkan:

- Dashboard admin.
- Monitoring perusahaan.
- Manajemen data karyawan.
- Register employee.
- Pengumuman internal.
- Laporan cuti.
- Master data.
- Monitoring awal absensi.

---

### 8. Master Data

Master data digunakan admin untuk mengelola data dasar perusahaan.

Master data yang tersedia atau sedang dikembangkan:

- Unit
- Divisi
- Jabatan
- Shift
- Jam Kerja
- Kantor / Office
- Data karyawan

Relasi utama:

```txt
Unit
→ Divisi
→ Jabatan
→ Karyawan
→ Shift
→ Jam Kerja
→ Kantor Terdaftar
```

---

### 9. Register Employee

Admin dapat mendaftarkan karyawan baru melalui halaman Register Employee.

Data yang dapat diatur:

- Nama karyawan.
- Email.
- Password awal.
- Nomor telepon.
- Unit.
- Divisi.
- Jabatan.
- Shift.
- Kantor terdaftar.
- Status akun.

Password disimpan dalam bentuk hash, bukan plain text.

---

### 10. Pengumuman Internal

Admin dapat membuat pengumuman yang akan ditampilkan kepada karyawan.

Fitur pengumuman:

- Admin membuat pengumuman.
- Admin mengatur status pengumuman.
- Karyawan dapat melihat pengumuman yang sudah dipublikasikan.
- Dashboard karyawan menampilkan indikator jika ada pengumuman baru.
- Indikator notifikasi akan hilang setelah pengumuman dibaca.

Status pengumuman:

- Published
- Draft
- Archived

---

### 11. Cuti / Izin

Fitur cuti atau izin digunakan untuk pengajuan ketidakhadiran karyawan.

Fitur yang dikembangkan:

- Karyawan dapat mengajukan cuti.
- Karyawan dapat mengajukan izin.
- Karyawan dapat mengajukan sakit.
- Karyawan dapat melihat riwayat pengajuan.
- Admin dapat melihat laporan cuti.
- Admin dapat menyetujui atau menolak pengajuan.

Status pengajuan:

- Pending
- Approved
- Rejected

---

## Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- Lucide React

### Backend

- Next.js API Route
- Server-side route handler
- Custom authentication
- JWT verification
- Cookie-based session

### Database & ORM

- MySQL
- Prisma ORM
- Prisma Client
- Prisma Schema
- Prisma Studio
- Sequel Ace untuk database lokal

### Authentication & Security

- bcryptjs untuk hash password
- jose untuk JWT
- Cookie-based authentication
- Role-based access control
- Server-side validation
- Protected API route

### Browser API

- Camera API
- Geolocation API
- FormData upload
- LocalStorage untuk status pengumuman terbaca

---

## Struktur Project

Struktur umum project:

```txt
src
├── app
│   ├── api
│   │   ├── auth
│   │   ├── attendance
│   │   ├── employees
│   │   ├── profile
│   │   ├── announcements
│   │   └── admin
│   ├── home
│   ├── attendance
│   ├── history
│   ├── profile
│   ├── pengumuman
│   ├── cuti
│   └── admin
│       ├── dashboard
│       ├── employees
│       ├── monitor_perusahaan
│       ├── pengumuman
│       ├── shifts
│       ├── work-schedules
│       ├── units
│       ├── departments
│       ├── positions
│       └── cuti
├── components
│   ├── AppHeader.tsx
│   ├── BottomNav.tsx
│   ├── MobileShell.tsx
│   └── StatCard.tsx
├── lib
│   ├── prisma.ts
│   └── auth.ts
└── generated
    └── prisma
```

---

## Struktur Role

### Admin

Admin dapat mengakses:

- Dashboard admin
- Monitoring perusahaan
- Register employee
- Master data
- Pengumuman
- Laporan cuti
- Laporan kehadiran
- Manajemen data karyawan

### Employee

Karyawan dapat mengakses:

- Home
- Attendance
- History
- Detail History
- Profile
- Pengumuman
- Cuti / Izin

---

## Konsep Database

Beberapa entity utama pada sistem:

### User

Menyimpan data akun dan karyawan.

Relasi utama:

- Unit
- Department
- Position
- Shift
- Registered Office
- Attendance
- Leave Request

### Attendance

Menyimpan data absensi harian.

Data yang disimpan:

- Tanggal absensi
- Check-in time
- Check-out time
- Foto check-in
- Foto check-out
- Latitude check-in
- Longitude check-in
- Latitude check-out
- Longitude check-out
- Akurasi GPS
- Jarak dari kantor
- Status presensi
- Late minutes
- Early leave minutes
- Work minutes

### Shift

Menyimpan data shift karyawan.

Data shift:

- Nama shift
- Toleransi keterlambatan
- Status shift

### Work Schedule

Menyimpan jadwal kerja berdasarkan shift.

Data jam kerja:

- Hari kerja
- Status hari kerja
- Jam masuk
- Jam keluar

### Unit

Menyimpan unit kerja perusahaan.

### Department

Menyimpan divisi yang dapat terhubung ke unit.

### Position

Menyimpan jabatan yang dapat terhubung ke divisi.

### Announcement

Menyimpan pengumuman dari admin.

### Leave Request

Menyimpan pengajuan cuti, izin, sakit, atau lainnya.

---

## API Overview

Beberapa API utama:

### Authentication

```txt
POST /api/auth/login
GET  /api/auth/me
```

### Attendance

```txt
POST /api/attendance/check-in
POST /api/attendance/check-out
GET  /api/attendance/today
GET  /api/attendance/history
GET  /api/attendance/[id]
GET  /api/attendance/[id]/photo
```

### Profile

```txt
POST  /api/profile/photo
PATCH /api/profile/change-password
```

### Employee

```txt
GET    /api/employees
POST   /api/employees
PATCH  /api/employees
DELETE /api/employees
```

### Announcement

```txt
GET    /api/announcements
POST   /api/announcements
PATCH  /api/announcements
DELETE /api/announcements
```

### Admin

```txt
GET /api/admin/...
POST /api/admin/...
PATCH /api/admin/...
DELETE /api/admin/...
```

---

## Halaman Utama

### Karyawan

```txt
/home
/attendance
/history
/history/[id]
/profile
/pengumuman
/cuti
```

### Admin

```txt
/admin/dashboard
/admin/monitor_perusahaan
/admin/employees
/admin/pengumuman
/admin/shifts
/admin/work-schedules
/admin/units
/admin/departments
/admin/positions
/admin/cuti
```

---

## Cara Menjalankan Project

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Sinkronisasi database saat development:

```bash
npx prisma db push
```

Menjalankan development server:

```bash
npm run dev
```

Akses aplikasi:

```txt
http://localhost:3000
```

Membuka Prisma Studio:

```bash
npx prisma studio
```

---

## Catatan Environment

Repository ini **tidak menyertakan file environment asli**.

File seperti berikut tidak boleh dipush ke GitHub:

```txt
.env
.env.local
.env.production
.env.development
```

Konfigurasi database, JWT secret, dan konfigurasi sensitif lainnya harus dibuat secara lokal oleh developer masing-masing.

Pastikan file `.gitignore` memiliki aturan untuk menyembunyikan file sensitif.

Contoh file yang sebaiknya tidak dipush:

```txt
node_modules
.next
.env
.env.local
.env.production
.env.development
```

---

## Keamanan

Beberapa prinsip keamanan yang digunakan:

- Password tidak disimpan dalam plain text.
- Password disimpan menggunakan hashing.
- Session menggunakan cookie.
- API tertentu harus melalui validasi token.
- Route admin hanya dapat diakses role tertentu.
- Data absensi dikirim menggunakan FormData.
- Data lokasi diambil langsung dari browser.
- File environment tidak disertakan di repository.

---

## Batasan Saat Ini

Karena project masih tahap development, beberapa batasan yang masih ada:

- Database masih menggunakan MySQL lokal saat development.
- Sistem belum sepenuhnya production-ready.
- Face recognition AI sudah tidak digunakan.
- Absensi menggunakan foto sebagai bukti, bukan identifikasi wajah otomatis.
- Validasi GPS bergantung pada akurasi perangkat dan izin lokasi browser.
- Beberapa fitur admin dan monitoring masih dalam tahap pengembangan.
- Belum ada deployment production final.
- Belum ada integrasi cloud database final.
- Belum ada sistem audit log lengkap.
- Belum ada sistem notifikasi realtime.

---

## Roadmap Pengembangan

Rencana pengembangan berikutnya:

- Penyempurnaan dashboard admin.
- Penyempurnaan monitoring absensi.
- Penyempurnaan laporan kehadiran.
- Export laporan ke Excel atau PDF.
- Pengembangan laporan bulanan.
- Validasi lokasi kantor yang lebih detail.
- Pengelolaan office radius dari admin.
- Penyempurnaan fitur cuti dan izin.
- Role access yang lebih detail.
- Audit log aktivitas admin.
- Deployment ke hosting production.
- Migrasi database ke cloud database.
- Optimasi tampilan mobile.
- Optimasi performa API.
- Peningkatan keamanan session.
- Dokumentasi API lebih lengkap.

---

## Catatan Penting untuk GitHub

README ini dibuat aman untuk GitHub karena tidak mencantumkan:

- Database URL asli
- JWT secret
- Password
- Token
- Credential
- API key
- Data private perusahaan
- Data asli karyawan
- Konfigurasi environment production

Jika project ingin dipublikasikan, pastikan data dummy digunakan untuk demo.

---

## Disclaimer

Creativemu FaceAttend adalah project aplikasi absensi berbasis web yang masih dalam tahap development. Sistem ini dibuat untuk kebutuhan pembelajaran, pengembangan internal, dan persiapan sistem absensi digital berbasis foto serta lokasi.

Sebelum digunakan untuk production, aplikasi perlu melalui tahap:

- Testing keamanan
- Testing akurasi GPS
- Testing beban server
- Review validasi role
- Review database schema
- Backup database
- Deployment configuration
- Privacy policy
- SOP penggunaan karyawan

---

## License

Project ini dikembangkan untuk kebutuhan Creativemu FaceAttend.

Lisensi dapat disesuaikan kembali sesuai kebutuhan pemilik project.