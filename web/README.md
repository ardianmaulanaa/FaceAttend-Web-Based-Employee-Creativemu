# FaceAttend

FaceAttend adalah aplikasi absensi karyawan berbasis web untuk Creativemu dengan konsep face recognition. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, dan pendaftaran wajah karyawan oleh admin.

## Status Project

**Status:** Development

Saat ini project sudah berada pada tahap pengembangan frontend, routing admin/karyawan, navigasi, integrasi database MySQL lokal, Prisma ORM, custom authentication, dan employee management.

Fitur face recognition dan attendance database masih akan dikembangkan pada tahap berikutnya.

## Tech Stack

### Web

* Next.js
* TypeScript
* Tailwind CSS
* App Router
* Lucide React

### Database & ORM

* MySQL
* Prisma ORM
* Prisma Migration
* Prisma Client
* Sequel Ace untuk GUI database lokal

### Authentication

* Custom Authentication
* bcryptjs untuk hash password
* jose untuk JWT
* Cookie-based session menggunakan `faceattend_token`

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
    ├── prisma/
    │   ├── migrations/
    │   ├── schema.prisma
    │   └── seed-admin.ts
    │
    ├── prisma.config.ts
    ├── .env
    ├── package.json
    │
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
        │   │   ├── auth/
        │   │   │   ├── login/
        │   │   │   │   └── route.ts
        │   │   │   ├── me/
        │   │   │   │   └── route.ts
        │   │   │   └── change-password/
        │   │   │       └── route.ts
        │   │   │
        │   │   ├── employees/
        │   │   │   └── route.ts
        │   │   │
        │   │   ├── attendance/
        │   │   │   ├── check-in/
        │   │   │   └── check-out/
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
        ├── generated/
        │   └── prisma/
        │
        └── lib/
            ├── auth.ts
            └── prisma.ts