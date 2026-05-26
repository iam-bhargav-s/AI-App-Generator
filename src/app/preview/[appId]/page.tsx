'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

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
      <div className="flex min-h-screen bg-[#FAFBFF] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#635BFF]"></div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex min-h-screen bg-[#FAFBFF] items-center justify-center p-6 text-center">
        <div className="bg-white border border-[#E3E8EE] p-8 rounded-2xl max-w-md shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <h2 className="text-xl font-bold text-[#0A2540] mb-2">Preview Unavailable</h2>
          <p className="text-[#697386] mb-6">{error || 'This preview link may have expired or never existed.'}</p>
        </div>
      </div>
    );
  }

  const activeModelId = app.schema?.models?.[0]?.name || 'Dashboard';
  const activeModel = app.schema?.models?.[0];

  return (
    <div className="min-h-screen bg-[#FAFBFF] flex flex-col font-sans">
      <header className="h-14 bg-white border-b border-[#E3E8EE] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center shadow-sm">
            <span className="font-bold text-white text-[10px]">O</span>
          </div>
          <h1 className="text-sm font-bold text-[#0A2540] tracking-tight">OneAtlas Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-[#EFF3F8] text-[#0A2540] text-[10px] font-bold uppercase tracking-wider rounded">v{app.version}</span>
          <span className="px-2 py-1 bg-[#00D4B1]/10 text-[#00D4B1] text-[10px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D4B1] animate-pulse"></span> Readonly Sandbox
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white border border-[#E3E8EE] rounded-xl shadow-xl overflow-hidden min-h-[700px] flex flex-col">
          {/* Fake Browser Chrome */}
          <div className="h-12 bg-[#FAFBFF] border-b border-[#E3E8EE] flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
              <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
              <div className="w-3 h-3 rounded-full bg-[#E3E8EE]"></div>
            </div>
            <div className="flex-1 bg-white border border-[#E3E8EE] rounded-md px-3 py-1.5 text-xs text-[#697386] font-mono flex items-center gap-2 shadow-sm max-w-2xl mx-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              {app.name.toLowerCase().replace(/ /g, '-')}.oneatlas.app
            </div>
          </div>

          <div className="p-10 flex-1 bg-white">
            <h2 className="text-3xl font-bold text-[#0A2540] mb-8">{activeModelId || 'Dashboard'} Management</h2>
            
            {/* Stats row mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-6 rounded-xl shadow-sm">
                <p className="text-sm text-[#697386] font-medium uppercase tracking-wider mb-2">Total {activeModelId}s</p>
                <p className="text-4xl font-black text-[#0A2540]">0</p>
              </div>
              <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-6 rounded-xl shadow-sm">
                <p className="text-sm text-[#697386] font-medium uppercase tracking-wider mb-2">Active</p>
                <p className="text-4xl font-black text-[#0A2540]">0</p>
              </div>
              <div className="bg-[#FAFBFF] border border-[#E3E8EE] p-6 rounded-xl shadow-sm">
                <p className="text-sm text-[#697386] font-medium uppercase tracking-wider mb-2">Recently Added</p>
                <p className="text-4xl font-black text-[#0A2540]">-</p>
              </div>
            </div>

            {/* Table mockup */}
            <div className="bg-white border border-[#E3E8EE] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#FAFBFF] border-b border-[#E3E8EE] px-6 py-4 flex justify-between items-center">
                <h3 className="text-base font-bold text-[#0A2540]">{activeModelId} Records</h3>
                <button className="bg-[#0A2540] hover:bg-[#1A1F36] text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">Add Record</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-[#E3E8EE] text-[#697386] text-xs font-semibold uppercase bg-white">
                      {activeModel?.fields?.map((f: any) => (
                        <th key={f.name} className="px-6 py-4">{f.name} <span className="font-normal font-mono lowercase ml-1 opacity-50">{f.type}</span></th>
                      ))}
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={activeModel?.fields?.length ? activeModel.fields.length + 1 : 5} className="px-6 py-20 text-center text-[#697386] bg-[#FAFBFF]/50">
                        <div className="w-12 h-12 bg-white border border-[#E3E8EE] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                          <svg className="w-6 h-6 text-[#0A2540]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                        </div>
                        <p className="font-medium text-[#0A2540] mb-1">No {activeModelId} records found.</p>
                        <p className="text-xs">Create your first record to see it here.</p>
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
