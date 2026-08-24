# Dokumentasi Analisis Absensi

Folder ini berisi dua project aplikasi absensi berbasis web:

- `absensi-creativemu`
- `absensi-alfabank`

Keduanya menggunakan fondasi teknologi yang sama dan dikembangkan sebagai aplikasi absensi karyawan berbasis foto, GPS, role access, dashboard admin, laporan kehadiran, cuti/pengajuan, pengumuman, dan notifikasi.

## Ringkasan Umum

### Struktur Folder

```txt
absensi
├── absensi-creativemu
│   ├── package.json
│   ├── README.md
│   ├── server.js
│   └── web
│       ├── src
│       │   ├── app
│       │   ├── components
│       │   ├── context
│       │   ├── hooks
│       │   └── lib
│       ├── prisma
│       ├── scripts
│       ├── e2e
│       ├── public
│       └── package.json
└── absensi-alfabank
    ├── package.json
    ├── README.md
    ├── server.js
    └── web
        ├── src
        │   ├── app
        │   ├── components
        │   ├── context
        │   ├── hooks
        │   └── lib
        ├── prisma
        ├── scripts
        ├── e2e
        ├── public
        └── package.json
```

### Teknologi Utama

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- MySQL/MariaDB
- bcryptjs
- jose JWT
- Leaflet/react-leaflet
- Lucide React
- Vitest
- Playwright
- ESLint

### Perbandingan Singkat

| Area | absensi-creativemu | absensi-alfabank |
| --- | --- | --- |
| Basis aplikasi | FaceAttend untuk Creativemu | FaceAttend versi rebrand Alfabank |
| Stack | Next.js, Prisma, MySQL/MariaDB | Sama |
| Struktur database | Sama secara garis besar | Sama secara garis besar |
| Branding | Logo/tema Creativemu biru | Logo/tema Alfabank merah |
| Modul cuti | Ada | Ada |
| Modul pengajuan tambahan | Tidak ada route khusus `/pengajuan` | Ada route khusus `/pengajuan` dan admin laporan pengajuan |
| Attachment pengajuan/cuti | Terbatas | Lebih lengkap, termasuk endpoint attachment |
| Dokumen pengumuman | Tidak ada endpoint khusus dokumen | Ada endpoint dokumen pengumuman |
| Site logo image endpoint | Tidak ada endpoint khusus image | Ada `/api/site-logo/image` |
| README internal | Sesuai Creativemu | Masih banyak menyebut Creativemu, perlu direbrand |

---

# 1. SRS / Software Requirement Specification

## 1.1 Nama Sistem

### absensi-creativemu

Creativemu FaceAttend.

### absensi-alfabank

Alfabank FaceAttend atau Sistem Absensi Alfabank. Secara kode sudah banyak direbrand ke Alfabank, tetapi README bawaan masih memakai nama Creativemu sehingga perlu penyesuaian dokumentasi.

## 1.2 Tujuan Sistem

Sistem dibuat untuk membantu perusahaan mengelola absensi karyawan secara digital dengan bukti foto dan lokasi GPS.

Tujuan utama:

- Mencatat check-in dan check-out karyawan.
- Menyimpan foto presensi sebagai bukti kehadiran.
- Menyimpan lokasi GPS saat presensi.
- Memvalidasi radius lokasi kantor.
- Mengurangi proses absensi manual.
- Menyediakan riwayat presensi karyawan.
- Menyediakan dashboard dan laporan untuk admin.
- Mengelola data karyawan dan master data organisasi.
- Mengelola cuti, izin, sakit, dan pengajuan lain.
- Mengelola pengumuman internal perusahaan.
- Mengirim notifikasi kepada karyawan dan admin.

## 1.3 Aktor Sistem

### Employee / Karyawan

Karyawan dapat:

