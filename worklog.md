---
Task ID: 1
Agent: main (Z.ai Code)
Task: Build "TaxJournal Automator" SPA — a single-page Indonesian withholding-tax (PPh) calculator with automatic balanced accounting journal generation, using Next.js 16, Tailwind CSS 4, and shadcn/ui (white / slate / primary-blue palette).

Work Log:
- Explored existing project scaffold: Next.js 16 + Tailwind 4 + full shadcn/ui component set already installed; confirmed `card, input, select, button, table, radio-group, textarea, label, badge, separator, tooltip` are available.
- Updated `src/app/globals.css`:
  - Reworked `:root` palette to a professional white / slate / primary-blue scheme (primary = blue `oklch(0.546 0.215 262.88)`), updated `--ring`, `--accent`, `--chart-1`, sidebar vars to match.
  - Reworked `.dark` palette to a slate-tinted dark blue.
  - Added `.scroll-finance` custom scrollbar styling (for the journal table) and `.tnum` tabular-nums utility (for aligned financial figures).
- Created `src/lib/tax.ts` — pure calculation engine:
  - `CATEGORIES` array with all 4 categories (A: Sewa Bangunan → PPh 4(2) 10%; B: Jasa Konsultan → PPh 21, DPP 50%, 5%; C: Honor Pengajar → PPh 21, DPP 100%, 5%; D: Jasa Teknik/Manajemen → PPh 23, 2%), each with expense/tax account names + legal-basis note.
  - `calculateTax()` computes DPP, effective rate (with ×1.2 NPWP multiplier when recipient has no NPWP, per PMK-252/PMK.03/2008), tax, net paid, and builds the 3-line journal (Debit Beban / Kredit Utang PPh / Kredit Kas-Bank).
  - `formatRupiah()` (id-ID locale, "Rp 50.000.000"), `formatRate()`, and `journalToClipboardText()` producing tab-separated plain text (header + rows + TOTAL) for clean Excel paste.
  - Floating-point safety via `round2()`; balance assertion via `balanced` flag (|Debit−Kredit| < 0.005).
- Built `src/app/page.tsx` — full client SPA:
  - Sticky header with brand icon, title "TaxJournal Automator", description, and a "MVP · UU HPP 2022" badge.
  - Hero intro card.
  - Responsive 5-col grid (form lg:col-span-2 / results lg:col-span-3); stacks to single column on mobile.
  - Form (Card): Deskripsi (Textarea), Nominal Bruto (Input with "Rp" prefix + live id-ID thousand-separator formatting while storing raw digits), Kategori (Select with per-category icons + tax-type badges + contextual legal-basis hint), Tanggal (date input defaulting to today in Asia/Jakarta), NPWP (RadioGroup as two styled cards — "Ya" primary-tinted, "Tidak" amber-tinted with +20% warning callout).
  - Form validation with inline error messages + destructive toast on invalid submit.
  - Results: empty-state card (dashed border, category legend badges) → on submit renders 3 summary cards (DPP / Pajak Dipotong / Neto, each color-accented with formula hint), the Journal table (sticky header/footer, color-coded D/K row tints, scroll-finance max-h-96, balanced-badge with tooltip showing totals), Copy-to-Clipboard button (clipboard icon → "Tersalin!" with toast), and a Rincian Perhitungan (formula breakdown) card.
  - Sticky footer with disclaimer.
- Updated `src/app/layout.tsx` metadata (title, description, keywords, OG/Twitter) to reflect the TaxJournal Automator product.
- Ran `bun run lint` → clean, 0 errors.
- Verified dev server compiles (`dev.log` shows `✓ Compiled` with no warnings/errors).

Verification (agent-browser end-to-end):
- Opened http://localhost:3000/ → page renders, no console/runtime errors.
- Filled form (Deskripsi + Bruto 50.000.000 + Kategori A Sewa Bangunan) → submitted → DPP Rp 50.000.000, Pajak Rp 5.000.000, Neto Rp 45.000.000; journal Debit Beban Sewa 50M / Kredit Utang PPh 4(2) 5M / Kredit Kas 45M; Total Debit = Total Kredit = 50M; "Seimbang" badge ✓.
- Switched to Kategori B (Jasa Konsultan) + NPWP "Tidak" → DPP Rp 25.000.000 (50% × Bruto), rate "5% × 1.2 = 6%", Pajak Rp 1.500.000, Neto Rp 48.500.000; balanced ✓.
- Verified clipboard text format via `bun -e` run of `journalToClipboardText()`: metadata header + tab-separated `Tanggal\tNama Akun\tDebit\tKredit` rows + TOTAL row — pastes cleanly into Excel.
- Copy button: clicked → toast "Disalin ke clipboard", button label → "Tersalin!" ✓.
- Mobile viewport 390×844: all form elements present, layout stacks, journal table scrolls within `scroll-finance` container ✓.
- Sticky footer: at 1440×1200 (content shorter than viewport) `footer_bottom=1200=viewport` → sticks to bottom ✓; at 1440×900 (content taller) `footer_at_doc_bottom=true` → pushed down naturally with no gap ✓.
- Final desktop run (Bruto 75.000.000, Kategori A): DPP Rp 75.000.000, Pajak Rp 7.500.000, Neto Rp 67.500.000, "Selisih Rp 0 — jurnal siap diposting" ✓.

Stage Summary:
- Deliverables: `src/lib/tax.ts` (calc engine), `src/app/page.tsx` (SPA), `src/app/globals.css` (blue theme + utilities), `src/app/layout.tsx` (metadata).
- All behavioral rules satisfied: empty state on load (no mock data), id-ID Rupiah formatting, Debit/Kredit always balanced, responsive mobile-friendly, copy-to-clipboard produces tab-separated Excel-ready text.
- Production-ready and browser-verified. No outstanding bugs.
- Suggested next-phase enhancements (for the recurring review agent): (1) persist transaction history to SQLite via Prisma + a history panel; (2) export journal as CSV/PDF; (3) add progressive PPh 21 tariff (Pasal 17) for Category B/C; (4) dark-mode toggle wired to next-themes; (5) multi-line journal for split payments.
