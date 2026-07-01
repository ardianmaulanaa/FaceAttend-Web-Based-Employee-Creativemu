# Creativemu FaceAttend

Creativemu FaceAttend adalah aplikasi absensi karyawan berbasis web untuk Creativemu. Aplikasi ini dibuat untuk membantu proses check-in, check-out, pencatatan riwayat kehadiran, pengelolaan data karyawan, monitoring absensi, pengumuman internal, serta pelaporan kehadiran karyawan.

Pada versi terbaru, sistem absensi tidak lagi menggunakan face recognition berbasis AI. Mekanisme absensi dilakukan dengan cara karyawan mengambil foto melalui kamera browser sebagai bukti kehadiran, lalu sistem menyimpan lokasi GPS saat check-in dan check-out.

## Status Project

**Status:** Development

Saat ini project berada pada tahap pengembangan frontend, routing admin/karyawan, navigasi, integrasi database MySQL lokal, Prisma ORM, custom authentication, employee management, photo attendance, GPS attendance, master data awal, pengumuman admin, serta pengembangan awal fitur monitoring dan laporan kehadiran.

## Update Hari Ini

Beberapa perubahan dan pengembangan yang telah dilakukan:

* Penyesuaian nama aplikasi menjadi **Creativemu FaceAttend**.
* Perapihan tampilan mobile agar lebih nyaman digunakan.
* Penyesuaian ukuran elemen visual pada halaman admin.
* Penyesuaian ukuran teks pada halaman Admin Dashboard.
* Perapihan struktur navigasi admin.
* Penambahan sidebar menu pada App Header.
* Penghapusan tombol Logout dari bagian kanan atas App Header.
* Tombol Logout tetap dipertahankan pada bagian bawah sidebar.
* Penambahan menu admin untuk Dashboard.
* Penambahan menu admin untuk Monitor Perusahaan.
* Penambahan menu admin untuk Pengumuman.
* Penambahan grup menu Master Data.
* Penambahan halaman atau menu Shift.
* Penambahan halaman atau menu Jam Kerja.
* Penambahan halaman atau menu Divisi.
* Penambahan halaman atau menu Jabatan.
* Penambahan menu Register Employee.
* Penyesuaian nama menu agar lebih rapi dan konsisten.
* Penambahan halaman pengumuman agar admin dapat memberikan pemberitahuan kepada karyawan.
* Penyesuaian halaman presensi/absensi agar selaras dengan kebutuhan aplikasi.
* Perapihan App Header untuk mode admin dan karyawan.
* Perapihan Bottom Navigation untuk kebutuhan mobile.
* Perapihan Mobile Shell agar layout lebih konsisten di berbagai halaman.
* Penyesuaian README agar aman untuk dipush ke GitHub.

## Tech Stack

### Web

* Next.js
* TypeScript
* Tailwind CSS
* App Router
* Lucide React

### Database & ORM

* MySQL untuk database lokal saat development
* Prisma ORM untuk mengelola schema dan query database
* Prisma Migration untuk versioning perubahan struktur database
* Prisma Client untuk akses database dari aplikasi Next.js
* Sequel Ace untuk melihat dan mengelola database MySQL lokal
* Prisma Studio untuk melihat data database melalui browser

### Authentication

* Custom Authentication
* bcryptjs untuk hash password
* jose untuk JWT
* Cookie-based session
* Role-based access untuk admin dan karyawan

### Attendance System

* Kamera browser untuk mengambil foto absensi
* GPS browser untuk mengambil lokasi karyawan
* Check-in berbasis foto dan lokasi
* Check-out berbasis foto dan lokasi
* Review foto sebelum dikirim
* Ambil ulang foto sebelum submit absensi
* Riwayat kehadiran berdasarkan bulan dan tahun

## Konsep Absensi

Creativemu FaceAttend menggunakan sistem absensi berbasis foto dan lokasi.

Alur check-in:

```txt
Karyawan membuka halaman Attendance
→ Kamera aktif
→ Karyawan mengambil foto check-in
→ Sistem mengambil lokasi GPS
→ Karyawan dapat melakukan review foto
→ Jika foto belum sesuai, karyawan dapat mengambil ulang foto
→ Jika sudah sesuai, karyawan mengirim absensi
→ Data check-in disimpan ke database