import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarRange,
  ChevronDown,
  Download,
  Filter,
  Flame,
  LayoutDashboard,
  Lock,
  Plus,
  Search,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

type Temperature = "cold" | "warm" | "hot";
type Stage =
  | "New Lead"
  | "Proposal"
  | "Negotiation"
  | "Verbal Commit"
  | "Closed Won"
  | "Closed Lost";

type SourceOption =
  | "inbound CS"
  | "outbound email"
  | "outbound linkedin"
  | "referral";

type CompetitorOption =
  | "IEE"
  | "GB Translations"
  | "Fortis"
  | "Easy Translations";

type LostReason =
  | "price"
  | "spoke with the wrong person"
  | "didn't present enough value"
  | "wrong timing"
  | "not the sweet spot"
  | "exclusivity with competitor";

type WonReason =
  | "best value"
  | "right timing"
  | "strong relationship"
  | "clearer process"
  | "faster turnaround"
  | "better trust and credibility";

type Opportunity = {
  id: string;
  company: string;
  title: string;
  contact: string;
  contactEmail: string;
  owner: string;
  temperature: Temperature;
  probability: number;
  expectedCloseDate: string;
  createdDate: string;
  lastActivityDate: string;
  notes: string;
  phase: Stage;
  source: string;
  monthlyRevenuePotential: number;
  tags: string[];
  competitor: string;
  closedLostReason: string;
  closedWonReason: string;
};

const STORAGE_KEY = "crediteval-funnel-dashboard:v2";
const STAGES: Stage[] = [
  "New Lead",
  "Proposal",
  "Negotiation",
  "Verbal Commit",
  "Closed Won",
  "Closed Lost",
];
const SOURCE_OPTIONS: SourceOption[] = [
  "inbound CS",
  "outbound email",
  "outbound linkedin",
  "referral",
];
const COMPETITOR_OPTIONS: CompetitorOption[] = [
  "IEE",
  "GB Translations",
  "Fortis",
  "Easy Translations",
];
const LOST_REASONS: LostReason[] = [
  "price",
  "spoke with the wrong person",
  "didn't present enough value",
  "wrong timing",
  "not the sweet spot",
  "exclusivity with competitor",
];
const WON_REASONS: WonReason[] = [
  "best value",
  "right timing",
  "strong relationship",
  "clearer process",
  "faster turnaround",
  "better trust and credibility",
];

const stageProbabilities: Record<Stage, number> = {
  "New Lead": 15,
  Proposal: 50,
  Negotiation: 70,
  "Verbal Commit": 90,
  "Closed Won": 100,
  "Closed Lost": 0,
};

