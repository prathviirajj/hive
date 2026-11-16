/**
 * HIVE Help Content Registry
 *
 * Structured definitions for tooltips, contextual help, and tour guides.
 * Separated from UI rendering so content can be updated without touching
 * component code. Each definition includes a stable ID, title, concise
 * explanation, optional detailed explanation, business purpose, and
 * applicable roles.
 *
 * Content rules:
 * - Explain meaning before mechanics.
 * - Explain why the user should care (connect to manufacturing outcomes).
 * - Explain consequences of actions.
 * - Never invent calculations — document the actual data source.
 * - Separate facts from guidance.
 */

export interface HelpContent {
  id: string;
  title: string;
  short: string;           // concise explanation for micro tooltip
  detail?: string;         // optional deeper explanation
  why?: string;            // why it matters
  rule?: string;           // business rule or calculation
  states?: string[];       // valid states, if applicable
  roles?: string[];        // applicable roles (empty = all)
}

export interface TourDefinition {
  id: string;
  title: string;
  objective: string;
  duration: string;
  roles: string[];
  steps: TourStep[];
}

export interface TourStep {
  title: string;
  description: string;
  why?: string;
  selector?: string;       // data-tour attribute selector
  action?: string;         // expected user action
  expectedState?: string;  // what should happen
  warning?: string;        // common mistake
  rule?: string;           // business rule for this step
}

// ============================================================
// Tooltip / Help Content Definitions
// ============================================================

