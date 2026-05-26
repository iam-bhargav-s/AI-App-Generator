'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, Database, Play } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim()) {
      router.push(`/dashboard?prompt=${encodeURIComponent(prompt)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--accent-primary)] selection:text-white">
      
      {/* 5. Navbar Design */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-200 ${scrolled ? 'bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-color)]' : 'bg-transparent'}`}>
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-bold text-[18px] tracking-tight flex items-center gap-2">
              <div className="w-5 h-5 bg-[var(--text-primary)] text-white text-[10px] font-bold flex items-center justify-center">O</div>
              OneAtlas
            </Link>
            
            <div className="hidden md:flex items-center gap-[32px]">
              <Link href="#" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Product</Link>
              <Link href="#" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Templates</Link>
              <Link href="#" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Enterprise</Link>
              <Link href="#" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign in</Link>
            <Link href="/dashboard" className="h-[48px] px-[22px] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold flex items-center justify-center rounded-[12px] transition-transform hover:-translate-y-px">
              Start Building
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* 9. Hero Section (50/50 Layout) */}
        <section className="pt-[120px] pb-[120px] max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            {/* Left: Typography */}
            <div className="w-full lg:w-1/2">
              <h1 className="text-[56px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.04em] mb-6 text-[var(--text-primary)]">
                Build software at the speed of thought.
              </h1>
              <p className="text-[18px] leading-[1.7] text-[var(--text-secondary)] mb-10 max-w-lg">
                A serious AI operating system for building internal tools by <strong>TheAiSignal</strong>. Describe your data models and workflows, and our advanced generative AI will provision the full-stack app, infrastructure, database, and UI instantly.
              </p>
              
              {/* Prompt Box */}
              <form onSubmit={handleGenerate} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[28px] p-[24px] shadow-soft max-w-xl">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Build a sales CRM with pipeline management..." 
                  className="w-full text-[18px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none bg-transparent mb-6"
                />
                <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPrompt('HR Dashboard')} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">HR Dashboard</button>
                    <span className="text-[var(--border-color)]">•</span>
                    <button type="button" onClick={() => setPrompt('Inventory System')} className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">Inventory</button>
                  </div>
                  <button 
                    type="submit"
                    className="h-[40px] px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold flex items-center justify-center rounded-[8px] transition-transform hover:-translate-y-px"
                  >
                    Generate
                  </button>
                </div>
              </form>
            </div>

            {/* Right: AI Workspace UI Mock */}
            <div className="w-full lg:w-1/2">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] shadow-soft overflow-hidden h-[500px] flex flex-col">
                <div className="h-12 border-b border-[var(--border-color)] flex items-center px-4 justify-between bg-[var(--bg-secondary)]">
                  <div className="flex gap-4 items-center">
                    <div className="w-6 h-6 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex items-center justify-center">
                      <Database size={12} className="text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">TheAiSignal CRM</span>
                  </div>
                  <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)] border border-[var(--border-color)] px-2 py-1 rounded">
                    Preview
                  </div>
                </div>
                <div className="flex-1 flex">
                  {/* Mock Sidebar */}
                  <div className="w-48 border-r border-[var(--border-color)] p-4 flex flex-col gap-2">
                    <div className="h-8 bg-[var(--bg-primary)] rounded px-3 flex items-center text-[12px] font-semibold text-[var(--text-primary)]">Overview</div>
                    <div className="h-8 hover:bg-[var(--bg-primary)] rounded px-3 flex items-center text-[12px] font-medium text-[var(--text-secondary)] transition-colors">Deals</div>
                    <div className="h-8 hover:bg-[var(--bg-primary)] rounded px-3 flex items-center text-[12px] font-medium text-[var(--text-secondary)] transition-colors">Customers</div>
                  </div>
                  {/* Mock Canvas */}
                  <div className="flex-1 bg-[var(--bg-primary)] p-6">
                    <h3 className="text-[22px] font-semibold text-[var(--text-primary)] mb-6">Pipeline Overview</h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[12px] p-4 shadow-soft">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">Total Deals</p>
                        <p className="text-[24px] font-medium text-[var(--text-primary)]">24</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[12px] p-4 shadow-soft">
                        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] mb-2">Revenue</p>
                        <p className="text-[24px] font-medium text-[var(--text-primary)]">$1.2M</p>
                      </div>
                    </div>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[12px] shadow-soft h-32 flex flex-col">
                      <div className="border-b border-[var(--border-color)] p-3"><div className="h-2 w-24 bg-[var(--border-color)] rounded"></div></div>
                      <div className="p-3"><div className="h-2 w-full bg-[var(--bg-primary)] rounded mb-2"></div><div className="h-2 w-2/3 bg-[var(--bg-primary)] rounded"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* 10. Integration Section Style */}
        <section className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] py-[120px]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 text-center">
            <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">Connects with your stack.</h2>
            <p className="text-[18px] text-[var(--text-secondary)] mb-16 max-w-2xl mx-auto">OneAtlas seamlessly provisions databases and exposes unified APIs, allowing you to easily integrate with the tools you already use.</p>
            
            <div className="flex flex-wrap justify-center gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-[220px] h-[260px] bg-[var(--bg-secondary)] border border-[#ECECEC] rounded-[28px] p-6 flex flex-col items-center justify-center transition-transform hover:-translate-y-1 hover:border-[#D1D5DB] duration-200">
                  <div className="w-12 h-12 bg-[#F5F5EE] rounded-full mb-6 flex items-center justify-center text-[var(--text-muted)]">
                    <Database size={20} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-2">PostgreSQL</h3>
                  <p className="text-[12px] text-[var(--text-secondary)] text-center">Managed relational database instantly provisioned.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 11. Pricing Cards */}
        <section className="py-[120px] max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">Simple pricing.</h2>
            <p className="text-[18px] text-[var(--text-secondary)]">No enterprise sales calls required.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Standard Plan */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-[28px] flex flex-col">
              <h3 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">Builder</h3>
              <p className="text-[18px] text-[var(--text-secondary)] mb-8">For individuals and small teams.</p>
              <div className="mb-10">
                <span className="text-[48px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$29</span>
                <span className="text-[15px] text-[var(--text-secondary)]">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--text-muted)]" /> Unlimited local builds</li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--text-muted)]" /> 5 managed deployments</li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--text-muted)]" /> Community support</li>
              </ul>
              <button className="h-[48px] w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[#FAFAFA] text-[var(--text-primary)] text-[15px] font-semibold rounded-[12px] transition-colors">
                Start Building
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-[var(--bg-secondary)] border-[1.5px] border-[var(--accent-primary)] rounded-[24px] p-[28px] flex flex-col relative">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--bg-secondary)] px-2 text-[12px] font-semibold tracking-[0.08em] uppercase text-[var(--accent-primary)]">Most Popular</div>
              <h3 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">Pro</h3>
              <p className="text-[18px] text-[var(--text-secondary)] mb-8">For scaling applications.</p>
              <div className="mb-10">
                <span className="text-[48px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$99</span>
                <span className="text-[15px] text-[var(--text-secondary)]">/mo</span>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--accent-primary)]" /> Advanced AI models</li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--accent-primary)]" /> Unlimited deployments</li>
                <li className="flex items-center gap-3 text-[15px] text-[var(--text-primary)]"><Check size={16} className="text-[var(--accent-primary)]" /> Priority support</li>
              </ul>
              <button className="h-[48px] w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold rounded-[12px] transition-transform hover:-translate-y-px">
                Upgrade to Pro
              </button>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] py-12">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="font-bold text-[15px] text-[var(--text-primary)] flex items-center gap-2">
            <div className="w-4 h-4 bg-[var(--text-primary)] text-white text-[8px] font-bold flex items-center justify-center">O</div>
            OneAtlas
          </div>
          <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-[0.08em] font-semibold">
            © 2026 OneAtlas Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}
