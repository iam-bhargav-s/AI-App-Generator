'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CSVImportModal from '@/components/runtime/CSVImportModal';

interface AppDetails {
  id: string;
  name: string;
  description: string;
  config: any;
}

interface WorkflowLog {
  id: string;
  name: string;
  event: string;
  status: string;
  logs: string;
  createdAt: string;
}

function formatHeader(col: string) {
  if (!col) return '';
  const spaced = col.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export default function SimulatorPage({ params }: { params: Promise<{ appId: string }> }) {
  const router = useRouter();
  const { appId } = use(params);

  const [app, setApp] = useState<AppDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // App simulated routes/pages
  const [activePageId, setActivePageId] = useState('');
  const [simulatedUser, setSimulatedUser] = useState<any>({ id: 'user-sim-123', email: 'guest@company.com', name: 'Simulated Admin' });
  const [pageRecords, setPageRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for CRUD
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any[]>([]);

  // CSV Import state
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvTargetModel, setCsvTargetModel] = useState('');
  const [csvModelFields, setCsvModelFields] = useState<any[]>([]);
  const [csvSummary, setCsvSummary] = useState<any>(null);

  // Workflow Logs Console State
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<WorkflowLog | null>(null);
  const [showLogsDrawer, setShowLogsDrawer] = useState(false);

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
        
        // Pick first page as default
        const pages = data.app.config?.ui?.pages || [];
        if (pages.length > 0) {
          setActivePageId(pages[0].id);
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadApp();
  }, [appId]);

  // Load workflow logs periodically
  const fetchWorkflowLogs = async () => {
    try {
      const res = await fetch(`/api/apps/${appId}/workflow-logs`);
      if (res.ok) {
        const data = await res.json();
        setWorkflowLogs(data.logs || []);
      }
    } catch (e) {
      console.error('Failed to load workflow logs', e);
    }
  };

  useEffect(() => {
    if (app) {
      fetchWorkflowLogs();
      const interval = setInterval(fetchWorkflowLogs, 5000); // Poll logs every 5s
      return () => clearInterval(interval);
    }
  }, [app]);

  // Find model associated with active page (if table/form components exist)
  const getActivePage = () => {
    return app?.config?.ui?.pages?.find((p: any) => p.id === activePageId);
  };

  const getActivePageModels = () => {
    const page = getActivePage();
    if (!page) return [];
    const models: string[] = [];
    page.components?.forEach((c: any) => {
      if (c.props?.model && !models.includes(c.props.model)) {
        models.push(c.props.model);
      }
    });
    return models;
  };

  const fetchRecords = async () => {
    const models = getActivePageModels();
    if (models.length === 0) return;

    setRecordsLoading(true);
    try {
      // Query records for the first model on this page (standard behavior for combined widgets)
      const res = await fetch(`/api/apps/${appId}/data/${models[0]}`);
      if (res.ok) {
        const data = await res.json();
        setPageRecords(data.data || []);
      } else {
        setPageRecords([]);
      }
    } catch (e) {
      console.error(e);
      setPageRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (activePageId) {
      fetchRecords();
    }
  }, [activePageId]);

  // CRUD handlers
  const handleCreateRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors([]);
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => {
      body[key] = val;
    });

    const modelName = getActivePageModels()[0];

    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          throw new Error(data.error || 'Failed to create record');
        }
        return;
      }

      setShowCreateModal(false);
      fetchRecords();
      fetchWorkflowLogs(); // Reload logs to catch execution
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleEditRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors([]);
    const formData = new FormData(e.currentTarget);
    const body: any = {};
    formData.forEach((val, key) => {
      body[key] = val;
    });

    const modelName = getActivePageModels()[0];

    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          setFormErrors(data.details);
        } else {
          throw new Error(data.error || 'Failed to edit record');
        }
        return;
      }

      setShowEditModal(false);
      fetchRecords();
      fetchWorkflowLogs();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    const modelName = getActivePageModels()[0];

    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}/${recordId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete record');
      }

      fetchRecords();
      fetchWorkflowLogs();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  // CSV Complete handler
  const handleCsvComplete = (summary: any) => {
    setCsvSummary(summary);
    fetchRecords();
    fetchWorkflowLogs();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
      </div>
    );
  }

  const activePage = getActivePage();
  const models = app?.config?.database?.models || [];
  const activePageModelName = getActivePageModels()[0];
  const activeModelDef = models.find((m: any) => m.name === activePageModelName);

  // Filter records based on search query
  const filteredRecords = pageRecords.filter((rec) => {
    if (!searchQuery) return true;
    return Object.values(rec).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/60">
            <div>
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Simulator</span>
              <h2 className="text-base font-black text-white uppercase tracking-tight truncate w-36">
                {app?.name}
              </h2>
            </div>
            <Link
              href={`/app/${appId}/editor`}
              className="text-xs text-zinc-400 hover:text-white font-bold border border-zinc-700/50 bg-zinc-850 px-2 py-1 rounded"
            >
              Editor
            </Link>
          </div>

          <nav className="p-4 space-y-1.5">
            {app?.config?.ui?.pages?.map((p: any) => (
              <button
                key={p.id}
                onClick={() => {
                  setActivePageId(p.id);
                  setSearchQuery('');
                  setCsvSummary(null);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition duration-150 ${
                  activePageId === p.id
                    ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/50 shadow'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                }`}
              >
                {p.title}
              </button>
            ))}
          </nav>
        </div>

        {/* User Scope simulation */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40">
          <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mb-2">Simulated User</p>
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold truncate text-zinc-200">{simulatedUser.name}</p>
              <p className="text-[10px] text-zinc-450 truncate">{simulatedUser.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Sandbox Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Sandbox Status Header */}
        <header className="bg-zinc-900 border-b border-zinc-850 px-8 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-black uppercase text-zinc-350 tracking-wider">Simulated Sandbox Environment</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowLogsDrawer(!showLogsDrawer)}
              className="text-xs font-bold text-zinc-350 hover:text-white border border-zinc-800 hover:bg-zinc-800 px-4.5 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <span>Workflow Logs</span>
              <span className={`inline-block h-2 w-2 rounded-full ${workflowLogs.some(l => l.status === 'FAILED') ? 'bg-red-500' : 'bg-emerald-400'}`}></span>
            </button>
          </div>
        </header>

        {/* App UI Renderer */}
        <div className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto space-y-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {csvSummary && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-zinc-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-emerald-400">CSV Import Executed Successfully</h4>
                <p className="text-xs text-zinc-450 mt-0.5">
                  Imported {csvSummary.importedCount} rows successfully. Failed rows: {csvSummary.failedCount}.
                </p>
                {csvSummary.errors.length > 0 && (
                  <div className="mt-2 text-xs max-h-24 overflow-y-auto text-red-400 space-y-1">
                    {csvSummary.errors.map((err: any, idx: number) => (
                      <div key={idx}>
                        Row {err.rowIndex}: {err.errors.map((e: any) => e.message).join(', ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setCsvSummary(null)}
                className="text-xs font-bold text-zinc-400 hover:text-white border border-zinc-800 px-3 py-1.5 rounded-lg"
              >
                Clear Notice
              </button>
            </div>
          )}

          {activePage ? (
            <div className="space-y-8">
              {activePage.components?.map((comp: any) => {
                if (comp.type === 'StatsGrid') {
                  const items = comp.props?.items || [];
                  return (
                    <div key={comp.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {items.map((it: any, idx: number) => {
                        const isCount = it.label.toLowerCase().includes('total') || it.label.toLowerCase().includes('count') || it.label.toLowerCase().includes('catalog') || it.label.toLowerCase().includes('pipeline') || it.label.toLowerCase().includes('entries') || it.label.toLowerCase().includes('reviews');
                        const displayValue = isCount && activePageModelName
                          ? pageRecords.length
                          : it.value;
                        return (
                          <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-zinc-800/80 hover:border-zinc-700/60 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
                            <p className="text-xs font-bold text-zinc-400 group-hover:text-zinc-350 transition-colors uppercase tracking-wider">{String(it.label || '').replace(/^["']|["']$/g, '')}</p>
                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 mt-2">
                              {displayValue}
                            </p>
                            <span className="text-xs font-semibold text-emerald-400 mt-2 inline-block bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10">
                              {it.change}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                if (comp.type === 'DataTable') {
                  const columns = comp.props?.columns || [];
                  const actions = comp.props?.actions || [];
                  return (
                    <div key={comp.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                      <div className="p-6 border-b border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/20">
                        <div>
                          <h3 className="text-lg font-black text-white uppercase tracking-wider">{comp.props.model} Records</h3>
                          <p className="text-xs text-zinc-400 mt-1">Live data browser and record manager.</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search records..."
                            className="bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition w-48 font-medium font-mono"
                          />

                          {actions.includes('csv-import') !== false && (
                            <button
                              onClick={() => {
                                if (activeModelDef) {
                                  setCsvTargetModel(activePageModelName);
                                  setCsvModelFields(activeModelDef.fields);
                                  setShowCsvModal(true);
                                }
                              }}
                              className="border border-zinc-850 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-350 hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150"
                            >
                              Import CSV
                            </button>
                          )}

                          {actions.includes('create') !== false && (
                            <button
                              onClick={() => {
                                setFormErrors([]);
                                setShowCreateModal(true);
                              }}
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-emerald-950/30"
                            >
                              + Add Record
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-zinc-950/60 text-zinc-400 text-[10px] tracking-wider uppercase font-semibold border-b border-zinc-800/80">
                              {columns.map((col: string) => (
                                <th key={col} className="px-6 py-4">{formatHeader(col)}</th>
                              ))}
                              <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-850 text-xs font-medium">
                            {recordsLoading ? (
                              <tr>
                                <td colSpan={columns.length + 1} className="text-center py-10 text-zinc-500">
                                  Loading data...
                                </td>
                              </tr>
                            ) : filteredRecords.length === 0 ? (
                              <tr>
                                <td colSpan={columns.length + 1} className="text-center py-10 text-zinc-500 italic">
                                  No records found
                                </td>
                              </tr>
                            ) : (
                              filteredRecords.map((row) => (
                                <tr key={row.id} className="hover:bg-zinc-900/40 text-zinc-300 transition duration-150">
                                  {columns.map((col: string) => (
                                    <td key={col} className="px-6 py-4 truncate max-w-[200px]">
                                      {typeof row[col] === 'boolean' 
                                        ? (row[col] ? 'Yes' : 'No') 
                                        : String(row[col] !== undefined && row[col] !== null ? row[col] : '')}
                                    </td>
                                  ))}
                                  <td className="px-6 py-4 text-right shrink-0">
                                    <button
                                      onClick={() => {
                                        setFormErrors([]);
                                        setSelectedRecord(row);
                                        setShowEditModal(true);
                                      }}
                                      className="text-xs text-emerald-400 hover:text-emerald-400 mr-4 font-bold transition"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(row.id)}
                                      className="text-xs text-red-400 hover:text-red-300 font-bold transition"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }

                if (comp.type === 'Form') {
                  const fields = comp.props?.fields || [];
                  return (
                    <div key={comp.id} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-zinc-800/85 rounded-2xl p-6 shadow-xl max-w-2xl">
                      <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Create {comp.props.model}</h3>
                      <form onSubmit={handleCreateRecord} className="space-y-4">
                        {fields.map((f: any) => (
                          <div key={f.name}>
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{f.label || formatHeader(f.name)}
                            </label>
                            {f.type === 'select' ? (
                              <select
                                name={f.name}
                                className="w-full bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                              >
                                {f.options?.map((opt: string) => (
                                  <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={f.type === 'number' ? 'number' : 'text'}
                                name={f.name}
                                placeholder={`Enter ${f.label || formatHeader(f.name)}`}
                                className="w-full bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors focus:ring-2 focus:ring-emerald-500/10"
                              />
                            )}
                          </div>
                        ))}
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition duration-200 shadow-md shadow-emerald-950/20"
                        >
                          Submit Entry
                        </button>
                      </form>
                    </div>
                  );
                }

                if (comp.type === 'Calculator') {
                  return (
                    <div key={comp.id} className="flex justify-center p-6">
                      <CalculatorWidget />
                    </div>
                  );
                }

                if (comp.type === 'Kanban') {
                  const columns = comp.props?.columns || (activePageModelName === 'Lead' ? ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost'] : ['To Do', 'In Progress', 'Done']);
                  return (
                    <div key={comp.id} className="space-y-4">
                      <KanbanWidget
                        appId={appId}
                        modelName={comp.props.model || activePageModelName}
                        columns={columns}
                        records={pageRecords}
                        onRefresh={fetchRecords}
                      />
                    </div>
                  );
                }

                if (comp.type === 'Calendar') {
                  return (
                    <div key={comp.id} className="space-y-4">
                      <CalendarWidget
                        appId={appId}
                        modelName={comp.props.model || activePageModelName}
                        records={pageRecords}
                        onRefresh={fetchRecords}
                        onCreateClick={(dateStr) => {
                          setFormErrors([]);
                          setShowCreateModal(true);
                          setTimeout(() => {
                            const dateInput = document.querySelector('input[type="date"], input[name*="Date"], input[name*="Time"]') as HTMLInputElement;
                            if (dateInput) {
                              dateInput.value = dateStr;
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  );
                }

                if (comp.type === 'Chart') {
                  const columns = comp.props?.columns || ['name', 'value'];
                  return (
                    <div key={comp.id} className="space-y-4">
                      <ChartWidget
                        records={pageRecords}
                        modelName={comp.props.model || activePageModelName}
                        columns={columns}
                      />
                    </div>
                  );
                }

                if (comp.type === 'Checklist') {
                  return (
                    <div key={comp.id} className="space-y-4">
                      <ChecklistWidget
                        appId={appId}
                        modelName={comp.props.model || activePageModelName}
                        records={pageRecords}
                        onRefresh={fetchRecords}
                      />
                    </div>
                  );
                }

                if (comp.type === 'Notes') {
                  return (
                    <div key={comp.id} className="space-y-4">
                      <NotesWidget appId={appId} />
                    </div>
                  );
                }

                if (comp.type === 'WizardForm') {
                  return <WizardFormWidget key={comp.id} appId={appId} modelName={comp.props.model || activePageModelName} records={pageRecords} onRefresh={fetchRecords} />;
                }

                if (comp.type === 'GalleryGrid') {
                  return <GalleryGridWidget key={comp.id} records={pageRecords} />;
                }

                if (comp.type === 'Feed') {
                  return <FeedWidget key={comp.id} records={pageRecords} />;
                }

                if (comp.type === 'DetailView') {
                  return <DetailViewWidget key={comp.id} records={pageRecords} />;
                }

                return (
                  <div key={comp.id} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
                    Graceful Fallback: Unknown component type "{comp.type}" was bypassed.
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-850 rounded-2xl p-16 text-center text-zinc-550">
              No pages configured in application metadata.
            </div>
          )}
        </div>

        {/* Workflow Logs Bottom Drawer */}
        {showLogsDrawer && (
          <div className="h-80 bg-zinc-900 border-t border-zinc-800 flex flex-col shrink-0 z-40 animate-in slide-in-from-bottom duration-200">
            {/* Header */}
            <div className="bg-zinc-950 px-6 py-3 border-b border-zinc-850 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Workflow Execution Audit Logs</span>
                <span className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">
                  Polling Active
                </span>
              </div>
              <button
                onClick={() => {
                  setShowLogsDrawer(false);
                  setSelectedLog(null);
                }}
                className="text-zinc-500 hover:text-white leading-none text-xl"
              >
                &times;
              </button>
            </div>

            {/* Split layout: List on left, Details on right */}
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 border-r border-zinc-850 overflow-y-auto divide-y divide-zinc-850/50">
                {workflowLogs.length === 0 ? (
                  <p className="text-xs text-zinc-550 p-6 italic text-center">No workflows have executed yet.</p>
                ) : (
                  workflowLogs.map((log) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`w-full text-left p-4 hover:bg-zinc-800/45 transition-colors flex justify-between items-start gap-4 ${
                        selectedLog?.id === log.id ? 'bg-zinc-800/30' : ''
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs font-bold text-zinc-200 truncate">{log.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase font-semibold">
                          On {log.event}
                        </p>
                      </div>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {log.status}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Details log output terminal */}
              <div className="w-2/3 p-6 overflow-y-auto bg-zinc-950 font-mono text-[11px] text-zinc-300 leading-relaxed">
                {selectedLog ? (
                  <div>
                    <div className="flex justify-between items-center border-b border-zinc-850 pb-3 mb-3 shrink-0">
                      <p className="text-xs font-bold text-emerald-400">Log Details: {selectedLog.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        Executed {new Date(selectedLog.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <pre className="whitespace-pre-wrap">{selectedLog.logs || 'No log details available.'}</pre>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-550 italic">
                    Select a workflow execution on the left to inspect logs.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Dynamic Create Record Modal */}
      {showCreateModal && activeModelDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-850 flex justify-between items-center bg-zinc-900/60">
              <h3 className="font-bold text-lg text-white">Create New {activePageModelName}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleCreateRecord} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-xs text-red-400 space-y-1">
                  {formErrors.map((err, idx) => (
                    <div key={idx}>{err.message}</div>
                  ))}
                </div>
              )}

              {activeModelDef.fields?.map((f: any) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-zinc-450 uppercase tracking-wider mb-1">
                    {formatHeader(f.name)} {f.required ? '*' : ''}
                  </label>
                  <input
                    type={f.type === 'Int' || f.type === 'Float' ? 'number' : 'text'}
                    name={f.name}
                    required={!!f.required}
                    className="w-full bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-450 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/20 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dynamic Edit Record Modal */}
      {showEditModal && activeModelDef && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-zinc-850 flex justify-between items-center bg-zinc-900/60">
              <h3 className="font-bold text-lg text-white">Edit Record</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-zinc-400 hover:text-white text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditRecord} className="p-6 space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-xs text-red-400 space-y-1">
                  {formErrors.map((err, idx) => (
                    <div key={idx}>{err.message}</div>
                  ))}
                </div>
              )}

              {activeModelDef.fields?.map((f: any) => (
                <div key={f.name}>
                  <label className="block text-xs font-bold text-zinc-450 uppercase tracking-wider mb-1">
                    {formatHeader(f.name)} {f.required ? '*' : ''}
                  </label>
                  <input
                    type={f.type === 'Int' || f.type === 'Float' ? 'number' : 'text'}
                    name={f.name}
                    defaultValue={selectedRecord[f.name] !== undefined ? selectedRecord[f.name] : ''}
                    required={!!f.required}
                    className="w-full bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-colors"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-450 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-950/20 transition-colors"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Mapping Modal */}
      {showCsvModal && activeModelDef && (
        <CSVImportModal
          isOpen={showCsvModal}
          onClose={() => setShowCsvModal(false)}
          modelName={csvTargetModel}
          fields={csvModelFields}
          onImportComplete={handleCsvComplete}
          appId={appId}
        />
      )}
    </div>
  );
}

function CalculatorWidget() {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isFinished, setIsFinished] = useState(false);

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsFinished(false);
  };

  const handleBackspace = () => {
    if (isFinished) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display !== '0') {
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    if (!isNaN(val)) {
      setDisplay(String(val / 100));
      setIsFinished(true);
    }
  };

  const handleNumber = (num: string) => {
    if (isFinished) {
      setDisplay(num);
      setIsFinished(false);
      return;
    }
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleDecimal = () => {
    if (isFinished) {
      setDisplay('0.');
      setIsFinished(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    const lastChar = equation.trim().slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar) && display === '0') {
      setEquation(equation.slice(0, -2) + ' ' + op + ' ');
      return;
    }
    setEquation(equation + ' ' + display + ' ' + op + ' ');
    setDisplay('0');
    setIsFinished(false);
  };

  const handleEqual = () => {
    let fullEq = equation + ' ' + display;
    try {
      const cleanEq = fullEq.replace(/[^-()\d/*+.]/g, '');
      const res = new Function(`return ${cleanEq}`)();
      setDisplay(String(res));
      setEquation('');
      setIsFinished(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setIsFinished(true);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm mx-auto backdrop-blur-md">
      <div className="text-right mb-6 pr-2 font-mono">
        <div className="text-[10px] text-zinc-500 min-h-[15px] truncate tracking-wider">{equation || '\u00A0'}</div>
        <div className="text-4xl font-black text-white mt-1 truncate select-all">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <button type="button" onClick={handleClear} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-emerald-400 font-extrabold text-sm transition-colors duration-150">C</button>
        <button type="button" onClick={handleBackspace} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-350 font-bold text-sm transition-colors duration-150">Del</button>
        <button type="button" onClick={handlePercent} className="h-12 rounded-2xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-300 font-bold text-sm transition-colors duration-150">%</button>
        <button type="button" onClick={() => handleOperator('/')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">/</button>
        
        <button type="button" onClick={() => handleNumber('7')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">7</button>
        <button type="button" onClick={() => handleNumber('8')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">8</button>
        <button type="button" onClick={() => handleNumber('9')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">9</button>
        <button type="button" onClick={() => handleOperator('*')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">*</button>
        
        <button type="button" onClick={() => handleNumber('4')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">4</button>
        <button type="button" onClick={() => handleNumber('5')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">5</button>
        <button type="button" onClick={() => handleNumber('6')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">6</button>
        <button type="button" onClick={() => handleOperator('-')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">-</button>
        
        <button type="button" onClick={() => handleNumber('1')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">1</button>
        <button type="button" onClick={() => handleNumber('2')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">2</button>
        <button type="button" onClick={() => handleNumber('3')} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">3</button>
        <button type="button" onClick={() => handleOperator('+')} className="h-12 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 font-bold text-sm transition-colors duration-150">+</button>
        
        <button type="button" onClick={() => handleNumber('0')} className="h-12 col-span-2 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155 text-left pl-6">0</button>
        <button type="button" onClick={handleDecimal} className="h-12 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800/80 text-white font-semibold text-sm transition-colors duration-155">.</button>
        <button type="button" onClick={handleEqual} className="h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-750 hover:to-teal-700 text-white font-bold text-sm transition-colors duration-150 shadow-lg shadow-emerald-950/20">=</button>
      </div>
    </div>
  );
}

interface KanbanWidgetProps {
  appId: string;
  modelName: string;
  columns: string[];
  records: any[];
  onRefresh: () => void;
}

function KanbanWidget({ appId, modelName, columns, records, onRefresh }: KanbanWidgetProps) {
  const stages = modelName === 'Lead'
    ? ['Lead', 'Contacted', 'Proposal', 'Won', 'Lost']
    : (modelName === 'Ticket' ? ['Open', 'In Progress', 'Resolved'] : ['To Do', 'In Progress', 'Done']);

  const moveCard = async (recordId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}/${recordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto pb-6 pt-2">
      {stages.map((stage) => {
        const filtered = records.filter(r => {
          const val = String(r.status || '').trim();
          return val.toLowerCase() === stage.toLowerCase() || (!r.status && stage === stages[0]);
        });

        return (
          <div key={stage} className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 min-w-[240px] flex flex-col min-h-[450px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-black text-zinc-350 tracking-wider uppercase">{stage}</h4>
              <span className="text-[10px] font-black bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-full border border-zinc-700/40">
                {filtered.length}
              </span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-0.5 scrollbar-thin">
              {filtered.map(rec => {
                const title = rec.title || rec.fullName || rec.name || Object.values(rec)[0] || 'Untitled';
                return (
                  <div key={rec.id} className="bg-gradient-to-br from-slate-950 to-slate-900 border border-zinc-850 hover:border-zinc-750 p-4 rounded-xl shadow-xl transition-all group duration-200">
                    <p className="text-xs font-bold text-white mb-2">{String(title)}</p>
                    
                    <div className="space-y-1 mb-4">
                      {Object.entries(rec).map(([key, val]) => {
                        if (['id', 'status', 'title', 'fullName', 'name', 'createdAt', 'updatedAt'].includes(key)) return null;
                        if (typeof val === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between text-[10px]">
                            <span className="text-zinc-500">{formatHeader(key)}:</span>
                            <span className="text-zinc-350 truncate max-w-[130px] font-mono">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-zinc-850/80">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                      <select
                        value={rec.status || stages[0]}
                        onChange={(e) => moveCard(rec.id, e.target.value)}
                        className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 text-[10px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none cursor-pointer font-semibold transition"
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-850 rounded-xl py-12 text-center">
                  <p className="text-[10px] text-zinc-600 italic">Drag/Add card here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface CalendarWidgetProps {
  appId: string;
  modelName: string;
  records: any[];
  onRefresh: () => void;
  onCreateClick: (dateStr: string) => void;
}

function CalendarWidget({ appId, modelName, records, onRefresh, onCreateClick }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper to find date field inside record
  const getDateString = (r: any) => {
    return r.sessionDate || r.bookingDate || r.returnDate || r.classDate || r.date || '';
  };

  const getRecordTitle = (r: any) => {
    return r.memberName || r.guestName || r.bookTitle || r.courseName || r.title || r.fullName || 'Booking';
  };

  const handleDelete = async (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this scheduled item?')) return;
    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}/${recordId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Generate calendar grid
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const calendarDays: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  // Prefix days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, isCurrentMonth: true, dateStr });
  }

  // Suffix days
  const remaining = 42 - calendarDays.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarDays.push({ day: d, isCurrentMonth: false, dateStr });
  }

  const navigatePrev = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const navigateNext = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="p-6 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/20">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">{monthNames[month]} {year}</h3>
          <p className="text-xs text-zinc-450 mt-0.5">Click any day cell to add a new reservation or booking.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={navigatePrev}
            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-350 p-2 rounded-xl text-xs font-bold transition"
          >
            &larr; Prev
          </button>
          <button
            onClick={navigateNext}
            className="border border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-350 p-2 rounded-xl text-xs font-bold transition"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[1px] bg-zinc-850 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="bg-zinc-950 text-zinc-500 py-3 text-[10px] font-black uppercase tracking-widest">{d}</div>
        ))}

        {calendarDays.map((cell, idx) => {
          // Find records on this day
          const dayRecords = records.filter(r => {
            const dateVal = getDateString(r);
            return String(dateVal).trim().startsWith(cell.dateStr);
          });

          return (
            <div
              key={idx}
              onClick={() => onCreateClick(cell.dateStr)}
              className={`min-h-[100px] bg-zinc-900/40 p-2 text-left flex flex-col justify-between hover:bg-zinc-800/35 transition cursor-pointer select-none border-b border-r border-zinc-850/60 relative group ${
                cell.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-600'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-bold font-mono ${
                  cell.isCurrentMonth ? 'text-zinc-300' : 'text-zinc-650'
                }`}>
                  {cell.day}
                </span>
                
                <span className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1 rounded transition border border-emerald-500/10">
                  + Add
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 mt-1 pr-0.5 scrollbar-none max-h-[70px]">
                {dayRecords.map(r => (
                  <div
                    key={r.id}
                    onClick={(e) => e.stopPropagation()} // Don't trigger create model on tag click
                    className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 rounded-lg p-1.5 flex justify-between items-center group/tag transition duration-150"
                  >
                    <div className="truncate pr-1">
                      <p className="text-[9px] font-black text-zinc-100 truncate">{getRecordTitle(r)}</p>
                      {r.trainerName && <p className="text-[8px] text-zinc-450 truncate">T: {r.trainerName}</p>}
                      {r.tableNumber && <p className="text-[8px] text-zinc-450 truncate">Table: {r.tableNumber}</p>}
                      {r.borrowerName && <p className="text-[8px] text-zinc-450 truncate">To: {r.borrowerName}</p>}
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      className="text-red-400 hover:text-red-300 text-[9px] leading-none px-1 py-0.5 rounded opacity-0 group-hover/tag:opacity-100 transition font-bold"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChartWidgetProps {
  records: any[];
  modelName: string;
  columns: string[];
}

function ChartWidget({ records, modelName, columns }: ChartWidgetProps) {
  if (records.length === 0) {
    return (
      <div className="bg-zinc-900/40 border border-dashed border-zinc-850 rounded-2xl p-10 text-center text-zinc-500 italic text-xs">
        No records available to chart. Add data to visualize.
      </div>
    );
  }

  // Label key is the first column, value key is the second
  const labelKey = columns[0] || 'name';
  const valKey = columns[1] || 'value';

  // Extract values
  const chartData = records.map(r => {
    const label = String(r[labelKey] || r.name || r.fullName || r.title || 'Entry');
    const val = parseFloat(r[valKey]);
    return {
      label,
      value: isNaN(val) ? 1 : val
    };
  }).slice(0, 10); // Limit to top 10 for neatness

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="mb-6">
        <h3 className="text-base font-black text-white uppercase tracking-wider">{modelName} Aggregates</h3>
        <p className="text-xs text-zinc-450 mt-0.5">Visualizing numeric distribution of records.</p>
      </div>

      <div className="space-y-4">
        {chartData.map((item, idx) => {
          const percentage = (item.value / maxVal) * 100;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300">{item.label}</span>
                <span className="text-emerald-400 font-mono">{item.value.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-850/50">
                <div
                  style={{ width: `${percentage}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ChecklistWidgetProps {
  appId: string;
  modelName: string;
  records: any[];
  onRefresh: () => void;
}

function ChecklistWidget({ appId, modelName, records, onRefresh }: ChecklistWidgetProps) {
  const [newItemTitle, setNewItemTitle] = useState('');

  // Detect status field or completed field
  const toggleRecord = async (rec: any) => {
    let updateBody: any = {};
    if (rec.completed !== undefined) {
      updateBody.completed = !rec.completed;
    } else if (rec.status !== undefined) {
      updateBody.status = rec.status === 'Done' ? 'To Do' : 'Done';
    } else {
      // default behavior
      updateBody.completed = !rec.completed;
    }

    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}/${rec.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const body: any = {
      title: newItemTitle.trim(),
      status: 'To Do',
      priority: 'Medium',
      completed: false
    };

    try {
      const res = await fetch(`/api/apps/${appId}/data/${modelName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setNewItemTitle('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isChecked = (rec: any) => {
    if (rec.completed !== undefined) return !!rec.completed;
    if (rec.status !== undefined) return rec.status === 'Done' || rec.status === 'Completed';
    return false;
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm max-w-xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">{modelName} Checklist</h3>
          <p className="text-xs text-zinc-450 mt-0.5">Toggle checkbox to check off entries.</p>
        </div>
      </div>

      <form onSubmit={handleAddItem} className="mb-5 flex gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder={`Add new ${modelName.toLowerCase()}...`}
          className="flex-1 bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition font-medium"
        />
        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 rounded-xl transition duration-150 shadow"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {records.map(rec => {
          const title = rec.title || rec.fullName || rec.name || Object.values(rec)[0] || 'Untitled';
          const done = isChecked(rec);
          return (
            <div
              key={rec.id}
              onClick={() => toggleRecord(rec)}
              className="bg-zinc-950/40 border border-zinc-850 hover:border-zinc-800 rounded-xl p-3.5 flex items-center gap-3 cursor-pointer select-none transition"
            >
              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-zinc-700 bg-zinc-900'
              }`}>
                {done && (
                  <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={`text-xs font-semibold transition ${
                done ? 'line-through text-zinc-500' : 'text-zinc-200'
              }`}>
                {String(title)}
              </span>
            </div>
          );
        })}

        {records.length === 0 && (
          <div className="text-center py-6 text-zinc-500 italic text-xs border border-dashed border-zinc-850 rounded-xl">
            No items in checklist yet.
          </div>
        )}
      </div>
    </div>
  );
}

interface NoteItem {
  id: string;
  content: string;
  color: string;
}

function NotesWidget({ appId }: { appId: string }) {
  const [notes, setNotes] = useState<NoteItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(`app-notes-${appId}`);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, [appId]);

  const saveNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    localStorage.setItem(`app-notes-${appId}`, JSON.stringify(updated));
  };

  const addNote = () => {
    const colors = [
      'bg-amber-400/90 text-zinc-900 border-amber-300',
      'bg-sky-400/90 text-zinc-900 border-sky-300',
      'bg-rose-400/90 text-zinc-900 border-rose-300',
      'bg-emerald-400/90 text-zinc-900 border-emerald-300',
      'bg-purple-400/90 text-zinc-900 border-purple-300'
    ];
    const newNote = {
      id: Math.random().toString(36).substr(2, 9),
      content: '',
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    saveNotes([...notes, newNote]);
  };

  const updateNoteContent = (id: string, text: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, content: text } : n);
    saveNotes(updated);
  };

  const updateNoteColor = (id: string, colorClass: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, color: colorClass } : n);
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
  };

  const colorPalettes = [
    'bg-amber-400/90 text-zinc-900 border-amber-300',
    'bg-sky-400/90 text-zinc-900 border-sky-300',
    'bg-rose-400/90 text-zinc-900 border-rose-300',
    'bg-emerald-400/90 text-zinc-900 border-emerald-300',
    'bg-purple-400/90 text-zinc-900 border-purple-300'
  ];

  return (
    <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-wider">Scratchpad Sticky Notes</h3>
          <p className="text-xs text-zinc-450 mt-0.5">Draft ideas and post drafts. Saved locally.</p>
        </div>
        <button
          onClick={addNote}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 shadow"
        >
          + Add Note
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {notes.map(note => (
          <div
            key={note.id}
            className={`rounded-2xl p-4 flex flex-col h-48 border shadow-lg transition-transform hover:-translate-y-0.5 duration-200 ${note.color}`}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-1">
                {colorPalettes.map(c => (
                  <button
                    key={c}
                    onClick={() => updateNoteColor(note.id, c)}
                    className={`w-2.5 h-2.5 rounded-full border border-black/10 ${c.split(' ')[0]}`}
                  />
                ))}
              </div>
              <button
                onClick={() => deleteNote(note.id)}
                className="text-zinc-800 hover:text-black text-xs font-black"
              >
                &times;
              </button>
            </div>

            <textarea
              value={note.content}
              onChange={(e) => updateNoteContent(note.id, e.target.value)}
              placeholder="Jot down something..."
              className="flex-1 bg-transparent resize-none focus:outline-none text-xs font-medium placeholder-slate-700 leading-relaxed scrollbar-none"
            />
          </div>
        ))}

        {notes.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-500 italic text-xs border border-dashed border-zinc-850 rounded-xl">
            No notes here. Click "+ Add Note" to create one.
          </div>
        )}
      </div>
    </div>
  );
}

function WizardFormWidget({ records }: any) {
  const [step, setStep] = useState(0);
  if (!records || records.length === 0) return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">No steps or questions found in the database. Add records first!</div>;
  const current = records[step];
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Interactive Wizard</span>
          <h3 className="text-xl font-black text-white mt-2">Step {step + 1} of {records.length}</h3>
        </div>
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path className="text-zinc-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="text-emerald-500 transition-all duration-500" strokeDasharray={`${((step + 1) / records.length) * 100}, 100`} strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <span className="absolute text-[10px] font-bold text-white">{Math.round(((step + 1) / records.length) * 100)}%</span>
        </div>
      </div>
      <div className="mb-8 space-y-4">
        {Object.entries(current).map(([k, v]) => {
          if (k === 'id' || k === 'createdAt' || k === 'updatedAt' || k === 'userId') return null;
          return (
            <div key={k} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
              <span className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{k}</span>
              <span className="text-sm font-medium text-zinc-200">{String(v)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="px-5 py-2.5 border border-zinc-700 hover:bg-zinc-800 rounded-xl text-xs font-bold text-zinc-300 disabled:opacity-30 transition-colors">
          Previous Step
        </button>
        <button onClick={() => { if (step < records.length - 1) setStep(step + 1); else alert('Wizard Completed! In a real app, this would submit the final payload.'); }} className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black tracking-wide shadow-lg shadow-emerald-900/50 transition-all">
          {step < records.length - 1 ? 'Next Step' : 'Complete & Submit'}
        </button>
      </div>
    </div>
  );
}

function GalleryGridWidget({ records }: any) {
  if (!records || records.length === 0) return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">No items in the gallery.</div>;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {records.map((r: any, i: number) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl hover:border-zinc-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
          <div className="h-48 bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
            <span className="text-5xl drop-shadow-lg opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all">📸</span>
          </div>
          <div className="p-5">
            <h4 className="font-bold text-white mb-2 truncate text-lg">{r.name || r.title || r.productName || 'Item ' + (i+1)}</h4>
            <div className="space-y-1">
              {Object.entries(r).slice(0, 3).map(([k, v]) => {
                if (k === 'id' || k === 'createdAt' || k === 'updatedAt') return null;
                return <p key={k} className="text-xs text-zinc-400 line-clamp-1"><span className="font-semibold text-zinc-500">{k}:</span> {String(v)}</p>;
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-zinc-800/60 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">View Details</span>
              <span className="text-[10px] text-zinc-600">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedWidget({ records }: any) {
  if (!records || records.length === 0) return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">Your feed is empty.</div>;
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {records.map((r: any, i: number) => {
        const author = String(r.name || r.author || r.user || r.username || 'Anonymous User');
        return (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-md flex gap-5 hover:bg-zinc-800/30 transition-colors">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
              {author.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-zinc-100">{author}</h4>
                  <span className="text-[10px] text-zinc-500 font-medium">@{author.toLowerCase().replace(/\s/g, '')}</span>
                </div>
                <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-1 rounded-full">{r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : ''}</span>
              </div>
              <div className="text-sm text-zinc-300 leading-relaxed bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                {r.content || r.message || r.post || r.description || JSON.stringify(r)}
              </div>
              <div className="flex gap-4 mt-4">
                <button className="text-[11px] font-semibold text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>❤️</span> Like
                </button>
                <button className="text-[11px] font-semibold text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>💬</span> Comment
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DetailViewWidget({ records }: any) {
  if (!records || records.length === 0) return <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">No record selected for detail view.</div>;
  const r = records[0];
  return (
    <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
      <div className="h-64 bg-gradient-to-br from-zinc-800 to-emerald-950 flex items-end p-8 border-b border-zinc-800 relative">
        <div className="absolute top-6 right-6 flex gap-2">
           <button className="bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-700 text-xs font-bold text-white px-4 py-2 rounded-xl backdrop-blur-md transition-colors">Edit</button>
           <button className="bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white px-4 py-2 rounded-xl transition-colors shadow-lg">Share</button>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">{r.title || r.name || r.id || 'Detail View'}</h1>
      </div>
      <div className="p-8 bg-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {Object.entries(r).map(([k, v]) => {
            if (k === 'id') return null;
            return (
              <div key={k} className="border-b border-zinc-800/50 pb-4">
                <h3 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-1.5">{k}</h3>
                <p className="text-sm font-medium text-zinc-200">{String(v)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