- Login ke aplikasi.
- Melihat beranda/dashboard pribadi.
- Melakukan check-in.
- Melakukan check-out.
- Mengambil foto presensi dari kamera browser.
- Mengirim lokasi GPS.
- Memilih mode kerja seperti kantor, WFH, atau kunjungan.
- Melihat riwayat presensi.
- Melihat detail presensi.
- Mengubah profil dan password.
- Mengajukan cuti, izin, sakit, atau pengajuan lain.
- Melihat status pengajuan.
- Membaca pengumuman.
- Melihat notifikasi.
- Mengajukan tukar shift.

### Admin / Owner

Admin atau owner dapat:

- Login ke aplikasi.
- Mengakses dashboard admin.
- Melihat monitor perusahaan.
- Mengelola data karyawan.
- Mengelola kantor.
- Mengelola divisi.
- Mengelola jabatan.
- Mengelola posisi.
- Mengelola shift.
- Mengelola jam kerja.
- Mengelola status kepegawaian.
- Mengelola nomor kontak admin.
- Mengelola pengumuman.
- Mengelola laporan kehadiran.
- Mengelola rekap kehadiran karyawan.
- Mengelola laporan cuti.
- Menyetujui atau menolak pengajuan.
- Melihat notifikasi admin.
- Mengubah logo dan warna aplikasi.

## 1.4 Fitur Fungsional

### Authentication

- Sistem menyediakan login karyawan dan admin.
- Password disimpan dalam bentuk hash menggunakan bcrypt.
- Session menggunakan JWT dan cookie.
- Cookie utama bernama `presensi_token`.
- Sistem memvalidasi status akun aktif.
- Sistem mendukung role `employee`, `admin`, dan `owner`.
- Sistem menolak akses jika role tidak sesuai.
- Sistem menyediakan logout.

### Presensi

- Karyawan dapat check-in satu kali per hari.
- Karyawan dapat check-out setelah check-in.
- Sistem mengambil foto dari kamera browser.
- Sistem mengambil latitude, longitude, dan akurasi GPS.
- Sistem menghitung jarak karyawan ke kantor.
- Sistem menentukan apakah karyawan berada dalam radius kantor.
- Sistem mendukung mode kerja kantor, WFH, dan kunjungan.
- Sistem menghitung keterlambatan berdasarkan jadwal kerja.
- Sistem menghitung pulang cepat berdasarkan jadwal pulang.
- Sistem menyimpan alasan telat jika melewati toleransi.
- Sistem menyimpan alasan pulang cepat jika dibutuhkan.
- Sistem menyimpan catatan aktivitas.

### Riwayat Presensi

- Karyawan dapat melihat daftar presensi.
- Riwayat dapat difilter berdasarkan bulan dan tahun.
- Karyawan dapat membuka detail presensi.
- Detail berisi foto check-in, foto check-out, lokasi, jarak, akurasi, status, jam kerja, keterlambatan, dan pulang cepat.

### Master Data

Admin dapat mengelola:

- Kantor
- Divisi
- Jabatan
- Posisi
- Shift
- Jam kerja
- Status kepegawaian
- Nomor kontak admin
- Data karyawan

Relasi data utama:

```txt
Kantor
→ Divisi
→ Jabatan
→ Posisi
→ Karyawan
→ Shift
→ Jam Kerja
```

### Cuti, Izin, Sakit, dan Pengajuan

Fitur yang tersedia:

- Karyawan dapat membuat pengajuan.
- Pengajuan memiliki tanggal mulai dan tanggal selesai.
- Sistem menghitung total hari.
- Karyawan mengisi alasan.
- Status awal adalah `pending`.
- Admin dapat menyetujui atau menolak.
- Admin dapat memberi catatan.
- Sistem mengirim notifikasi status ke karyawan.

Jenis umum:

- Cuti tahunan
- Izin
- Sakit
- Lembur
- Lainnya

Khusus `absensi-alfabank`, tersedia modul tambahan bernama `pengajuan` dengan halaman dan API tersendiri.

### Pengumuman

- Admin dapat membuat pengumuman.
- Pengumuman dapat berstatus published, draft, atau archived.
- Karyawan dapat membaca pengumuman.
- Sistem dapat menampilkan pengumuman baru sebagai notifikasi.
- Pada Alfabank tersedia endpoint dokumen pengumuman.