const seedData: Opportunity[] = [
  {
    id: "northstar-health",
    company: "Northstar Health",
    title: "Revenue forecasting rollout",
    contact: "Maya Chen",
    contactEmail: "maya@northstarhealth.com",
    owner: "Guy Pearson",
    temperature: "hot",
    probability: 85,
    expectedCloseDate: "2026-04-12",
    createdDate: "2026-02-16",
    lastActivityDate: "2026-03-29",
    notes: "Board pack due next week. Procurement is the last blocker.",
    phase: "Verbal Commit",
    source: "referral",
    monthlyRevenuePotential: 4000,
    tags: ["enterprise", "forecast", "q2"],
    competitor: "IEE",
    closedLostReason: "",
    closedWonReason: "",
  },
  {
    id: "aperture-labs",
    company: "Aperture Labs",
    title: "Sales ops dashboard rebuild",
    contact: "Jordan Patel",
    contactEmail: "jordan@aperturelabs.com",
    owner: "Guy Pearson",
    temperature: "warm",
    probability: 62,
    expectedCloseDate: "2026-04-28",
    createdDate: "2026-03-02",
    lastActivityDate: "2026-03-28",
    notes: "Strong traction. Needs final pricing alignment across two teams.",
    phase: "Negotiation",
    source: "outbound email",
    monthlyRevenuePotential: 2200,
    tags: ["mid-market", "dashboard"],
    competitor: "Fortis",
    closedLostReason: "",
    closedWonReason: "",
  },
  {
    id: "brightline-capital",
    company: "Brightline Capital",
    title: "Pipeline reporting MVP",
    contact: "Sam Rivera",
    contactEmail: "sam@brightlinecapital.com",
    owner: "Guy Pearson",
    temperature: "warm",
    probability: 45,
    expectedCloseDate: "2026-05-10",
    createdDate: "2026-03-11",
    lastActivityDate: "2026-03-30",
    notes: "Proposal sent. Wants clean read-only mode for directors.",
    phase: "Proposal",
    source: "inbound CS",
    monthlyRevenuePotential: 1500,
    tags: ["finance", "reporting"],
    competitor: "",
    closedLostReason: "",
    closedWonReason: "",
  },
  {
    id: "blue-peak-logistics",
    company: "Blue Peak Logistics",
    title: "Commercial planning workspace",
    contact: "Lina Foster",
    contactEmail: "lina@bluepeaklogistics.com",
    owner: "Alex Moore",
    temperature: "hot",
    probability: 55,
    expectedCloseDate: "2026-05-18",
    createdDate: "2026-03-14",
    lastActivityDate: "2026-03-27",
    notes: "Strong champion. Needs integration scoping.",
    phase: "Proposal",
    source: "referral",
    monthlyRevenuePotential: 2700,
    tags: ["ops", "integration"],
    competitor: "Easy Translations",
    closedLostReason: "",
    closedWonReason: "",
  },
  {
    id: "cinder-studio",
    company: "Cinder Studio",
    title: "New customer funnel setup",
    contact: "Ari Brooks",
    contactEmail: "ari@cinderstudio.com",
    owner: "Guy Pearson",
    temperature: "warm",
    probability: 20,
    expectedCloseDate: "2026-06-06",
    createdDate: "2026-03-25",
    lastActivityDate: "2026-03-31",
    notes: "Good fit, but budget is still wobbling in finance.",
    phase: "New Lead",
    source: "referral",
    monthlyRevenuePotential: 750,
    tags: ["smb"],
    competitor: "",
    closedLostReason: "",
    closedWonReason: "",
  },
  {
    id: "atlas-foods",
    company: "Atlas Foods",
    title: "Quarterly planning hub",
    contact: "Tara Bell",
    contactEmail: "tara@atlasfoods.com",
    owner: "Guy Pearson",
    temperature: "hot",
    probability: 100,
    expectedCloseDate: "2026-03-20",
    createdDate: "2026-01-24",
    lastActivityDate: "2026-03-20",
    notes: "Signed and onboarding.",
    phase: "Closed Won",
    source: "inbound CS",
    monthlyRevenuePotential: 1900,
    tags: ["won", "q1"],
    competitor: "IEE",
    closedLostReason: "",
    closedWonReason: "better trust and credibility",
  },
  {
    id: "halcyon-media",
    company: "Halcyon Media",
    title: "Sales pipeline cleanup",
    contact: "Noah Green",
    contactEmail: "noah@halcyonmedia.com",
    owner: "Alex Moore",
    temperature: "cold",
    probability: 0,
    expectedCloseDate: "2025-12-18",
    createdDate: "2025-10-10",
    lastActivityDate: "2025-12-20",
    notes: "Lost to incumbent vendor. Good candidate for reactivation.",
    phase: "Closed Lost",
    source: "outbound linkedin",
    monthlyRevenuePotential: 0,
    tags: ["lost", "reactivation"],
    competitor: "GB Translations",
    closedLostReason: "exclusivity with competitor",
    closedWonReason: "",
  },
];

const emptyOpportunity = (): Opportunity => {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `opportunity-${Date.now()}`,
    company: "",
    title: "",
    contact: "",
    contactEmail: "",
    owner: "Guy Pearson",
    temperature: "warm",
    probability: 50,
    expectedCloseDate: today,
    createdDate: today,
    lastActivityDate: today,
    notes: "",
    phase: "New Lead",
    source: SOURCE_OPTIONS[0],
    monthlyRevenuePotential: 0,
    tags: [],
    competitor: "",
    closedLostReason: "",
    closedWonReason: "",
  };
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const toDays = (from: string, to: string) => {
  const delta = Math.abs(new Date(to).getTime() - new Date(from).getTime());
  return Math.max(1, Math.round(delta / (1000 * 60 * 60 * 24)));
};

const daysSince = (date: string) =>
  Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));

const temperatureClass: Record<Temperature, string> = {
  cold: "bg-sky-500/15 text-sky-200 ring-sky-400/25",
  warm: "bg-amber-500/15 text-amber-200 ring-amber-400/25",
  hot: "bg-rose-500/15 text-rose-200 ring-rose-400/25",
};