export const HELP_CONTENT: Record<string, HelpContent> = {
  // ── Navigation ──
  "nav.sidebar": {
    id: "nav.sidebar",
    title: "Navigation Sidebar",
    short: "Switch between modules. Items are filtered by your role.",
    detail: "The sidebar lists all modules you have access to. Click any item to navigate. Use COLLAPSE to free up screen space. Hidden modules (RCA, Intelligence, Governance, FMEA) are under construction and not shown to any role.",
    why: "Your role determines which modules appear. If a module is missing, you may lack the required permission.",
    roles: [],
  },
  "nav.search": {
    id: "nav.search",
    title: "Global Search",
    short: "Search across work orders, NCRs, inspections, and HTU numbers.",
    detail: "Results appear grouped by type as you type. Click any result to jump directly to that record.",
    why: "Avoids navigating through multiple menus to find a specific record.",
    roles: [],
  },
  "nav.plant-selector": {
    id: "nav.plant-selector",
    title: "Plant Selector",
    short: "Switch between manufacturing plants. K2 (Khopoli) is active.",
    detail: "Each plant has its own process routes, stages, and quality data. Other plants will be enabled as they come online.",
    why: "Production and quality data is plant-specific. Switching plants changes all visible records.",
    roles: [],
  },
  "nav.tour-guide": {
    id: "nav.tour-guide",
    title: "Tour Guide",
    short: "Restart the guided tour of the platform.",
    detail: "Click to launch an interactive walkthrough of key features. The tour covers navigation, dashboards, quality workflows, and rework management.",
    why: "Useful for training new colleagues or refreshing your memory on features.",
    roles: [],
  },
  "nav.theme-toggle": {
    id: "nav.theme-toggle",
    title: "Theme Toggle",
    short: "Switch between Light, Dark, and System Default themes.",
    detail: "Cycles: Light -> Dark -> System Default. System Default follows your OS preference. Your choice persists across sessions.",
    why: "Reduces eye strain in different lighting conditions.",
    roles: [],
  },
  "nav.notifications": {
    id: "nav.notifications",
    title: "Notifications",
    short: "Quality alerts, overdue CAPAs, calibration warnings, and completions.",
    detail: "A blue dot indicates unread items. Click to expand the full notification list with timestamps and severity.",
    why: "Real-time awareness of critical quality events. CTQ failures and overdue items require prompt attention.",
    roles: [],
  },
  "nav.profile": {
    id: "nav.profile",
    title: "Your Profile",
    short: "View your role, assigned stages, plant, and sign out.",
    detail: "Shows your QMS role (which determines module access, data scope, and workflow authority), assigned stages, and plant.",
    why: "Your role controls what you can see and do. If you need different access, contact your administrator.",
    roles: [],
  },

  // ── Dashboard Metrics ──
  "kpi.fpy": {
    id: "kpi.fpy",
    title: "First Pass Yield (FPY)",
    short: "Percentage of units passing inspection on the first attempt without rework.",
    detail: "FPY = (Units passed first time / Total units inspected) x 100. The denominator is total units inspected, not total units produced. A unit that fails and passes after rework is NOT counted as a first-pass success.",
    why: "FPY below 90% indicates systemic quality issues. Investigate by stage and defect category.",
    rule: "FPY = (First-pass accepted units / Total inspected units) x 100",
    roles: [],
  },
  "kpi.fulfilment": {
    id: "kpi.fulfilment",
    title: "Fulfilment Rate",
    short: "Completed units as a percentage of ordered units.",
    detail: "Fulfilment = (Completed Qty / Ordered Qty) x 100. Completed means accepted and released by QC, not just manufactured. Pending = Ordered - Completed - Rejected.",
    why: "Low fulfilment rate means customer delivery is at risk. Check for holds, material shortages, or rework bottlenecks.",
    rule: "Fulfilment = (Completed / Ordered) x 100. Pending = Ordered - Completed - Rejected.",
    roles: [],
  },
  "kpi.open-ncrs": {
    id: "kpi.open-ncrs",
    title: "Open NCRs",
    short: "Count of nonconformance reports not yet closed.",
    detail: "Includes all NCRs in Open, Contained, Investigating, CAPA-Open, or Effectiveness-Check status. Critical NCRs require immediate containment action.",
    why: "High open NCR count indicates quality issues are not being resolved. Critical NCRs can block production.",
    states: ["Open", "Contained", "Investigating", "CAPA-Open", "Effectiveness-Check", "Closed"],
    roles: [],
  },
  "kpi.rework-cost": {
    id: "kpi.rework-cost",
    title: "Total Rework Cost",
    short: "Sum of actual costs from all rework jobs.",
    detail: "Total = sum of all ReworkCostLine amounts (Labour + Material + Machine + Consumables + External + Other). Rates sourced from approved RateMaster. Only closed or in-progress jobs with cost lines are counted.",
    why: "COPQ (Cost of Poor Quality) directly impacts profitability. Track trends by defect category and process.",
    rule: "COPQ = Rework Cost + Scrap Cost + Re-inspection Cost",
    roles: [],
  },

  // ── Work Order Fields ──
  "wo.number": {
    id: "wo.number",
    title: "Work Order Number",
    short: "Unique production authorization identifier.",
    detail: "System-generated unique ID. Each WO authorizes the shop floor to produce a specific quantity of a specific product.",
    why: "The WO number links production, quality, and material records together. Every HTU, inspection, and NCR traces back to a WO.",
    roles: [],
  },
  "wo.so-link": {
    id: "wo.so-link",
    title: "Linked Sales Order",
    short: "The originating sales order that drove this work order.",
    detail: "A single SO may require multiple WOs for different products, routes, or batches. The SO provides customer identity, product specification, and delivery commitment.",
    why: "Without the SO link, the WO has no customer context. Fulfilment cannot be measured.",
    rule: "Every customer-demand-driven WO must reference the originating SO line.",
    roles: [],
  },
  "wo.unit-completion": {
    id: "wo.unit-completion",
    title: "Unit Completion",
    short: "Completed units out of planned units.",
    detail: "Shows how many physical units (HTUs) have completed all required production operations. This is NOT the same as operation completion or QC release.",
    why: "Compressing unit completion, operation progress, QC release, and material readiness into one bar hides critical distinctions.",
    rule: "Unit Completion = CompletedQty / PlannedQty. A unit is 'completed' only when all required operations are done.",
    roles: [],
  },
  "wo.qc-release": {
    id: "wo.qc-release",
    title: "QC Release",
    short: "Inspections passed vs failed for this work order.",
    detail: "Passed = inspections with overallResult 'Pass'. Failed = inspections with overallResult 'Fail'. A unit must pass all required CTQ inspections before release.",
    why: "A unit can be manufactured but not released if QC fails. Released units count toward SO fulfilment; failed units go to rework or scrap.",
    rule: "Only released units count toward fulfilment. Failed units create NCRs and rework jobs.",
    roles: [],
  },
  "wo.material-readiness": {
    id: "wo.material-readiness",
    title: "Material Readiness",
    short: "Whether required materials are available for production.",
    detail: "Status is Available when all required materials are allocated and quality-released. Partial means some materials are missing. Not Available blocks WO release.",
    why: "Production cannot begin without materials. A WO cannot be released when material-readiness conditions are unmet.",
    states: ["Available", "Partial", "Not Available"],
    rule: "A WO cannot be released when mandatory material-readiness conditions are unmet.",
    roles: [],
  },
  "wo.htu-register": {
    id: "wo.htu-register",
    title: "HTU Register",
    short: "Count of unique Hi-Tech Unit serial numbers tracked for this WO.",
    detail: "HTU = Hi-Tech Unit, the unique serial number stamped on each radiator. Each HTU has its own lifecycle: Planned -> In Production -> QC Inspection -> Accepted/NCR/Rework -> Released/Scrap.",
    why: "Individual unit traceability is essential for quality, warranty, and recall management.",
    rule: "Every production unit must link to its originating WO via the HTU number.",
    roles: [],
  },

  // ── Inspection ──
  "insp.htu": {
    id: "insp.htu",
    title: "HTU Number",
    short: "Auto-generated unique serial for this unit.",
    detail: "Format: HTU-{WO last 4 digits}-{sequential}. The sequence is based on the count of existing HTUs for this WO. Each HTU is permanent and traceable.",
    why: "The HTU links this inspection to the physical product. If a unit fails, the HTU preserves the complete defect and rework history.",
    rule: "HTU = HTU-{WO digits}-{sequence}. Sequence increments per WO based on existing HTU count.",
    roles: [],
  },
  "insp.ctq": {
    id: "insp.ctq",
    title: "Critical-To-Quality (CTQ) Characteristic",
    short: "A characteristic that, if failed, automatically creates an NCR and holds the work order.",
    detail: "CTQ failures are more severe than non-CTQ failures. A CTQ fail blocks the unit from proceeding to the next process and auto-creates an NCR with 'Critical' severity.",
    why: "CTQ characteristics are the minimum acceptance criteria that cannot be bypassed. They protect customer safety and product function.",
    rule: "CTQ fail -> overallResult = Fail, NCR auto-created with severity 'Critical', WO placed On Hold.",
    roles: [],
  },
  "insp.disposition": {
    id: "insp.disposition",
    title: "Disposition",
    short: "Choose Rework or Scrap when a test fails.",
    detail: "When a characteristic fails, you must choose a disposition before submitting: Rework sends the unit to the rework area for corrective work. Scrap flags the unit for scrap disposal. A linked Rework Job Order is created automatically.",
    why: "The disposition determines the unit's path: rework allows recovery and reinspection; scrap is terminal. The choice affects cost, fulfilment, and traceability.",
    rule: "Disposition is required when any characteristic fails. Rework creates an RWO with status 'Reported'. Scrap creates an RWO with status 'Scrapped'.",
    states: ["Rework", "Scrap"],
    roles: [],
  },

  // ── Rework ──
  "rwo.number": {
    id: "rwo.number",
    title: "Rework Job Order ID",
    short: "Unique identifier for this rework job.",
    detail: "Format: RW-K2-{year}-{sequence}. The RWO tracks the defect from identification through rework execution, quality verification, cost calculation, and closure.",
    why: "The RWO provides end-to-end traceability for the corrective process. It links back to the originating inspection and forward to the reinspection.",
    rule: "RWO = RW-{Plant}-{Year}-{Seq:6d}. Each RWO is unique and append-only in its timeline.",
    roles: [],
  },
  "rwo.cost": {
    id: "rwo.cost",
    title: "Rework Cost",
    short: "Total cost = Labour + Material + Machine + Consumables + External + Other.",
    detail: "Each cost line has a component, quantity, rate, and auto-calculated amount. Rates come from the approved RateMaster table. The job's actualCost is the sum of all cost lines.",
    why: "Rework cost is a direct component of COPQ. Accurate cost capture is essential for profitability analysis.",
    rule: "Total = sum of all ReworkCostLine.amount. Each amount = quantity x rateAmount. Rates sourced from RateMaster with effective-date validation.",
    roles: ["Admin", "IT", "Director", "DGM", "PlantManager", "QualityManager", "ProductionSupervisor", "LineManager"],
  },
  "rwo.status": {
    id: "rwo.status",
    title: "Rework Status",
    short: "Current state in the rework lifecycle.",
    detail: "Status transitions are governed by the permitted-transition matrix. Each transition requires the correct role. Terminal states (Closed, Scrapped, Cancelled) cannot be reopened except with justification.",
    why: "Status controls what actions are available. A job cannot be closed while inspections or approvals are incomplete.",
    states: ["Reported", "Pending Review", "Approved for Rework", "In Progress", "Pending Inspection", "Pending Approval", "On Hold", "Closed", "Scrapped", "Cancelled"],
    rule: "Closure requires: execution completed, inspections passed, cost captured, approvals completed, disposition recorded.",
    roles: [],
  },

  // ── Sales Order ──
  "so.number": {
    id: "so.number",
    title: "Sales Order Number",
    short: "Customer demand identifier from ERP.",
    detail: "A single SO may require multiple WOs for different products, routes, plants, or batches. The SO preserves the customer PO reference, customer identity, ordered quantity, and delivery commitment.",
    why: "The SO is the source of truth for customer demand. WO closure does not equal SO closure — other WOs under the same SO may remain open.",
    rule: "Allocated quantities across WOs cannot exceed eligible SO demand unless an authorized exception exists.",
    roles: [],
  },
  "so.fulfilment": {
    id: "so.fulfilment",
    title: "SO Fulfilment Rate",
    short: "Completed units as a percentage of ordered units for this SO.",
    detail: "Fulfilment = (Completed Qty / Ordered Qty) x 100, summed across all linked WOs. Completed means accepted and released by QC.",
    why: "Low fulfilment means customer delivery is at risk. Check linked WOs for holds, rework, or material shortages.",
    rule: "Fulfilment = (Completed / Ordered) x 100. Pending = Ordered - Completed - Rejected.",
    roles: [],
  },
};