### Notifikasi

Notifikasi karyawan:

- Status cuti/pengajuan disetujui.
- Status cuti/pengajuan ditolak.
- Pengumuman baru.

Notifikasi admin:

- Pengajuan pending.
- Aktivitas WFH.
- Aktivitas kunjungan.
- Aktivitas presensi yang perlu dipantau.

### Branding Aplikasi

- Admin dapat mengatur tema warna aplikasi.
- Admin dapat mengatur logo aplikasi.
- Masing-masing project memiliki aset brand berbeda.
- Creativemu memakai aset logo Creativemu.
- Alfabank memakai aset logo dan ikon Alfabank.

## 1.5 Kebutuhan Non-Fungsional

### Keamanan

- Password harus di-hash.
- JWT harus memakai secret dari environment variable.
- API harus memvalidasi session.
- API admin harus dilindungi role admin/owner.
- File rahasia seperti `.env` tidak boleh ikut commit.
- Sistem memiliki script pemeriksaan secret.

### Performa

- API memakai Prisma query langsung ke database.
- Index database tersedia untuk field penting seperti role, status, tanggal, work mode, dan relasi.
- Build standalone tersedia untuk deployment.

### Kompatibilitas

- Sistem dirancang untuk browser modern.
- Presensi membutuhkan akses kamera dan geolocation.
- Validasi device phone tersedia untuk request presensi.

### Maintainability

- Logic reusable ditempatkan di `src/lib`.
- Komponen UI reusable ditempatkan di `src/components`.
- API dipisah berdasarkan domain di `src/app/api`.
- Database dikelola melalui Prisma schema dan migrations.

---

# 2. SDD / Software Design Document

## 2.1 Arsitektur Sistem

Sistem menggunakan arsitektur monolith berbasis Next.js:

```txt
Browser
↓
Next.js App Router Pages
↓
Next.js API Route Handlers
↓
Prisma Client
↓
MySQL/MariaDB Database
```

Frontend dan backend berada dalam satu aplikasi Next.js. Halaman UI berada pada `src/app`, sedangkan endpoint backend berada pada `src/app/api`.

## 2.2 Struktur Aplikasi

### Root Project

File `package.json` di root hanya meneruskan script ke folder `web`.

Script root:

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### Folder `web`

Folder `web` adalah aplikasi utama.

Struktur penting:

```txt
web
├── src
│   ├── app
│   │   ├── api
│   │   ├── admin
│   │   ├── beranda
│   │   ├── presensi
│   │   ├── history
│   │   ├── cuti
│   │   ├── pengumuman
│   │   ├── notifikasi
│   │   ├── profil
│   │   └── tukar-shift
│   ├── components
│   ├── context
│   ├── hooks
│   └── lib
├── prisma
│   ├── schema.prisma
│   ├── migrations
│   ├── seed-admin.ts
│   └── seed-office.ts
├── scripts
├── e2e
├── public
└── package.json
```

Pada `absensi-alfabank`, terdapat tambahan:

```txt
src/app/pengajuan
src/app/admin/laporan-pengajuan
src/app/api/pengajuan
src/app/api/admin/pengajuan
src/app/api/pengajuan/[id]/attachment
src/app/api/announcements/[id]/document
src/app/api/site-logo/image
```

## 2.3 Desain Modul

### Modul Auth

File utama:

- `src/lib/auth.ts`
- `src/lib/api-auth.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`

Tanggung jawab:

- Hash password.
- Verifikasi password.
- Membuat JWT.
- Memverifikasi JWT.
- Mengambil token dari cookie.
- Memvalidasi user aktif.
- Memvalidasi role.
- Menolak akses jika akun tidak aktif atau masa kerja berakhir.

### Modul Presensi

File utama:

