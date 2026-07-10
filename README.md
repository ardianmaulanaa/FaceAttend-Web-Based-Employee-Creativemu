# Creativemu FaceAttend

**Creativemu FaceAttend** adalah aplikasi absensi karyawan berbasis web untuk Creativemu. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, monitoring absensi, pengumuman internal, pengajuan cuti/izin/sakit, serta pelaporan kehadiran karyawan.

Pada versi terbaru, sistem absensi **tidak lagi menggunakan face recognition berbasis AI**. Mekanisme absensi dilakukan dengan cara karyawan mengambil foto melalui kamera browser sebagai bukti kehadiran, lalu sistem menyimpan lokasi GPS saat check-in dan check-out.

---

## Status Project

**Status:** Development

Project ini masih berada pada tahap pengembangan aktif. Beberapa bagian utama seperti autentikasi, role access, absensi berbasis foto dan GPS, manajemen karyawan, master data, pengumuman, riwayat presensi, pengajuan cuti/izin/sakit, notifikasi karyawan, notifikasi admin, dan dashboard admin sudah dikembangkan dan terus disempurnakan.

---

## Tujuan Aplikasi

Creativemu FaceAttend dikembangkan untuk:

- Membantu perusahaan mencatat kehadiran karyawan secara digital.
- Mengurangi pencatatan absensi manual.
- Menyimpan bukti foto saat karyawan melakukan check-in dan check-out.
- Menyimpan data lokasi GPS saat absensi dilakukan.
- Membantu admin memantau status kehadiran karyawan.
- Memudahkan karyawan melihat riwayat presensi.
- Memudahkan karyawan mengajukan cuti, izin, atau sakit.
- Membantu admin mengelola laporan cuti dan keputusan approval.
- Menyediakan pengumuman internal dari admin ke karyawan.
- Menyediakan pusat notifikasi untuk karyawan dan admin.
- Menyediakan dasar pengembangan sistem monitoring dan laporan kehadiran.

---

## Konsep Utama Sistem

Sistem absensi pada Creativemu FaceAttend menggunakan kombinasi:

1. **Foto dari kamera browser**
2. **Lokasi GPS dari browser**
3. **Data waktu check-in dan check-out**
4. **Validasi radius kantor**
5. **Kategori lokasi kerja**
6. **Riwayat kehadiran per bulan dan tahun**
7. **Role-based access antara admin dan karyawan**
8. **Notifikasi berbasis status dan pengumuman**

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

Role utama:

- Admin
- Employee

Role tambahan dapat dikembangkan sesuai kebutuhan sistem.

---

### 2. Dashboard Karyawan

Dashboard karyawan digunakan sebagai halaman utama setelah login.

Fitur dashboard karyawan:

- Menampilkan sapaan pengguna.
- Menampilkan informasi shift, jabatan, unit, divisi, dan kantor terdaftar.
- Menampilkan waktu saat ini.
- Menampilkan status absensi hari ini.
- Tombol masuk ke halaman presensi.
- Akses cepat ke presensi, riwayat presensi, profil, cuti/izin/sakit, dan pengumuman.
- Badge notifikasi untuk status cuti/izin/sakit dan pengumuman baru.

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

Kategori lokasi kerja yang didukung:

- Presensi dari kantor.
- Work From Home.
- Work From Cafe.
- Kunjungan.

Catatan kategori lokasi:

- Presensi kantor menggunakan validasi radius kantor.
- WFH dan WFC dapat dilakukan dari lokasi karyawan saat itu.
- Kunjungan membutuhkan pengisian data kunjungan tambahan.
- WFH, WFC, dan kunjungan dapat masuk ke notifikasi admin untuk kebutuhan monitoring.
- WFH, WFC, dan kunjungan tidak masuk ke notifikasi karyawan.

Alur check-in:

