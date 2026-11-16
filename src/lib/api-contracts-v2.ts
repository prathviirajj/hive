// =========================================================================
// HIVE QMS v2.0 - API Contract Definitions
// TypeScript interfaces for request/response payloads
// =========================================================================

// ─── POST /api/v2/inspections ─────────────────────────────────────────────
// Submits raw measurements for server-side tolerance evaluation.
// The client NEVER sends pass/fail booleans - only raw values.
// The backend Deterministic Evaluation Engine computes PASS/FAIL/INDETERMINATE.

/** Request: POST /api/v2/inspections */
export interface InspectionSubmitRequest {
  workOrderNo: string;          // "WO-3005"
  htuSerialNo: string;          // "HTU-K2-001" (from barcode scan)
  stageCode: string;            // "S01", "S14", etc.
  docId: string;                // "QCI-F-02-01" (controlled document)
  inspectionType: InspectionType;
  shiftCode: ShiftCode;
  machineId?: string;           // "K2-M12-ROLL" (if PLC-connected)
  measurements: MeasurementSubmission[];
}

export type InspectionType =
  | "FIRST_PIECE" | "IN_PROCESS" | "PATROL"
  | "RETEST_AFTER_REWORK" | "FINAL_RELEASE";

export type ShiftCode = "A" | "B" | "C";

export interface MeasurementSubmission {
  charCode: string;             // "NECK_TO_NECK_DIST"
  numericValue?: number;        // Raw measured value (e.g., 520.3)
  booleanObservation?: boolean; // For BOOLEAN_PASS characteristics
  textObservation?: string;     // For TEXT_OBSERVATION characteristics
  captureSource: CaptureSource;
  instrumentAssetTag?: string;  // "ELCO-K2-04" (for calibration verification)
  plcTelemetryEventId?: number; // Link to MachineCycleEvent
  evidenceMediaUri?: string;    // "s3://hive-k2-evidence/..."
}

export type CaptureSource = "PLC_TAG" | "BLE_INSTRUMENT" | "MANUAL_INPUT";

/** Response: 201 Created */
export interface InspectionSubmitResponse {
  inspectionNumber: string;     // "INS-2026-0049"
  appliedRevision: string;      // "QCI-F-02-01 Rev.05"
  overallEvaluation: "PASS" | "FAIL" | "INDETERMINATE";
  ctqFailed: boolean;
  htuNewState: HTUState;
  workOrderNewStatus: WorkOrderStatus;
  autoCreatedNcr?: AutoNcrInfo;
  recordHash: string;           // SHA-256 tamper-evident signature
  evaluatedCharacteristics: EvaluatedCharacteristic[];
}

export type HTUState =
  | "PENDING" | "IN_PROCESS" | "STAGE_PASSED" | "ON_HOLD"
  | "IN_REWORK" | "SCRAPPED" | "RELEASED_FOR_DISPATCH" | "DISPATCHED";

export type WorkOrderStatus =
  | "RELEASED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CLOSED";

export interface AutoNcrInfo {
  ncrNumber: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  status: "OPEN";
  quarantineInstruction: string;
}

export interface EvaluatedCharacteristic {
  charCode: string;
  charName: string;
  submittedValue: number | boolean | string | null;
  appliedLsl: number | null;
  appliedUsl: number | null;
  evaluationStatus: "PASS" | "FAIL" | "INDETERMINATE";
  isCTQ: boolean;
  failureReason?: string;
}

// ─── GET /api/v2/dashboard/exceptions ─────────────────────────────────────
// Fetches anomalies for the Manager Control Tower.
// Returns ONLY exceptions - passing metrics are intentionally excluded.

/** Response: 200 OK */
export interface DashboardExceptionsResponse {
  timestamp: string;            // ISO 8601
  plantCode: string;            // "K2"
  shiftCode: ShiftCode;
  fpy: FpyData;
  criticalNcrs: CriticalNcr[];
  fpyDrops: FpyDrop[];
  gateBlocks: GateBlock[];
  overdueCapas: OverdueCapa[];
  instrumentAlerts: InstrumentAlert[];
}

export interface FpyData {
  plantFpy: number;             // 92.4 (%)
  plantTarget: number;          // 95.0 (%)
  variance: number;             // -2.6 (percentage points)
  trend14d: { date: string; fpy: number }[];
  stageBreakdown: { stageCode: string; stageName: string; fpy: number; totalUnits: number; failedUnits: number }[];
}

export interface CriticalNcr {
  ncrNumber: string;
  severity: "CRITICAL";
  status: string;
  defectCategory: string;
  htuSerialNo: string;
  workOrderNo: string;
  customerName: string;
  stageCode: string;
  stageName: string;
  openedAt: string;             // ISO 8601
  ageHours: number;
  containmentAction: string;
  awaitingDisposition: boolean;
}

export interface FpyDrop {
  stageCode: string;
  stageName: string;
  currentFpy: number;           // 84.2 (%)
  previousFpy: number;          // 91.5 (%)
  drop: number;                 // -7.3 (percentage points)
  affectedHtuCount: number;
  topDefect: string;
}

export interface GateBlock {
  htuSerialNo: string;
  workOrderNo: string;
  stageCode: string;
  stageName: string;
  blockReason: string;          // "CTQ_FAIL" | "PREDECESSOR_INCOMPLETE" | "OPEN_NCR"
  blockedSince: string;         // ISO 8601
  blockedDurationHours: number;
}

export interface OverdueCapa {
  ncrNumber: string;
  capaOwnerName: string;
  dueDate: string;              // ISO 8601
  daysOverdue: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR";
}

export interface InstrumentAlert {
  assetTag: string;
  instrumentCategory: string;
  status: "EXPIRED" | "DUE_SOON";
  calibrationDueDate: string;
  affectedStage: string;
}