- `src/app/presensi/page.tsx`
- `src/app/api/attendance/check-in/route.ts`
- `src/app/api/attendance/check-out/route.ts`
- `src/app/api/attendance/today/route.ts`
- `src/app/api/attendance/history/route.ts`
- `src/app/api/attendance/[id]/route.ts`
- `src/app/api/attendance/[id]/photo/route.ts`
- `src/lib/geo.ts`
- `src/lib/attendance-device.ts`
- `src/lib/location-label.ts`
- `src/lib/leave-attendance-guard.ts`

Tanggung jawab:

- Menerima foto presensi.
- Menerima data GPS.
- Validasi MIME foto.
- Validasi ukuran foto.
- Validasi koordinat GPS.
- Menghitung jarak ke kantor.
- Menentukan kantor valid terdekat.
- Menghitung telat.
- Menghitung pulang cepat.
- Menolak presensi saat karyawan sedang cuti aktif.
- Menyimpan data presensi.

### Modul Geofence

File utama:

- `src/lib/geo.ts`

Fungsi utama:

- Menghitung jarak dengan formula Haversine.
- Memvalidasi latitude dan longitude.
- Memvalidasi radius kantor.
- Menentukan kantor terdekat yang masih dalam radius.
- Menambahkan buffer berdasarkan akurasi GPS.
- Membatasi akurasi GPS maksimal.

### Modul Karyawan

File utama:

- `src/app/admin/daftar-karyawan/page.tsx`
- `src/app/admin/daftar-karyawan/[id]/page.tsx`
- `src/app/api/employees/route.ts`

Tanggung jawab:

- Menampilkan daftar karyawan.
- Membuat karyawan baru.
- Mengubah data karyawan.
- Menghapus data karyawan.
- Mengelola data pribadi, bank, status, jabatan, posisi, shift, dan kantor.

### Modul Master Data

Endpoint utama:

- `/api/admin/offices`
- `/api/admin/departments`
- `/api/admin/jabatan`
- `/api/admin/positions`
- `/api/admin/shifts`
- `/api/admin/work-schedules`
- `/api/admin/employment-statuses`
- `/api/admin/contact-numbers`

Tanggung jawab:

- CRUD data referensi perusahaan.
- Menyediakan data untuk form karyawan, presensi, dan laporan.

### Modul Cuti dan Pengajuan

Creativemu:

- `src/app/cuti/page.tsx`
- `src/app/admin/laporan-cuti/page.tsx`
- `src/app/api/leave-requests/route.ts`
- `src/app/api/admin/leave-requests/route.ts`

Alfabank tambahan:

- `src/app/pengajuan/page.tsx`
- `src/app/admin/laporan-pengajuan/page.tsx`
- `src/app/api/pengajuan/route.ts`
- `src/app/api/admin/pengajuan/route.ts`
- `src/app/api/pengajuan/[id]/attachment/route.ts`

Tanggung jawab:

- Membuat pengajuan.
- Menampilkan riwayat pengajuan.
- Memvalidasi tanggal.
- Menghitung total hari.
- Menyimpan attachment jika tersedia.
- Approval atau rejection oleh admin.
- Membuat notifikasi ke karyawan.

### Modul Pengumuman

File utama:

- `src/app/pengumuman/page.tsx`
- `src/app/pengumuman/[id]/page.tsx`
- `src/app/admin/pengumuman/page.tsx`
- `src/app/admin/pengumuman/[id]/page.tsx`
- `src/app/api/announcements/route.ts`

Tambahan Alfabank:

- `src/app/api/announcements/[id]/document/route.ts`

Tanggung jawab:

- CRUD pengumuman.
- Menampilkan pengumuman published.
- Mengelola target pengumuman.
- Mengelola status pengumuman.
- Mengelola dokumen pengumuman pada Alfabank.

### Modul Notifikasi

File utama:

- `src/app/notifikasi/page.tsx`
- `src/app/admin/notifikasi/page.tsx`
- `src/app/api/notifications/route.ts`
- `src/app/api/admin/notifications/route.ts`

Tanggung jawab:

- Menampilkan notifikasi karyawan.
- Menampilkan notifikasi admin.
- Menandai notifikasi sebagai dibaca.
- Menghitung badge unread.

### Modul Branding

