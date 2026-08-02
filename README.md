# TaxJournal Automator

Aplikasi web *client-side* untuk mengotomatiskan perhitungan Pajak Penghasilan (PPh) pemotongan/pemungutan sekaligus menghasilkan draf jurnal akuntansi dari sebuah narasi transaksi komersial.

Aplikasi ini dirancang sebagai *Minimum Viable Product* (MVP) untuk menguji efisiensi ekstraksi data transaksi ke dalam format penjurnalan otomatis, khususnya untuk studi kasus perpajakan dan akuntansi.

## ⚙️ Tech Stack
*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS
*   **UI Components:** shadcn/ui
*   **Deployment:** (Kosongkan dulu, nanti diisi jika sudah di-hosting)

## ⚖️ Spesifikasi & Asumsi Logika Pajak (MVP V1.0)
Aplikasi ini menggunakan *rule-based logic* yang memisahkan skenario perpajakan berdasarkan tiga kategori transaksi utama:

**1. Sewa Bangunan (PPh Pasal 4 ayat 2)**
*   Sifat: Final (Berbasis Objek).
*   DPP: 100% dari Nominal Bruto.
*   Tarif: 10%.
*   Kondisi NPWP: Status kepemilikan NPWP penerima penghasilan **tidak memengaruhi** tarif pajak.

**2. Tenaga Ahli / Honor Pemateri (PPh Pasal 21 Bukan Pegawai)**
*   Sifat: Tidak Final.
*   DPP: 50% dari Nominal Bruto.
*   Tarif (Simplifikasi MVP): Menggunakan tarif lapis pertama Pasal 17 UU HPP, yaitu **5%** untuk yang memiliki NPWP, dan **6%** (kenaikan 20%) untuk yang tidak memiliki NPWP.
*   *Disclaimer:* Ini adalah penyederhanaan untuk skenario transaksi tunggal yang tidak memperhitungkan kumulatif penghasilan berkesinambungan (PTKP).

**3. Jasa Teknik / Manajemen (PPh Pasal 23)**
*   Sifat: Tidak Final.
*   DPP: 100% dari Nominal Bruto.
*   Tarif: **2%** untuk yang memiliki NPWP, dan **4%** (kenaikan 100%) untuk yang tidak memiliki NPWP.

## 📊 Struktur Jurnal Akuntansi
Aplikasi memposisikan entitas sebagai **Pihak Pemotong/Pembayar**. Struktur jurnal seimbang (*balance*) yang dihasilkan adalah:

| Nama Akun | Posisi | Nilai |
| :--- | :--- | :--- |
| Beban (Sesuai Kategori) | Debit | Nominal Bruto |
| Utang PPh (Sesuai Kategori) | Kredit | Pajak Dipotong |
| Kas / Bank | Kredit | Neto Dibayarkan |

## 🚀 Cara Menjalankan Secara Lokal
1. Pastikan Anda memiliki Node.js terinstal.
2. Clone repositori ini.
3. Jalankan `npm install` untuk mengunduh dependensi.
4. Jalankan `npm run dev` untuk memulai *development server*.
