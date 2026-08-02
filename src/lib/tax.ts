/**
 * TaxJournal Automator — Indonesian PPh calculation engine
 * ------------------------------------------------------------------
 * Implements withholding-tax (PPh) logic for four common transaction
 * categories plus the matching double-entry accounting journal.
 *
 * Note on NPWP: Under PMK-252/PMK.03/2008 (jo. PP 36/2023), when the
 * income recipient does not possess an NPWP, the withholding tariff
 * is applied 20% higher (multiplier 1.2x) for PPh 21 / 23 / 26.
 * For PPh Pasal 4 ayat (2) Final the rate is legally fixed, however
 * the higher-tariff rule is surfaced here for consistency with the
 * product spec; the effective multiplier is shown transparently.
 */

export type CategoryId = "A" | "B" | "C" | "D";

export type NpwpStatus = "yes" | "no";

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  description: string;
  taxType: string;
  taxTypeShort: string;
  /** Base withholding rate applied on the DPP. */
  baseRate: number;
  /** DPP as a fraction of Bruto (e.g. 0.5 = 50%). */
  dppRate: number;
  /** Expense (debit) account name. */
  expenseAccount: string;
  /** Withholding-tax payable (credit) account name. */
  taxAccount: string;
  /** Short legal basis note. */
  legalBasis: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "A",
    label: "Sewa Bangunan",
    description: "Sewa ruangan, gedung, atau bangunan lainnya",
    taxType: "PPh Pasal 4 ayat (2) Final",
    taxTypeShort: "PPh 4(2)",
    baseRate: 0.1,
    dppRate: 1,
    expenseAccount: "Beban Sewa Bangunan",
    taxAccount: "Utang PPh 4(2) Final",
    legalBasis: "PP 36/2023 — sewa bangunan dikenakan PPh final 10% dari bruto.",
  },
  {
    id: "B",
    label: "Jasa Konsultan / Tenaga Ahli",
    description: "Jasa konsultan, akuntan, notaris, pengacara, arsitek",
    taxType: "PPh Pasal 21",
    taxTypeShort: "PPh 21",
    baseRate: 0.05,
    dppRate: 0.5,
    expenseAccount: "Beban Jasa Konsultan / Tenaga Ahli",
    taxAccount: "Utang PPh 21",
    legalBasis: "DPP = 50% × Bruto, tarif PPh 21 tenaga ahli 5% (MVP).",
  },
  {
    id: "C",
    label: "Honor Pengajar / Pemateri Seminar",
    description: "Honorarium dosen, guru, pemateri, narasumber",
    taxType: "PPh Pasal 21 (Non-Karyawan)",
    taxTypeShort: "PPh 21",
    baseRate: 0.05,
    dppRate: 1,
    expenseAccount: "Beban Honorarium Pengajar",
    taxAccount: "Utang PPh 21",
    legalBasis: "DPP = 100% × Bruto, tarif standar PPh 21 non-karyawan 5% (MVP).",
  },
  {
    id: "D",
    label: "Jasa Teknik / Manajemen",
    description: "Jasa teknik, manajemen, konstruksi, penelitian",
    taxType: "PPh Pasal 23",
    taxTypeShort: "PPh 23",
    baseRate: 0.02,
    dppRate: 1,
    expenseAccount: "Beban Jasa Teknik & Manajemen",
    taxAccount: "Utang PPh 23",
    legalBasis: "Tarif PPh 23 atas jasa teknik/manajemen sebesar 2% dari bruto.",
  },
];

export const NPWP_HIGHER_TARIFF_MULTIPLIER = 1.2; // +20% when no NPWP

export interface JournalEntry {
  tanggal: string;
  namaAkun: string;
  debit: number;
  kredit: number;
}

export interface TaxResult {
  bruto: number;
  dpp: number;
  baseRate: number;
  effectiveRate: number;
  npwpMultiplier: number;
  tax: number;
  netPaid: number;
  category: CategoryInfo;
  hasNpwp: boolean;
  description: string;
  date: string;
  journal: JournalEntry[];
  totalDebit: number;
  totalKredit: number;
  balanced: boolean;
}