File utama:

- `src/app/admin/warna-aplikasi/page.tsx`
- `src/app/admin/logo-aplikasi/page.tsx`
- `src/app/api/app-theme/route.ts`
- `src/app/api/admin/app-theme/route.ts`
- `src/app/api/site-logo/route.ts`
- `src/app/api/admin/site-logo/route.ts`
- `src/lib/app-theme.ts`
- `src/lib/site-logo.ts`

Tambahan Alfabank:

- `src/app/api/site-logo/image/route.ts`

Tanggung jawab:

- Mengambil tema default.
- Mengubah warna aplikasi.
- Mengubah logo aplikasi.
- Menyediakan aset logo untuk UI dan PWA.

## 2.4 Desain Database

Model utama Prisma:

- `User`
- `LoginRateLimit`
- `Department`
- `Jabatan`
- `Position`
- `Shift`
- `WorkSchedule`
- `OfficeLocation`
- `Attendance`
- `AttendanceMonthlySummary`
- `EmployeeVisit`
- `WfhRequest`
- `LeaveRequest`
- `Announcement`
- `AdminNotification`
- `AdminContactNumber`
- `Payroll`
- `PayrollItem`
- `Permission`
- `RolePermission`
- `EmploymentStatus`
- `ShiftSwapRequest`
- `AppSetting`

Enum utama:

- `DayOfWeek`
- `AttendanceStatus`
- `CheckInStatus`
- `CheckOutStatus`

Relasi penting:

- User memiliki banyak Attendance.
- User memiliki Department, Jabatan, Position, Shift, dan OfficeLocation.
- OfficeLocation menjadi dasar geofence presensi.
- Shift memiliki WorkSchedule.
- LeaveRequest dimiliki oleh User.
- Announcement dibuat oleh User admin.
- AdminNotification dapat terhubung ke Attendance dan User.
- ShiftSwapRequest menghubungkan requester dan target user.

## 2.5 Desain Deployment

Script utama:

- `npm run build`
- `npm run build:standalone`
- `npm run start:standalone`
- `npm run deploy:standalone`

Build standalone menggunakan:

- Prisma generate
- Next build dengan `NEXT_DIST_DIR=.next-build`
- Persiapan asset standalone
- Pemeriksaan artifact

---

# 3. QA / Quality Automation

## 3.1 Script QA

Script tersedia di `web/package.json`:

```txt
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:e2e
npm run check:lockfile
npm run audit:deps
npm run check:secrets
npm run check:artifacts
npm run quality
```

Pipeline lengkap:

```txt
npm run quality
```

Pipeline tersebut menjalankan:

1. Validasi lockfile.
2. ESLint.
3. TypeScript check.
4. Unit test dengan coverage.
5. Dependency audit.
6. Secret check.
7. Artifact check.
8. Standalone build.
9. Prepare standalone assets.
10. Artifact check ulang.
11. Playwright E2E test.

## 3.2 Unit Test

Framework:

- Vitest
- Coverage provider V8

File test yang ditemukan:

- `src/lib/api-errors.test.ts`
- `src/lib/api-response.test.ts`
- `src/lib/auth.test.ts`
- `src/lib/geo.test.ts`
- `scripts/check-artifacts.test.ts`

Coverage difokuskan pada:

- `src/lib/auth.ts`
- `src/lib/api-errors.ts`
- `src/lib/api-response.ts`
- `src/lib/geo.ts`

Threshold coverage:

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

## 3.3 E2E Test

Framework:

- Playwright

File E2E:

- `e2e/login.spec.ts`

Skenario yang sudah ada:

- Halaman login tampil.
- Form login memiliki input email dan password.
- Tombol masuk tampil.
- Validasi field kosong muncul tanpa memanggil API.

Konfigurasi:

- Browser: Chromium Desktop.
- Base URL default: `http://127.0.0.1:3100`.
- Server E2E menggunakan standalone server dari `.next-build`.

## 3.4 Security dan Artifact Check

### Secret Check

Script:

```txt
scripts/check-secrets.sh
```

