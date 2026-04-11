import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Bot, Building2, DatabaseZap, ShieldCheck, Upload, UserCog } from 'lucide-react';
import clsx from 'clsx';

type RoleId = 'owner' | 'office_manager' | 'provider' | 'advisor';

type UploadDraft = {
  id: string;
  name: string;
  size: number;
  detectedType: string;
  detectedAs: string;
  rowEstimate: number;
  status: string;
};

const STORAGE_KEYS = {
  role: 'practiceos:selected-role',
  onboarding: 'practiceos:onboarding-draft',
  uploads: 'practiceos:upload-staging'
};

const topMetrics = [
  { label: 'TTM Revenue', value: '$2.03M', delta: '+8.2% vs prior TTM', tone: 'positive' },
  { label: 'TTM Net Profit', value: '$311K', delta: '+$41K vs prior TTM', tone: 'positive' },
  { label: 'Revenue / wRVU', value: '$68.40', delta: '+4.1% QoQ', tone: 'positive' },
  { label: 'Overhead Ratio', value: '63.8%', delta: '-1.7 pts vs target', tone: 'positive' }
] as const;

const monthlyTrend = [
  { month: 'Oct', revenue: 162, expenses: 132, net: 30 },
  { month: 'Nov', revenue: 171, expenses: 138, net: 33 },
  { month: 'Dec', revenue: 165, expenses: 141, net: 24 },
  { month: 'Jan', revenue: 176, expenses: 146, net: 30 },
  { month: 'Feb', revenue: 191, expenses: 140, net: 51 },
  { month: 'Mar', revenue: 183, expenses: 148, net: 35 }
];

const revenueMix = [
  { name: 'Insurance', value: 46, color: 'bg-sky-300' },
  { name: 'Patient Pay', value: 24, color: 'bg-emerald-300' },
  { name: 'Surgery', value: 18, color: 'bg-violet-300' },
  { name: 'Optical', value: 12, color: 'bg-amber-300' }
];

const ingestionSources = [
  { name: 'IBC Checking', status: 'Healthy', lastImport: '2 hours ago', type: 'Bank' },
  { name: 'Gusto Payroll', status: 'Healthy', lastImport: 'Today 8:12 AM', type: 'Payroll' },
  { name: 'Nextech Medical', status: 'Needs review', lastImport: 'Yesterday', type: 'EHR' },
  { name: 'RAMP Card', status: 'Healthy', lastImport: 'Today 6:44 AM', type: 'Card' }
];

const benchmarkRows = [
  { metric: 'Collections / Provider', practice: '$1.01M', benchmark: '$940K', percentile: '74th', width: '74%' },
  { metric: 'Staff Cost %', practice: '27.1%', benchmark: '29.8%', percentile: '68th', width: '68%' },
  { metric: 'Revenue / wRVU', practice: '$68.40', benchmark: '$63.20', percentile: '71st', width: '71%' },
  { metric: 'Net Margin', practice: '15.3%', benchmark: '11.4%', percentile: '79th', width: '79%' }
];

const aiPrompts = [
  'What drove February’s net income spike?',
  'Show me TTM net profit with owner add-backs excluded.',
  'How would EBITDA change if OBS cataract conversion rose 10%?',
  'Compare refractive revenue to marketing spend over the last 6 months.'
];

