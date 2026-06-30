# FaceAttend

FaceAttend adalah aplikasi absensi karyawan berbasis web untuk Creativemu dengan konsep face recognition. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, dan pendaftaran wajah karyawan oleh admin.

## Status Project

**Status:** Development

Saat ini project sudah berada pada tahap pengembangan frontend, routing admin/karyawan, navigasi, integrasi awal Supabase, authentication, dan employee management.

Fitur face recognition dan attendance database masih akan dikembangkan pada tahap berikutnya.

## Tech Stack

### Web

* Next.js
* TypeScript
* Tailwind CSS
* App Router
* Lucide React
* Supabase JavaScript Client

### Database & Authentication

* Supabase
* Supabase Auth
* PostgreSQL
* Row Level Security
* Table `public.users`

### AI Service

* Python
* FastAPI
* DeepFace
* TensorFlow

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
    ├── .env.local
    ├── package.json
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
        │   │   │   ├── check-in/
        │   │   │   └── check-out/
        │   │   │
        │   │   ├── employees/
        │   │   │   └── route.ts
        │   │   │
        │   │   └── face/
        │   │       └── enroll/
        │   │
        │   ├── attendance/
        │   ├── change-password/
        │   ├── history/
        │   ├── home/
        │   ├── login/
        │   ├── profile/
        │   ├── globals.css
        │   ├── layout.tsx
        │   └── page.tsx
        │
        ├── components/
        │   ├── AppHeader.tsx
        │   ├── BottomNav.tsx
        │   ├── MobileShell.tsx
        │   └── StatCard.tsx
        │
        └── lib/
            └── supabase/
                ├── admin.ts
                └── client.ts
```

## Current Routes

### Public

```txt
/login
```

### Authentication

```txt
/change-password
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

Route `/admin` diarahkan ke `/admin/dashboard`.

### API

```txt
/api/employees
/api/attendance/check-in
/api/attendance/check-out
/api/face/enroll
```

## Environment Variables

File environment disimpan di:

```txt
web/.env.local
```

Isi file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Keterangan:

```txt
NEXT_PUBLIC_SUPABASE_URL
= URL project Supabase.

NEXT_PUBLIC_SUPABASE_ANON_KEY
= key public untuk frontend.

SUPABASE_SERVICE_ROLE_KEY
= key rahasia untuk server/API route.
```

Catatan keamanan:

* `SUPABASE_SERVICE_ROLE_KEY` tidak boleh dipakai di frontend.
* `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di API route/server.
* File `.env.local` tidak boleh di-push ke GitHub.

Pastikan `.gitignore` berisi:

```gitignore
.env.local
.env
```

## Supabase Configuration

Project ini menggunakan Supabase untuk:

* Authentication user.
* Database PostgreSQL.
* Penyimpanan data profil user/karyawan.
* Role admin dan employee.
* Temporary password flow.
* Row Level Security.

### Supabase Auth

Supabase Auth digunakan untuk menyimpan akun login asli, yaitu:

```txt
email
password
user id
```

Password tidak disimpan di tabel `public.users`. Password dikelola oleh Supabase Auth.

### Table `public.users`

Tabel `public.users` digunakan untuk menyimpan profil tambahan user.

Struktur tabel:

| Nama Kolom | Tipe Data | Keterangan |
|---|---|---|
| id | UUID | ID user, terhubung dengan `auth.users` |
| name | VARCHAR(100) | Nama lengkap user |
| email | VARCHAR(100) | Email user |
| role | VARCHAR(20) | Role user: `admin` atau `employee` |
| department | VARCHAR(100) | Departemen karyawan |
| position | VARCHAR(100) | Posisi atau jabatan karyawan |
| phone | VARCHAR(20) | Nomor HP user |
| status | VARCHAR(20) | Status akun: `active` atau `inactive` |
| must_change_password | BOOLEAN | Penanda user wajib mengganti password |
| created_at | TIMESTAMPTZ | Waktu data dibuat |

Konsep relasi:

```txt
auth.users
= akun login asli dari Supabase Auth