const stageGlow: Record<Stage, string> = {
  "New Lead": "from-slate-500/30 to-slate-500/5",
  Proposal: "from-violet-500/30 to-fuchsia-500/5",
  Negotiation: "from-amber-500/30 to-orange-500/5",
  "Verbal Commit": "from-emerald-500/30 to-lime-500/5",
  "Closed Won": "from-green-500/35 to-green-500/5",
  "Closed Lost": "from-rose-500/30 to-rose-500/5",
};

function exportCsv(opportunities: Opportunity[]) {
  const headers = [
    "company",
    "title",
    "contact",
    "contactEmail",
    "owner",
    "temperature",
    "probability",
    "expectedCloseDate",
    "createdDate",
    "lastActivityDate",
    "notes",
    "phase",
    "source",
    "monthlyRevenuePotential",
    "competitor",
    "closedLostReason",
    "closedWonReason",
    "tags",
  ];

  const rows = opportunities.map((opportunity) =>
    headers
      .map((header) => {
        const rawValue =
          header === "tags"
            ? opportunity.tags.join("|")
            : String(opportunity[header as keyof Opportunity] ?? "");
        return `"${rawValue.split('"').join('""')}"`;
      })
      .join(","),
  );

  const blob = new Blob([[headers.join(","), ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `crediteval-funnel-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function computeMetrics(opportunities: Opportunity[]) {
  const active = opportunities.filter(
    (opportunity) =>
      opportunity.phase !== "Closed Won" && opportunity.phase !== "Closed Lost",
  );
  const won = opportunities.filter((opportunity) => opportunity.phase === "Closed Won");
  const closed = opportunities.filter(
    (opportunity) =>
      opportunity.phase === "Closed Won" || opportunity.phase === "Closed Lost",
  );
  const mrrEligibleStages: Stage[] = ["Proposal", "Negotiation", "Verbal Commit", "Closed Won"];

  const totalPipeline = active.reduce(
    (sum, opportunity) => sum + opportunity.monthlyRevenuePotential * 12,
    0,
  );
  const weightedPipeline = active.reduce(
    (sum, opportunity) =>
      sum + opportunity.monthlyRevenuePotential * 12 * (opportunity.probability / 100),
    0,
  );
  const potentialMonthlyRevenue = active
    .filter((opportunity) => mrrEligibleStages.includes(opportunity.phase))
    .reduce((sum, opportunity) => sum + opportunity.monthlyRevenuePotential, 0);
  const avgCycle = won.length
    ? won.reduce(
        (sum, opportunity) =>
          sum + toDays(opportunity.createdDate, opportunity.expectedCloseDate),
        0,
      ) / won.length
    : 0;
  const avgDealSize = won.length
    ? won.reduce((sum, opportunity) => sum + opportunity.monthlyRevenuePotential * 12, 0) /
      won.length
    : 0;
  const winRate = closed.length ? (won.length / closed.length) * 100 : 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const dealsClosingThisMonth = active.filter((opportunity) => {
    const date = new Date(opportunity.expectedCloseDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }).length;

  const conversionByStage = STAGES.map((stage, index) => {
    const count = opportunities.filter((opportunity) => opportunity.phase === stage).length;
    const progressed = opportunities.filter((opportunity) => {
      const currentIndex = STAGES.indexOf(opportunity.phase);
      return currentIndex > index && opportunity.phase !== "Closed Lost";
    }).length;
    return {
      stage,
      count,
      rate: count ? Math.min(100, Math.round((progressed / count) * 100)) : 0,
    };
  });

  const forecastByMonth = Array.from({ length: 4 }, (_, offset) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthDeals = active.filter((opportunity) => {
      const date = new Date(opportunity.expectedCloseDate);
      return (
        date.getMonth() === monthDate.getMonth() &&
        date.getFullYear() === monthDate.getFullYear()
      );
    });

    const weighted = monthDeals.reduce(
      (sum, opportunity) =>
        sum + opportunity.monthlyRevenuePotential * 12 * (opportunity.probability / 100),
      0,
    );
    const committed = monthDeals
      .filter((opportunity) => opportunity.probability >= 75)
      .reduce((sum, opportunity) => sum + opportunity.monthlyRevenuePotential * 12, 0);

    return {
      month: monthDate.toLocaleString("en-US", { month: "short" }),
      weighted: Math.round(weighted),
      committed,
      dealCount: monthDeals.length,
    };
  });

  const staleLost = opportunities.filter(
    (opportunity) =>
      opportunity.phase === "Closed Lost" && daysSince(opportunity.lastActivityDate) >= 90,
  );

  return {
    totalPipeline,
    weightedPipeline,
    potentialMonthlyRevenue,
    avgCycle,
    avgDealSize,
    winRate,
    dealsClosingThisMonth,
    conversionByStage,
    forecastByMonth,
    staleLost,
  };
}

function StatCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string;
  value: string;
  meta?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.2)]">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {meta ? <p className="mt-1 text-sm text-slate-400">{meta}</p> : null}
    </div>
  );
}

function SelectWithCustom({
  label,
  value,
  options,
  customPrompt,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  customPrompt: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm text-slate-400">{label}</span>
      <div className="relative">
        <select
          value={options.includes(value) ? value : "__custom__"}
          onChange={(event) => {
            if (event.target.value === "__custom__") {
              const custom = window.prompt(customPrompt, value);
              if (custom && custom.trim()) onChange(custom.trim());
              return;
            }
            onChange(event.target.value);
          }}
          className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          {!options.includes(value) && value ? <option value="__custom__">{value}</option> : null}
          <option value="__custom__">+ Create new {label.toLowerCase()}</option>
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </label>
  );
}

function DealCard({
  opportunity,
  onEdit,
  onDragStart,
}: {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDragStart: (id: string) => void;
}) {
  return (
    <button
      draggable
      onDragStart={() => onDragStart(opportunity.id)}
      onClick={() => onEdit(opportunity)}
      className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-white/20 hover:bg-white/8"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{opportunity.company}</div>
          <div className="mt-1 text-sm text-slate-300">{opportunity.title}</div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1",
            temperatureClass[opportunity.temperature],
          )}
        >
          {opportunity.temperature}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{formatCompactMoney(opportunity.monthlyRevenuePotential)}/mo</span>
        <span>{opportunity.probability}%</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">{opportunity.source}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {opportunity.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-white/8 px-2 py-1 text-[11px] text-slate-300">
            #{tag}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function FunnelDashboard() {
  const { user, loading } = useAuth();
  const [hydrated, setHydrated] = useState(false);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(seedData);
  const [selectedStage, setSelectedStage] = useState<Stage | "All">("All");
  const [selectedTemp, setSelectedTemp] = useState<Temperature | "all">("all");
  const [search, setSearch] = useState("");
  const [readOnlyView, setReadOnlyView] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
    const savedDeals = window.localStorage.getItem(STORAGE_KEY);
    if (savedDeals) setOpportunities(JSON.parse(savedDeals));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
  }, [hydrated, opportunities]);

  const filteredOpportunities = useMemo(() => {
    const query = search.toLowerCase();
    return opportunities.filter((opportunity) => {
      const matchesStage = selectedStage === "All" || opportunity.phase === selectedStage;
      const matchesTemp = selectedTemp === "all" || opportunity.temperature === selectedTemp;
      const haystack = [
        opportunity.company,
        opportunity.title,
        opportunity.contact,
        opportunity.contactEmail,
        opportunity.owner,
        opportunity.source,
        opportunity.notes,
        opportunity.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return matchesStage && matchesTemp && (!query || haystack.includes(query));
    });
  }, [opportunities, search, selectedStage, selectedTemp]);

  const metrics = useMemo(() => computeMetrics(filteredOpportunities), [filteredOpportunities]);

  const boardData = useMemo(
    () =>
      Object.fromEntries(
        STAGES.map((stage) => [
          stage,
          filteredOpportunities.filter((opportunity) => opportunity.phase === stage),
        ]),
      ) as Record<Stage, Opportunity[]>,
    [filteredOpportunities],
  );

  const handleDrop = (stage: Stage) => {
    if (!draggingId) return;
    setOpportunities((current) =>
      current.map((opportunity) =>
        opportunity.id === draggingId
          ? {
              ...opportunity,
              phase: stage,
              probability:
                stage === opportunity.phase
                  ? opportunity.probability
                  : stageProbabilities[stage],
              lastActivityDate: new Date().toISOString().slice(0, 10),
              closedLostReason: stage === "Closed Lost" ? opportunity.closedLostReason : "",
              closedWonReason: stage === "Closed Won" ? opportunity.closedWonReason : "",
            }
          : opportunity,
      ),
    );
    setDraggingId(null);
  };

  const openEditor = (opportunity?: Opportunity) => {
    setEditing(opportunity ? { ...opportunity } : emptyOpportunity());
    setEditorOpen(true);
  };

  const saveOpportunity = () => {
    if (!editing) return;
    setOpportunities((current) => {
      const exists = current.some((opportunity) => opportunity.id === editing.id);
      return exists
        ? current.map((opportunity) => (opportunity.id === editing.id ? editing : opportunity))
        : [editing, ...current];
    });
    setEditorOpen(false);
    setEditing(null);
  };

  const deleteOpportunity = () => {
    if (!editing) return;
    setOpportunities((current) => current.filter((opportunity) => opportunity.id !== editing.id));
    setEditorOpen(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07111d] text-white flex items-center justify-center">
        Loading dashboard…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#07111d] text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16">
          <div className="grid w-full overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur xl:grid-cols-[1.2fr_0.8fr]">
            <section className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(139,92,246,0.15),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(2,6,23,0.98))] p-10 lg:p-14">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-300">
                <Target className="h-3.5 w-3.5" /> Crediteval Dashboard
              </span>
              <h1 className="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                Real dashboard. Real auth. Less fake wizardry.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Sign in with your Supabase account to access the revenue dashboard and funnel workspace.
              </p>
            </section>
            <section className="p-10 lg:p-14">
              <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-[#0d1727] p-8">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/8 p-3 text-slate-200">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Supabase access required</p>
                    <h2 className="text-xl font-semibold text-white">Sign in</h2>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  <a href="/login" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                    Enter dashboard <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07111d] text-white">
      <div className="mx-auto max-w-[1700px] px-4 py-5 lg:px-8 lg:py-8">
        <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-5 shadow-[0_40px_100px_rgba(2,6,23,0.5)] lg:p-7">
          <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                <Flame className="h-3.5 w-3.5 text-rose-300" /> Funnel forecast cockpit
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Crediteval revenue dashboard</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Manage pipeline movement, forecast signal, and 90-day reactivation opportunities.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={() => setReadOnlyView((current) => !current)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 transition hover:bg-white/8">
                {readOnlyView ? "Exit share view" : "Director share view"}
              </button>
              <button onClick={() => exportCsv(filteredOpportunities)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                <Download className="h-4 w-4" /> Export CSV
              </button>
              {!readOnlyView ? (
                <button onClick={() => openEditor()} className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400">
                  <Plus className="h-4 w-4" /> New opportunity
                </button>
              ) : null}
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total pipeline" value={formatCompactMoney(metrics.totalPipeline)} meta="Annualized from MRR" icon={<LayoutDashboard className="h-4 w-4" />} />
            <StatCard label="Weighted pipeline" value={formatCompactMoney(metrics.weightedPipeline)} meta="Probability-adjusted annualized revenue" icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Win rate" value={`${metrics.winRate.toFixed(1)}%`} meta="Closed won vs lost" icon={<Target className="h-4 w-4" />} />
            <StatCard label="Potential MRR" value={formatCompactMoney(metrics.potentialMonthlyRevenue)} meta="Proposal stage forward only" icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Average cycle" value={`${Math.round(metrics.avgCycle || 0)} days`} meta="Based on closed won deals" icon={<CalendarRange className="h-4 w-4" />} />
            <StatCard label="Average deal size" value={formatCompactMoney(metrics.avgDealSize)} meta="Annualized closed-won benchmark" icon={<LayoutDashboard className="h-4 w-4" />} />
            <StatCard label="Closing this month" value={String(metrics.dealsClosingThisMonth)} meta="Open deals expected this month" icon={<CalendarRange className="h-4 w-4" />} />
            <StatCard label="Reactivation candidates" value={String(metrics.staleLost.length)} meta="Lost for 90+ days" icon={<Filter className="h-4 w-4" />} />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Filters + focus</h2>
                  <p className="mt-1 text-sm text-slate-400">Trim the noise without losing the full picture.</p>
                </div>
                <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row">
                  <label className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-[#081220] px-4 py-3 text-sm text-slate-400">
                    <Search className="h-4 w-4" />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, owner, notes, source..." className="w-full bg-transparent text-white outline-none placeholder:text-slate-500" />
                  </label>
                  <select value={selectedStage} onChange={(event) => setSelectedStage(event.target.value as Stage | "All")} className="rounded-2xl border border-white/10 bg-[#081220] px-4 py-3 text-sm text-white outline-none">
                    <option value="All">All stages</option>
                    {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                  </select>
                  <select value={selectedTemp} onChange={(event) => setSelectedTemp(event.target.value as Temperature | "all")} className="rounded-2xl border border-white/10 bg-[#081220] px-4 py-3 text-sm text-white outline-none">
                    <option value="all">All temperatures</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">Monthly forecast</h2>
              <p className="mt-1 text-sm text-slate-400">Weighted vs committed revenue by month.</p>
              <div className="mt-5 space-y-4">
                {metrics.forecastByMonth.map((item) => {
                  const max = Math.max(item.weighted, item.committed, 1);
                  return (
                    <div key={item.month} className="rounded-2xl border border-white/10 bg-[#081220] p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-white">{item.month}</span>
                        <span className="text-slate-400">{item.dealCount} deals</span>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-400"><span>Weighted</span><span>{formatCompactMoney(item.weighted)}</span></div>
                          <div className="h-2 rounded-full bg-white/8"><div className="h-2 rounded-full bg-violet-400" style={{ width: `${(item.weighted / max) * 100}%` }} /></div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-400"><span>Committed</span><span>{formatCompactMoney(item.committed)}</span></div>
                          <div className="h-2 rounded-full bg-white/8"><div className="h-2 rounded-full bg-emerald-400" style={{ width: `${(item.committed / max) * 100}%` }} /></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[30px] border border-white/10 bg-white/5 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Pipeline board</h2>
                <p className="mt-1 text-sm text-slate-400">Wider board, cleaner cards, less squinting.</p>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="grid min-w-[1320px] grid-cols-6 gap-4">
                {STAGES.map((stage) => {
                  const deals = boardData[stage];
                  const stageValue = deals.reduce((sum, opportunity) => sum + opportunity.monthlyRevenuePotential, 0);
                  return (
                    <div key={stage} onDragOver={(event) => event.preventDefault()} onDrop={() => handleDrop(stage)} className="rounded-[28px] border border-white/10 bg-[#06101c] p-3">
                      <div className={cn("rounded-3xl bg-gradient-to-br p-3", stageGlow[stage])}>
                        <div className="text-sm font-semibold text-white">{stage}</div>
                        <div className="mt-1 text-xs text-slate-300">{deals.length} deals · {formatCompactMoney(stageValue)}/mo</div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {deals.length ? deals.map((opportunity) => <DealCard key={opportunity.id} opportunity={opportunity} onEdit={openEditor} onDragStart={setDraggingId} />) : <div className="rounded-3xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">Empty lane</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-6">
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-white">Stage conversion</h2>
                <p className="mt-1 text-sm text-slate-400">Fast read on where momentum behaves or dies.</p>
                <div className="mt-5 space-y-4">
                  {metrics.conversionByStage.map((item) => (
                    <div key={item.stage}>
                      <div className="mb-2 flex items-center justify-between text-sm"><span className="text-slate-300">{item.stage}</span><span className="text-slate-400">{item.rate}%</span></div>
                      <div className="h-2 rounded-full bg-white/8"><div className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" style={{ width: `${item.rate}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
                <h2 className="text-lg font-semibold text-white">Share view summary</h2>
                <p className="mt-1 text-sm text-slate-400">Cleaner read-only talking points for directors.</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-[#081220] p-4">
                    <div className="text-sm text-slate-400">Top signal</div>
                    <div className="mt-2 text-base font-medium text-white">{metrics.forecastByMonth[0]?.committed ? `${formatCompactMoney(metrics.forecastByMonth[0].committed)} committed this month` : "No committed revenue this month yet"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[#081220] p-4">
                    <div className="text-sm text-slate-400">Best next action</div>
                    <div className="mt-2 text-base font-medium text-white">Focus on Proposal and Negotiation — that’s where the MRR is currently loafing.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-lg font-semibold text-white">90-day reactivation report</h2>
              <p className="mt-1 text-sm text-slate-400">Practical fallback until owner/admin notifications are wired for real.</p>
              <div className="mt-5 overflow-hidden rounded-3xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Company</th>
                      <th className="px-4 py-3 font-medium">Owner</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Lost reason</th>
                      <th className="px-4 py-3 font-medium">Days stale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.staleLost.length ? metrics.staleLost.map((opportunity) => (
                      <tr key={opportunity.id} className="border-t border-white/10 text-slate-200">
                        <td className="px-4 py-3">{opportunity.company}</td>
                        <td className="px-4 py-3">{opportunity.owner}</td>
                        <td className="px-4 py-3">{opportunity.contactEmail || "—"}</td>
                        <td className="px-4 py-3">{opportunity.closedLostReason || "—"}</td>
                        <td className="px-4 py-3">{daysSince(opportunity.lastActivityDate)}</td>
                      </tr>
                    )) : <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={5}>No stale lost opportunities right now.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>

      {editorOpen && editing && !readOnlyView ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#07111d] p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Opportunity editor</div>
                <h2 className="text-2xl font-semibold text-white">{editing.company || "New opportunity"}</h2>
              </div>
              <button onClick={() => { setEditorOpen(false); setEditing(null); }} className="rounded-full border border-white/10 p-2 text-slate-400 transition hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                ["Company", "company"],
                ["Opportunity title", "title"],
                ["Contact", "contact"],
                ["Contact email", "contactEmail"],
                ["Owner", "owner"],
                ["Probability", "probability"],
                ["Expected close", "expectedCloseDate"],
                ["Created date", "createdDate"],
                ["Last activity", "lastActivityDate"],
                ["Monthly revenue", "monthlyRevenuePotential"],
              ].map(([label, key]) => {
                const isDate = key.toLowerCase().includes("date");
                const isNumber = key === "probability" || key === "monthlyRevenuePotential";
                return (
                  <label key={key} className="block">
                    <span className="mb-2 block text-sm text-slate-400">{label}</span>
                    <input
                      type={isDate ? "date" : isNumber ? "number" : "text"}
                      value={String(editing[key as keyof Opportunity] ?? "")}
                      onChange={(event) => setEditing({ ...editing, [key]: isNumber ? Number(event.target.value) : event.target.value } as Opportunity)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                    />
                  </label>
                );
              })}

              <label>
                <span className="mb-2 block text-sm text-slate-400">Temperature</span>
                <select value={editing.temperature} onChange={(event) => setEditing({ ...editing, temperature: event.target.value as Temperature })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                  <option value="cold">Cold</option>
                  <option value="warm">Warm</option>
                  <option value="hot">Hot</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm text-slate-400">Phase</span>
                <select value={editing.phase} onChange={(event) => setEditing({ ...editing, phase: event.target.value as Stage, probability: stageProbabilities[event.target.value as Stage] })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                  {STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                </select>
              </label>

              <SelectWithCustom label="Source" value={editing.source} options={SOURCE_OPTIONS} customPrompt="Add a new source" onChange={(value) => setEditing({ ...editing, source: value })} />
              <SelectWithCustom label="Competitor" value={editing.competitor} options={COMPETITOR_OPTIONS} customPrompt="Add a new competitor" onChange={(value) => setEditing({ ...editing, competitor: value })} />

              {editing.phase === "Closed Lost" ? (
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm text-slate-400">Reason lost</span>
                  <select value={editing.closedLostReason} onChange={(event) => setEditing({ ...editing, closedLostReason: event.target.value, closedWonReason: "" })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option value="">Select reason</option>
                    {LOST_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
              ) : null}

              {editing.phase === "Closed Won" ? (
                <label className="md:col-span-2">
                  <span className="mb-2 block text-sm text-slate-400">Reason won</span>
                  <select value={editing.closedWonReason} onChange={(event) => setEditing({ ...editing, closedWonReason: event.target.value, closedLostReason: "" })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
                    <option value="">Select reason</option>
                    {WON_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
              ) : null}
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-slate-400">Tags</span>
              <input value={editing.tags.join(", ")} onChange={(event) => setEditing({ ...editing, tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} placeholder="enterprise, q2, hot-lead" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            </label>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm text-slate-400">Notes</span>
              <textarea rows={6} value={editing.notes} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
            </label>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button onClick={deleteOpportunity} className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">Delete</button>
              <button onClick={saveOpportunity} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900">Save opportunity</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
