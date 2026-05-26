'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, Plus, Trash2, ArrowRight } from 'lucide-react';

interface AppItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  config: any;
}

const PRESET_TEMPLATES = [
  { id: 'crm', name: 'AI CRM Starter', category: 'Sales', description: 'Manage leads, pipeline and customer relationships' },
  { id: 'hr', name: 'HR Dashboard', category: 'People', description: 'Track employee data, onboarding, and reviews' },
  { id: 'inventory', name: 'Inventory System', category: 'Operations', description: 'Real-time stock tracking with reorder alerts' }
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const nameParam = params.get('name');
      const promptParam = params.get('prompt');
      if (promptParam) {
        setNewAppName(nameParam || 'New App');
        setNewAppDesc(promptParam);
        setShowModal(true);
      }
    }
  }, []);

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
    if (user) fetchApps();
  }, [user]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    setCreating(true);
    setError('');
    
    try {
      const payload: any = { name: newAppName };
      if (newAppDesc) payload.description = newAppDesc;

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create application');

      if (!data.seeded) {
        try {
          await fetch(`/api/apps/${data.app.id}/seed`, { method: 'POST' });
        } catch (seedErr) {}
      }

      setCreating(false);
      setNewAppName('');
      setNewAppDesc('');
      router.push(`/app/${data.app.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate app');
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
      const res = await fetch(`/api/apps/${appId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete application');
      setApps(apps.filter((app) => app.id !== appId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <nav className="h-[72px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-[18px]">
            <div className="w-5 h-5 bg-[var(--text-primary)] text-white text-[10px] font-bold flex items-center justify-center">O</div>
            OneAtlas
          </Link>
          <div className="hidden md:flex gap-6 border-l border-[var(--border-color)] pl-6">
            <span className="text-[15px] font-semibold text-[var(--text-primary)]">Projects</span>
            <span className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors">Settings</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-[14px] font-medium text-[var(--text-primary)]">{user?.email}</div>
          <button onClick={handleLogout} className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-8 py-[80px]">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-2">Projects</h1>
            <p className="text-[15px] text-[var(--text-secondary)]">Manage your internal tools and applications.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="h-[40px] px-4 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[14px] font-semibold rounded-[8px] flex items-center gap-2 transition-transform hover:-translate-y-px"
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {error && (
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] px-4 py-3 rounded-[12px] mb-8 text-[15px]">
            {error}
          </div>
        )}

        {apps.length === 0 ? (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-[64px] text-center shadow-soft">
            <div className="w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[12px] flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
              <Database size={24} />
            </div>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">No projects yet</h2>
            <p className="text-[15px] text-[var(--text-secondary)] max-w-md mx-auto mb-8">Get started by creating a new project from scratch or choose from one of our templates.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="h-[48px] px-6 bg-[var(--text-primary)] text-white text-[15px] font-semibold rounded-[12px] transition-transform hover:-translate-y-px"
            >
              Create your first app
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[18px] p-6 flex flex-col hover:border-[#D1D5DB] hover:-translate-y-1 transition-all duration-200 shadow-soft group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded flex items-center justify-center text-[16px] font-bold text-[var(--text-primary)]">
                    {app.name.charAt(0)}
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); handleDeleteApp(app.id, app.name); }}
                    className="text-[var(--text-muted)] hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">{app.name}</h3>
                <p className="text-[15px] text-[var(--text-secondary)] flex-1 line-clamp-2">{app.description || 'No description provided'}</p>
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-[var(--border-color)]">
                  <span className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)]">Edited {new Date(app.updatedAt).toLocaleDateString()}</span>
                  <Link href={`/app/${app.id}`} className="text-[14px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)] flex items-center gap-1 transition-colors">
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-[120px]">
          <h2 className="text-[24px] font-semibold text-[var(--text-primary)] mb-8">Start with a template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRESET_TEMPLATES.map((t, idx) => (
              <div key={idx} className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[18px] p-6 hover:-translate-y-1 hover:border-[#D1D5DB] transition-all duration-200 cursor-pointer shadow-soft" onClick={() => handleApplyTemplate(t.name, t.description)}>
                <div className="mb-4">
                  <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[12px] font-semibold tracking-[0.08em] uppercase text-[var(--text-secondary)] rounded">{t.category}</span>
                </div>
                <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">{t.name}</h3>
                <p className="text-[15px] text-[var(--text-secondary)]">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create App Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] w-full max-w-lg shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Create New App</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateApp} className="p-6 space-y-5">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">Project Name</label>
                <input 
                  type="text" 
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Acme CRM"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">App Description / Prompt</label>
                <textarea 
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Describe the features, layout, and data models..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none h-32 resize-none"
                />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="h-[40px] px-4 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !newAppName.trim()}
                  className="h-[40px] px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-[8px] text-[14px] font-semibold flex items-center gap-2 transition-transform hover:-translate-y-px"
                >
                  {creating && <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                  {creating ? 'Generating AI App...' : 'Generate Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
