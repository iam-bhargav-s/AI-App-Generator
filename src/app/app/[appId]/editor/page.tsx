'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AppDetails {
  id: string;
  name: string;
  description: string;
  config: any;
}

export default function EditorPage({ params }: { params: Promise<{ appId: string }> }) {
  const router = useRouter();
  const { appId } = use(params);
  
  const [app, setApp] = useState<AppDetails | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'visual' | 'codebase'>('visual');

  // GitHub Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [gitToken, setGitToken] = useState('');
  const [gitRepoName, setGitRepoName] = useState('');
  const [gitPrivate, setGitPrivate] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState('');

  // Load app details
  useEffect(() => {
    async function loadApp() {
      try {
        const res = await fetch(`/api/apps/${appId}`);
        if (!res.ok) {
          throw new Error('Failed to load application');
        }
        const data = await res.json();
        setApp(data.app);
        setJsonText(JSON.stringify(data.app.config, null, 2));
        setGitRepoName(data.app.name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [appId]);

  // Sync form edits back to JSON text
  const updateConfig = (newConfig: any) => {
    if (!app) return;
    const updated = { ...app, config: newConfig };
    setApp(updated);
    setJsonText(JSON.stringify(newConfig, null, 2));
  };

  // Parse text area and apply to app config
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (app) {
        setApp({ ...app, config: parsed });
        setSuccessMsg('JSON parsed and visual state synchronized.');
        setError('');
        setTimeout(() => setSuccessMsg(''), 3050);
      }
    } catch (err: any) {
      setError(`JSON Syntax Error: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      let finalConfig = app.config;
      try {
        finalConfig = JSON.parse(jsonText);
      } catch (e) {
        throw new Error('Cannot save: Current JSON contains syntax errors.');
      }

      const res = await fetch(`/api/apps/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: app.name,
          description: app.description,
          config: finalConfig,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save config');

      setApp(data.app);
      setJsonText(JSON.stringify(data.app.config, null, 2));
      setSuccessMsg('Configuration saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleExportGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gitToken || !gitRepoName) return;

    setExporting(true);
    setError('');
    setExportUrl('');

    try {
      const res = await fetch(`/api/apps/${appId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gitToken,
          repoName: gitRepoName,
          isPrivate: gitPrivate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'GitHub Export failed');

      setExportUrl(data.repoUrl);
      setSuccessMsg('Successfully exported and committed your codebase!');
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Helper selectors to modify Visual State easily
  const toggleAuth = () => {
    if (!app) return;
    const cfg = { ...app.config };
    cfg.auth = { ...cfg.auth, enabled: !cfg.auth?.enabled };
    updateConfig(cfg);
  };

  const addModel = () => {
    if (!app) return;
    const cfg = { ...app.config };
    if (!cfg.database) cfg.database = { models: [] };
    if (!cfg.database.models) cfg.database.models = [];

    const newMName = prompt('Enter database model name (e.g. Customer, Product):');
    if (!newMName) return;
    const formattedName = newMName.trim().charAt(0).toUpperCase() + newMName.trim().slice(1);
    
    if (cfg.database.models.some((m: any) => m.name.toLowerCase() === formattedName.toLowerCase())) {
      alert('Model already exists!');
      return;
    }

    cfg.database.models.push({
      name: formattedName,
      fields: [
        { name: 'name', type: 'String', required: true },
        { name: 'email', type: 'String', required: false, unique: true },
      ],
    });

    // Also auto-add default CRUD UI DataTable & Form inside list pages
    if (!cfg.ui) cfg.ui = { layout: 'Sidebar', pages: [] };
    if (!cfg.ui.pages) cfg.ui.pages = [];

    const pageId = formattedName.toLowerCase() + 's';
    cfg.ui.pages.push({
      id: pageId,
      title: formattedName + 's Manager',
      route: `/${pageId}`,
      components: [
        {
          id: `${pageId}-stats`,
          type: 'StatsGrid',
          props: {
            items: [
              { label: `Total ${formattedName}s`, value: '0', change: 'Live record count' }
            ]
          }
        },
        {
          id: `${pageId}-table`,
          type: 'DataTable',
          props: {
            model: formattedName,
            columns: ['name', 'email'],
            actions: ['create', 'edit', 'delete']
          }
        }
      ]
    });

    updateConfig(cfg);
  };

  const addWorkflow = () => {
    if (!app) return;
    const cfg = { ...app.config };
    if (!cfg.workflows) cfg.workflows = [];

    const name = prompt('Enter workflow automation name (e.g. Sync Webhook):');
    if (!name) return;

    const model = prompt('Enter trigger model name (e.g. Customer):');
    if (!model) return;

    const webhookUrl = prompt('Enter Webhook URL to call (e.g. Zapier hook, Webhook.site):');
    if (!webhookUrl) return;

    cfg.workflows.push({
      id: 'wf-' + Math.random().toString(36).substring(2, 9),
      name: name,
      trigger: {
        event: 'RECORD_CREATED',
        model: model,
      },
      actions: [
        {
          type: 'SEND_WEBHOOK',
          config: {
            url: webhookUrl,
            payload: {
              id: '{{id}}',
              event: 'created',
              timestamp: '{{createdAt}}',
            },
          },
        },
        {
          type: 'LOG_EVENT',
          config: {
            message: `Executed custom workflow "${name}" for record {{id}}`
          }
        }
      ],
    });

    updateConfig(cfg);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Editor Sub-Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-zinc-400 hover:text-white text-sm font-semibold transition"
          >
            &larr; Back to Dashboard
          </Link>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div>
            <h1 className="text-lg font-black text-white uppercase">{app?.name}</h1>
            <p className="text-xs text-zinc-500 font-medium">App ID: {app?.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/app/${appId}`)}
            className="bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700/50 font-bold text-xs px-4.5 py-2.5 rounded-lg transition"
          >
            Run Simulator &rarr;
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Config'}
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-teal-600 hover:bg-emerald-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-lg border border-teal-500/20 transition"
          >
            Export Codebase
          </button>
        </div>
      </header>

      {/* Editor workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Visual Controls */}
        <div className="w-1/2 flex flex-col border-r border-zinc-850 bg-zinc-900/20 overflow-hidden">
          {/* Tab Selector Header */}
          <div className="bg-zinc-900 px-8 py-3 border-b border-zinc-850 flex gap-4 shrink-0">
            <button
              onClick={() => setActiveTab('visual')}
              className={`text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'visual' ? 'text-emerald-450 border-b-2 border-emerald-500 pb-1' : 'text-zinc-450 hover:text-white pb-1'
              }`}
            >
              Visual Configurator
            </button>
            <button
              onClick={() => setActiveTab('codebase')}
              className={`text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'codebase' ? 'text-emerald-450 border-b-2 border-emerald-500 pb-1' : 'text-zinc-450 hover:text-white pb-1'
              }`}
            >
              Workspace File Map
            </button>
          </div>

          <div className="flex-1 p-8 overflow-y-auto">
            {activeTab === 'visual' && (
              <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-150">
                <div>
                  <h2 className="text-lg font-extrabold text-white mb-2 uppercase tracking-wide">
                    Visual Configurator
                  </h2>
                  <p className="text-xs text-zinc-550">
                    Design database models, enable features, and create event automations visually.
                  </p>
                </div>

                {/* Authentication Config Card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider">User Authentication</h3>
                      <p className="text-xs text-zinc-450 mt-1">Scope data access by registered user logins.</p>
                    </div>
                    <button
                      onClick={toggleAuth}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        app?.config?.auth?.enabled ? 'bg-emerald-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          app?.config?.auth?.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Status: {app?.config?.auth?.enabled ? 'ENABLED (User-scoped database CRUD enabled)' : 'DISABLED (Public reading/writing)'}
                  </div>
                </div>

                {/* Database Models config card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider">Database Models</h3>
                      <p className="text-xs text-zinc-450 mt-1">Manage relational database tables and models.</p>
                    </div>
                    <button
                      onClick={addModel}
                      className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      + Add Model
                    </button>
                  </div>

                  <div className="space-y-3">
                    {app?.config?.database?.models?.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No models defined. Click Add Model to begin.</p>
                    ) : (
                      app?.config?.database?.models?.map((model: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{model.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {model.fields?.map((f: any, fidx: number) => (
                                <span key={fidx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                  {f.name} ({f.type}){f.required ? '*' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const cfg = { ...app.config };
                              cfg.database.models.splice(idx, 1);
                              // Also remove page
                              const pageIdx = cfg.ui?.pages?.findIndex((p: any) => p.id === model.name.toLowerCase() + 's');
                              if (pageIdx !== -1) cfg.ui.pages.splice(pageIdx, 1);
                              updateConfig(cfg);
                            }}
                            className="text-xs text-zinc-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Workflow config card */}
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-white text-sm uppercase tracking-wider">Workflow Automations</h3>
                      <p className="text-xs text-zinc-450 mt-1">Configure event triggers and background actions.</p>
                    </div>
                    <button
                      onClick={addWorkflow}
                      className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      + Add Workflow
                    </button>
                  </div>

                  <div className="space-y-3">
                    {app?.config?.workflows?.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No workflows defined. Configure an event webhook trigger.</p>
                    ) : (
                      app?.config?.workflows?.map((wf: any, idx: number) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-zinc-200">{wf.name}</p>
                            <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold">
                              On {wf.trigger?.event} for {wf.trigger?.model}
                            </p>
                            <div className="mt-2 space-y-1">
                              {wf.actions?.map((act: any, actIdx: number) => (
                                <div key={actIdx} className="text-[10px] text-emerald-400 font-mono">
                                  &bull; {act.type === 'SEND_WEBHOOK' ? `Call Webhook: ${act.config?.url?.substring(0, 30)}...` : act.type}
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const cfg = { ...app.config };
                              cfg.workflows.splice(idx, 1);
                              updateConfig(cfg);
                            }}
                            className="text-xs text-zinc-500 hover:text-red-400 animate-pulse-hover"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'codebase' && app && (
              <div className="max-w-xl mx-auto animate-in fade-in duration-150">
                <CodebaseWorkspacePreview config={app.config} />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Raw JSON Editor */}
        <div className="w-1/2 flex flex-col bg-zinc-950 border-l border-zinc-900">
          <div className="bg-zinc-900 px-6 py-3 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Metadata JSON Config</span>
            <button
              onClick={handleApplyJson}
              className="bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-zinc-700/50 transition-colors"
            >
              Parse & Sync Form &larr;
            </button>
          </div>
          <div className="flex-1 p-6 relative">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-full bg-zinc-950 font-mono text-xs text-emerald-450 leading-relaxed resize-none focus:outline-none"
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || successMsg) && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur max-w-sm animate-in fade-in slide-in-from-bottom-5">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-5 py-3.5 rounded-xl shadow-2xl backdrop-blur max-w-sm animate-in fade-in slide-in-from-bottom-5">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* GitHub Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-850 flex justify-between items-center bg-zinc-900/60">
              <h3 className="font-bold text-lg text-white">Export to GitHub Repo</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-zinc-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleExportGitHub} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <input
                  type="password"
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Needs <b>repo</b> scope to create repositories and push commits.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={gitRepoName}
                  onChange={(e) => setGitRepoName(e.target.value)}
                  placeholder="my-crm-app"
                  required
                  className="w-full bg-zinc-950 border border-zinc-850 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="gitPrivate"
                  checked={gitPrivate}
                  onChange={(e) => setGitPrivate(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-800 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="gitPrivate" className="text-xs font-semibold text-zinc-350 select-none">
                  Create Private Repository
                </label>
              </div>

              {exportUrl && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm break-all">
                  🎉 Export complete! Repository URL:<br />
                  <a href={exportUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline text-teal-300">
                    {exportUrl}
                  </a>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-400 hover:bg-zinc-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={exporting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/20 transition-colors disabled:opacity-50"
                >
                  {exporting ? 'Pushing Files...' : 'Create & Push Repo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CodebaseWorkspacePreview({ config }: { config: any }) {
  const models = config?.database?.models || [];
  const pages = config?.ui?.pages || [];
  const authEnabled = config?.auth?.enabled || false;

  const files = [
    { name: 'package.json' },
    { name: 'tsconfig.json' },
    { name: 'tailwind.config.js' },
    { name: 'prisma/schema.prisma' },
    { name: 'src/lib/db.ts' },
    { name: 'src/lib/dbWrapper.ts' },
    { name: 'src/lib/auth.ts' },
    { name: 'src/lib/validation.ts' },
    { name: 'src/lib/workflowEngine.ts' },
    { name: 'src/app/page.tsx' },
    { name: 'src/app/globals.css' },
  ];

  if (authEnabled) {
    files.push({ name: 'src/app/login/page.tsx' });
    files.push({ name: 'src/app/api/auth/login/route.ts' });
    files.push({ name: 'src/app/api/auth/logout/route.ts' });
    files.push({ name: 'src/app/api/auth/me/route.ts' });
    files.push({ name: 'src/app/api/auth/register/route.ts' });
  }

  for (const page of pages) {
    files.push({ name: `src/app/${page.id}/page.tsx` });
  }

  for (const model of models) {
    const nameLower = model.name.toLowerCase();
    files.push({ name: `src/app/api/${nameLower}/route.ts` });
    files.push({ name: `src/app/api/${nameLower}/[id]/route.ts` });
  }

  const tree: any = {};
  for (const file of files) {
    const parts = file.name.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null;
      } else {
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    }
  }

  const renderTree = (node: any, path = '', depth = 0) => {
    return Object.keys(node).map((key) => {
      const isFile = node[key] === null;
      const fullPath = path ? `${path}/${key}` : key;
      return (
        <div key={fullPath} style={{ paddingLeft: `${depth * 14}px` }} className="text-xs py-1 text-zinc-350">
          <span className="mr-2 select-none text-zinc-550">{isFile ? '📄' : '📁'}</span>
          <span className={`font-mono ${isFile ? 'text-zinc-300 font-semibold' : 'text-emerald-450 font-bold uppercase tracking-wider text-[10px]'}`}>{key}</span>
          {!isFile && renderTree(node[key], fullPath, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="mb-4">
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Simulated Next.js Codebase Map</h3>
        <p className="text-[10px] text-zinc-500 mt-1">This tree represents the exact files built and packaged by the exporter engine.</p>
      </div>
      <div className="border border-zinc-850 bg-zinc-950/40 p-4 rounded-xl max-h-[500px] overflow-y-auto scrollbar-thin">
        {renderTree(tree)}
      </div>
    </div>
  );
}
