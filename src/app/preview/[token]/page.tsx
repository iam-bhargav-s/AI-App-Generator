'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function PublicPreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [appData, setAppData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Builder state derived from frozen schema
  const [activeModelId, setActiveModelId] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);

  useEffect(() => {
    async function loadSnapshot() {
      try {
        const res = await fetch(`/api/preview/${token}`);
        if (!res.ok) throw new Error('Preview link expired or invalid');
        const data = await res.json();
        
        setAppData(data);
        if (data.schema?.database?.models?.length > 0) {
          setActiveModelId(data.schema.database.models[0].name);
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadSnapshot();
  }, [token]);

  useEffect(() => {
    async function fetchRecords() {
      if (!activeModelId || !appData?.appId) return;
      try {
        const res = await fetch(`/api/apps/${appData.appId}/records?modelName=${activeModelId}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.records);
        }
      } catch (e) {
        console.error('Failed to fetch records');
      }
    }
    fetchRecords();
  }, [activeModelId, appData]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !appData) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)] items-center justify-center p-6 text-center font-sans">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-10 rounded-[24px] max-w-md shadow-soft">
          <div className="w-12 h-12 bg-[#FEF2F2] text-[#DC2626] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-[22px] font-semibold text-[var(--text-primary)] mb-2">Preview Unavailable</h2>
          <p className="text-[15px] text-[var(--text-secondary)] mb-6">{error || 'This preview link may have expired or never existed.'}</p>
          <Link href="/" className="text-[var(--accent-primary)] hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  const app = { config: appData.schema }; // Shim for the rest of the file
  const activeModel = app.config?.database?.models?.find((m: any) => m.name === activeModelId);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)]">
      <header className="h-[72px] bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-[var(--text-primary)] text-white text-[10px] font-bold flex items-center justify-center">O</div>
          <h1 className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">OneAtlas Preview</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-[10px] font-semibold uppercase tracking-[0.08em] rounded">v{app.config.version || 1}</span>
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
              {token.toLowerCase()}.oneatlas.app
            </div>
          </div>

          <div className="p-[64px] flex-1 bg-[var(--bg-primary)]">
            <h2 className="text-[32px] font-semibold text-[var(--text-primary)] mb-10 tracking-[-0.03em]">{activeModelId || 'Dashboard'} Management</h2>
            
            {/* Stats row mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Total {activeModelId}s</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">{records.length}</p>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Active</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">{records.length}</p>
              </div>
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft">
                <p className="text-[12px] text-[var(--text-secondary)] font-semibold uppercase tracking-[0.08em] mb-2">Recently Added</p>
                <p className="text-[32px] font-semibold text-[var(--text-primary)]">{records.length > 0 ? 'Today' : '-'}</p>
              </div>
            </div>

            {/* Mock Graph Section */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 rounded-[18px] shadow-soft mb-12">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[16px] font-semibold text-[var(--text-primary)] capitalize">{activeModel?.ui?.chartType || 'bar'} Chart: Activity Overview</h3>
                <div className="flex gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF6600] mt-1.5 animate-pulse"></span>
                  <span className="text-[13px] text-[var(--text-muted)]">Live Data</span>
                </div>
              </div>
              <div className="flex items-end justify-center gap-2 h-[160px] pt-4 border-t border-[var(--border-color)] w-full">
                {(() => {
                  const cType = activeModel?.ui?.chartType || 'bar';
                  const chartData = Array.from({length: 12}).map((_, i) => Math.max(20, Math.floor(Math.abs(Math.sin((activeModelId?.charCodeAt(0) || 1) * (i + 1))) * 120)));
                  
                  if (cType === 'pie') {
                    return (
                      <div className="w-[140px] h-[140px] rounded-full relative shadow-soft transition-transform hover:scale-105" style={{
                        background: `conic-gradient(#FF6600 0% 30%, #FF9933 30% 70%, #FFE0B2 70% 100%)`,
                        boxShadow: 'inset 0 0 0 20px var(--bg-secondary)'
                      }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[var(--text-primary)]">{chartData[0]}</span>
                        </div>
                      </div>
                    );
                  }
                  
                  if (cType === 'line') {
                    return (
                      <svg className="w-full h-full drop-shadow-md" viewBox="0 0 400 120" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{stopColor: '#FF6600', stopOpacity: 0.2}} />
                            <stop offset="100%" style={{stopColor: '#FF6600', stopOpacity: 0}} />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="none"
                          stroke="#FF6600"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={chartData.map((val, i) => `${(i / 11) * 400},${120 - val}`).join(' ')}
                        />
                        <polygon
                          fill="url(#grad1)"
                          points={`0,120 ${chartData.map((val, i) => `${(i / 11) * 400},${120 - val}`).join(' ')} 400,120`}
                        />
                        {chartData.map((val, i) => (
                          <circle key={i} cx={(i / 11) * 400} cy={120 - val} r="4" fill="#FF6600" className="hover:r-6 transition-all" />
                        ))}
                      </svg>
                    );
                  }

                  // Default: bar
                  return chartData.map((val, i) => (
                    <div key={i} className="flex-1 bg-[#FF6600] bg-opacity-20 rounded-t-[4px] hover:bg-opacity-40 transition-colors relative group" style={{ height: `${(val / 120) * 100}%` }}>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--text-primary)] text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {val}
                      </div>
                    </div>
                  ));
                })()}
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
                      {activeModel?.fields?.slice(0, 5).map((f: any) => (
                        <th key={f.name} className="px-6 py-4">{f.name} <span className="font-normal font-mono lowercase ml-1 opacity-50 text-[var(--text-muted)]">{f.type}</span></th>
                      ))}
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={activeModel?.fields?.length ? activeModel.fields.length + 1 : 5} className="px-6 py-24 text-center text-[var(--text-muted)] bg-[var(--bg-primary)]">
                          <div className="w-12 h-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[12px] flex items-center justify-center mx-auto mb-4 shadow-soft text-[var(--text-secondary)]">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                          </div>
                          <p className="font-medium text-[var(--text-primary)] mb-1 text-[15px]">No {activeModelId} records found.</p>
                          <p className="text-[14px] text-[var(--text-secondary)]">Create your first record in the builder to see it here.</p>
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
                          <td className="px-6 py-4 text-right text-[14px] text-[var(--accent-primary)] cursor-pointer hover:underline">Edit</td>
                        </tr>
                      ))
                    )}
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
