# FaceAttend

FaceAttend adalah aplikasi absensi karyawan berbasis web untuk Creativemu dengan konsep face recognition. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, dan pendaftaran wajah karyawan oleh admin.

## Status Project

**Status:** Development

Saat ini project masih berada pada tahap pengembangan frontend, struktur halaman, routing admin/karyawan, navigasi, dan persiapan API awal.

## Tech Stack

### Web

* Next.js
* TypeScript
* Tailwind CSS
* App Router
* Lucide React

### AI Service

* Python
* FastAPI
* DeepFace
* TensorFlow

### Database Plan

* PostgreSQL
* Prisma ORM
* Local database untuk development
* Supabase atau server internal untuk production

## Project Structure

```txt
face-attend/
├── ai-service/
│   └── main.py
│
└── web/
    ├── public/
    │   └── images/
    │       └── creativemu-logo/
    │           └── creativemu.png
    │
    └── src/
        ├── app/
        │   ├── admin/
        │   │   ├── dashboard/
        │   │   ├── employees/
        │   │   ├── register-face/
        │   │   ├── reports/
        │   │   └── page.tsx
        │   │
        │   ├── api/
        │   │   ├── attendance/
        │   │   ├── face/
        │   │   └── users/
        │   │
        │   ├── attendance/
        │   ├── history/
        │   ├── home/
        │   ├── login/
        │   ├── profile/
        │   ├── globals.css
        │   ├── layout.tsx
        │   └── page.tsx
        │
        └── components/
            ├── AppHeader.tsx
            ├── BottomNav.tsx
            ├── MobileShell.tsx
            └── StatCard.tsx
```

## Current Routes

### Public

```txt
/login
```

### Employee

```txt
/home
/attendance
/history
/profile
```

### Admin

```txt
/admin
/admin/dashboard
/admin/employees
/admin/register-face
/admin/reports
```

### API

```txt
/api/attendance/check-in
/api/attendance/check-out
/api/face/enroll
/api/users
```

## Completed Progress

### 1. Project Setup

* Membuat project Next.js di folder `web`.
* Membuat folder `ai-service` untuk layanan face recognition.
* Menyiapkan struktur folder frontend, admin, employee, dan API.
* Menambahkan logo Creativemu ke folder public.

### 2. UI dan Layout

* Membuat halaman login.
* Membuat dashboard karyawan.
* Membuat halaman attendance.
* Membuat halaman history.
* Membuat halaman profile.
* Membuat dashboard admin.
* Membuat halaman employees.
* Membuat halaman register face.
* Membuat halaman reports.
* Menyesuaikan tampilan desktop dan mobile.
* Menyesuaikan tema warna utama menjadi biru-putih.

### 3. Navigation

* Membuat `AppHeader` untuk navbar desktop.
* Membuat `BottomNav` untuk navigasi mobile.
* Memisahkan navigasi employee dan admin.
* Menambahkan active state pada menu yang sedang dibuka.
* Menambahkan logo Creativemu di header.
* Menambahkan logout pada bagian admin.

### 4. Admin Route Structure

Route admin sudah dirapikan menjadi:

```txt
/admin/dashboard
/admin/employees
/admin/register-face
/admin/reports
```

Route `/admin` diarahkan ke `/admin/dashboard`.

### 5. API Placeholder

Beberapa API route awal sudah dibuat sebagai placeholder:

* Check-in endpoint.
* Check-out endpoint.
* Face enroll endpoint.
* Users endpoint.

API ini masih berupa placeholder dan belum terhubung dengan database.

## Next Plan

### Database

* Setup Prisma.
* Setup PostgreSQL.
* Membuat schema database.
* Membuat tabel users.
* Membuat tabel employees.
* Membuat tabel face_embeddings.
* Membuat tabel attendance_records.

### Authentication

* Membuat login real.
* Membuat role admin dan employee.
* Redirect berdasarkan role.
* Proteksi halaman admin dan employee.

### Employee Management

* Tambah data karyawan.
* Edit data karyawan.
* Hapus data karyawan.
* Menampilkan data dari database.

### Face Registration

* Mengaktifkan kamera browser.
* Capture wajah karyawan.
* Kirim gambar ke FastAPI.
* Generate face embedding.
* Simpan embedding ke database.

### Attendance

* Check-in dengan verifikasi wajah.
* Check-out dengan verifikasi wajah.
* Simpan data absensi ke database.
* Tampilkan status absensi.

## Development Commands

### Run Web App

```bash
cd web
npm run dev
```

### Clear Next.js Cache

```bash
rm -rf .next
npm run dev
```

### Run AI Service

```bash
cd ai-service
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

## Notes

* Route lama seperti `/employees`, `/register-face`, dan `/reports` sudah tidak digunakan.
* Semua halaman admin menggunakan prefix `/admin`.
* Halaman `/history` digunakan untuk riwayat karyawan.
* Halaman `/admin/reports` digunakan untuk laporan admin.
* API route masih placeholder dan akan dikembangkan setelah database siap.
* File `.next` adalah cache Next.js dan tidak perlu diedit manual.

## Security Plan

Karena aplikasi ini dirancang untuk karyawan, beberapa hal yang perlu diperhatikan pada tahap berikutnya:

* Password harus di-hash.
* Role admin dan employee harus dipisahkan.
* Data wajah sebaiknya disimpan sebagai face embedding.
* Foto wajah asli tidak perlu disimpan jika tidak wajib.
* Endpoint admin harus diproteksi.
* Data absensi hanya boleh diakses oleh user yang berwenang.
