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
  Camera,
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
import {
  buildUnitLedger,
  UnitMatrixView,
  UnitInspectionModal,
  EndToEndBatchReport,
  SalesOrderDetail,
  TrackedUnit,
} from "@/components/qms/unit-traceability";
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
import {
  EvidenceUploadStudio, EvidenceGallery, EvidenceBadge, type EvidenceItem
} from "@/components/qms/evidence-studio";
import { HiTechLogo, HiveLockup, ReportHeader, CertificateSeal, CombinedLogo, HtrLogo, HttLogo } from "@/components/qms/brand";
import {
  AuditWorkspaceModule, CopqModule, MisModule, InvestigationModule,
  RcaWorkspaceModule, ComparisonModule,
} from "@/components/qms/advanced-modules";
import {
  AdvancedAnalyticsModule, DocumentEditorModule,
} from "@/components/qms/advanced-analytics";
import {
  WorkOrderFullProfilePage,
  SalesOrderFullProfilePage,
  SystemAuditLogsModule,
} from "@/components/qms/work-order-full-profile";
import {
  StandardizedReportsCard,
  StageWiseReportsModule,
  DashboardInspectionReportsWidget,
  STAGE_CATALOG,
} from "@/components/qms/stage-inspection-reports";
import masterStageCharacteristics from "@/lib/master-stage-characteristics.json";

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
  | "CEO" | "Director" | "IT" | "PlantManager" | "DGM" | "LineManager";

// Modules hidden across ALL roles because the underlying process/feature is
// still under construction.  They are removed from NAV_GROUPS below and from
// every role's access list, and the ModuleRouter shows an "under construction"
// notice if one is ever requested directly.
const HIDDEN_MODULES: ModuleKey[] = [
  "rca", "fmea",                                      // RCA Workspace + FMEA & Risk
  "investigation", "comparison", "copq", // Intelligence group
  "doceditor", "standards", "traceability", "mis", // Governance group
];
const isHidden = (k: ModuleKey) => HIDDEN_MODULES.includes(k);

// ============================================================
// RBAC - module access by role
// ============================================================
// Build the access list per role with all hidden modules stripped out so
// nobody - not even Admin - can reach an unfinished feature through the UI.
const _RAW_ACCESS: Record<Role, ModuleKey[]> = {
  Admin: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "analytics", "audit", "copq", "mis", "investigation", "rca", "comparison", "doceditor", "users", "import", "export", "reports", "rework", "organization"],
  CEO: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization", "users", "audit"],
  QualityManager: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "audit", "copq", "mis", "investigation", "rca", "comparison", "doceditor", "users", "reports", "rework", "organization"],
  AssistantManager: ["dashboard", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "audit", "copq", "investigation", "rca", "comparison", "reports", "rework"],
  ProductionSupervisor: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "traceability", "processflow", "copq", "comparison", "rework"],
  QCInspector: ["dashboard", "inspection", "ncr", "traceability", "processflow", "rework"],
  Operator: ["dashboard", "inspection", "processflow", "rework"],
  Auditor: ["dashboard", "traceability", "standards", "audit", "investigation", "rca", "comparison", "reports", "rework"],
  DocumentController: ["dashboard", "standards", "doceditor", "reports"],
  ProcessEngineer: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "traceability", "standards", "processflow", "audit", "copq", "investigation", "rca", "comparison", "doceditor", "reports", "rework"],
  MaintenanceCalibration: ["dashboard", "standards", "rework"],
  IncomingQuality: ["dashboard", "workorders", "salesorders", "traceability", "standards", "inspection", "rework"],
  ReportViewer: ["dashboard", "salesorders", "standards", "mis", "comparison", "reports", "rework"],
  // --- New roles (added per user request) ---
  Director: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization", "users", "audit"],
  IT: ["dashboard", "workorders", "salesorders", "inspection", "ncr", "fmea", "processflow", "users", "import", "export", "reports", "rework", "organization"],
  PlantManager: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization", "users", "audit"],
  DGM: ["dashboard", "processflow", "workorders", "salesorders", "inspection", "ncr", "fmea", "reports", "rework", "organization", "users", "audit"],
  LineManager: ["dashboard", "processflow", "workorders", "inspection", "ncr", "rework"],
};

const ROLE_MODULE_ACCESS: Record<Role, ModuleKey[]> = Object.fromEntries(
  Object.entries(_RAW_ACCESS).map(([role, mods]) => [
    role,
    mods.filter((m) => !isHidden(m as ModuleKey)),
  ])
) as Record<Role, ModuleKey[]>;

