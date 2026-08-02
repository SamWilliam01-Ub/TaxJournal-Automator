"use client";

import * as React from "react";
import {
  Calculator,
  ClipboardCopy,
  ClipboardCheck,
  ReceiptText,
  Wallet,
  Landmark,
  Scale,
  Info,
  Building2,
  Briefcase,
  GraduationCap,
  Cog,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  CalendarDays,
  Hash,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

import {
  CATEGORIES,
  calculateTax,
  formatRate,
  formatRupiah,
  journalToClipboardText,
  type CategoryId,
  type NpwpStatus,
  type TaxResult,
} from "@/lib/tax";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<CategoryId, React.ElementType> = {
  A: Building2,
  B: Briefcase,
  C: GraduationCap,
  D: Cog,
};

function todayISO(): string {
  // Local date in Asia/Jakarta — kept simple, avoids TZ drift in input[type=date]
  const now = new Date();
  const tz = "Asia/Jakarta";
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(now); // YYYY-MM-DD
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function TaxJournalAutomatorPage() {
  const { toast } = useToast();

  const [description, setDescription] = React.useState("");
  const [bruto, setBruto] = React.useState<string>("");
  const [categoryId, setCategoryId] = React.useState<CategoryId | "">("");
  const [npwp, setNpwp] = React.useState<NpwpStatus>("yes");
  const [date, setDate] = React.useState<string>(todayISO());

  const [result, setResult] = React.useState<TaxResult | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [copied, setCopied] = React.useState(false);

  // Live preview of the effective rate for the currently selected category.
  const selectedCategory = React.useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId) ?? null,
    [categoryId]
  );

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = "Deskripsi transaksi wajib diisi.";
    const brutoNum = Number(bruto.replace(/[^\d]/g, ""));
    if (!bruto.trim()) next.bruto = "Nominal bruto wajib diisi.";
    else if (Number.isNaN(brutoNum) || brutoNum <= 0)
      next.bruto = "Nominal bruto harus berupa angka positif.";
    if (!categoryId) next.category = "Pilih kategori transaksi terlebih dahulu.";
    if (!date) next.date = "Tanggal transaksi wajib diisi.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast({
        title: "Form belum lengkap",
        description: "Mohon periksa kembali isian yang ditandai.",
        variant: "destructive",
      });
      return;
    }
    const brutoNum = Number(bruto.replace(/[^\d]/g, ""));
    const res = calculateTax(
      brutoNum,
      categoryId as CategoryId,
      npwp === "yes",
      description.trim(),
      date
    );
    setResult(res);
    setCopied(false);
    toast({
      title: "Perhitungan selesai",
      description: `Jurnal ${res.category.taxTypeShort} berhasil dibuat.`,
    });

    // Smooth scroll to results on mobile
    setTimeout(() => {
      document
        .getElementById("hasil")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function handleReset() {
    setDescription("");
    setBruto("");
    setCategoryId("");
    setNpwp("yes");
    setDate(todayISO());
    setResult(null);
    setErrors({});
    setCopied(false);
  }

  async function handleCopy() {
    if (!result) return;
    const text = journalToClipboardText(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Disalin ke clipboard",
        description: "Tempelkan (Ctrl+V) langsung ke Excel / Google Sheets.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without async clipboard
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        toast({ title: "Disalin ke clipboard", description: "Jurnal siap ditempel ke Excel." });
        setTimeout(() => setCopied(false), 2500);
      } catch {
        toast({
          title: "Gagal menyalin",
          description: "Salin manual dari tabel di bawah.",
          variant: "destructive",
        });
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  // Format the bruto input live for display, keep raw digits in state.
  const brutoDisplay = React.useMemo(() => {
    const digits = bruto.replace(/[^\d]/g, "");
    if (!digits) return "";
    return new Intl.NumberFormat("id-ID").format(Number(digits));
  }, [bruto]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      {/* ───────────────────────── Header ───────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-md dark:border-slate-800/70 dark:bg-slate-950/85">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg dark:text-slate-50">
              TaxJournal{" "}
              <span className="text-primary">Automator</span>
            </h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
              Otomasi perhitungan PPh &amp; jurnal akuntansi pemotong pajak
              (Indonesia)
            </p>
          </div>
          <Badge
            variant="outline"
            className="hidden items-center gap-1 border-primary/30 bg-primary/5 text-primary sm:flex"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            MVP · UU HPP 2022
          </Badge>
        </div>
      </header>

      {/* ───────────────────────── Main ───────────────────────── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero / intro */}
        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-50">
                  Hitung PPh &amp; Buat Jurnal dalam Hitungan Detik
                </h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  Masukkan deskripsi transaksi, nominal bruto, dan kategori.
                  Sistem akan menghitung Dasar Pengenaan Pajak (DPP), pajak
                  yang dipotong, neto yang dibayarkan, serta merangkai jurnal
                  akuntansi Debit–Kredit yang seimbang secara otomatis.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-7">
          {/* ───────────── Form ───────────── */}
          <section className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
                <CardTitle className="flex items-center gap-2 text-base text-slate-900 dark:text-slate-50">
                  <Hash className="h-4 w-4 text-primary" />
                  Data Transaksi
                </CardTitle>
                <CardDescription className="text-xs">
                  Lengkapi formulir di bawah, lalu tekan tombol Hitung.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit} noValidate>
                <CardContent className="space-y-5 p-5 sm:p-6">
                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Deskripsi Transaksi
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Contoh: Pembayaran sewa kantor lantai 12 periode Januari 2025"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className={cn(
                        "resize-none transition-colors",
                        errors.description &&
                          "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {errors.description && (
                      <p className="text-xs text-destructive">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Bruto */}
                  <div className="space-y-2">
                    <Label htmlFor="bruto" className="text-sm font-medium">
                      Nominal Bruto (Rp)
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-slate-400">
                        Rp
                      </span>
                      <Input
                        id="bruto"
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="50.000.000"
                        value={brutoDisplay}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "");
                          setBruto(digits);
                        }}
                        className={cn(
                          "pl-9 text-right tnum",
                          errors.bruto &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </div>
                    {errors.bruto ? (
                      <p className="text-xs text-destructive">{errors.bruto}</p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Nilai kotor sebelum pemotongan pajak.
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Kategori Transaksi
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <Select
                      value={categoryId}
                      onValueChange={(v) => setCategoryId(v as CategoryId)}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full",
                          errors.category &&
                            "border-destructive focus:ring-destructive"
                        )}
                      >
                        <SelectValue placeholder="Pilih kategori…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Jenis Pemotongan PPh</SelectLabel>
                          {CATEGORIES.map((c) => {
                            const Icon = CATEGORY_ICON[c.id];
                            return (
                              <SelectItem key={c.id} value={c.id}>
                                <span className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 text-primary" />
                                  <span className="font-medium">{c.label}</span>
                                  <Badge
                                    variant="secondary"
                                    className="ml-1 text-[10px] font-normal"
                                  >
                                    {c.taxTypeShort}
                                  </Badge>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-destructive">
                        {errors.category}
                      </p>
                    )}
                    {selectedCategory && (
                      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>
                          <strong className="font-semibold text-slate-700 dark:text-slate-300">
                            {selectedCategory.taxType}.
                          </strong>{" "}
                          {selectedCategory.legalBasis} Tarif dasar{" "}
                          <strong>{formatRate(selectedCategory.baseRate)}</strong>{" "}
                          {selectedCategory.dppRate < 1
                            ? `· DPP ${Math.round(selectedCategory.dppRate * 100)}% × Bruto`
                            : "· DPP 100% × Bruto"}
                          .
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Tanggal Transaksi
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={cn(
                          "pl-9",
                          errors.date &&
                            "border-destructive focus-visible:ring-destructive"
                        )}
                      />
                    </div>
                    {errors.date && (
                      <p className="text-xs text-destructive">{errors.date}</p>
                    )}
                  </div>

                  {/* NPWP */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Penerima penghasilan memiliki NPWP?
                      <span className="ml-0.5 text-destructive">*</span>
                    </Label>
                    <RadioGroup
                      value={npwp}
                      onValueChange={(v) => setNpwp(v as NpwpStatus)}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        htmlFor="npwp-yes"
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          npwp === "yes"
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                        )}
                      >
                        <RadioGroupItem id="npwp-yes" value="yes" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            Ya, memiliki
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Tarif normal
                          </p>
                        </div>
                      </label>
                      <label
                        htmlFor="npwp-no"
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                          npwp === "no"
                            ? "border-amber-500 bg-amber-50 ring-1 ring-amber-400/40 dark:bg-amber-950/30"
                            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                        )}
                      >
                        <RadioGroupItem id="npwp-no" value="no" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                            Tidak
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Tarif +20% (×1,2)
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                    {npwp === "no" && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          Sesuai PMK-252/PMK.03/2008, tarif pemotongan
                          ditingkatkan 20% bila penerima tidak memiliki NPWP.
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 sm:w-auto"
                  >
                    <Sparkles className="mr-1.5 h-4 w-4" />
                    Hitung &amp; Buat Jurnal
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </section>

          {/* ───────────── Results ───────────── */}
          <section id="hasil" className="lg:col-span-3">
            {result ? (
              <ResultsView
                result={result}
                copied={copied}
                onCopy={handleCopy}
              />
            ) : (
              <EmptyState />
            )}
          </section>
        </div>
      </main>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="mt-auto border-t border-slate-200/70 bg-white/70 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-950/70">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              TaxJournal Automator — mengacu UU HPP &amp; PMK terkait PPh.
            </p>
            <p className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              Hasil bersifat estimasi; verifikasi dengan konsultan pajak Anda.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─────────────────────────── Empty state ─────────────────────────── */
function EmptyState() {
  return (
    <Card className="flex h-full min-h-[420px] flex-col items-center justify-center border-dashed border-slate-300 bg-white/60 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <CardContent className="flex max-w-sm flex-col items-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileSpreadsheet className="h-8 w-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Belum ada hasil perhitungan
          </h3>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Lengkapi formulir di sebelah kiri dan tekan{" "}
            <span className="font-medium text-primary">Hitung &amp; Buat Jurnal</span>
            . Hasil DPP, pajak dipotong, neto, dan jurnal akuntansi akan
            muncul di sini.
          </p>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((c) => (
            <Badge
              key={c.id}
              variant="secondary"
              className="gap-1 font-normal text-slate-600 dark:text-slate-300"
            >
              <span className="font-semibold text-primary">{c.id}</span>
              {c.taxTypeShort}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────── Results view ─────────────────────────── */
function ResultsView({
  result,
  copied,
  onCopy,
}: {
  result: TaxResult;
  copied: boolean;
  onCopy: () => void;
}) {
  const CatIcon = CATEGORY_ICON[result.category.id];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<Wallet className="h-4 w-4" />}
          label="Dasar Pengenaan Pajak (DPP)"
          value={formatRupiah(result.dpp)}
          accent="slate"
          hint={
            result.category.dppRate < 1
              ? `${Math.round(result.category.dppRate * 100)}% × Bruto`
              : "100% × Bruto"
          }
        />
        <SummaryCard
          icon={<ReceiptText className="h-4 w-4" />}
          label="Pajak Dipotong"
          value={formatRupiah(result.tax)}
          accent="amber"
          hint={
            result.npwpMultiplier !== 1
              ? `${formatRate(result.baseRate)} × ${result.npwpMultiplier} = ${formatRate(result.effectiveRate)}`
              : `${formatRate(result.effectiveRate)} × DPP`
          }
        />
        <SummaryCard
          icon={<Landmark className="h-4 w-4" />}
          label="Neto Dibayarkan"
          value={formatRupiah(result.netPaid)}
          accent="primary"
          hint="Bruto − Pajak"
        />
      </div>

      {/* Journal card */}
      <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CatIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base text-slate-900 dark:text-slate-50">
                  Jurnal Akuntansi
                </CardTitle>
                <CardDescription className="text-xs">
                  {result.category.label} · {result.category.taxType}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1 border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                <CalendarDays className="h-3 w-3" />
                {formatDisplayDate(result.date)}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1",
                        result.balanced
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "border-destructive/40 bg-destructive/10 text-destructive"
                      )}
                    >
                      <Scale className="h-3 w-3" />
                      {result.balanced ? "Seimbang" : "Tidak Seimbang"}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[220px] text-xs">
                    Total Debit {formatRupiah(result.totalDebit)} = Total Kredit{" "}
                    {formatRupiah(result.totalKredit)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Description banner */}
          <div className="flex items-start gap-2 border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Deskripsi:
              </span>{" "}
              {result.description}
            </p>
          </div>

          {/* Journal table */}
          <div className="scroll-finance max-h-96 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-800">
                  <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Tanggal
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Nama Akun
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Debit
                  </TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Kredit
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.journal.map((entry, idx) => (
                  <TableRow
                    key={idx}
                    className={cn(
                      "border-slate-100 dark:border-slate-800/70",
                      entry.debit > 0
                        ? "bg-blue-50/30 dark:bg-blue-950/10"
                        : entry.kredit > 0
                          ? "bg-slate-50/40 dark:bg-slate-900/30"
                          : ""
                    )}
                  >
                    <TableCell className="whitespace-nowrap py-3 text-xs text-slate-500">
                      {formatDisplayDate(entry.tanggal)}
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        {entry.debit > 0 ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-blue-100 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            D
                          </span>
                        ) : entry.kredit > 0 ? (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            K
                          </span>
                        ) : (
                          <span className="inline-block h-5 w-5" />
                        )}
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {entry.namaAkun}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm tnum text-slate-800 dark:text-slate-200">
                      {entry.debit ? formatRupiah(entry.debit) : "—"}
                    </TableCell>
                    <TableCell className="py-3 text-right text-sm tnum text-slate-800 dark:text-slate-200">
                      {entry.kredit ? formatRupiah(entry.kredit) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-slate-100/95 backdrop-blur dark:bg-slate-800/95">
                <TableRow className="border-slate-200 hover:bg-transparent dark:border-slate-700">
                  <TableCell colSpan={2} className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Total
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tnum text-slate-900 dark:text-slate-100">
                    {formatRupiah(result.totalDebit)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold tnum text-slate-900 dark:text-slate-100">
                    {formatRupiah(result.totalKredit)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Scale className="h-3.5 w-3.5 text-emerald-600" />
            Debit &amp; Kredit seimbang.{" "}
            <span className="hidden sm:inline">
              Selisih Rp 0 — jurnal siap diposting.
            </span>
          </div>
          <Button
            onClick={onCopy}
            variant={copied ? "secondary" : "default"}
            className="w-full bg-primary text-primary-foreground shadow-sm shadow-primary/30 sm:w-auto"
          >
            {copied ? (
              <>
                <ClipboardCheck className="mr-1.5 h-4 w-4" />
                Tersalin!
              </>
            ) : (
              <>
                <ClipboardCopy className="mr-1.5 h-4 w-4" />
                Copy ke Clipboard (Excel)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Formula breakdown */}
      <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800">
        <CardHeader className="border-b border-slate-100 bg-slate-50/60 pb-3 dark:border-slate-800 dark:bg-slate-900/40">
          <CardTitle className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-50">
            <Calculator className="h-4 w-4 text-primary" />
            Rincian Perhitungan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 p-5 text-sm">
          <FormulaRow
            label="Nominal Bruto"
            value={formatRupiah(result.bruto)}
          />
          <Separator className="bg-slate-100 dark:bg-slate-800" />
          <FormulaRow
            label="DPP"
            detail={
              result.category.dppRate < 1
                ? `${Math.round(result.category.dppRate * 100)}% × ${formatRupiah(result.bruto)}`
                : "100% × Bruto"
            }
            value={formatRupiah(result.dpp)}
          />
          <Separator className="bg-slate-100 dark:bg-slate-800" />
          <FormulaRow
            label="Tarif Pemotongan"
            detail={
              result.npwpMultiplier !== 1
                ? `${formatRate(result.baseRate)} × ${result.npwpMultiplier} (tanpa NPWP)`
                : formatRate(result.baseRate)
            }
            value={formatRate(result.effectiveRate)}
          />
          <Separator className="bg-slate-100 dark:bg-slate-800" />
          <FormulaRow
            label="Pajak Dipotong"
            detail={`${formatRate(result.effectiveRate)} × ${formatRupiah(result.dpp)}`}
            value={formatRupiah(result.tax)}
            emphasize
          />
          <Separator className="bg-slate-100 dark:bg-slate-800" />
          <FormulaRow
            label="Neto Dibayarkan"
            detail={`${formatRupiah(result.bruto)} − ${formatRupiah(result.tax)}`}
            value={formatRupiah(result.netPaid)}
            emphasize
          />
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────────────────── Small pieces ─────────────────────────── */
const ACCENT_STYLES = {
  slate: {
    box: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    value: "text-slate-900 dark:text-slate-50",
  },
  amber: {
    box: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
  },
  primary: {
    box: "bg-primary/10 text-primary",
    value: "text-primary",
  },
} as const;

function SummaryCard({
  icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: keyof typeof ACCENT_STYLES;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              s.box
            )}
          >
            {icon}
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
        </div>
        <p
          className={cn(
            "mt-3 text-xl font-bold tnum sm:text-2xl",
            s.value
          )}
        >
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FormulaRow({
  label,
  detail,
  value,
  emphasize,
}: {
  label: string;
  detail?: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm",
            emphasize
              ? "font-semibold text-slate-800 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-300"
          )}
        >
          {label}
        </p>
        {detail && (
          <p className="text-[11px] text-slate-400">{detail}</p>
        )}
      </div>
      <p
        className={cn(
          "shrink-0 text-sm tnum",
          emphasize
            ? "font-bold text-slate-900 dark:text-slate-50"
            : "font-medium text-slate-700 dark:text-slate-200"
        )}
      >
        {value}
      </p>
    </div>
  );
}
