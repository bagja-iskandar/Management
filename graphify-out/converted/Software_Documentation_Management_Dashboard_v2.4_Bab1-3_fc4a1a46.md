<!-- converted from Software_Documentation_Management_Dashboard_v2.4_Bab1-3.docx -->

Software Documentation
Management Dashboard
Version 2.2
# BAB I Pendahuluan
## 1.1 Latar Belakang
Perkembangan transformasi digital mendorong organisasi untuk meninggalkan proses administrasi manual menuju sistem yang terintegrasi. Pengelolaan proyek, tugas, dan aktivitas operasional yang masih mengandalkan spreadsheet atau komunikasi melalui berbagai platform sering menimbulkan inkonsistensi data serta menyulitkan proses pemantauan.
Management Dashboard dikembangkan sebagai aplikasi terpusat yang menyediakan informasi operasional dalam satu antarmuka. Sistem ini dirancang agar pengguna dapat memantau perkembangan proyek, mengelola tugas, serta memperoleh informasi penting secara cepat tanpa harus berpindah antar aplikasi.
Selain memenuhi kebutuhan fungsional, proyek ini juga dikembangkan dengan pendekatan software engineering modern sehingga memiliki struktur kode yang mudah dipelihara, mudah dikembangkan, dan layak dijadikan dasar pengembangan fitur pada versi berikutnya.
## 1.2 Identifikasi Permasalahan
- Informasi proyek tersebar pada berbagai media sehingga sulit ditelusuri.
- Tidak tersedia ringkasan progres proyek secara real-time.
- Koordinasi antar anggota tim belum terdokumentasi dengan baik.
- Pelaporan memerlukan proses manual yang memakan waktu.
Permasalahan tersebut menyebabkan keterlambatan pengambilan keputusan dan meningkatkan risiko kesalahan administrasi.
## 1.3 Tujuan Pengembangan
## 1.4 Manfaat Sistem
Bagi Organisasi: Meningkatkan efisiensi dan transparansi.
Bagi Pengguna: Mempermudah pengelolaan pekerjaan.
Bagi Pengembang: Memberikan struktur proyek yang mudah dipelihara.
## 1.5 Ruang Lingkup
## 1.6 Sasaran Pengguna
## 1.7 Asumsi dan Batasan
Asumsi: aplikasi digunakan melalui browser modern, pengguna memiliki akun yang valid, dan koneksi internet tersedia.
Batasan: belum mendukung mode offline, integrasi ERP, maupun notifikasi real-time.
## 1.8 Definisi Istilah
## 1.9 Referensi
- IEEE 29148 Software Requirements
- Nuxt Documentation
- Vue Style Guide
- TypeScript Handbook
- Clean Architecture - Robert C. Martin
- Refactoring - Martin Fowler

# BAB II Gambaran Umum Proyek
## 2.1 Deskripsi Proyek
Management Dashboard merupakan aplikasi berbasis web yang dirancang untuk membantu organisasi mengelola proyek, tugas, dan aktivitas operasional melalui satu platform terintegrasi. Fokus utama sistem adalah meningkatkan visibilitas progres pekerjaan dan mempermudah koordinasi tim.
## 2.2 Business Goals
Business goals meliputi peningkatan efisiensi pengelolaan proyek, penyediaan informasi real-time, pengurangan pekerjaan administratif, dan penyediaan fondasi aplikasi yang mudah dikembangkan.
## 2.3 Stakeholder
Stakeholder utama terdiri atas Administrator, Project Manager, Team Member, dan Owner. Setiap stakeholder memiliki kebutuhan informasi dan hak akses yang berbeda.
## 2.4 User Persona
Administrator mengelola konfigurasi sistem. Project Manager mengelola proyek dan tugas. Team Member berfokus pada penyelesaian pekerjaan. Owner memonitor performa proyek melalui dashboard dan laporan.
## 2.5 Hak Akses
Hak akses menerapkan prinsip least privilege. Administrator memiliki akses penuh, Project Manager mengelola proyek, Team Member mengelola tugas yang diberikan, sedangkan Owner hanya memiliki akses baca terhadap dashboard dan laporan.
## 2.6 Alur Bisnis
Alur utama dimulai dari pembuatan proyek, penambahan anggota, pembuatan tugas, pelaksanaan pekerjaan, pembaruan status, hingga monitoring melalui dashboard.
## 2.7 Scope Proyek
Versi awal mencakup autentikasi, dashboard, proyek, tugas, pengguna, pencarian, dan statistik dasar. Integrasi eksternal, notifikasi real-time, serta analitik lanjutan direncanakan untuk versi berikutnya.