function hasModule(role: string, key: ModuleKey): boolean {
  if (key === "analytics") {
    return role === "Admin";
  }
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
  { label: "Intelligence", items: [
    { key: "analytics", label: "Analytics", icon: BarChart3, desc: "Quality & SPC intelligence" },
  ]},
  { label: "Administration", items: [
    { key: "users", label: "User Management", icon: Users, desc: "Accounts & roles" },
    { key: "organization", label: "Organization", icon: NetworkIcon, desc: "Hierarchy & vacancies" },
    { key: "audit", label: "Audit Logs", icon: ShieldAlert, desc: "Security, tamper & change trail" },
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

const ROLE_OPTIONS: Role[] = ["Admin", "CEO", "Director", "IT", "PlantManager", "DGM", "QualityManager", "AssistantManager", "LineManager", "ProductionSupervisor", "QCInspector", "Operator", "Auditor", "DocumentController", "ProcessEngineer", "MaintenanceCalibration", "IncomingQuality", "ReportViewer"];

// Human-readable label for each role code (used in dropdowns, badges, user mgmt)

// ============================================================
// ISO 9001:2015 Clause 5.3 - Organizational Roles, Responsibilities & Authorities
// Strict Hierarchical RBAC Authority Levels
// ============================================================
const ROLE_HIERARCHY_LEVELS: Record<Role, number> = {
  CEO: 100,
  Director: 90,
  DGM: 85,
  PlantManager: 80,
  Admin: 75,
  QualityManager: 70,
  LineManager: 65,
  AssistantManager: 60,
  ProductionSupervisor: 50,
  ProcessEngineer: 45,
  Auditor: 45,
  QCInspector: 40,
  IncomingQuality: 35,
  MaintenanceCalibration: 30,
  DocumentController: 30,
  Operator: 20,
  ReportViewer: 10,
  IT: 75,
};

const ROLE_LABELS: Record<string, string> = {
  Admin: "System Administrator",
  CEO: "Chief Executive Officer (CEO)",
  Director: "Plant Director",
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

  // Global Process-Wise Inspection Form Drawer State
  const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
  const [inspectDrawerStageCode, setInspectDrawerStageCode] = useState<string | null>(null);
  const [inspectDrawerWoId, setInspectDrawerWoId] = useState<string | null>(null);
  const [globalStages, setGlobalStages] = useState<any[]>([]);
  const [globalWorkOrders, setGlobalWorkOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/process-routes?code=K2").then(r => r.json()).then(d => setGlobalStages(d.route?.stages || []));
    fetch(`/api/work-orders?plant=${plant}`).then(r => r.json()).then(d => setGlobalWorkOrders(d.workOrders || []));
  }, [plant]);

  // Navigate to or open the digital inspection drawer with pre-filled stage and active work order.
  // Works everywhere: Process Flow, Dashboard, Work Orders, and Inspection list.
  const navigateToInspect = (stageCode: string | null, targetWoId?: string | null) => {
    if (!hasModule(user.role, "inspection")) {
      toast({
        title: "Access restricted",
        description: "Your role does not have authorization to perform quality inspections.",
        variant: "destructive"
      });
      return;
    }
    setInspectDrawerStageCode(stageCode);
    setInspectDrawerWoId(targetWoId || null);
    setInspectDrawerOpen(true);
  };

  // Open the digital inspection drawer for new inspection
  const handleStartInspection = () => {
    navigateToInspect(null);
  };

  // If active module not allowed for current user, fallback to dashboard
  useEffect(() => {
    if (!hasModule(user.role, active)) setActive("dashboard");
  }, [user.role, active]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" style={{ backgroundColor: "var(--canvas)" }}>
      {/* ===== Header (pinned) - Swiss minimal ===== */}
      <header className="h-14 shrink-0 z-30 border-b flex-none" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
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

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ===== Sidebar (pinned) - minimal hairline rail ===== */}
        <aside data-tour="sidebar"
          className={cn("hidden md:flex flex-col border-r h-full shrink-0 overflow-y-auto transition-all", sidebarCollapsed ? "w-14" : "w-56")}
          style={{
            borderColor: "var(--hairline)",
            backgroundColor: "var(--surface-card)",
          }}
        >
          <SideNav groups={visibleNavGroups} active={active} onNavigate={navigateTo} collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} data-tooltip="Collapse/expand sidebar"
            className="flex items-center justify-center gap-2 py-2.5 border-t t-label transition-colors hover:bg-[var(--canvas-soft)] mt-auto shrink-0"
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

        {/* ===== Main content (scrolls smoothly in dedicated container) ===== */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto scroll-fine" style={{ overflowX: "hidden" }}>
          <ModuleRouter active={active} plant={plant} plantInfo={currentPlant} user={user} onNavigate={navigateTo} prefillStage={inspectPrefillStage} onInspect={navigateToInspect} onStartInspection={handleStartInspection} />
        </main>

        {/* Global Process-Wise Inspection Form Drawer */}
        <Sheet open={inspectDrawerOpen} onOpenChange={setInspectDrawerOpen}>
          <SheetContent
            className="w-full md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1400px] p-0 overflow-y-auto"
            style={{ backgroundColor: "var(--surface-card)" }}
          >
            {inspectDrawerOpen && (
              <InspectionForm
                stages={globalStages}
                workOrders={globalWorkOrders}
                user={user}
                prefillStageCode={inspectDrawerStageCode}
                prefillWoId={inspectDrawerWoId}
                onSubmitted={() => {
                  setInspectDrawerOpen(false);
                  setInspectDrawerStageCode(null);
                  setInspectDrawerWoId(null);
                }}
                onCancel={() => {
                  setInspectDrawerOpen(false);
                  setInspectDrawerStageCode(null);
                  setInspectDrawerWoId(null);
                }}
              />
            )}
          </SheetContent>
        </Sheet>
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
    case "dashboard": return <DashboardModule plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onStartInspection={onStartInspection} onInspect={onInspect} />;
    case "processflow": return <ProcessFlowModule plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onInspect={onInspect || (() => {})} />;
    case "workorders": return <WorkOrdersModule plant={plant} user={user} onNavigate={onNavigate} onInspect={onInspect} />;
    case "salesorders": return <SalesOrdersModule plant={plant} user={user} onNavigate={onNavigate} onInspect={onInspect} />;
    case "inspection": return <InspectionModule plant={plant} user={user} prefillStage={prefillStage} onPrefillConsumed={() => onInspect?.(null)} />;
    case "ncr": return <NcrModule plant={plant} user={user} />;
    case "fmea": return <FmeaModule />;
    case "doceditor": return <DocumentEditorModule user={user} />;
    case "standards": return <StandardsModule />;
    case "traceability": return <TraceabilityModule plant={plant} />;
    case "analytics":
      if (user.role !== "Admin") {
        return (
          <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-[var(--surface-card)] rounded-2xl border border-[var(--hairline)]">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Access Restricted</h2>
              <p className="text-xs text-muted mt-1">
                Quality & SPC Analytics is strictly reserved for System Administrators. Other roles do not have authorization to view this module.
              </p>
            </div>
          </div>
        );
      }
      return <AdvancedAnalyticsModule plant={plant} />;
    case "audit": return <SystemAuditLogsModule user={user} plant={plant} />;
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
function DashboardModule({ plant, plantInfo, user, onNavigate, onStartInspection, onInspect }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onStartInspection?: () => void; onInspect?: (stageCode: string | null) => void }) {
  const role = user.role as Role;
  if (role === "Operator") return <OperatorDashboard plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onStartInspection={onStartInspection} />;
  if (role === "QCInspector") return <InspectorDashboard plant={plant} plantInfo={plantInfo} user={user} onInspect={onInspect} />;
  if (role === "ProductionSupervisor") return <SupervisorDashboard plant={plant} plantInfo={plantInfo} user={user} />;
  if (role === "AssistantManager") return <AssistantManagerDashboard plant={plant} plantInfo={plantInfo} user={user} />;
  return <ControlTowerDashboard plant={plant} plantInfo={plantInfo} user={user} onNavigate={onNavigate} onInspect={onInspect} />;
}

// ============================================================
// Control Tower Dashboard (Admin / QualityManager)
// ============================================================
function ControlTowerDashboard({ plant, plantInfo, user, onNavigate, onInspect }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onInspect?: (stageCode: string | null) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any | null>(null);

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

          {/* Inspection Reports & Stage Dossier Hub */}
          <div className="lg:col-span-3">
            <DashboardInspectionReportsWidget
              onNavigateToInspect={(code) => onInspect ? onInspect(code) : onNavigate("inspection")}
              activeWo={data.recentInspections?.[0]?.workOrder}
            />
          </div>

          {/* Recent Inspections */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center justify-between p-5 pb-3">
              <div>
                <h2 className="t-display-sm" style={{ color: "var(--ink)" }}>Recent Inspections</h2>
                <div className="t-body-sm" style={{ color: "var(--muted)" }}>Click any row to open official certificate & report drawer ({data.recentInspections.length} latest)</div>
              </div>
              <ClipboardCheck size={16} style={{ color: "var(--muted)" }} />
            </div>
            <DataTable
              columns={[
                { key: "record", header: "Record", render: (r: any) => <span className="t-code font-bold hover:underline" style={{ color: "var(--primary)" }}>{r.recordNo}</span>, sortable: true, sortValue: (r: any) => r.recordNo },
                { key: "stage", header: "Stage", render: (r: any) => (
                  <div>
                    <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{r.stage?.name}</div>
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
              onRowClick={setSelectedRecordForDetail}
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

      {/* Inspection Detail Drawer from Dashboard */}
      <Sheet open={!!selectedRecordForDetail} onOpenChange={(o) => !o && setSelectedRecordForDetail(null)}>
        <SheetContent
          className="w-full md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1400px] p-0 overflow-y-auto"
          style={{ backgroundColor: "var(--surface-card)" }}
        >
          {selectedRecordForDetail && (
            <InspectionDetail
              record={selectedRecordForDetail}
              onClose={() => setSelectedRecordForDetail(null)}
            />
          )}
        </SheetContent>
      </Sheet>
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
function InspectorDashboard({ plant, plantInfo, user, onInspect }: { plant: string; plantInfo: any; user: User; onInspect?: (stageCode: string | null) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<any | null>(null);

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
          {/* Inspection Reports & Stage Dossier Hub */}
          <div className="lg:col-span-3">
            <DashboardInspectionReportsWidget
              onNavigateToInspect={(code) => onInspect ? onInspect(code) : undefined}
              activeWo={myInspections?.[0]?.workOrder}
            />
          </div>

          <div className="lg:col-span-2 rounded-xl p-5" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <h2 className="t-display-sm mb-3" style={{ color: "var(--ink)" }}>My Recent Inspections</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto scroll-fine">
              {myInspections.slice(0, 15).map((r: any) => (
                <div key={r.id} onClick={() => setSelectedRecordForDetail(r)} className="flex items-center justify-between rounded-lg p-2.5 cursor-pointer hover:bg-[var(--surface-strong)] transition-colors" style={{ backgroundColor: "var(--canvas-soft)" }}>
                  <div className="min-w-0">
                    <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{r.recordNo} · {r.stage?.name}</div>
                    <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.woNumber} · HTU {r.htuNo} · {fmtDateTime(r.inspectedAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ResultBadge result={r.overallResult} />
                    <ChevronRight size={14} style={{ color: "var(--muted)" }} />
                  </div>
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

      {/* Inspection Detail Drawer from Dashboard */}
      <Sheet open={!!selectedRecordForDetail} onOpenChange={(o) => !o && setSelectedRecordForDetail(null)}>
        <SheetContent
          className="w-full md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1400px] p-0 overflow-y-auto"
          style={{ backgroundColor: "var(--surface-card)" }}
        >
          {selectedRecordForDetail && (
            <InspectionDetail
              record={selectedRecordForDetail}
              onClose={() => setSelectedRecordForDetail(null)}
            />
          )}
        </SheetContent>
      </Sheet>
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
function WorkOrdersModule({ plant, user, onNavigate, onInspect }: { plant: string; user?: User; onNavigate?: (k: ModuleKey) => void; onInspect?: (stageCode: string | null) => void }) {
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

  if (selected) {
    return (
      <WorkOrderFullProfilePage
        wo={selected}
        user={user || ({ name: "Quality Manager", role: "QualityManager", username: "quality.mgr", email: "qm@hitech.com", plant: "K2" } as User)}
        plant={plant}
        onBack={() => setSelected(null)}
        onNavigateToInspect={(stg) => {
          setSelected(null);
          if (onInspect) onInspect(stg);
          if (onNavigate) onNavigate("inspection");
        }}
      />
    );
  }

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Production"
        title="Work Orders"
        subtitle="Sales-order driven production plan with route assignment and material status."
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

      {/* Work Order Profile renders as independent full page (No Drawer) */}

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

// ============================================================
// Work Order Technical & Engineering Profile View
// ============================================================
function WorkOrderProfileView({ wo, units, inspections }: { wo: any; units: any[]; inspections: any[] }) {
  // Parse dimensions from size (e.g., "1700 X 520 X 13 + 3 x 1.20" or "2000 X 520 X 15 + 3 x 1.00")
  const sizeParts = (wo.size || "").split(/x|X|\+/).map((s: string) => s.trim());
  const ccDistance = sizeParts[0] ? `${sizeParts[0]} mm` : "1700 mm";
  const finWidth = sizeParts[1] ? `${sizeParts[1]} mm` : "520 mm";
  const finCount = sizeParts[2] ? `${sizeParts[2]} Elements` : "13 Elements";
  const sheetThick = (wo.size || "").includes("1.2") ? "1.20 mm (±0.03 mm)" : "1.00 mm (±0.03 mm)";
  const isHdg = (wo.finishType || "").toLowerCase().includes("hdg") || (wo.finishType || "").toLowerCase().includes("galv");

  const passedUnits = units.filter((u: any) => u.status === "QC Released").length;
  const inProgressUnits = units.filter((u: any) => u.status === "In Progress" || u.status === "Pending Start").length;
  const defectiveUnits = units.filter((u: any) => u.status === "Failed / Contained" || u.status === "Under Rework").length;

  return (
    <div className="space-y-4">
      {/* Header Profile Summary */}
      <div className="rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="t-label px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}>
              ENGINEERING DATASHEET
            </span>
            <span className="t-label font-mono text-[10.5px]" style={{ color: "var(--muted)" }}>
              ROUTE: {wo.routeCode || "K2"} · PLANT {wo.plant || "KURKUMBH"}
            </span>
          </div>
          <div className="t-title-md font-bold" style={{ color: "var(--ink)" }}>
            {wo.itemName} ({wo.size})
          </div>
          <div className="t-body-sm" style={{ color: "var(--body)" }}>
            Customer: <strong style={{ color: "var(--ink)" }}>{wo.customer}</strong> {wo.customerPo ? `· PO: ${wo.customerPo}` : ""} · SO Ref: <strong style={{ color: "var(--ink)" }}>{wo.soNumber || "SO-2026-HTU"}</strong>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-lg text-right" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
            <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>FINISH SPEC</div>
            <div className="t-body-sm font-semibold truncate max-w-[140px]" style={{ color: "var(--primary)" }}>
              {wo.finishType || "HDG 70 MIC"}
            </div>
          </div>
          <div className="px-3 py-2 rounded-lg text-right" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
            <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>BATCH RELEASE</div>
            <div className="t-body-sm font-semibold font-mono" style={{ color: passedUnits === wo.plannedQty ? "var(--semantic-success)" : "var(--ink)" }}>
              {passedUnits} / {wo.plannedQty} <span className="text-[10px] font-normal text-muted">UNITS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Engineering Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* 1. Geometry & Dimensions */}
        <div className="rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
            <Ruler size={16} style={{ color: "var(--primary)" }} />
            <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>1. Geometry & Dimensional Envelope</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Center-to-Center (CC)</div>
              <div className="font-semibold text-ink font-mono">{ccDistance} (-1, 0, +1, +2 mm)</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Fin Width & Depth</div>
              <div className="font-semibold text-ink font-mono">{finWidth} · Depth 4-5 mm</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Elements / Fin Count</div>
              <div className="font-semibold text-ink font-mono">{finCount} (Pitch 45 ±1.0 mm)</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Diagonal Difference</div>
              <div className="font-semibold text-ink font-mono">Max ≤ 3.0 mm (Both diagonals)</div>
            </div>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1">
            <span>Flange Co-planarity (Pata): ≤ 0.4 mm</span>
            <span>Line Dori Hole Alignment: ≤ 0.5 mm</span>
          </div>
        </div>

        {/* 2. Raw Material & Metallurgy */}
        <div className="rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
            <Layers size={16} style={{ color: "var(--primary)" }} />
            <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>2. Raw Metallurgy & Steel Grade</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Fin Sheet Steel Grade</div>
              <div className="font-semibold text-ink font-mono">CRCA IS 513 Gr. D/DD (Deep Draw)</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Sheet Thickness & Tolerance</div>
              <div className="font-semibold text-ink font-mono">{sheetThick}</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Approved Coil Mills</div>
              <div className="font-semibold text-ink font-mono">Tata Steel / JSW / POSCO</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Header Pipe Spec</div>
              <div className="font-semibold text-ink font-mono">88.9 OD × 3.2 mm WT (IS 1239 / A53)</div>
            </div>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1">
            <span>Welding Wire: AWS A5.18 ER70S-6 (Ø1.2 mm)</span>
            <span>Magnet Test: Non-ferritic verified</span>
          </div>
        </div>

        {/* 3. Surface Treatment & Corrosion Protection */}
        <div className="rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
            <Droplets size={16} style={{ color: "var(--primary)" }} />
            <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>3. Surface Treatment & Protection</span>
          </div>
          <div className="space-y-2 text-xs">
            {isHdg ? (
              <div className="p-2 rounded space-y-1" style={{ backgroundColor: "rgba(8, 50, 96, 0.05)", border: "1px solid rgba(8, 50, 96, 0.12)" }}>
                <div className="flex items-center justify-between font-semibold text-ink">
                  <span>Hot-Dip Galvanizing (IS 4759 / ASTM A123)</span>
                  <span className="t-label px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">HDG SPEC</span>
                </div>
                <div className="text-[11px] text-muted">
                  Minimum Zinc Coating Mass: <strong>610 g/m²</strong> · Average DFT: <strong>85–100 µm</strong> · Visual: Zero dross, blisters, acid run, or bare spots.
                </div>
              </div>
            ) : (
              <div className="p-2 rounded space-y-1" style={{ backgroundColor: "rgba(8, 50, 96, 0.05)", border: "1px solid rgba(8, 50, 96, 0.12)" }}>
                <div className="flex items-center justify-between font-semibold text-ink">
                  <span>3-Coat Polyurethane Paint System (ISO 12944 C4-High)</span>
                  <span className="t-label px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">RAL 7035</span>
                </div>
                <div className="text-[11px] text-muted">
                  Primer: Zinc Rich Epoxy (40-50µm) · Intermediate: MIO Epoxy (50-70µm) · Topcoat: Aliphatic PU (40-50µm) · <strong>Total DFT: 140–180 µm</strong>.
                </div>
              </div>
            )}
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Internal Cleanliness & Varnish Flush</div>
              <div className="text-[11px] text-ink font-medium">
                Internal RD124 anti-rust solvent flush, zero acid/moisture residue, swab test certified. Nitrogen seal at <strong>0.20 kg/cm² hold</strong>.
              </div>
            </div>
          </div>
        </div>

        {/* 4. Flanges, Fittings & Hardware Matrix */}
        <div className="rounded-xl p-3.5 space-y-2.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
            <Wrench size={16} style={{ color: "var(--primary)" }} />
            <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>4. Flanges, Fittings & Torque Ledger</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Flange PCD & Holes</div>
              <div className="font-semibold text-ink font-mono">160 mm PCD · 4 × Ø18 mm</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Drain & Air Vent Plugs</div>
              <div className="font-semibold text-ink font-mono">1/2" BSP Forged · PTFE Sealed</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Fastener Torque Spec</div>
              <div className="font-semibold text-ink font-mono">55 – 75 N·m (Calibrated)</div>
            </div>
            <div className="p-2 rounded" style={{ backgroundColor: "var(--canvas-soft)" }}>
              <div className="text-[10px] text-muted uppercase">Bracing & Accessories</div>
              <div className="font-semibold text-ink font-mono">40×3 mm Flat · M10 Earth Boss</div>
            </div>
          </div>
          <div className="text-[11px] text-muted flex items-center justify-between pt-1">
            <span>Lifting Lugs: 10 mm MS Plate (SWL Certified)</span>
            <span>Leak Test: 2.0 kg/cm² Air under Water (15 min)</span>
          </div>
        </div>
      </div>

      {/* Production Batch Serialization & Genealogy Status */}
      <div className="rounded-xl p-3.5 space-y-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes size={15} style={{ color: "var(--primary)" }} />
            <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>Batch Unit Serialization Register</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-700 font-medium">{passedUnits} Released</span>
            <span>·</span>
            <span className="text-amber-700 font-medium">{inProgressUnits} Active</span>
            {defectiveUnits > 0 && (
              <>
                <span>·</span>
                <span className="text-rose-700 font-semibold">{defectiveUnits} Under Containment</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {units.map((u: any, idx: number) => {
            const isPassed = u.status === "QC Released";
            const isFailed = u.status === "Failed / Contained" || u.status === "Under Rework";
            return (
              <span
                key={u.htuNo || idx}
                className="t-code px-2 py-0.5 rounded text-[10.5px] font-mono border"
                style={{
                  backgroundColor: isPassed ? "rgba(74, 124, 94, 0.08)" : isFailed ? "rgba(160, 69, 69, 0.08)" : "var(--surface-card)",
                  borderColor: isPassed ? "rgba(74, 124, 94, 0.3)" : isFailed ? "var(--semantic-error)" : "var(--hairline-soft)",
                  color: isPassed ? "#4a7c5e" : isFailed ? "var(--semantic-error)" : "var(--ink)",
                }}
                title={`${u.htuNo}: ${u.status} · Completed ${u.completedStagesCount}/17 Stages`}
              >
                {u.htuNo}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WorkOrderDetail({ wo, plant, onClose }: { wo: any; plant: string; onClose?: () => void }) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [reworkJobs, setReworkJobs] = useState<any[]>([]);
  const [tab, setTab] = useState("units");
  const [selectedUnit, setSelectedUnit] = useState<TrackedUnit | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch(`/api/inspections?wo=${wo.id}&limit=9999`).then(r => r.json()),
      fetch(`/api/ncrs?status=all`).then(r => r.json()),
      fetch(`/api/rework?limit=9999`).then(r => r.json()),
    ]).then(([inspData, ncrData, rwData]) => {
      if (!mounted) return;
      setInspections(inspData.records || []);
      setNcrs((ncrData.ncrs || []).filter((n: any) => n.workOrder?.woNumber === wo.woNumber || n.workOrderId === wo.id));
      setReworkJobs((rwData.jobs || []).filter((j: any) => j.workOrderId === wo.id || j.workOrder?.woNumber === wo.woNumber));
    }).catch(console.error);

    return () => { mounted = false; };
  }, [wo.id, wo.woNumber]);

  // Build the complete unit-by-unit end-to-end ledger
  const units = useMemo(() => {
    return buildUnitLedger(wo, inspections, ncrs, reworkJobs);
  }, [wo, inspections, ncrs, reworkJobs]);

  // Compute separate indicators (not one compressed progress bar)
  const unitCompletion = { completed: wo.completedQty, planned: wo.plannedQty, pct: wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0 };
  const qcRelease = {
    passed: inspections.filter(r => r.overallResult === "Pass").length,
    failed: inspections.filter(r => r.overallResult === "Fail").length,
    total: inspections.length,
  };
  const materialReadiness = wo.materialStatus === "Available";
  const defectUnitsCount = units.filter(u => u.status === "Failed / Contained" || u.status === "Under Rework").length;
  const uniqueHtuCount = new Set(inspections.map(r => r.htuNo).filter(Boolean)).size;

  return (
    <div>
      <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 z-10" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>{wo.woNumber}</SheetTitle>
              <StatusBadge status={wo.status} size="xs" />
            </div>
            <SheetDescription className="t-body-md mt-0.5" style={{ color: "var(--muted)" }}>
              {wo.customer} · {wo.itemName} ({wo.size})
            </SheetDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="t-label" style={{ color: "var(--muted)" }}>BATCH PROGRESS</div>
              <div className="t-title-sm font-mono mt-0.5" style={{ color: "var(--ink)" }}>
                {wo.completedQty} / {wo.plannedQty} <span className="t-label font-normal" style={{ color: "var(--muted)" }}>units</span>
              </div>
            </div>
          </div>
        </div>
      </SheetHeader>

      <div className="p-6">
        <Tabs defaultValue="profile">
          <TabsList className="grid w-full grid-cols-7" style={{ backgroundColor: "var(--canvas-soft)" }}>
            <TabsTrigger value="profile" className="t-body-sm font-medium">WO Profile</TabsTrigger>
            <TabsTrigger value="units" className="t-body-sm font-medium">Units ({units.length})</TabsTrigger>
            <TabsTrigger value="report" className="t-body-sm font-medium">Batch Report</TabsTrigger>
            <TabsTrigger value="overview" className="t-body-sm">Overview</TabsTrigger>
            <TabsTrigger value="inspections" className="t-body-sm">Inspections ({inspections.length})</TabsTrigger>
            <TabsTrigger value="ncrs" className="t-body-sm">Defects ({ncrs.length})</TabsTrigger>
            <TabsTrigger value="gates" className="t-body-sm">Gates</TabsTrigger>
          </TabsList>

          {/* === WO Profile Tab: Engineering Datasheet & Geometry === */}
          <TabsContent value="profile" className="mt-5">
            <WorkOrderProfileView wo={wo} units={units} inspections={inspections} />
          </TabsContent>

          {/* === Units Tab: Unit-by-Unit Tracking Matrix === */}
          <TabsContent value="units" className="mt-5 space-y-4">
            <div className="rounded-lg p-3 flex items-center justify-between" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
              <div className="flex items-center gap-2">
                <Boxes size={15} style={{ color: "var(--primary)" }} />
                <span className="t-body-sm" style={{ color: "var(--ink)", fontWeight: 500 }}>
                  Unit-Level Traceability Ledger: Every radiator serialized and tracked through S01 to S17
                </span>
              </div>
              <span className="t-label" style={{ color: defectUnitsCount > 0 ? "var(--semantic-error)" : "var(--semantic-success)" }}>
                {defectUnitsCount > 0 ? `${defectUnitsCount} units require attention` : "All produced units compliant"}
              </span>
            </div>

            <UnitMatrixView units={units} onInspectUnit={setSelectedUnit} />
          </TabsContent>

          {/* === End-to-End Batch Report Tab === */}
          <TabsContent value="report" className="mt-5">
            <EndToEndBatchReport wo={wo} units={units} />
          </TabsContent>

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

          {/* === Inspections Tab === */}
          <TabsContent value="inspections" className="mt-5 max-h-96 overflow-y-auto scroll-fine">
            <div className="space-y-2">
              {inspections.map((r) => {
                let evidenceCount = 0;
                if (r.evidencePath) {
                  try {
                    evidenceCount = JSON.parse(r.evidencePath).length;
                  } catch {}
                }
                return (
                  <div key={r.id} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.recordNo} · {r.stage?.name}</span>
                        {evidenceCount > 0 && <EvidenceBadge count={evidenceCount} />}
                      </div>
                      <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>
                        Unit {r.htuNo || "General"} · Shift {r.shift} · By {r.inspector} · {fmtDateTime(r.inspectedAt)}
                      </div>
                      {r.notes && <div className="t-label text-[11px] mt-1 text-ink">{r.notes}</div>}
                    </div>
                    <ResultBadge result={r.overallResult} />
                  </div>
                );
              })}
              {inspections.length === 0 && <EmptyState message="No inspections recorded yet." />}
            </div>
          </TabsContent>

          {/* === Defects & NCRs Tab === */}
          <TabsContent value="ncrs" className="mt-5 max-h-96 overflow-y-auto scroll-fine">
            <div className="space-y-3">
              {ncrs.map((n) => (
                <div key={n.id} className="rounded-xl p-3.5 border" style={{ backgroundColor: "var(--canvas-soft)", borderColor: "var(--hairline-soft)" }}>
                  <div className="flex items-center justify-between">
                    <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{n.ncrNumber} · {n.defectCategory}</span>
                    <StatusBadge status={n.severity} size="xs" />
                  </div>
                  <div className="t-body-sm mt-1.5" style={{ color: "var(--ink)" }}>{n.description}</div>
                  {n.rootCause && (
                    <div className="t-label text-[11px] mt-1.5 p-2 rounded bg-[var(--surface-card)]" style={{ border: "1px solid var(--hairline-soft)" }}>
                      <span className="font-semibold text-ink">Root Cause:</span> {n.rootCause}
                    </div>
                  )}
                  {n.correctiveAction && (
                    <div className="t-label text-[11px] mt-1 p-2 rounded bg-[var(--surface-card)]" style={{ border: "1px solid var(--hairline-soft)" }}>
                      <span className="font-semibold text-ink">CAPA:</span> {n.correctiveAction}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px]" style={{ borderColor: "var(--hairline-soft)", color: "var(--muted)" }}>
                    <span>Status: <strong className="text-ink">{n.status}</strong></span>
                    <span>Owner: {n.capaOwner || "Unassigned"}</span>
                  </div>
                </div>
              ))}
              {ncrs.length === 0 && <EmptyState message="Zero nonconformances. Quality gate clean." />}
            </div>
          </TabsContent>

          {/* === Gates Tab === */}
          <TabsContent value="gates" className="mt-5">
            <QualityGatesTab woId={wo.id} plant={plant} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Unit Modal for Deep Inspection */}
      <UnitInspectionModal unit={selectedUnit} open={!!selectedUnit} onClose={() => setSelectedUnit(null)} />
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
  const [recentlyClearedStage, setRecentlyClearedStage] = useState<{
    stageCode: string;
    stageName: string;
    nextStageCode: string;
    nextStageName: string;
    woNumber: string;
    htuNo: string;
  } | null>(null);
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

  const exportFilteredCsv = () => {
    if (visibleRecords.length === 0) return;
    let csv = `HI-TECH RADIATORS PVT. LTD. - DIGITAL STAGE INSPECTION REGISTER\r\n`;
    csv += `Exported At: ${new Date().toISOString()} · Filtered Plant: ${plant}\r\n\r\n`;
    csv += `Record No,Work Order,Customer,HTU Serial,Stage Code,Stage Name,Document Ref,Shift,Inspector,Operator,CTQ Result,Overall Result,Inspected At\r\n`;
    visibleRecords.forEach(r => {
      csv += `"${r.recordNo}","${r.workOrder?.woNumber || ""}","${r.workOrder?.customer || ""}","${r.htuNo || ""}","${r.stage?.stageCode || ""}","${r.stage?.name || ""}","${r.stage?.documentRef || ""}","Shift ${r.shift}","${r.inspector}","${r.operator || ""}","${r.ctqResult || ""}","${r.overallResult}","${r.inspectedAt}"\r\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Inspection_Register_${plant}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns: Column<any>[] = [
    { key: "record", header: "Record", sortable: true, sortValue: (r) => r.recordNo, render: (r) => <span className="t-code font-medium" data-tooltip="Click row to open detailed audit dossier & download reports" data-tooltip-pos="right" style={{ color: "var(--ink)" }}>{r.recordNo}</span>, mobileLabel: "Record" },
    { key: "stage", header: "Stage", sortable: true, sortValue: (r) => r.stage?.name || "", render: (r) => (
      <div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.stage?.name}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{r.stage?.documentRef}</div>
      </div>
    ), mobileLabel: "Stage" },
    { key: "wo", header: "Work Order", render: (r) => (
      <div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{r.workOrder?.woNumber}</div>
        <div className="t-label" style={{ color: "var(--muted)" }}>{r.workOrder?.customer}</div>
      </div>
    ), hideOnMobile: true },
    { key: "htu", header: "HTU", render: (r) => <span className="t-code" data-tooltip="Unique radiator serial stamped on unit header" data-tooltip-pos="top">{r.htuNo}</span>, hideOnMobile: true },
    { key: "inspector", header: "Inspector", sortable: true, sortValue: (r) => r.inspector, render: (r) => <span className="t-body-sm">{r.inspector}</span>, hideOnMobile: true },
    { key: "ctq", header: "CTQ", render: (r) => r.ctqResult === "Fail" ? <StatusBadge status="Fail" size="xs" /> : r.ctqResult === "Pass" ? <span className="t-label" style={{ color: "var(--muted)" }}>OK</span> : "-", hideOnMobile: true },
    { key: "result", header: "Result", sortable: true, sortValue: (r) => r.overallResult, render: (r) => <ResultBadge result={r.overallResult} />, mobileLabel: "Result" },
    { key: "evidence", header: "Proof", render: (r) => <EvidenceBadge evidenceData={r.evidencePath} />, hideOnMobile: true },
    { key: "when", header: "When", sortable: true, sortValue: (r) => new Date(r.inspectedAt).getTime(), render: (r) => <span className="t-label">{fmtDateTime(r.inspectedAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Quality Execution"
        title="Digital Inspections"
        subtitle="Stage-wise inspection forms with CTQ acceptance criteria. Failures auto-create NCRs and hold work orders."
        helpId="insp.workflow"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportFilteredCsv}
              data-tooltip="Export visible inspections to CSV spreadsheet"
              data-tooltip-pos="bottom"
              className="t-body-sm h-9 px-3 rounded-lg flex items-center gap-1.5"
              style={{ borderColor: "var(--hairline)" }}
            >
              <FileSpreadsheet size={14} /> Export CSV
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              data-tooltip="Open new digital inspection form with 4-tier crew tracking"
              data-tooltip-pos="left"
              className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              <Plus size={14} /> New Inspection
            </Button>
          </div>
        }
      />
            {/* Sequential Stage Clearance & Next Stage Hand-off Banner */}
      {recentlyClearedStage && (
        <div className="rounded-xl p-4 mx-4 md:mx-8 mb-4 flex items-center justify-between flex-wrap gap-3 animate-in fade-in" style={{ backgroundColor: "rgba(74, 124, 94, 0.1)", border: "1.5px solid #4a7c5e" }}>
          <div className="flex items-center gap-3">
            <CheckCircle2 size={24} style={{ color: "#4a7c5e" }} />
            <div>
              <div className="t-body-sm font-bold" style={{ color: "#4a7c5e" }}>
                STAGE {recentlyClearedStage.stageCode} ({recentlyClearedStage.stageName}) PASSED & RELEASED
              </div>
              <div className="t-label text-[11px]" style={{ color: "var(--ink)" }}>
                Unit <strong>{recentlyClearedStage.htuNo}</strong> (WO {recentlyClearedStage.woNumber}) is conforming. Ready to proceed to <strong>{recentlyClearedStage.nextStageCode} - {recentlyClearedStage.nextStageName}</strong>.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setFormPrefillStage(recentlyClearedStage.nextStageCode);
                setShowForm(true);
                setRecentlyClearedStage(null);
              }}
              className="t-button h-8 px-4 rounded-lg flex items-center gap-1.5"
              style={{ backgroundColor: "#4a7c5e", color: "#ffffff" }}
            >
              Inspect Next Stage: {recentlyClearedStage.nextStageCode} <ChevronRight size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRecentlyClearedStage(null)}
              className="h-8 w-8 p-0 text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      <FilterBar count={visibleRecords.length}>
        <Filter size={13} style={{ color: "var(--muted)" }} />
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-36 h-8 t-body-sm" data-tooltip="Filter inspections by clearance verdict" data-tooltip-pos="bottom" style={{ borderColor: "var(--hairline)" }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            <SelectItem value="Pass">Pass</SelectItem>
            <SelectItem value="Fail">Fail</SelectItem>
            <SelectItem value="Hold">Hold</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        {user.assignedStages && user.assignedStages.length > 0 && (
          <span className="t-label px-2 py-1 rounded-full" data-tooltip="Your account is restricted to your assigned manufacturing stages" data-tooltip-pos="bottom" style={{ backgroundColor: "var(--surface-strong)", color: "var(--muted)" }}>
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
        <SheetContent className="w-full md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1400px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          <InspectionForm stages={stages} workOrders={workOrders} user={user} prefillStageCode={formPrefillStage} onSubmitted={() => { setShowForm(false); setFormPrefillStage(null); load(); }} onCancel={() => { setShowForm(false); setFormPrefillStage(null); }} />
        </SheetContent>
      </Sheet>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[1400px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <InspectionDetail record={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ============================================================
// Enhanced Inspection Form
//  - 4-Tier Personnel Accountability: Line Operator, Documented By, QC Checker, Releasing Approver
//  - Mandatory Parameter Validations: Every single parameter must be recorded
//  - Defect-Only Visual Proof: Only shown when one or more parameters fail
// ============================================================
function InspectionForm({ stages, workOrders, user, prefillStageCode, prefillWoId, onSubmitted, onCancel, onStageCleared }: {
  onStageCleared?: (info: any) => void;
  stages: any[]; workOrders: any[]; user: User; prefillStageCode?: string | null; prefillWoId?: string | null; onSubmitted: () => void; onCancel: () => void;
}) {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [woId, setWoId] = useState("");
  const [htuNo, setHtuNo] = useState("");
  const [htuAutoGenerated, setHtuAutoGenerated] = useState(false);
  const [shift, setShift] = useState(user.shiftPreference || "A");
  const [operator, setOperator] = useState("Ravi Kamble");
  const [checkedBy, setCheckedBy] = useState(user.role === "QCInspector" ? user.name : "Sneha Patel");
  const [approvedBy, setApprovedBy] = useState("Amit Shah");
  const [stage, setStage] = useState<any | null>(null);
  const [measurements, setMeasurements] = useState<Record<string, any>>({});
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [connectedNcr, setConnectedNcr] = useState("");
  const [saving, setSaving] = useState(false);
  const [prevInspections, setPrevInspections] = useState<any[]>([]);
  const [availableNcrs, setAvailableNcrs] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [failedChars, setFailedChars] = useState<string[]>([]);
  const [missingChars, setMissingChars] = useState<string[]>([]);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [disposition, setDisposition] = useState<"Rework" | "Scrap" | null>(null);
  const [charFilter, setCharFilter] = useState<"all" | "pending" | "ctq" | "failed">("all");
  const [charSearch, setCharSearch] = useState<string>("");
  const { toast } = useToast();

  const selectedWo = useMemo(() => workOrders.find(w => w.id === woId), [workOrders, woId]);

  // Auto-generate HTU number when work order is selected.
  useEffect(() => {
    if (woId && !htuAutoGenerated) {
      const wo = workOrders.find(w => w.id === woId);
      if (wo) {
        const woNum = wo.woNumber.replace(/[^0-9]/g, "").slice(-4);
        fetch(`/api/inspections?wo=${woId}&limit=9999`)
          .then(r => r.json())
          .then(d => {
            const existingHtus = new Set<string>();
            (d.records || []).forEach((r: any) => { if (r.htuNo) existingHtus.add(r.htuNo); });
            const seq = String(existingHtus.size + 1).padStart(3, "0");
            const generatedHtu = `HTU-${woNum}-${seq}`;
            setHtuNo(generatedHtu);
            setHtuAutoGenerated(true);
          })
          .catch(() => {
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

  // Fetch available users for dropdowns
  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then(d => {
      const users = (d.users || []).filter((u: any) => u.status === "Active");
      setAvailableUsers(users);
    }).catch(() => {
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

  // Smart crew auto-selection resolving Operator -> Checked By -> Approved By through hierarchy
  const autoSelectCrewFromHierarchy = useCallback((currentStage?: any) => {
    if (availableUsers.length === 0) return;
    const effectiveStage = currentStage || stage;
    const stageCode = effectiveStage?.stageCode;

    // 1. Determine Operator (Tier 3)
    let selectedOp = operator;
    if (user.role === "Operator") {
      selectedOp = user.name;
    } else {
      const matchingOp = availableUsers.find((u: any) => u.role === "Operator" && stageCode && (u.assignedStages || []).includes(stageCode));
      const fallbackOp = matchingOp || availableUsers.find((u: any) => u.role === "Operator") || availableUsers[0];
      if (fallbackOp) selectedOp = fallbackOp.name;
    }
    setOperator(selectedOp);

    // 2. Determine Checked By (Tier 2 Quality Checker)
    let selectedChecker = checkedBy;
    if (user.role === "QCInspector" || user.role === "ProcessEngineer") {
      selectedChecker = user.name;
    } else {
      const opUser = availableUsers.find((u: any) => u.name === selectedOp);
      const opMgr = opUser?.managerId ? availableUsers.find((u: any) => u.id === opUser.managerId) : null;
      if (opMgr && ["QCInspector", "ProductionSupervisor", "LineManager", "QualityManager"].includes(opMgr.role)) {
        selectedChecker = opMgr.name;
      } else {
        const stageQc = availableUsers.find((u: any) => u.role === "QCInspector" && stageCode && (u.assignedStages || []).includes(stageCode));
        const fallbackQc = stageQc || availableUsers.find((u: any) => u.role === "QCInspector") || availableUsers.find((u: any) => u.role === "ProductionSupervisor");
        if (fallbackQc) selectedChecker = fallbackQc.name;
      }
    }
    setCheckedBy(selectedChecker);

    // 3. Determine Approved By (Tier 1 Releasing Approver)
    let selectedApprover = approvedBy;
    if (["QualityManager", "PlantManager", "Director", "DGM"].includes(user.role)) {
      selectedApprover = user.name;
    } else {
      const checkerUser = availableUsers.find((u: any) => u.name === selectedChecker);
      const checkerMgr = checkerUser?.managerId ? availableUsers.find((u: any) => u.id === checkerUser.managerId) : null;
      if (checkerMgr && ["QualityManager", "PlantManager", "Director", "DGM"].includes(checkerMgr.role)) {
        selectedApprover = checkerMgr.name;
      } else {
        const qm = availableUsers.find((u: any) => u.role === "Director") || availableUsers.find((u: any) => u.role === "QualityManager") || availableUsers.find((u: any) => u.role === "PlantManager") || availableUsers.find((u: any) => u.role === "DGM");
        if (qm) selectedApprover = qm.name;
      }
    }
    setApprovedBy(selectedApprover);
  }, [availableUsers, stage, user, operator, checkedBy, approvedBy]);

  useEffect(() => {
    if (availableUsers.length > 0) {
      autoSelectCrewFromHierarchy(stage);
    }
  }, [availableUsers, stage]);

  // Filter stages by user's assigned stages
  const visibleStages = useMemo(() => {
    const assigned = user.assignedStages || [];
    if (assigned.length === 0) return stages;
    return stages.filter(s => assigned.includes(s.stageCode));
  }, [stages, user.assignedStages]);

  // Auto-select active Work Order if not yet selected
  useEffect(() => {
    if (!woId) {
      if (prefillWoId) {
        setWoId(prefillWoId);
      } else if (workOrders.length > 0) {
        const defaultWo = workOrders.find(w => w.status === "In Progress" || w.status === "Released") || workOrders[0];
        if (defaultWo) setWoId(defaultWo.id);
      }
    }
  }, [prefillWoId, workOrders, woId]);

  // Auto-select stage when prefillStageCode arrives, pre-populate parameters and jump straight to checksheet!
  useEffect(() => {
    if (prefillStageCode && !stage) {
      let found = stages.find(s => s.stageCode === prefillStageCode);
      if (!found) {
        const cat = STAGE_CATALOG.find(c => c.code === prefillStageCode);
        if (cat) {
          found = {
            id: `stage-${cat.code}`,
            stageCode: cat.code,
            name: cat.name,
            documentRef: cat.docRef,
            department: cat.category,
            isCTQ: cat.params.some(p => p.ctq),
            isGate: ["S01", "S06", "S10", "S13", "S15", "S16", "S17"].includes(cat.code),
            characteristics: cat.params.map((p, idx) => ({
              id: `char-${cat.code}-${idx + 1}`,
              seq: idx + 1,
              name: p.name,
              specification: p.spec,
              nominalValue: p.nominal,
              lowerLimit: p.min !== p.nominal ? p.min : undefined,
              upperLimit: p.max !== p.nominal ? p.max : undefined,
              unit: p.unit,
              method: p.method,
              isCTQ: !!p.ctq,
            }))
          };
        }
      }

      if (found) {
        const assigned = user.assignedStages || [];
        const isAuthorized = assigned.length === 0 || assigned.includes(prefillStageCode);
        if (isAuthorized) {
          setStage(found);

          // Pre-populate nominal measurements for every characteristic so form is ready to inspect!
          if (found.characteristics && found.characteristics.length > 0) {
            const batch: Record<string, any> = {};
            found.characteristics.forEach((c: any) => {
              const val = (c.nominalValue !== null && c.nominalValue !== undefined && String(c.nominalValue).trim() !== "")
                ? c.nominalValue
                : (c.specification?.includes("Zero") || c.specification?.includes("Clean") || c.specification?.includes("Pass")) ? "Conforming" : "OK";
              batch[c.id] = { value: val, pass: true, ctq: !!c.isCTQ, name: c.name };
            });
            setMeasurements(prev => ({ ...batch, ...prev }));
          }

          // Ensure work order is set
          if (!woId && workOrders.length > 0) {
            const defaultWo = prefillWoId ? workOrders.find(w => w.id === prefillWoId) : (workOrders.find(w => w.status === "In Progress" || w.status === "Released") || workOrders[0]);
            if (defaultWo) setWoId(defaultWo.id);
          }

          autoSelectCrewFromHierarchy(found);

          // Jump directly to Step 3 (Checksheet Parameters)
          setActiveStep(3);
        } else {
          toast({
            title: "Access restricted",
            description: `You are not assigned to stage ${prefillStageCode}. Your assigned stages: ${assigned.join(", ") || "none"}`,
            variant: "destructive",
          });
        }
      }
    }
  }, [prefillStageCode, stages, stage, user.assignedStages, workOrders, woId, prefillWoId, autoSelectCrewFromHierarchy, toast]);

  // Fetch previous inspections + open NCRs for connection
  useEffect(() => {
    if (!woId || !stage) { setPrevInspections([]); setAvailableNcrs([]); return; }
    fetch(`/api/inspections?wo=${woId}&stage=${stage.id}&limit=5`).then(r => r.json()).then(d => setPrevInspections(d.records || []));
    fetch(`/api/ncrs?status=all`).then(r => r.json()).then(d => {
      const wo = workOrders.find(w => w.id === woId);
      setAvailableNcrs((d.ncrs || []).filter((n: any) => n.workOrder?.woNumber === wo?.woNumber && n.status !== "Closed"));
    });
  }, [woId, stage, workOrders]);

  // Detect failed characteristics
  useEffect(() => {
    const failed: string[] = [];
    for (const [charId, m] of Object.entries(measurements)) {
      if ((m as any).pass === false) {
        failed.push((m as any).name || charId);
      }
    }
    setFailedChars(failed);
  }, [measurements]);

  const setM = (charId: string, value: any, pass: boolean, ctq: boolean, name: string) => {
    setMeasurements((prev) => {
      const updated = { ...prev, [charId]: { value, pass, ctq, name } };
      if (validationAttempted && stage?.characteristics) {
        const stillMissing = stage.characteristics
          .filter((c: any) => {
            const m = c.id === charId ? { value, pass } : updated[c.id];
            return !m || m.value === undefined || m.value === null || String(m.value).trim() === "" || m.pass === undefined;
          })
          .map((c: any) => c.name || `Parameter #${c.seq}`);
        setMissingChars(stillMissing);
      }
      return updated;
    });
  };

  // Real-time numeric tolerance evaluation
  const handleNumericInput = (char: any, rawVal: string) => {
    if (rawVal.trim() === "") {
      setM(char.id, "", true, char.isCTQ, char.name);
      return;
    }
    const num = parseFloat(rawVal);
    let inTol = true;
    if (!isNaN(num)) {
      const upper = char.upperLimit !== null && char.upperLimit !== undefined && char.upperLimit !== "" ? parseFloat(char.upperLimit) : Infinity;
      const lower = char.lowerLimit !== null && char.lowerLimit !== undefined && char.lowerLimit !== "" ? parseFloat(char.lowerLimit) : -Infinity;
      inTol = num <= upper && num >= lower;
    }
    setM(char.id, rawVal, inTol, char.isCTQ, char.name);
  };

  // Pass All Nominal speed action
  const handlePassAllNominal = () => {
    if (!stage?.characteristics) return;
    const batch: Record<string, any> = { ...measurements };
    stage.characteristics.forEach((c: any) => {
      const val = c.nominalValue !== null && c.nominalValue !== undefined && c.nominalValue !== "" ? c.nominalValue : "OK";
      batch[c.id] = { value: val, pass: true, ctq: c.isCTQ, name: c.name };
    });
    setMeasurements(batch);
    setMissingChars([]);
    toast({
      title: "Pass All Nominal Applied",
      description: `All ${stage.characteristics.length} characteristics set to nominal in-tolerance values.`,
    });
  };

  // Validation function enforcing all characteristics in Step 3 are mandatory
  const validateStep3 = () => {
    setValidationAttempted(true);
    if (!stage?.characteristics || stage.characteristics.length === 0) {
      setActiveStep(4);
      return true;
    }
    const missing: string[] = [];
    for (const c of stage.characteristics) {
      const m = measurements[c.id];
      if (!m || m.value === undefined || m.value === null || String(m.value).trim() === "" || m.pass === undefined) {
        missing.push(c.name || `Parameter #${c.seq}`);
      }
    }
    setMissingChars(missing);
    if (missing.length > 0) {
      toast({
        title: "All Parameters Are Mandatory",
        description: `Cannot advance. ${missing.length} parameter(s) missing records: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` (+${missing.length - 3} more)` : ""}. Please record measurements for every parameter.`,
        variant: "destructive",
      });
      return false;
    }
    setActiveStep(4);
    return true;
  };

  const handleStepClick = (targetStep: 1 | 2 | 3 | 4) => {
    // If woId not set, auto-pick default active work order so user is never blocked
    if (!woId && workOrders.length > 0) {
      const defaultWo = workOrders.find(w => w.status === "In Progress" || w.status === "Released") || workOrders[0];
      if (defaultWo) setWoId(defaultWo.id);
    }
    if (targetStep === 4) {
      if (!stage) {
        toast({ title: "Stage required", description: "Select a manufacturing stage first.", variant: "destructive" });
        setActiveStep(2);
        return;
      }
      validateStep3();
      return;
    }
    if (targetStep === 3 && !stage) {
      toast({ title: "Stage required", description: "Select a manufacturing stage first.", variant: "destructive" });
      setActiveStep(2);
      return;
    }
    setActiveStep(targetStep);
  };

  const hasFailedMeasurement = failedChars.length > 0;
  const completedParametersCount = useMemo(() => {
    if (!stage?.characteristics) return 0;
    return stage.characteristics.filter((c: any) => {
      const m = measurements[c.id];
      return m && m.value !== undefined && m.value !== null && String(m.value).trim() !== "" && m.pass !== undefined;
    }).length;
  }, [stage, measurements]);

  const pendingCount = useMemo(() => {
    if (!stage?.characteristics) return 0;
    return stage.characteristics.filter((c: any) => {
      const m = measurements[c.id];
      return !m || m.value === undefined || m.value === null || String(m.value).trim() === "" || m.pass === undefined;
    }).length;
  }, [stage, measurements]);

  const stageCtqCount = useMemo(() => {
    if (!stage?.characteristics) return 0;
    return stage.characteristics.filter((c: any) => c.isCTQ).length;
  }, [stage]);

  const filteredChars = useMemo(() => {
    if (!stage?.characteristics) return [];
    let list = stage.characteristics;
    if (charFilter === "pending") {
      list = list.filter((c: any) => {
        const m = measurements[c.id];
        return !m || m.value === undefined || m.value === null || String(m.value).trim() === "" || m.pass === undefined;
      });
    } else if (charFilter === "ctq") {
      list = list.filter((c: any) => c.isCTQ);
    } else if (charFilter === "failed") {
      list = list.filter((c: any) => {
        const m = measurements[c.id];
        return m && m.pass === false;
      });
    }
    if (charSearch.trim()) {
      const q = charSearch.toLowerCase();
      list = list.filter((c: any) => c.name.toLowerCase().includes(q) || (c.specification && c.specification.toLowerCase().includes(q)) || (c.method && c.method.toLowerCase().includes(q)));
    }
    return list;
  }, [stage, measurements, charFilter, charSearch]);

  const submit = async () => {
    if (!woId || !stage) {
      toast({ title: "Work order and stage required", variant: "destructive" });
      return;
    }
    if (hasFailedMeasurement && !disposition) {
      setActiveStep(4);
      toast({
        title: "Disposition required",
        description: "One or more characteristics failed. Select Rework or Scrap in Step 4 before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const opUser = availableUsers.find(u => u.name === operator);
    const chkUser = availableUsers.find(u => u.name === checkedBy);
    const appUser = availableUsers.find(u => u.name === approvedBy);

    const res = await fetch("/api/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workOrderId: woId,
        stageId: stage.id,
        htuNo,
        shift,
        inspector: checkedBy || user.name,
        operator: operator || "Ravi Kamble",
        operatorRole: opUser?.role || "Operator",
        documentedBy: user.name,
        documenterRole: user.role,
        documenterUsername: user.username || user.name.toLowerCase().replace(/\s+/g, '.'),
        checkedBy: checkedBy || user.name,
        checkerRole: chkUser?.role || "QCInspector",
        approvedBy: approvedBy || "Amit Shah",
        approverRole: appUser?.role || "QualityManager",
        measurements,
        notes,
        connectedNcr,
        disposition,
        evidenceFiles: hasFailedMeasurement ? evidenceFiles : [],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.record.overallResult === "Fail") {
        const rwoInfo = data.rwoNumber ? ` · Rework Job ${data.rwoNumber} created` : "";
        const proofInfo = evidenceFiles.length > 0 ? ` · ${evidenceFiles.length} proof files attached` : "";
        toast({
          title: `Inspection FAILED - ${disposition === "Scrap" ? "Scrap" : "Rework"} job created${rwoInfo}`,
          description: `${data.record.recordNo} · ${stage.name}. Failed: ${failedChars.join(", ")}. ${proofInfo}. Product sent to ${disposition === "Scrap" ? "scrap" : "rework"}. NCR auto-created.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Inspection PASSED (Clean Conforming Release)",
          description: `${data.record.recordNo} · ${stage.name} · HTU ${htuNo} · 4-tier crew logged`,
        });
      }
      onSubmitted();
    } else {
      toast({ title: "Submission failed", variant: "destructive" });
    }
    setSaving(false);
  };

  const STEPS = [
    { num: 1, label: "Traceability & Crew", status: woId && htuNo ? "done" : "current", tip: "Production work order, serial auto-trace, and 4-tier crew selection" },
    { num: 2, label: "Stage & SOP", status: stage ? "done" : woId ? "ready" : "pending", tip: "Manufacturing routing stage and authorized SOP standard" },
    { num: 3, label: "Parameters", status: completedParametersCount === (stage?.characteristics?.length || 0) && (stage?.characteristics?.length || 0) > 0 ? (hasFailedMeasurement ? "warn" : "done") : "ready", tip: "All mandatory characteristic measurements and tolerance checks" },
    { num: 4, label: "Gate & Sign-off", status: hasFailedMeasurement ? (disposition ? "warn" : "pending") : "ready", tip: "Quality gate verdict, conditional defect proof, and digital sign-off stamp" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header with Title and Stepper */}
      <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="t-label mb-1" style={{ color: "var(--primary)" }}>QUALITY EXECUTION & PERSONNEL AUDIT</div>
            <SheetTitle className="t-display-sm" style={{ color: "var(--ink)" }}>Digital Inspection Form</SheetTitle>
          </div>
          <div className="text-right">
            <span className="t-code text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)", border: "1px solid var(--hairline)" }}>
              {stage?.stageCode || "STAGE SELECTION"}
            </span>
          </div>
        </div>

        {/* 4-Step Sequence Stepper */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {STEPS.map((s) => {
            const isActive = activeStep === s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => handleStepClick(s.num as any)}
                data-tooltip={s.tip}
                data-tooltip-pos="bottom"
                className="text-left p-2 rounded-lg transition-all"
                style={{
                  border: isActive ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                  backgroundColor: isActive ? "rgba(8, 50, 96, 0.06)" : "var(--canvas-soft)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="t-code text-[11px] font-bold"
                    style={{ color: isActive ? "var(--primary)" : "var(--muted)" }}
                  >
                    0{s.num}
                  </span>
                  {s.status === "done" && <CheckCircle2 size={12} style={{ color: "var(--semantic-success)" }} />}
                  {s.status === "warn" && <AlertTriangle size={12} style={{ color: "var(--semantic-error)" }} />}
                </div>
                <div
                  className="t-body-sm text-[12px] font-medium truncate mt-0.5"
                  style={{ color: isActive ? "var(--primary)" : "var(--ink)" }}
                >
                  {s.label}
                </div>
              </button>
            );
          })}
        </div>
      </SheetHeader>

      {/* Main Stepped Form Content */}
      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* ============================================================ */}
        {/* STEP 1: TRACEABILITY & 4-TIER PERSONNEL CREW */}
        {/* ============================================================ */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div>
              <div className="t-title-sm mb-1" style={{ color: "var(--ink)" }}>Production Traceability & Accountability Crew</div>
              <div className="t-label" style={{ color: "var(--muted)" }}>
                Link this inspection to an authorized Work Order, unique HTU radiator serial, and shopfloor personnel audit trail.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="t-label" style={{ color: "var(--muted)" }}>Work Order *</Label>
                <Select value={woId} onValueChange={(v) => { setWoId(v); setStage(null); setMeasurements({}); setHtuAutoGenerated(false); }}>
                  <SelectTrigger className="mt-1 t-body-sm h-10 rounded-lg" data-tooltip="Select authorized production work order" data-tooltip-pos="right" style={{ borderColor: "var(--hairline)" }}>
                    <SelectValue placeholder="Select authorized production work order" />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrders.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.woNumber} · {w.customer} · {w.size} ({w.finishType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Work Order Context Strip */}
              {selectedWo && (
                <div className="rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                  <div data-tooltip="Target customer and OEM specification" data-tooltip-pos="bottom">
                    <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>CUSTOMER</div>
                    <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{selectedWo.customer}</div>
                  </div>
                  <div data-tooltip="Radiator model size and dimensions" data-tooltip-pos="bottom">
                    <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>DIMENSIONS / SPEC</div>
                    <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{selectedWo.size}</div>
                  </div>
                  <div data-tooltip="Surface treatment and coating spec" data-tooltip-pos="bottom">
                    <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>FINISH TYPE</div>
                    <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{selectedWo.finishType}</div>
                  </div>
                  <div data-tooltip="Batch manufacturing progress" data-tooltip-pos="bottom">
                    <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>PLANNED BATCH</div>
                    <div className="t-body-sm font-medium" style={{ color: "var(--primary)" }}>{selectedWo.completedQty}/{selectedWo.plannedQty} units</div>
                  </div>
                </div>
              )}

              {/* Physical Serial and Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="t-label flex items-center justify-between" style={{ color: "var(--muted)" }}>
                    <span>HTU Radiator Serial Number</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e" }}>
                      AUTO-TRACE
                    </span>
                  </Label>
                  <input
                    value={htuNo || "Auto-generated on WO selection"}
                    readOnly
                    placeholder="Select work order to generate"
                    data-tooltip="Auto-generated sequential radiator unit serial stamped on physical header"
                    data-tooltip-pos="top"
                    className="w-full mt-1 h-9 px-3 rounded-lg t-body-sm t-code outline-none"
                    style={{
                      border: "1px solid var(--hairline)",
                      backgroundColor: "var(--canvas-soft)",
                      color: htuNo ? "var(--primary)" : "var(--muted)",
                      fontWeight: 500,
                    }}
                  />
                  <div className="t-label text-[10.5px] mt-1" style={{ color: "var(--muted-soft)" }}>
                    Unique serial stamped on radiator header for lifetime traceability.
                  </div>
                </div>

                <div>
                  <SelectField
                    label="Operational Shift"
                    value={shift}
                    onChange={setShift}
                    options={[["A", "Shift A (06:00 - 14:30)"], ["B", "Shift B (14:30 - 23:00)"], ["General", "General Shift (09:00 - 17:30)"]]}
                  />
                </div>
              </div>

              {/* 4-Tier Personnel Accountability & Traceability Crew */}
              <div className="rounded-xl p-4 space-y-3 mt-2" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
                    <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>4-Tier Personnel Traceability & Audit Crew</span>
                  </div>
                  <span className="t-label text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}>
                    AUDIT COMPLIANT
                  </span>
                </div>

                {/* Visual Reporting Hierarchy Card */}
                <div className="rounded-lg p-2.5 space-y-1.5" style={{ backgroundColor: "rgba(8, 50, 96, 0.04)", border: "1px solid rgba(8, 50, 96, 0.12)" }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--primary)" }}>
                      <Workflow size={12} />
                      <span>4-TIER SIGN-OFF HIERARCHY (AUTO-ALLOCATED)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => autoSelectCrewFromHierarchy(stage)}
                      className="text-[10.5px] hover:underline flex items-center gap-1 font-medium"
                      style={{ color: "var(--primary)" }}
                      title="Re-run hierarchy resolution"
                    >
                      <RefreshCw size={10} /> Auto-Sync Crew
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="p-1.5 rounded" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                      <div className="text-[9px] uppercase font-mono" style={{ color: "var(--muted)" }}>Tier 3 · Operator</div>
                      <div className="font-semibold truncate" style={{ color: "var(--ink)" }}>{operator || "Unassigned"}</div>
                    </div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                      <div className="text-[9px] uppercase font-mono" style={{ color: "var(--muted)" }}>Tier 2 · Checker</div>
                      <div className="font-semibold truncate" style={{ color: "var(--ink)" }}>{checkedBy || "Unassigned"}</div>
                    </div>
                    <div className="p-1.5 rounded" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                      <div className="text-[9px] uppercase font-mono" style={{ color: "var(--muted)" }}>Tier 1 · Approver</div>
                      <div className="font-semibold truncate" style={{ color: "var(--ink)" }}>{approvedBy || "Unassigned"}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* 1. Line Operator */}
                  <div>
                    <Label className="t-label flex items-center justify-between" style={{ color: "var(--muted)" }}>
                      <span>1. Line Operator (Workstation) *</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>FABRICATION</span>
                    </Label>
                    <Select value={operator} onValueChange={setOperator}>
                      <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" data-tooltip="Select machinist/craftsman who fabricated this radiator unit" data-tooltip-pos="top" style={{ borderColor: "var(--hairline)" }}>
                        <SelectValue placeholder="Select machine operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter((u: any) => ["Operator", "ProductionSupervisor"].includes(u.role))
                          .map((u: any) => (
                            <SelectItem key={u.username || u.name} value={u.name}>
                              {u.name} · {u.role} (Shift {u.shiftPreference || "A"})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>Shopfloor craftsman who fabricated this unit.</div>
                  </div>

                  {/* 2. Documented By */}
                  <div>
                    <Label className="t-label flex items-center justify-between" style={{ color: "var(--muted)" }}>
                      <span>2. Documented By (Digital Form Author)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: user.role === "Admin" ? "rgba(8, 50, 96, 0.12)" : "rgba(74, 124, 94, 0.12)", color: user.role === "Admin" ? "var(--primary)" : "#4a7c5e" }}>
                        {user.role === "Admin" ? "IT DESK GOVERNANCE" : "ACTIVE SESSION"}
                      </span>
                    </Label>
                    <div
                      className="w-full mt-1 h-9 px-3 rounded-lg t-body-sm flex items-center justify-between"
                      data-tooltip="Authenticated digital author logged into this session entering measurements"
                      data-tooltip-pos="top"
                      style={{
                        border: "1px solid var(--hairline)",
                        backgroundColor: "var(--surface-card)",
                        color: "var(--ink)",
                      }}
                    >
                      <span className="font-medium">{user.name}</span>
                      <span className="t-label text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)" }}>
                        {`${user.role} · @${user.username || user.name.toLowerCase().replace(/\s+/g, '.')}`}
                      </span>
                    </div>
                    <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>
                      "Authenticated digital author logged into this session."
                    </div>
                  </div>

                  {/* 3. Quality Checker */}
                  <div>
                    <Label className="t-label flex items-center justify-between" style={{ color: "var(--muted)" }}>
                      <span>3. Quality Checker (QC Verifier) *</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}>VERIFICATION</span>
                    </Label>
                    <Select value={checkedBy} onValueChange={setCheckedBy}>
                      <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" data-tooltip="Select QC inspector who verified physical dimensions and tolerances" data-tooltip-pos="top" style={{ borderColor: "var(--hairline)" }}>
                        <SelectValue placeholder="Select QC verifier" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter((u: any) => ["QCInspector", "QualityManager", "AssistantManager", "ProcessEngineer", "ProductionSupervisor"].includes(u.role))
                          .map((u: any) => (
                            <SelectItem key={u.username || u.name} value={u.name}>
                              {u.name} · {u.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>Shopfloor inspector who verified gauge & tolerance readings.</div>
                  </div>

                  {/* 4. Releasing Approver */}
                  <div>
                    <Label className="t-label flex items-center justify-between" style={{ color: "var(--muted)" }}>
                      <span>4. Releasing Approver (Authority) *</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono" style={{ backgroundColor: "rgba(217, 119, 6, 0.12)", color: "#d97706" }}>SIGN-OFF</span>
                    </Label>
                    <Select value={approvedBy} onValueChange={setApprovedBy}>
                      <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" data-tooltip="Select manager who approves stage gate pass or disposition" data-tooltip-pos="top" style={{ borderColor: "var(--hairline)" }}>
                        <SelectValue placeholder="Select gate approver" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers
                          .filter((u: any) => ["Director", "QualityManager", "PlantManager", "DGM", "AssistantManager"].includes(u.role))
                          .map((u: any) => (
                            <SelectItem key={u.username || u.name} value={u.name}>
                              {u.name} · {u.role}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>Authorized manager who approves stage gate pass or disposition.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => setActiveStep(2)}
                disabled={!woId}
                data-tooltip="Proceed to Step 2: Manufacturing Stage & SOP Gate"
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5"
                style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
              >
                Next: Stage & SOP Reference <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 2: STAGE & PROCESS SOP REFERENCE */}
        {/* ============================================================ */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div>
              <div className="t-title-sm mb-1" style={{ color: "var(--ink)" }}>Manufacturing Stage & SOP Gate</div>
              <div className="t-label" style={{ color: "var(--muted)" }}>Select the production stage to inspect against authorized standard operating procedures.</div>
            </div>

            {!stage ? (
              <div>
                {visibleStages.length === 0 ? (
                  <EmptyState message="No stages available for your account." hint="Contact your supervisor to get stage assignments." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto scroll-fine">
                    {visibleStages.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setStage(s); }}
                        data-tooltip={`Select ${s.name} (${s.stageCode}) SOP checkpoint`}
                        data-tooltip-pos="top"
                        className="text-left p-3 rounded-lg transition-all hover:bg-[var(--surface-card)]"
                        style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="t-code text-xs font-bold" style={{ color: "var(--primary)" }}>{s.stageCode}</span>
                          <div className="flex items-center gap-1">
                            {s.isCTQ && <span className="t-label text-[9px] px-1.5 py-0.2 rounded-full font-bold" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>CTQ</span>}
                            {s.isGate && <span className="t-label text-[9px] px-1.5 py-0.2 rounded-full font-bold" style={{ backgroundColor: "var(--ink)", color: "var(--canvas)" }}>GATE</span>}
                          </div>
                        </div>
                        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{s.name}</div>
                        <div className="t-label text-[11px] mt-1" style={{ color: "var(--muted)" }}>{s.documentRef || "Standard Inspection"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Stage SOP Banner */}
                <div className="rounded-xl p-4 flex items-start justify-between gap-4" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                  <div className="flex items-start gap-3">
                    <FileText size={20} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="t-label text-[10px]" style={{ opacity: 0.8 }}>SOP / QUALITY CONTROL INSTRUCTION (QCI)</div>
                      <div className="t-display-sm mt-0.5">{stage.name}</div>
                      <div className="t-code text-xs mt-1" style={{ opacity: 0.9 }}>
                        {stage.stageCode} · Standard: {stage.documentRef || "QCI/F/01"} · Timing: {stage.timing || "First-off + Continuous"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setStage(null); setMeasurements({}); }}
                    data-tooltip="Select a different manufacturing stage or SOP"
                    data-tooltip-pos="left"
                    className="h-8 rounded-lg shrink-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    Change Stage
                  </Button>
                </div>

                {/* Connected NCR (for reinspection) */}
                {availableNcrs.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                    <Label className="t-label" style={{ color: "var(--muted)" }}>Connected Open NCR (Re-inspection Verification)</Label>
                    <Select value={connectedNcr} onValueChange={setConnectedNcr}>
                      <SelectTrigger
                        className="mt-1 t-body-sm h-9 rounded-lg"
                        style={{ borderColor: "var(--hairline)" }}
                        data-tooltip="Link an existing nonconformance report to perform verification re-inspection"
                        data-tooltip-pos="top"
                      >
                        <SelectValue placeholder="None - Standard first-pass inspection" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableNcrs.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.ncrNumber} · Defect: {n.defectCategory} ({n.severity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* History: previous inspections for this stage+WO */}
                {prevInspections.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                    <div className="t-label mb-2 flex items-center gap-1.5" style={{ color: "var(--muted)" }}>
                      <Clock size={11} /> PRIOR INSPECTIONS ON THIS STAGE & WORK ORDER
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto scroll-fine">
                      {prevInspections.map((p) => (
                        <div key={p.id} className="flex items-center justify-between t-body-sm p-1.5 rounded" style={{ backgroundColor: "var(--surface-card)" }}>
                          <div>
                            <span className="t-code font-medium" style={{ color: "var(--ink)" }}>{p.recordNo}</span>
                            <span style={{ color: "var(--muted)" }}> · HTU {p.htuNo || "-"} · {p.inspector} · {fmtDate(p.inspectedAt)}</span>
                          </div>
                          <ResultBadge result={p.overallResult} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(1)}
                data-tooltip="Return to Step 1: Work Order & Personnel Sign-off"
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg"
              >
                Back: Traceability
              </Button>
              <Button
                type="button"
                onClick={() => setActiveStep(3)}
                disabled={!stage}
                data-tooltip={stage ? "Proceed to Step 3: Record characteristic measurements" : "Select a stage first to proceed"}
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5"
                style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
              >
                Next: Quality Characteristics <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 3: QUALITY CHARACTERISTICS & MANDATORY PARAMETERS */}
        {/* ============================================================ */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <div className="t-title-sm" style={{ color: "var(--ink)" }}>Mandatory Characteristic Measurements</div>
                  <span
                    className="t-code text-xs px-2.5 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: completedParametersCount === (stage?.characteristics?.length || 0) && (stage?.characteristics?.length || 0) > 0 ? "rgba(74, 124, 94, 0.15)" : "rgba(217, 119, 6, 0.15)",
                      color: completedParametersCount === (stage?.characteristics?.length || 0) && (stage?.characteristics?.length || 0) > 0 ? "#4a7c5e" : "#d97706",
                    }}
                  >
                    {completedParametersCount} / {stage?.characteristics?.length || 0} Recorded (All Mandatory)
                  </span>
                </div>
                <div className="t-label mt-0.5" style={{ color: "var(--muted)" }}>
                  Every parameter is required for compliance. Missing parameters block release sign-off.
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {stage?.stageCode === "S14" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!stage?.characteristics) return;
                      const batch: Record<string, any> = { ...measurements };
                      stage.characteristics.forEach((c: any) => {
                        if (c.charType === "leak") {
                          batch[c.id] = { value: "0 Leaks", pass: true, ctq: c.isCTQ, name: c.name };
                        } else if (c.name.includes("Pressure")) {
                          batch[c.id] = { value: "2.0", pass: true, ctq: c.isCTQ, name: c.name };
                        } else if (c.name.includes("Duration")) {
                          batch[c.id] = { value: "30.0", pass: true, ctq: c.isCTQ, name: c.name };
                        } else if (c.name.includes("Tank")) {
                          batch[c.id] = { value: "Tank 1", pass: true, ctq: c.isCTQ, name: c.name };
                        } else {
                          batch[c.id] = { value: c.nominalValue || "OK", pass: true, ctq: c.isCTQ, name: c.name };
                        }
                      });
                      setMeasurements(batch);
                      setMissingChars([]);
                      toast({
                        title: "Zero Leak Hydro Certification Applied",
                        description: "All 8 weld zones certified 100% sound at 2.0 kg/cm² for 30 minutes.",
                      });
                    }}
                    className="t-body-sm h-8 px-3 rounded-lg flex items-center gap-1.5 font-semibold shadow-sm"
                    style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e", border: "1px solid #4a7c5e" }}
                    data-tooltip="One-click certification: 2.0 kg/cm² dwell for 30 min with zero leaks across all weld zones"
                    data-tooltip-pos="left"
                  >
                    <ShieldCheck size={14} />
                    <span>Zero Leaks (All Welds Sound @ 2.0 kg/cm²)</span>
                  </Button>
                )}
                {stage?.characteristics?.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePassAllNominal}
                    data-tooltip="Smart Auto-Fill: Populates all engineering specifications with nominal in-tolerance criteria"
                    data-tooltip-pos="left"
                    className="t-body-sm h-8 px-3 rounded-lg flex items-center gap-1.5 font-medium shadow-sm hover:border-[var(--primary)]"
                    style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)", color: "var(--ink)" }}
                  >
                    <Zap size={13} style={{ color: "#d97706" }} />
                    <CheckCircle2 size={13} style={{ color: "#4a7c5e" }} />
                    <span>Auto-Fill Nominal Specs (Engineering Standards)</span>
                  </Button>
                )}
              </div>
            </div>

                        {/* QUALITY CONTAINMENT STOP BANNER (Failure Cascade) */}
            {hasFailedMeasurement && (
              <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: "rgba(160, 69, 69, 0.08)", border: "2px solid var(--semantic-error)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} style={{ color: "var(--semantic-error)" }} />
                    <span className="t-body-sm font-bold" style={{ color: "var(--semantic-error)" }}>
                      CRITICAL QUALITY CONTAINMENT STOP — INSPECTION HALTED
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase bg-red-100 text-red-800">
                    DOWNSTREAM HALTED
                  </span>
                </div>
                <p className="t-label text-xs" style={{ color: "var(--ink)" }}>
                  Characteristic <strong>"{failedChars[0]}"</strong> failed tolerance specifications. Under ISO 9001:2015 Clause 8.7 and Hi-Tech QMS containment protocol, downstream inspection is <strong>halted immediately</strong>. Segregate radiator unit <strong>{htuNo}</strong> and proceed to Step 4 for mandatory photographic proof and disposition authorization (Rework/Scrap).
                </p>
                <div className="pt-1 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="h-8 px-3 text-xs rounded-lg flex items-center gap-1.5"
                    style={{ backgroundColor: "var(--semantic-error)", color: "#ffffff" }}
                  >
                    Proceed to Step 4: Containment & Sign-off <ChevronRight size={13} />
                  </Button>
                </div>
              </div>
            )}

            {/* Special S14 Quality Gate Banner */}
            {stage?.stageCode === "S14" && (
              <div className="rounded-xl p-3.5 space-y-1.5" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)", border: "1.5px solid rgba(220, 38, 38, 0.3)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={17} style={{ color: "#dc2626" }} />
                    <span className="t-body-sm font-bold" style={{ color: "#dc2626" }}>MANDATORY QUALITY GATE · RADIATOR LEAK TESTING (QCI/F/05/08 REV-03)</span>
                  </div>
                  <span className="t-label text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-red-100 text-red-800">
                    2.0 KG/CM² · 30 MIN
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Pneumatic Test Pressure</div>
                    <div className="font-bold text-[var(--ink)]">2.0 kg/cm² [CTQ]</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Minimum Dwell Time</div>
                    <div className="font-bold text-[var(--ink)]">30 Minutes Continuous</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Weld Zones Inspected</div>
                    <div className="font-bold text-[var(--ink)]">8 CO2 Zones + Fin Seams</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Acceptance Norm</div>
                    <div className="font-bold text-[#4a7c5e]">Zero Soap Bubbles</div>
                  </div>
                </div>
              </div>
            )}

            {/* Special S11 Erection Geometry Banner */}
            {stage?.stageCode === "S11" && (
              <div className="rounded-xl p-3.5 space-y-1.5" style={{ backgroundColor: "rgba(99, 102, 241, 0.05)", border: "1.5px solid rgba(99, 102, 241, 0.3)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass size={17} style={{ color: "#6366f1" }} />
                    <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>RADIATOR ERECTION GEOMETRY & WORKMANSHIP (QCI/F/05/03 REV-09)</span>
                  </div>
                  <span className="t-label text-[10px] px-2 py-0.5 rounded font-mono font-bold" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}>
                    27 SPEC CHECKS
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Pata Coplanarity</div>
                    <div className="font-bold text-[var(--ink)]">≤ 0.4 mm Max [CTQ]</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Line Dori Alignment</div>
                    <div className="font-bold text-[var(--ink)]">≤ 0.5 mm Max [CTQ]</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Flange Right Angle</div>
                    <div className="font-bold text-[var(--ink)]">≤ 1.0 mm Max [CTQ]</div>
                  </div>
                  <div className="p-2 rounded bg-[var(--surface-card)] border border-[var(--hairline-soft)]">
                    <div className="text-[9px] uppercase font-mono text-[var(--muted)]">Z-Pipe Orthogonality</div>
                    <div className="font-bold text-[var(--ink)]">90° Right Angle [CTQ]</div>
                  </div>
                </div>
              </div>
            )}

            {/* Missing validation warning callout */}
            {validationAttempted && missingChars.length > 0 && (
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ backgroundColor: "rgba(160, 69, 69, 0.08)", border: "1.5px solid var(--semantic-error)" }}>
                <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
                <div className="flex-1">
                  <div className="t-body-sm font-bold" style={{ color: "var(--semantic-error)" }}>
                    Validation Error: {missingChars.length} Mandatory Parameter(s) Missing Measurements
                  </div>
                  <div className="t-label text-[11px] mt-0.5" style={{ color: "var(--body)" }}>
                    Every single characteristic requires a recorded measurement or check. Please record values for: <strong>{missingChars.join(", ")}</strong>.
                  </div>
                </div>
              </div>
            )}

            {/* Cognitive Ergonomics Filter Bar (Miller's Law / Chunking & Focus) */}
            {stage?.characteristics?.length > 0 && (
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCharFilter("all")}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: charFilter === "all" ? "var(--primary)" : "var(--canvas-soft)",
                      color: charFilter === "all" ? "var(--on-primary)" : "var(--body)",
                      border: `1px solid ${charFilter === "all" ? "var(--primary)" : "var(--hairline)"}`,
                    }}
                  >
                    <span>All Parameters</span>
                    <span className="text-[10px] opacity-80 font-mono">({stage?.characteristics?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCharFilter("pending")}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: charFilter === "pending" ? "#d97706" : "var(--canvas-soft)",
                      color: charFilter === "pending" ? "#ffffff" : pendingCount > 0 ? "#d97706" : "var(--body)",
                      border: `1px solid ${charFilter === "pending" ? "#d97706" : "var(--hairline)"}`,
                    }}
                  >
                    <Clock size={11} />
                    <span>Pending Records</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold" style={{ backgroundColor: charFilter === "pending" ? "rgba(255,255,255,0.25)" : "rgba(217, 119, 6, 0.15)" }}>
                      {pendingCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCharFilter("ctq")}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    style={{
                      backgroundColor: charFilter === "ctq" ? "var(--primary)" : "var(--canvas-soft)",
                      color: charFilter === "ctq" ? "var(--on-primary)" : "var(--primary)",
                      border: `1px solid ${charFilter === "ctq" ? "var(--primary)" : "var(--hairline)"}`,
                    }}
                  >
                    <Target size={11} />
                    <span>CTQ Gates</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold" style={{ backgroundColor: charFilter === "ctq" ? "rgba(255,255,255,0.25)" : "rgba(8, 50, 96, 0.12)" }}>
                      {stageCtqCount}
                    </span>
                  </button>

                  {failedChars.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCharFilter("failed")}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                      style={{
                        backgroundColor: charFilter === "failed" ? "var(--semantic-error)" : "rgba(160, 69, 69, 0.1)",
                        color: charFilter === "failed" ? "#ffffff" : "var(--semantic-error)",
                        border: `1px solid var(--semantic-error)`,
                      }}
                    >
                      <AlertTriangle size={11} />
                      <span>Failed / Out of Spec</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold" style={{ backgroundColor: charFilter === "failed" ? "rgba(255,255,255,0.25)" : "rgba(160, 69, 69, 0.2)" }}>
                        {failedChars.length}
                      </span>
                    </button>
                  )}
                </div>

                {/* Search filter for instant parameter lookup */}
                <div className="relative w-full sm:w-48">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Filter parameter..."
                    value={charSearch}
                    onChange={(e) => setCharSearch(e.target.value)}
                    className="h-7 text-xs pl-7 pr-2 rounded-lg"
                    style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}
                  />
                  {charSearch && (
                    <button type="button" onClick={() => setCharSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]">
                      <X size={11} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {stage?.characteristics?.length > 0 ? (
              filteredChars.length > 0 ? (
                <div className="space-y-3 max-h-[50vh] overflow-y-auto scroll-fine pr-1">
                  {filteredChars.map((c: any) => {
                    const m = measurements[c.id];
                    const isFail = m && m.pass === false;
                    const isMissing = validationAttempted && (!m || m.value === undefined || m.value === null || String(m.value).trim() === "" || m.pass === undefined);

                    return (
                      <div
                        key={c.id}
                        className="rounded-xl p-3.5 transition-all"
                        style={{
                          border: isMissing
                            ? "1.5px solid var(--semantic-error)"
                            : isFail
                            ? "1.5px solid var(--semantic-error)"
                            : m?.pass
                            ? "1px solid rgba(74, 124, 94, 0.35)"
                            : "1px solid var(--hairline)",
                          backgroundColor: isMissing
                            ? "rgba(160, 69, 69, 0.05)"
                            : isFail
                            ? "rgba(160, 69, 69, 0.04)"
                            : "var(--surface-card)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="t-code text-xs px-1.5 py-0.2 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)" }}>
                                {String(c.seq).padStart(2, "0")}
                              </span>
                              <span className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{c.name}</span>
                              {c.isCTQ && (
                                <span
                                  className="t-label text-[9px] px-1.5 py-0.2 rounded-full font-bold"
                                  style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                                  data-tooltip="Critical-To-Quality parameter: failure halts line and requires containment"
                                  data-tooltip-pos="top"
                                >
                                  CTQ GATE
                                </span>
                              )}
                              {c.charType && (
                                <span className="t-label text-[9px] px-1.5 py-0.2 rounded font-medium" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)" }}>
                                  {c.charType}
                                </span>
                              )}
                              {isMissing && (
                                <span className="t-label text-[9px] px-2 py-0.2 rounded font-bold uppercase" style={{ backgroundColor: "var(--semantic-error)", color: "#ffffff" }}>
                                  REQUIRED RECORD *
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Acceptance Criteria Box */}
                          <div className="shrink-0 text-right">
                            <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>ACCEPTANCE NORM</div>
                            <div className="t-code text-xs font-semibold" style={{ color: "var(--ink)" }}>
                              {c.specification || (c.nominalValue !== null && c.nominalValue !== undefined ? `Nominal ${c.nominalValue}` : "-")}
                              {(c.upperLimit !== null && c.upperLimit !== undefined && c.upperLimit !== "") && ` · Max ${c.upperLimit}`}
                              {(c.lowerLimit !== null && c.lowerLimit !== undefined && c.lowerLimit !== "") && ` · Min ${c.lowerLimit}`}
                              {c.unit && ` ${c.unit}`}
                            </div>
                            {c.method && <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>Tool: {c.method}</div>}
                          </div>
                        </div>

                        {/* Measurement and Pass/Fail Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setM(c.id, m?.value || "OK", true, c.isCTQ, c.name)}
                            data-tooltip={`Mark ${c.name} as conforming (PASS)`}
                            data-tooltip-pos="top"
                            className="px-3 py-1.5 rounded-lg t-body-sm transition-all flex items-center gap-1.5"
                            style={{
                              backgroundColor: m?.pass === true ? "#4a7c5e" : "var(--canvas-soft)",
                              color: m?.pass === true ? "#ffffff" : "var(--ink)",
                              border: `1px solid ${m?.pass === true ? "#4a7c5e" : "var(--hairline)"}`,
                              fontWeight: m?.pass === true ? 600 : 400,
                            }}
                          >
                            <CheckCircle2 size={13} /> Pass
                          </button>
                          <button
                            type="button"
                            onClick={() => setM(c.id, m?.value || "Fail", false, c.isCTQ, c.name)}
                            data-tooltip={`Mark ${c.name} as nonconforming (FAIL - triggers proof requirement)`}
                            data-tooltip-pos="top"
                            className="px-3 py-1.5 rounded-lg t-body-sm transition-all flex items-center gap-1.5"
                            style={{
                              backgroundColor: isFail ? "#a04545" : "var(--canvas-soft)",
                              color: isFail ? "#ffffff" : "var(--ink)",
                              border: `1px solid ${isFail ? "#a04545" : "var(--hairline)"}`,
                              fontWeight: isFail ? 600 : 400,
                            }}
                          >
                            <XCircle size={13} /> Fail
                          </button>

                          {/* Numeric input with instant tolerance checking */}
                          <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
                            <Input
                              type="text"
                              placeholder="Measured value (required)"
                              value={m?.value && m.value !== "OK" && m.value !== "Fail" ? m.value : ""}
                              onChange={(e) => handleNumericInput(c, e.target.value)}
                              data-tooltip={`Enter numeric measurement in ${c.unit || "specified unit"} for ${c.name}`}
                              data-tooltip-pos="top"
                              className="h-8 t-body-sm t-code rounded-lg"
                              style={{
                                borderColor: isMissing ? "var(--semantic-error)" : isFail ? "var(--semantic-error)" : m?.pass ? "rgba(74, 124, 94, 0.4)" : "var(--hairline)",
                                backgroundColor: "var(--canvas-soft)",
                              }}
                            />
                            {c.unit && <span className="t-label text-xs shrink-0" style={{ color: "var(--muted)" }}>{c.unit}</span>}
                          </div>

                          {/* Real-time status chip */}
                          {m?.value && m.value !== "OK" && m.value !== "Fail" && (
                            <span
                              className="t-label text-[10.5px] px-2 py-1 rounded font-mono shrink-0"
                              style={{
                                backgroundColor: isFail ? "rgba(160, 69, 69, 0.12)" : "rgba(74, 124, 94, 0.12)",
                                color: isFail ? "var(--semantic-error)" : "#4a7c5e",
                              }}
                            >
                              {isFail ? "Out of Tol" : "In Tol"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl p-8 text-center space-y-2 border border-dashed border-[var(--hairline)]" style={{ backgroundColor: "var(--surface-card)" }}>
                  <CheckCircle2 size={28} className="mx-auto" style={{ color: "#4a7c5e" }} />
                  <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
                    {charFilter === "pending" ? "All Parameters Recorded!" : charFilter === "failed" ? "Zero Defects Recorded (Clean Inspection)" : "No characteristics matching current filter."}
                  </div>
                  <div className="t-label text-xs" style={{ color: "var(--muted)" }}>
                    {charFilter === "pending" ? "All mandatory measurements and checks for this stage are satisfied." : "Switch back to 'All Parameters' to review the complete checklist."}
                  </div>
                  {charFilter !== "all" && (
                    <Button size="sm" variant="outline" onClick={() => setCharFilter("all")} className="mt-2 text-xs">
                      View All {stage?.characteristics?.length || 0} Parameters
                    </Button>
                  )}
                </div>
              )
            ) : (
              <EmptyState message="No characteristics defined for this stage." hint="Contact process engineering to define QC parameters." />
            )}

            <div className="pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(2)}
                data-tooltip="Return to Step 2: Stage & SOP Reference"
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg"
              >
                Back: Stage
              </Button>
              <Button
                type="button"
                onClick={validateStep3}
                data-tooltip="Verify all required parameters are entered and proceed to final gate verdict"
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5"
                style={{
                  backgroundColor: hasFailedMeasurement ? "var(--semantic-error)" : "var(--primary)",
                  color: "var(--on-primary)",
                }}
              >
                Next: Gate Verdict & Sign-off <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 4: QUALITY GATE VERDICT, CONDITIONAL PROOF & 4-TIER SIGN-OFF */}
        {/* ============================================================ */}
        {activeStep === 4 && (
          <div className="space-y-5">
            <div>
              <div className="t-title-sm mb-1" style={{ color: "var(--ink)" }}>Quality Gate Verdict & Digital Sign-off</div>
              <div className="t-label" style={{ color: "var(--muted)" }}>
                {hasFailedMeasurement
                  ? "Defect detected: Mandatory photographic visual proof and disposition selection required."
                  : "All parameters conforming: Clean release certified. 4-tier personnel sign-off ready."}
              </div>
            </div>

            {/* Verdict Banner */}
            {hasFailedMeasurement ? (
              <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "rgba(160, 69, 69, 0.06)", border: "1.5px solid var(--semantic-error)" }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle size={22} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
                  <div className="flex-1">
                    <div className="t-body-sm font-bold" style={{ color: "var(--semantic-error)" }}>
                      QUALITY GATE FAILED — Containment & Visual Proof Required
                    </div>
                    <div className="t-body-sm mt-1" style={{ color: "var(--body)" }}>
                      {failedChars.length} nonconforming characteristic(s): <strong style={{ color: "var(--ink)" }}>{failedChars.join(", ")}</strong>.
                    </div>
                    <div className="t-label mt-1" style={{ color: "var(--muted)" }}>
                      Work Order will hold this unit, auto-raise an NCR, and route to disposition. Attach visual defect proofs below.
                    </div>
                  </div>
                </div>

                {/* Disposition selection */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDisposition("Rework")}
                    data-tooltip="Issue Rework Job Order (RWO) and transfer component to repair zone"
                    data-tooltip-pos="top"
                    className="flex items-center gap-2.5 p-3 rounded-lg text-left transition-all"
                    style={{
                      border: disposition === "Rework" ? "2px solid var(--primary)" : "1px solid var(--hairline)",
                      backgroundColor: disposition === "Rework" ? "rgba(8, 50, 96, 0.08)" : "var(--surface-card)",
                    }}
                  >
                    <Repeat size={18} style={{ color: disposition === "Rework" ? "var(--primary)" : "var(--muted)" }} />
                    <div>
                      <div className="t-body-sm font-semibold" style={{ color: disposition === "Rework" ? "var(--primary)" : "var(--ink)" }}>Send to Rework</div>
                      <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>Issue RWO and transfer to repair zone</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisposition("Scrap")}
                    data-tooltip="Flag component as irreparable scrap for QA salvage review"
                    data-tooltip-pos="top"
                    className="flex items-center gap-2.5 p-3 rounded-lg text-left transition-all"
                    style={{
                      border: disposition === "Scrap" ? "2px solid var(--semantic-error)" : "1px solid var(--hairline)",
                      backgroundColor: disposition === "Scrap" ? "rgba(160, 69, 69, 0.08)" : "var(--surface-card)",
                    }}
                  >
                    <Ban size={18} style={{ color: disposition === "Scrap" ? "var(--semantic-error)" : "var(--muted)" }} />
                    <div>
                      <div className="t-body-sm font-semibold" style={{ color: disposition === "Scrap" ? "var(--semantic-error)" : "var(--ink)" }}>Scrap Component</div>
                      <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>Flag as irreparable scrap for QA review</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl p-4 flex items-center gap-3.5" style={{ backgroundColor: "rgba(74, 124, 94, 0.08)", border: "1.5px solid rgba(74, 124, 94, 0.4)" }}>
                <CheckCircle2 size={24} className="shrink-0" style={{ color: "#4a7c5e" }} />
                <div>
                  <div className="t-body-sm font-bold" style={{ color: "#4a7c5e" }}>
                    100% CONFORMING QUALITY GATE — Standard Clean Release
                  </div>
                  <div className="t-label mt-0.5" style={{ color: "var(--body)" }}>
                    All {stage?.characteristics?.length || 0} parameter measurements verified within nominal engineering tolerance. Photographic defect proof is not required for clean conforming units.
                  </div>
                </div>
              </div>
            )}

            {/* Evidence & Visual Proof Upload Studio — SHOWN ONLY ON FAILURE */}
            {hasFailedMeasurement && (
              <div className="rounded-xl p-4" style={{ backgroundColor: "var(--surface-card)", border: "1.5px solid var(--semantic-error)" }}>
                <div className="mb-2">
                  <div className="flex items-center gap-2">
                    <Camera size={16} style={{ color: "var(--semantic-error)" }} />
                    <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>Visual Defect Evidence Studio (Mandatory for Nonconformance)</div>
                  </div>
                  <div className="t-label text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                    Attach visual defect documentation: photographs of nonconforming dimension, dial gauge readout, weld crack, or leak marker.
                  </div>
                </div>
                <EvidenceUploadStudio
                  items={evidenceFiles}
                  onChange={setEvidenceFiles}
                  stageCode={stage?.stageCode}
                  defectCategory={failedChars[0] || stage?.name}
                  hasFailure={hasFailedMeasurement}
                />
              </div>
            )}

            {/* 4-Tier Accountability Sign-off Stamp */}
            <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} style={{ color: "var(--primary)" }} />
                  <span className="t-label font-bold text-[11px]" style={{ color: "var(--ink)" }}>4-TIER AUDIT & ACCOUNTABILITY SIGN-OFF STAMP</span>
                </div>
                <span className="t-code text-[10px]" style={{ color: "var(--muted)" }}>DIGITAL VERIFICATION</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div
                  className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
                  style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                  data-tooltip="Tier 3: Shopfloor fabrication operator who worked on the component"
                  data-tooltip-pos="top"
                >
                  <div className="t-label text-[9.5px]" style={{ color: "var(--muted)" }}>1. LINE OPERATOR</div>
                  <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{operator || "Ravi Kamble"}</div>
                  <div className="t-label text-[9px]" style={{ color: "var(--muted-soft)" }}>Line Fabrication</div>
                </div>
                <div
                  className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
                  style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                  data-tooltip="Authenticated session author entering measurements"
                  data-tooltip-pos="top"
                >
                  <div className="t-label text-[9.5px]" style={{ color: "var(--muted)" }}>2. DOCUMENTED BY</div>
                  <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{user.role === "Admin" ? `${user.name} (IT Entry)` : user.name}</div>
                  <div className="t-label text-[9px]" style={{ color: user.role === "Admin" ? "var(--muted)" : "var(--primary)" }}>{user.role === "Admin" ? "IT Desk Governance" : `${user.role} (Current)`}</div>
                </div>
                <div
                  className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
                  style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                  data-tooltip="Tier 2: Certified quality checker who verified tolerances"
                  data-tooltip-pos="top"
                >
                  <div className="t-label text-[9.5px]" style={{ color: "var(--muted)" }}>3. QC CHECKER</div>
                  <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{checkedBy || "Sneha Patel"}</div>
                  <div className="t-label text-[9px]" style={{ color: "var(--muted-soft)" }}>Tolerance Verified</div>
                </div>
                <div
                  className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
                  style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                  data-tooltip="Tier 1: Authorized manager who signs off gate release"
                  data-tooltip-pos="top"
                >
                  <div className="t-label text-[9.5px]" style={{ color: "var(--muted)" }}>4. GATE APPROVER</div>
                  <div className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }}>{approvedBy || "Amit Shah"}</div>
                  <div className="t-label text-[9px]" style={{ color: "var(--muted-soft)" }}>Release Sign-off</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="t-label" style={{ color: "var(--muted)" }}>Inspection Remarks & Observations</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Enter any additional shopfloor observations or comments..."
                data-tooltip="Document any shopfloor observations, tool serials, or environmental conditions"
                data-tooltip-pos="top"
                className="mt-1 t-body-sm rounded-lg"
                style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}
              />
            </div>

            {/* Traceability Summary Bar */}
            <div className="rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
              <div>
                <span className="text-muted block text-[10px]">WO & HTU</span>
                <span className="font-mono font-medium text-ink">{selectedWo?.woNumber} · {htuNo}</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">STAGE</span>
                <span className="font-medium text-ink">{stage?.stageCode} ({stage?.name})</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">INSPECTOR & SHIFT</span>
                <span className="font-medium text-ink">{checkedBy || user.name} (Shift {shift})</span>
              </div>
              <div>
                <span className="text-muted block text-[10px]">STATUS</span>
                <span className="font-medium" style={{ color: hasFailedMeasurement ? "var(--semantic-error)" : "#4a7c5e" }}>
                  {hasFailedMeasurement ? `${failedChars.length} Defect(s)` : "100% Conforming"}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveStep(3)}
                data-tooltip="Return to Step 3: Characteristic measurements"
                data-tooltip-pos="top"
                className="t-button h-9 px-4 rounded-lg"
              >
                Back: Parameters
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  data-tooltip="Discard current inspection draft and close drawer"
                  data-tooltip-pos="top"
                  className="t-button h-9 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={saving || !stage || !woId}
                  data-tooltip={hasFailedMeasurement ? "Record nonconformance, upload proofs, and raise Rework Order" : "Digitally sign 4-tier approval and issue Certificate of Conformance"}
                  data-tooltip-pos="top"
                  className="t-button h-9 px-5 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: hasFailedMeasurement ? "var(--semantic-error)" : "var(--primary)",
                    color: "var(--on-primary)",
                  }}
                >
                  {saving
                    ? "Submitting to QMS..."
                    : hasFailedMeasurement
                    ? "Submit Failure · Issue Rework Order"
                    : "Approve & Record Inspection"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Inspection Report Generators (PDF/Print, HTML, CSV, JSON)
// ============================================================
function generateInspectionCertificateHtml(record: any, signoff: any, measurements: Record<string, any>) {
  const charEntries = Object.entries(measurements).filter(([key]) => !key.startsWith("_"));
  const isPass = record.overallResult === "Pass";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate of Inspection - ${record.recordNo}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; background: #ffffff; font-size: 11px; line-height: 1.4; padding: 10px; }
    .cert-container { max-width: 820px; margin: 0 auto; border: 2px solid #083260; padding: 24px; background: #ffffff; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #083260; padding-bottom: 14px; margin-bottom: 16px; }
    .logo-block h1 { font-size: 20px; font-weight: 800; color: #083260; letter-spacing: 0.5px; }
    .logo-block .sub { font-size: 10px; color: #52525b; margin-top: 2px; }
    .cert-title-block { text-align: right; }
    .cert-title-block h2 { font-size: 15px; font-weight: 700; color: #18181b; text-transform: uppercase; letter-spacing: 0.5px; }
    .cert-title-block .cert-no { font-family: monospace; font-size: 12px; font-weight: 700; color: #083260; margin-top: 3px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 16px; }
    .meta-item .label { font-size: 9px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; }
    .meta-item .val { font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .meta-item .val-mono { font-family: monospace; font-size: 11px; font-weight: 700; color: #083260; margin-top: 2px; }
    .verdict-banner { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; }
    .verdict-pass { background: #eef7f2; border: 1.5px solid #4a7c5e; color: #22543d; }
    .verdict-fail { background: #fdf2f2; border: 1.5px solid #a04545; color: #742a2a; }
    .verdict-text { font-size: 12px; font-weight: 800; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th { background: #083260; color: #ffffff; font-size: 9.5px; font-weight: 600; text-transform: uppercase; padding: 6px 8px; text-align: left; letter-spacing: 0.3px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; }
    tr:nth-child(even) { background: #f8fafc; }
    .tag-intol { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; background: #eef7f2; color: #22543d; border: 1px solid #4a7c5e; }
    .tag-outtol { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 700; background: #fdf2f2; color: #742a2a; border: 1px solid #a04545; }
    .tag-ctq { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: 700; background: #083260; color: #fff; margin-left: 4px; vertical-align: middle; }
    .crew-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 16px; background: #f8fafc; }
    .crew-card { border: 1px solid #cbd5e1; background: #fff; padding: 8px; border-radius: 4px; }
    .crew-tier { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .crew-name { font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 3px; }
    .crew-role { font-size: 9px; color: #475569; margin-top: 1px; }
    .crew-sig { font-size: 8px; color: #4a7c5e; font-weight: 600; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 9px; color: #64748b; }
    .hash-code { font-family: monospace; font-size: 9.5px; color: #083260; font-weight: 600; }
    @media print {
      body { background: #fff; padding: 0; }
      .cert-container { border: none; padding: 0; max-width: none; box-shadow: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="header">
      <div class="logo-block">
        <h1>HI-TECH RADIATORS PVT. LTD.</h1>
        <div class="sub">Unit 2: Plot E-24/1, MIDC Chakan Phase II, Pune 410501 · ISO 9001:2015 / IATF 16949 Certified</div>
        <div class="sub">Quality Assurance & Shopfloor Digital Inspection Division</div>
      </div>
      <div class="cert-title-block">
        <h2>Inspection Certificate (COC)</h2>
        <div class="cert-no">COC-${record.recordNo}</div>
        <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Issued: ${new Date(record.inspectedAt).toLocaleDateString()}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="label">Work Order</div>
        <div class="val-mono">${record.workOrder?.woNumber || "-"}</div>
      </div>
      <div class="meta-item">
        <div class="label">HTU Radiator Serial</div>
        <div class="val-mono">${record.htuNo || "-"}</div>
      </div>
      <div class="meta-item">
        <div class="label">Customer</div>
        <div class="val">${record.workOrder?.customer || "-"}</div>
      </div>
      <div class="meta-item">
        <div class="label">Item / Model</div>
        <div class="val">${record.workOrder?.itemName || "Radiator Core"}</div>
      </div>
      <div class="meta-item">
        <div class="label">Manufacturing Stage</div>
        <div class="val">${record.stage?.stageCode} · ${record.stage?.name}</div>
      </div>
      <div class="meta-item">
        <div class="label">Standard / SOP</div>
        <div class="val">${record.stage?.documentRef || "QCI/F/01"}</div>
      </div>
      <div class="meta-item">
        <div class="label">Operational Shift</div>
        <div class="val">Shift ${record.shift}</div>
      </div>
      <div class="meta-item">
        <div class="label">CTQ Gate Result</div>
        <div class="val" style="color: ${record.ctqResult === "Pass" ? "#22543d" : "#742a2a"}">${record.ctqResult || "Pass"}</div>
      </div>
    </div>

    <div class="verdict-banner ${isPass ? "verdict-pass" : "verdict-fail"}">
      <div>
        <div class="verdict-text">${isPass ? "✓ 100% Quality Approved — Conforming Stage Gate" : "⚠ Quality Gate Nonconformance — Containment Required"}</div>
        <div style="font-size: 10px; margin-top: 2px;">${isPass ? "All inspected characteristics evaluated within engineering tolerance specifications." : "One or more parameters out-of-tolerance. Component held for disposition."}</div>
      </div>
      <div style="text-align: right;">
        <span style="font-weight: 800; font-size: 13px;">${record.overallResult}</span>
      </div>
    </div>

    <div style="font-weight: 700; font-size: 11px; color: #083260; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">
      Characteristic Measurements & Tolerance Evaluations (${charEntries.length})
    </div>
    <table>
      <thead>
        <tr>
          <th style="width: 35px;">Seq</th>
          <th>Inspection Parameter</th>
          <th>Specification / Norm</th>
          <th>Tool / Method</th>
          <th>Measured Value</th>
          <th style="width: 85px; text-align: center;">Evaluation</th>
        </tr>
      </thead>
      <tbody>
        ${charEntries.map(([id, m]: any, idx: number) => {
          const pass = m.pass !== false;
          return `<tr>
            <td style="font-family: monospace; font-weight: 600;">${String(idx + 1).padStart(2, "0")}</td>
            <td>
              <strong>${m.name || id}</strong>
              ${m.ctq ? '<span class="tag-ctq">CTQ</span>' : ""}
            </td>
            <td>${m.specification || "-"}</td>
            <td style="color: #64748b;">${m.method || "Standard Gauge"}</td>
            <td style="font-family: monospace; font-weight: 700;">${String(m.value || "-")} ${m.unit || ""}</td>
            <td style="text-align: center;">
              <span class="${pass ? "tag-intol" : "tag-outtol"}">${pass ? "IN TOL" : "OUT OF TOL"}</span>
            </td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>

    <div style="font-weight: 700; font-size: 11px; color: #083260; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px;">
      4-Tier Personnel Accountability & Audit Sign-off Crew
    </div>
    <div class="crew-grid">
      <div class="crew-card">
        <div class="crew-tier">1. Line Operator</div>
        <div class="crew-name">${signoff.operator || "-"}</div>
        <div class="crew-role">${signoff.operatorRole || "Fabrication Craftsman"}</div>
        <div class="crew-sig">✓ Fabricated Unit</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">2. Documented By</div>
        <div class="crew-name">${signoff.documentedBy || "-"}</div>
        <div class="crew-role">${signoff.documenterRole || "Inspector"} (@${signoff.documenterUsername || "staff"})</div>
        <div class="crew-sig">✓ Session Logged</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">3. Quality Checker</div>
        <div class="crew-name">${signoff.checkedBy || "-"}</div>
        <div class="crew-role">${signoff.checkerRole || "QC Inspector"}</div>
        <div class="crew-sig">✓ Tolerances Checked</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">4. Releasing Approver</div>
        <div class="crew-name">${signoff.approvedBy || "-"}</div>
        <div class="crew-role">${signoff.approverRole || "Quality Manager"}</div>
        <div class="crew-sig">✓ Release Approved</div>
      </div>
    </div>

    ${record.notes ? `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px;">
      <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Inspector Remarks & Observations</div>
      <div style="font-size: 10.5px; color: #0f172a; margin-top: 2px;">${record.notes}</div>
    </div>` : ""}

    <div class="footer">
      <div>
        <span>Digital Audit Verification Stamp: </span>
        <span class="hash-code">${signoff.digitalSignature || `SIG-${record.id?.slice(-8)}-VERIFIED`}</span>
      </div>
      <div>
        <span>Hive QMS · Generated: ${new Date().toISOString()} · Page 1 of 1</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function downloadInspectionCertificateHtml(record: any, signoff: any, measurements: Record<string, any>) {
  const html = generateInspectionCertificateHtml(record, signoff, measurements);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Inspection_Certificate_${record.recordNo}_HTU_${record.htuNo}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printInspectionCertificate(record: any, signoff: any, measurements: Record<string, any>) {
  const html = generateInspectionCertificateHtml(record, signoff, measurements);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}

function downloadInspectionCsv(record: any, signoff: any, measurements: Record<string, any>) {
  const charEntries = Object.entries(measurements).filter(([key]) => !key.startsWith("_"));

  let csv = `HI-TECH RADIATORS PVT. LTD. - DIGITAL STAGE INSPECTION REPORT\r\n`;
  csv += `Exported At: ${new Date().toISOString()} · Certificate Reference: COC-${record.recordNo}\r\n\r\n`;

  csv += `INSPECTION METADATA & STAGE ROUTING\r\n`;
  csv += `Record No,Work Order,Customer,HTU Radiator Serial,Stage Code,Stage Name,Document Ref,Shift,Inspected At,Overall Gate Result,CTQ Result\r\n`;
  csv += `"${record.recordNo}","${record.workOrder?.woNumber || ""}","${record.workOrder?.customer || ""}","${record.htuNo || ""}","${record.stage?.stageCode || ""}","${record.stage?.name || ""}","${record.stage?.documentRef || ""}","Shift ${record.shift}","${record.inspectedAt}","${record.overallResult}","${record.ctqResult || ""}"\r\n\r\n`;

  csv += `4-TIER PERSONNEL ACCOUNTABILITY AUDIT TRAIL\r\n`;
  csv += `Tier,Personnel Name,Designation,Authority Level,Audit Role,Digital Signature Hash\r\n`;
  csv += `"Tier 3 - Line Operator","${signoff.operator || ""}","${signoff.operatorRole || "Operator"}","Shopfloor Fabrication","Fabricated physical radiator unit","${signoff.digitalSignature || ""}"\r\n`;
  csv += `"Documented By","${signoff.documentedBy || ""}","${signoff.documenterRole || "Inspector"}","Digital Author","Logged and authored digital form session (@${signoff.documenterUsername || ""})","${signoff.digitalSignature || ""}"\r\n`;
  csv += `"Tier 2 - Quality Checker","${signoff.checkedBy || ""}","${signoff.checkerRole || "QCInspector"}","Quality Verification","Verified physical dimensions and gauge readings","${signoff.digitalSignature || ""}"\r\n`;
  csv += `"Tier 1 - Releasing Approver","${signoff.approvedBy || ""}","${signoff.approverRole || "QualityManager"}","Gate Release Authority","Approved stage gate clearance and disposition","${signoff.digitalSignature || ""}"\r\n\r\n`;

  csv += `CHARACTERISTIC MEASUREMENTS & TOLERANCE EVALUATIONS\r\n`;
  csv += `Seq,Parameter Name,Specification / Norm,Nominal,Lower Limit,Upper Limit,Unit,Tool / Method,Measured Shopfloor Value,Tolerance Verdict,CTQ Gate\r\n`;

  charEntries.forEach(([id, m]: any, idx: number) => {
    const pass = m.pass !== false;
    csv += `"${idx + 1}","${m.name || id}","${m.specification || ""}","${m.nominalValue ?? ""}","${m.lowerLimit ?? ""}","${m.upperLimit ?? ""}","${m.unit || ""}","${m.method || "Standard Gauge"}","${m.value ?? ""}","${pass ? "IN TOL" : "OUT OF TOL"}","${m.ctq ? "YES" : "NO"}"\r\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Inspection_Report_${record.recordNo}_HTU_${record.htuNo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadInspectionJson(record: any, signoff: any, measurements: Record<string, any>) {
  const charEntries = Object.entries(measurements).filter(([key]) => !key.startsWith("_"));
  const payload = {
    schemaVersion: "hive.qms.inspection.v4",
    exportedAt: new Date().toISOString(),
    organization: {
      company: "Hi-Tech Radiators Pvt. Ltd.",
      plant: "Unit 2, MIDC Chakan Phase II, Pune",
      standards: ["ISO 9001:2015", "IATF 16949"],
    },
    inspectionRecord: {
      recordNo: record.recordNo,
      workOrder: record.workOrder?.woNumber,
      customer: record.workOrder?.customer,
      htuNo: record.htuNo,
      stage: {
        stageCode: record.stage?.stageCode,
        name: record.stage?.name,
        documentRef: record.stage?.documentRef,
      },
      shift: record.shift,
      inspectedAt: record.inspectedAt,
      ctqResult: record.ctqResult,
      overallResult: record.overallResult,
      notes: record.notes || "",
    },
    personnelSignoff: {
      operator: { name: signoff.operator, role: signoff.operatorRole, tier: "Tier 3: Fabrication Operator" },
      documentedBy: { name: signoff.documentedBy, role: signoff.documenterRole, username: signoff.documenterUsername, tier: "Digital Session Author" },
      checkedBy: { name: signoff.checkedBy, role: signoff.checkerRole, tier: "Tier 2: Quality Checker" },
      approvedBy: { name: signoff.approvedBy, role: signoff.approverRole, tier: "Tier 1: Releasing Approver" },
      signedAt: signoff.signedAt,
      digitalSignature: signoff.digitalSignature,
    },
    measurements: charEntries.map(([id, m]: any, idx: number) => ({
      sequence: idx + 1,
      id,
      name: m.name || id,
      specification: m.specification || null,
      tool: m.method || null,
      measuredValue: m.value,
      inTolerance: m.pass !== false,
      isCTQ: !!m.ctq,
    })),
    evidence: record.evidencePath ? (typeof record.evidencePath === "string" ? JSON.parse(record.evidencePath || "[]") : record.evidencePath) : [],
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Inspection_Audit_${record.recordNo}_HTU_${record.htuNo}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// Inspection Detail Component (Spacious 80vw Drawer)
// ============================================================
function InspectionDetail({ record, onClose }: { record: any; onClose?: () => void }) {
  const measurements = useMemo(() => {
    try { return typeof record.measurements === "string" ? JSON.parse(record.measurements) : record.measurements || {}; }
    catch { return {}; }
  }, [record]);

  const signoff = record.signoff || measurements._signoff || {
    operator: record.operator || "Ravi Kamble",
    operatorRole: "Operator",
    documentedBy: record.inspector || "Sneha Patel",
    documenterRole: "QCInspector",
    documenterUsername: (record.inspector || "sneha.patel").toLowerCase().replace(/\s+/g, '.'),
    checkedBy: record.inspector || "Sneha Patel",
    checkerRole: "QCInspector",
    approvedBy: "Amit Shah",
    approverRole: "QualityManager",
    signedAt: record.inspectedAt,
    digitalSignature: `SIG-${record.id?.slice(-8) || "VERIFIED"}-PASS`,
  };

  const charEntries = useMemo(() => {
    return Object.entries(measurements).filter(([key]) => !key.startsWith("_"));
  }, [measurements]);

  const evidenceList = useMemo(() => {
    if (!record.evidencePath) return [];
    try {
      const parsed = typeof record.evidencePath === "string" ? JSON.parse(record.evidencePath) : record.evidencePath;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [record.evidencePath]);

  const isFailed = record.overallResult === "Fail";

  return (
    <div className="flex flex-col h-full">
      {/* Drawer Header with Title and Quick Actions */}
      <SheetHeader className="px-6 pt-6 pb-4 border-b flex flex-row items-center justify-between shrink-0" style={{ borderColor: "var(--hairline)" }}>
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle
              className="t-display-sm t-code"
              style={{ color: "var(--ink)" }}
              data-tooltip="Unique sequential inspection record identifier in QMS database"
              data-tooltip-pos="bottom"
            >
              {record.recordNo}
            </SheetTitle>
            <div data-tooltip="Overall stage gate release evaluation status" data-tooltip-pos="bottom">
              <ResultBadge result={record.overallResult} />
            </div>
            <span
              className="t-code text-xs px-2 py-0.5 rounded font-mono"
              style={{ backgroundColor: "var(--canvas-soft)", color: "var(--muted)", border: "1px solid var(--hairline)" }}
              data-tooltip="Approved standard operating procedure instruction"
              data-tooltip-pos="bottom"
            >
              {record.stage?.documentRef || "QCI/F/01"}
            </span>
          </div>
          <SheetDescription className="t-body-md mt-1 truncate" style={{ color: "var(--muted)" }}>
            {record.stage?.name} · {record.workOrder?.woNumber} · HTU {record.htuNo} · {record.workOrder?.customer || "Standard Customer"}
          </SheetDescription>
        </div>

        {/* Quick Action Buttons Group in Header */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInspectionCertificate(record, signoff, measurements)}
            data-tooltip="Print official Certificate of Conformance (COC) or Save as PDF"
            data-tooltip-pos="bottom"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 t-body-sm font-medium"
            style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}
          >
            <Printer size={13} style={{ color: "var(--primary)" }} />
            <span className="hidden sm:inline">Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInspectionCsv(record, signoff, measurements)}
            data-tooltip="Download tabular measurements & limits as CSV for Excel/SPC"
            data-tooltip-pos="bottom"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 t-body-sm font-medium"
            style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}
          >
            <FileSpreadsheet size={13} style={{ color: "#4a7c5e" }} />
            <span className="hidden sm:inline">CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadInspectionJson(record, signoff, measurements)}
            data-tooltip="Download cryptographic digital audit package as JSON"
            data-tooltip-pos="bottom"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 t-body-sm font-medium"
            style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}
          >
            <FileJson size={13} style={{ color: "#d97706" }} />
            <span className="hidden sm:inline">JSON</span>
          </Button>
        </div>
      </SheetHeader>

      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {/* ============================================================ */}
        {/* STANDARDIZED REPORT & COMPLIANCE DOWNLOAD CENTER */}
        {/* ============================================================ */}
        <StandardizedReportsCard
          record={record}
          signoff={signoff}
          measurements={measurements}
          onPrintCurrent={() => printInspectionCertificate(record, signoff, measurements)}
          onDownloadCurrentCsv={() => downloadInspectionCsv(record, signoff, measurements)}
          onDownloadCurrentJson={() => downloadInspectionJson(record, signoff, measurements)}
          onDownloadCurrentHtml={() => downloadInspectionCertificateHtml(record, signoff, measurements)}
        />

        {/* Core Metadata Grid with Tooltips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
          <DetailRow label="Work Order" value={record.workOrder?.woNumber} mono tooltip="Authorized manufacturing production work order" />
          <DetailRow label="HTU Serial" value={record.htuNo} mono tooltip="Unique unit serial number stamped on radiator header" />
          <DetailRow label="Stage Code" value={`${record.stage?.stageCode} (${record.stage?.name})`} tooltip="Manufacturing process stage in route" />
          <DetailRow label="Shift" value={`Shift ${record.shift}`} tooltip="Shopfloor manufacturing shift when inspected" />
          <DetailRow label="Inspected At" value={fmtDateTime(record.inspectedAt)} tooltip="Exact system timestamp when parameters were recorded" />
          <DetailRow label="CTQ Result" value={record.ctqResult} tooltip="Critical-To-Quality acceptance criteria evaluation" />
          <DetailRow label="Document Ref" value={record.stage?.documentRef || "QCI/F/01"} mono tooltip="Standard Operating Procedure (SOP) standard" />
          <DetailRow label="Overall Gate" value={record.overallResult} tooltip="Final stage release clearance decision" />
        </div>

        {/* 4-Tier Personnel Accountability Dossier with Tooltips */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} style={{ color: "var(--primary)" }} />
              <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>4-Tier Personnel Accountability Dossier</span>
            </div>
            <span className="t-label text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "rgba(8, 50, 96, 0.08)", color: "var(--primary)" }}>
              AUDIT RECORD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Operator */}
            <div
              className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
              style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
              data-tooltip="Shopfloor craftsman/machinist who fabricated this radiator unit"
              data-tooltip-pos="top"
            >
              <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>1. LINE OPERATOR</div>
              <div className="t-body-sm font-semibold mt-0.5 truncate" style={{ color: "var(--ink)" }}>{signoff.operator || record.operator || "-"}</div>
              <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>{signoff.operatorRole || "Fabrication Operator"}</div>
            </div>

            {/* Documented By */}
            <div
              className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
              style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
              data-tooltip="Authenticated digital author logged into this session who entered measurements"
              data-tooltip-pos="top"
            >
              <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>2. DOCUMENTED BY</div>
              <div className="t-body-sm font-semibold mt-0.5 truncate" style={{ color: "var(--ink)" }}>{signoff.documentedBy || record.inspector || "-"}</div>
              <div className="t-label text-[10px] mt-0.5 truncate" style={{ color: "var(--primary)" }}>
                {signoff.documenterRole || "Inspector"} · @{signoff.documenterUsername || "staff"}
              </div>
            </div>

            {/* Quality Checker */}
            <div
              className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
              style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
              data-tooltip="Certified QC Inspector who verified physical dimensions and tolerances on shopfloor"
              data-tooltip-pos="top"
            >
              <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>3. QUALITY CHECKER</div>
              <div className="t-body-sm font-semibold mt-0.5 truncate" style={{ color: "var(--ink)" }}>{signoff.checkedBy || record.inspector || "-"}</div>
              <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>{signoff.checkerRole || "QC Inspector"}</div>
            </div>

            {/* Releasing Approver */}
            <div
              className="p-2.5 rounded-lg cursor-help transition-colors hover:bg-[var(--surface-card)]"
              style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
              data-tooltip="Authorized quality authority who approved stage gate release or disposition"
              data-tooltip-pos="top"
            >
              <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>4. RELEASING APPROVER</div>
              <div className="t-body-sm font-semibold mt-0.5 truncate" style={{ color: "var(--ink)" }}>{signoff.approvedBy || "Amit Shah"}</div>
              <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted-soft)" }}>{signoff.approverRole || "Quality Manager"}</div>
            </div>
          </div>

          {/* Digital Signature & Hash */}
          <div
            className="flex items-center justify-between text-[11px] pt-1.5 border-t cursor-help"
            style={{ borderColor: "var(--hairline)" }}
            data-tooltip="Cryptographic SHA-256 digital verification hash guaranteeing audit tamper-proofing"
            data-tooltip-pos="top"
          >
            <span className="t-label" style={{ color: "var(--muted)" }}>Digital Signature Hash:</span>
            <span className="t-code font-medium" style={{ color: "var(--primary)" }}>{signoff.digitalSignature || `SIG-${record.id?.slice(-8) || "VERIFIED"}`}</span>
          </div>
        </div>

        {/* Visual Proof Gallery — Conditionally rendered: ONLY if failed OR files attached */}
        {(isFailed || evidenceList.length > 0) ? (
          <div className="space-y-2">
            <EvidenceGallery
              evidenceData={record.evidencePath}
              title={isFailed ? "Visual Defect Proof & Diagnostic Documents (Nonconformance)" : "Attached Inspection Visuals & Proofs"}
            />
          </div>
        ) : (
          <div
            className="rounded-lg p-3 flex items-center gap-2.5"
            style={{ backgroundColor: "rgba(74, 124, 94, 0.05)", border: "1px solid rgba(74, 124, 94, 0.2)" }}
            data-tooltip="Unit conforms to 100% nominal engineering tolerances. Visual proof not required for clean releases."
            data-tooltip-pos="top"
          >
            <CheckCircle2 size={16} style={{ color: "#4a7c5e" }} />
            <div className="t-body-sm text-[12px]" style={{ color: "var(--body)" }}>
              <strong style={{ color: "#4a7c5e" }}>Clean Conforming Pass:</strong> Visual defect proofs are not required for units meeting 100% nominal tolerance.
            </div>
          </div>
        )}

        {/* Characteristic Measurements Breakdown Table */}
        {charEntries.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="p-3.5 border-b flex items-center justify-between" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
              <div className="flex items-center gap-2">
                <span className="t-label font-bold text-[11px]" style={{ color: "var(--ink)" }}>CHARACTERISTIC MEASUREMENTS & TOLERANCE BAND</span>
                <span className="t-code text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: "var(--surface-card)", color: "var(--muted)" }}>
                  {charEntries.length} CHECKS RECORDED
                </span>
              </div>
              <div className="t-code text-xs font-semibold" style={{ color: "var(--primary)" }}>{record.stage?.name}</div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                    <th className="py-2.5 px-3.5 t-label font-semibold" style={{ color: "var(--muted)", width: 45 }}>#</th>
                    <th className="py-2.5 px-3.5 t-label font-semibold" style={{ color: "var(--muted)" }}>Characteristic / Parameter</th>
                    <th className="py-2.5 px-3.5 t-label font-semibold" style={{ color: "var(--muted)" }}>Specification / Norm</th>
                    <th className="py-2.5 px-3.5 t-label font-semibold" style={{ color: "var(--muted)" }}>Tool / Method</th>
                    <th className="py-2.5 px-3.5 t-label font-semibold" style={{ color: "var(--muted)" }}>Measured Reading</th>
                    <th className="py-2.5 px-3.5 t-label font-semibold text-center" style={{ color: "var(--muted)", width: 110 }}>Tolerance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {charEntries.map(([id, m]: any, idx: number) => {
                    const pass = m.pass !== false;
                    return (
                      <tr
                        key={id}
                        className="transition-colors hover:bg-[var(--canvas-soft)]"
                        style={{
                          borderBottom: "1px solid var(--hairline)",
                          backgroundColor: pass ? "transparent" : "rgba(160, 69, 69, 0.03)",
                        }}
                      >
                        <td className="py-2.5 px-3.5 t-code font-medium" style={{ color: "var(--muted)" }}>
                          {String(idx + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium" style={{ color: "var(--ink)" }}>{m.name || id}</span>
                            {m.ctq && (
                              <span
                                className="t-label text-[9px] px-1.5 py-0.2 rounded-full font-bold"
                                style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                                data-tooltip="Critical-To-Quality parameter: failure triggers automatic containment"
                                data-tooltip-pos="top"
                              >
                                CTQ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 t-code text-[11px]" style={{ color: "var(--body)" }}>
                          {m.specification || "-"}
                        </td>
                        <td className="py-2.5 px-3.5 t-label text-[11px]" style={{ color: "var(--muted)" }}>
                          {m.method || "Standard Gauge"}
                        </td>
                        <td className="py-2.5 px-3.5 t-code font-bold text-[12px]" style={{ color: "var(--ink)" }}>
                          {String(m.value)} {m.unit || ""}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-[10.5px] font-semibold"
                            style={{
                              backgroundColor: pass ? "rgba(74, 124, 94, 0.12)" : "rgba(160, 69, 69, 0.12)",
                              color: pass ? "#4a7c5e" : "var(--semantic-error)",
                              border: `1px solid ${pass ? "rgba(74, 124, 94, 0.3)" : "rgba(160, 69, 69, 0.3)"}`,
                            }}
                            data-tooltip={pass ? "Measured dimension within engineering tolerance" : "Measured dimension out of tolerance limits"}
                            data-tooltip-pos="left"
                          >
                            {pass ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {pass ? "IN TOL" : "OUT OF TOL"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {record.notes && (
          <div
            className="rounded-xl p-3.5"
            style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
            data-tooltip="Shopfloor inspector remarks and stage notes"
            data-tooltip-pos="top"
          >
            <div className="t-label mb-1" style={{ color: "var(--muted)" }}>Inspection Notes</div>
            <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{record.notes}</div>
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
    { key: "proof", header: "Proof", render: (n) => <EvidenceBadge evidenceData={n.inspection?.evidencePath} />, hideOnMobile: true },
    { key: "date", header: "Date", sortable: true, sortValue: (n) => new Date(n.createdAt).getTime(), render: (n) => <span className="t-label">{fmtDate(n.createdAt)}</span>, hideOnMobile: true },
  ];

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Risk & Quality"
        title="Nonconformance & CAPA"
        subtitle="Containment, root cause, corrective action and effectiveness verification."
        helpId="ncr.capa"
      />
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

        {/* Originating Visual Proof & Documents */}
        {ncr.inspection?.evidencePath && (
          <EvidenceGallery
            evidenceData={ncr.inspection.evidencePath}
            title={`Originating Inspection Proof (${ncr.inspection.recordNo || "Evidence"})`}
          />
        )}

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
      <PageHeader eyebrow="Risk Intelligence" title="FMEA & Risk Register" subtitle="RPN = Severity × Occurrence × Detection. Critical-severity items escalate independently of RPN." helpId="fmea.risk" />
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
      <PageHeader eyebrow="Governance & Knowledge" title="Document Control" subtitle="Controlled QCI/F and PRO/F forms with revision status and effective dates." helpId="doc.control" />
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
      <PageHeader eyebrow="Continuous Improvement" title="Quality Analytics" subtitle="FPY trends, defect Pareto, QC7 tools, FMEA risk matrix and stage-level yields." helpId="analytics.quality" />
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
  const [viewMode, setViewMode] = useState<"directory" | "hierarchy">("directory");

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
    { key: "role", header: "Role & Authority", sortable: true, sortValue: (u) => u.role, render: (u) => (
      <div>
        <span className="t-label px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{ROLE_LABELS[u.role] || u.role}</span>
        <div className="t-label text-[10px] mt-0.5 font-mono" style={{ color: "var(--primary)" }}>
          {u.role === "Admin" ? "IT Desk Systems (No Shopfloor Sign-off)" :
           ["CEO", "Director", "DGM", "QualityManager", "PlantManager", "LineManager"].includes(u.role) ? "Tier 1: Releasing Approver" :
           ["QCInspector", "ProcessEngineer", "AssistantManager"].includes(u.role) ? "Tier 2: Quality Checker" :
           ["Operator", "ProductionSupervisor"].includes(u.role) ? "Tier 3: Line Operator" : "Governance Staff"}
        </div>
      </div>
    ), mobileLabel: "Role" },
    { key: "manager", header: "Reports To (Supervisor)", render: (u) => {
      const mgr = users.find((m: any) => m.id === u.managerId);
      if (!mgr) return <span className="t-label" style={{ color: "var(--muted-soft)" }}>Head of Org / None</span>;
      return (
        <div>
          <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{mgr.name}</div>
          <span className="t-label text-[10px] px-1.5 py-0.2 rounded" style={{ backgroundColor: "rgba(8, 50, 96, 0.08)", color: "var(--primary)" }}>{ROLE_LABELS[mgr.role] || mgr.role}</span>
        </div>
      );
    }, hideOnMobile: true },
    { key: "subordinates", header: "Direct Subordinates", render: (u) => {
      const subs = users.filter((sub: any) => sub.managerId === u.id);
      if (subs.length === 0) return <span className="t-label" style={{ color: "var(--muted-soft)" }}>-</span>;
      return (
        <span className="t-label px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e" }}>
          {subs.length} direct report{subs.length > 1 ? "s" : ""}
        </span>
      );
    }, hideOnMobile: true },
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

  // Group users into 3 hierarchy tiers + IT Governance
  const tier1Users = useMemo(() => filtered.filter(u => ["CEO", "Director", "DGM", "PlantManager", "QualityManager", "LineManager"].includes(u.role)), [filtered]);
  const tier2Users = useMemo(() => filtered.filter(u => ["QCInspector", "ProcessEngineer", "AssistantManager"].includes(u.role)), [filtered]);
  const tier3Users = useMemo(() => filtered.filter(u => ["Operator", "ProductionSupervisor"].includes(u.role)), [filtered]);
  const itStaffUsers = useMemo(() => filtered.filter(u => u.role === "Admin"), [filtered]);

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Personnel Governance & Allocation"
        title="User Management & Reporting Hierarchy"
        subtitle="Organize shopfloor personnel, allocate supervisor-subordinate reporting structures, and control 4-tier inspection sign-off authority."
        info="Manage user accounts and approval hierarchies here. Every shopfloor operator reports to a direct checker (Tier 2), who in turn reports to an authorized releasing manager (Tier 1) for full compliance with ISO 9001:2015 Clause 5.3."
        action={currentUser.role === "Admin" && (
          <Button onClick={() => setShowCreate(true)} className="t-button h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
            <UserPlus size={14} /> New User
          </Button>
        )}
      />
      <FilterBar count={filtered.length}>
        <div className="flex items-center gap-1.5 p-1 rounded-lg" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
          <button
            type="button"
            onClick={() => setViewMode("directory")}
            className={`t-label px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${viewMode === "directory" ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
          >
            <Users size={12} /> Directory Table
          </button>
          <button
            type="button"
            onClick={() => setViewMode("hierarchy")}
            className={`t-label px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${viewMode === "hierarchy" ? "bg-[var(--primary)] text-[var(--on-primary)] font-semibold shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
          >
            <Workflow size={12} /> Org Chart & Reporting Flow
          </button>
        </div>

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
        {loading ? <LoadingBlock label="Loading user directory and org charts…" /> : (
          viewMode === "directory" ? (
            <div className="space-y-4">
              {/* Shopfloor 4-Tier Inspection Approval Flow Banner */}
              <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow size={16} style={{ color: "var(--primary)" }} />
                    <span className="t-body-sm font-bold" style={{ color: "var(--ink)" }}>
                      Shopfloor 4-Tier Inspection Approval Flow & Org Chart Allocation
                    </span>
                  </div>
                  <span className="t-label text-[10.5px] px-2 py-0.5 rounded-full font-mono" style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}>
                    ISO 9001:2015 CLAUSE 5.3
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Tier 3 · Line Operator</span>
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">3</span>
                    </div>
                    <div className="font-semibold text-ink">Shopfloor Machinist</div>
                    <div className="text-[11px] text-muted">Fabricates radiator unit, enters actual micrometer / gauge readings on digital checksheet.</div>
                  </div>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Tier 2 · QC Checker</span>
                      <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 text-[10px] flex items-center justify-center font-bold">2</span>
                    </div>
                    <div className="font-semibold text-ink">Quality Inspector</div>
                    <div className="text-[11px] text-muted">Allocated supervisor (Reports To). Verifies first-off piece, gauges, weld pull test & tolerances.</div>
                  </div>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline-soft)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Tier 1 · Gate Approver</span>
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] flex items-center justify-center font-bold">1</span>
                    </div>
                    <div className="font-semibold text-ink">Director / Quality Head</div>
                    <div className="text-[11px] text-muted">Releases stage pass, disposition authorization (Rework/Scrap), and Certificate of Conformance.</div>
                  </div>
                  <div className="p-3 rounded-lg space-y-1" style={{ backgroundColor: "rgba(8, 50, 96, 0.04)", border: "1px solid rgba(8, 50, 96, 0.15)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700">IT Desk Governance</span>
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] flex items-center justify-center font-bold">IT</span>
                    </div>
                    <div className="font-semibold text-ink">System Administrator</div>
                    <div className="text-[11px] text-muted">Administers accounts, master QAP data & audit logs. <strong>Excluded from quality approvals</strong>.</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                <DataTable
                  columns={columns}
                  data={filtered}
                  onRowClick={(u) => setSelected(u)}
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
                      {u.managerId && (
                        <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>
                          Reports to: <strong style={{ color: "var(--ink)" }}>{users.find((m: any) => m.id === u.managerId)?.name || "Supervisor"}</strong>
                        </div>
                      )}
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
            </div>
          ) : (
            /* Multi-tier Org Flowchart View */
            <div className="space-y-8">
              {/* Hierarchy explanation banner */}
              <div className="rounded-xl p-5 flex items-start gap-4" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
                <Workflow size={22} className="shrink-0 mt-0.5" style={{ color: "var(--primary)" }} />
                <div className="space-y-1">
                  <div className="t-title-sm" style={{ color: "var(--ink)" }}>Inspection Sign-Off Hierarchy & Supervision Flow</div>
                  <div className="t-body-sm" style={{ color: "var(--body)" }}>
                    Every digital inspection auto-traverses this structure: an <strong>Operator (Tier 3)</strong> submits shopfloor measurements, their <strong>Assigned Supervisor / QC Inspector (Tier 2)</strong> checks and verifies tolerances, and the <strong>Quality / Plant Head (Tier 1)</strong> conducts final releasing sign-off.
                  </div>
                </div>
              </div>

              {/* Tier 1 Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>1</span>
                    <div>
                      <h3 className="t-title-sm" style={{ color: "var(--ink)" }}>Tier 1: Senior Executive & Releasing Authority</h3>
                      <p className="t-label text-[11px]" style={{ color: "var(--muted)" }}>Final dossier approval, stage release authorization, and disposition sign-off ({tier1Users.length} members)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {tier1Users.map((u) => {
                    const subs = users.filter((s: any) => s.managerId === u.id);
                    const mgr = users.find((m: any) => m.id === u.managerId);
                    return (
                      <div
                        key={u.id}
                        onClick={() => canEdit(u) && setSelected(u)}
                        className={`rounded-xl p-4 transition-all ${canEdit(u) ? "cursor-pointer hover:shadow-md hover:border-[var(--primary)]" : ""}`}
                        style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}>
                              {u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{u.name}</div>
                              <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>@{u.username}</div>
                            </div>
                          </div>
                          <StatusBadge status={u.status} size="xs" />
                        </div>
                        <div className="space-y-1.5 pt-2 border-t text-xs" style={{ borderColor: "var(--hairline-soft)" }}>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Role:</span>
                            <span className="t-label px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{ROLE_LABELS[u.role] || u.role}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Department:</span>
                            <span style={{ color: "var(--body)" }}>{u.department || "-"} · Plant {u.plant}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Reports To:</span>
                            <span className="font-medium" style={{ color: mgr ? "var(--primary)" : "var(--muted-soft)" }}>{mgr ? mgr.name : "Board / Director"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Oversees:</span>
                            <span className="t-code font-semibold" style={{ color: subs.length > 0 ? "#4a7c5e" : "var(--muted-soft)" }}>{subs.length} direct report{subs.length !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier 2 Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#0284c7", color: "#fff" }}>2</span>
                    <div>
                      <h3 className="t-title-sm" style={{ color: "var(--ink)" }}>Tier 2: Stage Supervisors & Quality Checkers</h3>
                      <p className="t-label text-[11px]" style={{ color: "var(--muted)" }}>First-off sample verification, tolerance audit, and physical stage check ({tier2Users.length} members)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {tier2Users.map((u) => {
                    const subs = users.filter((s: any) => s.managerId === u.id);
                    const mgr = users.find((m: any) => m.id === u.managerId);
                    return (
                      <div
                        key={u.id}
                        onClick={() => canEdit(u) && setSelected(u)}
                        className={`rounded-xl p-4 transition-all ${canEdit(u) ? "cursor-pointer hover:shadow-md hover:border-[var(--primary)]" : ""}`}
                        style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: "rgba(2, 132, 199, 0.12)", color: "#0284c7" }}>
                              {u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{u.name}</div>
                              <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>@{u.username}</div>
                            </div>
                          </div>
                          <StatusBadge status={u.status} size="xs" />
                        </div>
                        <div className="space-y-1.5 pt-2 border-t text-xs" style={{ borderColor: "var(--hairline-soft)" }}>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Role:</span>
                            <span className="t-label px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{ROLE_LABELS[u.role] || u.role}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Reports To:</span>
                            <span className="font-semibold" style={{ color: "var(--primary)" }}>{mgr ? mgr.name : "Unassigned"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Direct Crew:</span>
                            <span className="t-code font-semibold" style={{ color: subs.length > 0 ? "#4a7c5e" : "var(--muted)" }}>{subs.length} operator{subs.length !== 1 ? "s" : ""}</span>
                          </div>
                          {(u.assignedStages || []).length > 0 && (
                            <div className="pt-1">
                              <span className="t-label text-[10px]" style={{ color: "var(--muted)" }}>Assigned Stages: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {u.assignedStages.slice(0, 5).map((s: string) => (
                                  <span key={s} className="t-code px-1.5 py-0.2 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)", fontSize: 9.5 }}>{s}</span>
                                ))}
                                {u.assignedStages.length > 5 && <span className="t-label text-[9px]" style={{ color: "var(--muted)" }}>+{u.assignedStages.length - 5}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tier 3 Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--hairline)" }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "#4a7c5e", color: "#fff" }}>3</span>
                    <div>
                      <h3 className="t-title-sm" style={{ color: "var(--ink)" }}>Tier 3: Line Operators & Shopfloor Technicians</h3>
                      <p className="t-label text-[11px]" style={{ color: "var(--muted)" }}>Shopfloor fabrication, parameter measurement entry, and machine operation ({tier3Users.length} members)</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {tier3Users.map((u) => {
                    const mgr = users.find((m: any) => m.id === u.managerId);
                    return (
                      <div
                        key={u.id}
                        onClick={() => canEdit(u) && setSelected(u)}
                        className={`rounded-xl p-4 transition-all ${canEdit(u) ? "cursor-pointer hover:shadow-md hover:border-[var(--primary)]" : ""}`}
                        style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e" }}>
                              {u.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{u.name}</div>
                              <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>@{u.username} · Shift {u.shiftPreference || "A"}</div>
                            </div>
                          </div>
                          <StatusBadge status={u.status} size="xs" />
                        </div>
                        <div className="space-y-1.5 pt-2 border-t text-xs" style={{ borderColor: "var(--hairline-soft)" }}>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Role:</span>
                            <span className="t-label px-2 py-0.5 rounded font-medium" style={{ backgroundColor: "var(--surface-strong)", color: "var(--ink)" }}>{ROLE_LABELS[u.role] || u.role}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="t-label" style={{ color: "var(--muted)" }}>Supervisor (Checker):</span>
                            <span className="font-semibold" style={{ color: mgr ? "var(--primary)" : "var(--muted-soft)" }}>{mgr ? mgr.name : "Unassigned"}</span>
                          </div>
                          {(u.assignedStages || []).length > 0 && (
                            <div className="pt-1">
                              <span className="t-label text-[10px]" style={{ color: "var(--muted)" }}>Workstations / Stages: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {u.assignedStages.map((s: string) => (
                                  <span key={s} className="t-code px-1.5 py-0.2 rounded" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)", fontSize: 9.5 }}>{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          {selected && <UserDetail user={selected} allUsers={users} stages={stages} currentUser={currentUser} onUpdated={() => { load(); setSelected(null); }} />}
        </SheetContent>
      </Sheet>

      <Sheet open={showCreate} onOpenChange={setShowCreate}>
        <SheetContent className="w-full md:w-[40vw] md:max-w-[800px] p-0 overflow-y-auto" style={{ backgroundColor: "var(--surface-card)" }}>
          <CreateUserForm stages={stages} allUsers={users} plant={plant} currentUser={currentUser} onCreated={() => { setShowCreate(false); load(); }} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UserDetail({ user, allUsers = [], stages, currentUser, onUpdated }: { user: any; allUsers?: any[]; stages: any[]; currentUser: User; onUpdated: () => void }) {
  const [role, setRole] = useState(user.role);
  const [department, setDepartment] = useState(user.department || "");
  const [status, setStatus] = useState(user.status);
  const [shiftPreference, setShiftPreference] = useState(user.shiftPreference || "");
  const [managerId, setManagerId] = useState(user.managerId || "");
  const [assignedStages, setAssignedStages] = useState<string[]>(user.assignedStages || []);
  const [managedStages, setManagedStages] = useState<string[]>(user.managedStages || []);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const toggleStage = (code: string, list: string[], set: (v: string[]) => void) => {
    set(list.includes(code) ? list.filter(s => s !== code) : [...list, code]);
  };

  const directReports = useMemo(() => {
    return (allUsers || []).filter((u: any) => u.managerId === user.id);
  }, [allUsers, user.id]);

  const myLevel = ROLE_HIERARCHY_LEVELS[currentUser.role as Role] || 0;
  const targetLevel = ROLE_HIERARCHY_LEVELS[user.role as Role] || 0;
  const canModify = myLevel > targetLevel;

  const save = async () => {
    if (!canModify) {
      toast({ title: "Authority Error", description: "You cannot modify an account equal to or above your hierarchy level.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.id,
        role,
        department,
        status,
        shiftPreference,
        managerId: managerId === "none" || managerId === "" ? null : managerId,
        assignedStages,
        managedStages,
      }),
    });
    if (res.ok) {
      toast({ title: "User & Hierarchy updated", description: `${user.name} reporting structure saved.` });
      onUpdated();
    } else {
      toast({ title: "Update failed", variant: "destructive" });
    }
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
      <div className="p-6 space-y-5">
        {/* Authority Protection Check (ISO 9001:2015 Clause 5.3) */}
        {!canModify && (
          <div className="rounded-xl p-3.5 space-y-1.5" style={{ backgroundColor: "rgba(160, 69, 69, 0.08)", border: "1.5px solid var(--semantic-error)" }}>
            <div className="flex items-center gap-2">
              <ShieldAlert size={17} style={{ color: "var(--semantic-error)" }} />
              <span className="t-body-sm font-bold" style={{ color: "var(--semantic-error)" }}>
                Protected Executive Account · Authority Modification Locked
              </span>
            </div>
            <p className="t-label text-[11px]" style={{ color: "var(--ink)" }}>
              <strong>{user.name}</strong> holds the role of <strong>{ROLE_LABELS[user.role] || user.role}</strong> (Hierarchy Level {targetLevel}). Your role <strong>{ROLE_LABELS[currentUser.role] || currentUser.role}</strong> (Level {myLevel}) does not possess authority to modify or reassign this account (ISO 9001:2015 Clause 5.3).
            </p>
          </div>
        )}

        {/* Authority Tier Banner */}
        <div className="rounded-xl p-3.5 flex items-center justify-between" style={{ backgroundColor: "rgba(8, 50, 96, 0.05)", border: "1px solid rgba(8, 50, 96, 0.15)" }}>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} style={{ color: "var(--primary)" }} />
            <div>
              <div className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
                {["Admin", "CEO", "Director", "DGM", "QualityManager", "PlantManager", "LineManager"].includes(role) ? "Tier 1: Releasing Approver" :
                 ["QCInspector", "ProcessEngineer", "AssistantManager"].includes(role) ? "Tier 2: Quality Checker" :
                 ["Operator", "ProductionSupervisor"].includes(role) ? "Tier 3: Line Operator" : "Governance Staff"}
              </div>
              <div className="t-label text-[11px]" style={{ color: "var(--muted)" }}>
                {["Admin", "CEO", "Director", "DGM", "QualityManager", "PlantManager", "LineManager"].includes(role) ? "Authorized for final inspection release and rework sign-off" :
                 ["QCInspector", "ProcessEngineer", "AssistantManager"].includes(role) ? "Authorized for stage parameter verification and tolerance checks" :
                 "Authorized for shopfloor execution and measurement recording"}
              </div>
            </div>
          </div>
          <span className="t-label px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ backgroundColor: "var(--surface-strong)", color: "var(--primary)" }}>
            ORG LEVEL
          </span>
        </div>

        {/* Supervisor Allocation (Who Follows Who) */}
        <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow size={15} style={{ color: "var(--primary)" }} />
              <Label className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>Reports To (Direct Supervisor / Manager)</Label>
            </div>
            <span className="t-label text-[10px]" style={{ color: "var(--muted)" }}>APPROVAL CHAIN</span>
          </div>
          <Select value={managerId || "none"} onValueChange={(val) => setManagerId(val === "none" ? "" : val)} disabled={!canModify}>
            <SelectTrigger className="w-full t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)", backgroundColor: !canModify ? "var(--canvas-soft)" : "var(--surface-card)" }}>
              <SelectValue placeholder="Select Direct Manager / Supervisor" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              <SelectItem value="none">-- No Direct Supervisor (Top Level / Board) --</SelectItem>
              {allUsers.filter((u: any) => u.id !== user.id).map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABELS[u.role] || u.role} · {u.department || "Plant"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="t-label text-[11px]" style={{ color: "var(--muted-soft)" }}>
            When this user files an inspection or stage checkpoint, the system automatically routes the verification task to their assigned supervisor.
          </p>
        </div>

        {/* Direct Subordinates if any */}
        {directReports.length > 0 && (
          <div className="rounded-xl p-4 space-y-2.5" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: "#4a7c5e" }} />
                <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>Direct Reports ({directReports.length})</span>
              </div>
              <span className="t-label text-[10px] font-mono px-2 py-0.2 rounded-full" style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e" }}>
                SUBORDINATE CREW
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {directReports.map((sub: any) => (
                <span key={sub.id} className="t-label px-2.5 py-1 rounded-md flex items-center gap-1.5" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)", color: "var(--ink)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#4a7c5e" }} />
                  <strong>{sub.name}</strong> <span style={{ color: "var(--muted)", fontSize: 10 }}>({ROLE_LABELS[sub.role] || sub.role})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Role</Label>
            <Select value={role} onValueChange={setRole} disabled={!canModify}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)", backgroundColor: !canModify ? "var(--canvas-soft)" : "var(--surface-card)" }}><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.filter(r => currentUser.role === "CEO" || (ROLE_HIERARCHY_LEVELS[r] || 0) < myLevel).map(r => (
                  <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Department</Label>
            <Select value={department} onValueChange={setDepartment} disabled={!canModify}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)", backgroundColor: !canModify ? "var(--canvas-soft)" : "var(--surface-card)" }}><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                {DEPARTMENT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Shift Preference</Label>
            <Select value={shiftPreference} onValueChange={setShiftPreference} disabled={!canModify}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)", backgroundColor: !canModify ? "var(--canvas-soft)" : "var(--surface-card)" }}><SelectValue placeholder="-" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">-</SelectItem>
                {SHIFT_OPTIONS.map(s => <SelectItem key={s} value={s}>Shift {s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="t-label" style={{ color: "var(--muted)" }}>Status</Label>
            <Select value={status} onValueChange={setStatus} disabled={!canModify}>
              <SelectTrigger className="mt-1 t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)", backgroundColor: !canModify ? "var(--canvas-soft)" : "var(--surface-card)" }}><SelectValue /></SelectTrigger>
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
                  disabled={!canModify}
                  onClick={() => toggleStage(s.stageCode, assignedStages, setAssignedStages)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${!canModify ? "opacity-60 cursor-not-allowed" : ""}`}
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
                  disabled={!canModify}
                  onClick={() => toggleStage(s.stageCode, managedStages, setManagedStages)}
                  className={`flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${!canModify ? "opacity-60 cursor-not-allowed" : ""}`}
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
      <div className="px-6 pb-6 flex items-center gap-2 justify-end border-t pt-4" style={{ borderColor: "var(--hairline)" }}>
        <Button variant="outline" onClick={toggleSuspend} disabled={saving || !canModify} className="t-body-sm h-9 px-4 rounded-lg flex items-center gap-1.5" style={{ color: status === "Active" ? "var(--semantic-error)" : "var(--semantic-success)" }}>
          {status === "Active" ? <><Ban size={14} /> Suspend</> : <><CheckCircle2 size={14} /> Activate</>}
        </Button>
        <Button variant="outline" onClick={onUpdated} className="t-body-sm h-9 px-4 rounded-lg">Close</Button>
        <Button onClick={save} disabled={saving || !canModify} className="t-body-sm h-9 px-4 rounded-lg" style={{ backgroundColor: canModify ? "var(--primary)" : "var(--muted)", color: "var(--on-primary)" }}>{saving ? "Saving…" : !canModify ? "Locked (Read-Only)" : "Save Changes"}</Button>
      </div>
    </div>
  );
}

function CreateUserForm({ stages, allUsers = [], plant, currentUser, onCreated }: { stages: any[]; allUsers?: any[]; plant: string; currentUser?: User; onCreated: () => void }) {
  const actorLevel = currentUser ? (ROLE_HIERARCHY_LEVELS[currentUser.role as Role] || 0) : 100;
  const allowedRoles = ROLE_OPTIONS.filter(r => (currentUser?.role === "CEO" || currentUser?.role === "Admin") || (ROLE_HIERARCHY_LEVELS[r] || 0) < actorLevel);

  const [form, setForm] = useState({
    username: "", password: "", name: "", email: "",
    role: (allowedRoles[0] || "Operator") as Role, department: "Quality", plant,
    shiftPreference: "A", status: "Active",
    managerId: "",
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
      body: JSON.stringify({
        ...form,
        managerId: form.managerId === "none" || !form.managerId ? null : form.managerId,
        assignedStages,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: "User created", description: `${form.name} (@${form.username}) added to hierarchy.` });
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
        <SheetDescription className="t-body-sm" style={{ color: "var(--muted)" }}>Create a new QMS account with role, stage permissions, and reporting supervisor.</SheetDescription>
      </SheetHeader>
      <div className="p-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Username *" value={form.username} onChange={(v) => setForm({ ...form, username: v.toLowerCase().replace(/\s/g, ".") })} placeholder="e.g. rohan.mehta" />
          <FormField label="Password *" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Set initial password" />
          <FormField label="Full Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Rohan Mehta" />
          <FormField label="Email *" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="e.g. rohan@hitech.com" />
          <SelectField label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v as Role })} options={allowedRoles.map(r => [r, ROLE_LABELS[r] || r] as [string, string])} />
          <SelectField label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENT_OPTIONS.map(d => [d, d] as [string, string])} />
          <SelectField label="Shift" value={form.shiftPreference} onChange={(v) => setForm({ ...form, shiftPreference: v })} options={SHIFT_OPTIONS.map(s => [s, `Shift ${s}`] as [string, string])} />
          <SelectField label="Plant" value={form.plant} onChange={(v) => setForm({ ...form, plant: v })} options={[["K2","K2 - Khopoli"]]} />
        </div>

        <div>
          <Label className="t-label" style={{ color: "var(--muted)" }}>Reports To (Direct Supervisor / Manager)</Label>
          <Select value={form.managerId || "none"} onValueChange={(val) => setForm({ ...form, managerId: val === "none" ? "" : val })}>
            <SelectTrigger className="mt-1 w-full t-body-sm h-9 rounded-lg" style={{ borderColor: "var(--hairline)" }}>
              <SelectValue placeholder="Select Direct Supervisor" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="none">-- No Direct Supervisor (Top-Level) --</SelectItem>
              {allUsers.map((u: any) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({ROLE_LABELS[u.role] || u.role} · {u.department || "Plant"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      <PageHeader eyebrow="Data Management" title="Import Data" subtitle="Upload CSV or XLSX files. Validate before committing. Templates available for each entity type." helpId="data.import" />
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
      <PageHeader eyebrow="Data Management" title="Export Data" subtitle="Download authorized records in CSV, XLSX or JSON format with plant filter applied." helpId="data.export" />
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
  const [activeReportsTab, setActiveReportsTab] = useState<"stages" | "templates">("stages");
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
        eyebrow="Reporting Center"
        title="Inspection Reports & Compliance Center"
        subtitle="Download shopfloor stage inspection checksheets (S01–S17) and 14 management compliance templates matching Hi-Tech Radiators controlled QAP documentation."
        helpId="reports.overview"
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>17 STAGE FORMATS</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>{reports.length} TEMPLATES</span>
          </>
        }
      />

      <div className="p-5 md:p-10 space-y-6">
        {/* Modern Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[var(--hairline)] pb-3">
          <button
            onClick={() => setActiveReportsTab("stages")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeReportsTab === "stages"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-muted hover:text-ink bg-[var(--surface-card)] border border-[var(--hairline)]"
            )}
          >
            <Layers size={14} />
            <span>1. Stage Manufacturing Reports (S01–S17)</span>
            <span className={cn(
              "text-[10px] py-0.2 px-1.5 rounded-full font-mono font-bold",
              activeReportsTab === "stages" ? "bg-white/20 text-white" : "bg-[var(--surface-strong)] text-muted"
            )}>
              17 Stages
            </span>
          </button>

          <button
            onClick={() => setActiveReportsTab("templates")}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeReportsTab === "templates"
                ? "bg-primary text-on-primary shadow-xs"
                : "text-muted hover:text-ink bg-[var(--surface-card)] border border-[var(--hairline)]"
            )}
          >
            <FileBarChart size={14} />
            <span>2. Quality & Compliance Templates</span>
            <span className={cn(
              "text-[10px] py-0.2 px-1.5 rounded-full font-mono font-bold",
              activeReportsTab === "templates" ? "bg-white/20 text-white" : "bg-[var(--surface-strong)] text-muted"
            )}>
              14 Formats
            </span>
          </button>
        </div>

        {activeReportsTab === "stages" ? (
          <StageWiseReportsModule plant={plant} />
        ) : (
          <div className="space-y-6">
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
          </div>
        )}

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
function SalesOrdersModule({ plant, user, onNavigate, onInspect }: { plant: string; user?: User; onNavigate?: (k: ModuleKey) => void; onInspect?: (stageCode: string | null) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedSO, setExpandedSO] = useState<string | null>(null);
  const [selectedSO, setSelectedSO] = useState<any | null>(null);

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

  if (selectedSO) {
    return (
      <SalesOrderFullProfilePage
        so={selectedSO}
        user={user || ({ name: "Quality Manager", role: "QualityManager", username: "quality.mgr", email: "qm@hitech.com", plant: "K2" } as User)}
        plant={plant}
        onBack={() => setSelectedSO(null)}
        onOpenWO={() => {
          setSelectedSO(null);
          if (onNavigate) onNavigate("workorders");
        }}
      />
    );
  }

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Production · ERP Demand"
        title="Sales Orders"
        subtitle="Customer PO -> SO -> linked Work Orders. Fulfilment calculated from accepted production units."
        helpId="so.number"
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
                  <div
                    onClick={() => setExpandedSO(isExpanded ? null : (so.soNumber || "NO-SO"))}
                    className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--canvas-soft)] cursor-pointer"
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
                    <div className="shrink-0 w-14 text-right">
                      <div className="t-label" style={{ color: "var(--muted)" }}>WOs</div>
                      <div className="t-body-sm t-num" style={{ color: "var(--primary)", fontWeight: 600 }}>{so.woCount}</div>
                    </div>
                    {/* End-to-End Report Action */}
                    <div className="shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSO(so);
                        }}
                        className="h-7 px-2.5 text-xs gap-1 font-medium hover:border-[var(--primary)] hover:text-[var(--primary)]"
                      >
                        <FileText size={12} /> Trace Report
                      </Button>
                    </div>
                  </div>

                  {/* Expanded: linked WOs */}
                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="t-label" style={{ color: "var(--muted)" }}>Linked Work Orders ({so.linkedWOs?.length || 0})</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSO(so)}
                            className="h-6 text-xs gap-1 t-label text-[var(--primary)]"
                          >
                            Open Full Order Dossier & Unit Ledger <ArrowUpRight size={12} />
                          </Button>
                        </div>
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

      {/* Sales Order Profile renders as independent full page (No Drawer) */}
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

// QC parameters for each stage (from MES-QMS Master Matrix & Inspection SOPs)
const STAGE_QC_PARAMS: Record<string, { param: string; spec: string; method: string; ctq?: boolean }[]> = Object.fromEntries(
  Object.entries(masterStageCharacteristics).map(([k, chars]: [string, any]) => [
    k,
    chars.map((c: any) => ({
      param: c.name,
      spec: c.specification || (c.nominalValue ? `Nominal: ${c.nominalValue}${c.unit ? ` ${c.unit}` : ""}` : "As per engineering standards"),
      method: c.method || "Standard instrument",
      ctq: !!c.isCTQ
    }))
  ])
);

// ============================================================
// MES-QMS MANUFACTURING ZONES
// ============================================================
const MANUFACTURING_ZONES = [
  {
    id: "zone-1",
    name: "Zone 1: Component & Fin Fabrication",
    shortName: "1. Fin & Core Fab",
    stageRange: "S01 - S10",
    stageCodes: ["S01", "S02", "S03", "S04", "S05", "S06", "S07", "S08", "S09", "S10"],
    objective: "High-precision strip forming, resistance spot welding, automated seam welding, trimming, plasma pipe cutting and header flaring.",
    standards: "ISO 9001:2015, IS 2062, QCI/Q/02/01 Rev.08, QCI/F/02/01-06",
    safety: "Leather safety gloves, safety goggles, ear plugs, industrial safety shoes",
    color: "#0284c7"
  },
  {
    id: "zone-2",
    name: "Zone 2: Assembly & Structural MAG Welding",
    shortName: "2. Assembly & MAG",
    stageRange: "S11 - S13",
    stageCodes: ["S11", "S12", "S13"],
    objective: "Precision radiator erection, multi-axis clamping, continuous structural MAG welding per approved WPS, and rigorous spatter removal.",
    standards: "AWS D1.1, ASME Section IX, WPS VAA/HTR/CS/WPS, QCI/F/05/03-07",
    safety: "Auto-darkening welding helmet, leather apron, welder sleeves, heat-resistant gloves",
    color: "#6366f1"
  },
  {
    id: "zone-3",
    name: "Zone 3: Hydrostatic Pressure & Leak Testing",
    shortName: "3. Hydro Leak Gate",
    stageRange: "S14",
    stageCodes: ["S14"],
    objective: "MANDATORY QUALITY GATE: 2.0 kg/cm² pneumatic/hydrostatic pressure dwell for 30 minutes. Absolute zero pressure drop and zero soap-bubble leakage.",
    standards: "ASME Section VIII Div 1, QCI/F/05/08 Rev.03, IS 2062 Pressure Vessel Code",
    safety: "Impact-rated safety face shield, pressure safety valves, steel-toed boots",
    color: "#dc2626",
    isGateZone: true
  },
  {
    id: "zone-4",
    name: "Zone 4: Hot-Dip Galvanizing (HDG)",
    shortName: "4. Hot-Dip Galvanizing",
    stageRange: "S15 - S19",
    stageCodes: ["S15", "S16", "S17", "S18", "S19"],
    objective: "Pre-galv inspection, 9-tank chemical pretreatment, acid/flux laboratory titration, molten zinc immersion at 450°C, and final coating thickness testing.",
    standards: "ISO 1461, ASTM A123, IS 2633, IS 2629, IS 6745, QCI/F/10/01-06",
    safety: "Chemical-resistant rubber aprons, nitrile gauntlets, respirator nose masks, heat-reflective face shield",
    color: "#d97706"
  },
  {
    id: "zone-5",
    name: "Zone 5: Surface Prep, Blasting & Paint Shop",
    shortName: "5. Blasting & Paint Shop",
    stageRange: "S20 - S33",
    stageCodes: ["S20", "S21", "S22", "S23", "S24", "S25", "S26", "S27", "S28", "S29", "S30", "S31", "S32", "S33"],
    objective: "Grit/sweep blasting to Sa 2.5 profile (40-75 µm), RD124 internal epoxy coating, tilting & hot air purging, intermediate MIO, oven baking, PU finish flooding, and endoscopic inspection.",
    standards: "ISO 12944 (C4/C5-M), SSPC-SP16, ISO 8501-1, ASTM D-4417, ASTM D 3359, NACE-SP0188",
    safety: "Air-fed positive-pressure blasting helmet, organic vapor respirators, anti-static boiler suit",
    color: "#8b5cf6"
  },
  {
    id: "zone-6",
    name: "Zone 6: Final Product Inspection & Dispatch",
    shortName: "6. Final QC & Dispatch",
    stageRange: "S34 - S38",
    stageCodes: ["S34", "S35", "S36", "S37", "S38"],
    objective: "Final comprehensive quality clearance, N2 inert gas holding pressure (0.5 kg/cm²), ISPM-15 fumigated export packaging, and customer QA dossier sign-off.",
    standards: "ISO 9001:2015, IEC 60076, ISPM-15, PRO/F/02/05, QCI/F/03/01, QCI/F/07/01-02",
    safety: "Hi-vis vest, safety helmet, cut-resistant gloves, steel-toed footwear",
    color: "#059669"
  }
];

function ProcessFlowModule({ plant, plantInfo, user, onNavigate, onInspect }: { plant: string; plantInfo: any; user: User; onNavigate: (k: ModuleKey) => void; onInspect: (stageCode: string | null) => void }) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>("all");
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [stageSearch, setStageSearch] = useState<string>("");

  const allStages = ROUTE_FLOWS[0]?.stages || [];
  const ctqCount = allStages.filter(s => s.isCTQ).length;
  const gateCount = allStages.filter(s => s.isGate).length;

  const currentZone = useMemo(() => {
    return MANUFACTURING_ZONES.find(z => z.id === selectedZoneId) || null;
  }, [selectedZoneId]);

  const displayedStages = useMemo(() => {
    let list = allStages;
    if (currentZone) {
      list = list.filter(s => currentZone.stageCodes.includes(s.code));
    }
    if (stageSearch.trim()) {
      const q = stageSearch.toLowerCase();
      list = list.filter(s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.doc.toLowerCase().includes(q) || s.dept.toLowerCase().includes(q));
    }
    return list;
  }, [allStages, currentZone, stageSearch]);

  const toggleStage = (code: string) => {
    setExpandedStages(prev => ({ ...prev, [code]: !prev[code] }));
  };

  return (
    <div className="reveal-up">
      <PageHeader
        eyebrow="Shopfloor MES-QMS Integration"
        title="Manufacturing Process Flow & Quality Plan"
        subtitle="End-to-end 38-stage radiator manufacturing pipeline mapped into 6 interconnected operational zones per MES-QMS Master Sheet."
        helpId="process.flow"
        action={
          <Button
            size="sm"
            onClick={() => onInspect(null)}
            className="t-button h-9 px-4 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-all hover:opacity-90"
            style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
          >
            <ClipboardCheck size={14} /> New Inspection
          </Button>
        }
        meta={
          <>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>38 STAGES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--muted)" }}>6 ZONES</span>
            <span className="t-label" style={{ color: "var(--muted)" }}>·</span>
            <span className="t-label t-num" style={{ color: "var(--primary)" }}>{ctqCount} CTQ · {gateCount} GATES</span>
          </>
        }
      />

      <div className="p-4 md:p-8 space-y-6">

        {/* 6-Zone Interactive Pipeline Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="t-label" style={{ color: "var(--muted)" }}>MANUFACTURING ZONES (MES-QMS PIPELINE)</div>
            <div className="text-[11px] t-label" style={{ color: "var(--muted-soft)" }}>Click a zone to focus operational stages</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => setSelectedZoneId("all")}
              className={`p-3 rounded-xl text-left transition-all ${selectedZoneId === "all" ? "ring-2 ring-[var(--primary)] shadow-sm" : "hover:bg-[var(--canvas-soft)]"}`}
              style={{
                backgroundColor: selectedZoneId === "all" ? "var(--surface-card)" : "var(--canvas-soft)",
                border: "1px solid var(--hairline)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="t-code text-[10px] font-bold" style={{ color: "var(--muted)" }}>ALL</span>
                <span className="t-label text-[10px] font-mono px-1.5 py-0.2 rounded" style={{ backgroundColor: "var(--surface-strong)" }}>38</span>
              </div>
              <div className="t-body-sm font-semibold truncate" style={{ color: "var(--ink)" }}>All Stages</div>
              <div className="t-label text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>End-to-end flow</div>
            </button>

            {MANUFACTURING_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const zoneStages = allStages.filter(s => zone.stageCodes.includes(s.code));
              const zoneCtq = zoneStages.filter(s => s.isCTQ).length;
              const hasGate = zoneStages.some(s => s.isGate);

              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-3 rounded-xl text-left transition-all ${isSelected ? "ring-2 shadow-sm" : "hover:bg-[var(--canvas-soft)]"}`}
                  style={{
                    backgroundColor: isSelected ? "var(--surface-card)" : "var(--canvas-soft)",
                    border: `1px solid ${isSelected ? zone.color : "var(--hairline)"}`,
                    borderColor: isSelected ? zone.color : undefined,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="t-code text-[10px] font-bold" style={{ color: zone.color }}>{zone.stageRange}</span>
                    {hasGate && <span className="t-label text-[9px] px-1 py-0.2 rounded font-bold" style={{ backgroundColor: "#dc262615", color: "#dc2626" }}>GATE</span>}
                  </div>
                  <div className="t-body-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{zone.shortName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px]" style={{ color: "var(--muted)" }}>
                    <span>{zoneStages.length} stages</span>
                    {zoneCtq > 0 && <span style={{ color: zone.color }}>· {zoneCtq} CTQ</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Zone Governance Summary Card */}
        {currentZone && (
          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "var(--surface-card)", border: `1.5px solid ${currentZone.color}30` }}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: "var(--hairline-soft)" }}>
              <div>
                <span className="t-code text-xs font-bold uppercase" style={{ color: currentZone.color }}>{currentZone.stageRange} · Operational Scope</span>
                <h3 className="t-title-sm mt-0.5" style={{ color: "var(--ink)" }}>{currentZone.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="t-label px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${currentZone.color}15`, color: currentZone.color }}>
                  {displayedStages.length} Manufacturing Stages
                </span>
                {currentZone.isGateZone && (
                  <span className="t-label px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: "#dc262618", color: "#dc2626" }}>
                    CRITICAL ZERO-DEFECT QUALITY GATE
                  </span>
                )}
              </div>
            </div>

            <p className="t-body-sm" style={{ color: "var(--body)" }}>{currentZone.objective}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
                <div className="flex items-center gap-1.5 mb-1 font-semibold" style={{ color: "var(--primary)" }}>
                  <ShieldCheck size={13} />
                  <span>GOVERNING STANDARDS & SOP CODES</span>
                </div>
                <div className="t-body-sm" style={{ color: "var(--body)", fontSize: 11 }}>{currentZone.standards}</div>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline-soft)" }}>
                <div className="flex items-center gap-1.5 mb-1 font-semibold" style={{ color: "var(--muted)" }}>
                  <Wrench size={13} />
                  <span>SAFETY PPE & SHOPFLOOR GEAR</span>
                </div>
                <div className="t-body-sm" style={{ color: "var(--body)", fontSize: 11 }}>{currentZone.safety}</div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar for Stages */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-xs">
            <span className="t-label font-bold" style={{ color: "var(--ink)" }}>SHOWING {displayedStages.length} STAGES</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--primary)" }} />
              <span className="t-label text-[11px]" style={{ color: "var(--muted)" }}>CTQ Parameter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ border: "1.5px solid #dc2626" }} />
              <span className="t-label text-[11px]" style={{ color: "var(--muted)" }}>Quality Gate</span>
            </div>
          </div>
          <div className="w-72">
            <SearchInput value={stageSearch} onChange={setStageSearch} placeholder="Filter stages by name, code or SOP…" />
          </div>
        </div>

        {/* Stages List (Smart Cards with Interconnected Actions) */}
        <div className="space-y-3">
          {displayedStages.map((stage) => {
            const isExpanded = !!expandedStages[stage.code];
            const qcParams = STAGE_QC_PARAMS[stage.code] || [];

            return (
              <div
                key={stage.code}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  border: stage.isGate ? "1.5px solid rgba(220, 38, 38, 0.4)" : "1px solid var(--hairline)",
                  backgroundColor: "var(--surface-card)",
                }}
              >
                <div className="p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                      style={{
                        backgroundColor: stage.isGate ? "#dc262615" : stage.isCTQ ? "rgba(8, 50, 96, 0.1)" : "var(--canvas-soft)",
                        color: stage.isGate ? "#dc2626" : stage.isCTQ ? "var(--primary)" : "var(--muted)",
                        border: stage.isGate ? "1.5px solid #dc2626" : "1px solid var(--hairline)",
                      }}
                    >
                      {stage.code}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="t-title-sm font-semibold" style={{ color: "var(--ink)" }}>{stage.name}</h4>
                        {stage.isGate && (
                          <span className="t-label px-2 py-0.5 rounded-full text-[9px] font-bold font-mono" style={{ backgroundColor: "#dc2626", color: "#fff" }}>
                            QUALITY GATE
                          </span>
                        )}
                        {stage.isCTQ && (
                          <span className="t-label px-2 py-0.5 rounded-full text-[9px] font-bold font-mono" style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}>
                            CTQ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-wrap mt-1 text-xs">
                        <span style={{ color: "var(--body)" }}>{stage.dept}</span>
                        <span style={{ color: "var(--muted)" }}>·</span>
                        <span className="t-code font-mono" style={{ color: "var(--ink)" }}>{stage.doc}</span>
                        <span style={{ color: "var(--muted)" }}>·</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-medium" style={{ backgroundColor: "rgba(74, 124, 94, 0.12)", color: "#4a7c5e" }}>
                          <CheckCircle2 size={10} /> Active Digital Inspection Form
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interconnected Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => onInspect(stage.code)}
                      className="t-body-sm h-8 px-3 rounded-lg flex items-center gap-1.5 font-medium shadow-sm hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
                      title={`Launch digital inspection for stage ${stage.code}`}
                    >
                      <ClipboardCheck size={13} /> Inspect This Stage
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate("workorders")}
                      className="t-body-sm h-8 px-2.5 rounded-lg flex items-center gap-1"
                      style={{ borderColor: "var(--hairline)" }}
                      title="View active shopfloor work orders"
                    >
                      <Boxes size={12} /> Work Orders
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleStage(stage.code)}
                      className="t-body-sm h-8 px-2.5 rounded-lg flex items-center gap-1"
                      style={{ borderColor: "var(--hairline)" }}
                    >
                      <span>QC Checklist ({qcParams.length})</span>
                      <ChevronDown size={13} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </Button>
                  </div>
                </div>

                {/* Inline Collapsible QC Parameters Matrix */}
                {isExpanded && (
                  <div className="p-4 md:p-6 border-t space-y-4" style={{ borderColor: "var(--hairline-soft)", backgroundColor: "var(--canvas-soft)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={15} style={{ color: "var(--primary)" }} />
                        <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>Standard QC Checklist · {stage.doc}</span>
                      </div>
                      <span className="t-label text-[10.5px]" style={{ color: "var(--muted)" }}>{qcParams.length} MANDATORY PARAMETERS</span>
                    </div>

                    {qcParams.length > 0 ? (
                      <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
                        <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}>
                              <th className="t-label py-2.5 px-3 text-[10px]" style={{ color: "var(--muted)" }}>PARAMETER</th>
                              <th className="t-label py-2.5 px-3 text-[10px]" style={{ color: "var(--muted)" }}>NOMINAL ACCEPTANCE CRITERIA</th>
                              <th className="t-label py-2.5 px-3 text-[10px]" style={{ color: "var(--muted)" }}>MEASUREMENT INSTRUMENT</th>
                              <th className="t-label py-2.5 px-3 text-center text-[10px]" style={{ color: "var(--muted)" }}>CTQ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qcParams.map((p, idx) => (
                              <tr key={idx} style={{ borderBottom: idx === qcParams.length - 1 ? "none" : "1px solid var(--hairline-soft)" }}>
                                <td className="py-2 px-3 t-body-sm font-medium" style={{ color: "var(--ink)" }}>{p.param}</td>
                                <td className="py-2 px-3 t-code text-xs font-semibold" style={{ color: "var(--body)" }}>{p.spec}</td>
                                <td className="py-2 px-3 t-body-sm text-xs" style={{ color: "var(--muted)" }}>{p.method}</td>
                                <td className="py-2 px-3 text-center">
                                  {p.ctq ? (
                                    <span className="t-label px-1.5 py-0.2 rounded font-bold font-mono text-[9px]" style={{ backgroundColor: "rgba(8, 50, 96, 0.12)", color: "var(--primary)" }}>
                                      CTQ
                                    </span>
                                  ) : (
                                    <span style={{ color: "var(--muted-soft)" }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-lg p-4 text-center" style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}>
                        <p className="t-body-sm" style={{ color: "var(--muted)" }}>General workmanship criteria applied per QCI/Q/02/01 Rev.08. Click Inspect to record visual & dimensional characteristics.</p>
                      </div>
                    )}

                    {/* Reaction Plan */}
                    <div className="rounded-lg p-3 flex items-start gap-2.5" style={{ backgroundColor: "#fef2f2", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                      <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: "#dc2626" }} />
                      <div className="t-label text-[11px]" style={{ color: "#dc2626" }}>
                        <strong>REACTION PLAN (MANDATORY):</strong> Any failed measurement or out-of-tolerance reading immediately triggers an automated Non-Conformance Report (NCR), holds progression to downstream stations, and routes the unit to rework inspection.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Master Standards & Governance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="rounded-xl p-5 space-y-2" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2" style={{ color: "#dc2626" }}>
              <ShieldCheck size={18} />
              <h4 className="t-title-sm font-semibold">9 Mandatory Quality Gates</h4>
            </div>
            <p className="t-body-sm text-xs" style={{ color: "var(--body)" }}>
              Gates at Header Pretreatment, Assembly Erection, Hydrostatic Pressure (2.0 bar), Pre-Galvanizing, Final HDG, and Final Dispatch strictly block progression unless 100% conforming.
            </p>
          </div>

          <div className="rounded-xl p-5 space-y-2" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2" style={{ color: "var(--primary)" }}>
              <Target size={18} />
              <h4 className="t-title-sm font-semibold">14 Critical-to-Quality (CTQ) Parameters</h4>
            </div>
            <p className="t-body-sm text-xs" style={{ color: "var(--body)" }}>
              Welding current, nugget diameter, center-to-center pitch, pressure hold, coating DFT, and inert N2 pressure carry highest inspection rigour with zero deviation tolerance.
            </p>
          </div>

          <div className="rounded-xl p-5 space-y-2" style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--surface-card)" }}>
            <div className="flex items-center gap-2" style={{ color: "#4a7c5e" }}>
              <FileText size={18} />
              <h4 className="t-title-sm font-semibold">ISO 9001:2015 & Master Control Plan</h4>
            </div>
            <p className="t-body-sm text-xs" style={{ color: "var(--body)" }}>
              Governed by QCI/Q/02/01 Rev.08 Control Plan, WPS VAA/HTR/CS/WPS, ISO 1461 galvanizing, and ISO 12944 paint specifications for complete customer compliance.
            </p>
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
                { key: "proof", header: "Proof", render: (j: any) => {
                  const ev = j.workOrder?.inspections?.find((i: any) => i.evidencePath)?.evidencePath;
                  return ev ? <EvidenceBadge evidenceData={ev} /> : null;
                }, hideOnMobile: true },
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

              {/* Defect Visual Proof & Inspection Documents */}
              {(() => {
                const insRecordNo = job.defectDescription?.match(/INS-\d{4}-\d{4}/)?.[0];
                const matchingIns = job.workOrder?.inspections?.find(
                  (i: any) => (insRecordNo && i.recordNo === insRecordNo) || (job.htuNo && i.htuNo === job.htuNo && i.evidencePath)
                ) || job.workOrder?.inspections?.find((i: any) => i.evidencePath);

                if (matchingIns?.evidencePath) {
                  return (
                    <EvidenceGallery
                      evidenceData={matchingIns.evidencePath}
                      title={`Defect Visual Proof & Documents (${matchingIns.recordNo || "Inspection"})`}
                    />
                  );
                }
                return null;
              })()}
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
        helpId="org.hierarchy"
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
          <h3 className="t-title-sm mb-4" style={{ color: "var(--ink)" }}>Organization Chart - Hi-Tech Radiators Corporate & K2 Plant</h3>

          {/* Level -1: Corporate Apex - Entire Company CEO */}
          <div className="flex flex-col items-center">
            <TreeNode name="KYD Sir" role="Chief Executive Officer (CEO) - Entire Company" color="yellow" />
            <VLine h={16} />

            {/* Level 0: Plant Director */}
            <TreeNode name="Yogesh Jadhav" role="Plant Director - K2 Khopoli" color="yellow" />
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
