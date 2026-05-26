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
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [appId]);

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#FAFBFF] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#635BFF]"></div>
      </div>
    );
  }

  const models = app?.config?.database?.models || [];
  const activeModel = models.find((m: any) => m.name === activeModelId);

  const handleSharePreview = () => {
    const url = `${window.location.origin}/preview/${appId}?v=${app?.config?.version || 1}`;
    navigator.clipboard.writeText(url);
    alert(`Preview URL copied to clipboard!\n${url}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] text-[#425466] flex flex-col font-sans selection:bg-[#635BFF]/20 overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-[#E3E8EE] flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-[#635BFF] flex items-center justify-center shadow-sm hover:opacity-90 transition">
            <span className="font-bold text-white text-sm">O</span>
          </Link>
          <div className="h-4 w-px bg-[#E3E8EE]"></div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-[#0A2540]">{app?.name || 'Untitled App'}</h1>
            <span className="px-2 py-0.5 bg-[#EFF3F8] text-[#697386] rounded text-[10px] font-semibold uppercase tracking-wider">v{app?.config?.version || 1}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleUndo} disabled={editHistory.length === 0} className="text-xs font-medium text-[#697386] hover:text-[#0A2540] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            Undo
          </button>
          <div className="h-4 w-px bg-[#E3E8EE]"></div>
          <button onClick={handleSharePreview} className="text-xs font-medium bg-[#FAFBFF] border border-[#E3E8EE] hover:bg-[#EFF3F8] text-[#0A2540] px-3 py-1.5 rounded-md transition shadow-sm">
            Share Preview
          </button>
          <button className="text-xs font-medium bg-[#635BFF] hover:bg-[#5249E5] text-white px-3 py-1.5 rounded-md transition shadow-sm">
            Deploy
          </button>
        </div>
      </header>

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Component / Schema Tree */}
        <aside className="w-64 bg-white border-r border-[#E3E8EE] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-[#E3E8EE]">
            <h2 className="text-xs font-bold text-[#0A2540] uppercase tracking-wider">Schema Tree</h2>
          </div>
          <div className="p-2 space-y-1">
            {models.map((model: any) => (
              <div key={model.name}>
                <button 
                  onClick={() => setActiveModelId(model.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${activeModelId === model.name ? 'bg-[#EFF3F8] text-[#635BFF]' : 'text-[#425466] hover:bg-[#FAFBFF]'}`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    {model.name}
                  </div>
                  <span className="text-[10px] text-[#697386] bg-white border border-[#E3E8EE] px-1.5 rounded">{model.fields?.length || 0}</span>
                </button>
                {activeModelId === model.name && (
                  <div className="ml-6 mt-1 mb-2 pl-2 border-l border-[#E3E8EE] space-y-1">
                    {model.fields?.map((f: any) => (
                      <div key={f.name} className="flex justify-between items-center text-[11px] py-1 px-2 text-[#697386]">
                        <span>{f.name}</span>
                        <span className="font-mono text-[#00D4B1]">{f.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        {/* Center Panel: Live Preview Canvas */}
        <main className="flex-1 bg-[#F6F9FC] flex flex-col overflow-hidden relative">
          <div className="flex-1 p-8 overflow-y-auto flex justify-center items-start">
            <div className="w-full max-w-4xl bg-white border border-[#E3E8EE] rounded-xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              {/* Fake Browser Chrome */}
              <div className="h-10 bg-[#FAFBFF] border-b border-[#E3E8EE] flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
                </div>
                <div className="mx-auto bg-white border border-[#E3E8EE] rounded px-3 py-0.5 text-[10px] text-[#697386] font-mono flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  preview.oneatlas.app/{app?.id.substring(0,8)}
                </div>
              </div>

              {/* Render generated layout placeholder based on schema */}
              <div className="p-8 flex-1">
                <h2 className="text-2xl font-bold text-[#0A2540] mb-6">{activeModelId || 'Dashboard'} Management</h2>
                
                {/* Stats row mockup */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-4 rounded-lg">
                    <p className="text-xs text-[#697386] font-medium uppercase mb-1">Total {activeModelId}s</p>
                    <p className="text-2xl font-bold text-[#0A2540]">0</p>
                  </div>
                  <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-4 rounded-lg">
                    <p className="text-xs text-[#697386] font-medium uppercase mb-1">Active</p>
                    <p className="text-2xl font-bold text-[#0A2540]">0</p>
                  </div>
                  <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-4 rounded-lg">
                    <p className="text-xs text-[#697386] font-medium uppercase mb-1">Recently Added</p>
                    <p className="text-2xl font-bold text-[#0A2540]">-</p>
                  </div>
                </div>

                {/* Table mockup */}
                <div className="bg-white border border-[#E3E8EE] rounded-lg overflow-hidden">
                  <div className="bg-[#FAFBFF] border-b border-[#E3E8EE] px-4 py-3 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-[#0A2540]">{activeModelId} Records</h3>
                    <button className="bg-[#0A2540] text-white px-3 py-1 rounded text-xs font-medium">Add Record</button>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#E3E8EE] text-[#697386] text-xs uppercase bg-white">
                        {activeModel?.fields?.slice(0, 4).map((f: any) => (
                          <th key={f.name} className="px-4 py-3 font-medium">{f.name}</th>
                        ))}
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-[#697386] italic text-xs">
                          No {activeModelId} records found.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          </div>

          {/* Conversational Edit Strip */}
          <div className="h-20 bg-white border-t border-[#E3E8EE] px-6 py-4 flex items-center justify-center shrink-0">
            <form onSubmit={handleConversationalEdit} className="w-full max-w-2xl relative flex items-center">
              <input 
                type="text"
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="Ask AI to edit the schema (e.g. 'Add a status field to the tasks table')"
                className="w-full bg-[#FAFBFF] border border-[#E3E8EE] hover:border-[#635BFF]/50 focus:border-[#635BFF] rounded-xl px-4 py-3 pr-12 text-sm text-[#0A2540] placeholder:text-[#697386] outline-none shadow-sm transition-all"
                disabled={isEditing}
              />
              <button 
                type="submit"
                disabled={!editPrompt.trim() || isEditing}
                className="absolute right-2 p-1.5 bg-[#635BFF] text-white rounded-lg hover:bg-[#5249E5] disabled:opacity-50 disabled:bg-[#E3E8EE] disabled:text-[#697386] transition-colors"
              >
                {isEditing ? (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </button>
            </form>
          </div>
        </main>

        {/* Right Panel: Edit History / Properties */}
        <aside className="w-72 bg-white border-l border-[#E3E8EE] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#E3E8EE]">
            <h2 className="text-xs font-bold text-[#0A2540] uppercase tracking-wider">Mutation Log</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {editHistory.length === 0 ? (
              <div className="text-center text-[#697386] text-xs py-8 italic">
                No edits made yet. Use the prompt bar to modify the app schema.
              </div>
            ) : (
              editHistory.map(edit => (
                <div key={edit.id} className="bg-[#FAFBFF] border border-[#E3E8EE] rounded-lg p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[#0A2540] line-clamp-2">{edit.text}</span>
                    {edit.status === 'processing' ? (
                      <span className="w-2 h-2 mt-1 rounded-full bg-[#F8BC42] animate-pulse"></span>
                    ) : (
                      <span className="w-2 h-2 mt-1 rounded-full bg-[#00D4B1]"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#697386]">
                    {new Date(edit.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