public.users
= data profil tambahan aplikasi
```

## Supabase Client

### `client.ts`

File:

```txt
src/lib/supabase/client.ts
```

Digunakan untuk frontend, seperti login user.

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### `admin.ts`

File:

```txt
src/lib/supabase/admin.ts
```

Digunakan hanya untuk server/API route.

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

## Authentication Flow

### Login

Login dilakukan melalui halaman:

```txt
/login
```

Mekanisme login:

```txt
User input email dan password
↓
Supabase Auth mengecek email dan password
↓
Jika berhasil, sistem mengambil data dari public.users
↓
Sistem cek role, status, dan must_change_password
↓
Redirect sesuai role
```

Redirect:

```txt
role = admin
→ /admin/dashboard

role = employee
→ /home

must_change_password = true
→ /change-password
```

Login tidak mencocokkan password dari tabel `public.users`, karena password disimpan dan dicek oleh Supabase Auth.

### Admin Demo

Admin demo harus dibuat di dua tempat:

```txt
1. Supabase Authentication → Users
2. Table Editor → public.users
```

Authentication digunakan untuk login, sedangkan `public.users` digunakan untuk menyimpan role admin.

Contoh data admin:

```txt
Email    : admin@creativemu.com
Password : admin123456
Role     : admin
Status   : active
```

### Change Password

Halaman:

```txt
/change-password
```

Digunakan ketika user memiliki:

```txt
must_change_password = true
```

Mekanismenya:

```txt
Karyawan login menggunakan temporary password
↓
Sistem cek must_change_password
↓
Jika true, diarahkan ke /change-password
↓
Karyawan memasukkan password baru
↓
Supabase Auth update password
↓
public.users must_change_password diubah menjadi false
↓
User diarahkan ke halaman sesuai role
```

Password baru tetap tidak disimpan di tabel `public.users`.

## Employee Management

Halaman:

```txt
/admin/employees
```

Fitur yang sudah dibuat:

* Menampilkan daftar karyawan dari Supabase.
* Menambahkan karyawan baru.
* Membuat akun login karyawan di Supabase Auth.
* Menyimpan profil karyawan ke tabel `public.users`.
* Menghapus field Employee ID dari popup karena ID sudah otomatis dari Supabase.
* Menggunakan temporary password untuk login pertama kali.
* Menandai karyawan baru dengan `must_change_password = true`.

### API Employee

Endpoint:

```txt
/api/employees
```

Method:

```txt
GET  /api/employees
POST /api/employees
```

Fungsi:

```txt
GET
= mengambil daftar user dengan role employee dari tabel public.users