const onboardingSections = [
  {
    id: 'profile',
    title: 'Practice profile',
    body: 'Capture specialty, provider count, locations, and benchmark cohort preferences.',
    fields: [
      { key: 'practiceName', label: 'Practice name', placeholder: 'Physicians Eye Clinic of Laredo' },
      { key: 'specialty', label: 'Specialty', placeholder: 'Ophthalmology' },
      { key: 'providerCount', label: 'Providers', placeholder: '2' },
      { key: 'locations', label: 'Locations', placeholder: 'Laredo Main, Surgery Center' }
    ]
  },
  {
    id: 'financial',
    title: 'Financial stack',
    body: 'Map bank accounts, cards, payroll, financing, and bookkeeping sources.',
    fields: [
      { key: 'banks', label: 'Banking stack', placeholder: 'IBC, Chase LOC, Chase SBA' },
      { key: 'cards', label: 'Credit cards', placeholder: 'Barclays, RAMP' },
      { key: 'payroll', label: 'Payroll provider', placeholder: 'Gusto' },
      { key: 'bookkeeping', label: 'Bookkeeping source', placeholder: 'QuickBooks Online' }
    ]
  },
  {
    id: 'rules',
    title: 'Business rules',
    body: 'Define owner compensation treatment, internal transfers, facility fees, and service lines.',
    fields: [
      { key: 'ownerComp', label: 'Owner compensation policy', placeholder: 'Ad-back for EBITDA views' },
      { key: 'transfers', label: 'Internal transfer logic', placeholder: 'Exclude checking↔savings transfers' },
      { key: 'facility', label: 'Facility fee policy', placeholder: 'OBS fees tracked as separate service line' },
      { key: 'serviceLines', label: 'Service lines', placeholder: 'Medical, Refractive, Optical, OBS' }
    ]
  },
  {
    id: 'clinical',
    title: 'Clinical inputs',
    body: 'Connect EHR production exports and benchmark revenue to wRVUs, CPT, and providers.',
    fields: [
      { key: 'ehr', label: 'EHR / PM system', placeholder: 'Nextech' },
      { key: 'productionFeeds', label: 'Production streams', placeholder: 'Medical, Refractive, OBS' },
      { key: 'benchmarkCohort', label: 'Benchmark cohort', placeholder: 'Solo / Small group ophthalmology' },
      { key: 'notes', label: 'Implementation notes', placeholder: 'Need provider IDs mapped before launch' }
    ]
  }
] as const;

const roleOptions = [
  {
    id: 'owner',
    label: 'Owner',
    description: 'Full financial visibility, scenario modeling, and settings control.',
    permissions: ['All dashboard data', 'Scenario modeling', 'User management', 'Export access']
  },
  {
    id: 'office_manager',
    label: 'Office Manager',
    description: 'Operational visibility with import and close-process oversight.',
    permissions: ['Dashboard access', 'Import staging', 'Month close tracking']
  },
  {
    id: 'provider',
    label: 'Provider',
    description: 'Production, compensation, and performance-focused access only.',
    permissions: ['Production metrics', 'Provider benchmarking', 'Limited financial summary']
  },
  {
    id: 'advisor',
    label: 'Advisor',
    description: 'Read-only support for CFO, consultant, or transaction prep roles.',
    permissions: ['Read-only dashboard', 'Benchmark access', 'Export summaries']
  }
] as const;

const uploadTypeHints = [
  { id: 'bank', label: 'Bank / checking / savings' },
  { id: 'card', label: 'Corporate / credit card' },
  { id: 'payroll', label: 'Payroll export' },
  { id: 'ehr', label: 'EHR / production / collections' },
  { id: 'other', label: 'Other finance file' }
] as const;

const sampleUploads: UploadDraft[] = [
  {
    id: 'sample-1',
    name: 'IBC_March_2026.csv',
    size: 25872,
    detectedType: 'bank',
    detectedAs: 'IBC bank statement',
    rowEstimate: 231,
    status: 'Ready to map'
  },
  {
    id: 'sample-2',
    name: 'Gusto_Payroll_2026-03.csv',
    size: 4412,
    detectedType: 'payroll',
    detectedAs: 'Gusto payroll export',
    rowEstimate: 38,
    status: 'Mapping profile matched'
  }
];

