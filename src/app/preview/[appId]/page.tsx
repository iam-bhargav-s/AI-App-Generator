'use client';

import React, { useState, useEffect, use } from 'react';

export default function PublicPreviewPage({ params }: { params: Promise<{ appId: string }> }) {
  const { appId } = use(params);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPreview() {
      try {
        const versionParams = new URLSearchParams(window.location.search);
        const version = versionParams.get('v') || '';
        
        const res = await fetch(`/api/preview/${appId}${version ? `?v=${version}` : ''}`);
        if (!res.ok) throw new Error('Preview not found or expired.');
        
        const data = await res.json();
        setApp(data.app);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [appId]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center p-6 text-center font-sans">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-10 rounded-[24px] max-w-md shadow-soft">
          <div className="w-12 h-12 bg-[#FEF2F2] text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">Preview Unavailable</h2>
          <p className="text-[15px] text-[var(--text-secondary)] mb-6">{error || 'This preview link may have expired or never existed.'}</p>
        </div>
      </div>
    );
  }

  const activeModelId = app.schema?.models?.[0]?.name || 'Dashboard';
  const activeModel = app.schema?.models?.[0];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)]">
      <header className="h-[72px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[var(--text-primary)] text-white text-[10px] font-bold flex items-center justify-center">O</div>
          <h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">OneAtlas Preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-[0.08em] rounded">v{app.version}</span>
          <span className="px-3 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-semibold uppercase tracking-[0.08em] rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span> Readonly Sandbox
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto flex justify-center items-start">
        <div className="w-full max-w-[1024px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] shadow-soft overflow-hidden min-h-[700px] flex flex-col">
          {/* Fake Browser Chrome */}
          <div className="h-[56px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center px-6 gap-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
              <div className="w-3 h-3 rounded-full bg-[var(--border-color)]"></div>
            </div>
            <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[8px] px-4 py-2 text-[14px] text-[var(--text-muted)] font-mono flex items-center gap-2 max-w-2xl mx-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              {app.name.toLowerCase().replace(/ /g, '-')}.oneatlas.app
            </div>
          </div>

          <div className="p-[64px] flex-1 bg-[var(--bg-primary)]">
            <h2 className="text-[32px] font-semibold text-[var(--text-primary)] mb-10 tracking-[-0.03em]">{activeModelId || 'Dashboard'} Management</h2>
            
            {/* Stats row mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Total {activeModelId}s</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">0</p>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Active</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">0</p>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Recently Added</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">-</p>
              </div>
            </div>

            {/* Table mockup */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[18px] overflow-hidden shadow-soft">
              <div className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 py-5 flex justify-between items-center">
                <h3 className="text-[18px] font-semibold text-[var(--text-primary)]">{activeModelId} Records</h3>
                <button className="bg-[var(--text-primary)] hover:bg-[#000000] text-white px-5 py-2.5 rounded-[12px] text-[14px] font-medium transition-transform hover:-translate-y-px">Add Record</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[15px]">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] text-[12px] font-semibold uppercase tracking-[0.08em] bg-[var(--bg-secondary)]">
                      {activeModel?.fields?.map((f: any) => (
                        <th key={f.name} className="px-6 py-4">{f.name} <span className="font-normal font-mono lowercase ml-1 opacity-50 text-[var(--text-muted)]">{f.type}</span></th>
                      ))}
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={activeModel?.fields?.length ? activeModel.fields.length + 1 : 5} className="px-6 py-24 text-center text-[var(--text-muted)] bg-[var(--bg-primary)]">
                        <div className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[12px] flex items-center justify-center mx-auto mb-4 shadow-soft text-[var(--text-secondary)]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <p className="font-medium text-[var(--text-primary)] mb-1 text-[15px]">No {activeModelId} records found.</p>
                        <p className="text-[14px] text-[var(--text-secondary)]">Create your first record to see it here.</p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