// ============================================================
// Tour Catalogue
// ============================================================

export const TOUR_CATALOG: TourDefinition[] = [
  {
    id: "overview",
    title: "HIVE Application Overview",
    objective: "Learn the main navigation, global search, role-specific access, dashboard interpretation, and where to find records and history.",
    duration: "5 minutes",
    roles: [],
    steps: [
      {
        title: "Navigation Sidebar",
        description: "The sidebar is your module switcher. It shows only modules your role has access to. Click any item to navigate.",
        why: "Your role determines what you can see and do. Hidden modules are under construction.",
        selector: "[data-tour='sidebar']",
      },
      {
        title: "Global Search",
        description: "Search across work orders, NCRs, inspections, and HTU numbers. Results appear grouped by type.",
        why: "Avoids navigating through menus to find a specific record.",
        selector: "[data-tour='search']",
      },
      {
        title: "Plant Selector",
        description: "Switch between plants. K2 (Khopoli) is currently active. Each plant has its own routes and quality data.",
        selector: "[data-tour='plant-selector']",
      },
      {
        title: "Tour Guide",
        description: "Click this compass icon anytime to restart the tour or explore other available tours.",
        selector: "[data-tour='tour-guide']",
      },
      {
        title: "Notifications",
        description: "Real-time alerts for CTQ failures, overdue CAPAs, calibration warnings, and completions.",
        selector: "[data-tour='notifications']",
      },
      {
        title: "Your Profile",
        description: "View your role, assigned stages, plant, and sign out. Your role controls module access, data scope, and workflow authority.",
        selector: "[data-tour='profile']",
      },
    ],
  },
  {
    id: "so-to-wo",
    title: "Sales Order to Work Order",
    objective: "Learn how customer demand flows from the sales order to production work orders, and how to create a WO from an eligible SO.",
    duration: "8 minutes",
    roles: ["Admin", "IT", "Director", "DGM", "PlantManager", "QualityManager", "ProductionSupervisor", "LineManager"],
    steps: [
      {
        title: "Sales Orders Screen",
        description: "Navigate to Sales Orders. Each SO groups linked WOs. Click an SO row to expand and see all linked work orders.",
        why: "The SO is the source of customer demand. A single SO may have multiple WOs.",
      },
      {
        title: "Check Pending Quantity",
        description: "Each SO shows ordered, completed, rejected, and pending quantities. Pending = Ordered - Completed - Rejected.",
        why: "Only SOs with pending demand are eligible for new WO allocation.",
      },
      {
        title: "Create Work Order",
        description: "In Work Orders, click New. Select an eligible SO from the dropdown. Customer, item, size, and finish auto-populate from the SO.",
        why: "Starting from the SO prevents data entry errors and ensures the WO inherits the correct customer specification.",
        action: "Select an SO in the create form",
        expectedState: "Customer, PO, item, size, and finish auto-populate from the selected SO",
        warning: "If planned qty exceeds SO pending qty, an error appears and submission is blocked.",
      },
      {
        title: "Quantity Validation",
        description: "Enter the planned quantity. The system validates it against the SO's remaining allocatable quantity.",
        why: "Allocated quantities across WOs cannot exceed eligible SO demand. This prevents over-production.",
        rule: "Planned Qty <= SO Pending Qty",
      },
      {
        title: "Create and Verify",
        description: "Click Create Work Order. The new WO is linked to the SO and appears in the WO list.",
        expectedState: "WO created with SO link. Customer, item, and specification inherited from SO.",
      },
    ],
  },
  {
    id: "inspection",
    title: "QC Inspection Workflow",
    objective: "Learn how to record a digital inspection, understand CTQ failures, and handle rework/scrap disposition.",
    duration: "10 minutes",
    roles: ["Admin", "IT", "QCInspector", "QualityManager", "ProductionSupervisor", "LineManager", "Operator"],
    steps: [
      {
        title: "Open Inspection Form",
        description: "Navigate to Inspections and click New Inspection. Select a work order to auto-generate the HTU number.",
        why: "The HTU links this inspection to the physical product unit.",
      },
      {
        title: "HTU Auto-Generation",
        description: "The HTU number is auto-generated as HTU-{WO digits}-{sequence} based on existing HTU count for this WO.",
        why: "Each unit gets a unique, permanent serial that preserves its complete manufacturing history.",
        rule: "HTU = HTU-{WO last 4 digits}-{next sequence based on existing HTUs}",
      },
      {
        title: "Select Stage",
        description: "Select the production stage you are inspecting. Each stage has its own checklist of characteristics.",
        why: "Different stages check different parameters. CTQ characteristics are the most critical.",
      },
      {
        title: "Record Measurements",
        description: "For each characteristic, enter the measured value and mark Pass or Fail. CTQ failures are more severe.",
        why: "CTQ failures auto-create an NCR with Critical severity and hold the work order.",
        rule: "CTQ fail -> overallResult = Fail, NCR auto-created, WO On Hold",
      },
      {
        title: "Disposition on Failure",
        description: "If any test fails, choose Rework or Scrap before submitting. A linked Rework Job Order is created automatically.",
        why: "The disposition determines the unit's path: rework allows recovery; scrap is terminal.",
        action: "Select Rework or Scrap when a test fails",
        warning: "Cannot submit without choosing a disposition when a test has failed.",
      },
      {
        title: "Submit and Verify",
        description: "Click Submit. If passed, the unit proceeds. If failed, the toast shows the RWO number and the work order is placed on hold.",
        expectedState: "Inspection record created. If fail: NCR + RWO created, WO on hold.",
      },
    ],
  },
  {
    id: "rework",
    title: "Rework Job Order Management",
    objective: "Learn how to view rework job details, enter costs, track timeline, and perform status transitions.",
    duration: "8 minutes",
    roles: ["Admin", "IT", "Director", "DGM", "PlantManager", "QualityManager", "ProductionSupervisor", "LineManager", "QCInspector"],
    steps: [
      {
        title: "Rework Jobs List",
        description: "Navigate to Rework Jobs. The list shows all rework job orders with their status, severity, and cost.",
        why: "Click any row to open the full detail panel.",
      },
      {
        title: "Detail Panel - Overview",
        description: "The detail panel has 4 tabs: Details, Cost, Timeline, and Actions. Details shows defect info and the originating inspection link.",
        why: "The inspection link connects the rework to the quality event that triggered it.",
      },
      {
        title: "Cost Entry",
        description: "On the Cost tab, click Add Cost Line. Select a component (Labour, Material, Machine, etc.), enter quantity and rate. Amount auto-calculates.",
        why: "Accurate cost capture is essential for COPQ analysis. Rates should come from approved RateMaster.",
        rule: "Amount = Quantity x Rate. Total Actual = sum of all cost lines.",
        warning: "Only authorized roles (Director, DGM, Section Head, Manager) can enter costs.",
      },
      {
        title: "Timeline",
        description: "The Timeline tab shows all events: creation, status changes, cost captures, inspections, and approvals.",
        why: "Complete audit trail for traceability. Events are append-only.",
      },
      {
        title: "Status Transitions",
        description: "The Actions tab shows permitted transitions from the current status. Click a transition to advance the job.",
        why: "Transitions are governed by the status matrix. Terminal states cannot be reopened.",
        rule: "Closure requires: execution done, inspections passed, cost captured, approvals complete.",
        warning: "Cannot close while mandatory inspections or approvals remain incomplete.",
      },
    ],
  },
];

/**
 * Get help content by ID, or return null if not found.
 */
export function getHelpContent(id: string): HelpContent | null {
  return HELP_CONTENT[id] || null;
}

/**
 * Get a tour definition by ID.
 */
export function getTour(id: string): TourDefinition | null {
  return TOUR_CATALOG.find(t => t.id === id) || null;
}

/**
 * Get all tours available for a given role.
 */
export function getToursForRole(role: string): TourDefinition[] {
  return TOUR_CATALOG.filter(t => t.roles.length === 0 || t.roles.includes(role));
}
