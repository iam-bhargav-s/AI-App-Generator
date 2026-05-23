'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AppItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  config: any;
}

const PRESET_TEMPLATES = [
  {
    name: 'Sales CRM Hub',
    description: 'Deals pipeline management with estimated metrics and backlog Kanban boards.',
    prompt: 'A CRM app for sales reps to manage Deals, Contacts, and Webhook followups with estimated value amounts and deal pipeline stages.',
    icon: '💼'
  },
  {
    name: 'Sprint Task Board',
    description: 'Sprint planning backlog and checklist checklist manager for agile squads.',
    prompt: 'Agile project tracker to manage sprint Tasks and Checklist items, including columns for title, status, priority, and date.',
    icon: '🚀'
  },
  {
    name: 'Gym Appointment desk',
    description: 'Rescheduling calendars and subscriber workout fitness targets.',
    prompt: 'A gym membership manager to log members, track session Bookings on a calendar, and list training goals with a fitness checklist.',
    icon: '🏋️'
  },
  {
    name: 'Restaurant Reservation Desk',
    description: 'Dining table logs, guest numbers, and reservation bookings.',
    prompt: 'Restaurant desk dashboard to log guest Reservations, phone number, guestCount, tableNumber, and bookingDate on a reservation calendar.',
    icon: '🍽️'
  },
  {
    name: 'Personal Blog Writer',
    description: 'Draft articles checklist catalog, forms, and notes board.',
    prompt: 'Personal blogging platform to draft article Post ideas using sticky notes scratchpad, and manage published articles in a datatable catalog.',
    icon: '✍️'
  },
  {
    name: 'Bug Issue Backlog',
    description: 'Defect logging records, severity indicators, and sprint Kanban.',
    prompt: 'Software defect ticket backlog tracker with Kanban column workflows, ticket title, description, severity, and workflow event logs.',
    icon: '🐞'
  }
];

const PROMPT_SUGGESTIONS = [
  { label: 'Asset Tracker', text: 'IT Asset manager to register equipment, serialNumber, price:Float, and stockCount:Int.' },
  { label: 'Patient Clinic App', text: 'Clinic scheduler to log doctor appointments, date, email, and symptom checklists.' },
  { label: 'Student Course Desk', text: 'Academic course manager with students, gpa:Float, and class calendar schedules.' },
  { label: 'Personal Expense App', text: 'Personal budget tracker logging income, category, expense cost:Float, and date.' }
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // App Creation Modal State
  const [showModal, setShowModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (err: any) {
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchApps();
    }
  }, [user]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAppName,
          description: newAppDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create application');

      router.push(`/app/${data.app.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create app');
      setCreating(false);
    }
  };

  const handleApplyTemplate = (name: string, prompt: string) => {
    setNewAppName(name);
    setNewAppDesc(prompt);
    setShowModal(true);
  };

  const handleDeleteApp = async (appId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete application');
      }

      setApps(apps.filter((app) => app.id !== appId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete app');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 relative font-sans selection:bg-emerald-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-bold text-black text-sm">A</span>
            </div>
            <span className="font-semibold tracking-tight text-white text-sm">AppEngine</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-zinc-400">Welcome, <span className="text-white">{user?.name || user?.email}</span></span>
            <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white transition">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-24">
        
        {/* Hero Section */}
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
            Build your next app<br />
            <span className="text-emerald-400">at the speed of thought.</span>
          </h1>
          <p className="text-lg text-zinc-400">
            Describe what you want to build. Our AI engine generates the database, API, and UI components instantly.
          </p>

          <div className="bg-[#111] border border-white/10 p-2 rounded-2xl flex flex-col md:flex-row shadow-2xl focus-within:border-emerald-500/50 transition-all gap-2 relative">
            <input 
              type="text"
              value={newAppName}
              onChange={(e) => setNewAppName(e.target.value)}
              placeholder="App Name (e.g. Acme CRM)"
              className="md:w-1/3 bg-transparent text-white px-4 py-3 outline-none border-b md:border-b-0 md:border-r border-white/10 text-sm placeholder:text-zinc-600"
            />
            <input 
              type="text"
              value={newAppDesc}
              onChange={(e) => setNewAppDesc(e.target.value)}
              placeholder="Describe the features (e.g. manage users and deals)..."
              className="flex-1 bg-transparent text-white px-4 py-3 outline-none text-sm placeholder:text-zinc-600"
              onKeyDown={(e) => { if(e.key === 'Enter') handleCreateApp(e as any); }}
            />
            <button 
              onClick={handleCreateApp}
              disabled={creating || !newAppName.trim()}
              className="bg-white text-black hover:bg-zinc-200 disabled:opacity-50 px-6 py-3 rounded-xl font-medium text-sm transition whitespace-nowrap"
            >
              {creating ? 'Generating...' : 'Generate App'}
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="text-xs text-zinc-500 py-1.5">Try:</span>
            {PROMPT_SUGGESTIONS.map((sug, idx) => (
               <button key={idx} onClick={() => {setNewAppName(sug.label); setNewAppDesc(sug.text);}} className="text-xs text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition border border-white/5">
                 {sug.label}
               </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-6 py-4 rounded-xl text-center max-w-xl mx-auto">
            {error}
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-16">
          
          {/* Apps Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-lg font-semibold text-white">Your Projects</h2>
            </div>

            {apps.length === 0 ? (
              <div className="bg-[#111] border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <h3 className="text-base font-medium text-white mb-2">No projects yet</h3>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto">
                  Get started by typing a prompt above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {apps.map((app) => (
                  <div key={app.id} className="bg-[#111] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all flex flex-col justify-between group">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-emerald-400 font-bold border border-white/5">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <h3 className="text-base font-medium text-white mb-1 group-hover:text-emerald-400 transition">{app.name}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2">{app.description || 'Custom generated application.'}</p>
                    </div>
                    
                    <div className="mt-6 flex items-center gap-2">
                      <button onClick={() => router.push(`/app/${app.id}`)} className="flex-1 bg-white hover:bg-zinc-200 text-black font-medium text-sm py-2 rounded-lg transition text-center">
                        Open
                      </button>
                      <button onClick={() => router.push(`/app/${app.id}/editor`)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition">
                        Config
                      </button>
                      <button onClick={() => handleDeleteApp(app.id, app.name)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
