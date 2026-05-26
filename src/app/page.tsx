'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, ChevronDown, Check, Menu, X, Code2, Database, Rocket, Play, Shield, Globe } from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'crm',
    name: 'AI CRM Starter',
    category: 'Sales',
    complexity: 'Moderate',
    description: 'Manage leads, pipeline and customer relationships with AI'
  },
  {
    id: 'hr',
    name: 'HR Dashboard',
    category: 'People',
    complexity: 'Simple',
    description: 'Track employee data, onboarding, and reviews'
  },
  {
    id: 'inventory',
    name: 'Inventory System',
    category: 'Operations',
    complexity: 'Advanced',
    description: 'Real-time stock tracking with automated reorder alerts'
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleGenerate = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (prompt.trim()) {
      router.push(`/dashboard?prompt=${encodeURIComponent(prompt)}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#425466] font-sans selection:bg-[#635BFF]/20">
      
      {/* 1. Mega Menu Navigation (Cal.com / Supabase style) */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(255,255,255,0.85)] backdrop-blur-md border-b border-[#E3E8EE]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center">
                <span className="font-bold text-white text-sm">O</span>
              </div>
              <span className="font-bold text-[#0A2540] text-lg tracking-tight">OneAtlas</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <div 
                className="relative group"
                onMouseEnter={() => setActiveDropdown('product')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">
                  Product <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'product' ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <Link href="#" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Use Cases</Link>
              <Link href="#" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Templates</Link>
              <Link href="#" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Enterprise</Link>
              <Link href="#" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Security</Link>
              <Link href="#" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Pricing</Link>
              
              <div 
                className="relative group"
                onMouseEnter={() => setActiveDropdown('resources')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center gap-1 text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">
                  Resources <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'resources' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-[#425466] hover:text-[#0A2540] transition">Sign in</Link>
            <Link href="/dashboard" className="text-sm font-medium bg-[#FF5996] hover:bg-[#ff4081] text-white px-4 py-2 rounded-lg transition shadow-sm">
              Start Building
            </Link>
          </div>

          <button className="md:hidden text-[#0A2540]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        {/* 2. Hero Section (Replit style) */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#0A2540] tracking-tight leading-[1.1] mb-6">
            What will you build?
          </h1>
          <p className="text-lg md:text-xl text-[#425466] mb-12">
            Turn ideas into apps in minutes — no coding needed. The AI-Native Internal Tools Platform.
          </p>

          <form onSubmit={handleGenerate} className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#635BFF] to-[#FF5996] rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-xl shadow-xl border border-[#EDF1F6] flex items-center p-2">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your idea, OneAtlas will bring it to life..." 
                className="w-full pl-4 pr-12 py-3 text-lg text-[#0A2540] placeholder:text-[#697386] outline-none rounded-lg bg-transparent"
              />
              <button 
                type="submit"
                className="absolute right-3 bg-[#FF5996] hover:bg-[#ff4081] text-white p-2 rounded-lg transition"
              >
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button type="button" onClick={() => setPrompt('AI sales assistant')} className="text-sm bg-white border border-[#E3E8EE] px-4 py-1.5 rounded-full text-[#425466] hover:border-[#635BFF] hover:text-[#635BFF] transition shadow-sm">AI sales assistant</button>
              <button type="button" onClick={() => setPrompt('Hiring tracker')} className="text-sm bg-white border border-[#E3E8EE] px-4 py-1.5 rounded-full text-[#425466] hover:border-[#635BFF] hover:text-[#635BFF] transition shadow-sm">Hiring tracker</button>
              <button type="button" onClick={() => setPrompt('Inventory management')} className="text-sm bg-white border border-[#E3E8EE] px-4 py-1.5 rounded-full text-[#425466] hover:border-[#635BFF] hover:text-[#635BFF] transition shadow-sm">Inventory management</button>
            </div>
          </form>
        </section>

        {/* 3. Build with latest models */}
        <section className="py-12 border-y border-[#E3E8EE] bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 text-center mb-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#697386]">Powered by the latest frontier models</p>
          </div>
          <div className="flex gap-12 items-center whitespace-nowrap px-6 opacity-60">
            <span className="text-2xl font-bold text-[#0A2540]">Gemini 1.5 Flash</span>
            <span className="text-2xl font-bold text-[#0A2540]">Claude 3.5 Sonnet</span>
            <span className="text-2xl font-bold text-[#0A2540]">GPT-4o</span>
            <span className="text-2xl font-bold text-[#0A2540]">DeepSeek-V2</span>
            <span className="text-2xl font-bold text-[#0A2540]">Gemini 1.5 Pro</span>
            <span className="text-2xl font-bold text-[#0A2540]">Claude 3 Opus</span>
          </div>
        </section>

        {/* 4. How OneAtlas Works (Lovable style) */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <h2 className="text-4xl font-bold text-[#0A2540] mb-16 text-center">Meet OneAtlas</h2>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="bg-[#F6F9FC] rounded-2xl p-8 aspect-video flex items-center justify-center border border-[#EDF1F6]">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#E3E8EE] w-full max-w-sm">
                <p className="text-sm text-[#697386] mb-2">Create a customer feedback tool with AI analysis.</p>
                <div className="flex justify-between items-center bg-[#FAFBFF] p-2 rounded-lg border border-[#EDF1F6]">
                  <span className="text-xs text-[#0A2540]">@ Public</span>
                  <div className="w-6 h-6 bg-[#0A2540] rounded-full flex items-center justify-center"><ArrowUpRight size={12} color="white" /></div>
                </div>
              </div>
            </div>
            <div className="space-y-12">
              <div>
                <h3 className="text-2xl font-bold text-[#0A2540] mb-3">Start with an idea</h3>
                <p className="text-[#425466]">Describe the app or dashboard you want to create. Our AI gateway routes your request to the optimal frontier model.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A2540] mb-3 opacity-60">Watch it come to life</h3>
                <p className="text-[#425466]">See your vision transform into a working prototype with a live database and UI in real-time as AI builds it for you.</p>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#0A2540] mb-3 opacity-60">Refine and ship</h3>
                <p className="text-[#425466]">Iterate on your creation with simple conversational feedback and deploy it to a dedicated subdomain with one click.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Templates Experience */}
        <section className="bg-[#F6F9FC] py-24 border-y border-[#E3E8EE]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl font-bold text-[#0A2540] mb-4">Discover Templates</h2>
                <p className="text-lg text-[#425466]">Start your next operational project with a production-ready template.</p>
              </div>
              <Link href="/dashboard" className="hidden md:inline-flex px-4 py-2 bg-white border border-[#E3E8EE] rounded-lg text-[#0A2540] font-medium hover:border-[#635BFF] transition shadow-sm">
                View all
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PRESET_TEMPLATES.map(t => (
                <div key={t.id} className="bg-white rounded-xl overflow-hidden border border-[#E3E8EE] hover:shadow-lg hover:border-[#635BFF] transition group cursor-pointer">
                  <div className="h-48 bg-gradient-to-br from-[#EFF3F8] to-[#E0FBF4] p-6 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-[#635BFF] to-transparent"></div>
                    <span className="inline-block px-3 py-1 bg-white/80 backdrop-blur-sm text-xs font-semibold text-[#0A2540] rounded-full self-start shadow-sm">{t.category}</span>
                    <h3 className="text-2xl font-bold text-[#0A2540] z-10">{t.name}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-[#425466] text-sm mb-6 h-10">{t.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#697386]">{t.complexity} Complexity</span>
                      <div className="flex gap-2">
                        <button className="text-xs font-medium text-[#635BFF] hover:text-[#0A2540] transition">Preview</button>
                        <button className="text-xs font-medium bg-[#FAFBFF] border border-[#E3E8EE] px-3 py-1.5 rounded hover:bg-[#635BFF] hover:text-white hover:border-[#635BFF] transition">Use Template</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Pricing Preview */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0A2540] mb-4">Pricing plans for every need</h2>
            <p className="text-lg text-[#425466]">Scale as you go with plans designed to match your growth.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-[#E3E8EE] shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-[#0A2540] mb-2">Explorer</h3>
              <p className="text-sm text-[#697386] mb-6">Learning & experimentation</p>
              <div className="mb-8"><span className="text-4xl font-bold text-[#0A2540]">Free</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> 30 monthly credits</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> Shared infrastructure</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> Core models</li>
              </ul>
              <button className="w-full py-3 rounded-lg font-medium text-[#0A2540] bg-[#F6F9FC] hover:bg-[#EDF1F6] transition">Start Free</button>
            </div>

            <div className="bg-white rounded-2xl p-8 border-2 border-[#635BFF] shadow-lg relative flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#635BFF] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
              <h3 className="text-xl font-bold text-[#0A2540] mb-2">Builder</h3>
              <p className="text-sm text-[#697386] mb-6">Indie builders & MVPs</p>
              <div className="mb-8"><span className="text-4xl font-bold text-[#0A2540]">$29</span><span className="text-[#697386]">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#635BFF]" /> 200 monthly credits</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#635BFF]" /> Managed backend & DB</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#635BFF]" /> Advanced reasoning models</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#635BFF]" /> 1 custom domain</li>
              </ul>
              <button className="w-full py-3 rounded-lg font-medium text-white bg-[#635BFF] hover:bg-[#5249E5] transition">Build Faster</button>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-[#E3E8EE] shadow-sm flex flex-col">
              <h3 className="text-xl font-bold text-[#0A2540] mb-2">Studio</h3>
              <p className="text-sm text-[#697386] mb-6">Startups & fast-moving teams</p>
              <div className="mb-8"><span className="text-4xl font-bold text-[#0A2540]">$79</span><span className="text-[#697386]">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> 800 monthly credits</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> Production-grade infra</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> Shared workspaces</li>
                <li className="flex items-center gap-3 text-sm text-[#425466]"><Check size={16} className="text-[#00D4B1]" /> Multi-domain support</li>
              </ul>
              <button className="w-full py-3 rounded-lg font-medium text-[#0A2540] bg-[#F6F9FC] hover:bg-[#EDF1F6] transition">Upgrade to Studio</button>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-[#0A2540] text-white py-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center">
                <span className="font-bold text-white text-sm">O</span>
              </div>
              <span className="font-bold text-white text-lg tracking-tight">OneAtlas</span>
            </div>
            <p className="text-[#697386] text-sm">The AI-Native Internal Tools Platform.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-[#697386]">
              <li><Link href="#" className="hover:text-white transition">Templates</Link></li>
              <li><Link href="#" className="hover:text-white transition">Enterprise</Link></li>
              <li><Link href="#" className="hover:text-white transition">Security</Link></li>
              <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-[#697386]">
              <li><Link href="#" className="hover:text-white transition">Documentation</Link></li>
              <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition">Updates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Community</h4>
            <ul className="space-y-2 text-sm text-[#697386]">
              <li><Link href="#" className="hover:text-white transition">Discord</Link></li>
              <li><Link href="#" className="hover:text-white transition">Twitter</Link></li>
              <li><Link href="#" className="hover:text-white transition">GitHub</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