POST
= membuat akun karyawan baru
= membuat user di Supabase Auth
= menyimpan profil ke public.users
```

Mapping form ke database:

| Form Admin | Database / Auth |
|---|---|
| Full Name | `public.users.name` |
| Email | `auth.users.email` dan `public.users.email` |
| Temporary Password | Supabase Auth password |
| Department | `public.users.department` |
| Position | `public.users.position` |
| Status | `public.users.status` |

Temporary password tidak disimpan di tabel `public.users`.

## Completed Progress

### 1. Project Setup

* Membuat project Next.js di folder `web`.
* Membuat folder `ai-service` untuk layanan face recognition.
* Menyiapkan struktur folder frontend, admin, employee, dan API.
* Menambahkan logo Creativemu ke folder public.
* Menghapus package dependency yang salah lokasi di root project.
* Memastikan dependency Supabase berada di folder `web`.

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
* Membuat popup register employee lebih rapi.
* Menghapus input Employee ID dari popup register employee.

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

Route `/admin` diarahkan ke:

```txt
/admin/dashboard
```

### 5. Supabase Integration

* Install package `@supabase/supabase-js`.
* Membuat `.env.local`.
* Menambahkan Supabase URL, anon key, dan service role key.
* Membuat `src/lib/supabase/client.ts`.
* Membuat `src/lib/supabase/admin.ts`.
* Membuat API test koneksi Supabase.
* Koneksi Supabase berhasil diuji dengan response:

```json
{
  "success": true,
  "data": []
}
```

### 6. Database

* Membuat tabel `public.users`.
* Mengaktifkan Row Level Security.
* Membuat policy user agar bisa membaca dan update data sendiri.
* Membuat function `is_admin()` untuk pengecekan role admin.
* Menambahkan policy admin untuk akses data user.
* Menambahkan kolom `must_change_password`.

### 7. Employee API

* Membuat endpoint `/api/employees`.
* Method `GET` untuk mengambil daftar karyawan.
* Method `POST` untuk membuat karyawan baru.
* `POST /api/employees` membuat user di Supabase Auth.
* `POST /api/employees` menyimpan data profil ke `public.users`.
* Temporary password tidak disimpan di database profil.

### 8. Login

* Login tidak lagi menggunakan link langsung ke `/home`.
* Login sudah menggunakan Supabase Auth.
* Setelah login, sistem mengambil data dari `public.users`.
* Redirect dilakukan berdasarkan role.
* Akun inactive tidak bisa masuk.
* User dengan `must_change_password = true` diarahkan ke `/change-password`.

### 9. Change Password

* Menyiapkan mekanisme change password.
* User dapat mengganti password melalui Supabase Auth.
* Setelah password diganti, `must_change_password` diubah menjadi `false`.
* Setelah selesai, user diarahkan ke halaman sesuai role.

## Current API Status

| Endpoint | Status | Keterangan |
|---|---|---|
| `/api/employees` | Active | Sudah terhubung ke Supabase |
| `/api/attendance/check-in` | Placeholder | Belum terhubung ke database |
| `/api/attendance/check-out` | Placeholder | Belum terhubung ke database |
| `/api/face/enroll` | Placeholder | Belum terhubung ke AI Service |
| `/api/test-supabase` | Temporary | Hanya untuk test, boleh dihapus |

## Next Plan

### Authentication

* Proteksi halaman admin agar hanya role admin yang bisa masuk.
* Proteksi halaman employee agar hanya employee yang bisa masuk.
* Menambahkan logout real menggunakan Supabase Auth.
* Menambahkan session check pada halaman yang membutuhkan login.
* Menambahkan middleware untuk redirect jika belum login.

### Employee Management

* Edit data karyawan.
* Hapus data karyawan.
* Reset password karyawan.
* Filter berdasarkan status.
* Menambahkan phone number jika dibutuhkan.
* Menambahkan konfirmasi sebelum menghapus data.

### Attendance

* Membuat tabel attendance records.
* Membuat API check-in.
* Membuat API check-out.
* Menyimpan jam masuk dan jam keluar.
* Menampilkan status absensi harian.
* Menampilkan riwayat absensi berdasarkan user.

### Face Registration

* Mengaktifkan kamera browser.
* Capture wajah karyawan.
* Kirim gambar ke FastAPI.
* Generate face embedding.
* Simpan embedding ke database.
* Menghubungkan admin register face dengan data employee.

### Face Recognition

* Menghubungkan Next.js dengan FastAPI.
* Verifikasi wajah saat check-in.
* Verifikasi wajah saat check-out.
* Membandingkan embedding wajah.
* Menentukan threshold similarity.

### Reports

* Menampilkan laporan absensi.
* Filter laporan berdasarkan tanggal.
* Filter laporan berdasarkan karyawan.
* Export laporan ke CSV/PDF.

## Development Commands

### Run Web App

```bash
cd web
npm run dev
```

### Install Supabase Client

```bash
cd web
npm install @supabase/supabase-js
```

### Clear Next.js Cache

```bash
cd web
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
* API `/api/users` yang masih dummy boleh dihapus jika tidak digunakan.
* API `/api/test-supabase` hanya untuk testing koneksi dan boleh dihapus setelah integrasi berhasil.
* File `.next` adalah cache Next.js dan tidak perlu diedit manual.
* File `.env.local` berisi data rahasia dan tidak boleh di-push ke GitHub.
* Password tidak disimpan di tabel `public.users`.
* Password dikelola oleh Supabase Auth.

## Security Plan

Karena aplikasi ini dirancang untuk karyawan, beberapa hal yang perlu diperhatikan:

* Password dikelola melalui Supabase Auth.
* Role admin dan employee harus dipisahkan.
* Endpoint admin harus diproteksi.
* Service role key tidak boleh digunakan di frontend.
* Service role key hanya boleh digunakan di API route/server.
* File `.env.local` tidak boleh masuk ke GitHub.
* Row Level Security harus aktif.
* Data absensi hanya boleh diakses oleh user yang berwenang.
* Data wajah sebaiknya disimpan sebagai face embedding.
* Foto wajah asli tidak perlu disimpan jika tidak wajib.
* Endpoint face recognition harus divalidasi dengan aman.