export function getCategory(id: CategoryId): CategoryInfo {
  const cat = CATEGORIES.find((c) => c.id === id);
  if (!cat) throw new Error(`Unknown category: ${id}`);
  return cat;
}

/**
 * Core calculation. Pure function — easy to unit-test and reason about.
 */
export function calculateTax(
  bruto: number,
  categoryId: CategoryId,
  hasNpwp: boolean,
  description: string,
  date: string
): TaxResult {
  const category = getCategory(categoryId);
  const npwpMultiplier = hasNpwp ? 1 : NPWP_HIGHER_TARIFF_MULTIPLIER;
  const effectiveRate = category.baseRate * npwpMultiplier;

  const dpp = round2(bruto * category.dppRate);
  const tax = round2(dpp * effectiveRate);
  const netPaid = round2(bruto - tax);

  const journal: JournalEntry[] = [
    {
      tanggal: date,
      namaAkun: category.expenseAccount,
      debit: bruto,
      kredit: 0,
    },
    {
      tanggal: date,
      namaAkun: category.taxAccount,
      debit: 0,
      kredit: tax,
    },
    {
      tanggal: date,
      namaAkun: "Kas/Bank",
      debit: 0,
      kredit: netPaid,
    },
  ];

  const totalDebit = round2(journal.reduce((s, e) => s + e.debit, 0));
  const totalKredit = round2(journal.reduce((s, e) => s + e.kredit, 0));

  return {
    bruto: round2(bruto),
    dpp,
    baseRate: category.baseRate,
    effectiveRate,
    npwpMultiplier,
    tax,
    netPaid,
    category,
    hasNpwp,
    description,
    date,
    journal,
    totalDebit,
    totalKredit,
    balanced: Math.abs(totalDebit - totalKredit) < 0.005,
  };
}

/** Round to 2 decimals to avoid floating point drift in currency. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Format a number as Indonesian Rupiah, e.g. 50000000 -> "Rp 50.000.000". */
export function formatRupiah(amount: number, withSymbol = true): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return withSymbol ? `Rp ${formatted}` : formatted;
}

/** Format a rate as a percentage string, e.g. 0.05 -> "5%". */
export function formatRate(rate: number): string {
  const pct = rate * 100;
  // Trim trailing .0 for clean integers
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(2)}%`;
}

/**
 * Build a tab-separated plain-text version of the journal so it pastes
 * cleanly into Excel / Google Sheets (one row per line, columns by tab).
 */
export function journalToClipboardText(result: TaxResult): string {
  const header = [
    "Tanggal",
    "Nama Akun",
    "Debit",
    "Kredit",
  ].join("\t");

  const rows = result.journal.map((e) =>
    [
      e.tanggal,
      e.namaAkun,
      e.debit ? formatRupiah(e.debit, false) : "",
      e.kredit ? formatRupiah(e.kredit, false) : "",
    ].join("\t")
  );

  const total = [
    "",
    "TOTAL",
    formatRupiah(result.totalDebit, false),
    formatRupiah(result.totalKredit, false),
  ].join("\t");

  const meta = [
    `Deskripsi: ${result.description}`,
    `Kategori: ${result.category.label} (${result.category.taxType})`,
    `Bruto: ${formatRupiah(result.bruto)}`,
    `DPP: ${formatRupiah(result.dpp)}`,
    `Tarif: ${formatRate(result.baseRate)}${result.npwpMultiplier !== 1 ? ` (×${result.npwpMultiplier} tanpa NPWP = ${formatRate(result.effectiveRate)})` : ""}`,
    `Pajak Dipotong: ${formatRupiah(result.tax)}`,
    `Neto Dibayarkan: ${formatRupiah(result.netPaid)}`,
  ].join("\n");

  return [meta, "", header, ...rows, total].join("\n");
}
