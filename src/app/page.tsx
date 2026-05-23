import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-8 py-6 flex justify-between items-center border-b border-slate-900">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-wider uppercase">
          App Runtime Engine
        </h1>
        <Link
          href="/login"
          className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-emerald-950/20"
        >
          Access Console
        </Link>
      </header>

      {/* Hero section */}
      <main className="relative z-10 max-w-5xl mx-auto px-8 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 uppercase tracking-widest font-black mb-6">
          Track A: AI App Generator
        </span>
        <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase leading-none max-w-3xl">
          Metadata-Driven<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-350">
            Application Runtime
          </span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg mt-6 max-w-xl leading-relaxed">
          Convert structured JSON configurations into fully working web applications. Sync models, map CSV imports, orchestrate events, and export code directly to GitHub.
        </p>

        <div className="flex gap-4 mt-10">
          <Link
            href="/login"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-700 text-white font-bold text-sm px-8 py-4 rounded-xl transition duration-200 shadow-xl shadow-emerald-950/40 uppercase tracking-wider"
          >
            Open Creator Console
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900/60 py-6 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Application Engine Runtime. All rights reserved.
      </footer>
    </div>
  );
}