Pemeriksaan:

- `.env` tidak boleh tracked.
- AWS key pattern.
- GitHub token pattern.
- Slack token pattern.
- OpenAI API key pattern.
- Private key pattern.
- Database URL dengan password.

### Artifact Check

Script:

```txt
scripts/check-artifacts.sh
```

Pemeriksaan:

- `.env` tidak boleh masuk artifact.
- `public/uploads` tidak boleh ikut tracked.
- ZIP tidak boleh mengandung `.env`.
- ZIP tidak boleh mengandung `public/uploads`.
- Output standalone tidak boleh membawa upload user.
- Asset brand wajib tersedia di output deployment.

Catatan: script artifact Creativemu mengecek asset logo Creativemu. Pada Alfabank script serupa perlu dipastikan sudah sesuai asset Alfabank.

## 3.5 QA Gap dan Rekomendasi

### E2E yang Perlu Ditambah

- Login employee berhasil.
- Login admin berhasil.
- Logout berhasil.
- Check-in dengan foto dan GPS.
- Check-out dengan foto dan GPS.
- Presensi ditolak jika GPS invalid.
- Presensi ditolak jika foto tidak valid.
- Presensi ditolak jika user sedang cuti aktif.
- Riwayat presensi tampil setelah check-in.
- Admin melihat laporan kehadiran.
- Admin approve/reject cuti.
- Karyawan menerima notifikasi approval/rejection.
- Admin CRUD karyawan.
- Admin CRUD kantor.
- Admin CRUD shift dan jam kerja.
- Admin membuat pengumuman.
- Karyawan membaca pengumuman.
- Khusus Alfabank: pengajuan dengan attachment.
- Khusus Alfabank: admin laporan pengajuan.

### Unit Test yang Perlu Ditambah

- Perhitungan telat.
- Perhitungan pulang cepat.
- Validasi radius kantor.
- Validasi akurasi GPS.
- Validasi mode kerja.
- Validasi attachment type dan size.
- Validasi total hari cuti.
- Validasi role guard.
- Validasi masa kerja berakhir.
- Validasi kuota WFH.
- Validasi shift swap.

### API Test yang Perlu Ditambah

- `/api/auth/login`
- `/api/attendance/check-in`
- `/api/attendance/check-out`
- `/api/attendance/today`
- `/api/employees`
- `/api/leave-requests`
- `/api/admin/leave-requests`
- `/api/announcements`
- `/api/notifications`
- Khusus Alfabank: `/api/pengajuan`
- Khusus Alfabank: `/api/admin/pengajuan`

## 3.6 Risiko yang Perlu Diperhatikan

- README Alfabank belum sinkron dengan branding Alfabank.
- Kedua project banyak memiliki kode mirip, sehingga perbaikan di satu folder perlu dicek ulang di folder lainnya.
- Attachment lokal di `public/uploads` perlu disiplin agar tidak ikut commit/deploy.
- Beberapa fitur penting belum memiliki E2E test.
- Presensi sangat bergantung pada permission kamera dan GPS browser.
- Akurasi GPS bisa bervariasi, sehingga buffer radius perlu diuji dengan data nyata.
- Role `owner`, `admin`, dan `employee` harus terus diuji agar tidak terjadi akses silang.

---

# Kesimpulan

`absensi-creativemu` dan `absensi-alfabank` adalah dua varian dari sistem FaceAttend yang sama. Keduanya memiliki fondasi teknis, struktur folder, database model, dan pipeline QA yang hampir identik.

Perbedaan utama berada pada branding, migrasi data, aset visual, dan fitur tambahan Alfabank seperti modul `pengajuan`, attachment pengajuan, dokumen pengumuman, serta endpoint gambar logo.

Secara kesiapan, sistem sudah memiliki struktur aplikasi yang cukup lengkap dan pipeline quality yang baik. Area yang paling perlu ditingkatkan adalah dokumentasi Alfabank, test E2E untuk alur bisnis utama, serta automated test untuk presensi, approval, attachment, dan role access.
