'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppDetails {
  id: string;
  name: string;
  description: string;
  config: any;
  version: number;
  updatedAt: string;
}

export default function BuilderShell({ params }: { params: Promise<{ appId: string }> }) {
  const router = useRouter();
  const { appId } = use(params);

  const [app, setApp] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Builder state
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editHistory, setEditHistory] = useState<any[]>([]);

  // CRUD State
  const [records, setRecords] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [savingRecord, setSavingRecord] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (!res.ok) throw new Error('Failed to load application');
        const data = await res.json();
        setApp(data.app);
        if (data.app.config?.database?.models?.length > 0) {
          setActiveModelId(data.app.config.database.models[0].name);
        }
        if (data.app.config?.editHistory) {
          setEditHistory(data.app.config.editHistory);
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [appId]);

  useEffect(() => {
    async function fetchRecords() {
      if (!activeModelId) return;
      try {
        const res = await fetch(`/api/apps/${appId}/records?modelName=${activeModelId}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
        }
      } catch (e) {
        console.error('Failed to fetch records');
      }
    }
    fetchRecords();
  }, [activeModelId, appId]);

  const handleConversationalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPrompt.trim() || !app) return;

    const currentPrompt = editPrompt;
    setEditPrompt('');
    setIsEditing(true);

    try {
      const res = await fetch(`/api/apps/${appId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: currentPrompt })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to edit');
      
      setApp(data.app);
      if (data.app.config.editHistory) {
        setEditHistory(data.app.config.editHistory);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = async () => {
    if (!confirm('Revert to previous schema version?')) return;
    
    try {
      const res = await fetch(`/api/apps/${appId}/undo`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to undo');
      
      setApp(data.app);
      if (data.app.config.editHistory) {
        setEditHistory(data.app.config.editHistory);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSharePreview = async () => {
    try {
      const res = await fetch(`/api/apps/${appId}/preview`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const url = `${window.location.origin}${data.previewUrl}`;
      await navigator.clipboard.writeText(url);
      alert(`Preview Snapshot URL copied to clipboard!\n${url}`);
    } catch (err: any) {
      alert(`Failed to create preview: ${err.message}`);
    }
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRecord(true);
    try {
      const res = await fetch(`/api/apps/${appId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: activeModelId, data: formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setRecords([data.record, ...records]);
      setShowAddModal(false);
      setFormData({});
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      alert('Simulated deployment successful!\nIn a production environment, this would trigger a Vercel build.');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const models = app?.config?.database?.models || [];
  const activeModel = models.find((m: any) => m.name === activeModelId);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="h-[72px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="w-6 h-6 bg-[var(--text-primary)] text-white text-[10px] font-bold flex items-center justify-center hover:opacity-90 transition-opacity">
            O
          </Link>
          <div className="h-6 w-px bg-[var(--border-color)]"></div>
          <div className="flex items-center gap-3">
            <h1 className="text-[15px] font-semibold text-[var(--text-primary)]">{app?.name || 'Untitled App'}</h1>
            <span className="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded text-[10px] font-semibold uppercase tracking-[0.08em]">v{app?.config?.version || 1}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleUndo} disabled={editHistory.length === 0} className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 flex items-center gap-1 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            Undo
          </button>
          <div className="h-6 w-px bg-[var(--border-color)]"></div>
          <button onClick={handleSharePreview} className="text-[14px] font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-primary)] px-4 h-[36px] rounded-[8px] transition-colors">
            Share Preview
          </button>
          <button onClick={handleDeploy} disabled={isDeploying} className="text-[14px] font-semibold bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 h-[36px] rounded-[8px] transition-transform hover:-translate-y-px disabled:opacity-50 disabled:transform-none">
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </header>

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Component / Schema Tree */}
        <aside className="w-[280px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-[0.08em]">Schema Tree</h2>
          </div>
          <div className="p-3 space-y-1">
            {models.map((model: any) => (
              <div key={model.name}>
                <button 
                  onClick={() => { setActiveModelId(model.name); setRecords([]); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] font-medium transition-colors ${activeModelId === model.name ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    {model.name}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-secondary)] border border-[var(--border-color)] px-1.5 rounded">{model.fields?.length || 0}</span>
                </button>
                {activeModelId === model.name && (
                  <div className="ml-6 mt-1 mb-3 pl-3 border-l border-[var(--border-color)] space-y-2 py-1">
                    {model.fields?.map((f: any) => (
                      <div key={f.name} className="flex justify-between items-center text-[12px] text-[var(--text-secondary)]">
                        <span>{f.name}</span>
                        <span className="font-mono text-[var(--text-muted)]">{f.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel: Live Preview Canvas */}
        <main className="flex-1 bg-[var(--bg-primary)] flex flex-col overflow-hidden relative">
          <div className="flex-1 p-8 overflow-y-auto flex justify-center items-start">
            <div className="w-full max-w-[1024px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] shadow-soft overflow-hidden min-h-[600px] flex flex-col">
              {/* Fake Browser Chrome */}
              <div className="h-[48px] border-b border-[var(--border-color)] flex items-center px-4 gap-4 bg-[var(--bg-secondary)]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                  <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
                </div>
                <div className="flex-1 max-w-md mx-auto bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[8px] px-3 py-1.5 text-[12px] text-[var(--text-muted)] font-mono flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  preview.oneatlas.app/{app?.id.substring(0,8)}
                </div>
              </div>

              {/* Dynamic Live Rendering Canvas */}
              <div className="p-[48px] flex-1 bg-[var(--bg-primary)]">
                <h2 className="text-[32px] font-semibold text-[var(--text-primary)] mb-8 tracking-[-0.03em]">{activeModelId || 'Dashboard'} Management</h2>
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                    <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Total {activeModelId}s</p>
                    <p className="text-[32px] font-semibold text-[var(--text-primary)]">{records.length}</p>
                  </div>
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                    <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Recently Added</p>
                    <p className="text-[32px] font-semibold text-[var(--text-primary)]">
                      {records.length > 0 ? 'Today' : '-'}
                    </p>
                  </div>
                </div>

                {/* Mock Graph Section */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">Activity Overview</h3>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6600] mt-1.5 animate-pulse"></span>
                      <span className="text-[13px] text-[var(--text-muted)]">Live Data</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-[120px] pt-4 border-t border-[var(--border-color)]">
                    {[40, 70, 45, 90, 65, 85, 120, 50, 80, 60, 100, 75].map((val, i) => (
                      <div key={i} className="flex-1 bg-[#FF6600] bg-opacity-20 rounded-t-[4px] hover:bg-opacity-40 transition-colors relative group" style={{ height: `${(val / 120) * 100}%` }}>
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          {val}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table Dynamic Rendering */}
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[18px] overflow-hidden shadow-soft">
                  <div className="border-b border-[var(--border-color)] px-6 py-5 flex justify-between items-center">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{activeModelId} Records</h3>
                    <button onClick={() => setShowAddModal(true)} className="bg-[var(--text-primary)] hover:bg-[#000000] text-white px-4 py-2 rounded-[8px] text-[14px] font-medium transition-transform hover:-translate-y-px">
                      Add Record
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[15px]">
                      <thead>
                        <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[12px] uppercase tracking-[0.08em] font-semibold bg-[var(--bg-secondary)]">
                          {activeModel?.fields?.slice(0, 5).map((f: any) => (
                            <th key={f.name} className="px-6 py-4">{f.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr>
                            <td colSpan={activeModel?.fields?.length ? activeModel.fields.slice(0,5).length : 1} className="px-6 py-16 text-center text-[var(--text-muted)] text-[15px]">
                              No {activeModelId} records found. Add one above!
                            </td>
                          </tr>
                        ) : (
                          records.map((rec) => (
                            <tr key={rec.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                              {activeModel?.fields?.slice(0, 5).map((f: any) => (
                                <td key={f.name} className="px-6 py-4 text-[var(--text-primary)] max-w-[200px] truncate">
                                  {typeof rec.data[f.name] === 'object' ? JSON.stringify(rec.data[f.name]) : String(rec.data[f.name] || '-')}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Floating Conversational Edit Strip */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
            <form onSubmit={handleConversationalEdit} className="w-full relative flex items-center shadow-2xl rounded-full bg-[var(--bg-secondary)] border-2 border-[var(--border-color)] focus-within:border-[#FF6600] transition-colors">
              <div className="pl-6 text-[#FF6600]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <input 
                type="text"
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Ask AI to edit the schema (e.g. 'Add a status field to the tasks table')"
                className="w-full bg-transparent rounded-full px-4 py-4 pr-16 text-[15px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                disabled={isEditing}
              />
              <button 
                type="submit"
                disabled={!editPrompt.trim() || isEditing}
                className="absolute right-2 w-10 h-10 flex items-center justify-center bg-[#FF6600] text-white rounded-full hover:bg-[#e55c00] disabled:opacity-50 disabled:bg-[var(--border-color)] disabled:text-[var(--text-muted)] transition-transform hover:-translate-y-px"
              >
                {isEditing ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Right Panel: Edit History / Properties */}
        <aside className="w-[320px] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col shrink-0">
          <div className="p-5 border-b border-[var(--border-color)]">
            <h2 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-[0.08em]">Mutation Log</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {editHistory.length === 0 ? (
              <div className="text-center text-[var(--text-muted)] text-[14px] py-10">
                No edits made yet. Use the prompt bar to modify the app schema.
              </div>
            ) : (
              editHistory.map(edit => (
                <div key={edit.id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[12px] p-4 text-[14px]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[var(--text-primary)] line-clamp-2">{edit.text}</span>
                    {edit.status === 'processing' ? (
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-[var(--accent-primary)] animate-spin"></span>
                    ) : (
                      <span className="w-2 h-2 mt-1.5 rounded-full bg-[var(--text-primary)]"></span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)]">
                    {new Date(edit.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

      </div>

      {/* Dynamic Data Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/40 backdrop-blur-sm">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] w-full max-w-lg shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center">
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">Add {activeModelId}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSaveRecord} className="p-6 space-y-5">
              <div className="max-h-[50vh] overflow-y-auto space-y-5 pr-2">
                {activeModel?.fields?.map((f: any) => (
                  <div key={f.name}>
                    <label className="block text-[12px] font-semibold text-[var(--text-primary)] mb-1.5 uppercase tracking-[0.08em]">{f.name}</label>
                    <input 
                      type={f.type === 'Int' ? 'number' : f.type === 'Boolean' ? 'checkbox' : 'text'}
                      value={formData[f.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [f.name]: f.type === 'Boolean' ? e.target.checked : e.target.value })}
                      placeholder={`Enter ${f.name}...`}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--text-primary)] rounded-[12px] px-4 py-3 text-[15px] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-[var(--border-color)] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="h-[40px] px-4 text-[14px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingRecord}
                  className="h-[40px] px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-[8px] text-[14px] font-semibold flex items-center gap-2 transition-transform hover:-translate-y-px"
                >
                  {savingRecord ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
