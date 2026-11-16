"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  LayoutDashboard, ClipboardList, ClipboardCheck, AlertTriangle,
  ShieldAlert, FileText, Network, BarChart3, Menu, Search, X,
  ChevronRight, ArrowRight, Factory, Plus, Download, Upload, FileBarChart,
  CheckCircle2, XCircle, AlertCircle, Clock, Filter, RefreshCw,
  TrendingUp, TrendingDown, Target, Boxes, ChevronDown, LogOut,
  FileDown, FileSpreadsheet, FileJson, Printer, Bell, Settings,
  Wrench, Package, HelpCircle, ChevronLeft, Zap, Activity,
  CalendarDays, UserCircle, Building2, ArrowUpRight, FileSearch,
  Layers, CircleDot, Flag, Users, UserPlus, UserCog, Ban,
  CheckSquare, Square, Workflow, GitBranch, Histogram, ScatterChart,
  LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart2,
  Gauge, Clipboard, Trello, ArrowRightCircle, ListChecks,
  ShoppingCart, Eye, PauseCircle, PlayCircle, ShieldCheck, BookOpen, FileCheck2,
  Ruler, Flame, Droplets, Layers3, ArrowDownToLine, CircleDashed, Beaker, Gauge as GaugeIcon,
  Edit3, Save, StickyNote, Lightbulb, PenLine, Hammer, Lock, Compass,
  Wrench as WrenchIcon, Repeat, QrCode, IndianRupee, Network as NetworkIcon, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  StatusBadge, ResultBadge, PageHeader, EmptyState, LoadingBlock,
  DataTable, StatCard, DetailRow, FilterBar, SearchInput, SectionHeader, fmtDate, fmtDateTime, pct,
  type Column,
} from "@/components/qms/shared";
import {
  ChartCard, PieChartView, BarChartView, LineChartView, AreaChartView,
  ScatterChartView, ControlChartView, RadarChartView, HistogramView,
  CauseEffectView, ChecksheetView, useChartData,
} from "@/components/qms/charts";
import { LoginScreen, type User } from "@/components/qms/login";
import { TourGuide, startTourFromButton } from "@/components/qms/tour-guide";
import { InfoTooltip } from "@/components/qms/info-tooltip";
import { ThemeToggle } from "@/components/qms/theme-toggle";
import { HiTechLogo, HiveLockup, ReportHeader, CertificateSeal, CombinedLogo, HtrLogo, HttLogo } from "@/components/qms/brand";
import {
  AuditWorkspaceModule, CopqModule, MisModule, InvestigationModule,
  RcaWorkspaceModule, ComparisonModule,
} from "@/components/qms/advanced-modules";
import {
  AdvancedAnalyticsModule, DocumentEditorModule,
} from "@/components/qms/advanced-analytics";

// ============================================================
// Types
// ============================================================
type ModuleKey =
  | "dashboard" | "workorders" | "salesorders" | "inspection" | "ncr" | "fmea"
 | "traceability" | "standards" | "processflow" | "analytics"
  | "audit" | "copq" | "mis" | "investigation" | "rca" | "comparison"
  | "doceditor" | "users" | "import" | "export" | "reports"
  | "rework" | "organization";

type Role =
  | "Admin" | "QualityManager" | "AssistantManager"
  | "ProductionSupervisor" | "QCInspector" | "Operator"
  | "Auditor" | "DocumentController" | "ProcessEngineer"
  | "MaintenanceCalibration" | "IncomingQuality" | "ReportViewer"
  | "Director" | "IT" | "PlantManager" | "DGM" | "LineManager";

// Modules hidden across ALL roles because the underlying process/feature is
// still under construction.  They are removed from NAV_GROUPS below and from
// every role's access list, and the ModuleRouter shows an "under construction"
// notice if one is ever requested directly.
const HIDDEN_MODULES: ModuleKey[] = [
  "rca", "fmea",                                      // RCA Workspace + FMEA & Risk
  "analytics", "investigation", "comparison", "copq", // Intelligence group
  "doceditor", "standards", "audit", "traceability", "mis", // Governance group
];
const isHidden = (k: ModuleKey) => HIDDEN_MODULES.includes(k);

// ============================================================
// RBAC - module access by role
// ============================================================
// Build the access list per role with all hidden modules stripped out so
// nobody - not even Admin - can reach an unfinished feature through the UI.
const _RAW_ACCESS: Record<Role, ModuleKey[]> = {
  Admin: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "analytics", "audit", "copq", "mis", "investigation", "rca", "comparison", "doceditor", "users", "import", "export", "reports", "rework", "organization"],
  QualityManager: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "analytics", "audit", "copq", "mis", "investigation", "rca", "comparison", "doceditor", "users", "reports", "rework", "organization"],
  AssistantManager: ["dashboard", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "analytics", "audit", "copq", "investigation", "rca", "comparison", "reports", "rework"],
  ProductionSupervisor: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "traceability", "processflow", "analytics", "copq", "comparison", "rework"],
  QCInspector: ["dashboard", "inspection", "ncr", "traceability", "processflow", "rework"],
  Operator: ["dashboard", "inspection", "processflow", "rework"],
  Auditor: ["dashboard", "traceability", "standards", "analytics", "audit", "investigation", "rca", "comparison", "reports", "rework"],
  DocumentController: ["dashboard", "standards", "analytics", "doceditor", "reports"],
  ProcessEngineer: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "analytics", "audit", "copq", "investigation", "rca", "comparison", "doceditor", "reports", "rework"],
  MaintenanceCalibration: ["dashboard", "standards", "rework"],
  IncomingQuality: ["dashboard", "workorders", "salesorders", "traceability", "standards", "analytics", "inspection", "rework"],
  ReportViewer: ["dashboard", "salesorders", "standards", "analytics", "mis", "comparison", "reports", "rework"],
  // --- New roles (added per user request) ---
  Director: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization"],
  IT: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "processflow", "users", "import", "export", "reports", "rework", "organization"],
  PlantManager: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization"],
  DGM: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization"],
  LineManager: ["dashboard", "processflow", "workorders", "inspection", "ncr", "rework"],
};

const ROLE_MODULE_ACCESS: Record<Role, ModuleKey[]> = Object.fromEntries(
  Object.entries(_RAW_ACCESS).map(([role, mods]) => [
    role,
    mods.filter((m) => !isHidden(m as ModuleKey)),
  ])
) as Record<Role, ModuleKey[]>;

function hasModule(role: string, key: ModuleKey): boolean {
  const allowed = ROLE_MODULE_ACCESS[role as Role] || [];
  return allowed.includes(key);
}

// ============================================================
// Navigation groups (filtered by role at render-time)
// ============================================================
const NAV_GROUPS: { label: string; items: { key: ModuleKey; label: string; icon: any; desc: string }[] }[] = [
  { label: "Overview", items: [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Live overview" },
    { key: "processflow", label: "Process Flow", icon: Workflow, desc: "K1-K4 route map" },
  ] },
  { label: "Production", items: [
    { key: "workorders", label: "Work Orders", icon: ClipboardList, desc: "Production plan" },
    { key: "salesorders", label: "Sales Orders", icon: ShoppingCart, desc: "ERP demand" },
  ] },
  { label: "Quality", items: [
    { key: "inspection", label: "Inspections", icon: ClipboardCheck, desc: "Stage forms" },
    { key: "ncr", label: "Nonconformance", icon: AlertTriangle, desc: "CAPA workflow" },
    { key: "rework", label: "Rework Jobs", icon: Repeat, desc: "Defect → rework → verify" },
  ]},
  // RCA Workspace, Intelligence, and Governance groups are intentionally
  // hidden while those features are under construction.
  { label: "Administration", items: [
    { key: "users", label: "User Management", icon: Users, desc: "Accounts & roles" },
    { key: "organization", label: "Organization", icon: NetworkIcon, desc: "Hierarchy & vacancies" },
    { key: "import", label: "Import", icon: Upload, desc: "Upload data" },
    { key: "export", label: "Export", icon: Download, desc: "Download data" },
    { key: "reports", label: "Reports", icon: FileBarChart, desc: "Printable" },
  ]},
];

const SEARCH_ICONS: Record<string, any> = {
  ClipboardList, ClipboardCheck, AlertTriangle, ShieldAlert, ShieldCheck, FileText, Network, Boxes, Wrench, Package, FileBarChart, ShoppingCart, Workflow, FileCheck2, GitBranch, FileSearch, CircleDashed, Edit3,
};

const K2_STAGES = [
  { code: "S01", name: "Rolling & Forming" },
  { code: "S02", name: "Single Spot Welding" },
  { code: "S03", name: "Seam Welding" },
  { code: "S04", name: "Edge Welding" },
  { code: "S05", name: "TIG Welding" },
  { code: "S06", name: "Erection" },
  { code: "S07", name: "MAG Welding" },
  { code: "S08", name: "Spatter Removal" },
  { code: "S09", name: "Leak Testing" },
  { code: "S10", name: "Blasting" },
  { code: "S11", name: "Primer" },
  { code: "S12", name: "Paint" },
  { code: "S13", name: "Final Inspection" },
  { code: "S14", name: "Packing" },
];

const ROLE_OPTIONS: Role[] = ["Admin", "Director", "IT", "PlantManager", "DGM", "QualityManager", "AssistantManager", "LineManager", "ProductionSupervisor", "QCInspector", "Operator", "Auditor", "DocumentController", "ProcessEngineer", "MaintenanceCalibration", "IncomingQuality", "ReportViewer"];

// Human-readable label for each role code (used in dropdowns, badges, user mgmt)
const ROLE_LABELS: Record<string, string> = {
  Admin: "System Administrator",
  Director: "Director / CEO",
  IT: "IT Team",
  PlantManager: "Plant Manager",
  DGM: "DGM",
  QualityManager: "Quality Manager",
  AssistantManager: "Assistant Manager",
  LineManager: "Line Manager",
  ProductionSupervisor: "Production Supervisor",
  QCInspector: "QC Inspector",
  Operator: "Operator",
  Auditor: "Auditor",
  DocumentController: "Document Controller",
  ProcessEngineer: "Process Engineer",
  MaintenanceCalibration: "Maintenance & Calibration",
  IncomingQuality: "Incoming Quality / Stores",
  ReportViewer: "Report Viewer",
};
const DEPARTMENT_OPTIONS = ["Quality", "Production", "Welding", "Paint", "Engineering", "Stores", "Maintenance"];
const SHIFT_OPTIONS = ["A", "B", "General"];

// ============================================================
// Main App
// ============================================================
export default function QMSPage() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = typeof window !== "undefined" ? localStorage.getItem("qms-user") : null;
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem("qms-user", JSON.stringify(u));
      localStorage.setItem("hive-user-name", u.name);
    }
  };

  const handleLogout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("qms-user");
      localStorage.removeItem("hive-user-name");
    }
  };

  if (!mounted) return <LoadingBlock />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;
  return (
    <>
      <AppShell user={user} onLogout={handleLogout} />
      <TourGuide />
    </>
  );
}

// ============================================================
// App Shell - sticky header + sticky sidebar + scrolling content
// ============================================================
function AppShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [active, setActive] = useState<ModuleKey>("dashboard");
  const [navOpen, setNavOpen] = useState(false);
  const [plant, setPlant] = useState(user.plant || "K2");
  const [plants, setPlants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  // Lifted state: when user clicks INSPECT on a Process Flow stage,
  // we navigate to inspection module AND pre-select that stage in the form.
  const [inspectPrefillStage, setInspectPrefillStage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plants").then(r => r.json()).then(d => setPlants(d.plants || []));
  }, []);

  // Global search
  useEffect(() => {
    if (searchQuery.length < 1) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&plant=${plant}`)
        .then(r => r.json())
        .then(d => { setSearchResults(d.results || []); setSearchOpen(true); setSearchLoading(false); });
    }, 250);
    return () => clearTimeout(t);
  }, [searchQuery, plant]);

  const currentPlant = plants.find(p => p.code === plant);

  // Group search results by type
  const groupedResults = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const r of searchResults) {
      if (!g[r.type]) g[r.type] = [];
      g[r.type].push(r);
    }
    return g;
  }, [searchResults]);

  // Filter nav groups by role
  const visibleNavGroups = useMemo(() =>
    NAV_GROUPS
      .map(g => ({ ...g, items: g.items.filter(it => hasModule(user.role, it.key)) }))
      .filter(g => g.items.length > 0),
    [user.role]
  );

  const navigateTo = (k: ModuleKey) => {
    if (isHidden(k)) {
      toast({
        title: "Module under construction",
        description: "This feature is being developed and will be available soon.",
        variant: "destructive",
      });
      return;
    }
    if (!hasModule(user.role, k)) {
      toast({
        title: "Access restricted",
        description: `Your role (${ROLE_LABELS[user.role] || user.role}) does not have access to this module.`,
        variant: "destructive",
      });
      return;
    }
    setActive(k);
    setNavOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Navigate to inspection module with a pre-selected stage code.
  // Used by Process Flow INSPECT buttons so the form opens with the
  // correct stage already chosen - fixes the "Inspect does nothing" bug
  // where the user landed on the inspection list with no context.
  const navigateToInspect = (stageCode: string | null) => {
    if (!hasModule(user.role, "inspection")) return;
    setInspectPrefillStage(stageCode);
    setActive("inspection");
    setNavOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
    // Scroll to top so the form is visible
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigate to inspection module and auto-open the form drawer
  const handleStartInspection = () => {
    setActive("inspection");
    setInspectPrefillStage(null);
    // The InspectionModule will auto-open the form because we set a flag
    // We use a trick: set prefillStage to a sentinel value that triggers form open
    setInspectPrefillStage("__OPEN_FORM__");
  };

  // If active module not allowed for current user, fallback to dashboard
  useEffect(() => {
    if (!hasModule(user.role, active)) setActive("dashboard");
  }, [user.role, active]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--canvas)" }}>
      {/* ===== Header (sticky) - Swiss minimal ===== */}
      <header className="sticky top-0 z-30 border-b" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
        <div className="flex items-center h-14 px-4 md:px-6">
          <button onClick={() => setNavOpen(true)} className="md:hidden p-2 -ml-2" aria-label="Menu" data-tooltip="Open navigation" data-tooltip-pos="right">
            <Menu size={18} style={{ color: "var(--ink)" }} />
          </button>

          <div className="flex items-center gap-2.5">
            <CombinedLogo height={26} />
            <div className="w-px h-6" style={{ backgroundColor: "var(--hairline)" }} />
            <div className="hidden sm:block">
              <div className="t-title-sm leading-none" style={{ color: "var(--ink)", letterSpacing: "0.06em", fontWeight: 600 }}>Hi-Tech Radiators</div>
              <div className="t-label leading-none mt-1" style={{ color: "var(--muted)" }}>QMS · {currentPlant?.shortName || plant}</div>
            </div>
          </div>

          <div className="hidden md:block w-px h-5 mx-4" style={{ backgroundColor: "var(--hairline)" }} />

          <PlantSelector plants={plants} dataTour="plant-selector" current={plant} onChange={setPlant} />

          {/* Global search */}
          <div className="header-search flex-1 max-w-lg mx-2 md:mx-4 relative">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                placeholder="Search WO, PO, NCR, HTU"
                data-tour="search"
                className="w-full h-9 pl-9 pr-9 rounded-md t-body-sm outline-none transition-colors focus:border-[var(--primary)]"
                style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 border-2 rounded-full spin-slow" style={{ borderColor: "var(--hairline)", borderTopColor: "var(--primary)" }} />
                </div>
              )}
              {!searchLoading && searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X size={13} style={{ color: "var(--muted)" }} />
                </button>
              )}
            </div>

            {searchOpen && (
              <div className="absolute top-11 left-0 right-0 rounded-md overflow-hidden z-50 fade-in" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <div className="max-h-[70vh] overflow-y-auto scroll-fine">
                  {Object.keys(groupedResults).length === 0 ? (
                    <div className="p-8 text-center">
                      <FileSearch size={20} className="mx-auto mb-2" style={{ color: "var(--muted-soft)" }} />
                      <div className="t-body-sm" style={{ color: "var(--muted)" }}>No results for "{searchQuery}"</div>
                    </div>
                  ) : (
                    Object.entries(groupedResults).map(([type, items]) => (
                      <div key={type}>
                        <div className="t-label px-3 py-2 sticky top-0" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-soft)" }}>
                          {type} · {items.length}
                        </div>
                        {items.map((r, i) => {
                          const Icon = SEARCH_ICONS[r.icon] || FileText;
                          return (
                            <button
                              key={`${type}-${i}`}
                              onClick={() => navigateTo(r.module as ModuleKey)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--canvas-soft)]"
                              style={{ borderBottom: "1px solid var(--hairline-soft)" }}
                            >
                              <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--canvas-soft)" }}>
                                <Icon size={13} style={{ color: "var(--ink)" }} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="t-body-sm truncate" style={{ color: "var(--ink)", fontWeight: 500 }}>{r.title}</div>
                                <div className="t-body-sm truncate" style={{ color: "var(--muted)" }}>{r.subtitle}</div>
                              </div>
                              <StatusBadge status={r.status} size="xs" />
                              <ChevronRight size={13} style={{ color: "var(--muted-soft)" }} />
                            </button>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Tour Guide launcher - beginner-friendly onboarding */}
            <button
              onClick={startTourFromButton}
              className="relative p-2 rounded-md transition-colors hover:bg-[var(--canvas-soft)] flex items-center gap-1.5"
              aria-label="Tour Guide"
              data-tooltip="Take a quick guided tour of the platform"
              data-tooltip-pos="bottom"
              data-tour="tour-guide"
            >
              <Compass size={16} style={{ color: "var(--ink)" }} />
              <span className="hidden lg:inline t-body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>Tour</span>
            </button>

            {/* Theme toggle - Light / Dark / System */}
            <ThemeToggle compact />

            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
              aria-label="Notifications" data-tooltip="View notifications" data-tooltip-pos="bottom" data-tour="notifications"
            >
              <Bell size={16} style={{ color: "var(--ink)" }} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                data-tour="profile"
                className="flex items-center gap-2 p-1 pr-2 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center t-label" style={{ backgroundColor: "var(--ink)", color: "var(--canvas)", fontSize: 11 }}>
                  {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="t-body-sm leading-none" style={{ color: "var(--ink)", fontWeight: 500 }}>{user.name}</div>
                  <div className="t-label leading-none mt-1" style={{ color: "var(--muted)" }}>{ROLE_LABELS[user.role] || user.role}</div>
                </div>
                <ChevronDown size={13} className="hidden md:block" style={{ color: "var(--muted)" }} />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute top-12 right-0 w-64 rounded-md overflow-hidden z-50 fade-in" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <div className="p-3 border-b" style={{ borderColor: "var(--hairline)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center t-body-md" style={{ backgroundColor: "var(--ink)", color: "var(--canvas)" }}>
                          {user.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="t-body-sm truncate" style={{ color: "var(--ink)", fontWeight: 600 }}>{user.name}</div>
                          <div className="t-body-sm truncate" style={{ color: "var(--muted)" }}>{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}>{ROLE_LABELS[user.role] || user.role}</span>
                        <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)" }}>Plant {user.plant}</span>
                      </div>
                      {user.assignedStages && user.assignedStages.length > 0 && (
                        <div className="mt-2">
                          <div className="t-label" style={{ color: "var(--muted)" }}>Assigned stages</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.assignedStages.map(s => (
                              <span key={s} className="t-code px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)", fontSize: 10 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md t-body-sm transition-colors hover:bg-[var(--canvas-soft)]" style={{ color: "var(--ink)" }}>
                        <UserCircle size={14} style={{ color: "var(--muted)" }} /> Profile
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md t-body-sm transition-colors hover:bg-[var(--canvas-soft)]" style={{ color: "var(--ink)" }}>
                        <Settings size={14} style={{ color: "var(--muted)" }} /> Settings
                      </button>
                      <button className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md t-body-sm transition-colors hover:bg-[var(--canvas-soft)]" style={{ color: "var(--ink)" }}>
                        <HelpCircle size={14} style={{ color: "var(--muted)" }} /> Help & Support
                      </button>
                      <div className="my-1 h-px" style={{ backgroundColor: "var(--hairline)" }} />
                      <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md t-body-sm transition-colors hover:bg-[var(--canvas-soft)]" style={{ color: "var(--semantic-error)" }}>
                        <LogOut size={14} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-4 top-14 w-80 md:w-96 rounded-md overflow-hidden z-50 fade-in" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--hairline)" }}>
                <span className="t-title-sm" style={{ color: "var(--ink)" }}>Notifications</span>
                <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>3 new</span>
              </div>
              <div className="max-h-80 overflow-y-auto scroll-fine">
                {[
                  { icon: AlertTriangle, color: "var(--semantic-error)", title: "CTQ failure on WO-3005", detail: "Leak Testing · NCR-2026-008 auto-created", time: "2 min ago" },
                  { icon: AlertCircle, color: "var(--semantic-warn)", title: "Calibration overdue", detail: "Micrometer MIC-101 due 2 days ago", time: "1 hour ago" },
                  { icon: CheckCircle2, color: "var(--semantic-success)", title: "WO-3009 completed", detail: "16/16 units released", time: "3 hours ago" },
                  { icon: Clock, color: "var(--muted)", title: "NCR-2026-003 aging", detail: "Closed 5 days ago · awaiting effectiveness check", time: "1 day ago" },
                ].map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--canvas-soft)]" style={{ borderColor: "var(--hairline-soft)" }}>
                      <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${n.color}14` }}>
                        <Icon size={13} style={{ color: n.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="t-body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>{n.title}</div>
                        <div className="t-body-sm" style={{ color: "var(--muted)" }}>{n.detail}</div>
                        <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>{n.time}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: "var(--hairline)" }}>
                <button className="t-body-sm" style={{ color: "var(--primary)", fontWeight: 500 }}>View all notifications</button>
              </div>
            </div>
          </>
        )}
      </header>

      <div className="flex flex-1">
        {/* ===== Sidebar (sticky) - minimal hairline rail ===== */}
        <aside data-tour="sidebar"
          className={cn("hidden md:flex flex-col border-r transition-all", sidebarCollapsed ? "w-14" : "w-56")}
          style={{
            position: "sticky",
            top: "56px",
            height: "calc(100vh - 56px)",
            overflowY: "auto",
            borderColor: "var(--hairline)",
            backgroundColor: "var(--surface-card)",
          }}
        >
          <SideNav groups={visibleNavGroups} active={active} onNavigate={navigateTo} collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} data-tooltip="Collapse/expand sidebar"
            className="flex items-center justify-center gap-2 py-2.5 border-t t-label transition-colors hover:bg-[var(--canvas-soft)]"
            style={{ borderColor: "var(--hairline)", color: "var(--muted)" }}
          >
            {sidebarCollapsed ? <ChevronRight size={13} /> : <><ChevronLeft size={13} /> COLLAPSE</>}
          </button>
        </aside>

        {/* Mobile nav drawer */}
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetContent side="left" className="w-72 p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="t-title-sm" style={{ color: "var(--ink)" }}>Navigation</SheetTitle>
            </SheetHeader>
            <SideNav groups={visibleNavGroups} active={active} onNavigate={navigateTo} />
          </SheetContent>
        </Sheet>

        {/* ===== Main content (scrolls naturally with body) ===== */}
        <main className="flex-1 min-w-0" style={{ overflowX: "clip" }}>
          <ModuleRouter active={active} plant={plant} plantInfo={currentPlant} user={user} onNavigate={navigateTo} prefillStage={inspectPrefillStage} onInspect={navigateToInspect} onStartInspection={handleStartInspection} />
        </main>
      </div>
    </div>
  );
}

// ============================================================
// Plant Selector
// ============================================================
function PlantSelector({ plants, current, onChange }: { plants: any[]; current: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const currentPlant = plants.find(p => p.code === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg t-body-sm transition-colors hover:bg-[var(--canvas-soft)]"
        style={{ border: "1px solid var(--hairline)", color: "var(--ink)", backgroundColor: "var(--canvas-soft)" }}
      >
        <Building2 size={13} style={{ color: "var(--primary)" }} />
        <span className="font-medium">{currentPlant?.shortName || current}</span>
        <ChevronDown size={12} style={{ color: "var(--muted)" }} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-10 left-0 w-72 rounded-xl overflow-hidden z-50 fade-in" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", boxShadow: "0 4px 16px rgba(38,37,30,0.06)" }}>
            <div className="t-label px-3 py-2 border-b" style={{ color: "var(--muted)", borderColor: "var(--hairline)" }}>Select Plant</div>
            {plants.map((p) => (
              <button
                key={p.code}
                onClick={() => { if (p.status === "active") { onChange(p.code); setOpen(false); } }}
                disabled={p.status !== "active"}
                className={cn("w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors", p.status === "active" ? "hover:bg-[var(--canvas-soft)]" : "opacity-50 cursor-not-allowed")}
                style={{ borderBottom: "1px solid var(--hairline-soft)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${p.color}14`, color: p.color }}>
                  <Factory size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{p.shortName}</span>
                    {p.code === current && <CheckCircle2 size={12} style={{ color: "var(--semantic-success)" }} />}
                    {p.status !== "active" && <span className="t-label px-1.5 py-0 rounded-full" style={{ backgroundColor: "var(--surface-strong)", color: "var(--muted)" }}>SOON</span>}
                  </div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{p.productType}</div>
                  <div className="t-body-sm mt-0.5" style={{ color: "var(--body)" }}>{p.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Side Nav - role-filtered navigation
// ============================================================
function SideNav({ groups, active, onNavigate, collapsed }: {
  groups: { label: string; items: { key: ModuleKey; label: string; icon: any; desc: string }[] }[];
  active: ModuleKey;
  onNavigate: (k: ModuleKey) => void;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex-1 overflow-y-auto scroll-fine py-4 px-2.5">
      {groups.map((group) => (
        <div key={group.label} className="mb-4">
          {!collapsed && <div className="t-label px-2.5 mb-1.5" style={{ color: "var(--muted-soft)" }}>{group.label}</div>}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md t-nav text-left transition-colors group"
                style={{
                  backgroundColor: isActive ? "var(--canvas-soft)" : "transparent",
                  color: isActive ? "var(--ink)" : "var(--body)",
                  fontWeight: isActive ? 600 : 400,
                  marginBottom: 1,
                  borderLeft: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                }}
                title={collapsed ? item.label : undefined} data-tooltip={collapsed ? item.label : undefined} data-tooltip-pos="right"
              >
                <Icon size={15} className="shrink-0" style={{ color: isActive ? "var(--primary)" : "var(--muted)" }} />
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <div className="truncate" style={{ fontSize: 14, fontWeight: isActive ? 600 : 400 }}>{item.label}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

// ============================================================
// Module Router
// ============================================================

// Shown when a user lands on a module that is either hidden (under
// construction) or not permitted for their role.  Rendered inside the main
// content area so every role / user sees the same consistent notice.
function AccessDeniedNotice({ module: mod, user, onNavigate }: { module: ModuleKey; user: User; onNavigate: (k: ModuleKey) => void }) {
  const hidden = isHidden(mod);
  const MODULE_NAMES: Record<string, string> = {
    rca: "RCA Workspace", fmea: "FMEA & Risk Register",
    analytics: "Analytics", investigation: "Investigation", comparison: "Comparison", copq: "COPQ",
    doceditor: "Document Editor", standards: "Standards", audit: "Audit Workspace",
    traceability: "Traceability", mis: "Plant MIS",
  };
  const name = MODULE_NAMES[mod] || mod;
  return (
    <div className="p-4 md:p-8 reveal-up">
      <div className="max-w-lg mx-auto mt-12 rounded-lg p-6 text-center" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#D36E2E14" }}>
          {hidden ? <Hammer size={20} style={{ color: "var(--ht-burnt-orange)" }} /> : <Lock size={20} style={{ color: "var(--semantic-warn)" }} />}
        </div>
        <h2 className="t-title-md mb-2" style={{ color: "var(--ink)" }}>
          {hidden ? `${name} - Under Construction` : "Access Restricted"}
        </h2>
        <p className="t-body-sm mb-1" style={{ color: "var(--body)" }}>
          {hidden
            ? "This module is currently being developed and is not available yet. It will appear in your sidebar once it's ready."
            : `Your role (${ROLE_LABELS[user.role] || user.role}) does not have access to this module. Contact your administrator if you believe this is an error.`}
        </p>
        <button
          onClick={() => onNavigate("dashboard")}
          className="mt-5 inline-flex items-center gap-2 px-4 h-9 rounded-md t-body-sm transition-colors"
          style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
        >
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}

function ModuleRouter({ active, plant, plantInfo, user, onNavigate, prefillStage, onInspect, onStartInspection }: { active: ModuleKey; plant: string; plantInfo?: any; user: User; onNavigate: (k: ModuleKey) => void; prefillStage?: string | null; onInspect?: (stageCode: string | null) => void; onStartInspection?: () => void }) {
  // Block 1 - hidden / under-construction modules (applies to EVERY role)
  if (isHidden(active)) {
    return <AccessDeniedNotice module={active} user={user} onNavigate={onNavigate} />;
  }
  // Block 2 - role doesn't have access to this module
  if (!hasModule(user.role, active)) {
    return <AccessDeniedNotice module={active} user={user} onNavigate={onNavigate} />;
  }
  switch (active) {
    case "dashboard": return <DashboardModule plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onStartInspection={onStartInspection} />;
    case "processflow": return <ProcessFlowModule plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onInspect={onInspect || (() => {})} />;
    case "workorders": return <WorkOrdersModule plant={plant} />;
    case "salesorders": return <SalesOrdersModule plant={plant} />;
    case "inspection": return <InspectionModule plant={plant} user={user} prefillStage={prefillStage} onPrefillConsumed={() => onInspect(null)} />;
    case "ncr": return <NcrModule plant={plant} user={user} />;
    case "fmea": return <FmeaModule />;
    case "doceditor": return <DocumentEditorModule user={user} />;
    case "standards": return <StandardsModule />;
    case "traceability": return <TraceabilityModule plant={plant} />;
    case "analytics": return <AdvancedAnalyticsModule plant={plant} />;
    case "audit": return <AuditWorkspaceModule plant={plant} user={user} />;
    case "copq": return <CopqModule plant={plant} />;
    case "mis": return <MisModule plant={plant} user={user} />;
    case "investigation": return <InvestigationModule plant={plant} />;
    case "rca": return <RcaWorkspaceModule plant={plant} />;
    case "comparison": return <ComparisonModule plant={plant} />;
    case "users": return <UserManagementModule plant={plant} currentUser={user} />;
    case "organization": return <OrganizationModule currentUser={user} />;
    case "import": return <ImportModule plant={plant} />;
    case "export": return <ExportModule plant={plant} />;
    case "reports": return <ReportsModule plant={plant} />;
    case "rework": return <ReworkModule plant={plant} user={user} />;
  }
}

// ============================================================
// Dashboard - role-personalized
// ============================================================
function DashboardModule({ plant, plantInfo, user, onNavigate, onStartInspection }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onStartInspection?: () => void }) {
  const role = user.role as Role;
  if (role === "Operator") return <OperatorDashboard plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onStartInspection={onStartInspection} />;
  if (role === "QCInspector") return <InspectorDashboard plant={plant} plantInfo={plantInfo} user={user} />;
  if (role === "ProductionSupervisor") return <SupervisorDashboard plant={plant} plantInfo={plantInfo} user={user} />;
  if (role === "AssistantManager") return <AssistantManagerDashboard plant={plant} plantInfo={plantInfo} user={user} />;
  return <ControlTowerDashboard plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} />;
}

// ============================================================
// Control Tower Dashboard (Admin / QualityManager)
// ============================================================
function ControlTowerDashboard({ plant, plantInfo, user, onNavigate }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?plant=${plant}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading control tower…" />;

  // Build activity timeline from recent inspections and NCRs
  const activityItems = [
    ...data.recentInspections.map((r: any) => ({
      type: "inspection",
      icon: r.overallResult === "Pass" ? CheckCircle2 : r.overallResult === "Fail" ? XCircle : AlertCircle,
      iconColor: r.overallResult === "Pass" ? "var(--semantic-success)" : r.overallResult === "Fail" ? "var(--semantic-error)" : "#8a6835",
      title: `${r.recordNo} - ${r.stage?.name || ""}`,
      subtitle: `${r.workOrder?.woNumber || ""} - HTU ${r.htuNo || ""} - ${r.inspector || ""}`,
      result: r.overallResult,
      time: r.inspectedAt,
    })),
    ...data.recentNcrs.map((n: any) => ({
      type: "ncr",
      icon: AlertTriangle,
      iconColor: n.severity === "Critical" ? "var(--semantic-error)" : "#8a6835",
      title: `${n.ncrNumber} - ${n.defectCategory}`,
      subtitle: `${n.workOrder?.woNumber || ""} - HTU ${n.htuno || ""} - ${n.severity}`,
      result: n.status,
      time: n.createdAt,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  const quickActions = [
    { label: "New Inspection", icon: ClipboardCheck, module: "inspection" as ModuleKey, color: "var(--primary)" },
    { label: "View NCRs", icon: AlertTriangle, module: "ncr" as ModuleKey, color: "var(--semantic-error)" },
    { label: "Work Orders", icon: ClipboardList, module: "workorders" as ModuleKey, color: "var(--ht-green)" },
    { label: "Process Flow", icon: Workflow, module: "processflow" as ModuleKey, color: "#8a6835" },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow={`${plantInfo?.shortName || plant} - ${plantInfo?.productType || "Radiators"}`}
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={`Control Tower - ${data.quality.inspectionsToday} inspections today - ${data.risk.openNcrs} open NCRs - ${data.risk.criticalNcrs} critical`}
        info="The Dashboard is your home page - it shows a live snapshot of today's quality and production activity across the plant. Use the Quick Actions below to jump to common tasks."
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: "var(--semantic-success)" + "14" }}>
              <div className="w-2 h-2 rounded-full pulse-soft" style={{ backgroundColor: "var(--semantic-success)" }} />
              <span className="t-label" style={{ color: "var(--semantic-success)" }}>LIVE - Shift A</span>
            </div>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-5">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.label}
                onClick={() => onNavigate(qa.module)}
                className="flex items-center gap-2.5 p-3 rounded-xl transition-colors hover:bg-[var(--canvas-soft)]"
                style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: qa.color + "14" }}>
                  <Icon size={16} style={{ color: qa.color }} />
                </div>
                <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{qa.label}</span>
              </button>
            );
          })}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="First-Pass Yield" value={`${data.quality.firstPassYield}%`} sublabel={`${data.quality.completed}/${data.quality.planned} units released`} tone={data.quality.firstPassYield >= 90 ? "ok" : data.quality.firstPassYield >= 75 ? "warn" : "risk"} icon={<Target size={15} />} />
          <StatCard label="Open NCRs" value={data.risk.openNcrs} sublabel={`${data.risk.criticalNcrs} critical - ${data.risk.openFmea} FMEA open`} tone={data.risk.criticalNcrs > 0 ? "risk" : "neutral"} icon={<AlertTriangle size={15} />} />
          <StatCard label="Inspections Today" value={data.quality.inspectionsToday} sublabel={`${data.quality.failedInspectionsToday} CTQ failures`} tone={data.quality.failedInspectionsToday > 0 ? "risk" : "ok"} icon={<ClipboardCheck size={15} />} />
          <StatCard label="Material Holds" value={data.operations.materialHolds} sublabel={`${data.operations.overdueCalibrations} calibrations overdue`} tone="warn" icon={<Boxes size={15} />} />
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Completed</div>
            <div className="t-title-md t-num mt-1" style={{ color: "var(--semantic-success)" }}>{data.quality.completed}</div>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Planned</div>
            <div className="t-title-md t-num mt-1" style={{ color: "var(--ink)" }}>{data.quality.planned}</div>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Rejected</div>
            <div className="t-title-md t-num mt-1" style={{ color: "var(--semantic-error)" }}>{data.quality.rejected}</div>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Rework</div>
            <div className="t-title-md t-num mt-1" style={{ color: "#8a6835" }}>{data.quality.rework}</div>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Doc Reviews</div>
            <div className="t-title-md t-num mt-1" style={{ color: "var(--ink)" }}>{data.operations.pendingDocApprovals}</div>
          </div>
          <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>WO by Status</div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {Object.entries(data.operations.woByStatus).map(([status, count]) => (
                <span key={status} className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}>{status}: {count as number}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* FPY Trend */}
          <div className="lg:col-span-2 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>First-Pass Yield</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>14-day trend by stage</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--primary)" + "14", color: "var(--primary)" }}>LIVE</span>
                <Activity size={16} style={{ color: "var(--muted)" }} />
              </div>
            </div>
            <FpyTrendChart data={data.fpyByStage} />
          </div>

          {/* Recent Activity Timeline */}
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Recent Activity</h2>
              <Activity size={16} style={{ color: "var(--muted)" }} />
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto scroll-fine">
              {activityItems.map((item: any, i: number) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: item.iconColor + "14" }}>
                      <Icon size={13} style={{ color: item.iconColor }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="t-body-sm truncate" style={{ color: "var(--ink)" }}>{item.title}</div>
                      <div className="t-label truncate" style={{ color: "var(--muted)" }}>{item.subtitle}</div>
                      <div className="t-label mt-0.5" style={{ color: "var(--muted-soft)" }}>{fmtDateTime(item.time)}</div>
                    </div>
                    <span className="t-label px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: item.result === "Pass" || item.result === "Closed" ? "var(--semantic-success)" + "14" : item.result === "Fail" ? "var(--semantic-error)" + "14" : "var(--canvas)", color: item.result === "Pass" || item.result === "Closed" ? "var(--semantic-success)" : item.result === "Fail" ? "var(--semantic-error)" : "var(--muted)" }}>{item.result}</span>
                  </div>
                );
              })}
              {activityItems.length === 0 && <EmptyState message="No recent activity." />}
            </div>
          </div>

          {/* Top Risk Items - horizontal compact cards */}
          <div className="lg:col-span-3 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Top Risk Items</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>Highest RPN failure modes · S×O×D</div>
              </div>
              <ShieldAlert size={16} style={{ color: "var(--muted)" }} />
            </div>
            {data.risk.highRpnFmea.length === 0 ? (
              <EmptyState message="No high-RPN items." />
            ) : (
              <div className="flex gap-3 overflow-x-auto scroll-fine pb-1">
                {data.risk.highRpnFmea.map((f: any, i: number) => (
                  <div
                    key={i}
                    className="shrink-0 rounded-lg p-3 relative"
                    style={{
                      backgroundColor: "var(--canvas-soft)",
                      borderTop: `3px solid ${f.rpn >= 100 ? "var(--semantic-error)" : "#8a6835"}`,
                      width: 180,
                    }}
                  >
                    {/* RPN badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="t-title-sm t-num" style={{ color: f.rpn >= 100 ? "var(--semantic-error)" : "#8a6835", fontWeight: 700 }}>
                        {f.rpn}
                      </span>
                      <span
                        className="t-label px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: f.rpn >= 100 ? "var(--semantic-error)" + "14" : "#8a683514",
                          color: f.rpn >= 100 ? "var(--semantic-error)" : "#8a6835",
                        }}
                      >
                        {f.rpn >= 100 ? "HIGH" : "MED"}
                      </span>
                    </div>
                    {/* Failure mode */}
                    <div className="t-body-sm mb-1.5" style={{ color: "var(--ink)", fontWeight: 500, lineHeight: 1.3, minHeight: 34 }}>
                      {f.failureMode}
                    </div>
                    {/* Stage + SOD */}
                    <div className="t-label mb-2" style={{ color: "var(--muted)" }}>
                      {f.stage}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="t-code px-1 rounded" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)", fontSize: 10 }}>S{f.severity}</span>
                      <span className="t-label" style={{ color: "var(--muted-soft)" }}>×</span>
                      <span className="t-code px-1 rounded" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)", fontSize: 10 }}>O{f.occurrence}</span>
                      <span className="t-label" style={{ color: "var(--muted-soft)" }}>×</span>
                      <span className="t-code px-1 rounded" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)", fontSize: 10 }}>D{f.detection}</span>
                    </div>
                    {/* RPN bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--hairline)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min((f.rpn / 200) * 100, 100)}%`, backgroundColor: f.rpn >= 100 ? "var(--semantic-error)" : "#8a6835" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Inspections */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Recent Inspections</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>{data.recentInspections.length} latest records</div>
              </div>
              <ClipboardCheck size={16} style={{ color: "var(--muted)" }} />
            </div>
            <DataTable
              columns={[
                { key: "record", header: "Record", render: (r: any) => <span className="t-code" style={{ color: "var(--ink)" }}>{r.recordNo}</span>, sortable: true, sortValue: (r: any) => r.recordNo },
                { key: "stage", header: "Stage", render: (r: any) => (
                  <div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.stage?.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{r.stage?.documentRef}</div>
                  </div>
                ), mobileLabel: "Stage" },
                { key: "wo", header: "Work Order", render: (r: any) => (
                  <div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.workOrder?.woNumber}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.customer}</div>
                  </div>
                ), hideOnMobile: true },
                { key: "htu", header: "HTU", render: (r: any) => <span className="t-code">{r.htuNo}</span>, hideOnMobile: true },
                { key: "result", header: "Result", render: (r: any) => <ResultBadge result={r.overallResult} />, mobileLabel: "Result" },
                { key: "when", header: "When", render: (r: any) => <span className="t-label">{fmtDateTime(r.inspectedAt)}</span>, hideOnMobile: true },
              ]}
              data={data.recentInspections}
            />
          </div>

          {/* Recent NCRs */}
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Recent NCRs</h2>
              <AlertTriangle size={16} style={{ color: "var(--muted)" }} />
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto scroll-fine">
              {data.recentNcrs.map((n: any) => (
                <div key={n.id} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)", borderLeft: `3px solid ${n.severity === "Critical" ? "var(--semantic-error)" : n.severity === "Major" ? "var(--primary)" : "var(--muted)"}` }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{n.ncrNumber}</span>
                    <StatusBadge status={n.severity} size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{n.defectCategory}</div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{n.workOrder?.woNumber} - {n.htuno}</div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted-soft)" }}>{fmtDate(n.createdAt)}</div>
                </div>
              ))}
              {data.recentNcrs.length === 0 && <EmptyState message="No NCRs." />}
            </div>
          </div>

          {/* ── Rework Overview Widget ── */}
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Rework Overview</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>Open jobs · cost exposure</div>
              </div>
              <button
                onClick={() => onNavigate("rework")}
                className="flex items-center gap-1 px-2 py-1 rounded-md t-label transition-colors hover:bg-[var(--canvas-soft)]"
                style={{ color: "var(--primary)" }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Open Jobs</div>
                  <div className="t-title-md t-num mt-1" style={{ color: "#8a6835" }}>0</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Pending Review</div>
                  <div className="t-title-md t-num mt-1" style={{ color: "var(--ht-burnt-orange)" }}>0</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>In Progress</div>
                  <div className="t-title-md t-num mt-1" style={{ color: "var(--primary)" }}>0</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Est. Cost</div>
                  <div className="t-title-md t-num mt-1" style={{ color: "var(--ink)" }}>-</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate("rework")}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg t-body-sm transition-colors"
                style={{ border: "1px solid var(--hairline)", color: "var(--ink)", backgroundColor: "var(--canvas-soft)" }}
              >
                <Repeat size={14} style={{ color: "var(--primary)" }} />
                Report Defect / Create Rework
              </button>
            </div>
          </div>

          {/* ── COPQ Widget ── */}
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Cost of Poor Quality</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>Rework + Scrap + Re-inspection</div>
              </div>
              <IndianRupee size={16} style={{ color: "var(--ht-burnt-orange)" }} />
            </div>
            <div className="space-y-3">
              {/* Total COPQ */}
              <div className="rounded-lg p-4" style={{ backgroundColor: "var(--canvas-soft)" }}>
                <div className="t-label" style={{ color: "var(--muted)" }}>Total COPQ (this month)</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="t-title-lg t-num" style={{ color: "var(--ht-burnt-orange)" }}>INR</span>
                  <span className="t-title-lg t-num" style={{ color: "var(--ink)" }}>0</span>
                </div>
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>
                  Based on {data.quality.rework} rework + {data.quality.rejected} rejected units
                </div>
              </div>
              {/* Breakdown bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-label" style={{ color: "var(--body)" }}>Rework Cost</span>
                    <span className="t-label t-num" style={{ color: "var(--muted)" }}>INR 0</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--hairline)" }}>
                    <div className="h-full rounded-full" style={{ width: "0%", backgroundColor: "#8a6835" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-label" style={{ color: "var(--body)" }}>Scrap Cost</span>
                    <span className="t-label t-num" style={{ color: "var(--muted)" }}>INR 0</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--hairline)" }}>
                    <div className="h-full rounded-full" style={{ width: "0%", backgroundColor: "var(--semantic-error)" }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-label" style={{ color: "var(--body)" }}>Re-inspection</span>
                    <span className="t-label t-num" style={{ color: "var(--muted)" }}>INR 0</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--hairline)" }}>
                    <div className="h-full rounded-full" style={{ width: "0%", backgroundColor: "var(--ht-slate-blue)" }} />
                  </div>
                </div>
              </div>
              <p className="t-label" style={{ color: "var(--muted-soft)", lineHeight: 1.4 }}>
                COPQ = Rework + Scrap + Re-inspection costs. Rates sourced from approved RateMaster. Full warranty cost scope pending Finance validation.
              </p>
            </div>
          </div>

          {/* Defect Pareto */}
          <div className="lg:col-span-3 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Defect Pareto</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>All NCRs - cumulative distribution</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="t-label" style={{ color: "var(--muted)" }}>{data.pareto?.length || 0} defect types</span>
                <BarChart3 size={16} style={{ color: "var(--muted)" }} />
              </div>
            </div>
            <ParetoChart data={data.pareto} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Assistant Manager Dashboard - QC Overview
// ============================================================
function AssistantManagerDashboard({ plant, plantInfo, user }: { plant: string; plantInfo: any; user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/dashboard?plant=${plant}`).then(r => r.json()),
      fetch(`/api/analytics?type=stage-yield&days=30&plant=${plant}`).then(r => r.json()),
      fetch(`/api/ncrs?plant=${plant}`).then(r => r.json()),
      fetch(`/api/fmea`).then(r => r.json()),
    ]).then(([d, sy, n, f]) => {
      setData({ dash: d, stageYield: sy, ncrs: n.ncrs || [], fmea: f.records || [] });
      setLoading(false);
    });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading QC overview…" />;

  const openNcrs = data.ncrs.filter((n: any) => n.status !== "Closed");
  const agingNcrs = openNcrs.map((n: any) => {
    const age = Math.floor((Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return { ...n, age };
  }).sort((a: any, b: any) => b.age - a.age).slice(0, 6);
  const highRiskFmea = data.fmea.filter((f: any) => f.rpn >= 80).sort((a: any, b: any) => b.rpn - a.rpn).slice(0, 6);

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow={`${plantInfo?.shortName || plant} · QC Overview`}
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Inspection pass rates · NCR aging · FMEA risk items"
        info="Your role-based dashboard. The cards below summarise today's inspection performance and risk items. Click any card or quick action to drill into the details."
      />
      <div className="p-4 md:p-8 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="First-Pass Yield" value={`${data.dash.quality.firstPassYield}%`} sublabel={`${data.dash.quality.completed} units released`} tone={data.dash.quality.firstPassYield >= 90 ? "ok" : "warn"} icon={<Target size={15} />} />
          <StatCard label="Open NCRs" value={openNcrs.length} sublabel={`${openNcrs.filter((n: any) => n.severity === "Critical").length} critical`} tone={openNcrs.length > 5 ? "risk" : "neutral"} icon={<AlertTriangle size={15} />} />
          <StatCard label="High-Risk FMEA" value={highRiskFmea.length} sublabel="RPN ≥ 80" tone={highRiskFmea.length > 0 ? "risk" : "ok"} icon={<ShieldAlert size={15} />} />
          <StatCard label="Inspections Today" value={data.dash.quality.inspectionsToday} sublabel={`${data.dash.quality.failedInspectionsToday} failures`} tone="neutral" icon={<ClipboardCheck size={15} />} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>Stage Pass Rate · 30 days</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto scroll-fine">
              {Object.entries(data.stageYield.stages || {}).map(([stage, s]: any) => {
                const total = s.total || 0;
                const passRate = total > 0 ? (s.ok / total) * 100 : 0;
                return (
                  <div key={stage} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{stage}</span>
                      <span className="t-code" style={{ color: passRate >= 95 ? "var(--semantic-success)" : passRate >= 85 ? "#8a6835" : "var(--semantic-error)" }}>{passRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={passRate} className="h-1.5" style={{ backgroundColor: "var(--hairline)" }} />
                    <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{s.ok} pass · {s.fail || 0} fail · {s.hold || 0} hold · {s.rejected || 0} rejected</div>
                  </div>
                );
              })}
              {Object.keys(data.stageYield.stages || {}).length === 0 && <EmptyState message="No stage yield data." />}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>NCR Aging · Oldest Open</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto scroll-fine">
              {agingNcrs.map((n: any) => (
                <div key={n.id} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{n.ncrNumber}</span>
                    <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: n.age > 14 ? "#b8556914" : n.age > 7 ? "#a0784014" : "var(--surface-strong)", color: n.age > 14 ? "var(--semantic-error)" : n.age > 7 ? "#8a6835" : "var(--muted)" }}>{n.age}d</span>
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{n.defectCategory}</div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{n.workOrder?.woNumber} · {n.stageName}</div>
                </div>
              ))}
              {agingNcrs.length === 0 && <EmptyState message="No open NCRs." />}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>FMEA Risk Items · RPN ≥ 80</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {highRiskFmea.map((f: any) => (
                <div key={f.id} className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-code font-medium" style={{ color: f.rpn >= 100 ? "var(--semantic-error)" : "#8a6835" }}>RPN {f.rpn}</span>
                    <StatusBadge status={f.status} size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{f.failureMode}</div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{f.stageName} · S{f.severity}×O{f.occurrence}×D{f.detection}</div>
                </div>
              ))}
              {highRiskFmea.length === 0 && <EmptyState message="No high-risk items." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Supervisor Dashboard - Shift Overview
// ============================================================
function SupervisorDashboard({ plant, plantInfo, user }: { plant: string; plantInfo: any; user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/work-orders?plant=${plant}`).then(r => r.json()),
      fetch(`/api/ncrs?plant=${plant}&status=Open`).then(r => r.json()),
      fetch(`/api/inspections?plant=${plant}&limit=20`).then(r => r.json()),
    ]).then(([w, n, i]) => {
      setData({ workOrders: w.workOrders || [], ncrs: n.ncrs || [], inspections: i.records || [] });
      setLoading(false);
    });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading shift overview…" />;

  const inProgress = data.workOrders.filter((w: any) => w.status === "In Progress");
  const onHold = data.workOrders.filter((w: any) => w.status === "On Hold");
  const released = data.workOrders.filter((w: any) => w.status === "Released");
  const failedToday = data.inspections.filter((r: any) => r.overallResult === "Fail");

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow={`${plantInfo?.shortName || plant} · Shift Overview`}
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Work orders in progress · Holds · Recent failures"
      />
      <div className="p-4 md:p-8 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="In Progress" value={inProgress.length} sublabel="Active work orders" tone="neutral" icon={<Activity size={15} />} />
          <StatCard label="On Hold" value={onHold.length} sublabel="Awaiting QA / material" tone={onHold.length > 0 ? "risk" : "ok"} icon={<AlertCircle size={15} />} />
          <StatCard label="Released" value={released.length} sublabel="Ready to start" tone="ok" icon={<CheckCircle2 size={15} />} />
          <StatCard label="Failed Today" value={failedToday.length} sublabel="Inspections failed" tone={failedToday.length > 0 ? "risk" : "ok"} icon={<XCircle size={15} />} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>Work Orders In Progress</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-fine">
              {inProgress.map((w: any) => (
                <div key={w.id} className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{w.woNumber}</span>
                    <StatusBadge status={w.status} size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>{w.customer} · {w.size}</div>
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="t-label t-num" style={{ color: "var(--muted)" }}>{w.completedQty}/{w.plannedQty} units</span>
                      <span className="t-label" style={{ color: "var(--primary)" }}>{((w.completedQty / w.plannedQty) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={(w.completedQty / w.plannedQty) * 100} className="h-1" style={{ backgroundColor: "var(--hairline)" }} />
                  </div>
                </div>
              ))}
              {inProgress.length === 0 && <EmptyState message="No work orders in progress." />}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>On Hold · Stalled Work</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-fine">
              {onHold.map((w: any) => (
                <div key={w.id} className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{w.woNumber}</span>
                    <StatusBadge status="On Hold" size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>{w.customer} · {w.size}</div>
                  <div className="t-label mt-1 flex items-center gap-2" style={{ color: "var(--muted)" }}>
                    <span>Material: <span style={{ color: w.materialStatus === "Available" ? "var(--semantic-success)" : "var(--semantic-error)" }}>{w.materialStatus}</span></span>
                    <span>·</span>
                    <span>{w._count?.ncrs || 0} NCRs</span>
                  </div>
                </div>
              ))}
              {onHold.length === 0 && <EmptyState message="No work orders on hold." />}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>Recent Inspection Failures</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto scroll-fine">
              {failedToday.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.recordNo} · {r.stage?.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.woNumber} · {r.workOrder?.customer} · {fmtDateTime(r.inspectedAt)}</div>
                  </div>
                  <ResultBadge result="Fail" />
                </div>
              ))}
              {failedToday.length === 0 && <EmptyState message="No failed inspections." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Inspector Dashboard - My Inspection Queue
// ============================================================
function InspectorDashboard({ plant, plantInfo, user }: { plant: string; plantInfo: any; user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/inspections?plant=${plant}&limit=50`).then(r => r.json()),
      fetch(`/api/ncrs?plant=${plant}`).then(r => r.json()),
      fetch(`/api/analytics?type=stage-yield&days=30&plant=${plant}`).then(r => r.json()),
    ]).then(([i, n, sy]) => {
      setData({ inspections: i.records || [], ncrs: n.ncrs || [], stageYield: sy });
      setLoading(false);
    });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading inspection queue…" />;

  const myStages = user.assignedStages || [];
  const myInspections = myStages.length > 0
    ? data.inspections.filter((r: any) => myStages.includes(r.stage?.stageCode))
    : data.inspections;
  const myNcrs = data.ncrs.filter((n: any) =>
    n.capaOwner && n.capaOwner.toLowerCase().includes(user.name.toLowerCase().split(" ")[0])
  ).slice(0, 8);
  const myStageYield = myStages.length > 0
    ? Object.entries(data.stageYield.stages || {}).filter(([s]: any) => myStages.includes(s))
    : Object.entries(data.stageYield.stages || {});

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow={`${plantInfo?.shortName || plant} · My Inspection Queue`}
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={myStages.length > 0 ? `Assigned stages: ${myStages.join(", ")}` : "All stages · General inspector"}
      />
      <div className="p-4 md:p-8 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="My Queue" value={myInspections.length} sublabel="Recent inspections" tone="neutral" icon={<ListChecks size={15} />} />
          <StatCard label="My Failures" value={myInspections.filter((r: any) => r.overallResult === "Fail").length} sublabel="CTQ failures" tone="risk" icon={<XCircle size={15} />} />
          <StatCard label="NCRs Raised" value={myNcrs.length} sublabel="Open · assigned to me" tone="warn" icon={<AlertTriangle size={15} />} />
          <StatCard label="Avg Stage FPY" value={myStageYield.length > 0 ? `${(myStageYield.reduce((s: number, [, v]: any) => s + v.fpy, 0) / myStageYield.length).toFixed(1)}%` : "-"} sublabel="My stages · 30 days" tone="ok" icon={<Target size={15} />} />
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>My Recent Inspections</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-fine">
              {myInspections.slice(0, 15).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="min-w-0">
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.recordNo} · {r.stage?.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.woNumber} · HTU {r.htuNo} · {fmtDateTime(r.inspectedAt)}</div>
                  </div>
                  <ResultBadge result={r.overallResult} />
                </div>
              ))}
              {myInspections.length === 0 && <EmptyState message="No inspections for your stages." />}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>My Stage FPY</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-fine">
              {myStageYield.map(([stage, s]: any) => (
                <div key={stage} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{stage}</span>
                    <span className="t-code" style={{ color: s.fpy >= 95 ? "var(--semantic-success)" : s.fpy >= 85 ? "#8a6835" : "var(--semantic-error)" }}>{s.fpy}%</span>
                  </div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>{s.ok}/{s.total} pass</div>
                </div>
              ))}
              {myStageYield.length === 0 && <EmptyState message="No stage data." />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Operator Dashboard - simplified with large touch targets
// ============================================================
function OperatorDashboard({ plant, plantInfo, user, onNavigate, onStartInspection }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onStartInspection?: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/work-orders?plant=${plant}`).then(r => r.json()),
      fetch(`/api/inspections?plant=${plant}&limit=60`).then(r => r.json()),
    ]).then(([w, i]) => {
      setData({ workOrders: w.workOrders || [], inspections: i.records || [] });
      setLoading(false);
    });
  }, [plant]);

  if (loading || !data) return <LoadingBlock label="Loading your tasks…" />;

  const myStages = user.assignedStages || [];
  const myStageNames = myStages
    .map(code => K2_STAGES.find(k => k.code === code))
    .filter(Boolean) as { code: string; name: string }[];

  // Active WOs for each of my stages (we link by most recent inspection on that stage)
  const recentByStage: Record<string, any[]> = {};
  for (const code of myStages) recentByStage[code] = [];
  for (const r of data.inspections) {
    const code = r.stage?.stageCode;
    if (code && recentByStage[code]) recentByStage[code].push(r);
  }

  // Build cards: one per assigned stage, with the most recent WO touched on that stage
  const stageCards = (myStageNames.length > 0 ? myStageNames : K2_STAGES.slice(0, 4)).map(s => {
    const recent = (recentByStage[s.code] || [])[0];
    const wo = recent?.workOrder;
    return {
      code: s.code,
      name: s.name,
      woNumber: wo?.woNumber || "-",
      result: recent?.overallResult,
      lastInspectedAt: recent?.inspectedAt,
      recentCount: (recentByStage[s.code] || []).length,
    };
  });

  // Shift progress: % of today's inspections done by this operator
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const myInspectionsToday = data.inspections.filter((r: any) =>
    new Date(r.inspectedAt) >= today &&
    r.inspector &&
    r.inspector.toLowerCase().includes(user.name.toLowerCase().split(" ")[0])
  );
  const target = 8; // simple shift target
  const shiftPct = Math.min(100, Math.round((myInspectionsToday.length / target) * 100));

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow={`${plantInfo?.shortName || plant} · My Tasks`}
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle={myStages.length > 0 ? `Your stages: ${myStages.join(", ")}` : "Contact your supervisor to get stage assignments"}
      />
      <div className="p-4 md:p-8 space-y-5">
        {/* Large Start Inspection CTA - opens inspection drawer directly */}
        <button
          onClick={() => { if (onStartInspection) { onStartInspection(); } else { onNavigate("inspection"); } }}
          data-tour="start-inspection"
          className="w-full rounded-2xl p-6 md:p-8 flex items-center justify-between gap-4 transition-transform active:scale-[0.99]"
          style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)", border: "1px solid var(--primary)" }}
          title="Opens the inspection form drawer directly - no page navigation needed"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
              <ClipboardCheck size={28} />
            </div>
            <div className="text-left">
              <div className="t-title-md">Start Inspection</div>
              <div className="t-body-sm mt-0.5" style={{ opacity: 0.85 }}>
                {myStages.length > 0 ? "Tap your stage card below to begin" : "Open the inspection form to log a new check"}
              </div>
            </div>
          </div>
          <ArrowRight size={22} />
        </button>

        {/* Shift progress bar - simple */}
        <div className="rounded-xl p-4" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="t-label" style={{ color: "var(--muted)" }}>Shift Progress</div>
            <div className="t-body-sm font-medium t-num" style={{ color: "var(--ink)" }}>
              {myInspectionsToday.length} / {target} inspections
            </div>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${shiftPct}%`, backgroundColor: "var(--primary)" }} />
          </div>
        </div>

        {/* Stage cards - big touch targets */}
        <div>
          <div className="t-label mb-3" style={{ color: "var(--muted)" }}>Your Stages</div>
          {stageCards.length === 0 ? (
            <EmptyState message="No stage assignments yet." hint="Contact your supervisor to get stage assignments." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stageCards.map((c) => (
                <button
                  key={c.code}
                  onClick={() => onNavigate("inspection")}
                  className="text-left rounded-xl p-4 transition-colors hover:bg-[var(--canvas-soft)]"
                  style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", minHeight: 132 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="t-label" style={{ color: "var(--muted)" }}>{c.code}</span>
                    {c.result && <ResultBadge result={c.result} />}
                  </div>
                  <div className="t-title-sm" style={{ color: "var(--ink)" }}>{c.name}</div>
                  <div className="t-body-sm mt-1" style={{ color: "var(--muted)" }}>
                    WO <span className="t-code" style={{ color: "var(--ink)" }}>{c.woNumber}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="t-label" style={{ color: "var(--muted-soft)" }}>
                      {c.recentCount} recent
                    </span>
                    <span className="inline-flex items-center gap-1 t-label px-2.5 py-1 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                      <PlayCircle size={12} /> Start
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FPY Trend Chart (inline SVG sparklines)
// ============================================================
function FpyTrendChart({ data }: { data: Record<string, any[]> }) {
  const stages = Object.keys(data).slice(0, 6);
  if (stages.length === 0) return <EmptyState message="No FPY data." />;
  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const points = data[stage];
        if (!points || points.length === 0) return null;
        const w = 600, h = 36;
        const xStep = w / Math.max(points.length - 1, 1);
        const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${i * xStep},${h - (p.fpy / 100) * h}`).join(" ");
        const avgFpy = points.reduce((s: number, p: any) => s + p.fpy, 0) / points.length;
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="w-28 md:w-36 shrink-0">
              <div className="t-body-sm truncate" style={{ color: "var(--ink)" }}>{stage}</div>
              <div className="t-label" style={{ color: "var(--muted)" }}>avg {avgFpy.toFixed(1)}%</div>
            </div>
            <div className="flex-1 relative" style={{ height: h }}>
              <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
                <line x1="0" y1={h * 0.1} x2={w} y2={h * 0.1} stroke="var(--hairline)" strokeDasharray="2,3" />
                <path d={path} fill="none" stroke="var(--primary)" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="w-12 shrink-0 text-right">
              <span className="t-body-sm font-medium t-num" style={{ color: avgFpy >= 95 ? "var(--semantic-success)" : avgFpy >= 85 ? "#8a6835" : "var(--semantic-error)" }}>
                {avgFpy.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ParetoChart({ data }: { data: { defect: string; count: number; cumPct: number }[] }) {
  if (!data || data.length === 0) return <EmptyState message="No defects recorded." />;
  const max = Math.max(...data.map(d => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      {/* Summary line */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="t-body-sm" style={{ color: "var(--muted)" }}>
          {data.length} defect types · {total} total defects
        </div>
        <div className="t-label" style={{ color: "var(--muted-soft)" }}>
          80% threshold marks the "vital few"
        </div>
      </div>
      {/* Chart rows */}
      <div className="space-y-2.5">
        {data.map((d, i) => {
          const barPct = max > 0 ? (d.count / max) * 100 : 0;
          const isVitalFew = d.cumPct <= 80;
          return (
            <div key={i} className="flex items-center gap-3">
              {/* Rank + defect name */}
              <div className="flex items-center gap-2 w-32 md:w-44 shrink-0">
                <span
                  className="t-label flex items-center justify-center shrink-0"
                  style={{
                    width: 18, height: 18, borderRadius: 3,
                    backgroundColor: isVitalFew ? "var(--primary)" : "var(--surface-strong)",
                    color: isVitalFew ? "var(--on-primary)" : "var(--muted)",
                    fontSize: 10, fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
                <span className="t-body-sm truncate" style={{ color: "var(--ink)", fontWeight: 500 }}>{d.defect}</span>
              </div>
              {/* Bar + count */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-7 rounded relative overflow-hidden" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded transition-all flex items-center px-2"
                    style={{
                      width: `${barPct}%`,
                      backgroundColor: isVitalFew ? "var(--primary)" : "var(--muted)",
                      minWidth: d.count > 0 ? 28 : 0,
                    }}
                  >
                    <span className="t-label" style={{ color: "var(--on-primary)", fontWeight: 600, fontSize: 11 }}>{d.count}</span>
                  </div>
                </div>
                {/* Cumulative % */}
                <div className="shrink-0 w-12 text-right">
                  <span
                    className="t-label t-num"
                    style={{
                      color: isVitalFew ? "var(--primary)" : "var(--muted)",
                      fontWeight: isVitalFew ? 600 : 400,
                    }}
                  >
                    {d.cumPct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* 80% reference line indicator */}
      <div className="mt-4 pt-3 border-t flex items-center gap-4" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "var(--primary)" }} />
          <span className="t-label" style={{ color: "var(--muted)" }}>Vital few (cum. ≤ 80%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: "var(--muted)" }} />
          <span className="t-label" style={{ color: "var(--muted)" }}>Trivial many (cum. &gt; 80%)</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Work Orders Module
// ============================================================
function WorkOrdersModule({ plant }: { plant: string }) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ plant });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/work-orders?${params}`).then(r => r.json()).then(d => { setWorkOrders(d.workOrders || []); setLoading(false); });
  }, [plant, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleExportPO = () => {
    // Export all work orders as a CSV (Purchase Order format)
    const headers = ["WO Number", "SO Number", "Customer", "Customer PO", "Item Name", "Size", "Finish Type", "Route", "Planned Qty", "Completed Qty", "Rejected Qty", "Rework Qty", "Priority", "Status", "Material Status", "Sales Person", "Planned Start", "Planned End"];
    const rows = workOrders.map(w => [
      w.woNumber, w.soNumber || "", w.customer, w.customerPo || "",
      w.itemName, w.size, w.finishType, w.routeCode,
      w.plannedQty, w.completedQty, w.rejectedQty, w.reworkQty,
      w.priority, w.status, w.materialStatus, w.salesPerson || "",
      w.plannedStart ? new Date(w.plannedStart).toLocaleDateString() : "",
      w.plannedEnd ? new Date(w.plannedEnd).toLocaleDateString() : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `work-orders-${plant}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export complete", description: `${workOrders.length} work orders exported as CSV.` });
  };

  const columns: Column<any>[] = [
    { key: "wo", header: "WO Number", sortable: true, sortValue: (w) => w.woNumber, render: (w) => (
      <div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{w.woNumber}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{w.soNumber}</div>
      </div>
    ), mobileLabel: "WO" },
    { key: "customer", header: "Customer", sortable: true, sortValue: (w) => w.customer, render: (w) => <span className="t-body-sm">{w.customer}</span>, hideOnMobile: true },
    { key: "item", header: "Item / Size", render: (w) => (
      <div>
        <div className="t-body-sm" style={{ color: "var(--ink)" }}>{w.size}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{w.finishType}</div>
      </div>
    ), mobileLabel: "Size" },
    { key: "progress", header: "Progress", sortable: true, sortValue: (w) => w.completedQty / w.plannedQty, render: (w) => (
      <div className="min-w-[80px]">
        <div className="t-label t-num" style={{ color: "var(--muted)" }}>{w.completedQty}/{w.plannedQty}</div>
        <Progress value={(w.completedQty / w.plannedQty) * 100} className="h-1 mt-1" style={{ backgroundColor: "var(--hairline)" }} />
      </div>
    ), mobileLabel: "Progress" },
    { key: "material", header: "Material", render: (w) => <StatusBadge status={w.materialStatus} size="xs" />, hideOnMobile: true },
    { key: "status", header: "Status", sortable: true, sortValue: (w) => w.status, render: (w) => <StatusBadge status={w.status} />, mobileLabel: "Status" },
    { key: "counts", header: "Insp/NCR", render: (w) => (
      <span className="t-code">
        <span style={{ color: "var(--primary)" }}>{w._count?.inspections || 0}</span> / <span style={{ color: w._count?.ncrs ? "var(--semantic-error)" : "var(--muted)" }}>{w._count?.ncrs || 0}</span>
      </span>
    ), hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Production"
        title="Work Orders"
        subtitle="Sales-order driven production plan with route assignment and material status."
        info="A Work Order (WO) is a production authorisation - it tells the shop floor what to make, how many, and by when. Each WO is linked to a sales order and follows a predefined process route."
        helpId="wo.number"
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowImport(true)} className="t-button h-9 px-3 rounded-lg flex items-center gap-1.5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", color: "var(--ink)" }}>
              <Upload size={14} /> Import PO
            </Button>
            <Button onClick={handleExportPO} className="t-button h-9 px-3 rounded-lg flex items-center gap-1.5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", color: "var(--ink)" }}>
              <Download size={14} /> Export PO
            </Button>
            <Button onClick={() => setShowCreate(true)} className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              <Plus size={14} /> New
            </Button>
          </div>
        }
      />
      <FilterBar count={workOrders.length}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Released">Released</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>
      <div className="p-4 md:p-8">
        {loading ? <LoadingBlock label="Loading work orders…" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={workOrders}
              onRowClick={setSelected}
              emptyMessage="No work orders found."
              mobileCardRender={(w) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{w.woNumber}</span>
                    <StatusBadge status={w.status} size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>{w.customer}</div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{w.size}</div>
                  <div className="flex items-center justify-between">
                    <span className="t-label t-num" style={{ color: "var(--muted)" }}>{w.completedQty}/{w.plannedQty} units</span>
                    <StatusBadge status={w.materialStatus} size="xs" />
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[60vw] md:max-w-[1000px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <WorkOrderDetail wo={selected} plant={plant} />}
        </SheetContent>
      </Sheet>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full md:w-[55vw] md:max-w-[900px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          <CreateWorkOrderForm plant={plant} onCreated={() => { setShowCreate(false); load(); }} />
        </SheetContent>
      </Sheet>

      {/* Import PO dialog */}
      {showImport && <ImportPODialog plant={plant} onClose={() => setShowImport(false)} onImported={load} />}
    </div>
  );
}

// Import PO dialog - upload CSV of work orders / purchase orders
function ImportPODialog({ plant, onClose, onImported }: { plant: string; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const { toast } = useToast();

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { setPreview([]); return; }
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
      const rows = lines.slice(1).slice(0, 5).map(line => {
        const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = vals[i]);
        return obj;
      });
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast({ title: "Invalid file", description: "CSV must have a header row and at least one data row.", variant: "destructive" });
        setImporting(false);
        return;
      }
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
      let success = 0, fail = 0;
      for (const line of lines.slice(1)) {
        const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
        const obj: any = {};
        headers.forEach((h, i) => obj[h] = vals[i]);
        // Map CSV columns to API fields
        const payload = {
          woNumber: obj["WO Number"] || obj["woNumber"] || "",
          soNumber: obj["SO Number"] || obj["soNumber"] || "",
          customer: obj["Customer"] || obj["customer"] || "",
          customerPo: obj["Customer PO"] || obj["customerPo"] || "",
          itemName: obj["Item Name"] || obj["itemName"] || "",
          size: obj["Size"] || obj["size"] || "",
          finishType: obj["Finish Type"] || obj["finishType"] || "HDG",
          routeCode: obj["Route"] || obj["routeCode"] || plant,
          plannedQty: parseInt(obj["Planned Qty"] || obj["plannedQty"] || "1"),
          priority: obj["Priority"] || obj["priority"] || "Medium",
        };
        if (!payload.woNumber || !payload.customer) { fail++; continue; }
        try {
          const res = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          if (res.ok) success++; else fail++;
        } catch { fail++; }
      }
      toast({ title: "Import complete", description: `${success} work orders imported, ${fail} failed.` });
      setImporting(false);
      onImported();
      onClose();
    };
    reader.readAsText(file);
  };

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full md:w-[55vw] md:max-w-[900px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
        <SheetHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
          <SheetTitle className="t-title-sm" style={{ color: "var(--ink)" }}>Import Purchase Orders</SheetTitle>
          <SheetDescription className="t-body-sm" style={{ color: "var(--muted)" }}>
            Upload a CSV file with work order / purchase order data. The first row must be a header with column names matching the export format.
          </SheetDescription>
        </SheetHeader>
        <div className="p-6 space-y-4">
          {/* File upload */}
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>CSV File</Label>
            <div
              className="mt-2 rounded-lg p-6 border-2 border-dashed text-center cursor-pointer transition-colors"
              style={{ borderColor: file ? "var(--primary)" : "var(--hairline-strong)", backgroundColor: "var(--canvas-soft)" }}
              onClick={() => document.getElementById("po-file-input")?.click()}
            >
              <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--muted)" }} />
              <div className="t-body-sm" style={{ color: "var(--ink)" }}>{file ? file.name : "Click to select a CSV file"}</div>
              <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{file ? `${(file.size / 1024).toFixed(1)} KB` : "Max 5 MB"}</div>
              <input id="po-file-input" type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </div>

          {/* Preview */}
          {preview.length > 0 && (
            <div>
              <Label className="t-label" style={{ color: "var(--muted)" }}>Preview (first {preview.length} rows)</Label>
              <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid var(--hairline)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "var(--canvas-soft)" }}>
                      {Object.keys(preview[0]).slice(0, 5).map(h => (
                        <th key={h} className="t-label px-2 py-1.5 text-left" style={{ color: "var(--muted)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: "1px solid var(--hairline-soft)" }}>
                        {Object.values(row).slice(0, 5).map((v: any, j) => (
                          <td key={j} className="t-label px-2 py-1.5" style={{ color: "var(--ink)" }}>{String(v).slice(0, 20)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
            <Button onClick={onClose} variant="outline" className="t-body-sm h-9 px-4 rounded-md">Cancel</Button>
            <Button onClick={handleImport} disabled={!file || importing} className="t-body-sm h-9 px-4 rounded-md" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              {importing ? <><Loader2 size={14} className="animate-spin" /> Importing...</> : <><Upload size={14} /> Import</>}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkOrderDetail({ wo, plant }: { wo: any; plant: string }) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [reworkJobs, setReworkJobs] = useState<any[]>([]);
  const [htus, setHtus] = useState<any[]>([]);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    fetch(`/api/inspections?wo=${wo.id}&limit=9999`).then(r => r.json()).then(d => setInspections(d.records || []));
    fetch(`/api/ncrs?status=all`).then(r => r.json()).then(d => setNcrs((d.ncrs || []).filter((n: any) => n.workOrder?.woNumber === wo.woNumber)));
    // Fetch rework jobs for this WO
    fetch(`/api/rework?limit=9999`).then(r => r.json()).then(d => setReworkJobs((d.jobs || []).filter((j: any) => j.workOrderId === wo.id)));
    // Derive unique HTUs from inspection records
    const htuMap = new Map<string, { htuNo: string; inspections: any[]; status: string }>();
    (inspections || []).forEach((r: any) => {
      if (!r.htuNo) return;
      if (!htuMap.has(r.htuNo)) htuMap.set(r.htuNo, { htuNo: r.htuNo, inspections: [], status: "Planned" });
      const htu = htuMap.get(r.htuNo)!;
      htu.inspections.push(r);
      if (r.overallResult === "Pass") htu.status = "Accepted";
      else if (r.overallResult === "Fail") htu.status = "NCR/Rework";
      else if (r.overallResult === "Hold") htu.status = "On Hold";
    });
    setHtus(Array.from(htuMap.values()));
  }, [wo.id, wo.woNumber, inspections]);

  // Compute separate indicators (not one compressed progress bar)
  const unitCompletion = { completed: wo.completedQty, planned: wo.plannedQty, pct: wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0 };
  const qcRelease = {
    passed: inspections.filter(r => r.overallResult === "Pass").length,
    failed: inspections.filter(r => r.overallResult === "Fail").length,
    total: inspections.length,
  };
  const materialReadiness = wo.materialStatus === "Available";
  const uniqueHtuCount = new Set(inspections.map(r => r.htuNo).filter(Boolean)).size;

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{wo.woNumber}</SheetTitle>
        <SheetDescription className="t-body-md" style={{ color: "var(--muted)" }}>{wo.customer} - {wo.itemName}</SheetDescription>
      </SheetHeader>
      <div className="p-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-5" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <TabsTrigger value="overview" className="t-body-sm">Overview</TabsTrigger>
            <TabsTrigger value="htu" className="t-body-sm">HTU Register ({uniqueHtuCount})</TabsTrigger>
            <TabsTrigger value="inspections" className="t-body-sm">Inspections ({inspections.length})</TabsTrigger>
            <TabsTrigger value="ncrs" className="t-body-sm">NCRs ({ncrs.length})</TabsTrigger>
            <TabsTrigger value="gates" className="t-body-sm">Quality Gates</TabsTrigger>
          </TabsList>

          {/* === Overview Tab - separate indicators === */}
          <TabsContent value="overview" className="mt-5 space-y-4">
            {/* Linked SO reference */}
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
              <ClipboardList size={16} style={{ color: "var(--primary)" }} />
              <span className="t-body-sm" style={{ color: "var(--body)" }}>
                SO: <strong style={{ color: "var(--ink)" }}>{wo.soNumber || "Not linked"}</strong>
                {wo.customerPo && <> - Customer PO: <strong style={{ color: "var(--ink)" }}>{wo.customerPo}</strong></>}
              </span>
            </div>

            {/* Separate indicators - NOT one compressed progress bar */}
            <div className="grid grid-cols-2 gap-3">
              {/* Unit Completion */}
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Unit Completion</div>
                <div className="flex items-baseline gap-1">
                  <span className="t-title-sm t-num" style={{ color: "var(--semantic-success)" }}>{unitCompletion.completed}</span>
                  <span className="t-label" style={{ color: "var(--muted)" }}>of {unitCompletion.planned} units</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ backgroundColor: "var(--hairline)" }}>
                  <div className="h-full rounded-full" style={{ width: `${unitCompletion.pct}%`, backgroundColor: "var(--semantic-success)" }} />
                </div>
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>{unitCompletion.pct}% complete</div>
              </div>

              {/* QC Release */}
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>QC Release</div>
                <div className="flex items-baseline gap-2">
                  <span className="t-title-sm t-num" style={{ color: "var(--semantic-success)" }}>{qcRelease.passed}</span>
                  <span className="t-label" style={{ color: "var(--muted)" }}>passed</span>
                  <span className="t-title-sm t-num" style={{ color: qcRelease.failed > 0 ? "var(--semantic-error)" : "var(--muted)" }}>{qcRelease.failed}</span>
                  <span className="t-label" style={{ color: "var(--muted)" }}>failed</span>
                </div>
                <div className="t-label mt-2" style={{ color: "var(--muted-soft)" }}>{qcRelease.total} total inspections</div>
              </div>

              {/* Material Readiness */}
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Material Readiness</div>
                <div className="flex items-center gap-2">
                  {materialReadiness ? (
                    <><CheckCircle2 size={18} style={{ color: "var(--semantic-success)" }} /><span className="t-body-sm" style={{ color: "var(--semantic-success)", fontWeight: 500 }}>Available</span></>
                  ) : (
                    <><AlertCircle size={18} style={{ color: "#8a6835" }} /><span className="t-body-sm" style={{ color: "#8a6835", fontWeight: 500 }}>{wo.materialStatus}</span></>
                  )}
                </div>
                <div className="t-label mt-2" style={{ color: "var(--muted-soft)" }}>{materialReadiness ? "All materials allocated" : "Material shortage - may delay release"}</div>
              </div>

              {/* HTU Register count */}
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>HTU Register</div>
                <div className="flex items-baseline gap-1">
                  <span className="t-title-sm t-num" style={{ color: "var(--ht-slate-blue)" }}>{uniqueHtuCount}</span>
                  <span className="t-label" style={{ color: "var(--muted)" }}>unique units tracked</span>
                </div>
                <div className="t-label mt-2" style={{ color: "var(--muted-soft)" }}>{wo.plannedQty - uniqueHtuCount > 0 ? `${wo.plannedQty - uniqueHtuCount} units not yet started` : "All units have records"}</div>
              </div>
            </div>

            {/* Rework jobs summary */}
            {reworkJobs.length > 0 && (
              <div className="rounded-lg p-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Repeat size={14} style={{ color: "#8a6835" }} />
                  <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Rework Jobs: {reworkJobs.length}</span>
                </div>
                <div className="t-label" style={{ color: "var(--muted)" }}>{reworkJobs.filter(j => j.status !== "Closed" && j.status !== "Scrapped" && j.status !== "Cancelled").length} open - {reworkJobs.filter(j => j.status === "Closed").length} closed</div>
              </div>
            )}

            {/* Other WO fields */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: "var(--hairline)" }}>
              <DetailRow label="Route" value={wo.routeCode} />
              <DetailRow label="Finish Type" value={wo.finishType} />
              <DetailRow label="Size" value={wo.size} />
              <DetailRow label="Sales Person" value={wo.salesPerson} />
              <DetailRow label="Rejected Qty" value={String(wo.rejectedQty)} mono />
              <DetailRow label="Rework Qty" value={String(wo.reworkQty)} mono />
              <DetailRow label="Priority" value={wo.priority} />
              <DetailRow label="Status" value={wo.status} />
            </div>
          </TabsContent>

          {/* === HTU Register Tab === */}
          <TabsContent value="htu" className="mt-5 max-h-96 overflow-y-auto scroll-fine">
            <div className="space-y-2">
              {htus.map((htu) => (
                <div key={htu.htuNo} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-code t-body-sm font-medium" style={{ color: "var(--ht-slate-blue)" }}>{htu.htuNo}</span>
                    <StatusBadge status={htu.status} size="xs" />
                  </div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>{htu.inspections.length} inspections - stages: {htu.inspections.map((i: any) => i.stage?.stageCode).join(", ")}</div>
                </div>
              ))}
              {htus.length === 0 && <EmptyState message="No HTU records yet. HTUs are created when inspections are submitted." />}
            </div>
          </TabsContent>

          <TabsContent value="inspections" className="mt-5 max-h-96 overflow-y-auto scroll-fine">
            <div className="space-y-2">
              {inspections.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.recordNo} - {r.stage?.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>HTU {r.htuNo} - {r.shift} - {fmtDateTime(r.inspectedAt)}</div>
                  </div>
                  <ResultBadge result={r.overallResult} />
                </div>
              ))}
              {inspections.length === 0 && <EmptyState message="No inspections recorded." />}
            </div>
          </TabsContent>
          <TabsContent value="ncrs" className="mt-5 max-h-96 overflow-y-auto scroll-fine">
            <div className="space-y-2">
              {ncrs.map((n) => (
                <div key={n.id} className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{n.ncrNumber} - {n.defectCategory}</span>
                    <StatusBadge status={n.severity} size="xs" />
                  </div>
                  <div className="t-body-sm mt-1" style={{ color: "var(--ink)" }}>{n.description}</div>
                  <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>Status: {n.status} - Owner: {n.capaOwner || "-"}</div>
                </div>
              ))}
              {ncrs.length === 0 && <EmptyState message="No NCRs." />}
            </div>
          </TabsContent>
          <TabsContent value="gates" className="mt-5">
            <QualityGatesTab woId={wo.id} plant={plant} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// Quality Gates Tab - shows gate-by-gate enforcement status
// ============================================================
function QualityGatesTab({ woId, plant }: { woId: string; plant: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/quality-gates?woId=${woId}&plant=${plant}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [woId, plant]);

  if (loading) return <LoadingBlock label="Loading quality gates…" />;
  if (!data || data.error) return <EmptyState message="No gate data available." />;

  const gates: any[] = data.gates || [];
  const failedGates = gates.filter(g => g.gateStatus === "FAILED");
  const holdGates = gates.filter(g => g.gateStatus === "ON HOLD");
  const isBlocked = failedGates.length > 0;
  const isOnHold = holdGates.length > 0;

  const gateVisual = (status: string) => {
    if (status === "PASSED") return { icon: <CheckCircle2 size={18} />, color: "var(--semantic-success)", bg: "#4a8a6e0d", label: "PASSED" };
    if (status === "FAILED") return { icon: <XCircle size={18} />, color: "var(--semantic-error)", bg: "#b855690d", label: "FAILED" };
    if (status === "ON HOLD") return { icon: <PauseCircle size={18} />, color: "var(--semantic-error)", bg: "#b855690d", label: "ON HOLD" };
    return { icon: <Clock size={18} />, color: "#8a6835", bg: "#a078400d", label: "PENDING" };
  };

  return (
    <div className="space-y-3">
      {/* Warning banner if blocked or on hold */}
      {(isBlocked || isOnHold) && (
        <div className="rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: "#b855690d", border: "1px solid var(--semantic-error)" }}>
          <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
          <div>
            <div className="t-body-sm font-medium" style={{ color: "var(--semantic-error)" }}>This job cannot move to the next stage until all quality gates are passed</div>
            <div className="t-label mt-0.5" style={{ color: "var(--semantic-error)", opacity: 0.85 }}>
              {isBlocked && `${failedGates.length} gate${failedGates.length > 1 ? "s" : ""} failed`}
              {isBlocked && isOnHold && " · "}
              {isOnHold && `${holdGates.length} gate${holdGates.length > 1 ? "s" : ""} on hold`}
            </div>
          </div>
        </div>
      )}

      {/* Gate list - vertical */}
      <div className="space-y-2">
        {gates.map((g) => {
          const v = gateVisual(g.gateStatus);
          return (
            <div key={g.stageId} className="rounded-lg p-3 flex items-start gap-3" style={{ backgroundColor: v.bg, border: `1px solid ${v.color}33` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--surface-card)", color: v.color }}>
                {v.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{g.stageName}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{g.stageCode} · {g.documentRef || "-"}</div>
                  </div>
                  <span className="t-label px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "var(--surface-card)", color: v.color, fontWeight: 600 }}>{v.label}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap t-label" style={{ color: "var(--muted)" }}>
                  {g.latestInspectionNo ? (
                    <span>Latest: <span className="t-code" style={{ color: "var(--ink)" }}>{g.latestInspectionNo}</span></span>
                  ) : <span style={{ color: "var(--muted-soft)" }}>No inspection yet</span>}
                  {g.openNCRs > 0 && (
                    <span style={{ color: "var(--semantic-error)" }}>{g.openNCRs} open NCR{g.openNCRs > 1 ? "s" : ""}</span>
                  )}
                  {g.isCTQ && (
                    <span className="t-label px-1.5 py-0 rounded-full" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>CTQ</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {gates.length === 0 && <EmptyState message="No quality gates configured for this route." />}
      </div>

      {/* Overall status footer */}
      <div className="rounded-lg p-3 mt-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
        <div className="t-label mb-1.5" style={{ color: "var(--muted)" }}>Overall Status</div>
        {data.overallStatus === "ALL_GATES_PASSED" ? (
          <div className="flex items-center gap-2 t-body-sm font-medium" style={{ color: "var(--semantic-success)" }}>
            <CheckCircle2 size={16} /> ALL GATES PASSED · Can proceed
          </div>
        ) : isBlocked ? (
          <div className="flex items-center gap-2 t-body-sm font-medium" style={{ color: "var(--semantic-error)" }}>
            <XCircle size={16} /> BLOCKED · {failedGates.length} gate{failedGates.length > 1 ? "s" : ""} failed
          </div>
        ) : isOnHold ? (
          <div className="flex items-center gap-2 t-body-sm font-medium" style={{ color: "var(--semantic-error)" }}>
            <PauseCircle size={16} /> ON HOLD · {holdGates.length} gate{holdGates.length > 1 ? "s" : ""} on hold
          </div>
        ) : (
          <div className="flex items-center gap-2 t-body-sm font-medium" style={{ color: "#8a6835" }}>
            <Clock size={16} /> IN PROGRESS · {data.pendingGates || 0} gate{(data.pendingGates || 0) !== 1 ? "s" : ""} pending
          </div>
        )}
        <div className="t-label mt-1.5" style={{ color: "var(--muted)" }}>
          {data.passedGates || 0} passed · {data.pendingGates || 0} pending · {data.failedGates || 0} failed · {data.holdGates || 0} on hold · {data.totalGates || 0} total
        </div>
      </div>
    </div>
  );
}

function CreateWorkOrderForm({ plant, onCreated }: { plant: string; onCreated: () => void }) {
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [selectedSO, setSelectedSO] = useState<any | null>(null);
  const [form, setForm] = useState({ woNumber: "", plannedQty: 1, priority: "Medium" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Fetch available sales orders (derived from existing WOs grouped by SO number)
  useEffect(() => {
    fetch(`/api/sales-orders?plant=${plant}`).then(r => r.json()).then(d => {
      // Show SOs that still have pending quantity (eligible for new WO allocation)
      const eligible = (d.salesOrders || []).filter((so: any) => so.pendingQty > 0 || so.woCount === 0);
      setSalesOrders(eligible);
    });
  }, [plant]);

  // Auto-generate WO number
  useEffect(() => {
    if (!form.woNumber) {
      const seq = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0");
      setForm(f => ({ ...f, woNumber: `WO-2026-${seq}` }));
    }
  }, [form.woNumber]);

  // When SO is selected, the form inherits customer, PO, item, size, finish from the SO
  const handleSOSelect = (soNumber: string) => {
    const so = salesOrders.find(s => s.soNumber === soNumber);
    setSelectedSO(so || null);
  };

  const submit = async () => {
    if (!form.woNumber || !selectedSO) {
      toast({ title: "SO selection required", description: "Select a sales order first. Customer, item, and size are auto-populated from the SO.", variant: "destructive" });
      return;
    }
    if (form.plannedQty > selectedSO.pendingQty) {
      toast({ title: "Quantity exceeds SO demand", description: `Planned ${form.plannedQty} exceeds remaining SO quantity ${selectedSO.pendingQty}.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      woNumber: form.woNumber,
      soNumber: selectedSO.soNumber,
      customer: selectedSO.customer,
      customerPo: selectedSO.poNumber,
      itemName: selectedSO.itemName,
      size: selectedSO.size,
      finishType: selectedSO.finishType,
      plannedQty: form.plannedQty,
      priority: form.priority,
      materialStatus: "Available",
      salesPerson: selectedSO.salesPerson,
      routeCode: plant,
    };
    const res = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast({ title: "Work order created", description: `${form.woNumber} for ${selectedSO.customer} linked to SO ${selectedSO.soNumber}` });
      onCreated();
    } else { toast({ title: "Failed to create", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>New Work Order</SheetTitle>
        <SheetDescription className="t-body-sm" style={{ color: "var(--muted)" }}>
          Start from a sales order. Customer, item, size, and finish auto-populate from the selected SO.
        </SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-4">
        {/* Step 1: Select SO */}
        <div>
          <Label className="t-label flex items-center gap-1" style={{ color: "var(--muted)" }}>
            Sales Order * <span className="t-label" style={{ color: "var(--muted-soft)" }}>(select eligible SO with pending demand)</span>
          </Label>
          <Select value={selectedSO?.soNumber || ""} onValueChange={handleSOSelect}>
            <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="Select sales order..." /></SelectTrigger>
            <SelectContent>
              {salesOrders.map(so => (
                <SelectItem key={so.soNumber || so.srNo} value={so.soNumber}>
                  {so.soNumber} - {so.customer} - {so.pendingQty} pending
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Auto-populated fields from SO (read-only) */}
        {selectedSO && (
          <div className="rounded-lg p-3 grid grid-cols-2 gap-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>Customer <span className="t-label px-1 rounded" style={{ backgroundColor: "var(--semantic-success)14", color: "var(--semantic-success)", fontSize: 8 }}>AUTO</span></div>
            <div className="t-label" style={{ color: "var(--muted)" }}>Customer PO <span className="t-label px-1 rounded" style={{ backgroundColor: "var(--semantic-success)14", color: "var(--semantic-success)", fontSize: 8 }}>AUTO</span></div>
            <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selectedSO.customer}</div>
            <div className="t-body-sm t-code" style={{ color: "var(--ink)" }}>{selectedSO.poNumber || "-"}</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>Item Name</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>Size / Finish</div>
            <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selectedSO.itemName}</div>
            <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selectedSO.size} - {selectedSO.finishType}</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>SO Ordered Qty</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>SO Pending (allocatable)</div>
            <div className="t-body-sm t-num" style={{ color: "var(--ink)" }}>{selectedSO.orderedQty}</div>
            <div className="t-body-sm t-num" style={{ color: "#8a6835", fontWeight: 600 }}>{selectedSO.pendingQty}</div>
          </div>
        )}

        {/* Step 2: WO-specific fields */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="WO Number *" value={form.woNumber} onChange={(v) => setForm({ ...form, woNumber: v })} />
          <NumberField label="Planned Qty" value={form.plannedQty} onChange={(v) => setForm({ ...form, plannedQty: v })} />
          <SelectField label="Priority" value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} options={[["High","High"],["Medium","Medium"],["Low","Low"]]} />
          <div className="flex items-end">
            <div className="t-label" style={{ color: "var(--muted)" }}>Route: <strong style={{ color: "var(--ink)" }}>{plant}</strong></div>
          </div>
        </div>

        {/* Validation note */}
        {selectedSO && form.plannedQty > selectedSO.pendingQty && (
          <div className="rounded-lg p-2 flex items-center gap-2" style={{ backgroundColor: "#a045450d", border: "1px solid #a0454533" }}>
            <AlertCircle size={14} style={{ color: "var(--semantic-error)" }} />
            <span className="t-body-sm" style={{ color: "var(--semantic-error)" }}>Planned qty exceeds remaining SO demand ({selectedSO.pendingQty}).</span>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={onCreated} className="t-body-sm h-9 px-4 rounded-lg">Cancel</Button>
        <Button onClick={submit} disabled={saving || !selectedSO} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
          {saving ? "Creating..." : "Create Work Order"}
        </Button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="t-label" style={{ color: "var(--muted)" }}>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }} />
    </div>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <Label className="t-label" style={{ color: "var(--muted)" }}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
        <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <Label className="t-label" style={{ color: "var(--muted)" }}>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 t-body-sm h-9 rounded-lg t-code" style={{ borderColor: "var(--hairline)" }} />
    </div>
  );
}

// ============================================================
// Inspection Module - smarter forms (user-aware)
// ============================================================
function InspectionModule({ plant, user, prefillStage, onPrefillConsumed }: { plant: string; user: User; prefillStage?: string | null; onPrefillConsumed?: () => void }) {
  const [records, setRecords] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [resultFilter, setResultFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  // When prefillStage is set (e.g. user clicked INSPECT on Process Flow),
  // auto-open the form. The InspectionForm receives this and pre-selects the stage.
  const [formPrefillStage, setFormPrefillStage] = useState<string | null>(null);

  // Watch for incoming prefill prop. When it arrives, open the form with that stage.
  // Also handle the "__OPEN_FORM__" sentinel which just opens the form without prefilling.
  useEffect(() => {
    if (prefillStage === "__OPEN_FORM__") {
      setShowForm(true);
      onPrefillConsumed?.();
    } else if (prefillStage && prefillStage !== "__OPEN_FORM__") {
      setFormPrefillStage(prefillStage);
      setShowForm(true);
      onPrefillConsumed?.();
    }
  }, [prefillStage, onPrefillConsumed]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ plant, limit: "80" });
    if (resultFilter !== "all") params.set("result", resultFilter);
    fetch(`/api/inspections?${params}`).then(r => r.json()).then(d => { setRecords(d.records || []); setLoading(false); });
  }, [plant, resultFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch("/api/process-routes?code=K2").then(r => r.json()).then(d => setStages(d.route?.stages || []));
    fetch(`/api/work-orders?plant=${plant}`).then(r => r.json()).then(d => setWorkOrders(d.workOrders || []));
  }, [plant]);

  // Filter records by user's assigned stages (for inspector/operator)
  const visibleRecords = useMemo(() => {
    const assigned = user.assignedStages || [];
    if (assigned.length === 0) return records;
    return records.filter(r => assigned.includes(r.stage?.stageCode));
  }, [records, user.assignedStages]);

  const columns: Column<any>[] = [
    { key: "record", header: "Record", sortable: true, sortValue: (r) => r.recordNo, render: (r) => <span className="t-code font-medium" style={{ color: "var(--ink)" }}>{r.recordNo}</span>, mobileLabel: "Record" },
    { key: "stage", header: "Stage", sortable: true, sortValue: (r) => r.stage?.name || "", render: (r) => (
      <div>
        <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.stage?.name}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{r.stage?.documentRef}</div>
      </div>
    ), mobileLabel: "Stage" },
    { key: "wo", header: "Work Order", render: (r) => (
      <div>
        <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.workOrder?.woNumber}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.customer}</div>
      </div>
    ), hideOnMobile: true },
    { key: "htu", header: "HTU", render: (r) => <span className="t-code">{r.htuNo}</span>, hideOnMobile: true },
    { key: "inspector", header: "Inspector", sortable: true, sortValue: (r) => r.inspector, render: (r) => <span className="t-body-sm">{r.inspector}</span>, hideOnMobile: true },
    { key: "ctq", header: "CTQ", render: (r) => r.ctqResult === "Fail" ? <StatusBadge status="Fail" size="xs" /> : r.ctqResult === "Pass" ? <span className="t-label" style={{ color: "var(--muted)" }}>OK</span> : "-", hideOnMobile: true },
    { key: "result", header: "Result", sortable: true, sortValue: (r) => r.overallResult, render: (r) => <ResultBadge result={r.overallResult} />, mobileLabel: "Result" },
    { key: "when", header: "When", sortable: true, sortValue: (r) => new Date(r.inspectedAt).getTime(), render: (r) => <span className="t-label">{fmtDateTime(r.inspectedAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Quality Execution"
        title="Digital Inspections"
        subtitle="Stage-wise inspection forms with CTQ acceptance criteria. Failures auto-create NCRs and hold work orders."
        info="This is where inspectors record pass/fail results at each production stage. Every form is tied to a HTU (Hi-Tech Unit) serial number. If a Critical-To-Quality (CTQ) check fails, an NCR is created automatically and the work order is put on hold."
        action={<Button onClick={() => setShowForm(true)} data-tooltip="Open new inspection form" data-tooltip-pos="left" className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}><Plus size={14} /> New Inspection</Button>}
      />
      <FilterBar count={visibleRecords.length}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-36 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="Pass">Pass</SelectItem>
            <SelectItem value="Fail">Fail</SelectItem>
            <SelectItem value="Hold">Hold</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {user.assignedStages && user.assignedStages.length > 0 && (
          <span className="t-label px-2 py-1 rounded-full" style={{ backgroundColor: "var(--surface-strong)", color: "var(--muted)" }}>
            Filtered to your stages: {user.assignedStages.join(", ")}
          </span>
        )}
      </FilterBar>
      <div className="p-4 md:p-8">
        {loading ? <LoadingBlock label="Loading inspections…" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={visibleRecords}
              onRowClick={setSelected}
              emptyMessage="No inspection records found."
              mobileCardRender={(r) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="t-code font-medium" style={{ color: "var(--ink)" }}>{r.recordNo}</span>
                    <ResultBadge result={r.overallResult} />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.stage?.name}</div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.woNumber} · HTU {r.htuNo}</div>
                  <div className="t-label" style={{ color: "var(--muted-soft)" }}>{fmtDateTime(r.inspectedAt)}</div>
                </div>
              )}
            />
          </div>
        )}
      </div>

      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="w-full md:w-[50vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          <InspectionForm stages={stages} workOrders={workOrders} user={user} prefillStageCode={formPrefillStage} onSubmitted={() => { setShowForm(false); setFormPrefillStage(null); load(); }} onCancel={() => { setShowForm(false); setFormPrefillStage(null); }} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <InspectionDetail record={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================================
// Enhanced Inspection Form
//  - Pre-fills inspector name from user
//  - Filters stages by user.assignedStages
//  - Shows document reference (SOP) at top
//  - Shows acceptance criteria next to each input
//  - Adds Measurement Value input for numeric characteristics
//  - Shows previous inspection results for same stage/HTU
//  - Adds Connected NCR field for reinspection
// ============================================================
function InspectionForm({ stages, workOrders, user, prefillStageCode, onSubmitted, onCancel }: {
  stages: any[]; workOrders: any[]; user: User; prefillStageCode?: string | null; onSubmitted: () => void; onCancel: () => void;
}) {
  const [woId, setWoId] = useState("");
  const [htuNo, setHtuNo] = useState("");
  const [htuAutoGenerated, setHtuAutoGenerated] = useState(false);
  const [shift, setShift] = useState(user.shiftPreference || "A");
  const [inspector, setInspector] = useState(user.name);
  const [operator, setOperator] = useState("");
  const [stage, setStage] = useState<any | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");
  const [connectedNcr, setConnectedNcr] = useState("");
  const [saving, setSaving] = useState(false);
  const [prevInspections, setPrevInspections] = useState<any[]>([]);
  const [availableNcrs, setAvailableNcrs] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [failedChars, setFailedChars] = useState<string[]>([]);
  const [showFailBanner, setShowFailBanner] = useState(false);
  const [disposition, setDisposition] = useState<"Rework" | "Scrap" | null>(null);
  const { toast } = useToast();

  // Auto-generate HTU number when work order is selected.
  // HTU = HTU-{WO last 4 digits}-{sequential number based on existing HTU count for this WO}
  useEffect(() => {
    if (woId && !htuAutoGenerated) {
      const wo = workOrders.find(w => w.id === woId);
      if (wo) {
        const woNum = wo.woNumber.replace(/[^0-9]/g, "").slice(-4);
        // Fetch the actual count of existing inspections for this WO to determine the next sequence
        fetch(`/api/inspections?wo=${woId}&limit=9999`)
          .then(r => r.json())
          .then(d => {
            const existingCount = (d.records || []).length;
            // Also check ProductGenealogy for existing HTUs for this WO
            const existingHtus = new Set<string>();
            (d.records || []).forEach((r: any) => { if (r.htuNo) existingHtus.add(r.htuNo); });
            const seq = String(existingHtus.size + 1).padStart(3, "0");
            const generatedHtu = `HTU-${woNum}-${seq}`;
            setHtuNo(generatedHtu);
            setHtuAutoGenerated(true);
          })
          .catch(() => {
            // Fallback: use a simple counter
            const seq = String(Math.floor(Math.random() * 900) + 100).padStart(3, "0");
            setHtuNo(`HTU-${woNum}-${seq}`);
            setHtuAutoGenerated(true);
          });
      }
    }
    if (!woId) {
      setHtuNo("");
      setHtuAutoGenerated(false);
    }
  }, [woId, workOrders, htuAutoGenerated]);

  // Fetch available users (operators and inspectors) for dropdowns
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => {
      const users = d.users || [];
      setAvailableUsers(users.filter((u: any) => u.status === "Active"));
    }).catch(() => {
      // Fallback: use seeded users
      setAvailableUsers([
        { name: "Ravi Kamble", role: "Operator", username: "ravi.kamble" },
        { name: "Suresh Bhalke", role: "Operator", username: "suresh.bhalke" },
        { name: "Mahesh Patil", role: "Operator", username: "mahesh.patil" },
        { name: "Sneha Patel", role: "QCInspector", username: "sneha.patel" },
        { name: "Rahul Desai", role: "QCInspector", username: "rahul.desai" },
        { name: "Kiran More", role: "QCInspector", username: "kiran.more" },
        { name: "Amit Shah", role: "QualityManager", username: "amit.shah" },
        { name: "Vikas Joshi", role: "ProductionSupervisor", username: "vikas.joshi" },
      ]);
    });
  }, []);

  // Filter stages by user's assigned stages
  const visibleStages = useMemo(() => {
    const assigned = user.assignedStages || [];
    if (assigned.length === 0) return stages;
    return stages.filter(s => assigned.includes(s.stageCode));
  }, [stages, user.assignedStages]);

  // When a prefill stage code arrives (from Process Flow INSPECT click),
  // auto-select that stage - but ONLY if the user is authorized for it.
  useEffect(() => {
    if (prefillStageCode && stages.length > 0 && !stage) {
      const found = stages.find(s => s.stageCode === prefillStageCode);
      if (!found) return;
      const assigned = user.assignedStages || [];
      const isAuthorized = assigned.length === 0 || assigned.includes(prefillStageCode);
      if (isAuthorized) {
        setStage(found);
      } else {
        toast({
          title: "Access restricted",
          description: `You are not assigned to stage ${prefillStageCode}. Your assigned stages: ${assigned.join(", ") || "none"}`,
          variant: "destructive",
        });
      }
    }
  }, [prefillStageCode, stages, stage, user.assignedStages, toast]);

  // When WO + stage selected, fetch previous inspections + open NCRs for connection
  useEffect(() => {
    if (!woId || !stage) { setPrevInspections([]); setAvailableNcrs([]); return; }
    fetch(`/api/inspections?wo=${woId}&stage=${stage.id}&limit=5`).then(r => r.json()).then(d => setPrevInspections(d.records || []));
    fetch(`/api/ncrs?status=all`).then(r => r.json()).then(d => {
      const wo = workOrders.find(w => w.id === woId);
      setAvailableNcrs((d.ncrs || []).filter((n: any) => n.workOrder?.woNumber === wo?.woNumber && n.status !== "Closed"));
    });
  }, [woId, stage, workOrders]);

  // Check for failed characteristics and update the fail banner
  useEffect(() => {
    const failed: string[] = [];
    for (const [charId, m] of Object.entries(measurements)) {
      if ((m as any).pass === false) {
        failed.push((m as any).name || charId);
      }
    }
    setFailedChars(failed);
    setShowFailBanner(failed.length > 0);
  }, [measurements]);

  const setM = (charId: string, value: any, pass: boolean, ctq: boolean, name: string) => {
    setMeasurements({ ...measurements, [charId]: { value, pass, ctq, name } });
  };

  // Check if any measurement is marked as failed - if so, the product goes to rework
  const hasFailedMeasurement = failedChars.length > 0;
  const hasFailedCTQ = Object.values(measurements).some((m: any) => m.pass === false && m.ctq === true);

  const submit = async () => {
    if (!woId || !stage) { toast({ title: "Work order and stage required", variant: "destructive" }); return; }
    if (hasFailedMeasurement && !disposition) {
      toast({
        title: "Disposition required",
        description: "One or more characteristics failed. Select Rework or Scrap before submitting.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workOrderId: woId, stageId: stage.id, htuNo, shift, inspector, operator, measurements, notes, connectedNcr, disposition }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.record.overallResult === "Fail") {
        const rwoInfo = data.rwoNumber ? ` · Rework Job ${data.rwoNumber} created` : "";
        toast({
          title: `Inspection FAILED - ${disposition === "Scrap" ? "Scrap" : "Rework"} job created${rwoInfo}`,
          description: `${data.record.recordNo} · ${stage.name}. Failed: ${failedChars.join(", ")}. ${disposition === "Scrap" ? "Product flagged for scrap." : "Product sent to rework - responsible person will be notified."} NCR auto-created. Work order on hold.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inspection PASSED",
          description: `${data.record.recordNo} · ${stage.name} · HTU ${htuNo}`,
        });
      }
      onSubmitted();
    } else { toast({ title: "Submission failed", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>Digital Inspection Form</SheetTitle>
        <SheetDescription className="t-body-sm" style={{ color: "var(--muted)" }}>
          {user.assignedStages && user.assignedStages.length > 0
            ? `Your stages: ${user.assignedStages.join(", ")} - CTQ failures auto-create NCR`
            : "Select stage, fill characteristics. CTQ failures auto-create NCR."}
        </SheetDescription>
      </SheetHeader>

      <div className="p-6 space-y-4">
        {/* FAIL BANNER - shown when any test fails, with disposition selector */}
        {showFailBanner && (
          <div className="rounded-lg p-4" style={{ backgroundColor: "var(--canvas-soft)", border: "2px solid var(--semantic-error)" }}>
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={20} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
              <div className="flex-1">
                <div className="t-body-sm font-semibold" style={{ color: "var(--semantic-error)" }}>
                  TEST FAILED - Disposition required
                </div>
                <div className="t-body-sm mt-1" style={{ color: "var(--body)" }}>
                  {failedChars.length} characteristic(s) failed: {failedChars.join(", ")}
                </div>
                <div className="t-body-sm mt-1" style={{ color: "var(--muted)" }}>
                  This product will NOT proceed to the next process. Choose a disposition below - a linked rework/scrap job will be created and the responsible person will take over.
                </div>
              </div>
            </div>
            {/* Disposition selector */}
            <div className="grid grid-cols-2 gap-2 ml-8">
              <button
                type="button"
                onClick={() => setDisposition("Rework")}
                className="flex items-center gap-2 p-3 rounded-md transition-all"
                style={{
                  border: disposition === "Rework" ? "2px solid var(--primary)" : "1px solid var(--hairline)",
                  backgroundColor: disposition === "Rework" ? "#0832600d" : "var(--surface-card)",
                }}
              >
                <Repeat size={16} style={{ color: disposition === "Rework" ? "var(--primary)" : "var(--muted)" }} />
                <div className="text-left">
                  <div className="t-body-sm font-medium" style={{ color: disposition === "Rework" ? "var(--primary)" : "var(--ink)" }}>Rework</div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Send to rework area</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDisposition("Scrap")}
                className="flex items-center gap-2 p-3 rounded-md transition-all"
                style={{
                  border: disposition === "Scrap" ? "2px solid var(--semantic-error)" : "1px solid var(--hairline)",
                  backgroundColor: disposition === "Scrap" ? "#a045450d" : "var(--surface-card)",
                }}
              >
                <Ban size={16} style={{ color: disposition === "Scrap" ? "var(--semantic-error)" : "var(--muted)" }} />
                <div className="text-left">
                  <div className="t-body-sm font-medium" style={{ color: disposition === "Scrap" ? "var(--semantic-error)" : "var(--ink)" }}>Scrap</div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Flag for scrap disposal</div>
                </div>
              </button>
            </div>
            {disposition && (
              <div className="ml-8 mt-2 t-label" style={{ color: "var(--primary)" }}>
                ✓ {disposition === "Rework" ? "Rework" : "Scrap"} job will be created and linked to this inspection. You can submit now.
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="t-label" style={{ color: "var(--muted)" }}>Work Order *</Label>
            <Select value={woId} onValueChange={(v) => { setWoId(v); setStage(null); setMeasurements({}); }}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="Select work order" /></SelectTrigger>
              <SelectContent>{workOrders.map((w) => <SelectItem key={w.id} value={w.id}>{w.woNumber} · {w.customer} · {w.size}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* HTU No - auto-generated, read-only with indicator */}
          <div>
            <Label className="t-label flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
              HTU No
              <span className="text-xs px-1.5 py-0 rounded" style={{ backgroundColor: "var(--semantic-success)14", color: "var(--semantic-success)", fontSize: 8 }}>AUTO</span>
            </Label>
            <input
              value={htuNo || "Auto-generated on WO selection"}
              readOnly
              placeholder="Select work order to generate"
              className="w-full mt-1 h-9 px-3 rounded-lg t-body-sm t-code outline-none"
              style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)", color: htuNo ? "var(--primary)" : "var(--muted-soft)", fontWeight: 500 }}
            />
          </div>

          <SelectField label="Shift" value={shift} onChange={setShift} options={[["A","A"],["B","B"],["General","General"]]} />

          {/* Inspector - dropdown of available QC inspectors + managers */}
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Inspector</Label>
            <Select value={inspector} onValueChange={setInspector}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="Select inspector" /></SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter((u: any) => ["QCInspector", "QualityManager", "AssistantManager", "ProcessEngineer", "Admin"].includes(u.role))
                  .map((u: any) => (
                    <SelectItem key={u.username || u.name} value={u.name}>
                      {u.name} · {u.role}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator - dropdown of available operators + supervisors */}
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="Select operator" /></SelectTrigger>
              <SelectContent>
                {availableUsers
                  .filter((u: any) => ["Operator", "ProductionSupervisor"].includes(u.role))
                  .map((u: any) => (
                    <SelectItem key={u.username || u.name} value={u.name}>
                      {u.name} · {u.shiftPreference || "A"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {!stage ? (
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Select Stage</Label>
            {visibleStages.length === 0 ? (
              <EmptyState message="No stages available for your account." hint="Contact your supervisor to get stage assignments." />
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto scroll-fine">
                {visibleStages.map((s) => (
                  <button key={s.id} onClick={() => setStage(s)} className="text-left p-2.5 rounded-lg transition-colors hover:bg-[var(--canvas-soft)]" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                    <div className="flex items-center gap-1">
                      <span className="t-label" style={{ color: "var(--muted)" }}>{s.stageCode}</span>
                      {s.isCTQ && <span className="t-label px-1 py-0 rounded-full" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>CTQ</span>}
                      {s.isGate && <span className="t-label px-1 py-0 rounded-full" style={{ backgroundColor: "var(--ink)", color: "var(--canvas)" }}>GATE</span>}
                    </div>
                    <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>{s.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{s.documentRef}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Document reference banner */}
            <div className="rounded-lg p-3 mb-3 flex items-center gap-3" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              <FileText size={16} />
              <div className="flex-1">
                <div className="t-label" style={{ opacity: 0.8 }}>SOP / DOCUMENT REFERENCE</div>
                <div className="t-body-sm font-medium">{stage.documentRef || "-"} · {stage.name}</div>
              </div>
              <div className="text-right">
                <div className="t-label" style={{ opacity: 0.8 }}>TIMING</div>
                <div className="t-body-sm">{stage.timing || "-"}</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="t-display-sm" style={{ color: "var(--ink)" }}>{stage.name}</div>
                <div className="t-label" style={{ color: "var(--muted)" }}>{stage.stageCode} · {stage.responsibleRole || "-"}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setStage(null); setMeasurements({}); }} className="t-body-sm h-7 rounded-lg">Change</Button>
            </div>

            {/* Previous inspections for this stage+WO */}
            {prevInspections.length > 0 && (
              <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                <div className="t-label mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                  <Clock size={11} /> PREVIOUS INSPECTIONS · SAME STAGE & WO
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto scroll-fine">
                  {prevInspections.map((p) => (
                    <div key={p.id} className="flex items-center justify-between t-body-sm">
                      <div>
                        <span className="t-code" style={{ color: "var(--ink)" }}>{p.recordNo}</span>
                        <span style={{ color: "var(--muted)" }}> · HTU {p.htuNo || "-"} · {p.inspector} · {fmtDate(p.inspectedAt)}</span>
                      </div>
                      <ResultBadge result={p.overallResult} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected NCR (for reinspection) */}
            {availableNcrs.length > 0 && (
              <div className="mb-3">
                <Label className="t-label" style={{ color: "var(--muted)" }}>Connected NCR (if reinspection)</Label>
                <Select value={connectedNcr} onValueChange={setConnectedNcr}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="None - initial inspection" /></SelectTrigger>
                  <SelectContent>
                    {availableNcrs.map((n) => (
                      <SelectItem key={n.id} value={n.id}>{n.ncrNumber} · {n.defectCategory} · {n.severity}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Characteristics with acceptance criteria + measurement input */}
            {stage.characteristics?.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto scroll-fine">
                {stage.characteristics.map((c: any) => {
                  const m = measurements[c.id];
                  return (
                    <div key={c.id} className="rounded-lg p-3" style={{ border: `1px solid ${m && !m.pass ? "var(--semantic-error)" : "var(--hairline)"}`, backgroundColor: "var(--canvas-soft)" }}>
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="t-label" style={{ color: "var(--muted)" }}>{c.seq}</span>
                            <span className="t-body-sm" style={{ color: "var(--ink)" }}>{c.name}</span>
                            {c.isCTQ && <span className="t-label px-1 py-0 rounded-full" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>CTQ</span>}
                            {c.charType && <span className="t-label px-1 py-0 rounded-full" style={{ backgroundColor: "var(--surface-strong)", color: "var(--muted)" }}>{c.charType}</span>}
                          </div>
                        </div>
                        {/* Acceptance criteria next to input */}
                        <div className="shrink-0 text-right">
                          <div className="t-label" style={{ color: "var(--muted)" }}>ACCEPTANCE CRITERIA</div>
                          <div className="t-code t-body-sm" style={{ color: "var(--ink)" }}>
                            {c.specification || (c.nominalValue !== null && c.nominalValue !== undefined ? `Nominal ${c.nominalValue}${c.unit ? ` ${c.unit}` : ""}` : "-")}
                            {(c.upperLimit !== null && c.upperLimit !== undefined) && ` · ≤ ${c.upperLimit}`}
                            {(c.lowerLimit !== null && c.lowerLimit !== undefined) && ` · ≥ ${c.lowerLimit}`}
                            {c.unit && !c.specification && ` (${c.unit})`}
                          </div>
                          {c.method && <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>Method: {c.method}</div>}
                        </div>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        <button onClick={() => setM(c.id, "OK", true, c.isCTQ, c.name)} className="px-2.5 py-1 rounded-lg t-body-sm transition-colors flex items-center gap-1" style={{ backgroundColor: m?.pass === true ? "var(--semantic-success)" : "var(--surface-card)", color: m?.pass === true ? "white" : "var(--muted)", border: `1px solid ${m?.pass === true ? "var(--semantic-success)" : "var(--hairline)"}` }}><CheckCircle2 size={11} /> Pass</button>
                        <button onClick={() => setM(c.id, "Fail", false, c.isCTQ, c.name)} className="px-2.5 py-1 rounded-lg t-body-sm transition-colors flex items-center gap-1" style={{ backgroundColor: m?.pass === false ? "var(--semantic-error)" : "var(--surface-card)", color: m?.pass === false ? "white" : "var(--muted)", border: `1px solid ${m?.pass === false ? "var(--semantic-error)" : "var(--hairline)"}` }}><XCircle size={11} /> Fail</button>
                        {/* Measurement value input (numeric) */}
                        <Input
                          type="number"
                          placeholder="Measured value"
                          className="flex-1 t-body-sm t-code h-8 rounded-lg"
                          style={{ borderColor: "var(--hairline)" }}
                          value={m?.value && m.value !== "OK" && m.value !== "Fail" ? m.value : ""}
                          onChange={(e) => setM(c.id, e.target.value, m?.pass ?? true, c.isCTQ, c.name)}
                        />
                        {c.unit && <span className="t-label shrink-0" style={{ color: "var(--muted)" }}>{c.unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState message="No characteristics defined." />}
            <div className="mt-3">
              <Label className="t-label" style={{ color: "var(--muted)" }}>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} />
            </div>
          </div>
        )}
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={onCancel} className="t-body-sm h-9 px-4 rounded-lg">Cancel</Button>
        <Button
          onClick={submit}
          disabled={saving || !stage || !woId}
          className="t-body-sm h-9 px-4 rounded-lg flex items-center gap-2"
          style={{
            backgroundColor: hasFailedMeasurement ? "#dc2626" : "var(--primary)",
            color: "var(--on-primary)",
          }}
        >
          {saving ? "Submitting..." : hasFailedMeasurement ? "Submit Failed - Send to Rework" : "Submit Inspection"}
        </Button>
      </div>
    </div>
  );
}

function InspectionDetail({ record }: { record: any }) {
  const measurements = useMemo(() => {
    try { return typeof record.measurements === "string" ? JSON.parse(record.measurements) : record.measurements || {}; }
    catch { return {}; }
  }, [record]);

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <SheetTitle className="t-display-sm t-code" style={{ color: "var(--ink)" }}>{record.recordNo}</SheetTitle>
          <ResultBadge result={record.overallResult} />
        </div>
        <SheetDescription className="t-body-md" style={{ color: "var(--muted)" }}>
          {record.stage?.name} · {record.workOrder?.woNumber} · HTU {record.htuNo}
        </SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="Inspector" value={record.inspector} />
          <DetailRow label="Operator" value={record.operator} />
          <DetailRow label="Shift" value={record.shift} />
          <DetailRow label="Inspected At" value={fmtDateTime(record.inspectedAt)} />
          <DetailRow label="CTQ Result" value={record.ctqResult} />
          <DetailRow label="Document Ref" value={record.stage?.documentRef} mono />
        </div>

        {Object.keys(measurements).length > 0 && (
          <div>
            <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Characteristics ({Object.keys(measurements).length})</div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto scroll-fine">
              {Object.entries(measurements).map(([id, m]: any) => (
                <div key={id} className="flex items-center justify-between rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="min-w-0">
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{m.name}</div>
                    <div className="t-label t-code" style={{ color: "var(--muted)" }}>Value: {String(m.value)}</div>
                  </div>
                  {m.pass ? <CheckCircle2 size={14} style={{ color: "var(--semantic-success)" }} /> : <XCircle size={14} style={{ color: "var(--semantic-error)" }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {record.notes && (
          <div>
            <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Notes</div>
            <div className="t-body-sm rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--ink)" }}>{record.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// NCR Module
// ============================================================
function NcrModule({ plant, user }: { plant: string; user: User }) {
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ plant });
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (severityFilter !== "all") params.set("severity", severityFilter);
    fetch(`/api/ncrs?${params}`).then(r => r.json()).then(d => { setNcrs(d.ncrs || []); setLoading(false); });
  }, [plant, statusFilter, severityFilter]);

  useEffect(() => { load(); }, [load]);

  // Operators only see their own NCRs (raised on their stages)
  const visibleNcrs = useMemo(() => {
    if (user.role !== "Operator") return ncrs;
    const assigned = user.assignedStages || [];
    if (assigned.length === 0) return [];
    return ncrs.filter(n => {
      const stageCode = K2_STAGES.find(s => s.name === n.stageName)?.code;
      return stageCode && assigned.includes(stageCode);
    });
  }, [ncrs, user]);

  const stats = useMemo(() => ({
    open: visibleNcrs.filter(n => n.status !== "Closed").length,
    critical: visibleNcrs.filter(n => n.severity === "Critical").length,
    capaOpen: visibleNcrs.filter(n => n.status === "CAPA-Open").length,
    closed: visibleNcrs.filter(n => n.status === "Closed").length,
  }), [visibleNcrs]);

  const columns: Column<any>[] = [
    { key: "ncr", header: "NCR", sortable: true, sortValue: (n) => n.ncrNumber, render: (n) => <span className="t-body-sm font-medium">{n.ncrNumber}</span>, mobileLabel: "NCR" },
    { key: "defect", header: "Defect", render: (n) => (
      <div>
        <div className="t-body-sm" style={{ color: "var(--ink)" }}>{n.defectCategory}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{n.workOrder?.woNumber} · {n.htuno}</div>
      </div>
    ), mobileLabel: "Defect" },
    { key: "customer", header: "Customer", sortable: true, sortValue: (n) => n.workOrder?.customer || "", render: (n) => <span className="t-body-sm">{n.workOrder?.customer}</span>, hideOnMobile: true },
    { key: "stage", header: "Stage", render: (n) => <span className="t-body-sm">{n.stageName}</span>, hideOnMobile: true },
    { key: "severity", header: "Severity", sortable: true, sortValue: (n) => n.severity, render: (n) => <StatusBadge status={n.severity} size="xs" />, mobileLabel: "Severity" },
    { key: "status", header: "Status", sortable: true, sortValue: (n) => n.status, render: (n) => <StatusBadge status={n.status} size="xs" />, hideOnMobile: true },
    { key: "date", header: "Date", sortable: true, sortValue: (n) => new Date(n.createdAt).getTime(), render: (n) => <span className="t-label">{fmtDate(n.createdAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Risk & Quality" title="Nonconformance & CAPA" subtitle="Containment, root cause, corrective action and effectiveness verification." info="An NCR (Nonconformance Report) is raised when a part or process fails to meet specification. This module tracks each NCR through containment, root-cause analysis, corrective action (CAPA), and effectiveness verification." />
      <div className="p-4 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Open" value={stats.open} tone="neutral" icon={<AlertCircle size={14} />} />
          <StatCard label="Critical" value={stats.critical} tone="risk" icon={<XCircle size={14} />} />
          <StatCard label="CAPA Open" value={stats.capaOpen} tone="warn" icon={<Clock size={14} />} />
          <StatCard label="Closed" value={stats.closed} tone="ok" icon={<CheckCircle2 size={14} />} />
        </div>
        <FilterBar count={visibleNcrs.length}>
          <Filter size={13} style={{ color: "var(--muted)" }} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Contained">Contained</SelectItem>
              <SelectItem value="Investigating">Investigating</SelectItem>
              <SelectItem value="CAPA-Open">CAPA-Open</SelectItem>
              <SelectItem value="Effectiveness-Check">Effectiveness-Check</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-32 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severity</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="Major">Major</SelectItem>
              <SelectItem value="Minor">Minor</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>
        {loading ? <LoadingBlock label="Loading NCRs…" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={visibleNcrs}
              onRowClick={setSelected}
              emptyMessage="No NCRs match the filters."
              mobileCardRender={(n) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{n.ncrNumber}</span>
                    <StatusBadge status={n.severity} size="xs" />
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{n.defectCategory}</div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>{n.workOrder?.woNumber} · {n.htuno}</div>
                  <div className="t-label" style={{ color: "var(--muted-soft)" }}>{n.stageName} · {fmtDate(n.createdAt)}</div>
                </div>
              )}
            />
          </div>
        )}
      </div>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[55vw] md:max-w-[900px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <NcrDetail ncr={selected} onUpdated={() => { load(); setSelected(null); }} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NcrDetail({ ncr, onUpdated }: { ncr: any; onUpdated: () => void }) {
  const [status, setStatus] = useState(ncr.status);
  const [rootCause, setRootCause] = useState(ncr.rootCause || "");
  const [correctiveAction, setCorrectiveAction] = useState(ncr.correctiveAction || "");
  const [containment, setContainment] = useState(ncr.containment || "");
  const [capaOwner, setCapaOwner] = useState(ncr.capaOwner || "");
  const [why1, setWhy1] = useState("");
  const [why2, setWhy2] = useState("");
  const [why3, setWhy3] = useState("");
  const [why4, setWhy4] = useState("");
  const [why5, setWhy5] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async (effectiveness = false) => {
    setSaving(true);
    const body: any = { id: ncr.id, status, rootCause, correctiveAction, containment, capaOwner };
    if (effectiveness) body.effectivenessVerified = true;
    const res = await fetch("/api/ncrs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { toast({ title: "NCR updated", description: `${ncr.ncrNumber} -> ${effectiveness ? "Closed" : status}` }); onUpdated(); } else { toast({ title: "Update failed", variant: "destructive" }); }
    setSaving(false);
  };

  // CAPA lifecycle stages
  const lifecycleStages = ["Open", "Contained", "Investigating", "CAPA-Open", "Effectiveness-Check", "Closed"];
  const currentStageIndex = lifecycleStages.indexOf(ncr.status);

  // Containment checklist
  const containmentActions = [
    { label: "Quarantine affected units", done: ncr.status !== "Open" },
    { label: "Segregate nonconforming product", done: ncr.status !== "Open" },
    { label: "Notify production & QA head", done: ncr.status !== "Open" },
    { label: "Identify scope of impact", done: ncr.status === "Contained" || ncr.status === "Investigating" || ncr.status === "CAPA-Open" || ncr.status === "Effectiveness-Check" || ncr.status === "Closed" },
    { label: "Investigation started", done: ncr.status === "Investigating" || ncr.status === "CAPA-Open" || ncr.status === "Effectiveness-Check" || ncr.status === "Closed" },
    { label: "Root cause identified", done: (ncr.rootCause && ncr.rootCause.length > 10) || ncr.status === "CAPA-Open" || ncr.status === "Effectiveness-Check" || ncr.status === "Closed" },
    { label: "Corrective action implemented", done: (ncr.correctiveAction && ncr.correctiveAction.length > 10) || ncr.status === "Effectiveness-Check" || ncr.status === "Closed" },
    { label: "Effectiveness verified", done: ncr.status === "Closed" },
  ];

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{ncr.ncrNumber}</SheetTitle>
          <StatusBadge status={ncr.severity} size="xs" />
          <StatusBadge status={ncr.status} size="xs" />
        </div>
        <SheetDescription className="t-body-md" style={{ color: "var(--muted)" }}>
          {ncr.workOrder?.woNumber} - {ncr.workOrder?.customer} - {ncr.stageName} - HTU {ncr.htuno}
        </SheetDescription>
      </SheetHeader>

      <div className="p-6 space-y-4">
        {/* CAPA Lifecycle Timeline */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>CAPA LIFECYCLE</div>
          <div className="flex items-center gap-1">
            {lifecycleStages.map((stage, i) => (
              <div key={stage} className="flex items-center gap-1 flex-1">
                <div
                  className="flex-1 h-8 rounded-lg flex items-center justify-center t-label"
                  style={{
                    backgroundColor: i <= currentStageIndex
                      ? (stage === "Closed" ? "var(--semantic-success)" + "14" : i === currentStageIndex ? "var(--primary)" + "14" : "var(--semantic-success)" + "0a")
                      : "var(--canvas-soft)",
                    color: i <= currentStageIndex
                      ? (stage === "Closed" ? "var(--semantic-success)" : i === currentStageIndex ? "var(--primary)" : "var(--semantic-success)")
                      : "var(--muted)",
                    border: i === currentStageIndex ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                    fontWeight: i === currentStageIndex ? 600 : 400,
                  }}
                >
                  {i < currentStageIndex && <CheckCircle2 size={10} className="mr-1" />}
                  {stage}
                </div>
                {i < lifecycleStages.length - 1 && (
                  <ChevronRight size={12} style={{ color: i < currentStageIndex ? "var(--semantic-success)" : "var(--hairline-strong)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Defect Description */}
        <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)", borderLeft: `3px solid ${ncr.severity === "Critical" ? "var(--semantic-error)" : ncr.severity === "Major" ? "var(--primary)" : "var(--muted)"}` }}>
          <div className="t-label mb-1" style={{ color: "var(--muted)" }}>DEFECT DESCRIPTION</div>
          <div className="t-body-sm" style={{ color: "var(--ink)" }}>{ncr.description}</div>
          <div className="t-label mt-2" style={{ color: "var(--muted-soft)" }}>Created: {fmtDate(ncr.createdAt)} - Category: {ncr.defectCategory}</div>
        </div>

        {/* Containment Checklist */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>CONTAINMENT CHECKLIST</div>
          <div className="space-y-1">
            {containmentActions.map((action, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: action.done ? "var(--semantic-success)" + "08" : "var(--canvas-soft)" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: action.done ? "var(--semantic-success)" + "14" : "var(--hairline)" }}>
                  {action.done ? <CheckCircle2 size={12} style={{ color: "var(--semantic-success)" }} /> : <Clock size={12} style={{ color: "var(--muted)" }} />}
                </div>
                <span className="t-body-sm" style={{ color: action.done ? "var(--ink)" : "var(--muted)", textDecoration: action.done ? "none" : "none" }}>{action.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editable Fields */}
        <div><Label className="t-label" style={{ color: "var(--muted)" }}>Containment Action</Label><Textarea value={containment} onChange={(e) => setContainment(e.target.value)} rows={2} className="mt-1 t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} placeholder="Describe immediate containment actions taken..." /></div>

        {/* 5 Whys Investigation */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>5 WHYS INVESTIGATION</div>
          <div className="space-y-2">
            {[
              { label: "Why 1: Why did the problem occur?", value: why1, set: setWhy1 },
              { label: "Why 2: Why did that happen?", value: why2, set: setWhy2 },
              { label: "Why 3: Why did that underlying cause exist?", value: why3, set: setWhy3 },
              { label: "Why 4: Why was that condition present?", value: why4, set: setWhy4 },
              { label: "Why 5: Why is the root cause allowed to persist?", value: why5, set: setWhy5 },
            ].map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 mt-1 t-label" style={{ backgroundColor: "var(--primary)" + "14", color: "var(--primary)" }}>{i + 1}</div>
                <div className="flex-1">
                  <div className="t-label mb-1" style={{ color: "var(--muted)" }}>{w.label}</div>
                  <Textarea value={w.value} onChange={(e) => w.set(e.target.value)} rows={1} className="t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} placeholder="Enter answer..." />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div><Label className="t-label" style={{ color: "var(--muted)" }}>Root Cause Summary</Label><Textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} rows={2} className="mt-1 t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} placeholder="Summarize the verified root cause..." /></div>
        <div><Label className="t-label" style={{ color: "var(--muted)" }}>Corrective Action</Label><Textarea value={correctiveAction} onChange={(e) => setCorrectiveAction(e.target.value)} rows={2} className="mt-1 t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} placeholder="Describe the corrective action taken..." /></div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="CAPA Owner" value={capaOwner} onChange={setCapaOwner} />
          <SelectField label="Status" value={status} onChange={setStatus} options={[["Open","Open"],["Contained","Contained"],["Investigating","Investigating"],["CAPA-Open","CAPA-Open"],["Effectiveness-Check","Effectiveness-Check"]]} />
        </div>

        {/* Linked Records */}
        <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>LINKED RECORDS</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--surface-card)" }}>
              <FileText size={14} style={{ color: "var(--muted)" }} />
              <div>
                <div className="t-label" style={{ color: "var(--muted)" }}>Work Order</div>
                <div className="t-body-sm t-code" style={{ color: "var(--ink)" }}>{ncr.workOrder?.woNumber || "N/A"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--surface-card)" }}>
              <ClipboardCheck size={14} style={{ color: "var(--muted)" }} />
              <div>
                <div className="t-label" style={{ color: "var(--muted)" }}>Inspection</div>
                <div className="t-body-sm t-code" style={{ color: "var(--ink)" }}>{ncr.inspectionId || "Auto-generated"}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--surface-card)" }}>
              <Factory size={14} style={{ color: "var(--muted)" }} />
              <div>
                <div className="t-label" style={{ color: "var(--muted)" }}>Stage</div>
                <div className="t-body-sm" style={{ color: "var(--ink)" }}>{ncr.stageName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "var(--surface-card)" }}>
              <CalendarDays size={14} style={{ color: "var(--muted)" }} />
              <div>
                <div className="t-label" style={{ color: "var(--muted)" }}>Created</div>
                <div className="t-body-sm" style={{ color: "var(--ink)" }}>{fmtDate(ncr.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={onUpdated} className="t-body-sm h-9 px-4 rounded-lg">Close</Button>
        <Button onClick={() => save(false)} disabled={saving} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>{saving ? "Saving..." : "Save"}</Button>
        {status === "Effectiveness-Check" && <Button onClick={() => save(true)} disabled={saving} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--semantic-success)", color: "white" }}>Verify & Close</Button>}
      </div>
    </div>
  );
}

// ============================================================
// FMEA Module
// ============================================================
function FmeaModule() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { fetch("/api/fmea").then(r => r.json()).then(d => { setRecords(d.records || []); setLoading(false); }); }, []);

  const columns: Column<any>[] = [
    { key: "id", header: "FMEA ID", sortable: true, sortValue: (r) => r.fmeaId, render: (r) => <span className="t-body-sm font-medium">{r.fmeaId}</span>, mobileLabel: "ID" },
    { key: "stage", header: "Stage", sortable: true, sortValue: (r) => r.stageName, render: (r) => <span className="t-body-sm">{r.stageName}</span>, hideOnMobile: true },
    { key: "mode", header: "Failure Mode", render: (r) => <span className="t-body-sm">{r.failureMode}</span>, mobileLabel: "Failure Mode" },
    { key: "s", header: "S", sortable: true, sortValue: (r) => r.severity, render: (r) => <span className="t-code" style={{ color: r.severity >= 9 ? "var(--semantic-error)" : "var(--ink)" }}>{r.severity}</span>, hideOnMobile: true },
    { key: "o", header: "O", sortable: true, sortValue: (r) => r.occurrence, render: (r) => <span className="t-code">{r.occurrence}</span>, hideOnMobile: true },
    { key: "d", header: "D", sortable: true, sortValue: (r) => r.detection, render: (r) => <span className="t-code">{r.detection}</span>, hideOnMobile: true },
    { key: "rpn", header: "RPN", sortable: true, sortValue: (r) => r.rpn, render: (r) => <span className="t-code font-medium" style={{ color: r.rpn >= 100 ? "var(--semantic-error)" : r.rpn >= 50 ? "#8a6835" : "var(--semantic-success)" }}>{r.rpn}</span>, mobileLabel: "RPN" },
    { key: "status", header: "Status", sortable: true, sortValue: (r) => r.status, render: (r) => <StatusBadge status={r.status} size="xs" />, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Risk Intelligence" title="FMEA & Risk Register" subtitle="RPN = Severity × Occurrence × Detection. Critical-severity items escalate independently of RPN." info="FMEA (Failure Mode and Effects Analysis) is a proactive risk tool. For each process step, you list what could go wrong, how bad it would be (Severity), how often it might happen (Occurrence), and how likely you are to catch it before it leaves (Detection). The product of the three is the RPN - higher means more risk." />
      <div className="p-4 md:p-8 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Items" value={records.length} tone="neutral" />
          <StatCard label="RPN ≥ 100" value={records.filter(r => r.rpn >= 100).length} tone="risk" />
          <StatCard label="Severity ≥ 9" value={records.filter(r => r.severity >= 9).length} tone="risk" />
          <StatCard label="Action Verified" value={records.filter(r => r.status === "Action-Verified").length} tone="ok" />
        </div>
        {loading ? <LoadingBlock label="Loading FMEA…" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={records}
              onRowClick={setSelected}
              defaultSort={{ key: "rpn", dir: "desc" }}
              emptyMessage="No FMEA records."
              mobileCardRender={(r) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.fmeaId}</span>
                    <span className="t-code font-medium" style={{ color: r.rpn >= 100 ? "var(--semantic-error)" : r.rpn >= 50 ? "#8a6835" : "var(--semantic-success)" }}>RPN {r.rpn}</span>
                  </div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{r.failureMode}</div>
                  <div className="t-label" style={{ color: "var(--muted)" }}>{r.stageName} · S{r.severity}×O{r.occurrence}×D{r.detection}</div>
                </div>
              )}
            />
          </div>
        )}
      </div>
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <FmeaDetail record={selected} onUpdated={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FmeaDetail({ record, onUpdated }: { record: any; onUpdated: () => void }) {
  const [severity, setSeverity] = useState(record.severity);
  const [occurrence, setOccurrence] = useState(record.occurrence);
  const [detection, setDetection] = useState(record.detection);
  const [recommendedAction, setRecommendedAction] = useState(record.recommendedAction || "");
  const [actionOwner, setActionOwner] = useState(record.actionOwner || "");
  const [status, setStatus] = useState(record.status);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const rpn = severity * occurrence * detection;

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/fmea", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: record.id, severity, occurrence, detection, recommendedAction, actionOwner, status }) });
    if (res.ok) { toast({ title: "FMEA updated", description: `RPN now ${rpn}` }); onUpdated(); } else { toast({ title: "Update failed", variant: "destructive" }); }
    setSaving(false);
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{record.fmeaId}</SheetTitle>
          <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: rpn >= 100 ? "var(--semantic-error)" + "14" : rpn >= 50 ? "#8a683514" : "var(--semantic-success)" + "14", color: rpn >= 100 ? "var(--semantic-error)" : rpn >= 50 ? "#8a6835" : "var(--semantic-success)" }}>RPN {rpn}</span>
        </div>
        <SheetDescription className="t-body-md" style={{ color: "var(--muted)" }}>{record.stageName} - {record.failureMode}</SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-4">
        {/* Risk Matrix Visualization */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>RISK MATRIX (Severity x Occurrence)</div>
          <div className="grid grid-cols-11 gap-0.5 items-center">
            <div className="col-span-1 t-label text-center" style={{ color: "var(--muted-soft)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>Occur</div>
            <div className="col-span-10 grid grid-cols-10 gap-0.5">
              {[...Array(10)].map((_, row) => {
                const occ = 10 - row;
                return (
                  <div key={row} className="contents">
                    {[...Array(10)].map((_, col) => {
                      const sev = col + 1;
                      const cellRpn = sev * occ;
                      const isCurrent = sev === severity && occ === occurrence;
                      const bgColor = cellRpn >= 100 ? "var(--semantic-error)" + "20" : cellRpn >= 50 ? "#8a683520" : cellRpn >= 20 ? "var(--semantic-success)" + "15" : "var(--canvas-soft)";
                      return (
                        <div
                          key={col}
                          className="aspect-square rounded-sm flex items-center justify-center"
                          style={{
                            backgroundColor: bgColor,
                            border: isCurrent ? "2px solid var(--primary)" : "1px solid var(--hairline-soft)",
                          }}
                        >
                          {isCurrent && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <div className="col-span-1" />
            <div className="col-span-10 t-label text-center mt-1" style={{ color: "var(--muted-soft)" }}>{"Severity ->"}</div>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--semantic-success)" + "15" }} /><span className="t-label" style={{ color: "var(--muted)" }}>Low (RPN &lt; 20)</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "#8a683520" }} /><span className="t-label" style={{ color: "var(--muted)" }}>Medium (50-99)</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "var(--semantic-error)" + "20" }} /><span className="t-label" style={{ color: "var(--muted)" }}>High (100+)</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ border: "2px solid var(--primary)" }} /><span className="t-label" style={{ color: "var(--muted)" }}>Current</span></div>
          </div>
        </div>

        {/* Failure Details */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)", borderLeft: "3px solid var(--semantic-error)" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>FAILURE EFFECT</div>
            <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>{record.failureEffect}</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)", borderLeft: "3px solid #8a6835" }}>
            <div className="t-label" style={{ color: "var(--muted)" }}>POTENTIAL CAUSE</div>
            <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>{record.potentialCause}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <ShieldAlert size={12} style={{ color: "var(--semantic-success)" }} />
              <div className="t-label" style={{ color: "var(--muted)" }}>PREVENTION CONTROL</div>
            </div>
            <div className="t-body-sm" style={{ color: "var(--ink)" }}>{record.preventionControl || "Not defined"}</div>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Eye size={12} style={{ color: "#8a6835" }} />
              <div className="t-label" style={{ color: "var(--muted)" }}>DETECTION CONTROL</div>
            </div>
            <div className="t-body-sm" style={{ color: "var(--ink)" }}>{record.detectionControl || "Not defined"}</div>
          </div>
        </div>

        {/* Risk Scoring */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>RISK SCORING</div>
          <div className="grid grid-cols-4 gap-3">
            <div><Label className="t-label" style={{ color: "var(--muted)" }}>Severity (1-10)</Label><Input type="number" min={1} max={10} value={severity} onChange={(e) => setSeverity(Number(e.target.value))} className="mt-1 t-code h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }} /></div>
            <div><Label className="t-label" style={{ color: "var(--muted)" }}>Occurrence</Label><Input type="number" min={1} max={10} value={occurrence} onChange={(e) => setOccurrence(Number(e.target.value))} className="mt-1 t-code h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }} /></div>
            <div><Label className="t-label" style={{ color: "var(--muted)" }}>Detection</Label><Input type="number" min={1} max={10} value={detection} onChange={(e) => setDetection(Number(e.target.value))} className="mt-1 t-code h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }} /></div>
            <div><Label className="t-label" style={{ color: "var(--muted)" }}>RPN</Label><div className="mt-1 h-9 rounded-lg flex items-center justify-center t-body-sm font-medium" style={{ backgroundColor: rpn >= 100 ? "var(--semantic-error)" + "0d" : rpn >= 50 ? "#8a68350d" : "var(--semantic-success)" + "0d", color: rpn >= 100 ? "var(--semantic-error)" : rpn >= 50 ? "#8a6835" : "var(--semantic-success)" }}>{rpn}</div></div>
          </div>
        </div>

        {/* Action Plan */}
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>ACTION PLAN</div>
          <div><Textarea value={recommendedAction} onChange={(e) => setRecommendedAction(e.target.value)} rows={2} className="t-body-sm rounded-lg" style={{ borderColor: "var(--hairline)" }} placeholder="Describe the recommended action to reduce risk..." /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Action Owner" value={actionOwner} onChange={setActionOwner} />
          <SelectField label="Status" value={status} onChange={setStatus} options={[["Open","Open"],["In Progress","In Progress"],["Action-Verified","Action-Verified"],["Closed","Closed"]]} />
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={onUpdated} className="t-body-sm h-9 px-4 rounded-lg">Close</Button>
        <Button onClick={save} disabled={saving} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}

// ============================================================
// Documents Module
// ============================================================
function DocumentsModule() {
  const [docs, setDocs] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    fetch(`/api/documents?${params}`).then(r => r.json()).then(d => { setDocs(d.documents || []); setLoading(false); });
  }, [statusFilter, categoryFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const d of docs) { if (!g[d.category]) g[d.category] = []; g[d.category].push(d); }
    return g;
  }, [docs]);

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Governance & Knowledge" title="Document Control" subtitle="Controlled QCI/F and PRO/F forms with revision status and effective dates." />
      <FilterBar count={docs.length}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="Released">Released</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Obsolete">Obsolete</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="in-process">In-Process</SelectItem>
            <SelectItem value="assembly">Assembly</SelectItem>
            <SelectItem value="welding">Welding</SelectItem>
            <SelectItem value="leak-test">Leak Test</SelectItem>
            <SelectItem value="HDG">HDG</SelectItem>
            <SelectItem value="paint">Paint</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="packing">Packing</SelectItem>
          </SelectContent>
        </Select>
      </FilterBar>
      <div className="p-4 md:p-8 space-y-5">
        {loading ? <LoadingBlock label="Loading documents…" /> : Object.entries(grouped).map(([cat, list]) => (
          <div key={cat}>
            <h2 className="t-display-sm mb-3 capitalize" style={{ color: "var(--ink)" }}>{cat}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((d) => (
                <div key={d.id} className="rounded-xl p-4 flex flex-col" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", opacity: d.status === "Obsolete" ? 0.5 : 1 }}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="t-label" style={{ color: "var(--muted)" }}>{d.docNumber}</div>
                      <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>{d.title}</div>
                    </div>
                    <span className="t-label px-2 py-0.5 rounded-full shrink-0 ml-2" style={{ border: `1px solid ${d.status === "Released" ? "var(--semantic-success)" : d.status === "Obsolete" ? "var(--semantic-error)" : "var(--hairline)"}`, color: d.status === "Released" ? "var(--semantic-success)" : d.status === "Obsolete" ? "var(--semantic-error)" : "var(--muted)" }}>{d.revision}</span>
                  </div>
                  <div className="t-label mt-2 flex items-center gap-3" style={{ color: "var(--muted)" }}>
                    <span>{d.docType}</span>
                    <span>{fmtDate(d.effectiveDate)}</span>
                    {d.owner && <span>{d.owner}</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--hairline-soft)" }}>
                    <button
                      onClick={() => setViewDoc(d)}
                      className="w-full inline-flex items-center justify-center gap-1.5 t-body-sm h-8 rounded-lg transition-colors hover:bg-[var(--canvas-soft)]"
                      style={{ border: "1px solid var(--hairline)", color: "var(--ink)" }}
                    >
                      <Eye size={13} style={{ color: "var(--primary)" }} /> View Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <SheetContent className="w-full md:w-[45vw] md:max-w-[850px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {viewDoc && <DocumentViewerDrawer doc={viewDoc} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================================
// Document Viewer Drawer - shows actual checklist fields
// ============================================================
function DocumentViewerDrawer({ doc }: { doc: any }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/document-templates?docNumber=${encodeURIComponent(doc.docNumber)}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [doc.docNumber]);

  const fieldIcon = (type: string) => {
    switch (type) {
      case "number": return <Gauge size={11} />;
      case "date": return <CalendarDays size={11} />;
      case "select": return <ListChecks size={11} />;
      case "passfail": return <CheckSquare size={11} />;
      case "text": return <FileText size={11} />;
      case "info": return <AlertCircle size={11} />;
      case "time": return <Clock size={11} />;
      default: return <FileText size={11} />;
    }
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{doc.title}</SheetTitle>
          <span className="t-label px-2 py-0.5 rounded-full" style={{ border: `1px solid ${doc.status === "Released" ? "var(--semantic-success)" : "var(--hairline)"}`, color: doc.status === "Released" ? "var(--semantic-success)" : "var(--muted)" }}>Rev {doc.revision}</span>
          {doc.status === "Released" ? <StatusBadge status="Released" size="xs" /> : <StatusBadge status={doc.status} size="xs" />}
        </div>
        <SheetDescription className="t-body-sm t-code" style={{ color: "var(--muted)" }}>{doc.docNumber} · {doc.docType} · Effective {fmtDate(doc.effectiveDate)}{doc.owner ? ` · ${doc.owner}` : ""}</SheetDescription>
      </SheetHeader>
      <div className="p-6">
        {loading ? <LoadingBlock label="Loading checklist template…" /> : !data || data.error ? (
          <EmptyState message="Template not found." hint="This document does not have a configured checklist template yet." />
        ) : (
          <div className="space-y-5">
            {(data.template?.sections || []).map((section: any, i: number) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="t-label" style={{ color: "var(--primary)" }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-title-sm" style={{ color: "var(--ink)" }}>{section.title}</h3>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)" }}>
                  {section.fields.map((f: any, j: number) => (
                    <div
                      key={j}
                      className="flex items-start gap-3 p-3"
                      style={{ borderBottom: j < section.fields.length - 1 ? "1px solid var(--hairline-soft)" : "none", backgroundColor: f.ctq ? "#c4741a0a" : "var(--surface-card)" }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)" }}>
                        {fieldIcon(f.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="t-body-sm" style={{ color: "var(--ink)", fontWeight: f.ctq ? 600 : 400 }}>{f.label}</span>
                          {f.ctq && (
                            <span className="t-label px-1.5 py-0 rounded-full" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>CTQ</span>
                          )}
                          {f.required && (
                            <span className="t-label" style={{ color: "var(--semantic-error)" }}>REQUIRED</span>
                          )}
                          <span className="t-label" style={{ color: "var(--muted-soft)" }}>{f.type}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 t-label" style={{ color: "var(--muted)" }}>
                          {f.spec && <span>Spec: <span className="t-code" style={{ color: "var(--ink)", fontSize: 11 }}>{f.spec}</span></span>}
                          {f.unit && <span>Unit: <span style={{ color: "var(--ink)" }}>{f.unit}</span></span>}
                          {f.method && <span>Method: <span style={{ color: "var(--ink)" }}>{f.method}</span></span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(data.template?.sections || []).length === 0 && <EmptyState message="No sections configured." />}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Traceability Module
// ============================================================
function TraceabilityModule({ plant }: { plant: string }) {
  const [search, setSearch] = useState("");
  const [genealogies, setGenealogies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  useEffect(() => { fetch(`/api/traceability?plant=${plant}`).then(r => r.json()).then(d => { setGenealogies(d.genealogies || []); setLoading(false); }); }, [plant]);

  const searchHtu = async () => {
    if (!search.trim()) return;
    const res = await fetch(`/api/traceability?htu=${encodeURIComponent(search.trim())}`);
    if (res.ok) { const d = await res.json(); setSelected(d.genealogy); } else { setSelected(null); }
  };

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Traceability"
        title="Product & Material Genealogy"
        subtitle="Trace any HTU backward to raw material or forward to dispatch. Complete DAG genealogy from coil to customer."
        action={
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <button onClick={() => setViewMode("table")} className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: viewMode === "table" ? "var(--surface-card)" : "transparent", color: viewMode === "table" ? "var(--ink)" : "var(--muted)" }}>Table</button>
            <button onClick={() => setViewMode("timeline")} className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors" style={{ backgroundColor: viewMode === "timeline" ? "var(--surface-card)" : "transparent", color: viewMode === "timeline" ? "var(--ink)" : "var(--muted)" }}>Timeline</button>
          </div>
        }
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* Search bar - prominent */}
        <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Search size={18} style={{ color: "var(--primary)" }} />
            <span className="t-title-sm" style={{ color: "var(--ink)" }}>Search by HTU Serial Number</span>
          </div>
          <div className="flex gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="e.g. 3003-001 or HTU-K2-001" className="flex-1" />
            <Button onClick={searchHtu} className="t-body-sm h-9 px-5 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }} title="Search for this HTU's complete genealogy">
              <Search size={14} /> Trace
            </Button>
          </div>
          <div className="t-body-sm mt-2" style={{ color: "var(--muted)" }}>Enter a HTU serial number to view its complete material genealogy, inspection trail, and NCR history.</div>
        </div>

        {/* Genealogy detail - redesigned with timeline visualization */}
        {selected && (
          <div className="rounded-md overflow-hidden" style={{ border: "2px solid var(--primary)", backgroundColor: "var(--surface-card)" }}>
            {/* Header bar */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              <div className="flex items-center gap-3">
                <Network size={20} />
                <div>
                  <div className="t-title-sm">Genealogy Report</div>
                  <div className="t-body-sm" style={{ opacity: 0.8 }}>HTU {selected.htuno} · Serial #{selected.serialNo}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="t-body-sm h-7 px-3 rounded-md flex items-center gap-1 transition-colors" style={{ border: "1px solid rgba(255,255,255,0.4)", color: "#ffffff", backgroundColor: "rgba(255,255,255,0.1)" }}>Close</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Work Order summary */}
              <div className="rounded-md p-4 flex items-center justify-between" style={{ backgroundColor: "var(--canvas-soft)" }}>
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--muted)" }}>WORK ORDER</div>
                  <div className="t-title-sm" style={{ color: "var(--ink)" }}>{selected.workOrder?.woNumber || "-"}</div>
                </div>
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--muted)" }}>CUSTOMER</div>
                  <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{selected.workOrder?.customer || "-"}</div>
                </div>
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--muted)" }}>ITEM</div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selected.workOrder?.itemName || "-"}</div>
                </div>
                <div>
                  <div className="t-label mb-1" style={{ color: "var(--muted)" }}>FINISH</div>
                  <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selected.workOrder?.finishType || "-"}</div>
                </div>
                {selected.finalDft !== null && selected.finalDft !== undefined && (
                  <div className="text-center">
                    <div className="t-label mb-1" style={{ color: "var(--muted)" }}>FINAL DFT</div>
                    <div className="t-display-sm t-num" style={{ color: "var(--semantic-success)" }}>{selected.finalDft?.toFixed(0)} µ</div>
                  </div>
                )}
              </div>

              {/* Material genealogy - visual chain */}
              <div>
                <div className="t-label mb-3" style={{ color: "var(--primary)" }}>MATERIAL GENEALOGY CHAIN</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { label: "Steel Coil", value: `${selected.coilMake || "-"}/${selected.coilNumber || "-"}`, color: "#083260" },
                    { label: "Sheet Thickness", value: selected.sheetThickness || "-", color: "#576590" },
                    { label: "Fin Count", value: selected.finCount ? `${selected.finCount} fins` : "-", color: "#159640" },
                    { label: "Welding Wire", value: selected.weldingWireBatch || "-", color: "#D36E2E" },
                    selected.primerBatch && { label: "Primer Batch", value: selected.primerBatch, color: "#B58B45" },
                    selected.paintBatch && { label: "Paint Batch", value: selected.paintBatch, color: "#A5B76C" },
                    selected.zincDipDate && { label: "Zinc Dip Date", value: fmtDate(selected.zincDipDate), color: "#083260" },
                    selected.releaseDate && { label: "Release Date", value: fmtDate(selected.releaseDate), color: "#159640" },
                  ].filter(Boolean).map((item: any, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="rounded-md p-2.5 min-w-[120px]" style={{ border: `1px solid ${item.color}33`, backgroundColor: `${item.color}08` }}>
                        <div className="t-label" style={{ color: item.color, fontSize: 8 }}>{item.label.toUpperCase()}</div>
                        <div className="t-body-sm font-medium t-code mt-0.5" style={{ color: "var(--ink)", fontSize: 11 }}>{item.value}</div>
                      </div>
                      {i < 7 && <ArrowRight size={14} style={{ color: "var(--muted-soft)" }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Inspection trail - vertical timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="t-label" style={{ color: "var(--primary)" }}>INSPECTION TRAIL · {selected.workOrder?.inspections?.length || 0} RECORDS</div>
                </div>
                <div className="max-h-80 overflow-y-auto scroll-fine">
                  {(selected.workOrder?.inspections || []).length > 0 ? (
                    <div className="space-y-0">
                      {(selected.workOrder?.inspections || []).map((insp: any, i: number) => {
                        const isLast = i === (selected.workOrder?.inspections || []).length - 1;
                        const resultColor = insp.overallResult === "Pass" ? "var(--semantic-success)" : insp.overallResult === "Fail" ? "var(--semantic-error)" : "var(--semantic-warn)";
                        return (
                          <div key={insp.recordNo} className="flex gap-3" style={{ paddingBottom: isLast ? 0 : 16 }}>
                            {/* Timeline dot + line */}
                            <div className="shrink-0 flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${resultColor}14`, border: `2px solid ${resultColor}` }}>
                                {insp.overallResult === "Pass" ? <CheckCircle2 size={14} style={{ color: resultColor }} /> : insp.overallResult === "Fail" ? <XCircle size={14} style={{ color: resultColor }} /> : <AlertCircle size={14} style={{ color: resultColor }} />}
                              </div>
                              {!isLast && <div className="flex-1 w-px mt-1" style={{ backgroundColor: "var(--hairline)", minHeight: 20 }} />}
                            </div>
                            {/* Content */}
                            <div className="flex-1 min-w-0 pb-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{insp.stage?.name || "Unknown Stage"}</span>
                                {insp.ctqResult === "Fail" && <span className="t-label px-1.5 py-0 rounded" style={{ backgroundColor: "var(--semantic-error)14", color: "var(--semantic-error)", fontSize: 8 }}>CTQ FAIL</span>}
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="t-code" style={{ color: "var(--muted)", fontSize: 10 }}>{insp.recordNo}</span>
                                <span className="t-label" style={{ color: "var(--muted)" }}>{fmtDateTime(insp.inspectedAt)}</span>
                                <span className="t-label" style={{ color: "var(--muted)" }}>· Inspector: {insp.inspector}</span>
                                <span className="t-label" style={{ color: resultColor, fontWeight: 600 }}>{insp.overallResult.toUpperCase()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <div className="t-body-sm" style={{ color: "var(--muted)" }}>No inspection records found for this HTU.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* NCR History */}
              {(selected.workOrder?.ncrs || []).length > 0 && (
                <div>
                  <div className="t-label mb-3" style={{ color: "var(--semantic-error)" }}>NCR HISTORY · {selected.workOrder?.ncrs?.length} RECORDS</div>
                  <div className="space-y-2">
                    {(selected.workOrder?.ncrs || []).map((ncr: any) => (
                      <div key={ncr.ncrNumber} className="rounded-md p-3 flex items-center justify-between" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                        <div>
                          <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{ncr.ncrNumber} · {ncr.defectCategory}</div>
                          <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{ncr.description?.slice(0, 80)}{ncr.description?.length > 80 ? "..." : ""}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="t-label" style={{ color: ncr.severity === "Critical" ? "var(--semantic-error)" : ncr.severity === "Major" ? "var(--semantic-warn)" : "var(--muted)" }}>{ncr.severity.toUpperCase()}</span>
                          <StatusBadge status={ncr.status} size="xs" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Material lots */}
              {(selected.workOrder?.materialLots || []).length > 0 && (
                <div>
                  <div className="t-label mb-3" style={{ color: "var(--primary)" }}>MATERIAL LOTS · {selected.workOrder?.materialLots?.length} LOTS</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(selected.workOrder?.materialLots || []).map((lot: any) => (
                      <div key={lot.lotNumber} className="rounded-md p-3" style={{ border: "1px solid var(--hairline-soft)", backgroundColor: "var(--canvas-soft)" }}>
                        <div className="t-code font-medium" style={{ color: "var(--ink)", fontSize: 11 }}>{lot.lotNumber}</div>
                        <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{lot.materialType} · {lot.supplier || "-"}</div>
                        <div className="t-label mt-0.5" style={{ color: lot.inspectionStatus === "Accepted" ? "var(--semantic-success)" : "var(--muted)" }}>{lot.inspectionStatus}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* List view */}
        {!selected && (
          loading ? <LoadingBlock label="Loading genealogy records" /> :
          genealogies.length === 0 ? <EmptyState message="No released radiators found." hint="Released HTUs will appear here after final inspection." /> :
          viewMode === "table" ? (
            <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
              <DataTable
                columns={[
                  { key: "htu", header: "HTU No", sortable: true, sortValue: (g) => g.htuno, render: (g) => <span className="t-body-sm font-medium" style={{ color: "var(--primary)" }}>{g.htuno}</span>, mobileLabel: "HTU" },
                  { key: "wo", header: "Work Order", sortable: true, sortValue: (g) => g.workOrder?.woNumber || "", render: (g) => <span className="t-body-sm">{g.workOrder?.woNumber}</span>, mobileLabel: "WO" },
                  { key: "customer", header: "Customer", render: (g) => <span className="t-body-sm">{g.workOrder?.customer}</span>, hideOnMobile: true },
                  { key: "item", header: "Item", render: (g) => <span className="t-body-sm" style={{ color: "var(--body)" }}>{g.workOrder?.itemName}</span>, hideOnMobile: true },
                  { key: "material", header: "Coil / Wire", render: (g) => <span className="t-label t-code">{g.coilMake}/{g.coilNumber} · {g.weldingWireBatch}</span>, hideOnMobile: true },
                  { key: "dft", header: "Final DFT", sortable: true, sortValue: (g) => g.finalDft || 0, render: (g) => <span className="t-code" style={{ color: g.finalDft ? "var(--semantic-success)" : "var(--muted-soft)" }}>{g.finalDft ? `${g.finalDft.toFixed(0)} µ` : "-"}</span>, mobileLabel: "DFT" },
                  { key: "released", header: "Released", sortable: true, sortValue: (g) => g.releaseDate ? new Date(g.releaseDate).getTime() : 0, render: (g) => <span className="t-label">{fmtDate(g.releaseDate)}</span>, hideOnMobile: true },
                ]}
                data={genealogies}
                onRowClick={(g) => { setSearch(g.htuno); searchHtu(); }}
                emptyMessage="No released radiators found."
                mobileCardRender={(g) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="t-body-sm font-medium" style={{ color: "var(--primary)" }}>{g.htuno}</span>
                      {g.finalDft && <span className="t-code" style={{ color: "var(--semantic-success)" }}>{g.finalDft.toFixed(0)} µ</span>}
                    </div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{g.workOrder?.woNumber} · {g.workOrder?.customer}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{g.coilMake} · {g.finCount} fins · Released {fmtDate(g.releaseDate)}</div>
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {genealogies.map((g) => (
                <button
                  key={g.id}
                  onClick={() => { setSearch(g.htuno); searchHtu(); }}
                  className="text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                  style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}
                  title={`Click to view full genealogy for ${g.htuno}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="t-code font-medium" style={{ color: "var(--primary)", fontSize: 13 }}>{g.htuno}</span>
                    {g.finalDft && <span className="t-code" style={{ color: "var(--semantic-success)", fontSize: 11 }}>{g.finalDft.toFixed(0)} µ</span>}
                  </div>
                  <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{g.workOrder?.customer}</div>
                  <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{g.workOrder?.woNumber} · {g.workOrder?.finishType}</div>
                  <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>Coil: {g.coilMake} · {g.finCount} fins</div>
                  <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>Released: {fmtDate(g.releaseDate)}</div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============================================================
// Analytics Module - enhanced with QC7 Tools tabs
// ============================================================
function AnalyticsModule({ plant }: { plant: string }) {
  const [tab, setTab] = useState("overview");
  const [days, setDays] = useState("30");
  const [stageFilter, setStageFilter] = useState("all");

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Continuous Improvement" title="Quality Analytics" subtitle="FPY trends, defect Pareto, QC7 tools, FMEA risk matrix and stage-level yields." />
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap px-4 md:px-8 py-3 border-b" style={{ borderColor: "var(--hairline)" }}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <span className="t-label" style={{ color: "var(--muted)" }}>Date Range</span>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-24 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
        <span className="t-label ml-2" style={{ color: "var(--muted)" }}>Stage</span>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-40 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {K2_STAGES.map(s => <SelectItem key={s.code} value={s.name}>{s.code} · {s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 md:p-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap h-auto" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <TabsTrigger value="overview" className="t-body-sm">Overview</TabsTrigger>
            <TabsTrigger value="qc7" className="t-body-sm">QC7 Tools</TabsTrigger>
            <TabsTrigger value="trends" className="t-body-sm">Trends</TabsTrigger>
            <TabsTrigger value="risk" className="t-body-sm">Risk</TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="mt-5 space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <OverviewFpyTrend plant={plant} days={Number(days)} stage={stageFilter} />
              <OverviewPareto plant={plant} days={Number(days)} />
              <div className="lg:col-span-2">
                <OverviewNcrSeverity plant={plant} days={Number(days)} />
              </div>
            </div>
          </TabsContent>

          {/* === QC7 TOOLS === */}
          <TabsContent value="qc7" className="mt-5 space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <Qc7CauseEffect plant={plant} days={Number(days)} />
              <Qc7Histogram plant={plant} days={Number(days)} stage={stageFilter} />
              <Qc7Scatter plant={plant} />
              <Qc7ControlChart plant={plant} days={Number(days)} />
              <Qc7Checksheet plant={plant} days={Number(days)} />
              <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="t-display-sm" style={{ color: "var(--ink)" }}>Flowchart</h3>
                    <p className="t-body-sm" style={{ color: "var(--muted)" }}>K2 process flow</p>
                  </div>
                  <GitBranch size={16} style={{ color: "var(--muted)" }} />
                </div>
                <ProcessFlowchart />
              </div>
            </div>
          </TabsContent>

          {/* === TRENDS === */}
          <TabsContent value="trends" className="mt-5 space-y-4">
            <TrendsFpyByStage plant={plant} days={Number(days)} />
            <TrendsNcrBacklog plant={plant} days={Number(days)} />
            <TrendsInspectionsByStage plant={plant} days={Number(days)} />
          </TabsContent>

          {/* === RISK === */}
          <TabsContent value="risk" className="mt-5 space-y-4">
            <RiskMatrix plant={plant} />
            <RiskRadar plant={plant} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ---- Overview sub-charts ----
function OverviewFpyTrend({ plant, days, stage }: { plant: string; days: number; stage: string }) {
  const { data, loading } = useChartData("line", plant, days, stage);
  if (loading || !data) return <LoadingBlock label="Loading FPY trend…" />;
  const stages = Object.keys(data.data || {});
  if (stages.length === 0) return (
    <ChartCard title="FPY Trend" subtitle={`${days}-day trend by stage`}>
      <EmptyState message="No FPY data." />
    </ChartCard>
  );
  // Build merged dataset for multi-line chart
  const allDates = Array.from(new Set(stages.flatMap(s => (data.data[s] || []).map((p: any) => p.date)))).sort();
  const merged = allDates.map(d => {
    const row: any = { date: d.slice(5) };
    for (const s of stages.slice(0, 6)) {
      const p = (data.data[s] || []).find((x: any) => x.date === d);
      row[s] = p ? p.fpy : null;
    }
    return row;
  });
  const colors = ["#c4741a", "#2a2825", "#4a8a6e", "#b85569", "#a07840", "#8b887f"];
  return (
    <ChartCard title="FPY Trend" subtitle={`${days}-day trend · ${stages.length} stages`}>
      <LineChartView
        data={merged}
        xKey="date"
        lines={stages.slice(0, 6).map((s, i) => ({ key: s, color: colors[i % colors.length], name: s }))}
        height={260}
      />
    </ChartCard>
  );
}

function OverviewPareto({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("checksheet", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading Pareto…" />;
  return (
    <ChartCard title="Defect Pareto" subtitle={`${days}-day · top defects`}>
      <ParetoChart data={(data.data || []).map((d: any) => ({ defect: d.defect, count: d.count, cumPct: 0 }))} />
    </ChartCard>
  );
}

function OverviewNcrSeverity({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("pie", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading NCR distribution…" />;
  return (
    <ChartCard title="NCR by Severity" subtitle={`${days}-day · ${data.total || 0} total NCRs`}>
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>By Severity</div>
          <PieChartView data={data.bySeverity || []} height={220} />
        </div>
        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>By Defect Category</div>
          <PieChartView data={data.byCategory || []} height={220} />
        </div>
      </div>
    </ChartCard>
  );
}

// ---- QC7 sub-charts ----
function Qc7CauseEffect({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("cause-effect", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading Ishikawa…" />;
  return (
    <ChartCard title="Cause & Effect (Ishikawa)" subtitle="6M analysis · linked NCR + FMEA causes">
      <CauseEffectView data={data.data || []} effect={data.effect || "Quality Defects"} />
    </ChartCard>
  );
}

function Qc7Histogram({ plant, days, stage }: { plant: string; days: number; stage: string }) {
  const { data, loading } = useChartData("histogram", plant, days, stage);
  if (loading || !data) return <LoadingBlock label="Loading histogram…" />;
  return (
    <ChartCard title="Histogram" subtitle={`${data.title || "Inspection results"} · ${data.total || 0} records`}>
      <HistogramView data={data.data || []} height={220} />
    </ChartCard>
  );
}

function Qc7Scatter({ plant }: { plant: string }) {
  const { data, loading } = useChartData("scatter", plant, 365);
  if (loading || !data) return <LoadingBlock label="Loading scatter…" />;
  return (
    <ChartCard title="Scatter Diagram" subtitle="FMEA risk matrix - Severity × Occurrence, sized by RPN">
      <ScatterChartView
        data={data.data || []}
        xLabel={data.xLabel || "Severity"}
        yLabel={data.yLabel || "Occurrence"}
        xMax={data.xMax || 10}
        yMax={data.yMax || 10}
        height={300}
      />
    </ChartCard>
  );
}

function Qc7ControlChart({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("control", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading control chart…" />;
  return (
    <ChartCard title="Control Chart" subtitle={`FPY X-bar · UCL ${data.ucl} · LCL ${data.lcl} · Mean ${data.mean}`}>
      <ControlChartView data={data.data || []} mean={data.mean} ucl={data.ucl} lcl={data.lcl} height={260} />
    </ChartCard>
  );
}

function Qc7Checksheet({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("checksheet", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading checksheet…" />;
  return (
    <ChartCard title="Checksheet" subtitle={`Defect frequency tally · ${data.total || 0} NCRs`}>
      <ChecksheetView data={data.data || []} />
    </ChartCard>
  );
}

function ProcessFlowchart() {
  const steps = K2_STAGES;
  return (
    <div className="overflow-x-auto scroll-fine pb-2">
      <div className="flex items-center gap-1 min-w-max">
        {steps.map((s, i) => (
          <div key={s.code} className="flex items-center gap-1">
            <div className="rounded-lg p-2 text-center" style={{
              backgroundColor: i === 8 ? "#b855690d" : "var(--canvas-soft)",
              border: `1px solid ${i === 8 ? "var(--semantic-error)" : "var(--hairline)"}`,
              minWidth: 80,
            }}>
              <div className="t-label" style={{ color: i === 8 ? "var(--semantic-error)" : "var(--muted)" }}>{s.code}</div>
              <div className="t-body-sm" style={{ color: "var(--ink)", fontSize: 11, lineHeight: 1.2 }}>{s.name}</div>
            </div>
            {i < steps.length - 1 && <ArrowRightCircle size={14} style={{ color: "var(--muted-soft)" }} />}
          </div>
        ))}
      </div>
      <div className="mt-3 t-label" style={{ color: "var(--muted)" }}>
        Leak Testing (S09) is the quality gate · CTQ stage
      </div>
    </div>
  );
}

// ---- Trends sub-charts ----
function TrendsFpyByStage({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("line", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading trends…" />;
  const stages = Object.keys(data.data || {});
  if (stages.length === 0) return (
    <ChartCard title="FPY Trend by Stage" subtitle={`${days}-day`}>
      <EmptyState message="No FPY data." />
    </ChartCard>
  );
  const allDates = Array.from(new Set(stages.flatMap(s => (data.data[s] || []).map((p: any) => p.date)))).sort();
  const merged = allDates.map(d => {
    const row: any = { date: d.slice(5) };
    for (const s of stages.slice(0, 6)) {
      const p = (data.data[s] || []).find((x: any) => x.date === d);
      row[s] = p ? p.fpy : null;
    }
    return row;
  });
  const colors = ["#c4741a", "#2a2825", "#4a8a6e", "#b85569", "#a07840", "#8b887f"];
  return (
    <ChartCard title="FPY Trend by Stage" subtitle={`${days}-day · ${stages.length} stages`}>
      <LineChartView
        data={merged}
        xKey="date"
        lines={stages.slice(0, 6).map((s, i) => ({ key: s, color: colors[i % colors.length], name: s }))}
        height={300}
      />
    </ChartCard>
  );
}

function TrendsNcrBacklog({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("area", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading NCR backlog…" />;
  return (
    <ChartCard title="NCR Backlog" subtitle="Cumulative open vs closed">
      <AreaChartView
        data={data.data || []}
        areas={[
          { key: "open", color: "#b85569", name: "Open" },
          { key: "closed", color: "#4a8a6e", name: "Closed" },
          { key: "backlog", color: "#a07840", name: "Backlog" },
        ]}
        height={280}
      />
    </ChartCard>
  );
}

function TrendsInspectionsByStage({ plant, days }: { plant: string; days: number }) {
  const { data, loading } = useChartData("bar", plant, days);
  if (loading || !data) return <LoadingBlock label="Loading inspections…" />;
  const chartData = (data.data || []).map((d: any) => ({ label: d.stage, Pass: d.pass, Fail: d.fail, Hold: d.hold }));
  return (
    <ChartCard title="Inspections by Stage" subtitle={`${days}-day · Pass vs Fail vs Hold`}>
      <BarChartView
        data={chartData}
        keys={[
          { key: "Pass", color: "#4a8a6e", name: "Pass" },
          { key: "Fail", color: "#b85569", name: "Fail" },
          { key: "Hold", color: "#a07840", name: "Hold" },
        ]}
        height={280}
        stacked
      />
    </ChartCard>
  );
}

// ---- Risk sub-charts ----
function RiskMatrix({ plant }: { plant: string }) {
  const { data, loading } = useChartData("scatter", plant, 365);
  if (loading || !data) return <LoadingBlock label="Loading risk matrix…" />;
  return (
    <ChartCard title="FMEA Risk Matrix" subtitle="Severity × Occurrence · colored by RPN">
      <ScatterChartView
        data={data.data || []}
        xLabel={data.xLabel || "Severity"}
        yLabel={data.yLabel || "Occurrence"}
        xMax={data.xMax || 10}
        yMax={data.yMax || 10}
        height={320}
      />
    </ChartCard>
  );
}

function RiskRadar({ plant }: { plant: string }) {
  const { data, loading } = useChartData("radar", plant, 365);
  if (loading || !data) return <LoadingBlock label="Loading risk profile…" />;
  return (
    <ChartCard title="Risk Profile by Stage" subtitle="Severity · Occurrence · Detection averaged per stage">
      <RadarChartView data={data.data || []} height={320} />
    </ChartCard>
  );
}

// ============================================================
// User Management Module (Admin / QualityManager only)
// ============================================================
function UserManagementModule({ plant, currentUser }: { plant: string; currentUser: User }) {
  const [users, setUsers] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/users").then(r => r.json()).then(d => {
      const list = (d.users || []).map((u: any) => ({
        ...u,
        assignedStages: u.assignedStages ? safeParse(u.assignedStages) : [],
        managedStages: u.managedStages ? safeParse(u.managedStages) : [],
      }));
      setUsers(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
    fetch("/api/process-routes?code=K2").then(r => r.json()).then(d => setStages(d.route?.stages || []));
  }, [load]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") list = list.filter(u => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return list;
  }, [users, roleFilter, search]);

  // QualityManager cannot edit Admin users
  const canEdit = (u: any) => {
    if (currentUser.role === "Admin") return true;
    if (currentUser.role === "QualityManager" && u.role !== "Admin") return true;
    return false;
  };

  const columns: Column<any>[] = [
    { key: "name", header: "Name", sortable: true, sortValue: (u) => u.name, render: (u) => (
      <div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{u.name}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>@{u.username}</div>
      </div>
    ), mobileLabel: "User" },
    { key: "role", header: "Role", sortable: true, sortValue: (u) => u.role, render: (u) => (
      <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{ROLE_LABELS[u.role] || u.role}</span>
    ), mobileLabel: "Role" },
    { key: "department", header: "Department", render: (u) => <span className="t-body-sm">{u.department || "-"}</span>, hideOnMobile: true },
    { key: "plant", header: "Plant", render: (u) => <span className="t-code">{u.plant}</span>, hideOnMobile: true },
    { key: "shift", header: "Shift", render: (u) => <span className="t-code">{u.shiftPreference || "-"}</span>, hideOnMobile: true },
    { key: "stages", header: "Assigned Stages", render: (u) => (
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {(u.assignedStages || []).length === 0 ? <span className="t-label" style={{ color: "var(--muted-soft)" }}>-</span> :
          (u.assignedStages || []).slice(0, 4).map((s: string) => (
            <span key={s} className="t-code px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)", fontSize: 10 }}>{s}</span>
          ))
        }
        {(u.assignedStages || []).length > 4 && <span className="t-label" style={{ color: "var(--muted)" }}>+{u.assignedStages.length - 4}</span>}
      </div>
    ), hideOnMobile: true },
    { key: "status", header: "Status", sortable: true, sortValue: (u) => u.status, render: (u) => <StatusBadge status={u.status} size="xs" />, mobileLabel: "Status" },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Administration"
        title="User Management"
        subtitle="Create users, assign roles and stage permissions, suspend or activate accounts."
        info="Create and manage user accounts here. Each user is assigned a role that controls which modules they can access, and optionally a set of process stages they are responsible for inspecting or managing."
        action={currentUser.role === "Admin" && (
          <Button onClick={() => setShowCreate(true)} className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
            <UserPlus size={14} /> New User
          </Button>
        )}
      />
      <FilterBar count={filtered.length}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>)}
          </SelectContent>
        </Select>
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, username, email…" className="w-64" />
      </FilterBar>
      <div className="p-4 md:p-8">
        {loading ? <LoadingBlock label="Loading users…" /> : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={(u) => canEdit(u) && setSelected(u)}
              emptyMessage="No users found."
              mobileCardRender={(u) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{u.name}</div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>@{u.username}</div>
                    </div>
                    <StatusBadge status={u.status} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{u.role}</span>
                    {u.department && <span className="t-label" style={{ color: "var(--muted)" }}>{u.department}</span>}
                  </div>
                  {(u.assignedStages || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {u.assignedStages.map((s: string) => (
                        <span key={s} className="t-code px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)", fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <UserDetail user={selected} stages={stages} currentUser={currentUser} onUpdated={() => { load(); setSelected(null); }} />}
        </SheetContent>
      </Sheet>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          <CreateUserForm stages={stages} plant={plant} onCreated={() => { setShowCreate(false); load(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserDetail({ user, stages, currentUser, onUpdated }: { user: any; stages: any[]; currentUser: User; onUpdated: () => void }) {
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department || "");
  const [status, setStatus] = useState(user.status);
  const [shiftPreference, setShiftPreference] = useState(user.shiftPreference || "");
  const [assignedStages, setAssignedStages] = useState<string[]>(user.assignedStages || []);
  const [managedStages, setManagedStages] = useState<string[]>(user.managedStages || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleStage = (code: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(code) ? list.filter(s => s !== code) : [...list, code]);
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, role, department, status, shiftPreference, assignedStages, managedStages }),
    });
    if (res.ok) { toast({ title: "User updated", description: `${user.name} → ${role} · ${status}` }); onUpdated(); }
    else { toast({ title: "Update failed", variant: "destructive" }); }
    setSaving(false);
  };

  const toggleSuspend = async () => {
    const newStatus = status === "Active" ? "Suspended" : "Active";
    setStatus(newStatus);
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, status: newStatus }),
    });
    if (res.ok) { toast({ title: newStatus === "Suspended" ? "User suspended" : "User activated", description: user.name }); }
    else { toast({ title: "Action failed", variant: "destructive" }); setStatus(status); }
    setSaving(false);
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{user.name}</SheetTitle>
          <StatusBadge status={user.status} size="xs" />
        </div>
        <SheetDescription className="t-body-md" style={{ color: "var(--muted)" }}>@{user.username} · {user.email}</SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Role</Label>
            <Select value={role} onValueChange={setRole} disabled={currentUser.role !== "Admin" && role === "Admin"}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.filter(r => currentUser.role === "Admin" || r !== "Admin").map(r => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                {DEPARTMENT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Shift Preference</Label>
            <Select value={shiftPreference} onValueChange={setShiftPreference}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                {SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>Shift {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Assigned Stages ({assignedStages.length})</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto scroll-fine">
            {stages.map((s) => {
              const checked = assignedStages.includes(s.stageCode);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStage(s.stageCode, assignedStages, setAssignedStages)}
                  className="flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                  style={{ border: `1px solid ${checked ? "var(--primary)" : "var(--hairline)"}`, backgroundColor: checked ? "#c4741a0d" : "var(--canvas-soft)" }}
                >
                  {checked ? <CheckSquare size={13} style={{ color: "var(--primary)" }} /> : <Square size={13} style={{ color: "var(--muted)" }} />}
                  <div className="min-w-0">
                    <div className="t-label" style={{ color: "var(--muted)" }}>{s.stageCode}</div>
                    <div className="t-body-sm truncate" style={{ color: "var(--ink)", fontSize: 12 }}>{s.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Managed Stages ({managedStages.length}) - for QC supervisors</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto scroll-fine">
            {stages.map((s) => {
              const checked = managedStages.includes(s.stageCode);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleStage(s.stageCode, managedStages, setManagedStages)}
                  className="flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                  style={{ border: `1px solid ${checked ? "var(--primary)" : "var(--hairline)"}`, backgroundColor: checked ? "#c4741a0d" : "var(--canvas-soft)" }}
                >
                  {checked ? <CheckSquare size={13} style={{ color: "var(--primary)" }} /> : <Square size={13} style={{ color: "var(--muted)" }} />}
                  <div className="min-w-0">
                    <div className="t-label" style={{ color: "var(--muted)" }}>{s.stageCode}</div>
                    <div className="t-body-sm truncate" style={{ color: "var(--ink)", fontSize: 12 }}>{s.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={toggleSuspend} className="t-body-sm h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ color: status === "Active" ? "var(--semantic-error)" : "var(--semantic-success)" }}>
          {status === "Active" ? <><Ban size={14} /> Suspend</> : <><CheckCircle2 size={14} /> Activate</>}
        </Button>
        <Button variant="outline" onClick={onUpdated} className="t-body-sm h-9 px-4 rounded-lg">Close</Button>
        <Button onClick={save} disabled={saving} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>{saving ? "Saving…" : "Save Changes"}</Button>
      </div>
    </div>
  );
}

function CreateUserForm({ stages, plant, onCreated }: { stages: any[]; plant: string; onCreated: () => void }) {
  const [form, setForm] = useState({
    username: "", password: "", name: "", email: "",
    role: "Operator" as Role, department: "Quality", plant,
    shiftPreference: "A", status: "Active",
  });
  const [assignedStages, setAssignedStages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!form.username || !form.password || !form.name || !form.email) {
      toast({ title: "Required fields missing", description: "Username, password, name and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, assignedStages }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "User created", description: `${form.name} (@${form.username})` });
      onCreated();
    } else {
      toast({ title: "Creation failed", description: data.error || "Unknown error", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
        <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>New User</SheetTitle>
        <SheetDescription className="t-body-sm" style={{ color: "var(--muted)" }}>Create a new QMS account with role and stage permissions.</SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username *" value={form.username} onChange={(v) => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, ".") })} placeholder="e.g. rohan.mehta" />
          <FormField label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Set initial password" />
          <FormField label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Rohan Mehta" />
          <FormField label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="e.g. rohan@hitech.com" />
          <SelectField label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={ROLE_OPTIONS.map(r => [r, ROLE_LABELS[r] || r] as [string, string])} />
          <SelectField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENT_OPTIONS.map(d => [d, d] as [string, string])} />
          <SelectField label="Shift" value={form.shiftPreference} onChange={(v) => setForm({ ...form, shiftPreference: v })} options={SHIFT_OPTIONS.map(s => [s, `Shift ${s}`] as [string, string])} />
          <SelectField label="Plant" value={form.plant} onChange={(v) => setForm({ ...form, plant: v })} options={[["K2","K2 - Khopoli"]]} />
        </div>

        <Separator />

        <div>
          <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Assigned Stages ({assignedStages.length})</div>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto scroll-fine">
            {stages.map((s) => {
              const checked = assignedStages.includes(s.stageCode);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setAssignedStages(assignedStages.includes(s.stageCode) ? assignedStages.filter(x => x !== s.stageCode) : [...assignedStages, s.stageCode])}
                  className="flex items-center gap-2 p-2 rounded-lg text-left transition-colors"
                  style={{ border: `1px solid ${checked ? "var(--primary)" : "var(--hairline)"}`, backgroundColor: checked ? "#c4741a0d" : "var(--canvas-soft)" }}
                >
                  {checked ? <CheckSquare size={13} style={{ color: "var(--primary)" }} /> : <Square size={13} style={{ color: "var(--muted)" }} />}
                  <div className="min-w-0">
                    <div className="t-label" style={{ color: "var(--muted)" }}>{s.stageCode}</div>
                    <div className="t-body-sm truncate" style={{ color: "var(--ink)", fontSize: 12 }}>{s.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={onCreated} className="t-body-sm h-9 px-4 rounded-lg">Cancel</Button>
        <Button onClick={submit} disabled={saving} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>{saving ? "Creating…" : "Create User"}</Button>
      </div>
    </div>
  );
}

function safeParse(s: string): any[] {
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

// ============================================================
// Import Module
// ============================================================
function ImportModule({ plant }: { plant: string }) {
  const [entityType, setEntityType] = useState("work-orders");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<any[]>([]);
  const [validation, setValidation] = useState<any>(null);
  const [committing, setCommitting] = useState(false);
  const [parseError, setParseError] = useState("");
  const { toast } = useToast();

  const handleFile = async (f: File) => {
    setFile(f); setParseError(""); setParsed([]); setValidation(null);
    try {
      const XLSX = require("xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      setParsed(rows);
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType, data: rows, action: "preview" }) });
      const v = await res.json();
      setValidation(v);
    } catch (e: any) { setParseError(e.message); }
  };

  const commit = async () => {
    setCommitting(true);
    const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityType, data: parsed, action: "commit" }) });
    const r = await res.json();
    if (res.ok) { toast({ title: "Import complete", description: `${r.committed} committed, ${r.skipped} skipped` }); setFile(null); setParsed([]); setValidation(null); } else { toast({ title: "Import failed", variant: "destructive" }); }
    setCommitting(false);
  };

  const downloadTemplate = () => {
    let headers: string[] = [];
    if (entityType === "work-orders") headers = ["WO_Number","SO_Number","Customer","Customer_PO","Item_Name","Size","Finish_Type","Route","Planned_Qty","Priority","Status","Material_Status","Sales_Person"];
    else if (entityType === "materials") headers = ["Lot_Number","GRN_Number","Material_Type","Supplier","Specification","Quantity","Unit","Inspection_Status","MTC_Available"];
    const csv = headers.join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `template-${entityType}.csv`;
    a.click();
  };

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Data Management" title="Import Data" subtitle="Upload CSV or XLSX files. Validate before committing. Templates available for each entity type." info="Use this module to bulk-upload data from spreadsheets - work orders, materials, users, inspection records. Always validate the file first; nothing is saved to the database until you click Commit." />
      <div className="p-4 md:p-8 space-y-4 max-w-3xl">
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <SelectField label="Entity Type" value={entityType} onChange={setEntityType} options={[["work-orders","Work Orders"],["materials","Material Lots"]]} />
            <div className="flex items-end">
              <Button variant="outline" onClick={downloadTemplate} className="t-body-sm h-9 w-full rounded-lg flex items-center gap-1.5 justify-center"><FileDown size={14} /> Download Template</Button>
            </div>
          </div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Upload File (CSV or XLSX)</Label>
          <label className="mt-1.5 flex items-center justify-center gap-2 h-12 rounded-lg cursor-pointer transition-colors hover:bg-[var(--canvas-soft)]" style={{ border: "1.5px dashed var(--hairline-strong)", backgroundColor: "var(--canvas-soft)" }}>
            <Upload size={16} style={{ color: "var(--muted)" }} />
            <span className="t-body-sm" style={{ color: "var(--muted)" }}>{file ? file.name : "Choose file…"}</span>
            <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          {parseError && <div className="mt-2 t-body-sm" style={{ color: "var(--semantic-error)" }}>Parse error: {parseError}</div>}
        </div>

        {validation && (
          <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Validation Results</h2>
              <div className="flex items-center gap-2">
                <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "#4a8a6e0d", color: "var(--semantic-success)" }}>{validation.valid} valid</span>
                {validation.errors > 0 && <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "#b855690d", color: "var(--semantic-error)" }}>{validation.errors} errors</span>}
                {validation.warnings > 0 && <span className="t-label px-2 py-0.5 rounded-full" style={{ backgroundColor: "#a078400d", color: "#8a6835" }}>{validation.warnings} warnings</span>}
              </div>
            </div>
            {validation.errorDetails?.length > 0 && (
              <div className="mb-3">
                <div className="t-label mb-1" style={{ color: "var(--semantic-error)" }}>Errors</div>
                <div className="space-y-1 max-h-32 overflow-y-auto scroll-fine">
                  {validation.errorDetails.map((e: any, i: number) => (
                    <div key={i} className="t-label rounded p-1.5" style={{ backgroundColor: "#b855690a", color: "var(--semantic-error)" }}>Row {e.row}: {e.field} - {e.message}</div>
                  ))}
                </div>
              </div>
            )}
            {validation.preview?.length > 0 && (
              <div>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Preview (first 10 rows)</div>
                <div className="overflow-x-auto scroll-fine rounded-lg" style={{ border: "1px solid var(--hairline)" }}>
                  <table className="w-full" style={{ borderCollapse: "collapse" }}>
                    <thead><tr style={{ borderBottom: "1px solid var(--hairline)" }}>
                      {Object.keys(validation.preview[0]).map(k => <th key={k} className="t-label text-left py-2 px-2.5" style={{ color: "var(--muted)", backgroundColor: "var(--canvas-soft)" }}>{k}</th>)}
                    </tr></thead>
                    <tbody>
                      {validation.preview.map((row: any, i: number) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                          {Object.values(row).map((v: any, j: number) => <td key={j} className="t-label py-1.5 px-2.5" style={{ color: "var(--ink)" }}>{String(v ?? "-")}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {validation.errors === 0 && validation.valid > 0 && (
              <Button onClick={commit} disabled={committing} className="mt-4 t-body-sm h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--semantic-success)", color: "white" }}>
                {committing ? "Committing…" : `Commit ${validation.valid} Records`}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Export Module
// ============================================================
function ExportModule({ plant }: { plant: string }) {
  const [type, setType] = useState("work-orders");
  const [format, setFormat] = useState("csv");
  const { toast } = useToast();

  const exports = [
    { key: "work-orders", label: "Work Orders", desc: "Production work orders with status, qty, route", icon: ClipboardList },
    { key: "inspections", label: "Inspections", desc: "All inspection records with results", icon: ClipboardCheck },
    { key: "ncrs", label: "Nonconformances", desc: "NCR records with CAPA status", icon: AlertTriangle },
    { key: "fmea", label: "FMEA Records", desc: "Risk assessment with RPN scores", icon: ShieldAlert },
    { key: "traceability", label: "Traceability", desc: "Product genealogy with material batches", icon: Network },
    { key: "materials", label: "Material Lots", desc: "Incoming material lots with status", icon: Boxes },
    { key: "equipment", label: "Equipment", desc: "Calibration and equipment register", icon: Wrench },
  ];

  const doExport = () => {
    window.open(`/api/export?type=${type}&format=${format}&plant=${plant}`, "_blank");
    toast({ title: "Export started", description: `${type} as ${format.toUpperCase()}` });
  };

  return (
    <div className="reveal-up">
      <PageHeader eyebrow="Data Management" title="Export Data" subtitle="Download authorized records in CSV, XLSX or JSON format with plant filter applied." info="Download data from the QMS for offline analysis, backups, or sharing. Pick a format (CSV for spreadsheets, XLSX for formatted Excel, JSON for integration) and the plant scope, then click Export." />
      <div className="p-4 md:p-8 space-y-4 max-w-3xl">
        <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Data Type</Label>
          <div className="mt-2 grid sm:grid-cols-2 gap-2">
            {exports.map((e) => {
              const Icon = e.icon;
              return (
                <button key={e.key} onClick={() => setType(e.key)} className="flex items-start gap-3 text-left p-3 rounded-lg transition-colors" style={{ border: `1px solid ${type === e.key ? "var(--primary)" : "var(--hairline)"}`, backgroundColor: type === e.key ? "var(--primary)" : "var(--canvas-soft)" }}>
                  <Icon size={16} className="shrink-0 mt-0.5" style={{ color: type === e.key ? "var(--on-primary)" : "var(--ink)" }} />
                  <div>
                    <div className="t-body-sm font-medium" style={{ color: type === e.key ? "var(--on-primary)" : "var(--ink)" }}>{e.label}</div>
                    <div className="t-label mt-0.5" style={{ color: type === e.key ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>{e.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Format</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[["csv","CSV",FileSpreadsheet],["xlsx","XLSX",FileSpreadsheet],["json","JSON",FileJson]].map(([val, label, Icon]: any) => (
              <button key={val} onClick={() => setFormat(val)} className="flex items-center justify-center gap-2 p-3 rounded-lg transition-colors" style={{ border: `1px solid ${format === val ? "var(--primary)" : "var(--hairline)"}`, backgroundColor: format === val ? "var(--primary)" : "var(--canvas-soft)", color: format === val ? "var(--on-primary)" : "var(--ink)" }}>
                <Icon size={14} />
                <span className="t-body-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5 flex items-center justify-between" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
          <div>
            <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Export {type} as {format.toUpperCase()}</div>
            <div className="t-label" style={{ color: "var(--muted)" }}>Plant: {plant} · Filtered to current plant</div>
          </div>
          <Button onClick={doExport} data-tooltip="Download data in selected format" data-tooltip-pos="left" className="t-body-sm h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
            <Download size={14} /> Export
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Reports Module
// ============================================================
function ReportsModule({ plant }: { plant: string }) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const reports = [
    { key: "inspection", label: "Inspection Result Report", desc: "Per-inspection detailed report with characteristics, values, limits, result", icon: ClipboardCheck, category: "Operational" },
    { key: "ncr", label: "Nonconformance Report", desc: "NCR with containment, root cause, CAPA, closure evidence", icon: AlertTriangle, category: "Quality" },
    { key: "genealogy", label: "Product Genealogy Pack", desc: "Full material and process history for a HTU", icon: Network, category: "Traceability" },
    { key: "kpi", label: "Quality KPI Summary", desc: "FPY, defect Pareto, NCR aging, route summary", icon: BarChart3, category: "Management" },
    { key: "fpy", label: "First Pass Yield Report", desc: "Stage-wise FPY with trend, target variance, top failures", icon: Target, category: "Quality" },
    { key: "defect-pareto", label: "Defect Pareto Report", desc: "80/20 analysis, cumulative %, top 5 defects with CAPA status", icon: BarChart2, category: "Quality" },
    { key: "ncr-aging", label: "NCR Aging Report", desc: "Open NCRs by age bucket, overdue CAPA, escalation status", icon: Clock, category: "Quality" },
    { key: "capa-tracking", label: "CAPA Tracking Report", desc: "All CAPAs with owner, due date, effectiveness verification", icon: ShieldCheck, category: "Quality" },
    { key: "calibration", label: "Calibration Status Report", desc: "Equipment calibration due/overdue, instrument validity", icon: Wrench, category: "Compliance" },
    { key: "supplier-quality", label: "Supplier Quality Report", desc: "Incoming material acceptance, supplier NCRs, MTC compliance", icon: Package, category: "Supply Chain" },
    { key: "audit-findings", label: "Audit Findings Report", desc: "Internal audit findings, severity, closure status, evidence", icon: FileCheck2, category: "Governance" },
    { key: "copq-summary", label: "COPQ Summary Report", desc: "Cost of poor quality by category, trend, top cost drivers", icon: CircleDashed, category: "Financial" },
    { key: "wip-status", label: "WIP & Job Order Status", desc: "Work-in-progress by stage, bottlenecks, overdue jobs", icon: Boxes, category: "Production" },
    { key: "doc-revision", label: "Document Revision Report", desc: "Controlled documents with revision history, effective dates", icon: FileText, category: "Governance" },
  ];

  const generateReport = async (key: string) => {
    setSelectedReport(key);
    if (key === "kpi" || key === "fpy" || key === "defect-pareto" || key === "copq-summary" || key === "wip-status") {
      const [dash] = await Promise.all([fetch(`/api/dashboard?plant=${plant}`).then(r => r.json())]);
      setReportData({ dash });
    } else if (key === "inspection") {
      const d = await fetch(`/api/inspections?plant=${plant}&limit=20`).then(r => r.json());
      setReportData({ inspections: d.records || [] });
    } else if (key === "ncr" || key === "ncr-aging" || key === "capa-tracking") {
      const d = await fetch(`/api/ncrs?plant=${plant}`).then(r => r.json());
      setReportData({ ncrs: d.ncrs || [] });
    } else if (key === "genealogy") {
      const d = await fetch(`/api/traceability?plant=${plant}`).then(r => r.json());
      setReportData({ genealogies: d.genealogies || [] });
    } else if (key === "calibration" || key === "supplier-quality" || key === "audit-findings" || key === "doc-revision") {
      // These reports use sample/static data for now
      setReportData({ static: true, type: key });
    }
  };

  const groupedReports = useMemo(() => {
    const g: Record<string, typeof reports> = {};
    for (const r of reports) {
      if (!g[r.category]) g[r.category] = [];
      g[r.category].push(r);
    }
    return g;
  }, []);

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        subtitle="14 printable report templates across 7 categories. Every report uses the Hi-Tech Radiators ReportHeader with Hi-Tech logo, document ID, and traceable metadata. Use browser print to save as PDF."
        info="Pick a report category, choose the specific report type, then click Generate. The report opens in a preview panel on the right. Use the Print / Save PDF button to send it to a printer or save it as a PDF file."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{reports.length} TEMPLATES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{Object.keys(groupedReports).length} CATEGORIES</span>
          </>
        }
      />
      <div className="p-5 md:p-10 space-y-6">
        {Object.entries(groupedReports).map(([category, catReports]) => (
          <div key={category}>
            <SectionHeader number={String(Object.keys(groupedReports).indexOf(category) + 1).padStart(2, "0")} title={category} subtitle={`${catReports.length} report template${catReports.length > 1 ? "s" : ""}`} />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {catReports.map((r) => {
                const Icon = r.icon;
                const active = selectedReport === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => generateReport(r.key)}
                    className="flex items-start gap-3 text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                    style={{
                      border: `1px solid ${active ? "var(--primary)" : "var(--hairline)"}`,
                      backgroundColor: active ? "var(--canvas-soft)" : "var(--surface-card)",
                    }}
                  >
                    <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: active ? "var(--primary)" : "var(--canvas-soft)" }}>
                      <Icon size={16} style={{ color: active ? "var(--on-primary)" : "var(--ink)" }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.label}</div>
                      <div className="t-label mt-1" style={{ color: "var(--muted)" }}>{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Report opens in a drawer (Sheet) instead of at the bottom */}
        <Sheet open={!!selectedReport && !!reportData} onOpenChange={(open) => { if (!open) { setSelectedReport(null); setReportData(null); } }}>
          <SheetContent side="right" className="w-full md:w-[55vw] md:max-w-[900px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
            <SheetHeader className="px-6 pt-6 pb-3 border-b no-print sticky top-0 z-10" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
              <div className="flex items-center justify-between">
                <SheetTitle className="t-title-sm" style={{ color: "var(--ink)" }}>Report Preview</SheetTitle>
                <Button onClick={() => window.print()} className="t-body-sm h-9 px-4 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                  <Printer size={14} /> Print / Save PDF
                </Button>
              </div>
            </SheetHeader>
            <div className="print-area p-6">
              {selectedReport && reportData && <ReportView type={selectedReport} data={reportData} plant={plant} />}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}

function ReportView({ type, data, plant }: { type: string; data: any; plant: string }) {
  const now = new Date().toLocaleString("en-GB");
  const reportTitles: Record<string, string> = {
    "inspection": "Inspection Result Report",
    "ncr": "Nonconformance Report",
    "genealogy": "Product Genealogy Pack",
    "kpi": "Quality KPI Summary",
    "fpy": "First Pass Yield Report",
    "defect-pareto": "Defect Pareto Report",
    "ncr-aging": "NCR Aging Report",
    "capa-tracking": "CAPA Tracking Report",
    "calibration": "Calibration Status Report",
    "supplier-quality": "Supplier Quality Report",
    "audit-findings": "Audit Findings Report",
    "copq-summary": "COPQ Summary Report",
    "wip-status": "WIP & Job Order Status",
    "doc-revision": "Document Revision Report",
  };
  const reportTitle = reportTitles[type] || "Report";
  const reportSubtitles: Record<string, string> = {
    "inspection": "Per-inspection detail with characteristics, values, and results",
    "ncr": "Nonconformance with containment, root cause, and CAPA",
    "genealogy": "Full material and process history by HTU",
    "kpi": "Plant-wide quality KPI summary",
    "fpy": "Stage-wise First Pass Yield with target variance",
    "defect-pareto": "80/20 analysis with cumulative percentage",
    "ncr-aging": "Open NCRs by age bucket and escalation status",
    "capa-tracking": "All CAPAs with owner, due date, effectiveness",
    "calibration": "Equipment calibration due and overdue status",
    "supplier-quality": "Incoming material acceptance and supplier NCRs",
    "audit-findings": "Internal audit findings with closure status",
    "copq-summary": "Cost of poor quality by category with trend",
    "wip-status": "Work-in-progress by stage with bottlenecks",
    "doc-revision": "Controlled documents with revision history",
  };
  return (
    <div style={{ color: "var(--ink)" }}>
      <ReportHeader
        title={reportTitle}
        subtitle={reportSubtitles[type] || "Hi-Tech Radiators Pvt. Ltd. · Khopoli"}
        meta={[
          { label: "Plant", value: plant },
          { label: "Generated", value: now },
          { label: "Generated By", value: typeof window !== "undefined" ? (localStorage.getItem("hive-user-name") || "System") : "System" },
          { label: "Document", value: `HT-${type.toUpperCase()}-${new Date().toISOString().slice(0,10)}` },
          { label: "Status", value: "Uncontrolled copy" },
        ]}
      />

      {/* KPI / FPY / Defect Pareto / COPQ / WIP - all use dashboard data */}
      {(type === "kpi" || type === "fpy" || type === "defect-pareto" || type === "copq-summary" || type === "wip-status") && data.dash && (
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>Quality Overview</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <tbody>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>First-Pass Yield</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontWeight: 600, fontSize: 13, textAlign: "right" }}>{data.dash.quality.firstPassYield}%</td></tr>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>Completed / Planned</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontSize: 13, textAlign: "right" }}>{data.dash.quality.completed} / {data.dash.quality.planned}</td></tr>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>Open NCRs</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontSize: 13, textAlign: "right" }}>{data.dash.risk.openNcrs} ({data.dash.risk.criticalNcrs} critical)</td></tr>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>Inspections Today</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontSize: 13, textAlign: "right" }}>{data.dash.quality.inspectionsToday} ({data.dash.quality.failedInspectionsToday} failures)</td></tr>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>Material Holds</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontSize: 13, textAlign: "right" }}>{data.dash.operations.materialHolds}</td></tr>
              <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", color: "var(--muted)", fontSize: 12 }}>Overdue Calibrations</td><td style={{ padding: "6px 8px", borderBottom: "1px solid var(--hairline)", fontSize: 13, textAlign: "right" }}>{data.dash.operations.overdueCalibrations}</td></tr>
            </tbody>
          </table>
          {data.dash.pareto?.length > 0 && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>Defect Pareto</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Defect</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Count</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Cum %</th>
                </tr></thead>
                <tbody>
                  {data.dash.pareto.map((p: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "6px 8px", fontSize: 12 }}>{p.defect}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{p.count}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{p.cumPct.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {type === "copq-summary" && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>COPQ Summary - October 2026</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Category</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Amount (INR)</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>% of Total</th>
                </tr></thead>
                <tbody>
                  {[["Internal Failure", 19060], ["External Failure", 102500], ["Appraisal", 151300], ["Prevention", 59000]].map(([cat, amt]) => {
                    const total = 19060 + 102500 + 151300 + 59000;
                    return (
                      <tr key={cat as string} style={{ borderBottom: "1px solid var(--hairline)" }}>
                        <td style={{ padding: "6px 8px", fontSize: 12 }}>{cat}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>₹{amt.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{((amt as number) / total * 100).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                  <tr style={{ borderTop: "1px solid var(--primary)", fontWeight: 600 }}>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>Grand Total</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>₹3,31,860</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>100.0%</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
          {type === "wip-status" && (
            <>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--muted)" }}>WIP by Stage</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Stage</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Units in WIP</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Avg Age (hrs)</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>Overdue</th>
                </tr></thead>
                <tbody>
                  {[
                    ["S01 Rolling", 24, 6, 0], ["S04 Seam Weld", 18, 12, 1],
                    ["S11 Erection", 15, 18, 2], ["S12 MAG", 22, 24, 3],
                    ["S14 Leak Test", 12, 8, 1], ["S27 Paint", 16, 36, 2],
                  ].map(([stage, units, age, overdue]) => (
                    <tr key={stage as string} style={{ borderBottom: "1px solid var(--hairline)" }}>
                      <td style={{ padding: "6px 8px", fontSize: 12 }}>{stage}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{units}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12 }}>{age}</td>
                      <td style={{ padding: "6px 8px", textAlign: "right", fontSize: 12, color: (overdue as number) > 0 ? "var(--semantic-error)" : "var(--ink)" }}>{overdue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* Inspection report */}
      {type === "inspection" && data.inspections && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
            {["Record","Stage","WO","HTU","Inspector","Operator","Result","Date","Recorded"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.inspections.map((r: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{r.recordNo}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{r.stage?.name}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{r.workOrder?.woNumber}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{r.htuNo}</td>
                <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 500 }}>{r.inspector}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{r.operator || "-"}</td>
                <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600, color: r.overallResult === "Pass" ? "var(--semantic-success)" : r.overallResult === "Fail" ? "var(--semantic-error)" : "var(--semantic-warn)" }}>{r.overallResult}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{fmtDate(r.inspectedAt)}</td>
                <td style={{ padding: "6px 8px", fontSize: 12, color: "var(--muted)" }}>{r.inspector} {fmtDate(r.inspectedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* NCR / NCR Aging / CAPA Tracking reports */}
      {(type === "ncr" || type === "ncr-aging" || type === "capa-tracking") && data.ncrs && (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
              {["NCR","Defect","Severity","WO","HTU","Status","Owner","Recorded By","Due","Date"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {data.ncrs.map((n: any, i: number) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.ncrNumber}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.defectCategory}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600, color: n.severity === "Critical" ? "var(--semantic-error)" : n.severity === "Major" ? "var(--semantic-warn)" : "var(--ink)" }}>{n.severity}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.workOrder?.woNumber}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.htuno}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.status}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.capaOwner || "-"}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 500 }}>{n.inspection?.inspector || n.capaOwner || "Auto-generated"}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12 }}>{n.dueDate ? fmtDate(n.dueDate) : "-"}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "var(--muted)" }}>{fmtDate(n.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {type === "ncr-aging" && (
            <div style={{ marginTop: 16, padding: 12, border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12, color: "var(--muted)" }}>
              <strong style={{ color: "var(--ink)" }}>Aging buckets:</strong> 0-7 days: {data.ncrs.filter((n: any) => n.status !== "Closed").length} open · 8-30 days: 3 · 31+ days: 1 (overdue CAPA)
            </div>
          )}
          {type === "capa-tracking" && (
            <div style={{ marginTop: 16, padding: 12, border: "1px solid var(--hairline)", borderRadius: 4, fontSize: 12, color: "var(--muted)" }}>
              <strong style={{ color: "var(--ink)" }}>CAPA Summary:</strong> Total: {data.ncrs.length} · Closed: {data.ncrs.filter((n: any) => n.status === "Closed").length} · Effectiveness verified: {data.ncrs.filter((n: any) => n.effectivenessVerified).length} · Pending verification: {data.ncrs.filter((n: any) => n.status === "Closed" && !n.effectivenessVerified).length}
            </div>
          )}
        </div>
      )}

      {/* Genealogy report */}
      {type === "genealogy" && data.genealogies && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
            {["HTU","WO","Customer","Coil","Wire","DFT","Released"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {data.genealogies.map((g: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <td style={{ padding: "6px 8px", fontSize: 12, fontWeight: 600 }}>{g.htuno}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{g.workOrder?.woNumber}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{g.workOrder?.customer}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{g.coilMake}/{g.coilNumber}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{g.weldingWireBatch}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{g.finalDft ? `${g.finalDft.toFixed(0)} µ` : "-"}</td>
                <td style={{ padding: "6px 8px", fontSize: 12 }}>{fmtDate(g.releaseDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Static-data reports: calibration, supplier, audit, doc-revision */}
      {data.static && (
        <div>
          <div style={{ padding: 16, border: "1px solid var(--hairline)", borderRadius: 4, backgroundColor: "var(--canvas-soft)", marginBottom: 16, fontSize: 12, color: "var(--muted)" }}>
            <strong style={{ color: "var(--ink)" }}>Note:</strong> This report template is configured. Live data integration requires the corresponding API endpoint. The structure below shows the expected output format.
          </div>
          {type === "calibration" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                {["Instrument","ID","Location","Last Cal","Next Cal","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["Micrometer", "MIC-101", "S01 Rolling", "2026-07-15", "2027-01-15", "Calibrated"],
                  ["Vernier Caliper", "VC-202", "S06 Edge", "2026-08-20", "2027-02-20", "Calibrated"],
                  ["Weld Checker", "WC-301", "S12 MAG", "2026-09-10", "2026-11-10", "Due Soon"],
                  ["DFT Gauge", "DFT-401", "S27 Paint", "2026-06-05", "2026-10-05", "Overdue"],
                ].map(([inst, id, loc, last, next, status]) => (
                  <tr key={id} style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{inst}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{id}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{loc}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{last}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{next}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: status === "Overdue" ? "var(--semantic-error)" : status === "Due Soon" ? "var(--semantic-warn)" : "var(--semantic-success)" }}>{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {type === "supplier-quality" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                {["Supplier","Material","Lots Recd","Accepted","Rejected","Acceptance %"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["Jindal Steel", "MS Sheet IS 2062", 12, 11, 1, 91.7],
                  ["SAIL", "MS Sheet IS 2062", 8, 8, 0, 100.0],
                  ["Outokumpu", "SS Sheet IS 6911", 6, 5, 1, 83.3],
                  ["Local Vendor A", "Welding Wire", 15, 13, 2, 86.7],
                ].map(([sup, mat, recd, acc, rej, pct]) => (
                  <tr key={sup as string} style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{sup}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{mat}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, textAlign: "right" }}>{recd}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, textAlign: "right" }}>{acc}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, textAlign: "right" }}>{rej}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, textAlign: "right", fontWeight: 600, color: (pct as number) >= 90 ? "var(--semantic-success)" : (pct as number) >= 85 ? "var(--semantic-warn)" : "var(--semantic-error)" }}>{(pct as number).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {type === "audit-findings" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                {["Ref","Programme","Finding","Severity","Status"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["AF-2026-001", "IA-2026-Q1", "First-piece inspection record missing for WO-3018", "Major", "CAPA-Open"],
                  ["AF-2026-002", "IA-2026-Q1", "SOP Rev.09 not available at workstation", "Minor", "Verified"],
                  ["AF-2026-003", "IA-2026-PRC", "WPS not displayed at weld station", "Major", "Open"],
                  ["AF-2026-004", "IA-2026-INCOMING", "Material Test Certificate missing for 3 MS lots", "Critical", "Investigating"],
                ].map(([ref, prog, find, sev, stat]) => (
                  <tr key={ref as string} style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{ref}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{prog}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{find}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: sev === "Critical" ? "var(--semantic-error)" : sev === "Major" ? "var(--semantic-warn)" : "var(--ink)" }}>{sev}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{stat}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {type === "doc-revision" && (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ borderBottom: "1px solid var(--primary)" }}>
                {["Doc ID","Title","Rev","Status","Owner","Effective"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", fontSize: 11, color: "var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[
                  ["QCI/F/02/01", "Rolling & Forming Checklist", "Rev.05", "Released", "Sneha Patel", "2026-08-15"],
                  ["QCI/F/05/08", "Leak Testing Checklist", "Rev.03", "Released", "Priya Kulkarni", "2026-09-01"],
                  ["QCI/F/05/04", "MAG Welding Checklist", "Rev.03", "Released", "Rahul Desai", "2026-07-20"],
                  ["QCI/F/06/04", "Primer & Paint Checklist", "Rev.04", "Draft", "Amit Shah", "-"],
                ].map(([id, title, rev, stat, owner, eff]) => (
                  <tr key={id as string} style={{ borderBottom: "1px solid var(--hairline)" }}>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{id}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{title}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{rev}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{stat}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{owner}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12 }}>{eff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px solid var(--hairline)", fontSize: 10, color: "var(--muted-soft)" }}>
        Hi-Tech Radiators Pvt. Ltd. · Khopoli · This is an uncontrolled copy generated from Hi-Tech Radiators. Refer to the system for the current controlled record. Document ID: HT-{type.toUpperCase()}-{new Date().toISOString().slice(0,10)}
      </div>
    </div>
  );
}

// ============================================================
// Sales Orders Module - ERP demand view
// ============================================================
function SalesOrdersModule({ plant }: { plant: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSO, setExpandedSO] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/sales-orders?plant=${plant}`).then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [plant]);

  const allOrders: any[] = data?.salesOrders || [];
  const filtered = useMemo(() => {
    let list = allOrders;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.soNumber?.toLowerCase().includes(q) ||
        o.poNumber?.toLowerCase().includes(q) ||
        o.customer?.toLowerCase().includes(q) ||
        o.itemName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allOrders, search]);

  const summary = data?.summary || { totalOrders: 0, totalOrdered: 0, totalCompleted: 0, totalPending: 0, totalRejected: 0, totalRework: 0, fulfillmentRate: 0 };

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Production · ERP Demand"
        title="Sales Orders"
        subtitle="Customer PO -> SO -> linked Work Orders. Fulfilment calculated from accepted production units."
        helpId="so.number"
        info="A Sales Order (SO) is a customer request for goods. A single SO may require several Work Orders (WOs) for different products, routes, or batches. Click any SO row to expand and see all linked WOs with their individual status, inspection, NCR, and HTU counts."
      />
      <div className="p-4 md:p-8 space-y-4">
        {/* Summary cards - SO level metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          <StatCard label="Total SOs" value={summary.totalOrders} sublabel={`${summary.totalWOs || 0} linked WOs`} tone="neutral" icon={<ShoppingCart size={15} />} />
          <StatCard label="Ordered" value={summary.totalOrdered} sublabel="Total units demanded" tone="neutral" icon={<Target size={15} />} />
          <StatCard label="Completed" value={summary.totalCompleted} sublabel="Accepted & released" tone="ok" icon={<CheckCircle2 size={15} />} />
          <StatCard label="Rejected" value={summary.totalRejected} sublabel="Scrapped units" tone="risk" icon={<XCircle size={15} />} />
          <StatCard label="Pending" value={summary.totalPending} sublabel="Awaiting production" tone={summary.totalPending > 0 ? "warn" : "ok"} icon={<Clock size={15} />} />
          <StatCard label="Fulfilment" value={`${summary.fulfillmentRate}%`} sublabel="Completed / Ordered" tone={summary.fulfillmentRate >= 75 ? "ok" : summary.fulfillmentRate >= 50 ? "warn" : "risk"} icon={<TrendingUp size={15} />} />
        </div>

        {/* Formula explanation */}
        <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
          <InfoTooltip text="Fulfilment Rate = Completed Qty / Ordered Qty x 100. Pending Qty = Ordered Qty - Completed Qty - Rejected Qty." size={12} />
          <span className="t-label" style={{ color: "var(--muted)" }}>
            Pending = Ordered - Completed - Rejected. Fulfilment = Completed / Ordered x 100.
          </span>
        </div>

        <FilterBar count={filtered.length}>
          <Filter size={13} style={{ color: "var(--muted)" }} />
          <SearchInput value={search} onChange={setSearch} placeholder="Search SO, PO, customer..." className="w-72" />
        </FilterBar>

        {loading ? <LoadingBlock label="Loading sales orders..." /> : (
          <div className="space-y-2">
            {filtered.map((so) => {
              const isExpanded = expandedSO === so.soNumber || (expandedSO === `NO-SO` && !so.soNumber);
              return (
                <div key={so.srNo} className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                  {/* SO header row (clickable to expand) */}
                  <button
                    onClick={() => setExpandedSO(isExpanded ? null : (so.soNumber || "NO-SO"))}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--canvas-soft)]"
                  >
                    <ChevronRight size={16} className="shrink-0 transition-transform" style={{ color: "var(--muted)", transform: isExpanded ? "rotate(90deg)" : "none" }} />
                    {/* SO Number + Date */}
                    <div className="w-32 shrink-0">
                      <div className="t-body-sm font-medium t-code" style={{ color: "var(--ink)" }}>{so.soNumber || "No SO"}</div>
                      <div className="t-label" style={{ color: "var(--muted)" }}>{so.soDate}</div>
                    </div>
                    {/* Customer + Item */}
                    <div className="flex-1 min-w-0">
                      <div className="t-body-sm truncate" style={{ color: "var(--ink)" }}>{so.customer}</div>
                      <div className="t-label truncate" style={{ color: "var(--muted)" }}>{so.itemName} - {so.size}</div>
                    </div>
                    {/* PO Number */}
                    <div className="hidden md:block w-28 shrink-0">
                      <div className="t-label" style={{ color: "var(--muted)" }}>PO</div>
                      <div className="t-code t-body-sm truncate" style={{ color: "var(--ink)" }}>{so.poNumber || "-"}</div>
                    </div>
                    {/* Quantities */}
                    <div className="hidden lg:flex items-center gap-4 shrink-0">
                      <div className="text-center w-14">
                        <div className="t-label" style={{ color: "var(--muted)" }}>Ordered</div>
                        <div className="t-body-sm t-num" style={{ color: "var(--ink)" }}>{so.orderedQty}</div>
                      </div>
                      <div className="text-center w-14">
                        <div className="t-label" style={{ color: "var(--muted)" }}>Done</div>
                        <div className="t-body-sm t-num" style={{ color: "var(--semantic-success)" }}>{so.completedQty}</div>
                      </div>
                      <div className="text-center w-14">
                        <div className="t-label" style={{ color: "var(--muted)" }}>Rej</div>
                        <div className="t-body-sm t-num" style={{ color: "var(--semantic-error)" }}>{so.rejectedQty}</div>
                      </div>
                      <div className="text-center w-14">
                        <div className="t-label" style={{ color: "var(--muted)" }}>Pend</div>
                        <div className="t-body-sm t-num" style={{ color: "#8a6835" }}>{so.pendingQty}</div>
                      </div>
                    </div>
                    {/* Fulfilment */}
                    <div className="w-20 shrink-0 text-right">
                      <div className="t-body-sm t-num font-medium" style={{ color: so.fulfilmentRate >= 75 ? "var(--semantic-success)" : so.fulfilmentRate >= 50 ? "#8a6835" : "var(--semantic-error)" }}>
                        {so.fulfilmentRate}%
                      </div>
                      <div className="h-1 rounded-full overflow-hidden mt-1" style={{ backgroundColor: "var(--hairline)" }}>
                        <div className="h-full rounded-full" style={{ width: `${so.fulfilmentRate}%`, backgroundColor: so.fulfilmentRate >= 75 ? "var(--semantic-success)" : "#8a6835" }} />
                      </div>
                    </div>
                    {/* Status */}
                    <div className="shrink-0">
                      <StatusBadge status={so.status} size="xs" />
                    </div>
                    {/* WO count */}
                    <div className="shrink-0 w-16 text-right">
                      <div className="t-label" style={{ color: "var(--muted)" }}>WOs</div>
                      <div className="t-body-sm t-num" style={{ color: "var(--primary)", fontWeight: 600 }}>{so.woCount}</div>
                    </div>
                  </button>

                  {/* Expanded: linked WOs */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                      <div className="p-4">
                        <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Linked Work Orders ({so.linkedWOs?.length || 0})</div>
                        <div className="space-y-1.5">
                          {(so.linkedWOs || []).map((wo: any) => (
                            <div key={wo.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                              <div className="w-28 shrink-0">
                                <div className="t-body-sm t-code font-medium" style={{ color: "var(--primary)" }}>{wo.woNumber}</div>
                                <div className="t-label" style={{ color: "var(--muted)" }}>{wo.routeCode}</div>
                              </div>
                              <div className="flex-1 flex items-center gap-3">
                                <StatusBadge status={wo.status} size="xs" />
                                <span className="t-label" style={{ color: "var(--muted)" }}>{wo.completedQty}/{wo.plannedQty} units</span>
                                <span className="t-code t-label" style={{ color: "var(--primary)" }}>{wo.inspectionCount} insp</span>
                                <span className="t-code t-label" style={{ color: wo.ncrCount ? "var(--semantic-error)" : "var(--muted)" }}>{wo.ncrCount} NCR</span>
                                {wo.reworkJobCount > 0 && <span className="t-code t-label" style={{ color: "#8a6835" }}>{wo.reworkJobCount} rework</span>}
                                {wo.htuCount > 0 && <span className="t-code t-label" style={{ color: "var(--ht-slate-blue)" }}>{wo.htuCount} HTU</span>}
                                {wo.materialStatus !== "Available" && <StatusBadge status={wo.materialStatus} size="xs" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && <EmptyState message="No sales orders found." />}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// STANDARDS & COMPLIANCE - Manufacturing codes that govern Hi-Tech Radiators
// ============================================================
type Standard = {
  code: string;
  title: string;
  body: string;
  scope: string;
  application: string;
  category: "welding" | "material" | "coating" | "transformer" | "qms" | "dimensional" | "testing";
};

const STANDARDS: Standard[] = [
  // --- Welding ---
  { code: "AWS D1.1/D1.1M", title: "Structural Welding Code - Steel", body: "American Welding Society", scope: "Welded joints in carbon and low-alloy steel structures. WPS, PQR, WPQ qualification, inspection acceptance criteria.", application: "MAG welding of radiator assembly (S11, S12). Fin-to-header welds. Erection welds.", category: "welding" },
  { code: "AWS D1.6/D1.6M", title: "Structural Welding Code - Stainless Steel", body: "American Welding Society", scope: "Welding of austenitic stainless steel structural assemblies. Dissimilar metal welds.", application: "K2 stainless steel radiator route. TIG welding of stainless fins and headers (S07).", category: "welding" },
  { code: "ASME BPVC Section IX", title: "Welding, Brazing and Fusing Qualifications", body: "American Society of Mechanical Engineers", scope: "WPS/PQR/WPQ qualification rules. Essential, supplementary essential, and non-essential variables.", application: "Welder performance qualification. Welding procedure records referenced in WPS VAA/HTR/CS/WPS.", category: "welding" },
  { code: "ISO 3834-2", title: "Quality Requirements for Fusion Welding - Comprehensive", body: "International Organization for Standardization", scope: "Quality requirements for fusion welding of metallic materials. Designer, manufacturer, and welder responsibilities.", application: "Welding quality management across fin fabrication, header, and assembly stages.", category: "welding" },
  { code: "IS 816", title: "Code of Practice for Use of Metal Arc Welding for General Structural Purposes", body: "Bureau of Indian Standards", scope: "Mild steel structural welds. Workmanship, supervision, inspection, acceptance.", application: "Mild steel radiator fabrication (K1, K3). MAG welding of fins and headers.", category: "welding" },
  { code: "IS 817", title: "Code of Practice for Training and Testing of Metal Arc Welders", body: "Bureau of Indian Standards", scope: "Welder training, testing, and certification. Skill grades.", application: "Welder qualification at Hi-Tech Radiators. Operator performance records.", category: "welding" },
  { code: "IS 9595", title: "Metal Arc Welding of Carbon and Carbon-Manganese Steels - Recommendations", body: "Bureau of Indian Standards", scope: "Welding procedure, consumables, joint preparation, quality.", application: "MAG and MMAW welding of MS radiator components.", category: "welding" },

  // --- Material ---
  { code: "IS 2062", title: "Hot Rolled Medium and High Tensile Structural Steel", body: "Bureau of Indian Standards", scope: "Steel plates, sheets, sections for structural purposes. Grades E250/E350.", application: "Mild steel sheet stock for K1/K3 radiator fins and plates.", category: "material" },
  { code: "IS 6911", title: "Stainless Steel Plate, Sheet and Strip", body: "Bureau of Indian Standards", scope: "Austenitic stainless steel grades 304, 304L, 316, 316L.", application: "Stainless steel sheet stock for K2 radiator route.", category: "material" },
  { code: "ASTM A36/A36M", title: "Carbon Structural Steel", body: "ASTM International", scope: "Carbon steel shapes, plates, and bars for structural applications.", application: "Radiator structural components, headers, brackets.", category: "material" },
  { code: "ASTM A240/A240M", title: "Chromium and Chromium-Nickel Stainless Steel Plate, Sheet and Strip", body: "ASTM International", scope: "Heat-resisting and general-purpose stainless steels.", application: "Stainless steel radiator bodies (K2).", category: "material" },

  // --- Coating ---
  { code: "IS 3203", title: "Hot-Dip Zinc Coatings on Mild Steel Tubes", body: "Bureau of Indian Standards", scope: "Hot-dip galvanizing requirements. Coating mass, adhesion, uniformity.", application: "HDG route (S18). Coating thickness verification at final inspection.", category: "coating" },
  { code: "ASTM A123/A123M", title: "Zinc (Hot-Dip Galvanized) Coatings on Iron and Steel Products", body: "ASTM International", scope: "Zinc coating requirements on structural steel products. Coating thickness, adhesion, finish.", application: "HDG 70/80 micron coating verification per customer spec.", category: "coating" },
  { code: "IS 14246", title: "Hot-Dip Galvanized Coatings on Structural Steel", body: "Bureau of Indian Standards", scope: "Galvanized coating thickness, surface finish, adhesion tests.", application: "HDG pretreatment and galvanizing stages (S15-S19).", category: "coating" },
  { code: "ISO 12944", title: "Paints and Varnishes - Corrosion Protection of Steel Structures", body: "International Organization for Standardization", scope: "Protective paint systems for steel structures. Durability, environment categories.", application: "MIO and PU paint systems for painted radiator route (S27-S33).", category: "coating" },

  // --- Transformer / Radiator specific ---
  { code: "IEC 60076-1", title: "Power Transformers - Part 1: General", body: "International Electrotechnical Commission", scope: "General requirements for power transformers. Includes radiator connection, fittings, pressure tests.", application: "Radiator-to-tank interface. Flange dimensions, fitting tolerances.", category: "transformer" },
  { code: "IEC 60076-22-1", title: "Power Transformers - Part 22-1: Fittings - Radiators", body: "International Electrotechnical Commission", scope: "Specification for transformer radiator fittings. Dimensions, leak testing, pressure.", application: "Leak testing (S14). Radiator pressure test acceptance criteria.", category: "transformer" },
  { code: "IS 2026-1", title: "Power Transformers - Part 1: General", body: "Bureau of Indian Standards", scope: "Indian adoption of IEC 60076-1. General transformer requirements.", application: "Customer drawing references. Transformer radiator compliance.", category: "transformer" },

  // --- Quality Management ---
  { code: "ISO 9001:2015", title: "Quality Management Systems - Requirements", body: "International Organization for Standardization", scope: "QMS requirements. Clauses 4-10. Risk-based thinking, process approach.", application: "Hi-Tech Radiators QMS architecture. Document control, NCR/CAPA, internal audit, management review.", category: "qms" },
  { code: "ISO 9000:2015", title: "Quality Management Systems - Fundamentals and Vocabulary", body: "International Organization for Standardization", scope: "Quality vocabulary, fundamental concepts, principles.", application: "Terminology used throughout Hi-Tech Radiators: NCR, CAPA, characteristic, CTQ.", category: "qms" },
  { code: "IATF 16949", title: "Quality Management System for Automotive Production", body: "International Automotive Task Force", scope: "QMS for automotive production and service parts organizations. Customer-specific requirements.", application: "Applicable when customer drawings cite automotive-grade radiator requirements.", category: "qms" },

  // --- Dimensional / Metrology ---
  { code: "ISO 2768-1", title: "General Tolerances - Linear Dimensions", body: "International Organization for Standardization", scope: "General tolerances for linear dimensions without individual tolerance indications.", application: "Default tolerances on radiator dimensions. Fine (f), medium (m), coarse (c).", category: "dimensional" },
  { code: "ISO 2768-2", title: "General Tolerances - Geometrical Tolerances", body: "International Organization for Standardization", scope: "General geometrical tolerances (perpendicularity, straightness, etc.).", application: "Fin flatness, plate perpendicularity, header alignment.", category: "dimensional" },
  { code: "IS 2289", title: "Vernier Callipers - Specification", body: "Bureau of Indian Standards", scope: "Specification for vernier callipers.", application: "Calibration of vernier callipers used at S02, S06, S09.", category: "dimensional" },
  { code: "ISO 17025", title: "General Requirements for the Competence of Testing and Calibration Laboratories", body: "International Organization for Standardization", scope: "Laboratory competence. Calibration and testing.", application: "Calibration lab records. MSA studies on measuring equipment.", category: "dimensional" },

  // --- Testing / NDT ---
  { code: "ASME Section V", title: "Nondestructive Examination", body: "American Society of Mechanical Engineers", scope: "Methods for NDT: visual, penetrant, magnetic particle, radiography, ultrasonic.", application: "Visual inspection (S14). Weld inspection methods. NDT plan.", category: "testing" },
  { code: "ISO 3452-1", title: "Non-Destructive Testing - Penetrant Testing - Principles", body: "International Organization for Standardization", scope: "Dye penetrant testing principles and methodology.", application: "Weld surface inspection on critical radiator welds.", category: "testing" },
  { code: "IS 7720", title: "Non-Destructive Testing - Penetrant Testing - Principles", body: "Bureau of Indian Standards", scope: "Indian adoption of penetrant testing principles.", application: "Surface crack detection on MAG welds.", category: "testing" },
];

const STANDARD_CATEGORIES: { key: Standard["category"]; label: string; icon: any; desc: string }[] = [
  { key: "welding", label: "Welding & Procedure", icon: Flame, desc: "AWS, ASME IX, ISO 3834, IS 816/817" },
  { key: "material", label: "Material Specification", icon: Layers3, desc: "IS 2062, IS 6911, ASTM A36/A240" },
  { key: "coating", label: "Coating & Galvanizing", icon: Droplets, desc: "IS 3203, ASTM A123, ISO 12944" },
  { key: "transformer", label: "Transformer Radiator", icon: BookOpen, desc: "IEC 60076, IS 2026" },
  { key: "qms", label: "Quality Management", icon: ShieldCheck, desc: "ISO 9001:2015, ISO 9000, IATF" },
  { key: "dimensional", label: "Dimensional & Metrology", icon: Ruler, desc: "ISO 2768, ISO 17025, IS 2289" },
  { key: "testing", label: "Testing & NDT", icon: Beaker, desc: "ASME V, ISO 3452, IS 7720" },
];

function StandardsModule() {
  const [filter, setFilter] = useState<Standard["category"] | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Standard | null>(null);

  const filtered = STANDARDS.filter(s => {
    if (filter !== "all" && s.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.body.toLowerCase().includes(q) || s.application.toLowerCase().includes(q);
    }
    return true;
  });

  const byCategory = STANDARD_CATEGORIES.map(c => ({ ...c, count: STANDARDS.filter(s => s.category === c.key).length }));

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Reference Library"
        title="Standards & Compliance"
        subtitle="The engineering codes that govern transformer radiator manufacturing at Hi-Tech Radiators. Every inspection, every weld, every release cites a revision from this library."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{STANDARDS.length} STANDARDS</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{STANDARD_CATEGORIES.length} CATEGORIES</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-8">
        {/* Category cards */}
        <div>
          <SectionHeader number="01" title="Categories" subtitle="Browse by domain" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <button
              onClick={() => setFilter("all")}
              className="text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
              style={{ border: "1px solid var(--hairline)", backgroundColor: filter === "all" ? "var(--primary)" : "var(--surface-card)", color: filter === "all" ? "var(--on-primary)" : "var(--ink)" }}
            >
              <BookOpen size={18} className="mb-3" style={{ color: filter === "all" ? "var(--on-primary)" : "var(--primary)" }} />
              <div className="t-title-sm">All Standards</div>
              <div className="t-label mt-1" style={{ color: filter === "all" ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>{STANDARDS.length} entries</div>
            </button>
            {byCategory.map((c) => {
              const Icon = c.icon;
              const active = filter === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setFilter(c.key)}
                  className="text-left p-4 rounded-md transition-colors hover:bg-[var(--canvas-soft)]"
                  style={{ border: "1px solid var(--hairline)", backgroundColor: active ? "var(--primary)" : "var(--surface-card)", color: active ? "var(--on-primary)" : "var(--ink)" }}
                >
                  <Icon size={18} className="mb-3" style={{ color: active ? "var(--on-primary)" : "var(--primary)" }} />
                  <div className="t-title-sm">{c.label}</div>
                  <div className="t-label mt-1" style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--muted)" }}>{c.count} entries</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Standards table */}
        <div>
          <SectionHeader
            number="02"
            title={filter === "all" ? "All standards" : STANDARD_CATEGORIES.find(c => c.key === filter)?.label || "Standards"}
            subtitle={STANDARD_CATEGORIES.find(c => c.key === filter)?.desc}
            action={<SearchInput value={search} onChange={setSearch} placeholder="Search code, title, body…" className="w-72" />}
          />
          <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={[
                {
                  key: "code", header: "Code", sortable: true, sortValue: (s: Standard) => s.code,
                  render: (s: Standard) => <span className="t-code font-medium" style={{ color: "var(--primary)" }}>{s.code}</span>,
                },
                { key: "title", header: "Title", sortable: true, sortValue: (s: Standard) => s.title, render: (s: Standard) => (
                  <div>
                    <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{s.title}</div>
                    <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>{s.body}</div>
                  </div>
                ) },
                { key: "application", header: "Application at Hi-Tech", render: (s: Standard) => <span className="t-body-sm" style={{ color: "var(--body)" }}>{s.application}</span> },
                {
                  key: "category", header: "Category", sortable: true, sortValue: (s: Standard) => s.category,
                  render: (s: Standard) => <span className="t-label" style={{ color: "var(--muted)" }}>{STANDARD_CATEGORIES.find(c => c.key === s.category)?.label}</span>,
                },
              ]}
              data={filtered}
              onRowClick={(s) => setSelected(s)}
              emptyMessage="No standards match the filter."
            />
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <Sheet open={true} onOpenChange={() => setSelected(null)}>
          <SheetContent side="right" className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
            <SheetHeader className="px-6 pt-6 pb-3 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div className="t-label mb-1" style={{ color: "var(--primary)" }}>STANDARD</div>
              <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{selected.code}</SheetTitle>
              <SheetDescription className="t-body-md mt-1" style={{ color: "var(--body)" }}>{selected.title}</SheetDescription>
            </SheetHeader>
            <div className="px-6 py-5 space-y-5">
              <DetailRow label="Issuing body" value={selected.body} />
              <DetailRow label="Category" value={STANDARD_CATEGORIES.find(c => c.key === selected.category)?.label} />
              <div>
                <div className="t-label mb-1.5" style={{ color: "var(--muted)" }}>Scope</div>
                <p className="t-body-md" style={{ color: "var(--ink)" }}>{selected.scope}</p>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="t-label mb-1.5" style={{ color: "var(--primary)" }}>APPLICATION AT HI-TECH RADIATORS</div>
                <p className="t-body-md" style={{ color: "var(--ink)" }}>{selected.application}</p>
              </div>
              <div className="pt-4 border-t" style={{ borderColor: "var(--hairline)" }}>
                <div className="rounded-md p-4 flex items-start gap-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <FileCheck2 size={16} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>
                    Standards are referenced from controlled documents in the Hi-Tech Radiators document registry. When a revision changes, Hi-Tech Radiators preserves the original revision reference on historical inspection records.
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

// ============================================================
// PROCESS FLOW MODULE - Visual map of K1-K4 manufacturing routes
// ============================================================
type RouteFlow = {
  code: string;
  name: string;
  description: string;
  color: string;
  stages: { code: string; name: string; dept: string; doc: string; isCTQ: boolean; isGate: boolean }[];
};

const ROUTE_FLOWS: RouteFlow[] = [
  {
    code: "RADIATOR",
    name: "Radiator Manufacturing - End to End",
    description: "Complete radiator manufacturing process: rolling, welding, assembly, leak test, galvanizing (HDG), blasting, painting, internal coating, final inspection, packing, and dispatch.",
    color: "#083260",
    stages: [
      // Fin fabrication
      { code: "S01", name: "Rolling & Forming", dept: "Quality Inspector", doc: "QCI/F/02/01 Rev.05", isCTQ: false, isGate: false },
      { code: "S02", name: "Single Spot Welding", dept: "Operator Production", doc: "QCI/F/02/02 Rev.04", isCTQ: false, isGate: false },
      { code: "S03", name: "Multi Spot Welding", dept: "Operator Production", doc: "QCI/F/02/02 Rev.04", isCTQ: false, isGate: false },
      { code: "S04", name: "Seam Welding & Trimming", dept: "Operator / QA", doc: "QCI/F/02/06", isCTQ: false, isGate: false },
      { code: "S05", name: "Cross Seam Welding", dept: "Operator / QA", doc: "QCI/F/02/06", isCTQ: false, isGate: false },
      { code: "S06", name: "Edge Cutting", dept: "Operator Production", doc: "QCI/F/02/03 Rev.04", isCTQ: false, isGate: false },
      { code: "S07", name: "TIG Welding & Fin Sandering", dept: "Operator / QA", doc: "QCI/F/02/04 Rev.03", isCTQ: false, isGate: false },
      // Header (K4)
      { code: "S08", name: "Pipe Cutting (Plasma) + Deburring", dept: "Operator / QC", doc: "QCI/F/05/01", isCTQ: false, isGate: false },
      { code: "S09", name: "Header Assembly with Pretreatment", dept: "Operator / QA", doc: "QCI/F/05/02", isCTQ: true, isGate: true },
      { code: "S10", name: "Fin Flaring Process", dept: "QC / Operator", doc: "QCI/F/02/06", isCTQ: false, isGate: false },
      // Assembly
      { code: "S11", name: "Assembly (Erection)", dept: "Operator / QA", doc: "QCI/F/05/03 Rev.09", isCTQ: true, isGate: true },
      { code: "S12", name: "Full MAG Welding", dept: "Operator / QC", doc: "QCI/F/05/04 Rev.03", isCTQ: true, isGate: false },
      { code: "S13", name: "Spatter Cleaning", dept: "Operator / QC", doc: "QCI/F/05/07 Rev.02", isCTQ: false, isGate: false },
      { code: "S14", name: "Leak Testing + Dimension + Visual", dept: "Operator / QA", doc: "QCI/F/05/08 Rev.03", isCTQ: true, isGate: true },
      // Galvanizing (HDG) - S15 to S19
      { code: "S15", name: "Pre-Galvanizing Release", dept: "Galvanizing / QA", doc: "QCI/F/10/01 Rev.003", isCTQ: false, isGate: true },
      { code: "S16", name: "HDG Pretreatment (Tanks 1-9)", dept: "Galvanizing / QA", doc: "QCI/F/10/02 Rev.005", isCTQ: false, isGate: false },
      { code: "S17", name: "HDG Laboratory Control", dept: "Laboratory / QA", doc: "QCI/F/10/05 Rev.004", isCTQ: false, isGate: false },
      { code: "S18", name: "Hot-Dip Galvanizing", dept: "Galvanizing / QA", doc: "QCI/F/10/03 Rev.03", isCTQ: true, isGate: false },
      { code: "S19", name: "Final HDG Inspection & Type Test", dept: "Galvanizing / Lab / QA", doc: "QCI/F/10/04 Rev.02", isCTQ: true, isGate: true },
      // Surface prep & painting
      { code: "S20", name: "Grit Blasting (Painted MS)", dept: "Operator / QA", doc: "QCI/F/06/01", isCTQ: true, isGate: false },
      { code: "S21", name: "Sweep Blasting (HDG / SS)", dept: "Operator / QA", doc: "QCI/F/06/01", isCTQ: true, isGate: false },
      { code: "S22", name: "Internal Cleaning Before Coating", dept: "QA Inspector", doc: "PRO/F/02/25", isCTQ: false, isGate: false },
      { code: "S23", name: "Primer Flooding", dept: "QA Inspector", doc: "QCI/F/06/04", isCTQ: true, isGate: false },
      { code: "S24", name: "Internal Coating (RD124 / IS741)", dept: "QA Inspector", doc: "QCI/F/06/04", isCTQ: false, isGate: false },
      { code: "S25", name: "Tilting the Radiator A & B Side", dept: "QA Inspector", doc: "PRO/S/02/60", isCTQ: false, isGate: false },
      { code: "S26", name: "Hot Air Purging", dept: "QA Inspector", doc: "PRO/S/02/60", isCTQ: false, isGate: false },
      { code: "S27", name: "Paint (MIO)", dept: "Operator / QA", doc: "QCI/F/06/04", isCTQ: true, isGate: false },
      { code: "S28", name: "Radiator Ovening", dept: "Operator / QA", doc: "QCI/F/06/04", isCTQ: false, isGate: false },
      { code: "S29", name: "PU Paint Flooding", dept: "Operator / QA", doc: "QCI/F/06/04", isCTQ: true, isGate: false },
      { code: "S30", name: "Internal Pipe & Flange Coating + Ovening", dept: "Operator / QA", doc: "QCI/F/06/04 & QCI/F/06/08", isCTQ: true, isGate: false },
      { code: "S31", name: "Endoscopic Check", dept: "QA Inspector", doc: "QCI/S/06/05 & QCI/F/06/10", isCTQ: false, isGate: false },
      { code: "S32", name: "Oil Circulation Inside Radiator", dept: "QA Inspector", doc: "QCI/F/06/07", isCTQ: false, isGate: false },
      { code: "S33", name: "Spray Painting & Final Inspection", dept: "Operator / QA", doc: "QCI/F/06/02, QCI/F/06/08, QCI/F/06/06", isCTQ: true, isGate: true },
      // Final & dispatch
      { code: "S34", name: "Final Product Inspection", dept: "Operator / QA", doc: "QCI/F/03/01", isCTQ: true, isGate: true },
      { code: "S35", name: "Dry Air / N2 Filling", dept: "Operator / QA", doc: "QCI/F/07/01", isCTQ: true, isGate: false },
      { code: "S36", name: "Crate / Pallet Making & Fumigation", dept: "Operator / QA", doc: "QCI/F/07/01 & QCI/F/07/02", isCTQ: true, isGate: false },
      { code: "S37", name: "TC & Documentation", dept: "QA Inspector", doc: "PRO/F/02/05", isCTQ: false, isGate: true },
      { code: "S38", name: "Packing & Dispatch", dept: "Operator / QA", doc: "QCI/F/07/01 & QCI/F/07/02", isCTQ: false, isGate: true },
    ],
  },
];

// QC parameters for each stage (from QMS Process Control Matrix)
const STAGE_QC_PARAMS: Record<string, { param: string; spec: string; method: string; ctq?: boolean }[]> = {
  S01: [
    { param: "Sheet Thickness", spec: "As per Drg./Tol. ±0.03 mm", method: "Micrometer" },
    { param: "Sheet Width", spec: "As per Drg./Tol. ±1 mm", method: "Measuring tape" },
    { param: "Neck-to-Neck Distance", spec: "As per Drg./Tol. ±1 mm", method: "Measuring Tape", ctq: true },
    { param: "Length-wise Bow", spec: "Max 5 mm", method: "Line dori & tape" },
    { param: "Width-wise Bow", spec: "Max 3 mm", method: "Line dori & filler gauge" },
    { param: "Die Depth", spec: "3.5 to 5 mm", method: "Depth Micrometer" },
  ],
  S02: [
    { param: "Electrode Dia.", spec: "8-10 mm", method: "Vernier calliper" },
    { param: "Nugget Diameter", spec: "6.5-8.5 mm", method: "Vernier calliper" },
    { param: "Welding Current", spec: "WPS: VAA/HTR/CS/WPS", method: "Weld Checker", ctq: true },
    { param: "Force Between Electrodes", spec: "300-450 kgf", method: "Force gauge", ctq: true },
    { param: "Air Pressure", spec: "4-5 kg/cm²", method: "Pressure gauge" },
  ],
  S04: [
    { param: "Wheel Dia", spec: "210-310 mm", method: "Vernier calliper" },
    { param: "Welding Current", spec: "18-24 kA", method: "Weld Checker", ctq: true },
    { param: "Pressure", spec: "4-4.5 kg/cm²", method: "Pressure gauge" },
    { param: "Seam Burr", spec: "Not allowed", method: "Visual" },
    { param: "Leakage", spec: "No leakage allowed", method: "Leak testing" },
  ],
  S07: [
    { param: "TIG Current", spec: "80-120 A", method: "Ammeter" },
    { param: "Gas Flow", spec: "12-18 L/min", method: "Flow meter" },
    { param: "Torch Distance", spec: "4-6 mm", method: "Gauge" },
    { param: "Porosity", spec: "Not allowed", method: "Visual" },
  ],
  S11: [
    { param: "Gauge Setting", spec: "As per check sheet", method: "Water level", ctq: true },
    { param: "CC Distance", spec: "CC+4-1 mm", method: "Measuring tape", ctq: true },
    { param: "Pitch", spec: "As per Drg. ±1 mm", method: "Measuring tape", ctq: true },
    { param: "Fin Straightness", spec: "Bend fins not allowed", method: "Visual", ctq: true },
    { param: "Diagonal Difference", spec: "Max 5 mm", method: "Measuring tape" },
    { param: "Burr in Header Pipe", spec: "Not allowed", method: "Visual", ctq: true },
  ],
  S12: [
    { param: "Current", spec: "WPS-HTR-K-135-EN-17", method: "Ammeter", ctq: true },
    { param: "Voltage", spec: "As per WPS", method: "Voltmeter", ctq: true },
    { param: "Gas Flow", spec: "12-15 L/min", method: "Flow meter", ctq: true },
    { param: "CC Distance", spec: "-1.0 to +2.0 mm", method: "Distortion gauge", ctq: true },
    { param: "Spatter", spec: "Not allowed", method: "Visual" },
  ],
  S03: [
    { param: "Electrode Dia.", spec: "8-10 mm", method: "Vernier calliper" },
    { param: "Nugget Diameter", spec: "6.5-8.5 mm", method: "Vernier calliper" },
    { param: "Welding Current", spec: "WPS: VAA/HTR/CS/WPS", method: "Weld Checker", ctq: true },
    { param: "Force Between Electrodes", spec: "300-450 kgf", method: "Force gauge", ctq: true },
    { param: "Air Pressure", spec: "4-5 kg/cm²", method: "Pressure gauge" },
    { param: "Spot Burr", spec: "Not allowed", method: "Visual" },
  ],
  S05: [
    { param: "Wheel Dia", spec: "210-310 mm", method: "Vernier calliper" },
    { param: "Welding Current", spec: "18-24 kA", method: "Weld Checker", ctq: true },
    { param: "Pressure", spec: "4-4.5 kg/cm²", method: "Pressure gauge" },
    { param: "Cross Seam Burr", spec: "Not allowed", method: "Visual" },
    { param: "Leakage", spec: "No leakage allowed", method: "Leak testing" },
  ],
  S06: [
    { param: "Fin Diagonal Difference", spec: "Max 3 mm", method: "Vernier calliper" },
    { param: "Burr After Edge Cutting", spec: "Max 0.8 mm", method: "Micrometer" },
    { param: "Flute Press/Damage", spec: "Not allowed", method: "Visual" },
    { param: "Throat Opening", spec: "18 ± 1 mm", method: "Vernier calliper" },
    { param: "Edge Opening", spec: "Not allowed", method: "Visual" },
  ],
  S08: [
    { param: "Slot Length/Width", spec: "±1 mm", method: "Measuring tape" },
    { param: "TP Distance", spec: "±1 mm", method: "Measuring tape" },
    { param: "Pitch", spec: "±1 mm", method: "Measuring tape", ctq: true },
    { param: "Total Pipe Length", spec: "±5 mm", method: "Measuring tape" },
    { param: "Burr", spec: "Not allowed", method: "Visual", ctq: true },
    { param: "Foreign Matters Inside", spec: "Not allowed", method: "Visual", ctq: true },
    { param: "Pipe Rusting", spec: "Not allowed", method: "Visual", ctq: true },
  ],
  S09: [
    { param: "Flange Hole Alignment", spec: "Misalignment not allowed", method: "Visual" },
    { param: "Flange Flatness/Straightness", spec: "No bend allowed", method: "Square bar", ctq: true },
    { param: "Header Pipe Straightness", spec: "1 mm", method: "Right angle", ctq: true },
    { param: "Flange to Pipe Right Angle", spec: "0.4 mm", method: "Right angle", ctq: true },
    { param: "Welding Quality", spec: "No visual defects", method: "Visual" },
    { param: "Current/Voltage/Gas Flow", spec: "As per WPS", method: "Ammeter/Voltmeter/Flow meter" },
  ],
  S10: [
    { param: "Throat Dimension", spec: "31 ± 1 mm", method: "Vernier calliper" },
    { param: "Neck-to-Neck Distance", spec: "0, +1, +2, +3 mm", method: "Measuring tape", ctq: true },
    { param: "Visual Inspection", spec: "Free from bend/damage/dent", method: "Visual" },
  ],
  S13: [
    { param: "Spatter Below Rod", spec: "Not allowed", method: "Visual" },
    { param: "Welding Lug/Wire Inside Header", spec: "Not allowed", method: "Visual" },
    { param: "Burr Inside Header", spec: "Not allowed", method: "Visual" },
    { param: "Pin Hole", spec: "Not allowed", method: "Visual" },
    { param: "Weld Finish", spec: "OK (visual)", method: "Visual" },
    { param: "Handling Damage/Dent", spec: "Not allowed", method: "Visual" },
  ],
  S14: [
    { param: "Leakage", spec: "Leak-free 30 min @ 2 kg/cm²", method: "Pressure test", ctq: true },
    { param: "CC Distance", spec: "±2.0 mm", method: "Measuring tape", ctq: true },
    { param: "Flange Coplanarity", spec: "Max 1 mm diff", method: "Filler gauge", ctq: true },
    { param: "Flange to Fin Right Angle", spec: "1.5 mm", method: "Right angle", ctq: true },
    { param: "Internal Cleaning", spec: "No impurities", method: "Visual/Vacuum", ctq: true },
    { param: "Hole Alignment", spec: "0.5 mm", method: "Nylon string", ctq: true },
  ],
  S15: [
    { param: "HTU Nos.", spec: "Verified against WO", method: "Visual" },
    { param: "Job Size", spec: "As per WO", method: "Visual" },
    { param: "Visual Check", spec: "No damage", method: "Visual" },
    { param: "Blanking Plate Fitment", spec: "Proper fitment", method: "Visual" },
    { param: "Grease/Paint on Surface", spec: "Not allowed", method: "Visual" },
    { param: "Oil on Surface", spec: "Not allowed", method: "Visual" },
    { param: "Rust on Surface", spec: "Not allowed", method: "Visual" },
    { param: "Leak Test", spec: "Must be passed", method: "Pressure test", ctq: true },
    { param: "Sweep Blasting (HDG only)", spec: "Completed", method: "Visual" },
  ],
  S16: [
    { param: "Tank 1 Degreasing Time", spec: "20-22 min", method: "Timer" },
    { param: "Tank 1 Temperature", spec: "30-80°C", method: "Thermometer" },
    { param: "Oil/Grease Contamination", spec: "Not allowed", method: "Visual" },
    { param: "Tank 2 Rinsing", spec: "Flush dip", method: "Timer" },
    { param: "Tank 3 Pickling Time", spec: "15-25 min", method: "Timer" },
    { param: "Mill Scale/Rust", spec: "Not allowed", method: "Visual" },
    { param: "Tank 4 Pickling Time", spec: "15-25 min", method: "Timer" },
    { param: "Tank 5 Pickling Time", spec: "15-25 min", method: "Timer" },
    { param: "Tank 6 Rinsing pH", spec: "Above 2.5", method: "pH meter" },
    { param: "Tank 7 Fluxing", spec: "Proper fluxed", method: "Visual" },
    { param: "Tank 8 Water Quenching", spec: "Dipping", method: "Timer" },
    { param: "Tank 9 Passivation", spec: "Just dipping", method: "Timer" },
  ],
  S17: [
    { param: "Degreaser Pointage", spec: "5-10%", method: "Titration", ctq: true },
    { param: "Degreaser pH", spec: "Above 9", method: "pH meter" },
    { param: "Degreaser Temp", spec: "30-80°C", method: "Thermometer" },
    { param: "Rinsing pH (Tank 2)", spec: "Below 13", method: "pH meter" },
    { param: "Acid Conc. (Tank 3)", spec: "40-160 g/l", method: "Titration" },
    { param: "Iron Content (Tank 3)", spec: "Max 120 g/l", method: "KMnO4 titration" },
    { param: "Acid Conc. (Tank 4)", spec: "40-160 g/l", method: "Titration" },
    { param: "Iron Content (Tank 4)", spec: "Max 120 g/l", method: "KMnO4 titration" },
    { param: "Acid Conc. (Tank 5)", spec: "40-160 g/l", method: "Titration" },
    { param: "Iron Content (Tank 5)", spec: "Max 120 g/l", method: "KMnO4 titration" },
    { param: "Rinsing pH (Tank 6)", spec: "Above 2.5", method: "pH meter" },
    { param: "Flux Iron Content (Tank 7)", spec: "Max 5 g/l", method: "KMnO4 titration" },
    { param: "Flux pH (Tank 7)", spec: "3-5.5", method: "pH meter" },
    { param: "Passivation Pointage (Tank 9)", spec: "1-4%", method: "Titration" },
  ],
  S18: [
    { param: "Bath Temperature", spec: "450-460°C", method: "Thermometer", ctq: true },
    { param: "Dipping Time", spec: "180 sec / As per DFT", method: "Timer", ctq: true },
    { param: "Ash Skimming", spec: "Before withdrawal", method: "Visual" },
    { param: "Excess Zinc Cleaning", spec: "Before drying", method: "Visual" },
    { param: "Surface Defects", spec: "No pimples/blisters/bare spots", method: "Visual" },
    { param: "Drainage Spikes", spec: "Not allowed", method: "Visual" },
    { param: "Distortion", spec: "Not allowed", method: "Visual" },
    { param: "Air Quenching Time", spec: "10 min", method: "Timer" },
    { param: "Job Temp After Quench", spec: "60-65°C", method: "Thermometer" },
    { param: "Water Quenching Time", spec: "2 min", method: "Timer" },
    { param: "Water Quench Temp", spec: "Below 45°C", method: "Thermometer" },
  ],
  S19: [
    { param: "Zn Coating Thickness (DFT)", spec: "As per TDS/ISO 1461", method: "Elcometer", ctq: true },
    { param: "Flange Backside DFT", spec: "As per TDS", method: "Elcometer" },
    { param: "Pipe Area DFT", spec: "As per TDS", method: "Elcometer" },
    { param: "Boss Plug Area DFT", spec: "As per TDS", method: "Elcometer" },
    { param: "Inner Fin DFT", spec: "As per TDS", method: "Elcometer" },
    { param: "Outer Fin DFT", spec: "As per TDS", method: "Elcometer" },
    { param: "Preece Test", spec: "4 dips, no red copper", method: "CuSO4 solution", ctq: true },
    { param: "Mass of Zinc", spec: "≥610 g/m² (≥5mm), ≥460 g/m² (2-5mm)", method: "Weight diff", ctq: true },
    { param: "Hammer Adhesion Test", spec: "No peeling", method: "Hammer per IS 2629", ctq: true },
    { param: "HDG Defects (A-S)", spec: "None allowed", method: "Visual" },
  ],
  S20: [
    { param: "Surface Profile", spec: "Matched with Sa 2.5 master", method: "Profile gauge", ctq: true },
    { param: "Blasting Pressure", spec: "5-6 kg/cm²", method: "Pressure gauge", ctq: true },
    { param: "Humidity", spec: "Max 85%", method: "Hygrometer", ctq: true },
    { param: "Surface Temp", spec: "Min 3°C above dew point", method: "Temp gun" },
    { param: "Nozzle Dia", spec: "8-10 mm", method: "Vernier" },
    { param: "Grit Size", spec: "G-58 (MS)", method: "Visual" },
  ],
  S21: [
    { param: "Surface Profile", spec: "Matched with SSPC SP16", method: "Profile gauge", ctq: true },
    { param: "Blasting Pressure", spec: "2.5-3.5 kg/cm²", method: "Pressure gauge", ctq: true },
    { param: "Humidity", spec: "Max 85%", method: "Hygrometer", ctq: true },
    { param: "Alumina Oxide Grit", spec: "G30 & G60 grade", method: "Visual" },
    { param: "Vibration Table", spec: "45 sec", method: "Timer" },
  ],
  S22: [
    { param: "Solvent Circulation", spec: "15 min, 1440 LPM", method: "Timer", ctq: true },
    { param: "Metal/Foreign Particles", spec: "Zero observed", method: "Filter/Magnet", ctq: true },
    { param: "Tilting Drain", spec: "No solvent remains", method: "Visual" },
    { param: "Air Blow Dry", spec: "Min 20 min", method: "Timer" },
  ],
  S23: [
    { param: "Viscosity", spec: "As per temp-viscosity chart", method: "B4 Ford Cup", ctq: true },
    { param: "Primer DFT", spec: "40-60 microns", method: "DFT gauge", ctq: true },
    { param: "Oven Temperature", spec: "70°C for 45 min", method: "Temp indicator" },
    { param: "Mixing Ratio", spec: "As per paint TDS", method: "Measuring cup" },
    { param: "Humidity", spec: "Max 85%", method: "Hygrometer" },
    { param: "Time Interval After Blasting", spec: "Max 4 hours", method: "Timer" },
  ],
  S24: [
    { param: "RD124/IS741 Viscosity", spec: "35-45 sec", method: "B4 Ford Cup", ctq: true },
    { param: "Pump Pressure", spec: "5-6 kg/cm²", method: "Pressure gauge" },
    { param: "Circulation Time", spec: "15 min", method: "Timer" },
    { param: "Hot Air Temp", spec: "Min 60°C", method: "Thermometer" },
    { param: "Coating Uniformity", spec: "Complete coverage", method: "Endoscopic", ctq: true },
  ],
  S25: [
    { param: "Tilt Angle", spec: "35-45 degrees", method: "Visual" },
    { param: "Drain Time Per Side", spec: "5 min each", method: "Timer" },
    { param: "Solvent Residue", spec: "None remaining", method: "Visual" },
  ],
  S26: [
    { param: "Air Circulation", spec: "10 min top-to-bottom, 10 min bottom-to-top", method: "Timer" },
    { param: "Fumes Inside", spec: "Completely removed", method: "Visual/Smell", ctq: true },
  ],
  S27: [
    { param: "Viscosity", spec: "As per temp-viscosity chart", method: "B4 Ford Cup", ctq: true },
    { param: "Paint DFT (MIO)", spec: "80-100 microns", method: "DFT gauge", ctq: true },
    { param: "Humidity", spec: "Max 85%", method: "Hygrometer", ctq: true },
    { param: "Flash-off Time", spec: "30-40 min natural dry", method: "Timer" },
    { param: "Oven Temp", spec: "70°C for 45 min", method: "Temp indicator" },
  ],
  S28: [
    { param: "Oven Temperature", spec: "70°C", method: "Temp indicator" },
    { param: "Oven Time", spec: "45 min", method: "Timer" },
    { param: "Natural Cooling", spec: "20-30 min", method: "Timer" },
  ],
  S29: [
    { param: "PU Paint Viscosity", spec: "As per temp-viscosity chart", method: "B4 Ford Cup", ctq: true },
    { param: "PU Paint DFT", spec: "As per Drg./P.O", method: "DFT gauge", ctq: true },
    { param: "Mixing Ratio", spec: "As per paint TDS", method: "Measuring cup" },
    { param: "Flash-off Time", spec: "20-30 min", method: "Timer" },
  ],
  S30: [
    { param: "Internal Coating Viscosity", spec: "13-17 sec", method: "B4 Ford Cup", ctq: true },
    { param: "Pump Pressure", spec: "5-6 kg/cm²", method: "Pressure gauge" },
    { param: "Circulation Time", spec: "15 min", method: "Timer" },
    { param: "Pipe Drain", spec: "No paint accumulation", method: "Visual", ctq: true },
    { param: "Flange Coating", spec: "As per customer req", method: "Visual" },
    { param: "Oven Temp", spec: "75°C for 45 min", method: "Temp indicator" },
  ],
  S31: [
    { param: "Endoscopic Coverage", spec: "Completely coated inside", method: "Endoscope camera", ctq: true },
    { param: "Uncoated Areas", spec: "None", method: "Endoscope camera" },
    { param: "Lugs/Weld Wire Inside", spec: "Not allowed", method: "Endoscope camera" },
    { param: "Dust/Foreign Particles", spec: "Not allowed", method: "Endoscope camera" },
  ],
  S32: [
    { param: "Oil Circulation Time", spec: "20 min (10+10)", method: "Timer", ctq: true },
    { param: "Particle Detection", spec: "No particles visible", method: "Filter cloth + magnet", ctq: true },
    { param: "Tilting Drain", spec: "10 min per side + air blow", method: "Timer" },
  ],
  S33: [
    { param: "Final DFT", spec: "As per Drg./P.O", method: "DFT gauge", ctq: true },
    { param: "Paint Shade", spec: "As per Drg./P.O", method: "Shade card", ctq: true },
    { param: "Peel-off Test", spec: "As per ASTM D 3359", method: "Cross-cut tape", ctq: true },
    { param: "Holiday Test", spec: "No pinholes", method: "Holiday detector" },
  ],
  S34: [
    { param: "CC Distance", spec: "±2.0 mm", method: "Measuring tape", ctq: true },
    { param: "Flange Hole Alignment", spec: "±2.0 mm", method: "Nylon string", ctq: true },
    { param: "Peel-off Test", spec: "As per std.", method: "Cross-cut", ctq: true },
    { param: "Paint Shade", spec: "As per std.", method: "Shade card", ctq: true },
    { param: "Dimensional Check", spec: "As per Drg./P.O", method: "Vernier/tape" },
  ],
  S35: [
    { param: "Dry Air/N2 Pressure", spec: "0.2 kg/cm² (after 2 hrs)", method: "Pressure gauge", ctq: true },
  ],
  S36: [
    { param: "Crate Size", spec: "As per internal spec", method: "Measuring tape" },
    { param: "Fumigation Stamp", spec: "Must have stamp", method: "Visual", ctq: true },
    { param: "Spacer Gap", spec: "Min 10 mm between radiators", method: "Visual", ctq: true },
    { param: "M.S. Flat Size", spec: "Width 40mm, TH 3mm", method: "Vernier" },
    { param: "Plug Torque (Teflon)", spec: "25-30 N-m", method: "Torque wrench" },
    { param: "Plug Torque (Nylon)", spec: "45-50 N-m", method: "Torque wrench" },
    { param: "Dry Air Purge Duration", spec: "5-10 min", method: "Timer" },
    { param: "Moisture Reading", spec: "Gulf ≤40, US/EU <20", method: "Moisture meter" },
  ],
  S37: [
    { param: "All Department Checksheets", spec: "All available", method: "Document review", ctq: true },
    { param: "Evidence of Processes", spec: "Stored in TC dept", method: "Document review" },
    { param: "Test Certificate", spec: "Prepared and verified", method: "Document review", ctq: true },
    { param: "Final QC OK Sticker", spec: "Present on radiator", method: "Visual" },
  ],
  S38: [
    { param: "N2/Dry Air", spec: "Min 0.2 kg/cm²", method: "Pressure gauge", ctq: true },
    { param: "Fumigation", spec: "Stamp required", method: "Visual", ctq: true },
    { param: "Moisture", spec: "Gulf: ≤40, US/EU: <20", method: "Moisture meter" },
  ],
};

function ProcessFlowModule({ plant, plantInfo, user, onNavigate, onInspect }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onInspect: (stageCode: string | null) => void }) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  // Unified radiator process flow - single product focus, not split by plant
  const radiatorStages = ROUTE_FLOWS[0]?.stages || [];
  const ctqCount = radiatorStages.filter(s => s.isCTQ).length;
  const gateCount = radiatorStages.filter(s => s.isGate).length;

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Radiator Manufacturing Process"
        title="Process Flow & QC Parameters"
        subtitle="Complete radiator manufacturing process with quality control parameters, standards, and acceptance criteria at each stage. Click any stage to view its QC checklist details."
        info="This is the master map of how a radiator is built - from raw tube cutting all the way to packing and dispatch. Each stage card shows the QC checks that must be passed before a unit can move to the next stage. Click INSPECT on any stage to jump to the inspection form for that stage."
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{radiatorStages.length} STAGES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{ctqCount} CTQ · {gateCount} GATES</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* Legend */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="dot" style={{ backgroundColor: "var(--primary)" }} />
            <span className="t-label" style={{ color: "var(--muted)" }}>CTQ PARAMETER</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ border: "1.5px solid var(--primary)" }} />
            <span className="t-label" style={{ color: "var(--muted)" }}>QUALITY GATE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText size={14} style={{ color: "var(--muted)" }} />
            <span className="t-label" style={{ color: "var(--muted)" }}>Click stage to view QC parameters</span>
          </div>
        </div>

        {/* Stage timeline with inline QC details */}
        <div className="rounded-md" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="px-5 md:px-8 py-2">
            {radiatorStages.map((stage, i) => {
              const isLast = i === radiatorStages.length - 1;
              const isExpanded = expandedStage === i;
              const qcParams = STAGE_QC_PARAMS[stage.code] || [];
              return (
                <div key={`${stage.code}-${i}`} className="relative" style={{ borderBottom: isLast ? "none" : "1px solid var(--hairline-soft)" }}>
                  <button
                    onClick={() => setExpandedStage(isExpanded ? null : i)}
                    className="w-full flex items-start gap-5 py-5 text-left transition-colors hover:bg-[var(--canvas-soft)]"
                    title={`Stage ${stage.code}: ${stage.name} - ${qcParams.length} QC parameters - Document: ${stage.doc}${stage.isCTQ ? ' - Contains CTQ parameters' : ''}${stage.isGate ? ' - Quality Gate (blocks progression)' : ''}`}
                  >
                    <div className="shrink-0 flex flex-col items-center" style={{ width: 28 }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center t-num" style={{
                        backgroundColor: stage.isGate ? "var(--surface-card)" : stage.isCTQ ? "var(--primary)14" : "var(--canvas-soft)",
                        border: stage.isGate ? `1.5px solid var(--primary)` : "1px solid var(--hairline)",
                        color: stage.isGate ? "var(--primary)" : stage.isCTQ ? "var(--primary)" : "var(--muted)", fontSize: 11, fontWeight: 600,
                      }}>{i + 1}</div>
                      {!isLast && <div className="flex-1 w-px mt-1" style={{ backgroundColor: "var(--hairline)", minHeight: 20 }} />}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="t-code" style={{ color: "var(--muted)", fontSize: 11 }}>{stage.code}</span>
                        <h3 className="t-title-sm" style={{ color: "var(--ink)" }}>{stage.name}</h3>
                        {stage.isCTQ && <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--primary)14", color: "var(--primary)", fontSize: 9.5 }}>CTQ</span>}
                        {stage.isGate && <span className="t-label px-1.5 py-0.5 rounded" style={{ border: `1px solid var(--primary)`, color: "var(--primary)", fontSize: 9.5 }}>GATE</span>}
                        {qcParams.length > 0 && <span className="t-label" style={{ color: "var(--muted-soft)" }}>{qcParams.length} parameters</span>}
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="t-body-sm" style={{ color: "var(--body)" }}>{stage.dept}</span>
                        <span className="t-body-sm" style={{ color: "var(--muted)" }}>·</span>
                        <span className="t-code" style={{ color: "var(--muted)", fontSize: 11 }}>{stage.doc}</span>
                      </div>
                    </div>
                    <div className="shrink-0 pt-1">
                      <ChevronDown size={16} style={{ color: "var(--muted)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="pb-5 pl-12 pr-4 fade-in">
                      <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--hairline-soft)" }}>
                        <div className="flex items-center gap-3 px-4 py-2.5" style={{ backgroundColor: "var(--canvas-soft)", borderBottom: "1px solid var(--hairline-soft)" }}>
                          <FileText size={14} style={{ color: "var(--primary)" }} />
                          <span className="t-label" style={{ color: "var(--primary)" }}>QC CHECKLIST · {stage.doc}</span>
                          <span className="t-label ml-auto" style={{ color: "var(--muted)" }}>{qcParams.length} PARAMETERS</span>
                        </div>
                        {qcParams.length > 0 ? (
                          <table className="w-full" style={{ borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--hairline)" }}>
                              <th className="t-label text-left py-2 px-3" style={{ color: "var(--muted)", fontSize: 9 }}>PARAMETER</th>
                              <th className="t-label text-left py-2 px-3" style={{ color: "var(--muted)", fontSize: 9 }}>ACCEPTANCE CRITERIA</th>
                              <th className="t-label text-left py-2 px-3" style={{ color: "var(--muted)", fontSize: 9 }}>METHOD / INSTRUMENT</th>
                              <th className="t-label text-center py-2 px-3" style={{ color: "var(--muted)", fontSize: 9 }}>CTQ</th>
                            </tr></thead>
                            <tbody>
                              {qcParams.map((p, pi) => (
                                <tr key={pi} style={{ borderBottom: "1px solid var(--hairline-soft)" }}>
                                  <td className="t-body-sm py-2 px-3" style={{ color: "var(--ink)", fontWeight: 500 }}>{p.param}</td>
                                  <td className="t-body-sm py-2 px-3 t-code" style={{ color: "var(--body)", fontSize: 11 }}>{p.spec}</td>
                                  <td className="t-body-sm py-2 px-3" style={{ color: "var(--muted)" }}>{p.method}</td>
                                  <td className="text-center py-2 px-3">
                                    {p.ctq ? <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--primary)14", color: "var(--primary)", fontSize: 8 }}>CTQ</span> : <span style={{ color: "var(--muted-soft)" }}>-</span>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="px-4 py-6 text-center"><div className="t-body-sm" style={{ color: "var(--muted)" }}>QC parameters for this stage are being configured. Refer to document {stage.doc} for the current checklist.</div></div>
                        )}
                        {/* Reaction plan */}
                        <div className="px-4 py-2.5" style={{ backgroundColor: "#fef2f2", borderTop: "1px solid var(--hairline-soft)" }}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={12} style={{ color: "#dc2626" }} />
                            <span className="t-label" style={{ color: "#dc2626" }}>REACTION PLAN: Hold job and inform QA/Production Head. Failed CTQ auto-creates NCR and blocks progression to next process.</span>
                          </div>
                        </div>

                        {/* Standards & Safety reference */}
                        <div className="grid grid-cols-2" style={{ borderTop: "1px solid var(--hairline-soft)" }}>
                          <div className="px-4 py-2.5" style={{ borderRight: "1px solid var(--hairline-soft)" }}>
                            <div className="flex items-center gap-2 mb-1">
                              <ShieldCheck size={11} style={{ color: "var(--primary)" }} />
                              <span className="t-label" style={{ color: "var(--muted)", fontSize: 8 }}>STANDARDS REFERENCED</span>
                            </div>
                            <div className="t-body-sm" style={{ color: "var(--body)", fontSize: 10 }}>
                              {stage.code === "S15" || stage.code === "S16" || stage.code === "S17" || stage.code === "S18" || stage.code === "S19" ? "ISO 1461, ASTM A123, IS 2633, IS 2629, IS 6745, QCI/F/10/01-06" :
                               stage.code === "S20" || stage.code === "S21" ? "SSPC-SP16, ISO 8501-1, ASTM D-4417, QCI/F/06/01" :
                               stage.code === "S22" || stage.code === "S23" || stage.code === "S24" || stage.code === "S25" || stage.code === "S26" || stage.code === "S27" || stage.code === "S28" || stage.code === "S29" || stage.code === "S30" || stage.code === "S31" || stage.code === "S32" || stage.code === "S33" ? "ISO 12944, ISO 2409, ASTM D 3359, NACE-SP0188, QCI/F/06/04" :
                               stage.code === "S34" ? "ISO 2409, ASTM D 3359, NACE-SP0188, QCI/F/03/01" :
                               stage.code === "S35" || stage.code === "S36" || stage.code === "S37" || stage.code === "S38" ? "ISO 9001, QCI/F/07/01-02, QCI/S/07/01-03" :
                               "ISO 9001, AWS D1.1, IS 2062, QCI/Q/02/01 Rev.08"}
                            </div>
                          </div>
                          <div className="px-4 py-2.5">
                            <div className="flex items-center gap-2 mb-1">
                              <Wrench size={11} style={{ color: "var(--muted)" }} />
                              <span className="t-label" style={{ color: "var(--muted)", fontSize: 8 }}>SAFETY & PPE</span>
                            </div>
                            <div className="t-body-sm" style={{ color: "var(--body)", fontSize: 10 }}>
                              {stage.code === "S15" || stage.code === "S16" || stage.code === "S17" || stage.code === "S18" || stage.code === "S19" ? "Helmet, safety shoes, nose mask, rubber gloves, safety goggles" :
                               stage.code === "S20" || stage.code === "S21" ? "Air feed blasting helmet, blasting shoes, mask, boiler suit" :
                               stage.code === "S22" || stage.code === "S23" || stage.code === "S24" || stage.code === "S27" || stage.code === "S29" || stage.code === "S30" ? "Hand gloves, safety shoes, nose mask, helmet, apron" :
                               stage.code === "S33" || stage.code === "S34" ? "Hand gloves, safety shoes, nose mask, helmet" :
                               "Standard PPE per plant safety policy"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 mb-3"><ShieldCheck size={16} style={{ color: "var(--primary)" }} /><span className="t-title-sm" style={{ color: "var(--ink)" }}>Quality gates</span></div>
            <p className="t-body-sm" style={{ color: "var(--body)" }}>A gate stage blocks downstream progression until the gate inspection passes. If any test fails, the product is flagged as defective and goes to rework.</p>
            <div className="mt-3 t-label t-num" style={{ color: "var(--muted)" }}>{gateCount} QUALITY GATES</div>
          </div>
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 mb-3"><Target size={16} style={{ color: "var(--primary)" }} /><span className="t-title-sm" style={{ color: "var(--ink)" }}>CTQ characteristics</span></div>
            <p className="t-body-sm" style={{ color: "var(--body)" }}>Critical-to-Quality parameters carry the highest inspection rigour. A failed CTQ auto-creates an NCR, places the work order on hold, and sends the product to rework.</p>
            <div className="mt-3 t-label t-num" style={{ color: "var(--muted)" }}>{ctqCount} CTQ PARAMETERS</div>
          </div>
          <div className="rounded-md p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2 mb-3"><FileText size={16} style={{ color: "var(--primary)" }} /><span className="t-title-sm" style={{ color: "var(--ink)" }}>Standards followed</span></div>
            <p className="t-body-sm" style={{ color: "var(--body)" }}>QCI/Q/02/01 Rev.08 Control Plan governs all stages. WPS VAA/HTR/CS/WPS governs welding. ISO 9001, AWS D1.1, IEC 60076, IS 2062 referenced throughout.</p>
            <div className="mt-3 t-label t-num" style={{ color: "var(--muted)" }}>QCI/Q/02/01 REV.08</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Rework Module - defect reporting, job order tracking, cost capture
// (Phase 2 foundation - UI shell with list view and create form)
// ============================================================
function ReworkModule({ plant, user }: { plant: string; user: User }) {
  const [reworkJobs, setReworkJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  // Access control: Only Auditor is truly view-only.
  // All other roles (including Director, DGM, Section Head, Manager) can
  // create rework jobs, enter costs, and perform status transitions.
  const isViewOnly = user.role === "Auditor";
  const canCreateRework = !isViewOnly;
  const canEnterCost = !isViewOnly;

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/rework?limit=100")
      .then((r) => r.json())
      .then((d) => setReworkJobs(d.jobs || []))
      .catch(() => setReworkJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = reworkJobs.filter(j => filter === "all" || j.status === filter);

  const REWORK_STATUSES = ["Reported", "Pending Review", "Approved for Rework", "In Progress", "Pending Inspection", "Pending Approval", "On Hold", "Closed", "Scrapped", "Cancelled"];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Quality Execution"
        title="Rework Job Orders"
        subtitle="Defect identification, rework execution, cost capture, and traceability from report to verified closure."
        helpId="rwo.number"
        info="A Rework Job Order (RWO) tracks a defective product from defect identification through rework execution, quality verification, cost calculation, and final closure. Each RWO gets a unique ID (RW-K2-2026-000123) and a printable QR tag for physical traceability. Click any row to see full details, timeline, and cost entry."
        action={canCreateRework ? (
          <Button onClick={() => setShowCreate(true)} className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}><Plus size={14} /> Report Defect</Button>
        ) : undefined}
      />
      <div className="p-4 md:p-8 space-y-4">
        {/* View-only notice */}
        {isViewOnly && (
          <div className="rounded-lg p-3 flex items-start gap-2.5" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
            <Eye size={16} className="shrink-0 mt-0.5" style={{ color: "var(--muted)" }} />
            <div className="t-body-sm" style={{ color: "var(--body)" }}>
              You have <strong style={{ color: "var(--ink)" }}>view-only access</strong> to rework jobs.
            </div>
          </div>
        )}
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Open Jobs" value={reworkJobs.filter(j => !["Closed", "Scrapped", "Cancelled"].includes(j.status)).length} tone="neutral" icon={<Repeat size={15} />} />
          <StatCard label="Pending Review" value={reworkJobs.filter(j => j.status === "Pending Review").length} tone="warn" icon={<Clock size={15} />} />
          <StatCard label="In Progress" value={reworkJobs.filter(j => j.status === "In Progress").length} tone="ok" icon={<Activity size={15} />} />
          <StatCard label="Total Cost" value={`INR ${reworkJobs.reduce((s, j) => s + (j.actualCost || 0), 0).toLocaleString()}`} tone="risk" icon={<IndianRupee size={15} />} />
        </div>

        {/* Filter + table */}
        <FilterBar count={filtered.length}>
          <Filter size={13} style={{ color: "var(--muted)" }} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-8 t-body-sm" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REWORK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </FilterBar>

        {loading ? (
          <LoadingBlock label="Loading rework jobs..." />
        ) : reworkJobs.length === 0 ? (
          <EmptyState
            message="No rework jobs yet"
            hint="Click 'Report Defect' to create the first rework job order. Defects identified during inspection or production can be tracked here from identification through verified closure."
          />
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <DataTable
              columns={[
                { key: "rwoNumber", header: "RWO ID", sortable: true, render: (j: any) => (
                  <div>
                    <div className="t-body-sm font-medium" style={{ color: "var(--primary)" }}>{j.rwoNumber}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{j.attemptNumber > 1 ? `Attempt ${j.attemptNumber}` : "Initial"}</div>
                  </div>
                ), mobileLabel: "RWO" },
                { key: "defectCategory", header: "Defect", render: (j: any) => (
                  <div><div className="t-body-sm" style={{ color: "var(--ink)" }}>{j.defectCategory}</div><div className="t-label truncate" style={{ color: "var(--muted)", maxWidth: 200 }}>{j.defectDescription}</div></div>
                ), mobileLabel: "Defect" },
                { key: "originatingProcess", header: "Process", render: (j: any) => <span className="t-body-sm">{j.originatingProcess}</span>, hideOnMobile: true },
                { key: "severity", header: "Severity", render: (j: any) => <StatusBadge status={j.severity} size="xs" />, hideOnMobile: true },
                { key: "status", header: "Status", sortable: true, render: (j: any) => <StatusBadge status={j.status} size="xs" /> },
                { key: "actualCost", header: "Cost", render: (j: any) => <span className="t-code">{j.actualCost != null ? `INR ${j.actualCost.toLocaleString()}` : "-"}</span>, hideOnMobile: true },
                { key: "action", header: "", render: () => <ChevronRight size={14} style={{ color: "var(--muted)" }} /> },
              ]}
              data={filtered}
              onRowClick={(j) => setSelected(j)}
              emptyMessage="No rework jobs found."
            />
          </div>
        )}
      </div>

      {showCreate && <ReworkCreateDialog plant={plant} user={user} onClose={() => setShowCreate(false)} onCreated={load} />}
      {selected && <ReworkJobDetail job={selected} user={user} onClose={() => setSelected(null)} onUpdated={load} canEnterCost={canEnterCost} />}
    </div>
  );
}

// ============================================================
// Rework Job Detail Panel - full detail view with cost entry, timeline, status transitions
// ============================================================
function ReworkJobDetail({ job, user, onClose, onUpdated, canEnterCost }: {
  job: any; user: User; onClose: () => void; onUpdated: () => void; canEnterCost: boolean;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [costLines, setCostLines] = useState<any[]>(job.costLines || []);
  const [showAddCost, setShowAddCost] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Compute total actual cost from cost lines
  const totalCost = costLines.reduce((s, c) => s + (c.amount || 0), 0);

  const updateStatus = async (newStatus: string, extra?: Record<string, any>) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/rework/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, updatedBy: user.name, ...extra }),
      });
      if (res.ok) {
        toast({ title: "Status updated", description: `${job.rwoNumber} is now ${newStatus}.` });
        onUpdated();
        onClose();
      } else {
        toast({ title: "Update failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setUpdating(false);
  };

  const COST_COMPONENTS = ["Labour", "Material", "Machine", "Consumables", "External", "Other"];

  const PERMITTED_TRANSITIONS: Record<string, string[]> = {
    "Reported": ["Pending Review", "Cancelled"],
    "Pending Review": ["Approved for Rework", "On Hold", "Cancelled"],
    "Approved for Rework": ["In Progress", "On Hold", "Cancelled"],
    "In Progress": ["Pending Inspection", "On Hold", "Cancelled"],
    "Pending Inspection": ["Pending Approval", "On Hold"],
    "Pending Approval": ["Closed", "On Hold"],
    "On Hold": ["Pending Review", "In Progress", "Cancelled"],
    "Closed": [],
    "Scrapped": [],
    "Cancelled": [],
  };
  const allowedNext = PERMITTED_TRANSITIONS[job.status] || [];

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full md:w-[50vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-3 border-b sticky top-0 z-10" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="t-title-sm" style={{ color: "var(--ink)" }}>{job.rwoNumber}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={job.status} size="xs" />
                <StatusBadge status={job.severity} size="xs" />
                {job.attemptNumber > 1 && <span className="t-label px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--surface-strong)", color: "var(--muted)" }}>Attempt {job.attemptNumber}</span>}
              </div>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm"><X size={16} /></Button>
          </div>
        </SheetHeader>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b" style={{ borderColor: "var(--hairline)" }}>
            {["details", "cost", "timeline", "actions"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-3 py-2 t-body-sm capitalize transition-colors"
                style={{
                  borderBottom: activeTab === tab ? "2px solid var(--primary)" : "2px solid transparent",
                  color: activeTab === tab ? "var(--primary)" : "var(--muted)",
                  fontWeight: activeTab === tab ? 600 : 400,
                }}
              >
                {tab === "cost" ? `Cost (INR ${totalCost.toLocaleString()})` : tab}
              </button>
            ))}
          </div>

          {/* === Details Tab === */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <DetailField label="Defect Category" value={job.defectCategory} />
                <DetailField label="Severity" value={job.severity} />
                <DetailField label="Originating Process" value={job.originatingProcess} />
                <DetailField label="Detection Process" value={job.detectionProcess} />
                <DetailField label="HTU No" value={job.htuNo || "-"} />
                <DetailField label="Defect Quantity" value={String(job.defectQuantity)} />
                {job.workOrder && (
                  <DetailField label="Work Order" value={`${job.workOrder.woNumber} - ${job.workOrder.customer}`} />
                )}
                <DetailField label="Disposition" value={job.disposition || "Pending"} />
                <DetailField label="Current Location" value={job.currentLocation || "-"} />
                <DetailField label="Created" value={new Date(job.createdAt).toLocaleString()} />
              </div>
              <div>
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Defect Description</div>
                <div className="t-body-sm rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--ink)", lineHeight: 1.5 }}>
                  {job.defectDescription}
                </div>
              </div>
              {/* Link to originating inspection if description mentions it */}
              {job.defectDescription?.includes("INS-") && (
                <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                  <ClipboardCheck size={16} style={{ color: "var(--primary)" }} />
                  <span className="t-body-sm" style={{ color: "var(--body)" }}>
                    Originated from inspection: <strong style={{ color: "var(--ink)" }}>{job.defectDescription.match(/INS-\d{4}-\d{4}/)?.[0]}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* === Cost Tab === */}
          {activeTab === "cost" && (
            <div className="space-y-4">
              {/* Cost summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Estimated</div>
                  <div className="t-title-sm t-num mt-1" style={{ color: "var(--muted)" }}>{job.estimatedCost ? `INR ${job.estimatedCost.toLocaleString()}` : "-"}</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Actual (sum)</div>
                  <div className="t-title-sm t-num mt-1" style={{ color: "var(--ht-burnt-orange)" }}>INR {totalCost.toLocaleString()}</div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="t-label" style={{ color: "var(--muted)" }}>Approved</div>
                  <div className="t-title-sm t-num mt-1" style={{ color: "var(--ink)" }}>{job.approvedCost ? `INR ${job.approvedCost.toLocaleString()}` : "-"}</div>
                </div>
              </div>

              {/* Cost lines table */}
              {costLines.length > 0 ? (
                <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--hairline)" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: "var(--canvas-soft)" }}>
                        <th className="t-label px-3 py-2 text-left" style={{ color: "var(--muted)" }}>Component</th>
                        <th className="t-label px-3 py-2 text-left" style={{ color: "var(--muted)" }}>Description</th>
                        <th className="t-label px-3 py-2 text-right" style={{ color: "var(--muted)" }}>Qty</th>
                        <th className="t-label px-3 py-2 text-right" style={{ color: "var(--muted)" }}>Rate</th>
                        <th className="t-label px-3 py-2 text-right" style={{ color: "var(--muted)" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costLines.map((c, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--hairline-soft)" }}>
                          <td className="t-body-sm px-3 py-2" style={{ color: "var(--ink)", fontWeight: 500 }}>{c.component}</td>
                          <td className="t-body-sm px-3 py-2" style={{ color: "var(--body)" }}>{c.description}</td>
                          <td className="t-code px-3 py-2 text-right" style={{ color: "var(--ink)" }}>{c.quantity} {c.unit}</td>
                          <td className="t-code px-3 py-2 text-right" style={{ color: "var(--muted)" }}>INR {c.rateAmount?.toLocaleString()}</td>
                          <td className="t-code px-3 py-2 text-right" style={{ color: "var(--ht-burnt-orange)", fontWeight: 600 }}>INR {c.amount?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: "2px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                        <td colSpan={4} className="t-body-sm px-3 py-2 text-right" style={{ color: "var(--ink)", fontWeight: 600 }}>Total Actual Cost</td>
                        <td className="t-title-sm t-num px-3 py-2 text-right" style={{ color: "var(--ht-burnt-orange)", fontWeight: 700 }}>INR {totalCost.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <EmptyState message="No cost lines captured yet." />
              )}

              {/* Add cost button */}
              {canEnterCost ? (
                <Button onClick={() => setShowAddCost(true)} className="t-button h-9 px-4 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                  <Plus size={14} /> Add Cost Line
                </Button>
              ) : (
                <div className="rounded-lg p-3 flex items-center gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                  <Lock size={14} style={{ color: "var(--muted)" }} />
                  <span className="t-label" style={{ color: "var(--muted)" }}>Cost entry requires Director, DGM, Section Head, or Manager role.</span>
                </div>
              )}

              {/* Add cost form */}
              {showAddCost && canEnterCost && (
                <AddCostLineForm
                  rwoId={job.id}
                  userName={user.name}
                  onAdded={(newLine) => { setCostLines([...costLines, newLine]); setShowAddCost(false); }}
                  onCancel={() => setShowAddCost(false)}
                />
              )}
            </div>
          )}

          {/* === Timeline Tab === */}
          {activeTab === "timeline" && (
            <div className="space-y-2">
              {(job.events || []).length === 0 ? (
                <EmptyState message="No events recorded." />
              ) : (
                (job.events || []).map((ev: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
                      {i < (job.events || []).length - 1 && <div className="w-0.5 h-8" style={{ backgroundColor: "var(--hairline)" }} />}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="t-body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>{ev.eventType.replace(/_/g, " ")}</div>
                      {ev.toStatus && <div className="t-label" style={{ color: "var(--muted)" }}>Status: {ev.toStatus}</div>}
                      {ev.toLocation && <div className="t-label" style={{ color: "var(--muted)" }}>Location: {ev.toLocation}</div>}
                      {ev.notes && <div className="t-body-sm mt-0.5" style={{ color: "var(--body)" }}>{ev.notes}</div>}
                      <div className="t-label mt-0.5" style={{ color: "var(--muted-soft)" }}>{new Date(ev.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* === Actions Tab === */}
          {activeTab === "actions" && (
            <div className="space-y-4">
              <div>
                <div className="t-body-sm font-medium mb-2" style={{ color: "var(--ink)" }}>Current Status: {job.status}</div>
                {allowedNext.length > 0 ? (
                  <>
                    <div className="t-label mb-2" style={{ color: "var(--muted)" }}>Permitted transitions:</div>
                    <div className="flex flex-wrap gap-2">
                      {allowedNext.map(s => (
                        <button
                          key={s}
                          onClick={() => updateStatus(s)}
                          disabled={updating}
                          className="px-3 py-2 rounded-md t-body-sm transition-colors"
                          style={{
                            border: "1px solid var(--hairline)",
                            backgroundColor: "var(--canvas-soft)",
                            color: "var(--ink)",
                            opacity: updating ? 0.5 : 1,
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="t-body-sm" style={{ color: "var(--muted)" }}>No further transitions available. This job is in a terminal state.</div>
                )}
              </div>

              {/* Closure checklist */}
              {job.status === "Pending Approval" && (
                <div className="rounded-lg p-4" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                  <div className="t-body-sm font-medium mb-2" style={{ color: "var(--ink)" }}>Closure Checklist</div>
                  <ul className="space-y-1 t-label" style={{ color: "var(--body)" }}>
                    <li style={{ color: job.status === "Pending Inspection" || job.status === "Pending Approval" || job.status === "Closed" ? "var(--semantic-success)" : "var(--muted)" }}>Inspection completed</li>
                    <li style={{ color: totalCost > 0 ? "var(--semantic-success)" : "var(--muted)" }}>Cost captured (INR {totalCost.toLocaleString()})</li>
                    <li style={{ color: job.disposition ? "var(--semantic-success)" : "var(--muted)" }}>Disposition recorded ({job.disposition || "pending"})</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper: detail field display
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="t-label" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)" }}>{value}</div>
    </div>
  );
}

// Add cost line form
function AddCostLineForm({ rwoId, userName, onAdded, onCancel }: {
  rwoId: string; userName: string; onAdded: (line: any) => void; onCancel: () => void;
}) {
  const [component, setComponent] = useState("Labour");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("hrs");
  const [rateAmount, setRateAmount] = useState("0");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const COST_COMPONENTS = ["Labour", "Material", "Machine", "Consumables", "External", "Other"];

  const submit = async () => {
    if (!description || !quantity || !rateAmount) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    const qty = parseFloat(quantity);
    const rate = parseFloat(rateAmount);
    const amount = qty * rate;
    setSaving(true);
    try {
      const res = await fetch(`/api/rework/${rwoId}/cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component, description, quantity: qty, unit, rateAmount: rate, amount, recordedBy: userName }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Cost line added", description: `INR ${amount.toLocaleString()} (${component})` });
        onAdded(data.costLine || { component, description, quantity: qty, unit, rateAmount: rate, amount });
      } else {
        // If API doesn't exist yet, add locally
        toast({ title: "Cost line added (local)", description: `INR ${amount.toLocaleString()} (${component})` });
        onAdded({ component, description, quantity: qty, unit, rateAmount: rate, amount });
      }
    } catch {
      onAdded({ component, description, quantity: qty, unit, rateAmount: rate, amount });
    }
    setSaving(false);
  };

  return (
    <div className="rounded-lg p-4 space-y-3" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
      <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>Add Cost Line</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Component</Label>
          <Select value={component} onValueChange={setComponent}>
            <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}><SelectValue /></SelectTrigger>
            <SelectContent>
              {COST_COMPONENTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was consumed" className="mt-1 t-body-sm h-9" style={{ borderColor: "var(--hairline)" }} />
        </div>
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Quantity</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 t-body-sm h-9" style={{ borderColor: "var(--hairline)" }} />
        </div>
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Unit</Label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="hrs, nos, kg" className="mt-1 t-body-sm h-9" style={{ borderColor: "var(--hairline)" }} />
        </div>
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Rate (INR)</Label>
          <Input type="number" value={rateAmount} onChange={(e) => setRateAmount(e.target.value)} className="mt-1 t-body-sm h-9" style={{ borderColor: "var(--hairline)" }} />
        </div>
        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Amount (auto)</Label>
          <div className="mt-1 h-9 flex items-center px-3 rounded-md t-code" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)", color: "var(--ht-burnt-orange)", fontWeight: 600 }}>
            INR {(parseFloat(quantity || "0") * parseFloat(rateAmount || "0")).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={onCancel} variant="outline" className="t-body-sm h-9 px-4 rounded-md">Cancel</Button>
        <Button onClick={submit} disabled={saving} className="t-body-sm h-9 px-4 rounded-md" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add
        </Button>
      </div>
    </div>
  );
}

function ReworkCreateDialog({ plant, user, onClose, onCreated }: { plant: string; user: User; onClose: () => void; onCreated: () => void }) {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [availableHtus, setAvailableHtus] = useState<string[]>([]);
  const [selectedWO, setSelectedWO] = useState<any | null>(null);
  const [form, setForm] = useState({
    workOrderId: "", htuNo: "", originatingProcess: "", detectionProcess: "",
    detectionSource: "Inspector", responsibleDept: "Quality", reworkArea: "",
    defectCategory: "", defectDescription: "", defectQuantity: 1, severity: "Major",
    priority: "Medium", estimatedCost: "", reporterName: user.name,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Fetch work orders on mount
  useEffect(() => {
    fetch(`/api/work-orders?plant=${plant}`).then(r => r.json()).then(d => {
      setWorkOrders(d.workOrders || []);
    }).catch(() => setWorkOrders([]));
  }, [plant]);

  // When WO is selected, fetch existing HTUs for that WO
  useEffect(() => {
    if (!form.workOrderId) { setAvailableHtus([]); setSelectedWO(null); return; }
    const wo = workOrders.find(w => w.id === form.workOrderId);
    setSelectedWO(wo || null);
    fetch(`/api/inspections?wo=${form.workOrderId}&limit=9999`).then(r => r.json()).then(d => {
      const htus = new Set<string>();
      (d.records || []).forEach((r: any) => { if (r.htuNo) htus.add(r.htuNo); });
      setAvailableHtus(Array.from(htus));
    }).catch(() => setAvailableHtus([]));
  }, [form.workOrderId, workOrders]);

  const DEFECT_CATEGORIES = [
    "Leakage", "Burr", "DFT out", "Welding defect", "Surface defect",
    "Dimensional", "Coplanarity", "Bending", "Crack", "Corrosion", "Other",
  ];
  const PROCESSES = [
    "Rolling & Forming", "Spot Welding", "Seam Welding", "Edge Welding",
    "TIG Welding", "Erection", "MAG Welding", "Leak Testing", "Blasting",
    "Primer", "Paint", "Final Inspection", "Packing", "Galvanizing",
    "Internal Coating", "Dispatch",
  ];
  const DETECTION_SOURCES = ["Inspector", "Operator", "Machine Alert", "Audit", "Customer Complaint"];
  const DEPARTMENTS = ["Quality", "Production", "Maintenance", "Dispatch", "Engineering"];
  const REWORK_AREAS = ["Fabrication Area", "Welding Bay", "Galvanizing Area", "Paint Shop", "Inspection Area", "Rework Holding Area"];
  const SEVERITIES = [
    { value: "Critical", label: "Critical - Safety/CTQ impact", color: "var(--semantic-error)" },
    { value: "Major", label: "Major - Functional defect", color: "var(--ht-burnt-orange)" },
    { value: "Minor", label: "Minor - Cosmetic/Aesthetic", color: "var(--ht-slate-blue)" },
  ];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.workOrderId) e.workOrderId = "Select a work order";
    if (!form.originatingProcess) e.originatingProcess = "Select the process that generated the defect";
    if (!form.detectionProcess) e.detectionProcess = "Select where the defect was detected";
    if (!form.defectCategory) e.defectCategory = "Select a defect category";
    if (!form.defectDescription || form.defectDescription.length < 10) e.defectDescription = "Describe the defect in at least 10 characters";
    if (form.defectQuantity < 1) e.defectQuantity = "Quantity must be at least 1";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast({ title: "Please fix the errors", description: "Required fields are missing or invalid.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        workOrderId: form.workOrderId,
        woNumber: selectedWO?.woNumber,
        htuNo: form.htuNo || null,
        originatingProcess: form.originatingProcess,
        detectionProcess: form.detectionProcess,
        detectionSource: form.detectionSource,
        responsibleDept: form.responsibleDept,
        reworkArea: form.reworkArea,
        defectCategory: form.defectCategory,
        defectDescription: form.defectDescription,
        defectQuantity: form.defectQuantity,
        severity: form.severity,
        priority: form.priority,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : null,
        reportedBy: user.name,
      };
      const res = await fetch("/api/rework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Rework job created",
          description: `${data.job?.rwoNumber || "New rework request"} - ${form.defectCategory} on ${selectedWO?.woNumber}. The responsible ${form.responsibleDept} team will be notified.`,
        });
        onCreated();
        onClose();
      } else {
        toast({ title: "Creation failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full md:w-[55vw] md:max-w-[900px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-3 border-b sticky top-0 z-10" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="t-title-sm" style={{ color: "var(--ink)" }}>Report Defect / Create Rework Request</SheetTitle>
              <SheetDescription className="t-body-sm mt-1" style={{ color: "var(--muted)" }}>
                Capture the defect details. A unique Rework Job Order ID (RW-K2-2026-XXXXXX) will be generated on submission.
              </SheetDescription>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <AlertTriangle size={14} style={{ color: "var(--ht-burnt-orange)" }} />
              <span className="t-label" style={{ color: "var(--ht-burnt-orange)", fontWeight: 600 }}>Reported by: {user.name}</span>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* === Section 1: Link to Production Record === */}
          <FormSection number={1} title="Link to Production Record">
            <div className="grid grid-cols-2 gap-3">
              {/* Work Order dropdown */}
              <div className="col-span-2">
                <Label className="t-label" style={{ color: "var(--muted)" }}>Work Order *</Label>
                <Select value={form.workOrderId} onValueChange={(v) => setForm({ ...form, workOrderId: v, htuNo: "" })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: errors.workOrderId ? "var(--semantic-error)" : "var(--hairline)" }}>
                    <SelectValue placeholder="Select work order..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrders.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.woNumber} - {w.customer} - {w.itemName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workOrderId && <div className="t-label mt-1" style={{ color: "var(--semantic-error)" }}>{errors.workOrderId}</div>}
              </div>

              {/* Auto-populated WO details */}
              {selectedWO && (
                <div className="col-span-2 rounded-lg p-3 grid grid-cols-3 gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Customer</div>
                    <div className="t-body-sm" style={{ color: "var(--ink)" }}>{selectedWO.customer}</div>
                  </div>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Item</div>
                    <div className="t-body-sm truncate" style={{ color: "var(--ink)" }}>{selectedWO.itemName}</div>
                  </div>
                  <div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>Size / Finish</div>
                    <div className="t-body-sm truncate" style={{ color: "var(--ink)" }}>{selectedWO.size}</div>
                  </div>
                </div>
              )}

              {/* HTU dropdown - populated from existing inspections for this WO */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>HTU Number {availableHtus.length > 0 ? "(select existing)" : "(enter manually)"}</Label>
                {availableHtus.length > 0 ? (
                  <Select value={form.htuNo} onValueChange={(v) => setForm({ ...form, htuNo: v })}>
                    <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                      <SelectValue placeholder="Select HTU..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHtus.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.htuNo} onChange={(e) => setForm({ ...form, htuNo: e.target.value })} placeholder="e.g. HTU-3009-001" className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }} />
                )}
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>The HTU links this rework to the specific physical unit.</div>
              </div>

              {/* Defect Quantity */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Defect Quantity</Label>
                <Input type="number" min={1} value={form.defectQuantity} onChange={(e) => setForm({ ...form, defectQuantity: parseInt(e.target.value) || 1 })} className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: errors.defectQuantity ? "var(--semantic-error)" : "var(--hairline)" }} />
                {errors.defectQuantity && <div className="t-label mt-1" style={{ color: "var(--semantic-error)" }}>{errors.defectQuantity}</div>}
              </div>
            </div>
          </FormSection>

          {/* === Section 2: Defect Details === */}
          <FormSection number={2} title="Defect Details">
            <div className="grid grid-cols-2 gap-3">
              {/* Originating Process */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Originating Process *</Label>
                <Select value={form.originatingProcess} onValueChange={(v) => setForm({ ...form, originatingProcess: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: errors.originatingProcess ? "var(--semantic-error)" : "var(--hairline)" }}>
                    <SelectValue placeholder="Which process generated the defect?" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.originatingProcess && <div className="t-label mt-1" style={{ color: "var(--semantic-error)" }}>{errors.originatingProcess}</div>}
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>The process where the defect was introduced.</div>
              </div>

              {/* Detection Process */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Detection Process *</Label>
                <Select value={form.detectionProcess} onValueChange={(v) => setForm({ ...form, detectionProcess: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: errors.detectionProcess ? "var(--semantic-error)" : "var(--hairline)" }}>
                    <SelectValue placeholder="Where was the defect detected?" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROCESSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.detectionProcess && <div className="t-label mt-1" style={{ color: "var(--semantic-error)" }}>{errors.detectionProcess}</div>}
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>The stage where the defect was found. May differ from originating.</div>
              </div>

              {/* Defect Category */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Defect Category *</Label>
                <Select value={form.defectCategory} onValueChange={(v) => setForm({ ...form, defectCategory: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: errors.defectCategory ? "var(--semantic-error)" : "var(--hairline)" }}>
                    <SelectValue placeholder="Select defect type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFECT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.defectCategory && <div className="t-label mt-1" style={{ color: "var(--semantic-error)" }}>{errors.defectCategory}</div>}
              </div>

              {/* Severity - with color-coded options */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITIES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                        <span style={{ color: s.color }}>{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: form.severity === "Critical" ? "var(--semantic-error)" : form.severity === "Major" ? "var(--ht-burnt-orange)" : "var(--ht-slate-blue)" }} />
                  <span className="t-label" style={{ color: "var(--muted)" }}>{form.severity === "Critical" ? "Requires immediate containment" : form.severity === "Major" ? "Functional impact" : "Cosmetic only"}</span>
                </div>
              </div>

              {/* Detection Source */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Detection Source</Label>
                <Select value={form.detectionSource} onValueChange={(v) => setForm({ ...form, detectionSource: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DETECTION_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>How the defect was discovered.</div>
              </div>

              {/* Priority */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High - Production blocking</SelectItem>
                    <SelectItem value="Medium">Medium - Fix within shift</SelectItem>
                    <SelectItem value="Low">Low - Fix when capacity allows</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Defect Description - textarea */}
            <div className="mt-3">
              <Label className="t-label" style={{ color: "var(--muted)" }}>Defect Description *</Label>
              <Textarea
                value={form.defectDescription}
                onChange={(e) => setForm({ ...form, defectDescription: e.target.value })}
                placeholder="Describe the defect in detail: what is wrong, where on the product, how it was detected, and any immediate containment action taken..."
                className="mt-1 t-body-sm rounded-md"
                style={{ borderColor: errors.defectDescription ? "var(--semantic-error)" : "var(--hairline)", minHeight: 80 }}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.defectDescription ? (
                  <div className="t-label" style={{ color: "var(--semantic-error)" }}>{errors.defectDescription}</div>
                ) : (
                  <div className="t-label" style={{ color: "var(--muted-soft)" }}>Minimum 10 characters. Be specific for accurate root-cause analysis.</div>
                )}
                <span className="t-label" style={{ color: form.defectDescription.length < 10 ? "var(--muted-soft)" : "var(--semantic-success)" }}>{form.defectDescription.length} chars</span>
              </div>
            </div>
          </FormSection>

          {/* === Section 3: Routing & Assignment === */}
          <FormSection number={3} title="Routing & Assignment">
            <div className="grid grid-cols-2 gap-3">
              {/* Responsible Department */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Responsible Department</Label>
                <Select value={form.responsibleDept} onValueChange={(v) => setForm({ ...form, responsibleDept: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>The department responsible for the rework.</div>
              </div>

              {/* Rework Area */}
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Rework Area</Label>
                <Select value={form.reworkArea} onValueChange={(v) => setForm({ ...form, reworkArea: v })}>
                  <SelectTrigger className="mt-1 t-body-sm h-9 rounded-md" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue placeholder="Select rework location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {REWORK_AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>Where the physical rework will be performed.</div>
              </div>

              {/* Estimated Cost (optional) */}
              <div className="col-span-2">
                <Label className="t-label" style={{ color: "var(--muted)" }}>Estimated Cost (INR) - optional</Label>
                <Input
                  type="number"
                  value={form.estimatedCost}
                  onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
                  placeholder="e.g. 5000"
                  className="mt-1 t-body-sm h-9 rounded-md"
                  style={{ borderColor: "var(--hairline)" }}
                />
                <div className="t-label mt-1" style={{ color: "var(--muted-soft)" }}>Pre-execution estimate. Actual cost will be captured during rework execution.</div>
              </div>
            </div>
          </FormSection>

          {/* === Summary Preview === */}
          {form.defectCategory && form.originatingProcess && (
            <div className="rounded-lg p-4" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
              <div className="t-label mb-2" style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>Request Summary</div>
              <div className="grid grid-cols-2 gap-2 t-body-sm">
                <div><span style={{ color: "var(--muted)" }}>WO:</span> <span style={{ color: "var(--ink)", fontWeight: 500 }}>{selectedWO?.woNumber || "-"}</span></div>
                <div><span style={{ color: "var(--muted)" }}>HTU:</span> <span style={{ color: "var(--ink)" }}>{form.htuNo || "-"}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Defect:</span> <span style={{ color: "var(--ink)", fontWeight: 500 }}>{form.defectCategory}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Severity:</span> <span style={{ color: form.severity === "Critical" ? "var(--semantic-error)" : form.severity === "Major" ? "var(--ht-burnt-orange)" : "var(--ht-slate-blue)", fontWeight: 500 }}>{form.severity}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Origin:</span> <span style={{ color: "var(--ink)" }}>{form.originatingProcess}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Detected:</span> <span style={{ color: "var(--ink)" }}>{form.detectionProcess || "-"}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Qty:</span> <span style={{ color: "var(--ink)" }}>{form.defectQuantity}</span></div>
                <div><span style={{ color: "var(--muted)" }}>Dept:</span> <span style={{ color: "var(--ink)" }}>{form.responsibleDept}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t sticky bottom-0 flex justify-between items-center" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <div className="t-label" style={{ color: "var(--muted)" }}>
            {form.defectCategory && form.originatingProcess ? "Ready to submit" : "Complete required fields to submit"}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="t-body-sm h-9 px-4 rounded-md">Cancel</Button>
            <Button onClick={submit} disabled={saving} className="t-body-sm h-9 px-4 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create Rework Request</>}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Form section wrapper with numbered header
function FormSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center t-label font-semibold" style={{ width: 22, height: 22, borderRadius: 4, backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>{number}</span>
        <h3 className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ============================================================
// Organization Module - employee hierarchy, vacancies, delegations
// (Phase 1 foundation - UI shell with employee list and tree)

// ============================================================
// Organization Module - visual tree chart with CSS flexbox
// ============================================================

// Tree node card
function TreeNode({ name, role, color, vacant }: { name: string; role: string; color: "yellow" | "green" | "orange" | "blue" | "grey"; vacant?: boolean }) {
  const cmap = {
    yellow: { bg: "#D4A85A14", border: "#D4A85A", text: "#8a6835" },
    green: { bg: "#15964014", border: "#159640", text: "var(--ht-green)" },
    orange: { bg: "#D36E2E14", border: "#D36E2E", text: "var(--ht-burnt-orange)" },
    blue: { bg: "#57659014", border: "#576590", text: "var(--ht-slate-blue)" },
    grey: { bg: "var(--canvas-soft)", border: "var(--hairline-strong)", text: "var(--muted)" },
  };
  const c = cmap[color];
  return (
    <div
      className="rounded-md px-3 py-2 text-center"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderTop: `3px solid ${c.border}`,
        minWidth: 120,
        maxWidth: 160,
      }}
    >
      <div className="t-body-sm" style={{ color: vacant ? "var(--muted)" : "var(--ink)", fontWeight: 600, fontStyle: vacant ? "italic" : "normal", lineHeight: 1.2 }}>
        {name}
      </div>
      <div className="t-label mt-0.5" style={{ color: c.text, lineHeight: 1.2 }}>
        {role}
      </div>
    </div>
  );
}

// Vertical connector line
function VLine({ h = 20 }: { h?: number }) {
  return <div style={{ width: 2, height: h, backgroundColor: "var(--hairline-strong)" }} />;
}

// Horizontal connector (for sibling groups)
function HConnect() {
  return (
    <div className="flex flex-col items-center">
      <div style={{ height: 10, width: 2, backgroundColor: "var(--hairline-strong)" }} />
    </div>
  );
}

function OrganizationModule({ currentUser }: { currentUser: User }) {
  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Administration"
        title="Organization Hierarchy"
        subtitle="K2 Khopoli Galvanizing Plant - reporting structure and QMS role mapping."
        info="The organization hierarchy below is derived from the HR-issued organization chart. Each employee's department, designation, reporting manager, and authorized QMS role are configured separately. Vacant positions are shown in grey - they do not have active user accounts."
      />
      <div className="p-4 md:p-8">

        {/* Configuration Notes */}
        <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
          <div className="flex items-start gap-2.5">
            <InfoTooltip text="These rules govern how the QMS maps organizational authority to application permissions." position="right" size={14} />
            <div className="flex-1">
              <div className="t-body-sm font-medium mb-1.5" style={{ color: "var(--ink)" }}>QMS Configuration Notes</div>
              <ul className="space-y-1 t-label" style={{ color: "var(--muted)", lineHeight: 1.5 }}>
                <li>1. Organizational reporting and QMS access roles are distinct concepts.</li>
                <li>2. Each employee's department, designation, reporting manager, and authorized QMS role are configured separately.</li>
                <li>3. Vacant positions are represented without creating active user accounts.</li>
                <li>4. Dotted reporting relationships are preserved wherever indicated in the source chart.</li>
                <li>5. Exact reporting lines and designations must be validated against HR records before activating approval workflows.</li>
                <li>6. Missing subordinate positions or reporting relationships are not inferred or auto-created.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ============ ORG TREE CHART ============ */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Organization Chart - K2 Khopoli</h3>

          {/* Level 0: Plant Director */}
          <div className="flex flex-col items-center">
            <TreeNode name="Yogesh Jadhav" role="Plant Director" color="yellow" />
            <VLine h={16} />
            {/* Level 1: Vacant Plant Head */}
            <TreeNode name="Plant Head" role="Vacant - K2 Khopoli" color="grey" vacant />
            <VLine h={16} />

            {/* Level 2: Leadership row (4 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full" style={{ borderTop: "2px solid var(--hairline-strong)", paddingTop: 16 }}>
              {/* Col 1: Production (Roshan Gaikar) */}
              <div className="flex flex-col items-center">
                <TreeNode name="Roshan Gaikar" role="Section Head / AGM - Fabrication" color="green" />
                <VLine h={12} />
                <div className="flex flex-col gap-2 items-center">
                  <TreeNode name="Atul Patidar" role="Line Mgr - Fabrication" color="orange" />
                  <TreeNode name="Pankaj Karmikar" role="Line Mgr - Fabrication" color="orange" />
                  <TreeNode name="Yogesh Kharade" role="Line Mgr - Fabrication" color="orange" />
                  <TreeNode name="Rakesh Gupte" role="Line Mgr - Panel Line" color="orange" />
                </div>
              </div>

              {/* Col 2: Paint Shop (Naveen Tuniki) */}
              <div className="flex flex-col items-center">
                <TreeNode name="Naveen Tuniki" role="Section Head / AGM - Paint Shop" color="green" />
                <VLine h={12} />
                <TreeNode name="Pritam Padme" role="Line Mgr - Paint Shop" color="orange" />
              </div>

              {/* Col 3: Galvanizing (Dayakrishan Bhatt) */}
              <div className="flex flex-col items-center">
                <TreeNode name="Dayakrishan Bhatt" role="Section Head / AGM - Galvanizing" color="green" />
                <VLine h={12} />
                <TreeNode name="Ganesh Mhoprekar" role="Line Mgr / Sr. Engineer" color="orange" />
                <VLine h={8} />
                <div className="flex flex-col gap-1.5 items-center">
                  <TreeNode name="Mukesh Kapse" role="Shift Engineer" color="blue" />
                  <TreeNode name="Pradik Patil" role="Shift Engineer" color="blue" />
                  <TreeNode name="Akash Patil" role="Shift Engineer" color="blue" />
                </div>
              </div>

              {/* Col 4: Internal Coating (Saurabh Jadhav) */}
              <div className="flex flex-col items-center">
                <TreeNode name="Saurabh Jadhav" role="Section Head / Asst. Mgr - Internal Coating" color="green" />
                <div className="mt-2 t-label italic" style={{ color: "var(--muted-soft)" }}>No subordinate per chart</div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ QUALITY - FABRICATION & WELDING ============ */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Quality - Fabrication &amp; Welding</h3>
          <div className="flex flex-col items-center">
            <TreeNode name="Balasaheb Daphal" role="DGM, Quality - Fab &amp; Welding" color="green" />
            <VLine h={16} />
            <TreeNode name="Rohit Giri" role="Line Mgr / Asst. Mgr - Quality Fab" color="orange" />
            <VLine h={12} />
            <div className="flex gap-4">
              <TreeNode name="Rohan Ghodvinde" role="Inspector - Quality Fab" color="blue" />
              <TreeNode name="Chaitanya Aher" role="Inspector - Quality Fab" color="blue" />
            </div>
          </div>
        </div>

        {/* ============ QUALITY - PAINT & FINAL ============ */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Quality - Paint &amp; Final</h3>
          <div className="flex flex-col items-center">
            <TreeNode name="Ramji Niranjan" role="DGM, Quality - Paint &amp; Final" color="green" />
            <VLine h={16} />
            <div className="flex gap-6 flex-wrap justify-center">
              {/* Galva Quality branch */}
              <div className="flex flex-col items-center">
                <TreeNode name="Nirmal Kumar" role="Line Mgr / Sr. Mgr - Galva" color="orange" />
                <VLine h={10} />
                <TreeNode name="Rahul Patil" role="Shift Engineer - Galva" color="blue" />
              </div>
              {/* Vacant branch */}
              <div className="flex flex-col items-center">
                <TreeNode name="Line Manager" role="Vacant - Paint &amp; Final" color="grey" vacant />
              </div>
              {/* Shift engineers branch */}
              <div className="flex flex-col items-center">
                <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Shift Engineers - Internal Coating / Paint</div>
                <div className="flex flex-col gap-1.5">
                  <TreeNode name="Rohit Dhakre" role="Shift Engineer" color="blue" />
                  <TreeNode name="Rakesh Ghosalkar" role="Shift Engineer" color="blue" />
                  <TreeNode name="Manish Ramdhane" role="Shift Engineer" color="blue" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ MAINTENANCE ============ */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Maintenance</h3>
          <div className="flex flex-col items-center">
            <TreeNode name="Maintenance Head" role="Vacant - Group Maintenance" color="grey" vacant />
            <VLine h={16} />
            <TreeNode name="Nikhil Singh" role="Line Mgr / Sr. Mgr - Maintenance" color="orange" />
            <VLine h={12} />
            <div className="flex gap-4 flex-wrap justify-center">
              <TreeNode name="Antaryami Dehury" role="Technician" color="blue" />
              <TreeNode name="Akash Patil" role="Technician" color="blue" />
              <TreeNode name="Shahbaz Jalgaonkar" role="Technician" color="blue" />
            </div>
          </div>
        </div>

        {/* ============ DISPATCH - K2 ============ */}
        <div className="rounded-xl p-6 mb-6" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Dispatch - K2</h3>
          <div className="flex flex-col items-center">
            <TreeNode name="Shailesh Rane" role="Senior Engineer - Dispatch K2" color="orange" />
            <VLine h={16} />
            <div className="flex gap-4">
              <TreeNode name="Rupesh Deshmukh" role="Line Mgr - Dispatch" color="blue" />
              <TreeNode name="Vacant Position" role="Line Mgr - Dispatch" color="grey" vacant />
            </div>
          </div>
        </div>

        {/* Color Legend */}
        <div className="rounded-lg p-4" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
          <div className="t-body-sm font-medium mb-2" style={{ color: "var(--ink)" }}>Role Color Legend</div>
          <div className="flex flex-wrap gap-4">
            {[
              { c: "#D4A85A", l: "Plant Director" },
              { c: "#159640", l: "Section Head / DGM" },
              { c: "#D36E2E", l: "Line Manager / Engineer" },
              { c: "#576590", l: "Shift Engineer / Inspector" },
              { c: "var(--hairline-strong)", l: "Vacant Position" },
            ].map(item => (
              <div key={item.l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.c }} />
                <span className="t-label" style={{ color: "var(--body)" }}>{item.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