# BAB III Analisis Kebutuhan
## 3.1 Pendekatan Analisis
Analisis kebutuhan dilakukan berdasarkan tujuan bisnis, kebutuhan pengguna, dan ruang lingkup proyek sehingga setiap requirement dapat diimplementasikan dan diuji.
## 3.2 Functional Requirements
## 3.3 Non-Functional Requirements
- Performa <2 detik.
- Keamanan autentikasi dan otorisasi.
- UI responsif.
- Kode modular.
- Kompatibel browser modern.
## 3.4 Business Rules
- Satu tugas hanya berada pada satu proyek.
- Hanya Admin dan PM dapat membuat proyek.
- Owner hanya memiliki akses baca.
## 3.5 Role Permission Matrix
## 3.6 Acceptance Criteria
Given pengguna memiliki akun valid, When login berhasil, Then sistem menampilkan Dashboard.
| Tujuan | Penjelasan |
| --- | --- |
| Fungsional | Menyediakan dashboard, manajemen proyek, tugas, dan pengguna. |
| Teknis | Membangun aplikasi modular menggunakan praktik pengembangan modern. |
| Jangka Panjang | Menjadi fondasi yang mudah dikembangkan menjadi sistem yang lebih lengkap. |
| Termasuk | Belum Termasuk |
| --- | --- |
| Autentikasi | Integrasi ERP |
| Dashboard | Pembayaran |
| Manajemen Proyek | Notifikasi real-time |
| Manajemen Tugas | Analitik lanjutan |
| Manajemen Pengguna | Integrasi pihak ketiga |
| Peran | Tanggung Jawab |
| --- | --- |
| Administrator | Mengelola sistem |
| Project Manager | Mengelola proyek dan tugas |
| Team Member | Menyelesaikan tugas |
| Owner | Memantau laporan |
| Istilah | Definisi |
| --- | --- |
| Dashboard | Halaman utama berisi ringkasan informasi |
| Project | Kumpulan pekerjaan untuk mencapai tujuan |
| Task | Unit pekerjaan |
| API | Antarmuka komunikasi sistem |
| Repository | Penyimpanan source code |
| ID | Fitur | Deskripsi | Prioritas |
| --- | --- | --- | --- |
| FR-001 | Login | Autentikasi pengguna | High |
| FR-002 | Dashboard | Ringkasan proyek | High |
| FR-003 | CRUD Proyek | Kelola proyek | High |
| FR-004 | CRUD Tugas | Kelola tugas | High |
| FR-005 | Kelola User | Kelola akun | Medium |
| FR-006 | Pencarian | Cari data | Medium |
| FR-007 | Filter | Filter data | Medium |
| FR-008 | Statistik | Grafik progres | Medium |
| FR-009 | Activity Log | Riwayat aktivitas | Low |
| FR-010 | Profil | Kelola profil | Low |
| Fitur | Admin | PM | Member | Owner |
| --- | --- | --- | --- | --- |
| Project | ✔ | ✔ | Lihat | Lihat |
| Task | ✔ | ✔ | ✔ | Lihat |
| Dashboard | ✔ | ✔ | ✔ | ✔ |