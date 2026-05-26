'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppItem {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  config: any;
}

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
      const payload: any = { name: newAppName };
      if (newAppDesc) payload.description = newAppDesc;

      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create application');
      }

      // Generate seed data in a separate API call
      try {
        await fetch(`/api/apps/${data.app.id}/seed`, { method: 'POST' });
      } catch (seedErr) {
        console.error('Non-fatal error seeding data:', seedErr);
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
      <div className="flex min-h-screen bg-[#FAFBFF] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#635BFF]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#425466] font-sans selection:bg-[#635BFF]/20">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E3E8EE]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center shadow-sm">
                <span className="font-bold text-white text-sm">O</span>
              </div>
              <span className="font-bold text-[#0A2540] text-lg tracking-tight">OneAtlas</span>
            </Link>
            <div className="hidden md:flex gap-4 border-l border-[#E3E8EE] pl-6">
              <span className="text-sm font-medium text-[#0A2540]">Projects</span>
              <span className="text-sm font-medium text-[#697386] hover:text-[#0A2540] cursor-pointer transition">Settings</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-[#EFF3F8] text-[#635BFF] flex items-center justify-center font-bold text-sm">
              {user?.name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <button onClick={handleLogout} className="text-sm font-medium text-[#697386] hover:text-[#0A2540] transition">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#0A2540] mb-2">Projects</h1>
            <p className="text-[#697386]">Manage your internal tools and applications.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-[#635BFF] hover:bg-[#5249E5] text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
          >
            Create Project
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-8">
            {error}
          </div>
        )}

        {apps.length === 0 ? (
          <div className="bg-white border border-[#E3E8EE] rounded-xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#EFF3F8] text-[#635BFF] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <h2 className="text-xl font-bold text-[#0A2540] mb-2">No projects yet</h2>
            <p className="text-[#697386] max-w-md mx-auto mb-8">Get started by creating a new project from scratch or choose from one of our templates.</p>
            <button 
              onClick={() => setShowModal(true)}
              className="bg-[#635BFF] hover:bg-[#5249E5] text-white px-6 py-2.5 rounded-lg font-medium transition shadow-sm"
            >
              Create your first app
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="bg-white border border-[#E3E8EE] rounded-xl overflow-hidden hover:shadow-md hover:border-[#635BFF]/50 transition group flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#EFF3F8] text-[#635BFF] flex items-center justify-center font-bold text-lg">
                      {app.name.charAt(0)}
                    </div>
                    <button 
                      onClick={() => handleDeleteApp(app.id, app.name)}
                      className="text-[#697386] hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-[#0A2540] mb-2 truncate">{app.name}</h3>
                  <p className="text-sm text-[#697386] line-clamp-2">{app.description || 'No description provided'}</p>
                </div>
                <div className="px-6 py-4 border-t border-[#E3E8EE] bg-[#FAFBFF] flex justify-between items-center">
                  <span className="text-xs font-medium text-[#697386]">Edited {new Date(app.updatedAt).toLocaleDateString()}</span>
                  <Link href={`/app/${app.id}`} className="text-sm font-medium text-[#635BFF] hover:text-[#0A2540] transition">
                    Open Builder →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-[#0A2540] mb-8">Start with a template</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRESET_TEMPLATES.map((t, idx) => (
              <div key={idx} className="bg-white border border-[#E3E8EE] rounded-xl p-6 hover:shadow-md hover:border-[#635BFF]/50 transition cursor-pointer" onClick={() => handleApplyTemplate(t.name, t.description)}>
                <div className="flex justify-between items-start mb-4">
                  <span className="inline-block px-2.5 py-1 bg-[#EFF3F8] text-xs font-semibold text-[#0A2540] rounded-md">{t.category}</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A2540] mb-2">{t.name}</h3>
                <p className="text-sm text-[#697386] line-clamp-2">{t.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Create App Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2540]/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#E3E8EE] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E3E8EE] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#0A2540]">Create New App</h3>
              <button onClick={() => setShowModal(false)} className="text-[#697386] hover:text-[#0A2540]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateApp} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#425466] mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Acme CRM"
                  className="w-full bg-[#FAFBFF] border border-[#E3E8EE] focus:border-[#635BFF] rounded-lg px-4 py-2.5 text-[#0A2540] outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#425466] mb-1.5">App Description / Prompt</label>
                <textarea 
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Describe the features, layout, and data models..."
                  className="w-full bg-[#FAFBFF] border border-[#E3E8EE] focus:border-[#635BFF] rounded-lg px-4 py-2.5 text-[#0A2540] outline-none h-32 resize-none"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#697386] hover:text-[#0A2540]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creating || !newAppName.trim()}
                  className="bg-[#635BFF] hover:bg-[#5249E5] disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm flex items-center gap-2"
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
