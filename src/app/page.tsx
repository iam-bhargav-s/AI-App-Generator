'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, Database, Lock, Shield, Cpu, Briefcase, Zap, LayoutTemplate, MessageSquare, ChevronDown } from 'lucide-react';

const TEMPLATES = [
  { id: 'crm', name: 'CRM Workspace', category: 'Sales', complexity: 'Moderate', desc: 'Pipeline management with customer tracking.' },
  { id: 'hr', name: 'HR Dashboard', category: 'Ops', complexity: 'Advanced', desc: 'Employee directory and time-off tracking.' },
  { id: 'admin', name: 'Admin Panel', category: 'Internal', complexity: 'Simple', desc: 'User and role management system.' },
  { id: 'inventory', name: 'Inventory System', category: 'Logistics', complexity: 'Advanced', desc: 'Stock levels and supplier tracking.' },
  { id: 'analytics', name: 'Analytics Workspace', category: 'Data', complexity: 'Moderate', desc: 'KPI tracking and data visualization.' }
];

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
      
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-200 ${scrolled ? 'bg-[var(--bg-primary)]/80 backdrop-blur-sm border-b border-[var(--border-color)]' : 'bg-transparent'}`}>
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="font-bold text-[18px] tracking-tight flex items-center gap-2">
              <div className="w-5 h-5 bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] text-[10px] font-bold flex items-center justify-center">O</div>
              OneAtlas
            </Link>
            
            <div className="hidden md:flex items-center gap-[32px]">
              <Link href="#how-it-works" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">How it works</Link>
              <Link href="#templates" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Templates</Link>
              <Link href="#enterprise" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Enterprise</Link>
              <Link href="#pricing" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</Link>
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
        {/* Hero Section */}
        <section className="pt-[160px] pb-[120px] max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            
            <div className="w-full lg:w-1/2">
              <h1 className="text-[56px] md:text-[72px] font-bold leading-[0.95] tracking-[-0.04em] mb-6 text-[var(--text-primary)]">
                Build software at the speed of thought.
              </h1>
              <p className="text-[18px] leading-[1.7] text-[var(--text-secondary)] mb-10 max-w-lg">
                A serious AI operating system for building internal tools by <strong>TheAiSignal</strong>. Describe your data models and workflows, and our advanced generative AI will provision the full-stack app instantly.
              </p>
              
              <form onSubmit={handleGenerate} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[28px] p-[24px] shadow-soft max-w-xl">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Build a sales CRM with pipeline management..." 
                  className="w-full text-[18px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none bg-transparent mb-6"
                />
                <div className="border-t border-[var(--border-color)] pt-5 mt-2">
                  <button type="submit" className="w-full h-[48px] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-bold flex items-center justify-center rounded-[12px] transition-transform hover:-translate-y-px">
                    Generate
                  </button>
                </div>
              </form>
            </div>

            <div className="w-full lg:w-1/2">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] shadow-soft overflow-hidden h-[500px] flex flex-col cursor-pointer group" onClick={() => window.open('https://www.theaisignal.com/', '_blank')}>
                <div className="h-12 border-b border-[var(--border-color)] flex items-center px-4 justify-between bg-[var(--bg-secondary)]">
                  <div className="flex gap-4 items-center">
                    <div className="w-6 h-6 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex items-center justify-center">
                      <Database size={12} className="text-[var(--text-secondary)]" />
                    </div>
                    <span className="text-[14px] font-medium text-[var(--text-primary)]">TheAiSignal CRM</span>
                  </div>
                  <div className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)] border border-[var(--border-color)] px-2 py-1 rounded">Preview</div>
                </div>
                <div className="flex-1 flex bg-[var(--bg-primary)] overflow-hidden relative">
                  <div className="absolute inset-0 bg-[var(--bg-secondary)]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] z-20">
                    <div className="bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] px-6 py-3 rounded-full font-bold text-[14px] flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl">
                      Visit TheAiSignal <ArrowUpRight size={16} />
                    </div>
                  </div>

                  <div className="w-48 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 flex flex-col gap-1.5 z-10 relative">
                    <div className="h-8 bg-[#FF6600]/10 text-[#FF6600] rounded-[8px] px-3 flex items-center text-[13px] font-semibold"><div className="w-1.5 h-1.5 rounded-full bg-[#FF6600] mr-2"></div>AI Insights</div>
                    <div className="h-8 hover:bg-[var(--bg-primary)] rounded-[8px] px-3 flex items-center text-[13px] font-medium text-[var(--text-secondary)]">Signal Pipeline</div>
                    <div className="h-8 hover:bg-[var(--bg-primary)] rounded-[8px] px-3 flex items-center text-[13px] font-medium text-[var(--text-secondary)]">Generative CRM</div>
                  </div>
                  
                  <div className="flex-1 bg-[var(--bg-primary)] p-6 flex flex-col z-10 relative">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h3 className="text-[20px] font-bold text-[var(--text-primary)] tracking-tight">TheAiSignal Analytics</h3>
                        <p className="text-[13px] text-[var(--text-secondary)]">Real-time generative data processing</p>
                      </div>
                      <div className="bg-[#FF6600] text-white px-3 py-1.5 rounded-[6px] text-[12px] font-bold shadow-soft flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[14px] p-5 shadow-soft">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Signals Processed</p>
                        <p className="text-[28px] font-bold text-[var(--text-primary)] leading-none tracking-tight mb-2">142.8k</p>
                      </div>
                      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[14px] p-5 shadow-soft">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">Generative Accuracy</p>
                        <p className="text-[28px] font-bold text-[var(--text-primary)] leading-none tracking-tight mb-2">99.4%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How OneAtlas Works */}
        <section id="how-it-works" className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] py-[120px]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">How it works.</h2>
              <p className="text-[18px] text-[var(--text-secondary)] max-w-2xl mx-auto">From idea to production in three conversational steps.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-8 rounded-[24px] shadow-soft">
                <div className="w-12 h-12 bg-[#FF6600]/10 text-[#FF6600] rounded-full flex items-center justify-center mb-6">1</div>
                <h3 className="text-[20px] font-semibold mb-3">Prompt to Generate</h3>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">Describe your ideal application. Our AI engine builds the data schema, provisions the database, and creates the UI instantly.</p>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-8 rounded-[24px] shadow-soft">
                <div className="w-12 h-12 bg-[#FF6600]/10 text-[#FF6600] rounded-full flex items-center justify-center mb-6">2</div>
                <h3 className="text-[20px] font-semibold mb-3">Conversational Edits</h3>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">Don't write migrations. Just chat with the builder to add fields, reorder columns, or change the layout. Edits are atomic and instant.</p>
              </div>
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] p-8 rounded-[24px] shadow-soft">
                <div className="w-12 h-12 bg-[#FF6600]/10 text-[#FF6600] rounded-full flex items-center justify-center mb-6">3</div>
                <h3 className="text-[20px] font-semibold mb-3">Deploy & Share</h3>
                <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">Hit deploy and get a secure, live URL. Share frozen snapshots with your team for review without breaking the live build.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Build With Latest Models */}
        <section className="py-[120px] max-w-[1280px] mx-auto px-5 md:px-8 text-center">
          <Cpu className="mx-auto text-[#FF6600] w-12 h-12 mb-6" />
          <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">Powered by the latest models.</h2>
          <p className="text-[18px] text-[var(--text-secondary)] max-w-2xl mx-auto mb-12">OneAtlas integrates directly with Google Gemini Flash to generate flawless schemas and robust interfaces with unprecedented speed.</p>
          <div className="flex justify-center gap-8 items-center opacity-70 grayscale">
            <span className="text-2xl font-bold font-serif tracking-tighter">Gemini</span>
            <span className="text-xl font-bold tracking-tight">OpenAI</span>
            <span className="text-2xl font-bold font-serif italic">Claude</span>
          </div>
        </section>

        {/* Templates Showcase */}
        <section id="templates" className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] py-[120px] overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8 mb-12 flex justify-between items-end">
            <div>
              <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-4">Start from a template.</h2>
              <p className="text-[18px] text-[var(--text-secondary)]">Operational apps ready to deploy and customize.</p>
            </div>
            <Link href="/dashboard" className="hidden md:flex text-[15px] font-medium text-[var(--accent-primary)] hover:underline items-center gap-1">
              View all templates <ArrowRight size={16} />
            </Link>
          </div>
          
          {/* Horizontally scrollable container aligned with the rest of the page */}
          <div className="max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar">
              {TEMPLATES.map((t, i) => (
                <div key={t.id} className="min-w-[320px] max-w-[320px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] p-6 snap-start flex flex-col shadow-soft transition-transform hover:-translate-y-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-[var(--bg-secondary)] px-2 py-1 rounded text-[var(--text-secondary)]">{t.category}</span>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded ${t.complexity === 'Simple' ? 'text-green-600 bg-green-50' : t.complexity === 'Moderate' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50'}`}>{t.complexity}</span>
                  </div>
                  <h3 className="text-[20px] font-bold text-[var(--text-primary)] mb-2">{t.name}</h3>
                  <p className="text-[14px] text-[var(--text-secondary)] mb-8 flex-1">{t.desc}</p>
                  <div className="flex gap-3">
                    <button onClick={() => { router.push(`/dashboard?name=${encodeURIComponent(t.name)}&prompt=${encodeURIComponent(t.desc)}`); }} className="w-full bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] h-10 rounded-[8px] text-[13px] font-semibold hover:opacity-90 transition-colors">Use Template</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Atlas for Roles & Enterprise / Security */}
        <section id="enterprise" className="py-[120px] max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <Briefcase className="text-[#FF6600] w-10 h-10 mb-6" />
              <h2 className="text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">Built for every team.</h2>
              <p className="text-[18px] text-[var(--text-secondary)] mb-6">Whether you are in Ops, Sales, or HR, OneAtlas provides the primitives to build exactly what your workflow demands without waiting for engineering.</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[15px] font-medium"><Check size={18} className="text-[#10B981]" /> Ops: Inventory management and tracking</li>
                <li className="flex items-center gap-3 text-[15px] font-medium"><Check size={18} className="text-[#10B981]" /> Sales: Custom CRMs tailored to your pipeline</li>
                <li className="flex items-center gap-3 text-[15px] font-medium"><Check size={18} className="text-[#10B981]" /> HR: Employee onboarding portals</li>
              </ul>
            </div>
            
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-10 rounded-[32px] shadow-soft">
              <Shield className="text-[var(--text-primary)] w-10 h-10 mb-6" />
              <h2 className="text-[28px] font-semibold tracking-tight text-[var(--text-primary)] mb-4">Enterprise Security</h2>
              <p className="text-[15px] text-[var(--text-secondary)] mb-8 leading-relaxed">Your data is yours. OneAtlas generates standard Next.js and Prisma code that can be exported or deployed securely to your own infrastructure.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[14px] font-medium"><Lock size={16} className="text-[var(--text-muted)]" /> SOC2 Compliant</div>
                <div className="flex items-center gap-2 text-[14px] font-medium"><Database size={16} className="text-[var(--text-muted)]" /> Data Isolation</div>
                <div className="flex items-center gap-2 text-[14px] font-medium"><Shield size={16} className="text-[var(--text-muted)]" /> RBAC Ready</div>
                <div className="flex items-center gap-2 text-[14px] font-medium"><Check size={16} className="text-[var(--text-muted)]" /> Code Export</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section id="pricing" className="bg-[var(--bg-secondary)] border-y border-[var(--border-color)] py-[120px]">
          <div className="max-w-[1280px] mx-auto px-5 md:px-8">
            <div className="text-center mb-16">
              <h2 className="text-[48px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-6">Simple pricing.</h2>
              <p className="text-[18px] text-[var(--text-secondary)]">Start for free. Scale when you need it.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {/* Standard */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] p-[24px] flex flex-col shadow-soft">
                <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">Builder</h3>
                <p className="text-[14px] text-[var(--text-secondary)] mb-6">For individuals and small teams.</p>
                <div className="mb-8">
                  <span className="text-[40px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$0</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[var(--text-muted)] mt-0.5 shrink-0" /> Unlimited generated apps</li>
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[var(--text-muted)] mt-0.5 shrink-0" /> 5 managed deployments</li>
                </ul>
                <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="flex items-center justify-center h-[44px] w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[#FAFAFA] text-[var(--text-primary)] text-[14px] font-semibold rounded-[10px] transition-colors">Start Building</button>
              </div>

              {/* Monthly */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] p-[24px] flex flex-col shadow-soft">
                <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">Monthly</h3>
                <p className="text-[14px] text-[var(--text-secondary)] mb-6">Flexible monthly subscription.</p>
                <div className="mb-8">
                  <span className="text-[40px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$8</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">/month</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Advanced AI reasoning</li>
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Priority support</li>
                </ul>
                <a href="https://www.theaisignal.com/subscribe?utm_source=menu&simple=true&next=https%3A%2F%2Fwww.theaisignal.com%2F&skip_redirect_check=true&just_signed_up=true&referral_token=44xgnm" className="flex items-center justify-center h-[44px] w-full bg-[#FF6600] hover:bg-[#e55c00] text-white text-[14px] font-semibold rounded-[10px] transition-transform hover:-translate-y-px">Subscribe</a>
              </div>

              {/* Yearly */}
              <div className="bg-[var(--bg-primary)] border-[1.5px] border-[#FF6600] rounded-[24px] p-[24px] flex flex-col relative shadow-xl transform md:-translate-y-2">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-primary)] px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-[#FF6600] border border-[#FF6600] rounded-full whitespace-nowrap">Most Popular</div>
                <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">Yearly</h3>
                <p className="text-[14px] text-[var(--text-secondary)] mb-6">For scaling applications.</p>
                <div className="mb-8">
                  <span className="text-[40px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$80</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">/year</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Save over 15% annually</li>
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Unlimited deployments</li>
                </ul>
                <a href="https://www.theaisignal.com/subscribe?utm_source=menu&simple=true&next=https%3A%2F%2Fwww.theaisignal.com%2F&skip_redirect_check=true&just_signed_up=true&referral_token=44xgnm" className="flex items-center justify-center h-[44px] w-full bg-[#FF6600] hover:bg-[#e55c00] text-white text-[14px] font-semibold rounded-[10px] transition-transform hover:-translate-y-px">Subscribe</a>
              </div>

              {/* Founding */}
              <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[24px] p-[24px] flex flex-col shadow-soft">
                <h3 className="text-[20px] font-semibold text-[var(--text-primary)] mb-2">Founding</h3>
                <p className="text-[14px] text-[var(--text-secondary)] mb-6">Exclusive early-adopter access.</p>
                <div className="mb-8">
                  <span className="text-[40px] font-bold text-[var(--text-primary)] tracking-[-0.03em]">$150</span>
                  <span className="text-[14px] text-[var(--text-secondary)]">/year</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Direct engineering support</li>
                  <li className="flex items-start gap-2 text-[14px] font-medium"><Check size={16} className="text-[#FF6600] mt-0.5 shrink-0" /> Code Export capability</li>
                </ul>
                <a href="https://www.theaisignal.com/subscribe?utm_source=menu&simple=true&next=https%3A%2F%2Fwww.theaisignal.com%2F&skip_redirect_check=true&just_signed_up=true&referral_token=44xgnm" className="flex items-center justify-center h-[44px] w-full bg-[#FF6600] hover:bg-[#e55c00] text-white text-[14px] font-semibold rounded-[10px] transition-transform hover:-translate-y-px">Subscribe</a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-[120px] max-w-[800px] mx-auto px-5 md:px-8">
          <h2 className="text-[40px] font-semibold leading-[1] tracking-[-0.03em] text-[var(--text-primary)] mb-12 text-center">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I export the code?', a: 'Yes. OneAtlas apps are standard Next.js and Prisma codebases. Pro users can export the full repository.' },
              { q: 'How does conversational editing work?', a: 'You type an instruction (e.g. "Add a status field"), and our engine safely mutates your schema without breaking existing data.' },
              { q: 'Is my data secure?', a: 'We use row-level security and isolated database schemas for every app generated on our platform.' },
            ].map((faq, i) => (
              <div key={i} className="border border-[var(--border-color)] rounded-[16px] bg-[var(--bg-secondary)] overflow-hidden transition-all duration-200">
                <button 
                  className="w-full px-6 py-5 text-left flex justify-between items-center text-[16px] font-semibold text-[var(--text-primary)]"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                >
                  {faq.q}
                  <ChevronDown size={18} className={`text-[var(--text-muted)] transition-transform duration-200 ${activeFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-5 text-[15px] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-color)] pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <div className="font-bold text-[18px] text-[var(--text-primary)] flex items-center gap-2 mb-4">
                <div className="w-5 h-5 bg-[#111111] text-white dark:bg-[#F3F4F6] dark:text-[#111111] text-[10px] font-bold flex items-center justify-center">O</div>
                OneAtlas
              </div>
              <p className="text-[14px] text-[var(--text-secondary)] max-w-xs mb-6">The AI-native runtime platform for internal tools and operational dashboards.</p>
              <a href="https://www.theaisignal.com/" target="_blank" className="inline-flex items-center gap-2 text-[12px] font-bold tracking-wider uppercase text-[#FF6600] hover:text-[#e55c00]">
                Built by TheAiSignal <ArrowUpRight size={14} />
              </a>
            </div>
            <div>
              <h4 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#templates" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Templates</Link></li>
                <li><Link href="#enterprise" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Enterprise</Link></li>
                <li><Link href="#pricing" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Documentation</Link></li>
                <li><Link href="#" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Blog</Link></li>
                <li><Link href="#" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacy Policy</Link></li>
                <li><Link href="#" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[13px] text-[var(--text-muted)] font-medium">
              © 2026 OneAtlas Inc. All rights reserved.
            </div>
          </div>
        </div>
        
      </footer>
    </div>
  );
}
