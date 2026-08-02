import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaxJournal Automator — PPh & Jurnal Akuntansi Otomatis",
  description:
    "Otomasi perhitungan PPh (PPh 4(2), 21, 23) dan penyusunan jurnal akuntansi Debit–Kredit seimbang untuk pemotong pajak di Indonesia.",
  keywords: [
    "TaxJournal",
    "PPh",
    "PPh 21",
    "PPh 23",
    "PPh 4 ayat 2",
    "jurnal akuntansi",
    "pemotong pajak",
    "Indonesia",
    "NPWP",
    "withholding tax",
  ],
  authors: [{ name: "TaxJournal Automator" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "TaxJournal Automator",
    description:
      "Hitung PPh & buat jurnal akuntansi seimbang secara otomatis.",
    url: "https://chat.z.ai",
    siteName: "TaxJournal Automator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxJournal Automator",
    description:
      "Hitung PPh & buat jurnal akuntansi seimbang secara otomatis.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
