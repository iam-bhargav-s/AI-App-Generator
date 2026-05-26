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

const getRecordValue = (recData: any, fieldName: string): any => {
  if (!recData || !fieldName) return undefined;
  if (recData[fieldName] !== undefined) return recData[fieldName];
  const key = Object.keys(recData).find(k => k.toLowerCase() === fieldName.toLowerCase());
  return key ? recData[key] : undefined;
};

const MOCK_RECORDS_FALLBACK: Record<string, any[]> = {
  Employee: [
    { firstName: "Sarah", lastName: "Connor", department: "Engineering", role: "Senior Developer", joinDate: "2023-01-15T00:00:00Z" },
    { firstName: "John", lastName: "Smith", department: "Sales", role: "Account Executive", joinDate: "2023-03-22T00:00:00Z" },
    { firstName: "Emily", lastName: "Chen", department: "Marketing", role: "Director", joinDate: "2022-11-10T00:00:00Z" },
    { firstName: "Michael", lastName: "Johnson", department: "Engineering", role: "DevOps Engineer", joinDate: "2023-06-05T00:00:00Z" },
    { firstName: "Jessica", lastName: "Davis", department: "HR", role: "HR Manager", joinDate: "2021-08-19T00:00:00Z" }
  ],
  TimeOff: [
    { employeeId: "EMP-001", type: "Vacation", startDate: "2024-07-10T00:00:00Z", endDate: "2024-07-20T00:00:00Z", status: "Approved" },
    { employeeId: "EMP-003", type: "Sick Leave", startDate: "2024-05-12T00:00:00Z", endDate: "2024-05-14T00:00:00Z", status: "Approved" },
    { employeeId: "EMP-002", type: "Personal", startDate: "2024-08-01T00:00:00Z", endDate: "2024-08-02T00:00:00Z", status: "Pending" },
    { employeeId: "EMP-004", type: "Vacation", startDate: "2024-09-15T00:00:00Z", endDate: "2024-09-22T00:00:00Z", status: "Approved" },
    { employeeId: "EMP-005", type: "Bereavement", startDate: "2024-03-01T00:00:00Z", endDate: "2024-03-03T00:00:00Z", status: "Approved" }
  ],
  Payroll: [
    { employeeId: "EMP-001", baseSalary: 120000, bonus: 15000, period: "2024-Q1" },
    { employeeId: "EMP-002", baseSalary: 85000, bonus: 8000, period: "2024-Q1" },
    { employeeId: "EMP-003", baseSalary: 140000, bonus: 20000, period: "2024-Q1" },
    { employeeId: "EMP-004", baseSalary: 110000, bonus: 10000, period: "2024-Q1" },
    { employeeId: "EMP-005", baseSalary: 95000, bonus: 5000, period: "2024-Q1" }
  ],
  Contact: [
    { firstName: "Alice", lastName: "Cooper", email: "alice@acmecorp.com", phone: "555-0101", company: "Acme Corp" },
    { firstName: "Bob", lastName: "Builder", email: "bob@buildit.com", phone: "555-0102", company: "BuildIt LLC" },
    { firstName: "Charlie", lastName: "Chaplin", email: "charlie@silentfilms.com", phone: "555-0103", company: "Silent Films" },
    { firstName: "Diana", lastName: "Prince", email: "diana@themyscira.com", phone: "555-0104", company: "Themyscira Inc" },
    { firstName: "Evan", lastName: "Wright", email: "evan@wrightbros.com", phone: "555-0105", company: "Wright Aviation" }
  ],
  Company: [
    { name: "Acme Corp", industry: "Manufacturing", website: "www.acmecorp.com", employeeCount: 150 },
    { name: "BuildIt LLC", industry: "Construction", website: "www.buildit.com", employeeCount: 45 },
    { name: "Silent Films", industry: "Entertainment", website: "www.silentfilms.com", employeeCount: 12 },
    { name: "Themyscira Inc", industry: "Defense", website: "www.themyscira.com", employeeCount: 5000 },
    { name: "Wright Aviation", industry: "Aerospace", website: "www.wrightbros.com", employeeCount: 250 }
  ],
  Deal: [
    { title: "Acme Q4 Enterprise License", amount: 120000, stage: "Closed Won", closeDate: "2024-10-15T00:00:00Z", companyId: "COM-001" },
    { title: "BuildIt Equipment Upgrade", amount: 45000, stage: "Negotiation", closeDate: "2024-11-30T00:00:00Z", companyId: "COM-002" },
    { title: "Silent Films Distribution", amount: 80000, stage: "Proposal", closeDate: "2024-12-15T00:00:00Z", companyId: "COM-003" },
    { title: "Themyscira Defense Contract", amount: 2500000, stage: "Discovery", closeDate: "2025-03-01T00:00:00Z", companyId: "COM-004" },
    { title: "Wright Fleet Expansion", amount: 500000, stage: "Closed Lost", closeDate: "2024-09-01T00:00:00Z", companyId: "COM-005" }
  ],
  Activity: [
    { type: "Call", description: "Initial discovery call with Alice", date: "2024-10-01T10:00:00Z", contactId: "CON-001" },
    { type: "Email", description: "Sent proposal to Bob", date: "2024-10-10T14:30:00Z", contactId: "CON-002" },
    { type: "Meeting", description: "On-site demo with Diana", date: "2024-10-20T09:00:00Z", contactId: "CON-004" },
    { type: "Call", description: "Follow up on fleet expansion", date: "2024-08-15T11:00:00Z", contactId: "CON-005" },
    { type: "Email", description: "Check in with Charlie", date: "2024-10-25T16:00:00Z", contactId: "CON-003" }
  ],
  Product: [
    { sku: "PRD-001", name: "Wireless Mouse", price: 25, stock: 150 },
    { sku: "PRD-002", name: "Mechanical Keyboard", price: 85, stock: 45 },
    { sku: "PRD-003", name: "USB-C Hub", price: 45, stock: 200 }
  ],
  Supplier: [
    { name: "Logitech", contactEmail: "support@logitech.com" },
    { name: "Keychron", contactEmail: "sales@keychron.com" }
  ],
  Warehouse: [
    { location: "New York", capacity: 5000 },
    { location: "San Francisco", capacity: 7500 }
  ],
  StockTransaction: [
    { productId: "PRD-001", quantity: 100, type: "RESTOCK", date: "2024-10-01T10:00:00Z" },
    { productId: "PRD-002", quantity: 10, type: "SALE", date: "2024-10-05T14:00:00Z" }
  ],
  Metric: [
    { name: "Daily Active Users", category: "Engagement", value: 45200, date: "2024-10-25T00:00:00Z" },
    { name: "Monthly Recurring Revenue", category: "Finance", value: 1250000, date: "2024-10-01T00:00:00Z" }
  ],
  Report: [
    { title: "Q3 Financial Summary", author: "Finance Team", status: "Published" }
  ],
  DataSource: [
    { provider: "Stripe", connectionStatus: "Healthy", lastSync: "2024-10-25T14:30:00Z" }
  ],
  User: [
    { email: "admin@oneatlas.com", role: "Admin", status: "Active" },
    { email: "member@oneatlas.com", role: "Member", status: "Active" }
  ],
  Role: [
    { name: "Admin", permissions: "All" },
    { name: "Member", permissions: "Read/Write" }
  ],
  AuditLog: [
    { userId: "USR-001", action: "LOGIN", timestamp: "2024-10-25T10:00:00Z" }
  ]
};

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
                    <div>
                      <h3 className="text-[16px] font-semibold text-[var(--text-primary)] capitalize">{activeModel?.ui?.chartType || 'bar'} Chart: {activeModelId} Overview</h3>
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Visualization of {activeModelId} records and metrics.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF6600] mt-1.5 animate-pulse"></span>
                      <span className="text-[13px] text-[var(--text-muted)]">Live Data</span>
                    </div>
                  </div>
                  {(() => {
                    const cType = activeModel?.ui?.chartType || 'bar';
                    
                    const chartItems = (() => {
                      if (records && records.length > 0) {
                        const numericField = activeModel?.fields?.find((f: any) => f.type === 'Int' || f.type === 'Float');
                        const labelField = activeModel?.fields?.find((f: any) => 
                          ['name', 'title', 'label', 'provider', 'firstName', 'department', 'type', 'status', 'stage', 'category', 'location', 'period'].includes(f.name)
                        ) || activeModel?.fields?.[0];

                        if (numericField) {
                          return records.map((rec: any) => {
                            const val = getRecordValue(rec.data, numericField.name);
                            const lbl = getRecordValue(rec.data, labelField?.name) || 'Record';
                            return {
                              label: typeof lbl === 'object' ? JSON.stringify(lbl) : String(lbl),
                              value: typeof val === 'number' ? val : parseInt(val) || 0
                            };
                          }).slice(0, 8);
                        } else if (labelField) {
                          const counts: Record<string, number> = {};
                          records.forEach((rec: any) => {
                            const val = getRecordValue(rec.data, labelField.name) || 'Other';
                            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                            counts[strVal] = (counts[strVal] || 0) + 1;
                          });
                          return Object.entries(counts).map(([label, value]) => ({ label, value })).slice(0, 8);
                        }
                      }

                      // Default template mock data
                      const modelName = activeModelId;
                      if (modelName === 'Metric') {
                        return [
                          { label: 'Active Users', value: 45200 },
                          { label: 'MRR ($)', value: 125000 },
                          { label: 'CAC ($)', value: 45 },
                          { label: 'Churn (%)', value: 2 },
                          { label: 'NPS', value: 72 }
                        ];
                      }
                      if (modelName === 'Report') {
                        return [
                          { label: 'Published', value: 4 },
                          { label: 'Draft', value: 2 },
                          { label: 'Archived', value: 1 }
                        ];
                      }
                      if (modelName === 'DataSource') {
                        return [
                          { label: 'Stripe', value: 98 },
                          { label: 'Google Analytics', value: 92 },
                          { label: 'Salesforce', value: 74 },
                          { label: 'Zendesk', value: 12 }
                        ];
                      }
                      if (modelName === 'Contact') {
                        return [
                          { label: 'Acme Corp', value: 8 },
                          { label: 'BuildIt LLC', value: 5 },
                          { label: 'Silent Films', value: 3 },
                          { label: 'Themyscira Inc', value: 12 }
                        ];
                      }
                      if (modelName === 'Company') {
                        return [
                          { label: 'Acme Corp', value: 150 },
                          { label: 'BuildIt LLC', value: 45 },
                          { label: 'Silent Films', value: 12 },
                          { label: 'Themyscira', value: 500 },
                          { label: 'Wright Aviation', value: 250 }
                        ];
                      }
                      if (modelName === 'Deal') {
                        return [
                          { label: 'Acme Q4', value: 120000 },
                          { label: 'BuildIt Upgrade', value: 45000 },
                          { label: 'Silent Films Dist', value: 80000 },
                          { label: 'Themyscira Def', value: 250000 },
                          { label: 'Wright Fleet', value: 150000 }
                        ];
                      }
                      if (modelName === 'Activity') {
                        return [
                          { label: 'Calls', value: 14 },
                          { label: 'Emails', value: 28 },
                          { label: 'Meetings', value: 6 }
                        ];
                      }
                      if (modelName === 'Employee') {
                        return [
                          { label: 'Engineering', value: 12 },
                          { label: 'Sales', value: 8 },
                          { label: 'Marketing', value: 5 },
                          { label: 'HR', value: 2 },
                          { label: 'Finance', value: 3 }
                        ];
                      }
                      if (modelName === 'TimeOff') {
                        return [
                          { label: 'Approved', value: 15 },
                          { label: 'Pending', value: 4 },
                          { label: 'Rejected', value: 2 }
                        ];
                      }
                      if (modelName === 'Payroll') {
                        return [
                          { label: 'Jan', value: 45000 },
                          { label: 'Feb', value: 48000 },
                          { label: 'Mar', value: 52000 },
                          { label: 'Apr', value: 55000 }
                        ];
                      }
                      if (modelName === 'Product') {
                        return [
                          { label: 'Product A', value: 120 },
                          { label: 'Product B', value: 85 },
                          { label: 'Product C', value: 200 },
                          { label: 'Product D', value: 45 }
                        ];
                      }
                      if (modelName === 'Supplier') {
                        return [
                          { label: 'Supplier Alpha', value: 10 },
                          { label: 'Supplier Beta', value: 15 },
                          { label: 'Supplier Gamma', value: 8 }
                        ];
                      }
                      if (modelName === 'Warehouse') {
                        return [
                          { label: 'East Coast', value: 1000 },
                          { label: 'West Coast', value: 1500 },
                          { label: 'Central', value: 800 }
                        ];
                      }
                      if (modelName === 'StockTransaction') {
                        return [
                          { label: 'Purchase', value: 140 },
                          { label: 'Sale', value: 210 },
                          { label: 'Adjustment', value: 15 }
                        ];
                      }

                      // Stable math fallback
                      return Array.from({length: 6}).map((_, i) => ({
                        label: `Category ${i + 1}`,
                        value: Math.max(10, Math.floor(Math.abs(Math.sin((activeModelId?.charCodeAt(0) || 1) * (i + 1))) * 100))
                      }));
                    })();

                    if (chartItems.length === 0) {
                      return (
                        <div className="flex items-center justify-center h-[180px] w-full text-[var(--text-muted)] text-[14px]">
                          No records available to display.
                        </div>
                      );
                    }

                    const maxVal = Math.max(...chartItems.map(item => item.value), 1);
                    const roundedMax = Math.ceil(maxVal / 10) * 10;

                    return (
                      <div className="flex flex-col w-full pt-4 border-t border-[var(--border-color)]">
                        <div className="flex w-full relative h-[180px]">
                          {/* Y Axis ticks */}
                          {cType !== 'pie' && (
                            <div className="flex flex-col justify-between text-[11px] text-[var(--text-muted)] h-full pr-3 border-r border-[var(--border-color)] text-right select-none w-[65px] font-mono shrink-0">
                              <span>{roundedMax.toLocaleString()}</span>
                              <span>{Math.floor(roundedMax / 2).toLocaleString()}</span>
                              <span>0</span>
                            </div>
                          )}

                          {/* Chart Container */}
                          <div className={`flex-1 relative h-full px-4 overflow-visible ${cType === 'pie' ? 'flex items-center justify-center gap-8' : ''}`}>
                            {cType === 'pie' ? (
                              (() => {
                                const total = chartItems.reduce((acc, item) => acc + item.value, 0);
                                let currentPercent = 0;
                                const colors = ['#FF6600', '#FF9933', '#FFE0B2', '#4B5563', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
                                
                                const gradients = chartItems.map((item, idx) => {
                                  const percentage = (item.value / total) * 100;
                                  const start = currentPercent;
                                  currentPercent += percentage;
                                  return `${colors[idx % colors.length]} ${start}% ${currentPercent}%`;
                                }).join(', ');

                                return (
                                  <div className="flex items-center justify-center gap-12 w-full h-full">
                                    {/* Pie circle */}
                                    <div className="w-[140px] h-[140px] rounded-full relative shadow-soft transition-transform hover:scale-105 shrink-0" style={{
                                      background: `conic-gradient(${gradients})`,
                                      boxShadow: 'inset 0 0 0 24px var(--bg-secondary)'
                                    }}>
                                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">Total</span>
                                        <span className="text-[16px] font-bold text-[var(--text-primary)]">{total.toLocaleString()}</span>
                                      </div>
                                    </div>
                                    
                                    {/* Legend */}
                                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-2">
                                      {chartItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
                                          <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                                          <span className="font-medium text-[var(--text-primary)] truncate max-w-[120px]">{item.label}</span>
                                          <span className="text-[var(--text-muted)] font-mono shrink-0">
                                            {item.value.toLocaleString()} ({((item.value / total) * 100).toFixed(0)}%)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()
                            ) : cType === 'line' ? (
                              (() => {
                                const points = chartItems.map((item, idx) => {
                                  const x = chartItems.length > 1 ? (idx / (chartItems.length - 1)) * 100 : 50;
                                  const y = 100 - (item.value / roundedMax) * 80 - 10; // Keep margins
                                  return { x, y, ...item };
                                });
                                const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                                const areaPointsStr = chartItems.length > 1 
                                  ? `0,100 ${pointsStr} 100,100`
                                  : `50,100 50,${points[0].y} 50,100`;

                                return (
                                  <div className="relative w-full h-full pt-2">
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 select-none py-[10%]">
                                      <div className="w-full border-t border-[var(--border-color)]"></div>
                                      <div className="w-full border-t border-[var(--border-color)]"></div>
                                      <div className="w-full border-t border-[var(--border-color)]"></div>
                                    </div>

                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                      <defs>
                                        <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" style={{stopColor: '#FF6600', stopOpacity: 0.3}} />
                                          <stop offset="100%" style={{stopColor: '#FF6600', stopOpacity: 0}} />
                                        </linearGradient>
                                      </defs>
                                      {/* Area Fill */}
                                      <polygon fill="url(#lineGrad)" points={areaPointsStr} />
                                      {/* Line */}
                                      {chartItems.length > 1 ? (
                                        <polyline
                                          fill="none"
                                          stroke="#FF6600"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          points={pointsStr}
                                        />
                                      ) : (
                                        <circle cx="50" cy={points[0].y} r="3" fill="#FF6600" />
                                      )}
                                    </svg>
                                    
                                    {/* Absolute dots & interactive hover overlays to bypass SVG scaling issues */}
                                    {points.map((p, idx) => {
                                      const leftPct = chartItems.length > 1 ? (idx / (chartItems.length - 1)) * 100 : 50;
                                      const topPct = 100 - (p.value / roundedMax) * 80 - 10;
                                      return (
                                        <div 
                                          key={idx} 
                                          className="absolute w-4 h-4 -ml-2 -mt-2 flex items-center justify-center group/dot cursor-pointer"
                                          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                                        >
                                          <div className="w-2 h-2 rounded-full bg-[#FF6600] border-2 border-[var(--bg-secondary)] shadow-soft transition-transform duration-150 group-hover/dot:scale-150"></div>
                                          {/* Tooltip */}
                                          <div className="absolute -top-10 bg-[var(--text-primary)] text-white text-[11px] font-semibold px-2 py-1 rounded shadow-lg opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 animate-fade-in">
                                            {p.label}: {p.value.toLocaleString()}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()
                            ) : (
                              // Bar Chart rendering
                              <div className="flex items-end justify-between gap-4 w-full h-full relative">
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 select-none py-1.5">
                                  <div className="w-full border-t border-[var(--border-color)]"></div>
                                  <div className="w-full border-t border-[var(--border-color)]"></div>
                                  <div className="w-full border-t border-[var(--border-color)]"></div>
                                </div>

                                {chartItems.map((item, idx) => {
                                  const heightPercent = (item.value / roundedMax) * 90; // Maximum height is 90%
                                  return (
                                    <div key={idx} className="flex-1 flex flex-col justify-end items-center h-full relative group">
                                      <div 
                                        className="w-full max-w-[42px] bg-[#FF6600] bg-opacity-25 hover:bg-opacity-45 border border-[#FF6600] border-opacity-40 rounded-t-[6px] transition-all duration-200 cursor-pointer relative flex justify-center"
                                        style={{ height: `${Math.max(8, heightPercent)}%` }}
                                      >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 bg-[var(--text-primary)] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-[6px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                          {item.label}: {item.value.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* X Axis Labels */}
                        {cType !== 'pie' && (
                          <div className="flex w-full pl-[65px] pt-3 border-t border-[var(--border-color)] select-none">
                            {chartItems.map((item, idx) => (
                              <div key={idx} className="flex-1 text-center text-[11px] text-[var(--text-secondary)] font-medium truncate px-1" title={item.label}>
                                {item.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                        {(() => {
                          const displayedRecords = records.length > 0 
                            ? records 
                            : (MOCK_RECORDS_FALLBACK[activeModelId] || []).map((data: any, idx: number) => ({
                                id: `mock-${idx}`,
                                data
                              }));

                          if (displayedRecords.length === 0) {
                            return (
                              <tr>
                                <td colSpan={activeModel?.fields?.length ? activeModel.fields.slice(0,5).length : 1} className="px-6 py-16 text-center text-[var(--text-muted)] text-[15px]">
                                  No {activeModelId} records found. Add one above!
                                </td>
                              </tr>
                            );
                          }

                          return displayedRecords.map((rec) => (
                            <tr key={rec.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-primary)]">
                              {activeModel?.fields?.slice(0, 5).map((f: any) => {
                                const val = getRecordValue(rec.data, f.name);
                                return (
                                  <td key={f.name} className="px-6 py-4 text-[var(--text-primary)] max-w-[200px] truncate">
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val !== undefined && val !== null ? val : '-')}
                                  </td>
                                );
                              })}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </main>

        {/* Right Panel: Edit History / Properties */}
        <aside className="w-[320px] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col shrink-0">
          <div className="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
            <h2 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-[0.08em] mb-4">Ask AI to Edit</h2>
            <form onSubmit={handleConversationalEdit} className="w-full relative flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] focus-within:border-[#FF6600] rounded-[8px] transition-colors shadow-soft">
              <input 
                type="text"
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder="e.g. 'Add a status field'"
                className="w-full bg-transparent px-3 py-2 pr-10 text-[13px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
                disabled={isEditing}
              />
              <button 
                type="submit"
                disabled={!editPrompt.trim() || isEditing}
                className="absolute right-1 w-6 h-6 flex items-center justify-center bg-[#FF6600] text-white rounded-[6px] hover:bg-[#e55c00] disabled:opacity-50 disabled:bg-[var(--border-color)] disabled:text-[var(--text-muted)] transition-transform hover:-translate-y-px"
              >
                {isEditing ? (
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                )}
              </button>
            </form>
          </div>
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