function Card({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx('rounded-3xl border border-slate-200 bg-white p-6 shadow-sm', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function detectUpload(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes('gusto')) return { detectedType: 'payroll', detectedAs: 'Gusto payroll export' };
  if (lower.includes('nextech') || lower.includes('wrvu') || lower.includes('production')) return { detectedType: 'ehr', detectedAs: 'Nextech production export' };
  if (lower.includes('ramp') || lower.includes('barclays') || lower.includes('card')) return { detectedType: 'card', detectedAs: 'Corporate card export' };
  if (lower.includes('ibc') || lower.includes('checking') || lower.includes('chase') || lower.includes('bank')) return { detectedType: 'bank', detectedAs: 'Bank statement / transaction export' };
  return { detectedType: 'other', detectedAs: 'Generic finance file' };
}

function humanSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PracticeOSAppPage() {
  const [selectedRole, setSelectedRole] = useState<RoleId>('owner');
  const [activeStep, setActiveStep] = useState(0);
  const [onboardingDraft, setOnboardingDraft] = useState<Record<string, string>>({});
  const [uploads, setUploads] = useState<UploadDraft[]>(sampleUploads);

  useEffect(() => {
    const savedRole = window.localStorage.getItem(STORAGE_KEYS.role) as RoleId | null;
    const savedOnboarding = window.localStorage.getItem(STORAGE_KEYS.onboarding);
    const savedUploads = window.localStorage.getItem(STORAGE_KEYS.uploads);
    if (savedRole && roleOptions.some((role) => role.id === savedRole)) setSelectedRole(savedRole);
    if (savedOnboarding) setOnboardingDraft(JSON.parse(savedOnboarding));
    if (savedUploads) setUploads(JSON.parse(savedUploads));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.role, selectedRole);
  }, [selectedRole]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(onboardingDraft));
  }, [onboardingDraft]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.uploads, JSON.stringify(uploads));
  }, [uploads]);

  const roleDetails = useMemo(() => roleOptions.find((role) => role.id === selectedRole) ?? roleOptions[0], [selectedRole]);
  const currentStep = onboardingSections[activeStep];
  const completionCount = onboardingSections.filter((section) => section.fields.every((field) => Boolean(onboardingDraft[field.key]?.trim()))).length;
  const maxTrend = Math.max(...monthlyTrend.map((item) => item.revenue));

  function updateField(key: string, value: string) {
    setOnboardingDraft((current) => ({ ...current, [key]: value }));
  }

  function setUploadType(id: string, detectedType: string) {
    setUploads((current) => current.map((upload) => upload.id === id ? { ...upload, detectedType, status: 'Type adjusted' } : upload));
  }

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    const next = Array.from(fileList).map((file) => {
      const detection = detectUpload(file.name);
      return {
        id: `${file.name}-${file.size}-${Date.now()}`,
        name: file.name,
        size: file.size,
        detectedType: detection.detectedType,
        detectedAs: detection.detectedAs,
        rowEstimate: Math.max(12, Math.round(file.size / 160)),
        status: 'Preview staged'
      } satisfies UploadDraft;
    });
    setUploads((current) => [...next, ...current]);
    event.target.value = '';
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 md:px-10 xl:px-16">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[32px] border border-sky-400/20 bg-slate-900/70 p-8 shadow-2xl shadow-sky-950/20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">
              <Bot size={14} />
              PracticeOS / mounted at /app
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Financial intelligence for medical practices, wired into the real Crediteval app.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
              This route now exposes the MVP shell inside the live app: role framing, onboarding persistence, import staging, benchmark context, and executive metrics.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              {['/app route live', 'Role-aware UX', 'Onboarding memory', 'Import staging'].map((pill) => (
                <span key={pill} className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2">{pill}</span>
              ))}
            </div>
          </div>
          <div className="grid gap-4 rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-black/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Build status</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Iterations 1–4 mounted</h2>
              </div>
              <ArrowRight className="text-emerald-300" />
            </div>
            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3"><DatabaseZap className="mt-0.5 text-sky-300" size={18} /><p>Dashboard shell adapted to the existing Vite app instead of the separate local Next scaffold.</p></div>
              <div className="flex items-start gap-3"><Building2 className="mt-0.5 text-sky-300" size={18} /><p>Onboarding and import flows now persist locally so the route behaves like a usable prototype.</p></div>
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 text-sky-300" size={18} /><p>Ready for the next pass: real auth, persistence, and parser-backed imports.</p></div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topMetrics.map((metric) => (
            <Card key={metric.label} title={metric.label} className="bg-slate-900/95 border-slate-800 text-white">
              <div className="space-y-3">
                <div className="text-3xl font-semibold text-white">{metric.value}</div>
                <div className="text-sm text-emerald-300">{metric.delta}</div>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <Card title="TTM Revenue / Expense / Net trend" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="space-y-4">
              {monthlyTrend.map((point) => (
                <div key={point.month} className="grid gap-2">
                  <div className="flex items-center justify-between text-sm text-slate-300"><span>{point.month}</span><span>${point.revenue}k revenue / ${point.net}k net</span></div>
                  <div className="h-3 rounded-full bg-slate-800">
                    <div className="h-3 rounded-full bg-sky-300" style={{ width: `${(point.revenue / maxTrend) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Revenue mix" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="space-y-4">
              {revenueMix.map((item) => (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between text-sm"><span>{item.name}</span><span>{item.value}%</span></div>
                  <div className="h-3 rounded-full bg-slate-800"><div className={clsx('h-3 rounded-full', item.color)} style={{ width: `${item.value}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Auth + role access (iteration 2)" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="grid gap-3">
              {roleOptions.map((role) => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)} className={clsx('rounded-2xl border px-4 py-4 text-left transition', selectedRole === role.id ? 'border-sky-300/50 bg-sky-300/10' : 'border-slate-700 bg-slate-950/50 hover:border-sky-300/30')}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-white">{role.label}</div>
                      <div className="mt-1 text-sm text-slate-300">{role.description}</div>
                    </div>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">{role.id}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <div className="text-sm font-semibold text-sky-300">Active permissions</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">{roleDetails.permissions.map((permission) => <li key={permission}>• {permission}</li>)}</ul>
            </div>
          </Card>

          <Card title="Ingestion status" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="space-y-3">
              {ingestionSources.map((source) => (
                <div key={source.name} className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-4">
                  <div>
                    <div className="font-medium text-white">{source.name}</div>
                    <div className="mt-1 text-sm text-slate-400">{source.type} · last import {source.lastImport}</div>
                  </div>
                  <span className={clsx('rounded-full px-3 py-1 text-xs font-medium', source.status === 'Healthy' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200')}>{source.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card title="Onboarding draft (iteration 3)" action={<span className="text-xs text-slate-400">{completionCount}/{onboardingSections.length} complete</span>} className="bg-slate-900/95 border-slate-800 text-white">
            <div className="mb-4 flex flex-wrap gap-2">
              {onboardingSections.map((section, index) => (
                <button key={section.id} onClick={() => setActiveStep(index)} className={clsx('rounded-full border px-3 py-1.5 text-xs font-medium transition', index === activeStep ? 'border-sky-300/50 bg-sky-300/10 text-sky-200' : 'border-slate-700 text-slate-300')}>
                  {section.title}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
              <h4 className="text-lg font-semibold text-white">{currentStep.title}</h4>
              <p className="mt-1 text-sm text-slate-300">{currentStep.body}</p>
              <div className="mt-4 grid gap-3">
                {currentStep.fields.map((field) => (
                  <label key={field.key} className="grid gap-2 text-sm">
                    <span className="font-medium text-slate-200">{field.label}</span>
                    <input value={onboardingDraft[field.key] ?? ''} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300/50" />
                  </label>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Peer benchmark frame" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="space-y-4">
              {benchmarkRows.map((row) => (
                <div key={row.metric} className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-300"><span>{row.metric}</span><span className="text-sky-300">{row.percentile}</span></div>
                  <div className="h-3 rounded-full bg-slate-800"><div className="h-3 rounded-full bg-emerald-300" style={{ width: row.width }} /></div>
                  <div className="mt-3 flex items-center justify-between text-sm"><span>{row.practice}</span><span className="text-slate-400">Benchmark {row.benchmark}</span></div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card title="Import staging (iteration 4)" className="bg-slate-900/95 border-slate-800 text-white">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-sky-300/40 bg-slate-950/30 px-6 py-10 text-center transition hover:bg-slate-950/50">
              <Upload className="mb-3 text-sky-300" />
              <div className="text-lg font-semibold text-white">Drop files here or click to stage imports</div>
              <div className="mt-2 max-w-md text-sm text-slate-300">MVP staging detects likely file type from filename, estimates rows, and holds the file for review before a real import pipeline exists.</div>
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
            <div className="mt-4 space-y-3">
              {uploads.map((upload) => (
                <div key={upload.id} className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-medium text-white">{upload.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{humanSize(upload.size)} · ~{upload.rowEstimate} rows · {upload.detectedAs}</div>
                    </div>
                    <span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-200">{upload.status}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {uploadTypeHints.map((hint) => (
                      <button key={hint.id} onClick={() => setUploadType(upload.id, hint.id)} className={clsx('rounded-full border px-3 py-1.5 text-xs transition', upload.detectedType === hint.id ? 'border-sky-300/50 bg-sky-300/10 text-sky-200' : 'border-slate-700 text-slate-300')}>
                        {hint.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="AI prompt starters" className="bg-slate-900/95 border-slate-800 text-white">
            <div className="space-y-3">
              {aiPrompts.map((prompt) => (
                <button key={prompt} className="w-full rounded-2xl border border-slate-700 bg-slate-950/40 px-4 py-4 text-left text-sm text-slate-200 transition hover:border-sky-300/40 hover:bg-slate-950/60">
                  {prompt}
                </button>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
