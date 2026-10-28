# NEXURA MANAGEMENT — MANDATORY HEAD AGENT REPORTING STANDARD

> **STATUS:** RATIFIED & MANDATORY  
> **APPLIES TO:** Head Agent  
> **REFERENCE GOVERNANCE:** [`.agents/rules/multi-agent-governance.md`](file:///d:/Project_Center/REWORK/Management/.agents/rules/multi-agent-governance.md)  
> **SCOPE:** Seluruh pelaporan fase kerja, audit, perencanaan, implementasi, integrasi, dan validasi pada repositori Nexura Management.

---

## 1. TUJUAN DAN KEDUDUKAN DOKUMEN

Dokumen ini menetapkan **Standar Pelaporan Wajib (Mandatory Reporting Standard)** bagi Head Agent dalam mengomunikasikan progres, temuan, kendala, hasil implementasi, dan permohonan persetujuan kepada Project Owner.

### 1.1. Hubungan dengan Dokumen Tata Kelola Multi-Agent
- **Dokumen Aturan Mutlak (`.agents/rules/multi-agent-governance.md`):** Mengatur kewenangan, batasan otonomi, etika komunikasi dua arah, 5-Phase Gate, Single Execution Ownership, dan larangan mutlak eksekusi.
- **Dokumen Standar Pelaporan (Dokumen Ini):** Mengatur format laporan, struktur wajib, definisi status, disiplin inventarisasi perubahan file, pembuktian empiris, dan template siap pakai.
- Head Agent DILARANG mengubah atau melonggarkan aturan tata kelola di dalam dokumen pelaporan.

### 1.2. Kapan Standar Ini Wajib Digunakan
Head Agent WAJIB menggunakan format dan struktur standar ini setiap kali menyampaikan:
1. Laporan Investigasi atau Audit (Fase A).
2. Laporan Hasil Perencanaan & Hasil Review Silang (Fase C & D).
3. Laporan Kemajuan atau Penyelesaian Implementasi (Fase E / Eksekusi).
4. Laporan Integrasi Antarkomponen & Pengujian Sistem.
5. Laporan Penutupan Fase dan Permohonan Persetujuan (*User Approval Gate*).

---

## 2. SEPULUH BAGIAN WAJIB LAPORAN FASE

Setiap laporan fase wajib memuat 10 bagian berikut secara berurutan. Jika suatu bagian tidak relevan untuk jenis fase tertentu (misal: inventaris file pada fase investigasi murni), bagian tersebut **TIDAK BOLEH DIHILANGKAN**, melainkan wajib dinyatakan secara eksplisit: `[Tidak Relevan untuk Fase Ini]` disertai alasan teknis yang ringkas.

```
+-----------------------------------------------------------------------+
|                 STRUKTUR 10 BAGIAN LAPORAN FASE                       |
+-----------------------------------------------------------------------+
| Bagian 1: Ringkasan Eksekutif                                         |
| Bagian 2: Informasi Tim Analisis & Kontribusi Review                  |
| Bagian 3: Informasi Tim Eksekutor & Realisasi Kerja                   |
| Bagian 4: Inventaris Perubahan File (File Change Inventory)          |
| Bagian 5: Perbandingan Rencana (Plan) vs Realisasi Aktual             |
| Bagian 6: Hasil Validasi, Pengujian, & Bukti Empiris                  |
| Bagian 7: Log Diskusi Teknis & Keputusan Arsitektur Kunci             |
| Bagian 8: Masalah, Blokir, & Risiko Terbuka (Open Issues)             |
| Bagian 9: Matriks Kriteria Penerimaan (Acceptance Criteria Matrix)   |
| Bagian 10: Status Akhir Fase & Tindak Lanjut yang Direkomendasikan   |
+-----------------------------------------------------------------------+
```

---

### BAGIAN 1: RINGKASAN EKSEKUTIF
Ringkasan singkat tingkat tinggi yang memberikan gambaran jernih kepada Project Owner mengenai kondisi aktual tanpa eufemisme atau klaim sepihak.

**Elemen Wajib:**
- **Nama & Nomor Fase:** Identifier fase resmi sesuai roadmap (contoh: `Fase 2: OmniSearch Engine Alignment`).
- **Tujuan Fase:** Target objektif fase tersebut.
- **Scope yang Disetujui:** Batasan pekerjaan yang disetujui pengguna.
- **Hasil Utama:** Capaian konkret yang berhasil diselesaikan pada fase ini.
- **Status Fase Saat Ini:** Salah satu dari status standar (lihat Bab 3).
- **Keterpenuhan Kriteria Penerimaan:** Apakah semua kriteria terpenuhi (`Ya` / `Sebagian` / `Tidak`).
- **Risiko / Masalah Kritis:** Hambatan utama yang perlu diketahui Project Owner.
- **Keputusan yang Dibutuhkan dari Pengguna:** Pertanyaan atau otorisasi yang memerlukan arahan pengguna.

---

### BAGIAN 2: INFORMASI TIM ANALISIS & KONTRIBUSI REVIEW
Mendokumentasikan keterlibatan seluruh peran analis yang ditugaskan, memastikan temuan mereka ditindaklanjuti dan bukan sekadar formalitas administratif.

**Tabel Wajib: Analisis & Review**
| Peran Analyst | Scope Analisis | Temuan Utama | Kontribusi terhadap Plan | Status Review | Temuan Terbuka |
|---|---|---|---|---|---|

**Aturan Pelaporan Bagian 2:**
1. Cantumkan seluruh analis yang relevan (`security-db-analyst`, `frontend-core-analyst`, `product-workspaces-analyst`, `integrations-qa-analyst`).
2. Tuliskan area file/modul yang benar-benar diperiksa oleh analis.
3. Cantumkan temuan penting beserta bukti empiris (path file, nomor baris, atau query).
4. Jelaskan bagaimana temuan tersebut mengubah atau memperkuat rencana kerja.
5. Catat status review: `Selesai`, `Sebagian`, `Terhambat`, atau `Tidak Ditugaskan`.
6. Jika rekomendasi analis ditolak oleh Head Agent, sertakan alasan teknis penolakannya secara objektif.

---

### BAGIAN 3: INFORMASI TIM EKSEKUTOR & REALISASI KERJA
Mendokumentasikan akuntabilitas eksekusi teknis sesuai batasan file masing-masing.

**Tabel Wajib: Kinerja Eksekutor**
| Peran Eksekutor | Scope yang Disetujui | Pekerjaan Aktual | Hasil | Status | Masalah Terbuka |
|---|---|---|---|---|---|

**Aturan Pelaporan Bagian 3:**
1. Cantumkan eksekutor yang relevan (`security-db-executor`, `backend-api-executor`, `frontend-store-executor`, `page-workspaces-executor`, `qa-automation-executor`).
2. Bedakan secara tegas antara scope yang direncanakan dan pekerjaan yang benar-benar dieksekusi.
3. Status eksekutor: `Selesai`, `Sebagian`, `Belum Dimulai`, `Terhambat`, atau `Tidak Ditugaskan pada Fase Ini`.
4. DILARANG menyatakan eksekusi selesai hanya karena kode telah ditulis tanpa pembuktian validasi.

---

### BAGIAN 4: INVENTARIS PERUBAHAN FILE (FILE CHANGE INVENTORY)
Bagian ini **WAJIB** ada pada setiap laporan fase implementasi. Setiap baris mewakili file fisik yang disentuh dalam fase pelaporan.

**Tabel Wajib: Inventaris Perubahan File**
| Path File | Jenis Perubahan | Pemilik Eksekusi | Tujuan Perubahan | Status Validasi | Referensi Bukti |
|---|---|---|---|---|---|

**Nilai Sah Kolom `Jenis Perubahan`:**
- `Dibuat` (file baru yang dibuat oleh eksekutor).
- `Diubah` (file eksisting yang diedit).
- `Dihapus` (file yang dihapus secara sengaja dan terencana).
- `Dipindahkan` (file yang direlokasi ke direktori lain).
- `Diganti Nama` (file yang diubah namanya).

**10 Aturan Mutlak Inventarisasi File:**
1. Catat seluruh file yang disentuh selama fase ini secara komprehensif.
2. DILARANG mengklaim modifikasi lama (sebelum fase dimulai) sebagai hasil kerja fase ini.
3. Repositori memiliki ~92 file termodifikasi lokal; bedakan secara tegas modifikasi fase ini dari status working tree awal.
4. Jika file sudah termodifikasi sebelum fase dimulai, jelaskan delta perubahan spesifik yang dibuat oleh fase ini.
5. Jika asal perubahan suatu baris kode tidak dapat dipastikan, tandai sebagai `Belum Terverifikasi`.
6. Untuk file `Dihapus`, sertakan path asal dan alasan teknis penghapusan.
7. Untuk file `Dipindahkan` / `Diganti Nama`, catat path asal dan path tujuan.
8. Jika satu file ditangani oleh lebih dari satu eksekutor pada waktu berbeda, catat urutan pengerjaan dan handoff-nya.
9. Jika pada fase tersebut sama sekali tidak ada file yang dimodifikasi (fase investigasi read-only), nyatakan secara eksplisit: `Nihil (Fase Read-Only)`.
10. DILARANG menyembunyikan perubahan file yang terjadi di luar rencana.

---

### BAGIAN 5: PERBANDINGAN RENCANA (PLAN) VS REALISASI AKTUAL
Membandingkan komitmen kerja dalam Implementation Plan yang disetujui pengguna dengan apa yang benar-benar terwujud di lapangan.

**Tabel Wajib: Plan vs Realisasi**
| ID Tugas | Pekerjaan dalam Plan | Pemilik | Realisasi Aktual | Status | Penyimpangan dan Alasan |
|---|---|---|---|---|---|

**Nilai Sah Kolom `Status`:**
- `Selesai` — Pekerjaan tuntas dan terbukti sesuai kriteria.
- `Sebagian` — Sebagian pekerjaan selesai, sebagian masih tertunda.
- `Belum Dimulai` — Pekerjaan belum disentuh sama sekali.
- `Terhambat` — Pekerjaan terhenti karena dependensi atau kendala teknis.
- `Dibatalkan dengan Persetujuan` — Dibatalkan setelah mendapatkan konfirmasi Project Owner.

---

### BAGIAN 6: HASIL VALIDASI, PENGUJIAN, & BUKTI EMPIRIS
Membuktikan secara objektif bahwa hasil kerja telah diuji dan berfungsi tanpa regresi.

**Tabel Wajib: Matriks Pengujian & Validasi**
| ID Validasi | Target | Prosedur atau Perintah | Hasil Aktual | Status | Bukti |
|---|---|---|---|---|---|

**Nilai Sah Kolom `Status`:**
- `Lulus` — Seluruh assertion pengujian terpenuhi 100%.
- `Gagal` — Pengujian menghasilkan kegagalan atau exception.
- `Sebagian` — Sebagian skenario lulus, sebagian gagal.
- `Belum Dijalankan` — Belum dieksekusi.
- `Terhambat` — Tidak dapat dijalankan karena runner error, dependensi rusak, dll.
- `Tidak Relevan` — Tidak berlaku untuk scope fase ini.

**Aturan Pelaporan Bagian 6:**
1. Bedakan jenis pengujian: Unit Test, Contract Test, Integration Test, Typecheck (`npx nuxi typecheck`), Linter, Build (`npm run build`), dan Manual Verification.
2. Cantumkan perintah eksekusi riil (misal: `node --test tests/unit/omni-search.spec.mjs`).
3. Cantumkan ringkasan output nyata (contoh: `10 passed, 0 failed, duration 195ms`).
4. DILARANG menganggap pengujian lulus hanya karena belum dijalankan atau tidak memunculkan error instan.
5. DILARANG menggunakan fake mock tiruan yang tidak menguji kode aktual.

---

### BAGIAN 7: LOG DISKUSI TEKNIS & KEPUTUSAN ARSITEKTUR KUNCI
Mencatat diskusi dan keputusan teknis yang berdampak pada arsitektur, keamanan, data model, kontrak integrasi, atau scope.

**Tabel Wajib: Decision Log**
| ID Keputusan | Topik | Pihak yang Terlibat | Bukti atau Argumen | Keputusan | Alasan | Status Persetujuan |
|---|---|---|---|---|---|---|

**Aturan Pelaporan Bagian 7:**
1. Hanya memuat keputusan penting yang berdampak sistemik (bukan hal sepele seperti penamaan variabel lokal).
2. Dokumentasikan perbedaan pendapat antar-agen secara objektif.
3. Catat status persetujuan: `Otonomi Head Agent` (dalam batas kewenangan) atau `Menunggu Persetujuan Pengguna` (jika melampaui scope/roadmap).

---

### BAGIAN 8: MASALAH, BLOKIR, & RISIKO TERBUKA (OPEN ISSUES)
Mencatat seluruh kendala aktif, temuan sampingan, dan risiko residual yang belum terselesaikan.

**Tabel Wajib: Masalah & Risiko**
| ID Masalah | Deskripsi | Bukti | Dampak | Prioritas | Penanggung Jawab | Status | Tindakan Berikutnya |
|---|---|---|---|---|---|---|---|

**Nilai Sah Kolom `Prioritas`:** `Kritis`, `Tinggi`, `Sedang`, `Rendah`.  
**Nilai Sah Kolom `Status`:**
- `Terbuka` — Masalah baru teridentifikasi.
- `Sedang Ditangani` — Sedang dalam perbaikan aktif.
- `Terhambat` — Terblokir oleh pihak/dependensi luar.
- `Menunggu Keputusan` — Butuh keputusan Project Owner.
- `Selesai dan Terverifikasi` — Sudah diperbaiki dan tervalidasi.
- `Diterima sebagai Risiko` — Disetujui Project Owner untuk tidak diperbaiki sekarang.
- `Dibatalkan dengan Alasan` — Bukan bug atau tidak valid setelah investigasi lanjut.

---

### BAGIAN 9: MATRIKS KRITERIA PENERIMAAN (ACCEPTANCE CRITERIA)
Mengukur ketercapaian target fase terhadap kriteria penerimaan yang telah disepakati di awal.

**Tabel Wajib: Kriteria Penerimaan**
| ID Kriteria | Kriteria Penerimaan | Status | Bukti | Kekurangan atau Catatan |
|---|---|---|---|---|

**Nilai Sah Kolom `Status`:**
- `Terpenuhi` — Target tercapai 100% dan terbukti via validasi.
- `Sebagian` — Target tercapai sebagian dengan catatan deviasi.
- `Tidak Terpenuhi` — Target gagal tercapai.
- `Belum Diverifikasi` — Implementasi ada tapi belum diuji.
- `Tidak Relevan dengan Persetujuan` — Scope ditiadakan atas izin Project Owner.

---

### BAGIAN 10: STATUS AKHIR FASE & TINDAK LANJUT
Bagian penutup yang memberikan kesimpulan formal atas status fase dan batas kewenangan selanjutnya.

**Elemen Wajib:**
1. **Status Akhir Fase:** Menyatakan status formal fase (misal: `IMPLEMENTED_PENDING_VALIDATION` atau `VALIDATED`).
2. **Rekapitulasi Pekerjaan:** Daftar apa yang tuntas dan apa yang tertunda.
3. **Risiko Residual:** Risiko yang masih membayangi sistem.
4. **Kesiapan Penerimaan:** Apakah fase siap diajukan untuk disetujui pengguna (`ACCEPTED`).
5. **Keputusan yang Dibutuhkan:** Keputusan atau konfirmasi yang diminta dari Project Owner.
6. **Rekomendasi Langkah Berikutnya:** Usulan tindakan logis berikutnya.
7. **Pernyataan Izin Fase Berikutnya:** WAJIB menyatakan secara tegas bahwa **fase berikutnya BELUM dimulai dan menunggu izin tertulis eksplisit dari Project Owner**.

---

## 3. TAKSONOMI STATUS & HIRARKI BUKTI EMPIRIS

### 3.1. Sepuluh Status Standar Pekerjaan (Lifecycle State Matrix)
Untuk menghindari ambiguitas pelaporan, Head Agent wajib mengklasifikasikan status fase, fitur, atau tugas ke dalam 10 status baku berikut:

1. `UNANALYZED` — Terdaftar di backlog/rencana, tetapi belum diinvestigasi.
2. `ANALYZING` — Sedang dalam proses investigasi aktif oleh tim analis.
3. `ANALYZED` — Investigasi selesai; temuan, bukti, dan akar masalah terdokumentasi.
4. `PLAN_IN_REVIEW` — Dokumen rencana implementasi sedang ditinjau silang (*cross-review*) oleh tim analis.
5. `WAITING_USER_APPROVAL` — Rencana final diajukan kepada Project Owner dan menunggu persetujuan eksplisit.
6. `APPROVED_FOR_IMPL` — Rencana telah disetujui secara tertulis oleh Project Owner; izin implementasi terbit.
7. `IMPLEMENTING` — Eksekutor yang ditunjuk sedang melakukan modifikasi kode sesuai batasan file.
8. `IMPLEMENTED_PENDING_VALIDATION` — Kode selesai ditulis, tetapi belum divalidasi oleh test suite atau QA.
9. `VALIDATED` — Pengujian unit/integrasi/kontrak telah dijalankan dan lulus 100% tanpa regresi.
10. `ACCEPTED` — Head Agent dan Project Owner telah menerima dan menutup fase pekerjaan secara resmi.

### 3.2. Lima Larangan Salah Kaprah Status (The 5 False Equivalences)
Head Agent DILARANG menyamakan:
1. **Kode Telah Ditulis $\neq$ Implementasi Tervalidasi:** Menulis fungsi bukan berarti fungsi tersebut bekerja tanpa bug.
2. **Pengujian Lokal Lulus $\neq$ Integrasi Sistem Selesai:** Lulus 1 test unit lokal tidak menjamin integrasi antarkomponen bebas regresi.
3. **Analisis Selesai $\neq$ Rencana Disetujui:** Menyelesaikan investigasi bukan izin untuk menyusun kode.
4. **Rencana Disetujui $\neq$ Izin Implementasi Seluruh Fase:** Persetujuan pada Blok A tidak otomatis mengizinkan eksekusi Blok B.
5. **Laporan Diserahkan $\neq$ Fase Diterima Pengguna:** Penyerahan laporan hanyalah permohonan review; penerimaan mutlak berada di tangan Project Owner.

### 3.3. Hirarki Keabsahan Bukti Empiris
Dalam pelaporan, klaim keberhasilan wajib didukung bukti dengan hirarki kekuatan berikut:
- **Tingkat 1 (Tertinggi - Bukti Riil):** Log eksekusi terminal, output automated test runner, diff baris kode terverifikasi, status exit code perintah.
- **Tingkat 2 (Bukti Statis):** Referensi path file konkret, nomor baris kode aktual, AST graph relation, snapshot schema SQL.
- **Tingkat 3 (Bukti Inferensial):** Analisis keterkaitan kode, telaah dependensi antarmodul, hasil walk-through logika.
- **Tingkat 4 (Terendah / Tidak Sah sebagai Bukti):** Asumsi, ingatan sesi sebelumnya, rasa optimisme, atau ketiadaan pesan error sesaat.

---

## 4. PENYESUAIAN FORMAT BERDASARKAN JENIS FASE

Meskipun struktur 10 bagian bersifat wajib, penekanan detail disesuaikan dengan jenis fase:

### 4.1. Laporan Fase Investigasi & Audit (Read-Only)
- **Fokus Utama:** Bagian 1 (Ringkasan), Bagian 2 (Tim Analisis & Bukti Masalah), Bagian 7 (Temuan Arsitektur), dan Bagian 8 (Daftar Celah/Bug).
- **Penyesuaian:**
  - Bagian 3 (Eksekutor): Dinyatakan `Nihil (Fase Investigasi Read-Only)`.
  - Bagian 4 (Inventaris File): Wajib mencantumkan konfirmasi bahwa tidak ada file yang dimodifikasi (`Working tree utuh`).
  - Bagian 5 (Plan vs Realisasi): Menilai realisasi investigasi terhadap scope audit awal.

### 4.2. Laporan Fase Perencanaan (Planning & Architecture)
- **Fokus Utama:** Bagian 1, Bagian 2 (Hasil Review Silang Analis atas Draft Plan), Bagian 7 (Keputusan Kontrak Integrasi & Boundaries), Bagian 9 (Kriteria Penerimaan yang Ditargetkan), dan Bagian 10 (Pengajuan Approval).
- **Penyesuaian:** Bagian 3, 4, dan 6 ditandai sebagai `Belum Berlaku (Tahap Perencanaan)`.

### 4.3. Laporan Fase Implementasi Kode
- **Fokus Utama:** Bagian 3 (Kinerja Eksekutor), Bagian 4 (Inventaris Perubahan File Lengkap), Bagian 5 (Deviasi Plan vs Realisasi), dan Bagian 6 (Hasil Validasi Unit/Lint).
- **Penyesuaian:** Seluruh tabel wajib diisi secara detail dan terperinci.

### 4.4. Laporan Fase Integrasi & Validasi Akhir (QA Gate)
- **Fokus Utama:** Bagian 6 (Matriks Pengujian End-to-End & Regresi), Bagian 8 (Risiko Residual), Bagian 9 (Keterpenuhan Kriteria Penerimaan), dan Bagian 10 (Rekomendasi Penerimaan Pengguna).

---

## 5. KEWAJIBAN KEJUJURAN & 10 LARANGAN INTEGRITAS PELAPORAN

Head Agent terikat secara mutlak pada 10 prinsip integritas pelaporan berikut:
1. **Wajib Melaporkan Kondisi Aktual:** Laporkan fakta apa adanya di lapangan, termasuk kemunduran atau kegagalan teknis.
2. **Dilarang Menyembunyikan Kegagalan:** Setiap test yang gagal, bug baru yang ditemukan, atau performa yang menurun wajib dicatat terbuka di Bagian 6 dan 8.
3. **Wajib Mengakui Ketidakpastian:** Jika suatu aspek belum sempat diverifikasi karena keterbatasan waktu/tooling, nyatakan secara eksplisit sebagai `Belum Diverifikasi`.
4. **Pemisahan Tegas Fakta vs Opini:** Fakta kode harus dibedakan secara tegas dari hipotesis atau interpretasi pribadi.
5. **Klaim Wajib Disertai Bukti:** Pernyataan "fitur bekerja normal" tanpa melampirkan prosedur pengujian dan buktinya dianggap sebagai laporan tidak valid.
6. **Dilarang Mengarang Aktivitas:** Dilarang mencantumkan nama agen, peran fiktif, atau aktivitas analisis/review yang tidak pernah benar-benar terjadi.
7. **Dilarang Menghilangkan Pekerjaan yang Tertunda:** Seluruh item rencana yang belum selesai wajib tetap ditampilkan dengan status `Belum Dimulai` atau `Sebagian`.
8. **Dilarang Menjadikan Kuantitas File sebagai Indikator Sukses:** Jumlah file yang termodifikasi bukan bukti keberhasilan; yang diukur adalah fungsionalitas dan ketiadaan regresi.
9. **Dilarang Menyatakan Diterima Secara Sepihak:** Status `ACCEPTED` hanya sah jika Project Owner telah memberikan konfirmasi penerimaan tertulis.
10. **Dilarang Memulai Fase Lanjutan Tanpa Izin:** Laporan tidak boleh berasumsi bahwa fase berikutnya sudah diizinkan sebelum pengguna membalas laporan tersebut.

---

## 6. TEMPLATE LAPORAN FASE SIAP PAKAI (READY-TO-USE TEMPLATE)

Di bawah ini adalah template Markdown standar yang wajib disalin dan diisi oleh Head Agent untuk setiap penyampaian laporan fase:

````markdown
# LAPORAN FASE [Nomor & Nama Fase]: [Judul Laporan]

> **Fase:** [Contoh: Fase 2 — OmniSearch Engine Alignment]  
> **Status Fase:** [Pilih salah satu dari 10 Status Standar]  
> **Tanggal Pelaporan:** [YYYY-MM-DD]  
> **Penyusun:** Head Agent (Lead Technical Orchestrator)

---

### BAGIAN 1: RINGKASAN EKSEKUTIF
- **Nama & Nomor Fase:** [Identifier fase]
- **Tujuan Fase:** [Tujuan utama pelaksanaan fase]
- **Scope yang Disetujui:** [Ringkasan batasan pekerjaan yang disetujui]
- **Hasil Utama:** [Capaian terpenting yang diselesaikan]
- **Status Fase Saat Ini:** [Status saat ini]
- **Keterpenuhan Kriteria Penerimaan:** [Terpenuhi / Sebagian / Tidak Terpenuhi]
- **Risiko / Masalah Kritis:** [Risiko utama atau hambatan aktif]
- **Keputusan yang Dibutuhkan dari Pengguna:** [Keputusan penting yang memerlukan konfirmasi Project Owner]

---

### BAGIAN 2: INFORMASI TIM ANALISIS & KONTRIBUSI REVIEW
| Peran Analyst | Scope Analisis | Temuan Utama | Kontribusi terhadap Plan | Status Review | Temuan Terbuka |
|---|---|---|---|---|---|
| [Nama Peran Analis] | [Path / domain yang dianalisis] | [Temuan kunci + ref bukti] | [Dampak terhadap keputusan rencana] | [Selesai / Sebagian / Terhambat] | [Isu yang belum tuntas jika ada] |

---

### BAGIAN 3: INFORMASI TIM EKSEKUTOR & REALISASI KERJA
| Peran Eksekutor | Scope yang Disetujui | Pekerjaan Aktual | Hasil | Status | Masalah Terbuka |
|---|---|---|---|---|---|
| [Nama Peran Eksekutor] | [Scope yang dialokasikan] | [Pekerjaan riil yang dieksekusi] | [Hasil konkret kode/konfigurasi] | [Selesai / Sebagian / Belum Dimulai] | [Kendala yang dihadapi jika ada] |

---

### BAGIAN 4: INVENTARIS PERUBAHAN FILE
| Path File | Jenis Perubahan | Pemilik Eksekusi | Tujuan Perubahan | Status Validasi | Referensi Bukti |
|---|---|---|---|---|---|
| [Path file lengkap] | [Dibuat / Diubah / Dihapus / Dipindahkan / Diganti Nama] | [Peran Eksekutor] | [Tujuan modifikasi kode] | [Tervalidasi / Pending / Belum Diuji] | [Ref test / diff / line number] |

*(Jika fase investigasi read-only, nyatakan: "Nihil — Fase bersifat Read-Only, working tree terlindungi 100%").*

---

### BAGIAN 5: PERBANDINGAN RENCANA (PLAN) VS REALISASI AKTUAL
| ID Tugas | Pekerjaan dalam Plan | Pemilik | Realisasi Aktual | Status | Penyimpangan dan Alasan |
|---|---|---|---|---|---|
| [TASK-01] | [Deskripsi tugas di plan] | [Peran penanggung jawab] | [Apa yang benar-benar tercapai] | [Selesai / Sebagian / Terhambat / Dibatalkan] | [Alasan deviasi jika ada] |

---

### BAGIAN 6: HASIL VALIDASI, PENGUJIAN, & BUKTI EMPIRIS
| ID Validasi | Target | Prosedur atau Perintah | Hasil Aktual | Status | Bukti |
|---|---|---|---|---|---|
| [VAL-01] | [Unit/API/UI/Typecheck] | [Perintah terminal atau skenario tes] | [Contoh: 10 passed, 0 failed] | [Lulus / Gagal / Terhambat] | [Log output / exit code] |

---

### BAGIAN 7: LOG DISKUSI TEKNIS & KEPUTUSAN ARSITEKTUR KUNCI
| ID Keputusan | Topik | Pihak yang Terlibat | Bukti atau Argumen | Keputusan | Alasan | Status Persetujuan |
|---|---|---|---|---|---|---|
| [DEC-01] | [Topik arsitektur/kontrak] | [Agen yang berdiskusi] | [Bukti teknis pendukung] | [Keputusan yang diambil] | [Rasionalisasi teknis] | [Otonomi Head Agent / Butuh Approval Pengguna] |

---

### BAGIAN 8: MASALAH, BLOKIR, & RISIKO TERBUKA (OPEN ISSUES)
| ID Masalah | Deskripsi | Bukti | Dampak | Prioritas | Penanggung Jawab | Status | Tindakan Berikutnya |
|---|---|---|---|---|---|---|---|
| [ISSUE-01] | [Deskripsi masalah] | [File / baris / log] | [Dampak teknis/produk] | [Kritis / Tinggi / Sedang / Rendah] | [Peran penanggung jawab] | [Terbuka / Ditangani / Menunggu Keputusan] | [Langkah perbaikan terencana] |

---

### BAGIAN 9: MATRIKS KRITERIA PENERIMAAN (ACCEPTANCE CRITERIA)
| ID Kriteria | Kriteria Penerimaan | Status | Bukti | Kekurangan atau Catatan |
|---|---|---|---|---|
| [AC-01] | [Spesifikasi kriteria] | [Terpenuhi / Sebagian / Tidak Terpenuhi] | [Bukti verifikasi konkret] | [Catatan pengecualian jika ada] |

---

### BAGIAN 10: STATUS AKHIR FASE & TINDAK LANJUT
- **Status Akhir Fase Saat Ini:** `[Pilih salah satu dari 10 Status Standar]`
- **Pekerjaan yang Berhasil Diselesaikan:** [Daftar ringkas capaian]
- **Pekerjaan yang Tertunda / Belum Diselesaikan:** [Daftar ringkas item tertunda]
- **Risiko Residual yang Masih Ada:** [Daftar risiko yang tetap harus dipantau]
- **Kesiapan Fase untuk Diajukan:** [Siap Diajukan untuk Persetujuan Pengguna / Belum Siap]
- **Keputusan yang Dibutuhkan dari Pengguna:** [Poin keputusan spesifik yang dimintakan arahan]
- **Rekomendasi Langkah Berikutnya:** [Usulan tindakan teknis berikutnya]
- **Pernyataan Izin Fase Berikutnya:** Pekerjaan untuk fase berikutnya **BELUM dimulai dan TIDAK AKAN dieksekusi** sebelum adanya instruksi dan persetujuan tertulis eksplisit dari Project Owner.
````
