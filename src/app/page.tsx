'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, Search, Play, Shield, Cpu, Code2, 
  Database, Rocket, HelpCircle, Check, Menu, X, 
  ChevronDown, CheckCircle2, Star, Zap, Info, 
  ArrowUpRight, Users, Settings, Activity, Sparkles
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    id: 'sales-crm',
    name: 'Sales CRM Hub',
    category: 'CRM',
    description: 'Deals pipeline management with estimated metrics and backlog Kanban boards.',
    prompt: 'A CRM app for sales reps to manage Deals, Contacts, and Webhook followups with estimated value amounts and deal pipeline stages.',
    icon: '💼',
    color: '#635BFF',
    previewUi: {
      title: 'Sales CRM Dashboard',
      stats: [
        { label: 'Active Deals', value: '42', change: '+12%' },
        { label: 'Pipeline Value', value: '$284,500', change: '+24%' },
        { label: 'Conversion Rate', value: '18.4%', change: '+3.2%' }
      ],
      recentRecords: [
        { contact: 'Acme Corp Deal', value: '$85,000', stage: 'Negotiation' },
        { contact: 'Globex Inc Pilot', value: '$12,000', stage: 'Proposal' },
        { contact: 'Initech Agreement', value: '$45,000', stage: 'Closed Won' }
      ]
    }
  },
  {
    id: 'task-board',
    name: 'Sprint Task Board',
    category: 'Productivity',
    description: 'Sprint planning backlog and checklist manager for agile squads.',
    prompt: 'Agile project tracker to manage sprint Tasks and Checklist items, including columns for title, status, priority, and date.',
    icon: '🚀',
    color: '#FF5996',
    previewUi: {
      title: 'Sprint Board v2.4',
      stats: [
        { label: 'Sprint Progress', value: '68%', change: 'On track' },
        { label: 'Open Issues', value: '14', change: '-4' },
        { label: 'Velocity', value: '45 pts', change: '+5%' }
      ],
      recentRecords: [
        { contact: 'Refactor database client', value: 'High', stage: 'In Progress' },
        { contact: 'Setup PWA manifest script', value: 'Medium', stage: 'Code Review' },
        { contact: 'Fix auth session cookie expire', value: 'Critical', stage: 'Completed' }
      ]
    }
  },
  {
    id: 'gym-desk',
    name: 'Gym Appointment Desk',
    category: 'Operations',
    description: 'Rescheduling calendars and subscriber workout fitness targets.',
    prompt: 'A gym membership manager to log members, track session Bookings on a calendar, and list training goals with a fitness checklist.',
    icon: '🏋️',
    color: '#00D4B1',
    previewUi: {
      title: 'Fitness Hub Portal',
      stats: [
        { label: 'Active Gym Members', value: '620', change: '+8%' },
        { label: 'Classes Scheduled', value: '24 Today', change: 'Fully booked' },
        { label: 'Target Completion Rate', value: '72%', change: '+1.5%' }
      ],
      recentRecords: [
        { contact: 'Alice Smith - Booking', value: 'Personal Trainer', stage: '10:00 AM' },
        { contact: 'Bob Johnson - Goal', value: 'Cardio Target', stage: 'In Progress' },
        { contact: 'David Lee - Renewal', value: 'Monthly Pass', stage: 'Completed' }
      ]
    }
  },
  {
    id: 'restaurant-desk',
    name: 'Restaurant Reservation Desk',
    category: 'Operations',
    description: 'Dining table logs, guest numbers, and reservation bookings.',
    prompt: 'Restaurant desk dashboard to log guest Reservations, phone number, guestCount, tableNumber, and bookingDate on a reservation calendar.',
    icon: '🍽️',
    color: '#F8BC42',
    previewUi: {
      title: 'Dining Reservation Desk',
      stats: [
        { label: 'Total Covers', value: '145', change: '85% occupancy' },
        { label: 'Pending Bookings', value: '8', change: 'Action needed' },
        { label: 'Avg Party Size', value: '3.4 guests', change: 'Normal' }
      ],
      recentRecords: [
        { contact: 'Table 14 - Party of 4', value: '8:30 PM', stage: 'Seated' },
        { contact: 'Table 8 - Party of 2', value: '7:00 PM', stage: 'Arrived' },
        { contact: 'Table 21 - Party of 6', value: '9:15 PM', stage: 'Confirmed' }
      ]
    }
  },
  {
    id: 'blog-writer',
    name: 'Personal Blog Writer',
    category: 'Productivity',
    description: 'Draft articles checklist catalog, forms, and notes board.',
    prompt: 'Personal blogging platform to draft article Post ideas using sticky notes scratchpad, and manage published articles in a datatable catalog.',
    icon: '✍️',
    color: '#FFB17A',
    previewUi: {
      title: 'Content Creator Suite',
      stats: [
        { label: 'Draft Articles', value: '12', change: '3 ready' },
        { label: 'Monthly Readers', value: '45,200', change: '+15.4%' },
        { label: 'Avg Read Time', value: '4.8 mins', change: '+20s' }
      ],
      recentRecords: [
        { contact: 'Why edge runtimes are the future', value: 'Draft', stage: 'Editing' },
        { contact: 'Understanding JSONB schemas', value: 'Published', stage: 'Live' },
        { contact: 'Stripe webhook security logs', value: 'Outline', stage: 'Planning' }
      ]
    }
  },
  {
    id: 'bug-backlog',
    name: 'Bug Issue Backlog',
    category: 'CRM',
    description: 'Defect logging records, severity indicators, and sprint Kanban.',
    prompt: 'Software defect ticket backlog tracker with Kanban column workflows, ticket title, description, severity, and workflow event logs.',
    icon: '🐞',
    color: '#7A73FF',
    previewUi: {
      title: 'Bug & Defect Console',
      stats: [
        { label: 'Critical Bugs', value: '3', change: '-20%' },
        { label: 'Unassigned', value: '5', change: 'Attention' },
        { label: 'Resolve Speed', value: '4.2 hrs', change: '-45m' }
      ],
      recentRecords: [
        { contact: 'CORS policy blocks client API', value: 'Critical', stage: 'Assigned' },
        { contact: 'Mobile nav links layout shift', value: 'Minor', stage: 'Triaged' },
        { contact: 'CSV exporter parses empty dates', value: 'Major', stage: 'Resolved' }
      ]
    }
  }
];

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Prompt generator box state
  const [appName, setAppName] = useState('');
  const [appPrompt, setAppPrompt] = useState('');
  
  // Templates state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [templateSearch, setTemplateSearch] = useState('');
  const [activePreviewTemplate, setActivePreviewTemplate] = useState<any>(null);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = ['All', 'CRM', 'Operations', 'Productivity'];

  const filteredTemplates = PRESET_TEMPLATES.filter(tpl => {
    const matchesCat = selectedCategory === 'All' || tpl.category === selectedCategory;
    const matchesSearch = tpl.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
                          tpl.description.toLowerCase().includes(templateSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleLaunchApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;
    
    // Redirect with prompt and name in search params
    const params = new URLSearchParams();
    params.set('name', appName);
    if (appPrompt) params.set('prompt', appPrompt);
    router.push(`/login?${params.toString()}`);
  };

  const handleStartBuildingPreset = (template: any) => {
    const params = new URLSearchParams();
    params.set('name', template.name);
    params.set('prompt', template.prompt);
    router.push(`/login?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-brand-bg-light text-brand-text-body font-sans antialiased selection:bg-brand-primary/20 select-none">
      
      {/* Top Banner */}
      <div className="bg-brand-primary text-white text-[11px] font-bold text-center py-2 px-4 uppercase tracking-widest flex items-center justify-center gap-2 relative z-50">
        <Sparkles size={12} className="animate-pulse" />
        <span>OneAtlas MVP platform is officially live. Built on PostgreSQL JSONB resilience</span>
        <Link href="/login" className="underline hover:text-brand-accent-orange transition-colors flex items-center gap-0.5 ml-2">
          Deploy your first tool <ArrowUpRight size={10} />
        </Link>
      </div>

      {/* Header Mega Menu */}
      <header className="sticky top-0 z-40 w-full border-b border-brand-border-gray/80 glassmorphism transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl brand-gradient-bg flex items-center justify-center shadow-md shadow-brand-primary/20 group-hover:scale-105 transition-transform duration-200">
              <CompassIcon className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-brand-primary-dark tracking-tight text-xl leading-none">OneAtlas</span>
              <span className="text-[10px] text-brand-primary font-bold tracking-widest uppercase">Platform</span>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="hidden lg:flex items-center gap-1">
            
            {/* Product Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors cursor-pointer">
                Product <ChevronDown size={14} className="text-brand-text-muted group-hover:text-brand-primary transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[460px] bg-white border border-brand-border-gray shadow-xl rounded-2xl p-5 hidden group-hover:grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Builder</h4>
                  <Link href="/login" className="block p-2 hover:bg-brand-bg-slate rounded-lg transition">
                    <span className="block text-sm font-bold text-brand-primary-dark">AI App Builder</span>
                    <span className="block text-xs text-brand-text-muted mt-0.5">Scaffold complete schemas from description</span>
                  </Link>
                  <Link href="/login" className="block p-2 hover:bg-brand-bg-slate rounded-lg transition">
                    <span className="block text-sm font-bold text-brand-primary-dark">Dynamic Runtime</span>
                    <span className="block text-xs text-brand-text-muted mt-0.5">JSONB abstraction prevents migrations</span>
                  </Link>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Features</h4>
                  <Link href="/login" className="block p-2 hover:bg-brand-bg-slate rounded-lg transition">
                    <span className="block text-sm font-bold text-brand-primary-dark">CSV Import Desk</span>
                    <span className="block text-xs text-brand-text-muted mt-0.5">Dynamic PapaParse data mapping</span>
                  </Link>
                  <Link href="/login" className="block p-2 hover:bg-brand-bg-slate rounded-lg transition">
                    <span className="block text-sm font-bold text-brand-primary-dark">Workflow Engine</span>
                    <span className="block text-xs text-brand-text-muted mt-0.5">Automate webhooks and record triggers</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Use Cases Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors cursor-pointer">
                Use Cases <ChevronDown size={14} className="text-brand-text-muted group-hover:text-brand-primary transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[260px] bg-white border border-brand-border-gray shadow-xl rounded-2xl p-3 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-150">
                <Link href="/login" className="block p-2.5 hover:bg-brand-bg-slate rounded-lg transition">
                  <span className="block text-sm font-bold text-brand-primary-dark">Internal Tools</span>
                  <span className="block text-xs text-brand-text-muted">Operations and admin interfaces</span>
                </Link>
                <Link href="/login" className="block p-2.5 hover:bg-brand-bg-slate rounded-lg transition">
                  <span className="block text-sm font-bold text-brand-primary-dark">Custom CRUD Panels</span>
                  <span className="block text-xs text-brand-text-muted">Structured list & entry forms</span>
                </Link>
                <Link href="/login" className="block p-2.5 hover:bg-brand-bg-slate rounded-lg transition">
                  <span className="block text-sm font-bold text-brand-primary-dark">Business Dashboards</span>
                  <span className="block text-xs text-brand-text-muted">Metrics and status visualization</span>
                </Link>
              </div>
            </div>

            {/* Templates Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors cursor-pointer">
                Templates <ChevronDown size={14} className="text-brand-text-muted group-hover:text-brand-primary transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[560px] bg-white border border-brand-border-gray shadow-xl rounded-2xl p-5 hidden group-hover:grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-brand-primary uppercase tracking-wider pb-1">Operational</span>
                  {PRESET_TEMPLATES.filter(t => t.category === 'Operations').map((t, idx) => (
                    <button key={idx} onClick={() => handleStartBuildingPreset(t)} className="block w-full text-left p-1.5 hover:bg-brand-bg-slate rounded text-xs font-semibold text-brand-primary-dark transition">
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-brand-accent-pink uppercase tracking-wider pb-1">Productivity</span>
                  {PRESET_TEMPLATES.filter(t => t.category === 'Productivity').map((t, idx) => (
                    <button key={idx} onClick={() => handleStartBuildingPreset(t)} className="block w-full text-left p-1.5 hover:bg-brand-bg-slate rounded text-xs font-semibold text-brand-primary-dark transition">
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <span className="block text-xs font-bold text-brand-accent-green uppercase tracking-wider pb-1">Relations</span>
                  {PRESET_TEMPLATES.filter(t => t.category === 'CRM').map((t, idx) => (
                    <button key={idx} onClick={() => handleStartBuildingPreset(t)} className="block w-full text-left p-1.5 hover:bg-brand-bg-slate rounded text-xs font-semibold text-brand-primary-dark transition">
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Link href="#pricing" className="px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors">Enterprise</Link>
            <Link href="#why-atlas" className="px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors">Security</Link>
            <Link href="#pricing" className="px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors">Pricing</Link>
            
            {/* Resources Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors cursor-pointer">
                Resources <ChevronDown size={14} className="text-brand-text-muted group-hover:text-brand-primary transition-transform duration-200 group-hover:rotate-180" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[200px] bg-white border border-brand-border-gray shadow-xl rounded-2xl p-2 hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-150">
                <Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="block p-2 hover:bg-brand-bg-slate rounded-lg text-sm font-semibold text-brand-primary-dark transition">Documentation</Link>
                <Link href="#why-atlas" className="block p-2 hover:bg-brand-bg-slate rounded-lg text-sm font-semibold text-brand-primary-dark transition">API Reference</Link>
                <Link href="#why-atlas" className="block p-2 hover:bg-brand-bg-slate rounded-lg text-sm font-semibold text-brand-primary-dark transition">Help Center</Link>
              </div>
            </div>
            
            <Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="px-4 py-2 text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors">Community</Link>
          </nav>

          {/* Desktop Right Side CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-brand-text-heading hover:text-brand-primary transition-colors">
              Login
            </Link>
            <Link href="/login" className="bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold px-5 py-3 rounded-xl transition duration-200 shadow-md shadow-brand-primary/20 uppercase tracking-wider">
              Start Building
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden text-brand-text-heading hover:text-brand-primary transition p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-brand-border-gray px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <Link href="/login" className="p-3 bg-brand-bg-slate rounded-xl block text-center" onClick={() => setMobileMenuOpen(false)}>
                <span className="block text-sm font-bold text-brand-primary-dark">AI App Builder</span>
              </Link>
              <Link href="/login" className="p-3 bg-brand-bg-slate rounded-xl block text-center" onClick={() => setMobileMenuOpen(false)}>
                <span className="block text-sm font-bold text-brand-primary-dark">CSV Import Desk</span>
              </Link>
            </div>
            <div className="border-t border-brand-border-gray/65 pt-4 space-y-2">
              <Link href="#templates" className="block py-2 text-sm font-semibold text-brand-text-heading" onClick={() => setMobileMenuOpen(false)}>Templates</Link>
              <Link href="#pricing" className="block py-2 text-sm font-semibold text-brand-text-heading" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
              <Link href="#why-atlas" className="block py-2 text-sm font-semibold text-brand-text-heading" onClick={() => setMobileMenuOpen(false)}>Why OneAtlas</Link>
              <Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="block py-2 text-sm font-semibold text-brand-text-heading" onClick={() => setMobileMenuOpen(false)}>GitHub Docs</Link>
            </div>
            <div className="border-t border-brand-border-gray/65 pt-4 flex flex-col gap-3">
              <Link href="/login" className="text-center py-3 font-semibold text-brand-text-heading" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link href="/login" className="bg-brand-primary text-white text-center py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider" onClick={() => setMobileMenuOpen(false)}>
                Start Building Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="relative">
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-1/10 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 right-1/10 w-[500px] h-[500px] bg-brand-accent-pink/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Hero Section */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-28 text-center space-y-12">
          
          <div className="inline-flex items-center gap-2 bg-brand-accent-purple/70 border border-brand-primary/20 px-4 py-1.5 rounded-full text-brand-primary text-xs font-bold uppercase tracking-widest shadow-sm">
            <Zap size={12} className="fill-current" />
            <span>AI-Native Internal Tools Platform</span>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black text-brand-primary-dark tracking-tight leading-[1.05] uppercase">
              Software built at the<br />
              <span className="brand-gradient-text">speed of thought.</span>
            </h1>
            <p className="text-brand-text-body text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              OneAtlas generates robust relational databases, secure APIs, and responsive React grid dashboards instantly. Zero migrations. Edge deployment in 60 seconds.
            </p>
          </div>

          {/* Interactive Console Mock / Input form */}
          <div className="max-w-3xl mx-auto bg-white border border-brand-border-gray p-3 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 relative group">
            
            <div className="absolute -inset-0.5 brand-gradient-bg rounded-[18px] opacity-10 group-hover:opacity-20 blur-sm transition-opacity duration-300 pointer-events-none"></div>
            
            <form onSubmit={handleLaunchApp} className="relative bg-white rounded-xl flex flex-col md:flex-row gap-2.5 p-1.5">
              
              <div className="flex-1 flex flex-col md:flex-row gap-2 border border-brand-border-light rounded-xl p-2 bg-brand-bg-slate/50">
                <input 
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="App Name (e.g. Sales CRM)"
                  className="md:w-2/5 bg-transparent text-brand-primary-dark font-bold text-sm px-3 py-2 outline-none border-b md:border-b-0 md:border-r border-brand-border-gray placeholder:text-brand-text-muted/70"
                />
                <input 
                  type="text"
                  value={appPrompt}
                  onChange={(e) => setAppPrompt(e.target.value)}
                  placeholder="Describe your internal tool features..."
                  className="flex-1 bg-transparent text-brand-text-body font-medium text-sm px-3 py-2 outline-none placeholder:text-brand-text-muted/70"
                />
              </div>

              <button 
                type="submit"
                className="brand-gradient-bg text-white hover:opacity-95 px-7 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition duration-150 whitespace-nowrap shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Generate Instantly</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

          {/* Tiny details below console */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-brand-text-muted font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand-accent-green" /> PostgreSQL JSONB Resilience</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand-accent-green" /> Zero-Migration Architecture</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-brand-accent-green" /> Standalone GitHub Exporter</span>
          </div>
        </section>

        {/* AI Models Marquee Slider */}
        <section className="bg-brand-bg-slate border-y border-brand-border-gray py-8 overflow-hidden relative z-10">
          <div className="max-w-7xl mx-auto px-6 mb-4 flex justify-between items-center">
            <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Multi-Provider AI Orchestration</span>
            <span className="text-[10px] font-bold text-brand-text-muted uppercase">Edge Routing Enabled</span>
          </div>

          <div className="flex w-[200%] md:w-[150%] lg:w-[100%] animate-marquee whitespace-nowrap gap-12 items-center py-2">
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🤖 OPENAI GPT-4o-MINI</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">⚡ ANTHROPIC CLAUDE 3.5</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">✨ GOOGLE GEMINI 1.5 PRO</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🌀 DEEPSEEK R1 & V3</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🚀 ALIBABA CLOUD QWEN 2.5</span>
            {/* Repeated for loop smoothness */}
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🤖 OPENAI GPT-4o-MINI</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">⚡ ANTHROPIC CLAUDE 3.5</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">✨ GOOGLE GEMINI 1.5 PRO</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🌀 DEEPSEEK R1 & V3</span>
            <span className="text-brand-primary-dark font-black text-lg tracking-wider opacity-60 hover:opacity-100 transition-opacity">🚀 ALIBABA CLOUD QWEN 2.5</span>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="max-w-7xl mx-auto px-6 py-24 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-brand-primary-dark uppercase tracking-tight">How OneAtlas Works</h2>
            <p className="text-brand-text-body font-medium">A state-of-the-art engine designed to turn requirements into dynamic web environments instantly.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-4 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">01</div>
              <h3 className="text-lg font-bold text-brand-primary-dark">Prompt Input</h3>
              <p className="text-brand-text-muted text-sm font-medium">Describe your data tables, fields, and workflow triggers using natural language.</p>
            </div>

            <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-4 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-lg bg-brand-accent-pink/10 text-brand-accent-pink flex items-center justify-center font-bold text-sm">02</div>
              <h3 className="text-lg font-bold text-brand-primary-dark">Strict Scaffolding</h3>
              <p className="text-brand-text-muted text-sm font-medium">AI compiles descriptions into strict structured schemas matching your models.</p>
            </div>

            <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-4 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-lg bg-brand-accent-teal/10 text-brand-accent-teal flex items-center justify-center font-bold text-sm">03</div>
              <h3 className="text-lg font-bold text-brand-primary-dark">Resilient Seeding</h3>
              <p className="text-brand-text-muted text-sm font-medium">The dynamic JSONB backend maps columns and populates seed rows without schema lock.</p>
            </div>

            <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-4 hover:shadow-lg transition">
              <div className="w-10 h-10 rounded-lg bg-brand-accent-yellow/10 text-brand-accent-yellow flex items-center justify-center font-bold text-sm">04</div>
              <h3 className="text-lg font-bold text-brand-primary-dark">Edge Deployment</h3>
              <p className="text-brand-text-muted text-sm font-medium">Deploy as a standalone PWA or export a complete React Next.js project to GitHub.</p>
            </div>

          </div>
        </section>

        {/* Templates Grid Section (Base44 Component) */}
        <section id="templates" className="bg-brand-bg-slate border-y border-brand-border-gray py-24">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Built-in Registry</span>
                <h2 className="text-3xl md:text-4xl font-black text-brand-primary-dark uppercase">Browse Startup Templates</h2>
                <p className="text-brand-text-body text-sm font-medium">Select a premade template to instantiate instantly, or customize them to fit your business requirements.</p>
              </div>

              {/* Template Category Browser & Search */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex bg-white border border-brand-border-gray rounded-xl p-1 shadow-sm">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-brand-primary text-white' 
                          : 'text-brand-text-muted hover:text-brand-primary-dark'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full sm:w-60 bg-white border border-brand-border-gray px-4 py-2.5 pl-9 rounded-xl text-xs font-semibold text-brand-primary-dark placeholder:text-brand-text-muted focus:outline-none focus:border-brand-primary"
                  />
                  <Search size={14} className="absolute left-3 top-3.5 text-brand-text-muted" />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredTemplates.map((tpl) => (
                <div 
                  key={tpl.id}
                  className="bg-white border border-brand-border-gray rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm"
                      style={{ backgroundColor: `${tpl.color}15`, color: tpl.color }}
                    >
                      {tpl.icon}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-extrabold text-brand-primary-dark group-hover:text-brand-primary transition-colors">{tpl.name}</h3>
                      <span className="inline-block text-[9px] bg-brand-bg-blue border border-brand-border-gray px-2 py-0.5 rounded text-brand-primary font-bold uppercase tracking-wider">{tpl.category}</span>
                    </div>
                    <p className="text-sm text-brand-text-muted leading-relaxed font-medium">{tpl.description}</p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-brand-border-light flex gap-3">
                    <button 
                      onClick={() => handleStartBuildingPreset(tpl)}
                      className="flex-1 bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider text-center"
                    >
                      Use Template
                    </button>
                    <button 
                      onClick={() => setActivePreviewTemplate(tpl)}
                      className="px-3.5 py-2.5 bg-brand-bg-slate hover:bg-brand-border-light text-brand-primary-dark border border-brand-border-gray rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
                    >
                      Preview UI
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Feature Comparison Matrix (Base44 Specs) */}
        <section className="max-w-7xl mx-auto px-6 py-24 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold text-brand-accent-pink uppercase tracking-widest">Platform Evaluation</span>
            <h2 className="text-3xl md:text-4xl font-black text-brand-primary-dark uppercase">How OneAtlas Compares</h2>
            <p className="text-brand-text-body font-medium">Why developers and enterprises choose our resilient model-driven architecture.</p>
          </div>

          <div className="border border-brand-border-gray rounded-2xl overflow-hidden shadow-md bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-bg-slate border-b border-brand-border-gray text-brand-primary-dark text-xs font-bold uppercase tracking-wider">
                    <th className="p-5">Architectural Feature</th>
                    <th className="p-5">Traditional Platforms (Lovable / Bolt)</th>
                    <th className="p-5">OneAtlas Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border-light text-sm font-semibold text-brand-text-body">
                  <tr>
                    <td className="p-5 font-bold text-brand-primary-dark">Database Migrations</td>
                    <td className="p-5 text-brand-text-muted">Rigid Prisma schemas triggering destructive SQL commands on updates</td>
                    <td className="p-5 bg-brand-accent-teal/5 text-brand-primary-dark flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-brand-accent-green mt-0.5 shrink-0" />
                      <span><strong>PostgreSQL JSONB:</strong> 100% schema resilience prevents breaking changes or runtime lockups.</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-brand-primary-dark">Deployment Method</td>
                    <td className="p-5 text-brand-text-muted">Manual setup or routing via traditional paths (slower latency)</td>
                    <td className="p-5 bg-brand-accent-teal/5 text-brand-primary-dark flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-brand-accent-green mt-0.5 shrink-0" />
                      <span><strong>Edge Subdomains:</strong> Direct isolated cloud hosting (e.g. <code>ops.oneatlas.app</code>) under 60s.</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-brand-primary-dark">Data Import</td>
                    <td className="p-5 text-brand-text-muted">Manual typing or raw JSON API uploads</td>
                    <td className="p-5 bg-brand-accent-teal/5 text-brand-primary-dark flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-brand-accent-green mt-0.5 shrink-0" />
                      <span><strong>PapaParse CSV Grid:</strong> Batch upload directly to JSONB engine with active field mapping.</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-5 font-bold text-brand-primary-dark">Orchestration</td>
                    <td className="p-5 text-brand-text-muted">Bound to single LLM model (vulnerable to rate limits & outages)</td>
                    <td className="p-5 bg-brand-accent-teal/5 text-brand-primary-dark flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-brand-accent-green mt-0.5 shrink-0" />
                      <span><strong>AI Gateway Layer:</strong> Centralized routing, structured caching, and local NLP fallback parser.</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Roadmap Section (Investor Workbook Specs) */}
        <section className="bg-brand-bg-slate border-y border-brand-border-gray py-24">
          <div className="max-w-4xl mx-auto px-6 space-y-16">
            
            <div className="text-center space-y-4">
              <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Growth Plan</span>
              <h2 className="text-3xl md:text-4xl font-black text-brand-primary-dark uppercase">Engineering Roadmap</h2>
              <p className="text-brand-text-body font-medium">Strategic execution timeline based on the OneAtlas Investor Workbook.</p>
            </div>

            <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-border-gray">
              
              {/* Phase 1 */}
              <div className="relative pl-14">
                <div className="absolute left-4 top-1.5 w-4.5 h-4.5 rounded-full bg-brand-primary border-4 border-white shadow-sm"></div>
                <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-2 hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-brand-primary-dark">Phase 1: Core MVP (P0)</h3>
                    <span className="text-[10px] bg-brand-accent-purple text-brand-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">In Progress</span>
                  </div>
                  <p className="text-brand-text-muted text-sm font-medium">Conversational app builder, standardized Cloudflare/Neon runtime, built-in email auth, resilient PostgreSQL schema generator, and subdomain deploy.</p>
                </div>
              </div>

              {/* Phase 1.5 */}
              <div className="relative pl-14">
                <div className="absolute left-4 top-1.5 w-4.5 h-4.5 rounded-full bg-brand-text-muted border-4 border-white shadow-sm"></div>
                <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-2 hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-brand-primary-dark">Phase 1.5: Workspace & Editing (P1)</h3>
                    <span className="text-[10px] bg-brand-bg-blue text-brand-text-muted font-bold px-2 py-0.5 rounded uppercase tracking-wider">Planned</span>
                  </div>
                  <p className="text-brand-text-muted text-sm font-medium">Interactive spreadsheet-like visual database editor, undo/redo versions history log, template registry directory, and workspace AI context memory.</p>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="relative pl-14">
                <div className="absolute left-4 top-1.5 w-4.5 h-4.5 rounded-full bg-brand-text-muted border-4 border-white shadow-sm"></div>
                <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-2 hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-brand-primary-dark">Phase 2: Growth & Automation (P1)</h3>
                    <span className="text-[10px] bg-brand-bg-blue text-brand-text-muted font-bold px-2 py-0.5 rounded uppercase tracking-wider">Planned</span>
                  </div>
                  <p className="text-brand-text-muted text-sm font-medium">Native webhook workflow automation triggers, Stripe subscriptions payment endpoints, Resend transactional emails, and cron-job background executors.</p>
                </div>
              </div>

              {/* Phase 3+ */}
              <div className="relative pl-14">
                <div className="absolute left-4 top-1.5 w-4.5 h-4.5 rounded-full bg-brand-text-muted border-4 border-white shadow-sm"></div>
                <div className="bg-white border border-brand-border-gray p-6 rounded-2xl space-y-2 hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-brand-primary-dark">Phase 3 & 4: Self-Healing & API Ecosystem (P2)</h3>
                    <span className="text-[10px] bg-brand-bg-blue text-brand-text-muted font-bold px-2 py-0.5 rounded uppercase tracking-wider">Planned</span>
                  </div>
                  <p className="text-brand-text-muted text-sm font-medium">Self-healing runtime with auto error detection, multi-agent AI orchestration pipeline, public developer APIs, and plugin marketplaces.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Why OneAtlas & FAQs Accordion */}
        <section id="why-atlas" className="max-w-5xl mx-auto px-6 py-24 space-y-20">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-brand-primary-dark uppercase">Why developers choose OneAtlas</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-accent-teal/10 text-brand-accent-teal flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                  <div>
                    <h4 className="font-bold text-brand-primary-dark text-sm">Resilient JSONB Storage Engine</h4>
                    <p className="text-brand-text-muted text-xs font-semibold">Changes are instantly stored without breaking active rows or forcing DB rebuilds.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-accent-teal/10 text-brand-accent-teal flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                  <div>
                    <h4 className="font-bold text-brand-primary-dark text-sm">Centralized AI Gateway</h4>
                    <p className="text-brand-text-muted text-xs font-semibold">Automatic model fallback ensures 100% generation uptime even if OpenAI is overloaded.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-brand-accent-teal/10 text-brand-accent-teal flex items-center justify-center shrink-0 mt-1"><Check size={12} /></div>
                  <div>
                    <h4 className="font-bold text-brand-primary-dark text-sm">Automated Subdomain Edge Router</h4>
                    <p className="text-brand-text-muted text-xs font-semibold">We isolate your project runtime and host on unique low-latency edge nodes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-bg-slate border border-brand-border-gray p-8 rounded-2xl space-y-4 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold"><Star size={18} /></div>
                <div>
                  <h4 className="font-bold text-brand-primary-dark text-sm">Overdelivering Value</h4>
                  <span className="text-[10px] text-brand-primary font-bold">4 Complete Subsystems Active</span>
                </div>
              </div>
              <p className="text-brand-text-muted text-xs font-semibold leading-relaxed">
                Rather than simple mock layouts, OneAtlas MVP delivers active database operations, PapaParse spreadsheet parser, dynamic event triggers, and automated Next.js repository compilation.
              </p>
              <div className="pt-4 border-t border-brand-border-gray">
                <Link href="/login" className="text-xs font-bold text-brand-primary hover:text-brand-primary-light flex items-center gap-1">
                  Access console now <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* FAQs Accordion */}
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-brand-primary-dark uppercase">Frequently Asked Questions</h3>
              <p className="text-brand-text-muted text-sm font-semibold">Get answers to the core architectural mechanisms.</p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              
              {[
                {
                  q: "What is PostgreSQL JSONB resilience?",
                  a: "Unlike traditional ORM setups which push database table alter commands (e.g. Prisma migrations) whenever columns change, OneAtlas isolates records in a highly indexable PostgreSQL JSONB document engine. This allows schemas to mutate on-the-fly without data loss."
                },
                {
                  q: "How does the AI Gateway prevent provider outages?",
                  a: "Our core scaffolder engine intercepts API requests, routes queries dynamically to active models (Gemini, Claude, GPT), tracks tokens, and implements a zero-template native fallback parser in case upstream APIs rate limit."
                },
                {
                  q: "Can I export my generated application to GitHub?",
                  a: "Yes! The standalone GitHub Exporter compiles the active JSON schema configurations into structured React, Next.js, and Prisma repository files and publishes them directly to your repository using Octokit API integration."
                },
                {
                  q: "What is the PapaParse CSV import tool?",
                  a: "It's a built-in spreadsheet parser that allows you to upload physical tables, dynamically select column mapping to virtual schemas, and insert batches cleanly into the Postgres layer."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-white border border-brand-border-gray rounded-xl overflow-hidden transition-all duration-200">
                  <button 
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-5 py-4 text-left flex justify-between items-center text-brand-primary-dark font-bold text-sm cursor-pointer hover:bg-brand-bg-slate"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className={`text-brand-text-muted transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-5 pt-1 text-xs text-brand-text-muted font-medium leading-relaxed border-t border-brand-border-light bg-brand-bg-slate/30 animate-in fade-in slide-in-from-top-1 duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="bg-brand-primary-navy border-t border-white/5 text-white/60 py-16 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-10">
          
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center text-white font-bold"><CompassIcon className="w-4.5 h-4.5 text-white" /></div>
              <span className="font-extrabold text-white text-base tracking-tight">OneAtlas</span>
            </div>
            <p className="text-white/40 max-w-sm leading-relaxed font-semibold">
              The AI-Native platform for building cost-efficient, serverless-first, multi-tenant enterprise tools.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Product</h4>
            <ul className="space-y-2 font-semibold">
              <li><Link href="/login" className="hover:text-white transition">AI Scaffolder</Link></li>
              <li><Link href="/login" className="hover:text-white transition">JSONB Runtime</Link></li>
              <li><Link href="/login" className="hover:text-white transition">CSV Data Loader</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Workflow Logs</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Resources</h4>
            <ul className="space-y-2 font-semibold">
              <li><Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="hover:text-white transition">Documentation</Link></li>
              <li><Link href="#why-atlas" className="hover:text-white transition">Security Page</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition">Pricing Plans</Link></li>
              <li><Link href="#why-atlas" className="hover:text-white transition">System Status</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Community</h4>
            <ul className="space-y-2 font-semibold">
              <li><Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="hover:text-white transition">GitHub Repo</Link></li>
              <li><Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="hover:text-white transition">Discord Server</Link></li>
              <li><Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="hover:text-white transition">LinkedIn</Link></li>
              <li><Link href="https://github.com/iam-bhargav-s/AI-App-Generator" target="_blank" className="hover:text-white transition">Twitter / X</Link></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 font-semibold">
          <span>&copy; {new Date().getFullYear()} OneAtlas.dev Platform. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="#why-atlas" className="hover:text-white transition">Terms of Service</Link>
            <Link href="#why-atlas" className="hover:text-white transition">Privacy Policy</Link>
          </div>
        </div>
      </footer>

      {/* Preset Preview UI Modal */}
      {activePreviewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-brand-border-gray rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-brand-border-light flex justify-between items-center bg-brand-bg-slate">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activePreviewTemplate.icon}</span>
                <div>
                  <h3 className="font-extrabold text-brand-primary-dark text-base">{activePreviewTemplate.name}</h3>
                  <span className="text-[10px] text-brand-primary font-bold uppercase tracking-widest">{activePreviewTemplate.category} Template</span>
                </div>
              </div>
              <button 
                onClick={() => setActivePreviewTemplate(null)}
                className="p-1 text-brand-text-muted hover:text-brand-primary-dark hover:bg-brand-border-light rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Custom UI Simulation */}
            <div className="p-6 space-y-6 bg-brand-bg-light">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Simulated Workspace: {activePreviewTemplate.previewUi.title}</h4>
                <div className="grid grid-cols-3 gap-3">
                  {activePreviewTemplate.previewUi.stats.map((s: any, idx: number) => (
                    <div key={idx} className="bg-white border border-brand-border-gray p-3.5 rounded-xl space-y-1">
                      <span className="block text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">{s.label}</span>
                      <span className="block text-lg font-black text-brand-primary-dark">{s.value}</span>
                      <span className="block text-[9px] text-brand-accent-green font-bold">{s.change}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider">Simulated Records</h4>
                <div className="bg-white border border-brand-border-gray rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px] font-semibold">
                    <thead>
                      <tr className="bg-brand-bg-slate border-b border-brand-border-gray text-brand-primary-dark text-[9px] uppercase tracking-wider">
                        <th className="p-3">Record Identifier</th>
                        <th className="p-3">Metrics / Field Value</th>
                        <th className="p-3">Status / Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border-light text-brand-text-body">
                      {activePreviewTemplate.previewUi.recentRecords.map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-brand-primary-dark">{r.contact}</td>
                          <td className="p-3 text-brand-text-muted">{r.value}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] bg-brand-accent-purple text-brand-primary font-bold uppercase tracking-wider">{r.stage}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-brand-primary/5 border border-brand-primary/10 p-3 rounded-xl flex gap-2">
                <Info size={16} className="text-brand-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-brand-primary font-bold leading-normal">
                  All templates instantiate within our zero-migration PostgreSQL JSONB document database context. Pressing "Use Template" below will seed this structure instantly.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-brand-border-light bg-brand-bg-slate flex justify-end gap-3">
              <button 
                onClick={() => setActivePreviewTemplate(null)}
                className="px-4 py-2 border border-brand-border-gray bg-white text-brand-primary-dark hover:bg-brand-bg-slate rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              <button 
                onClick={() => handleStartBuildingPreset(activePreviewTemplate)}
                className="bg-brand-primary hover:bg-brand-primary-light text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
              >
                Instantiate Template
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Simple Inline CompassIcon Component
function CompassIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

