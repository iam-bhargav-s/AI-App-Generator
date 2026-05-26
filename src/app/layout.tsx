import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OneAtlas — AI-Native Internal Tools Platform",
  description: "Generate and deploy business applications instantly. Zero migrations, serverless-first, enterprise-ready.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#635BFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <div className="fixed bottom-4 right-4 z-50 pointer-events-none opacity-50 bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-1.5 rounded-full shadow-soft flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span>
          <span className="text-[12px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">Powered by TheAiSignal</span>
        </div>
      </body>
    </html>
  );
}
