'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Database, Plus, Trash2, ArrowRight, User, Moon, Sun, CreditCard, LogOut, CheckCircle, Save } from 'lucide-react';

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

  // Settings view states
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [plan, setPlan] = useState<string>('builder');
  const [userName, setUserName] = useState<string>('Bhargav Srinath');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [profileNameInput, setProfileNameInput] = useState<string>('Bhargav Srinath');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
      
      const storedPlan = localStorage.getItem('user_plan') || 'builder';
      setPlan(storedPlan);
      
      const storedName = localStorage.getItem('user_name') || 'Bhargav Srinath';
      setUserName(storedName);
      setProfileNameInput(storedName);
    }
  }, []);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(profileNameInput);
    localStorage.setItem('user_name', profileNameInput);
    setUpdateMessage('Profile updated successfully!');
    setTimeout(() => setUpdateMessage(''), 3000);
  };

  const handleChangePlan = (newPlan: string) => {
    setPlan(newPlan);
    localStorage.setItem('user_plan', newPlan);
    setUpdateMessage(`Subscription changed to ${newPlan === 'builder' ? 'Builder (Free)' : newPlan === 'monthly' ? 'Monthly Pro ($8/mo)' : 'Yearly Pro ($80/yr)'}!`);
    setTimeout(() => setUpdateMessage(''), 4000);
  };

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
            <button 
              onClick={() => setActiveTab('projects')} 
              className={`text-[15px] font-semibold transition-colors ${activeTab === 'projects' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveTab('settings')} 
              className={`text-[15px] font-medium transition-colors ${activeTab === 'settings' ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Settings
            </button>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-[14px] font-medium text-[var(--text-primary)]">{user?.email}</div>
          <button onClick={handleLogout} className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Sign out</button>
        </div>
      </nav>

      <main className="max-w-[1280px] mx-auto px-8 py-[80px]">
        {activeTab === 'projects' ? (
          <div className="flex justify-between items-end mb-12 animate-fade-in">
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
        ) : (
          <div className="mb-12 animate-fade-in">
            <h1 className="text-[32px] font-bold text-[var(--text-primary)] mb-2">Settings</h1>
            <p className="text-[15px] text-[var(--text-secondary)]">Manage your account credentials, billing plans, and theme appearances.</p>
          </div>
        )}

        {activeTab === 'projects' ? (
          <>
            {error && (
              <div className="bg-[#FEF2F2] border border-[#FCA5A5] text-[#DC2626] px-4 py-3 rounded-[12px] mb-8 text-[15px]">
                {error}
              </div>
            )}

            {apps.length === 0 ? (
              <>
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-[64px] text-center shadow-soft">
                  <div className="w-12 h-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[12px] flex items-center justify-center mx-auto mb-6 text-[var(--text-muted)]">
                    <Database size={24} />
                  </div>
                  <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">No projects yet</h2>
                  <p className="text-[15px] text-[var(--text-secondary)] max-w-md mx-auto mb-8">Get started by creating a new project from scratch or choose from one of our templates.</p>
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button 
                      onClick={() => setShowModal(true)}
                      className="h-[48px] px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[15px] font-semibold rounded-[12px] transition-all hover:-translate-y-px shadow-soft"
                    >
                      Create from scratch
                    </button>
                    <button 
                      onClick={() => {
                        document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="h-[48px] px-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] text-[15px] font-semibold rounded-[12px] transition-all hover:-translate-y-px flex items-center gap-2"
                    >
                      Choose a template
                      <svg className="w-4 h-4 animate-bounce text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                    </button>
                  </div>
                </div>
                
                {/* Elegant inline hint pointing to templates below */}
                <div 
                  onClick={() => {
                    document.getElementById('templates-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-8 flex flex-col items-center gap-1.5 cursor-pointer group text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <span className="text-[12px] font-semibold tracking-[0.1em] uppercase">Scroll down for templates</span>
                  <svg className="w-4 h-4 animate-bounce text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </>
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

            <div id="templates-section" className="mt-[72px] border-t border-[var(--border-color)] pt-[72px]">
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
          </>
        ) : (
          <div className="max-w-[800px] mx-auto space-y-8 animate-fade-in">
            {updateMessage && (
              <div className="bg-[#DEF7EC] border border-[#31C48D] text-[#03543F] dark:bg-[#03543F]/20 dark:border-[#31C48D]/30 dark:text-[#31C48D] px-4 py-3 rounded-[12px] flex items-center gap-2 text-[15px]">
                <CheckCircle size={16} className="text-[#31C48D]" />
                {updateMessage}
              </div>
            )}

            {/* Profile Settings */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Account Profile</h2>
                  <p className="text-[13px] text-[var(--text-secondary)]">Manage your personal account details</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-1.5">Email Address</label>
                    <input 
                      type="text" 
                      value={user?.email || 'bhargav.srinath007@gmail.com'} 
                      disabled 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[12px] px-4 py-3 text-[14px] text-[var(--text-muted)] cursor-not-allowed outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.08em] mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={profileNameInput} 
                      onChange={(e) => setProfileNameInput(e.target.value)} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[14px] text-[var(--text-primary)] outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    className="h-[40px] px-5 bg-[var(--text-primary)] hover:opacity-90 text-white dark:bg-white dark:text-black dark:hover:opacity-90 text-[14px] font-semibold rounded-[8px] flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>

            {/* Appearance Settings */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Appearance</h2>
                  <p className="text-[13px] text-[var(--text-secondary)]">Customize the visual theme of the platform</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Light Theme Card */}
                <div 
                  onClick={() => toggleTheme('light')}
                  className={`border-[2px] rounded-[16px] p-4 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all ${theme === 'light' ? 'border-[var(--accent-primary)] bg-[var(--bg-primary)] shadow-sm' : 'border-[var(--border-color)] hover:border-[var(--text-secondary)] bg-[var(--bg-secondary)]'}`}
                >
                  <Sun size={24} className={theme === 'light' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                  <span className={`text-[14px] font-semibold ${theme === 'light' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Light Theme</span>
                </div>

                {/* Dark Theme Card */}
                <div 
                  onClick={() => toggleTheme('dark')}
                  className={`border-[2px] rounded-[16px] p-4 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all ${theme === 'dark' ? 'border-[var(--accent-primary)] bg-[var(--bg-primary)] shadow-sm' : 'border-[var(--border-color)] hover:border-[var(--text-secondary)] bg-[var(--bg-secondary)]'}`}
                >
                  <Moon size={24} className={theme === 'dark' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'} />
                  <span className={`text-[14px] font-semibold ${theme === 'dark' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>Dark Theme</span>
                </div>
              </div>
            </div>

            {/* Billing & Subscription Settings */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Billing & Subscription</h2>
                  <p className="text-[13px] text-[var(--text-secondary)]">Manage your membership plan and invoices</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-[var(--bg-primary)] rounded-[14px] border border-[var(--border-color)] flex justify-between items-center">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Current Active Plan</span>
                  <p className="text-[18px] font-bold text-[var(--text-primary)] capitalize mt-0.5">{plan} Plan</p>
                </div>
                <div className="px-3 py-1.5 bg-[#FF6600]/10 text-[#FF6600] rounded-full text-[11px] font-bold uppercase tracking-[0.08em]">
                  Active
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Plan 1 */}
                <div className={`border rounded-[16px] p-5 flex flex-col justify-between transition-all ${plan === 'builder' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-color)]'}`}>
                  <div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)]">Builder</h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 mb-4">Unlimited generated apps, 5 deployments.</p>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">$0 <span className="text-[11px] font-medium text-[var(--text-secondary)]">/mo</span></p>
                  </div>
                  <button 
                    disabled={plan === 'builder'}
                    onClick={() => handleChangePlan('builder')}
                    className={`mt-4 w-full h-[36px] text-[13px] font-semibold rounded-[8px] transition-colors ${plan === 'builder' ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-default' : 'bg-[var(--text-primary)] hover:opacity-90 text-white dark:bg-white dark:text-black'}`}
                  >
                    {plan === 'builder' ? 'Current Plan' : 'Downgrade'}
                  </button>
                </div>

                {/* Plan 2 */}
                <div className={`border rounded-[16px] p-5 flex flex-col justify-between transition-all ${plan === 'monthly' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-color)]'}`}>
                  <div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)]">Monthly Pro</h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 mb-4">Advanced AI reasoning and priority support.</p>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">$8 <span className="text-[11px] font-medium text-[var(--text-secondary)]">/mo</span></p>
                  </div>
                  <button 
                    disabled={plan === 'monthly'}
                    onClick={() => handleChangePlan('monthly')}
                    className={`mt-4 w-full h-[36px] text-[13px] font-semibold rounded-[8px] transition-colors ${plan === 'monthly' ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-default' : 'bg-[#FF6600] hover:bg-[#E65C00] text-white'}`}
                  >
                    {plan === 'monthly' ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>

                {/* Plan 3 */}
                <div className={`border rounded-[16px] p-5 flex flex-col justify-between transition-all ${plan === 'yearly' ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-color)]'}`}>
                  <div>
                    <h4 className="text-[15px] font-bold text-[var(--text-primary)]">Yearly Pro</h4>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1 mb-4">Save over 15% annually with unlimited deploys.</p>
                    <p className="text-[20px] font-bold text-[var(--text-primary)]">$80 <span className="text-[11px] font-medium text-[var(--text-secondary)]">/yr</span></p>
                  </div>
                  <button 
                    disabled={plan === 'yearly'}
                    onClick={() => handleChangePlan('yearly')}
                    className={`mt-4 w-full h-[36px] text-[13px] font-semibold rounded-[8px] transition-colors ${plan === 'yearly' ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-default' : 'bg-[#FF6600] hover:bg-[#E65C00] text-white'}`}
                  >
                    {plan === 'yearly' ? 'Current Plan' : 'Upgrade'}
                  </button>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border-color)]">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent-primary)]">
                  <LogOut size={20} />
                </div>
                <div>
                  <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Session & Security</h2>
                  <p className="text-[13px] text-[var(--text-secondary)]">Manage your active sessions and log out</p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-[14px] font-semibold text-[var(--text-primary)]">Log out of this device</h4>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">End your current session on this browser window</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="h-[40px] px-5 bg-transparent border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20 text-[14px] font-semibold rounded-[8px] flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
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
