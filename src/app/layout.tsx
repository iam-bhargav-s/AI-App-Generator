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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <a href="https://www.theaisignal.com/" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] border-2 border-[#FF6600] px-5 py-2.5 rounded-full flex items-center gap-3 hover:-translate-y-1 transition-transform cursor-pointer">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF6600] animate-pulse"></span>
          <span className="text-[13px] font-bold tracking-widest uppercase">Powered by TheAiSignal</span>
        </a>
      </body>
    </html>
  );
}