```txt
Karyawan membuka halaman Attendance
→ Kamera aktif
→ Karyawan memilih kategori presensi
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
- Kategori presensi.
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
- Status akun.
- Role akun.
- Kantor terdaftar.
- Divisi.
- Unit kerja.
- Jabatan.
- Shift.
- Toleransi keterlambatan.
- Jam kerja.

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
- Laporan kehadiran.
- Master data.
- Notifikasi admin.
- Monitoring awal absensi.

---

### 8. Master Data

Master data digunakan admin untuk mengelola data dasar perusahaan.

Master data yang tersedia atau sedang dikembangkan:

- Kantor
- Divisi
- Unit
- Jabatan
- Shift
- Jam Kerja
- Data karyawan

Relasi utama:

```txt
Kantor
→ Divisi
→ Unit
→ Jabatan
→ Karyawan
→ Shift
→ Jam Kerja
```

Penjelasan singkat:

- Kantor digunakan sebagai lokasi kerja dan dasar validasi radius.
- Divisi berada di bawah kantor.
- Unit berada di bawah divisi.
- Jabatan berada di bawah unit.
- Karyawan memiliki kantor, divisi, unit, jabatan, dan shift.
- Shift terhubung dengan jadwal kerja.

---

### 9. Register Employee

Admin dapat mendaftarkan karyawan baru melalui halaman Register Employee.

Data yang dapat diatur:

- Nama karyawan.
- Email.
- Password awal.
- Nomor telepon.
- Kantor terdaftar.
- Divisi.
- Unit.
- Jabatan.
- Shift.
- Status akun.

Password disimpan dalam bentuk hash, bukan plain text.

---

### 10. Pengumuman Internal

Admin dapat membuat pengumuman yang akan ditampilkan kepada karyawan.

Fitur pengumuman:

- Admin membuat pengumuman.
- Admin mengatur status pengumuman.
- Karyawan dapat melihat pengumuman yang sudah dipublikasikan.
- Pengumuman baru dapat masuk ke notifikasi karyawan.
- Notifikasi pengumuman akan berubah menjadi terbaca setelah karyawan membuka notifikasi tersebut.

Status pengumuman:

- Published
- Draft
- Archived

---

### 11. Cuti / Izin / Sakit

Fitur cuti, izin, dan sakit digunakan untuk pengajuan ketidakhadiran karyawan.

Fitur karyawan:

- Mengajukan cuti.
- Mengajukan izin.
- Mengajukan sakit.
- Mengisi tanggal mulai.
- Mengisi tanggal selesai.
- Mengisi alasan pengajuan.
- Melihat riwayat pengajuan.
- Melihat status pengajuan.

Fitur admin:

- Melihat semua pengajuan cuti, izin, dan sakit.
- Melihat detail karyawan yang mengajukan.
- Menyetujui pengajuan.
- Menolak pengajuan.
- Memberikan catatan admin.
- Mengubah status pengajuan.
- Mengirim notifikasi status ke karyawan.

Status pengajuan:

- Pending
- Approved
- Rejected

Alur pengajuan:

```txt
Karyawan mengajukan cuti / izin / sakit
→ Data masuk sebagai pending
→ Admin membuka laporan cuti
→ Admin menyetujui atau menolak
→ Status pengajuan berubah
→ Notifikasi dikirim ke karyawan
→ Karyawan membuka notifikasi
→ Notifikasi ditandai sebagai dibaca
```

---

### 12. Notifikasi Karyawan

Notifikasi karyawan dibuat sebagai pusat informasi untuk employee.

Notifikasi karyawan hanya berisi:

- Cuti disetujui atau ditolak.
- Izin disetujui atau ditolak.
- Sakit disetujui atau ditolak.
- Pengumuman baru.

Notifikasi karyawan tidak digunakan untuk:

- WFH.
- WFC.
- Kunjungan.

Fitur notifikasi karyawan:

- Badge notifikasi pada AppHeader.
- Badge hanya muncul jika ada notifikasi yang belum dibaca.
- Halaman notifikasi khusus karyawan.
- Daftar notifikasi ditampilkan untuk bulan berjalan.
- Klik notifikasi akan menandai notifikasi sebagai sudah dibaca.
- Klik notifikasi cuti/izin/sakit mengarah ke halaman Cuti.
- Klik notifikasi pengumuman mengarah ke halaman Pengumuman.
- Setelah notifikasi dibaca, badge akan berkurang atau hilang.

Alur notifikasi karyawan:

```txt
Admin approve / reject cuti, izin, atau sakit
→ Sistem membuat notifikasi karyawan
→ Badge notifikasi karyawan menyala
→ Karyawan membuka halaman notifikasi
→ Karyawan klik notifikasi
→ Notifikasi berubah menjadi read
→ Karyawan diarahkan ke halaman terkait
```

---

### 13. Notifikasi Admin

Notifikasi admin digunakan untuk membantu admin memantau aktivitas penting.

Notifikasi admin dapat digunakan untuk:

- Pengajuan cuti/izin/sakit yang masih pending.
- Aktivitas WFH.
- Aktivitas WFC.
- Aktivitas kunjungan.

Fitur notifikasi admin:

- Badge notifikasi pada AppHeader admin.
- Badge menghitung data yang belum dibaca atau masih pending.
- Halaman notifikasi admin.
- Notifikasi admin dapat diarahkan ke laporan cuti atau laporan kehadiran.

Catatan:

- Notifikasi admin dan notifikasi karyawan memiliki alur yang berbeda.
- Status approval cuti/izin/sakit untuk karyawan masuk ke notifikasi karyawan.
- Aktivitas WFH/WFC/kunjungan hanya digunakan untuk kebutuhan monitoring admin.

---

### 14. AppHeader dan Navigasi

AppHeader digunakan sebagai komponen navigasi utama untuk admin dan karyawan.

Fitur AppHeader:

- Sidebar menu.
- Navigasi role-based.
- Top notification button.
- Badge notifikasi.
- Responsive untuk mobile dan desktop.
- Sidebar tertutup otomatis ketika berpindah halaman.
- Notifikasi admin diarahkan ke halaman notifikasi admin.
- Notifikasi karyawan diarahkan ke halaman notifikasi karyawan.

Menu karyawan:

- Home
- Attendance
- History
- Cuti
- Info
- Profile

Menu admin:

- Dashboard
- Monitor Perusahaan
- Pengumuman
- Register Employee
- Laporan Kehadiran
- Laporan Cuti
- Master Data

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
│   │   ├── notifications
│   │   ├── leave-requests
│   │   └── admin
│   │       ├── notifications
│   │       └── leave-requests
│   ├── home
│   ├── attendance
│   ├── history
│   ├── profile
│   ├── pengumuman
│   ├── cuti
│   ├── notifikasi
│   └── admin
│       ├── dashboard
│       ├── employees
│       ├── monitor_perusahaan
│       ├── pengumuman
│       ├── shifts
│       ├── work-schedules
│       ├── kantor
│       ├── departments
│       ├── units
│       ├── positions
│       ├── laporan-kehadiran
│       ├── notifikasi
│       └── cuti
├── components
│   └── AppHeader.tsx
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

- Dashboard admin.
- Monitoring perusahaan.
- Register employee.
- Master data.
- Pengumuman.
- Laporan cuti.
- Laporan kehadiran.
- Notifikasi admin.
- Manajemen data karyawan.

### Employee

Karyawan dapat mengakses:

- Home.
- Attendance.
- History.
- Detail History.
- Profile.
- Pengumuman.
- Cuti / Izin / Sakit.
- Notifikasi karyawan.

---

## Konsep Database

Beberapa entity utama pada sistem:

### User

Menyimpan data akun dan karyawan.

Relasi utama:

- Registered Office
- Department
- Unit
- Position
- Shift
- Attendance
- Leave Request
- Notification

### Attendance

Menyimpan data absensi harian.

Data yang disimpan:

- Tanggal absensi.
- Check-in time.
- Check-out time.
- Foto check-in.
- Foto check-out.
- Latitude check-in.
- Longitude check-in.
- Latitude check-out.
- Longitude check-out.
- Akurasi GPS.
- Jarak dari kantor.
- Status presensi.
- Kategori lokasi kerja.
- Late minutes.
- Early leave minutes.
- Work minutes.

### Office Location

Menyimpan data kantor dan radius lokasi.

### Department

Menyimpan data divisi yang berada di bawah kantor.

### Unit

Menyimpan unit kerja yang berada di bawah divisi.

### Position

Menyimpan jabatan yang berada di bawah unit.

### Shift

Menyimpan data shift karyawan.

### Work Schedule

Menyimpan jadwal kerja berdasarkan shift.

### Announcement

Menyimpan pengumuman dari admin.

### Leave Request

Menyimpan pengajuan cuti, izin, sakit, atau lainnya.

### Notification

Menyimpan notifikasi yang digunakan untuk admin atau karyawan.

Jenis notifikasi karyawan:

- leave_status
- announcement

Jenis notifikasi admin:

- pending leave request
- wfh
- wfc
- visit

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

### Leave Request

```txt
GET   /api/leave-requests
POST  /api/leave-requests
GET   /api/admin/leave-requests
PATCH /api/admin/leave-requests
```

### Notification

```txt
GET   /api/notifications
PATCH /api/notifications
GET   /api/admin/notifications
PATCH /api/admin/notifications
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
GET    /api/admin/...
POST   /api/admin/...
PATCH  /api/admin/...
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
/notifikasi
```

### Admin

```txt
/admin/dashboard
/admin/monitor_perusahaan
/admin/employees
/admin/pengumuman
/admin/shifts
/admin/work-schedules
/admin/kantor
/admin/departments
/admin/units
/admin/positions
/admin/laporan-kehadiran
/admin/cuti
/admin/notifikasi
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

## Keamanan

Beberapa prinsip keamanan yang digunakan:

- Password tidak disimpan dalam plain text.
- Password disimpan menggunakan hashing.
- Session menggunakan cookie.
- API tertentu harus melalui validasi token.
- Route admin hanya dapat diakses role tertentu.
- Data absensi dikirim menggunakan FormData.
- Data lokasi diambil langsung dari browser.
- Server-side validation digunakan pada API penting.
- Data sensitif dan konfigurasi lokal tidak dicantumkan dalam dokumentasi.

---

## Batasan Saat Ini

Karena project masih tahap development, beberapa batasan yang masih ada:

- Sistem belum sepenuhnya production-ready.
- Face recognition AI sudah tidak digunakan.
- Absensi menggunakan foto sebagai bukti, bukan identifikasi wajah otomatis.
- Validasi GPS bergantung pada akurasi perangkat dan izin lokasi browser.
- Beberapa fitur admin dan monitoring masih dalam tahap pengembangan.
- Belum ada deployment production final.
- Belum ada sistem audit log lengkap.
- Belum ada sistem notifikasi realtime berbasis websocket.
- Notifikasi saat ini masih menggunakan polling dari client.

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
- Penyempurnaan fitur cuti, izin, dan sakit.
- Penyempurnaan pusat notifikasi karyawan.
- Penyempurnaan pusat notifikasi admin.
- Integrasi notifikasi pengumuman ke seluruh karyawan.
- Role access yang lebih detail.
- Audit log aktivitas admin.
- Deployment ke hosting production.
- Optimasi tampilan mobile.
- Optimasi performa API.
- Peningkatan keamanan session.
- Dokumentasi API lebih lengkap.

---

## Catatan Penting untuk Repository

README ini tidak mencantumkan:

- Konfigurasi sensitif.
- Credential.
- Token.
- Secret.
- Data asli karyawan.
- Data private perusahaan.
- Data pribadi developer.
- Detail konfigurasi production.

Jika project ingin dipublikasikan, pastikan data yang digunakan untuk demo bukan data asli.

---

## Disclaimer

Creativemu FaceAttend adalah project aplikasi absensi berbasis web yang masih dalam tahap development. Sistem ini dibuat untuk kebutuhan pembelajaran, pengembangan internal, dan persiapan sistem absensi digital berbasis foto serta lokasi.

Sebelum digunakan untuk production, aplikasi perlu melalui tahap:

- Testing keamanan.
- Testing akurasi GPS.
- Testing beban server.
- Review validasi role.
- Review database schema.
- Backup database.
- Deployment configuration review.
- Privacy policy.
- SOP penggunaan karyawan.

---

## License

Project ini dikembangkan untuk kebutuhan Creativemu FaceAttend.

Lisensi dapat disesuaikan kembali sesuai kebutuhan pemilik project.
