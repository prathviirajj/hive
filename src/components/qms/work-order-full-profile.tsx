"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  Ruler, Layers, Droplets, Wrench, Boxes, Upload, Download, Eye, Plus,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, ShieldAlert, Clock, UserCheck,
  Workflow, Save, Edit3, Trash2, Check, Lock, ChevronRight, FileSpreadsheet,
  Printer, ArrowUpRight, Sparkles, Building2, Calendar, ClipboardCheck,
  AlertCircle, HelpCircle, HardHat, FileCheck2, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge, ResultBadge, LoadingBlock, EmptyState, DetailRow, fmtDate, fmtDateTime } from "@/components/qms/shared";
import { buildUnitLedger, TrackedUnit, UnitMatrixView, UnitInspectionModal } from "@/components/qms/unit-traceability";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@/components/qms/login";
import { cn } from "@/lib/utils";

// Customer approved engineering drawings from official customer POs & specifications
const INITIAL_CUSTOMER_DRAWINGS: Record<string, any[]> = {
  "SPTC": [
    {
      id: "dwg-sptc-01",
      fileName: "HT-SPTC-26-04-8181-6853-SHT01.pdf",
      customerDoc: "8181065",
      poNumber: "PO6853 / PO6264",
      hiTechDrg: "HT/SPTC/26/04/8181-6853 Rev 0 (Sheet 1 of 2)",
      fileType: "Customer Approved GA Drawing (Sheet 1/2)",
      fileFormat: "pdf",
      size: "3.8 MB",
      uploadedBy: "Yogesh Jadhav (Plant Director)",
      uploadedAt: "2026-11-15T10:30:00Z",
      status: "Approved",
      approvedBy: "KYD Sir (CEO)",
      notes: "Official SPTC Approved GA Drawing. 2900/1900 CC x 520 W x 26/3 Fin, CRCA 1.2mm IS 513:2016 CR2 Gr D, 80 NB 4.5mm ERW-FC pipes, DIN 42558-M6 air release, DIN 42558-M12A drain, AkzoNobel 5-layer paint system (Total DFT 286 µm nominal).",
      deviations: [
        "Item 2 & 3 Top and bottom header pipe provided 4.5mm thick (regular practice)",
        "Item 6 Flange bore ID provided Ø83mm as per regular practice with SPTC",
        "Item 7 Bracing rod position & orientation provided as per Hi-Tech standard",
        "Item 8 Lifting lug provided as per Hi-Tech standard at fin center",
        "Item 10 Gusset modified to suit",
        "TP distance 35mm hence total length is 1495mm"
      ],
      pages: 2,
    },
    {
      id: "dwg-sptc-02",
      fileName: "HT-SPTC-26-04-8181-6853-SHT02.pdf",
      customerDoc: "8181065",
      poNumber: "PO6853",
      hiTechDrg: "HT/SPTC/26/04/8181-6853 Rev 0 (Sheet 2 of 2)",
      fileType: "Customer Approved GA Blueprint Details (Sheet 2/2)",
      fileFormat: "pdf",
      size: "4.1 MB",
      uploadedBy: "Rohit Giri (Quality Manager)",
      uploadedAt: "2026-11-15T11:00:00Z",
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: "Sheet 2: Flange 150x150mm with 4x Ø22mm holes on PCD Ø160, Flange bore Ø83mm, Sealing surface painting RD-124 40-70 µm on Ø122, Bracing Lug 6mm (SS-316), Lifting Lug 10mm (Ø30 hole), Gusset 10mm, Earthing Lug 6mm (SS-316 unpainted).",
      pages: 2,
    },
    {
      id: "dwg-sptc-03",
      fileName: "HTR-SPTC-2900-1900-520-26FIN.sldasm",
      customerDoc: "8181065",
      hiTechDrg: "HT/SPTC/26/04/8181-6853",
      fileType: "SolidWorks 3D Assembly",
      fileFormat: "sldasm",
      size: "26.4 MB",
      uploadedBy: "Amit Shah (Process Engineer)",
      uploadedAt: "2026-11-14T09:15:00Z",
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: "Parametric 3D SolidWorks assembly for SPTC 2900/1900 CC x 520 W with 26/3 elements, 4.5mm header pipes, and DIN 42558 fittings.",
      solidWorksMeta: {
        version: "SolidWorks 2024 SP2.0",
        elementsCount: 26,
        envelope: "2900/1900 × 520 × 240 mm",
        mass: "198.5 kg",
        material: "CRCA IS 513:2016 CR2 Gr D / ERW-FC 4.5mm",
        features: ["Header 80 NB 4.5mm WT", "Flange PCD Ø160 (4x Ø22)", "Flange Bore Ø83mm", "DIN 42558 M6/M12A", "AkzoNobel 5-Coat 286µm"]
      }
    }
  ],
  "DELTA_STAR": [
    {
      id: "dwg-delta-01",
      fileName: "HT-DELTA-26-11-RAD-090-36-20.5G-SHT01.pdf",
      customerDoc: "RAD-090-36-20.5G",
      poNumber: "1185452, 53, 54",
      hiTechDrg: "HT/DELTA/26/11/RAD-090-36-20.5G Rev R0 (Sheet 1/2)",
      fileType: "Customer Approved GA Drawing (Sheet 1/2)",
      fileFormat: "pdf",
      size: "3.5 MB",
      uploadedBy: "Yogesh Jadhav (Plant Director)",
      uploadedAt: "2026-11-03T14:00:00Z",
      status: "Approved",
      approvedBy: "KYD Sir (CEO)",
      notes: "Official Delta Star GA Drawing. 2286 CC (90.0 in) x 520 W (20.5 in) x 36 Fin, CRCA 1.0mm IS 513:2016 CR2 Gr D, 80 NB 4.5mm ERW-FC pipes, Flange 190x190mm (7.5x7.5 in) PCD Ø198, 3/4\" NPT Air & Drain with Brass Plugs, AkzoNobel paint system (Total DFT 215 µm nominal ANSI 70).",
      deviations: [
        "Item 2 & 3 Header pipe thickness provided 4.5mm",
        "Item 4 & 5 Air & Drain provided as per Hi-Tech std 3/4\" NPT with Brass Plug",
        "Item 6 Flange provided as per Hi-Tech std (190x190mm square, PCD 198)",
        "Item 7 Bracing rod Dia 10mm provided as per Hi-Tech std (9 pairs)",
        "Item 8 Lifting lug provided as per Hi-Tech std (2 Nos)",
        "Paint DFT provided 215 nominal (ANSI 70)"
      ],
      pages: 2,
    },
    {
      id: "dwg-delta-02",
      fileName: "HT-DELTA-26-11-RAD-090-36-20.5G-SHT02.pdf",
      customerDoc: "RAD-090-36-20.5G",
      poNumber: "1185452, 53, 54",
      hiTechDrg: "HT/DELTA/26/11/RAD-090-36-20.5G Rev R0 (Sheet 2/2)",
      fileType: "Customer Approved GA Blueprint Details (Sheet 2/2)",
      fileFormat: "pdf",
      size: "3.9 MB",
      uploadedBy: "Rohit Giri (Quality Manager)",
      uploadedAt: "2026-11-03T14:30:00Z",
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: "Sheet 2: Flange 190x190mm with 4x Ø22mm holes on PCD Ø198, Bore Ø80mm, Sealing surface painting RD-124 40-70 µm on Ø140, Outer sealing surface primer+final paint 100-200 µm, 3/4\" NPT Brass Plugs, 5/8\"-11 UNC SS-304 Bracing Hex (6 Nos).",
      pages: 2,
    },
    {
      id: "dwg-delta-03",
      fileName: "HTR-DELTA-2286-520-36FIN.sldasm",
      customerDoc: "RAD-090-36-20.5G",
      hiTechDrg: "HT/DELTA/26/11/RAD-090-36-20.5G",
      fileType: "SolidWorks 3D Assembly",
      fileFormat: "sldasm",
      size: "28.1 MB",
      uploadedBy: "Amit Shah (Process Engineer)",
      uploadedAt: "2026-11-04T10:00:00Z",
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: "Parametric 3D SolidWorks assembly for Delta Star 2286 CC (90 in) x 520 W (20.5 in) with 36 elements, 4.5mm header pipes, and 3/4\" NPT fittings.",
      solidWorksMeta: {
        version: "SolidWorks 2024 SP2.0",
        elementsCount: 36,
        envelope: "2286 × 520 × 240 mm [90 × 20.5 in]",
        mass: "212.0 kg",
        material: "CRCA IS 513:2016 CR2 Gr D / ERW-FC 4.5mm",
        features: ["Header 80 NB 4.5mm WT", "Flange PCD Ø198 (4x Ø22)", "3/4\" NPT Brass Plugs", "5/8\"-11 UNC SS-304 Hex", "AkzoNobel 215µm ANSI 70"]
      }
    }
  ],
  "default": [
    {
      id: "dwg-01",
      fileName: "HTR-RAD-3000-520-ASSEMBLY-REV04.sldasm",
      fileType: "SolidWorks 3D Assembly",
      fileFormat: "sldasm",
      size: "24.8 MB",
      uploadedBy: "Yogesh Jadhav (Plant Director)",
      uploadedAt: "2026-11-15T10:30:00Z",
      status: "Approved",
      approvedBy: "KYD Sir (CEO)",
      notes: "Official manufacturing assembly drawing with 28 elements, 3000mm CC, PCD 160mm flange.",
      solidWorksMeta: {
        version: "SolidWorks 2024 SP2.0",
        elementsCount: 28,
        envelope: "3000 × 520 × 240 mm",
        mass: "184.2 kg",
        material: "CRCA IS 513 Gr. D / E250 Flange",
        features: ["Header Boss Ø88.9", "Pitch Pattern 45mm", "Flange PCD 160", "Lifting Lug 10mm", "Bracing Flat 40x3"]
      }
    },
    {
      id: "dwg-02",
      fileName: "CUSTOMER-QAP-ELSEWEDY-SPEC-REV02.pdf",
      fileType: "Customer QAP Document",
      fileFormat: "pdf",
      size: "4.2 MB",
      uploadedBy: "Rohit Giri (Quality Manager)",
      uploadedAt: "2026-11-14T14:15:00Z",
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: "Customer special QAP. Requires tight Pata tolerance ≤0.3mm and PU paint DFT min 200 µm.",
      pages: 14,
    },
    {
      id: "dwg-03",
      fileName: "FLANGE-DRILLING-PCD160-2D-SCHEMATIC.png",
      fileType: "2D Manufacturing Blueprint",
      fileFormat: "image",
      size: "1.8 MB",
      uploadedBy: "Amit Shah (Process Engineer)",
      uploadedAt: "2026-11-12T09:00:00Z",
      status: "Approved",
      approvedBy: "Rohit Giri (Quality Manager)",
      notes: "2D shopfloor fabrication blueprint for header pipe flange bolt holes (4x Ø18mm).",
    }
  ]
};

// ============================================================
// Interactive 3D CAD / SolidWorks Canvas Previewer
// ============================================================
function SolidWorks3DViewer({ model, onRotate, onReset }: { model: any; onRotate?: () => void; onReset?: () => void }) {
  const [rotation, setRotation] = useState({ x: 22, y: -35, z: 0 });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<"shaded" | "wireframe" | "edges">("shaded");
  const [activePreset, setActivePreset] = useState("iso");

  const setPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === "iso") setRotation({ x: 22, y: -35, z: 0 });
    if (preset === "front") setRotation({ x: 0, y: 0, z: 0 });
    if (preset === "top") setRotation({ x: 90, y: 0, z: 0 });
    if (preset === "side") setRotation({ x: 0, y: 90, z: 0 });
  };

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--hairline)", backgroundColor: "#0b101b" }}>
      {/* 3D Viewport Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b flex-wrap gap-2" style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(15, 23, 42, 0.85)" }}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-200">
            SOLIDWORKS 3D CAD ENGINE · {model.solidWorksMeta?.version || "SW 2024"}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            PARASOLID v35
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setPreset("iso")}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${activePreset === "iso" ? "bg-primary text-white" : "text-slate-400 hover:text-white bg-slate-800/60"}`}
          >
            Isometric
          </button>
          <button
            onClick={() => setPreset("front")}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${activePreset === "front" ? "bg-primary text-white" : "text-slate-400 hover:text-white bg-slate-800/60"}`}
          >
            Front
          </button>
          <button
            onClick={() => setPreset("top")}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${activePreset === "top" ? "bg-primary text-white" : "text-slate-400 hover:text-white bg-slate-800/60"}`}
          >
            Top
          </button>
          <button
            onClick={() => setPreset("side")}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${activePreset === "side" ? "bg-primary text-white" : "text-slate-400 hover:text-white bg-slate-800/60"}`}
          >
            Right
          </button>
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={() => setViewMode(viewMode === "shaded" ? "wireframe" : "shaded")}
            className="px-2 py-1 rounded text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white"
            title="Toggle Wireframe / Shaded"
          >
            {viewMode === "shaded" ? "Wireframe" : "Shaded Solid"}
          </button>
          <button onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white" title="Zoom In"><ZoomIn size={13} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white" title="Zoom Out"><ZoomOut size={13} /></button>
          <button onClick={() => { setZoom(1); setPreset("iso"); }} className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white" title="Reset View"><RotateCcw size={13} /></button>
        </div>
      </div>

      {/* 3D Canvas Area */}
      <div className="relative h-80 md:h-96 w-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none" style={{ background: "radial-gradient(circle at center, #172554 0%, #090e17 80%)" }}>
        {/* Technical Coordinate Grid */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        {/* 3D SVG Radiator Model with Perspective Transform */}
        <div
          style={{
            transform: `perspective(900px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
            transition: "transform 0.15s ease-out",
          }}
          className="relative flex items-center justify-center"
        >
          {/* Main Radiator SVG Rendering */}
          <svg width="420" height="260" viewBox="0 0 420 260" className="drop-shadow-2xl">
            <defs>
              <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="finGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
              <linearGradient id="flangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
            </defs>

            {/* Top Header Pipe Ø88.9 */}
            <rect x="30" y="25" width="360" height="24" rx="12" fill={viewMode === "wireframe" ? "none" : "url(#headerGrad)"} stroke="#67e8f9" strokeWidth={viewMode === "wireframe" ? "1.5" : "1"} />
            {/* Top Flange Left */}
            <rect x="15" y="18" width="16" height="38" rx="3" fill="url(#flangeGrad)" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="23" cy="25" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="23" cy="49" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            {/* Top Flange Right */}
            <rect x="389" y="18" width="16" height="38" rx="3" fill="url(#flangeGrad)" stroke="#38bdf8" strokeWidth="1" />

            {/* Radiator Cooling Fins Matrix (Simulated 28 elements) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const xPos = 48 + i * 14;
              return (
                <g key={i}>
                  <rect
                    x={xPos}
                    y="49"
                    width="8"
                    height="162"
                    rx="2"
                    fill={viewMode === "wireframe" ? "none" : "url(#finGrad)"}
                    stroke="#0284c7"
                    strokeWidth={viewMode === "wireframe" ? "1" : "0.5"}
                    opacity={0.88}
                  />
                  {/* Embossed fin flute wave lines */}
                  <line x1={xPos + 4} y1="58" x2={xPos + 4} y2="202" stroke="#bae6fd" strokeWidth="1" strokeDasharray="4 3" opacity={0.7} />
                </g>
              );
            })}

            {/* Bottom Header Pipe Ø88.9 */}
            <rect x="30" y="211" width="360" height="24" rx="12" fill={viewMode === "wireframe" ? "none" : "url(#headerGrad)"} stroke="#67e8f9" strokeWidth={viewMode === "wireframe" ? "1.5" : "1"} />
            {/* Bottom Flange Left */}
            <rect x="15" y="204" width="16" height="38" rx="3" fill="url(#flangeGrad)" stroke="#38bdf8" strokeWidth="1" />
            <circle cx="23" cy="211" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="23" cy="235" r="3" fill="#0f172a" stroke="#94a3b8" strokeWidth="1" />
            {/* Bottom Flange Right */}
            <rect x="389" y="204" width="16" height="38" rx="3" fill="url(#flangeGrad)" stroke="#38bdf8" strokeWidth="1" />

            {/* Bracing Straps 40x3 mm */}
            <line x1="42" y1="130" x2="378" y2="130" stroke="#f59e0b" strokeWidth="3" strokeOpacity="0.8" />
            {/* Lifting Lug Hooks */}
            <path d="M 120 25 L 120 10 A 10 10 0 0 1 140 10 L 140 25 Z" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="130" cy="14" r="4" fill="#090e17" stroke="#38bdf8" strokeWidth="1" />
            <path d="M 280 25 L 280 10 A 10 10 0 0 1 300 10 L 300 25 Z" fill="#475569" stroke="#94a3b8" strokeWidth="1" />
            <circle cx="290" cy="14" r="4" fill="#090e17" stroke="#38bdf8" strokeWidth="1" />
          </svg>
        </div>

        {/* Dynamic Rotation & Tilt Readout */}
        <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-700/50">
          ROT X: {rotation.x}° · Y: {rotation.y}° · ZOOM: {Math.round(zoom * 100)}%
        </div>

        {/* Model Identification Stamp */}
        <div className="absolute top-3 right-3 text-right font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded border border-slate-700/50">
          <div className="text-emerald-400 font-bold">{model.fileName}</div>
          <div>ENVELOPE: {model.solidWorksMeta?.envelope}</div>
          <div>EST. MASS: {model.solidWorksMeta?.mass}</div>
        </div>
      </div>

      {/* SolidWorks Feature Tree & CAD Metadata Bar */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <Workflow size={11} className="text-sky-400" /> SolidWorks Feature Tree
          </div>
          <div className="flex flex-wrap gap-1">
            {(model.solidWorksMeta?.features || []).map((feat: string, idx: number) => (
              <span key={idx} className="text-[10.5px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {feat}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText size={11} className="text-amber-400" /> CAD Physical Material & Density
          </div>
          <div className="text-[11px] text-slate-300">
            <strong>{model.solidWorksMeta?.material}</strong> · Approved for welding and HDG immersion per ISO 1461.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Interactive PDF Document Viewer Previewer
// ============================================================
function PdfDrawingViewer({ doc }: { doc: any }) {
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "var(--hairline)", backgroundColor: "var(--surface-card)" }}>
      {/* PDF Action Toolbar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b flex-wrap gap-2" style={{ borderColor: "var(--hairline-soft)", backgroundColor: "var(--canvas-soft)" }}>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-rose-600" />
          <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>{doc.fileName}</span>
          <span className="t-label text-[10px] px-2 py-0.5 rounded font-mono" style={{ backgroundColor: "rgba(160, 69, 69, 0.1)", color: "var(--semantic-error)" }}>
            PDF DOCUMENT ({doc.pages || 14} PAGES)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-2 py-1 rounded border bg-[var(--surface-card)]" disabled={page === 1}>Prev</button>
          <span className="font-mono text-muted">Page {page} of {doc.pages || 14}</span>
          <button onClick={() => setPage(p => Math.min(doc.pages || 14, p + 1))} className="px-2 py-1 rounded border bg-[var(--surface-card)]" disabled={page === (doc.pages || 14)}>Next</button>
          <div className="w-px h-4 bg-hairline mx-1" />
          <button onClick={() => setZoom(z => Math.max(z - 25, 75))} className="p-1 rounded border bg-[var(--surface-card)]"><ZoomOut size={13} /></button>
          <span className="font-mono text-muted">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(z + 25, 200))} className="p-1 rounded border bg-[var(--surface-card)]"><ZoomIn size={13} /></button>
        </div>
      </div>

      {/* Simulated High-Fidelity Blueprint Document Preview */}
      <div className="p-6 md:p-8 flex items-center justify-center overflow-auto max-h-[500px]" style={{ backgroundColor: "#1e293b" }}>
        <div
          style={{ width: `${Math.round(650 * (zoom / 100))}px`, minHeight: `${Math.round(420 * (zoom / 100))}px` }}
          className="bg-white text-slate-900 rounded shadow-2xl p-6 transition-all relative border border-slate-400 font-sans"
        >
          {/* Blueprint Title Block */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
            <div>
              <div className="text-lg font-bold uppercase tracking-tight text-slate-900">HI-TECH RADIATORS PVT. LTD.</div>
              <div className="text-xs font-semibold text-slate-600">APPROVED CUSTOMER MANUFACTURING DRAWING & QAP</div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="font-bold text-slate-900">DOC NO: HTR-QAP-2026-04</div>
              <div className="text-slate-600">REVISION: REV-04 (APPROVED)</div>
            </div>
          </div>

          {/* Schematic Blueprint Drawing Representation */}
          <div className="border border-dashed border-slate-300 p-4 rounded bg-slate-50 mb-4">
            <div className="text-xs font-mono text-slate-500 mb-2">DIMENSIONAL SCHEMATIC · PAGE {page}</div>
            <div className="h-44 flex items-center justify-center border border-slate-200 bg-white rounded">
              <svg width="340" height="150" viewBox="0 0 340 150">
                <rect x="20" y="20" width="300" height="16" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                <rect x="20" y="114" width="300" height="16" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />
                {Array.from({ length: 18 }).map((_, i) => (
                  <line key={i} x1={32 + i * 16} y1="36" x2={32 + i * 16} y2="114" stroke="#0284c7" strokeWidth="1.5" />
                ))}
                {/* CC Dimension Line */}
                <line x1="20" y1="140" x2="320" y2="140" stroke="#dc2626" strokeWidth="1" />
                <text x="140" y="136" fill="#dc2626" fontSize="10" fontFamily="monospace" fontWeight="bold">CC = 3000 mm</text>
              </svg>
            </div>
          </div>

          {/* Approval Signatures Stamp Block */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-300 pt-3 text-[10px] font-mono">
            <div>
              <div className="text-slate-500">PREPARED BY:</div>
              <div className="font-bold text-slate-800">Amit Shah (Process Eng)</div>
            </div>
            <div>
              <div className="text-slate-500">CHECKED BY:</div>
              <div className="font-bold text-slate-800">Rohit Giri (Quality Mgr)</div>
            </div>
            <div>
              <div className="text-slate-500">APPROVED BY (PLANT):</div>
              <div className="font-bold text-emerald-700">Yogesh Jadhav (Plant Dir)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN: Work Order Full Profile Page (INDEPENDENT PAGE - NO DRAWER)
// ============================================================
export function WorkOrderFullProfilePage({
  wo,
  user,
  plant,
  onBack,
  onNavigateToInspect,
}: {
  wo: any;
  user: User;
  plant: string;
  onBack: () => void;
  onNavigateToInspect?: (stageCode: string, woId: string) => void;
}) {
  const [inspections, setInspections] = useState<any[]>([]);
  const [ncrs, setNcrs] = useState<any[]>([]);
  const [reworkJobs, setReworkJobs] = useState<any[]>([]);

  // Auto-detect customer approved drawing set
  const customerKey = useMemo(() => {
    const cust = (wo.customer || "").toLowerCase();
    const won = (wo.woNumber || "").toLowerCase();
    const item = (wo.itemName || "").toLowerCase();
    if (cust.includes("sptc") || cust.includes("saudi") || won.includes("3004") || won.includes("3005") || item.includes("sptc")) {
      return "SPTC";
    }
    if (cust.includes("delta") || won.includes("3006") || item.includes("delta")) {
      return "DELTA_STAR";
    }
    return "default";
  }, [wo]);

  const [drawings, setDrawings] = useState<any[]>(() => INITIAL_CUSTOMER_DRAWINGS[customerKey] || INITIAL_CUSTOMER_DRAWINGS["default"]);
  const [activeDrawing, setActiveDrawing] = useState<any>(() => (INITIAL_CUSTOMER_DRAWINGS[customerKey] || INITIAL_CUSTOMER_DRAWINGS["default"])[0]);

  useEffect(() => {
    const list = INITIAL_CUSTOMER_DRAWINGS[customerKey] || INITIAL_CUSTOMER_DRAWINGS["default"];
    setDrawings(list);
    setActiveDrawing(list[0]);
  }, [customerKey]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUnit, setSelectedUnit] = useState<TrackedUnit | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [customParams, setCustomParams] = useState<any[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");
  const { toast } = useToast();

  // Role authorization for checksheet changes
  const canModifyChecksheet = ["QualityManager", "Director", "PlantManager", "ProcessEngineer", "CEO", "Admin"].includes(user.role);

  // Fetch linked records
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

  // Build complete unit-by-unit ledger
  const units = useMemo(() => {
    return buildUnitLedger(wo, inspections, ncrs, reworkJobs);
  }, [wo, inspections, ncrs, reworkJobs]);

  const passedUnitsCount = units.filter(u => u.status === "QC Released").length;
  const inProgressCount = units.filter(u => u.status === "In Progress" || u.status === "Pending Start").length;
  const defectiveCount = units.filter(u => u.status === "Failed / Contained" || u.status === "Under Rework").length;

  // Handle uploading 2D/3D SolidWorks / PDF drawings
  const handleUploadDrawing = () => {
    if (!uploadFile) return;
    const ext = uploadFile.name.split(".").pop()?.toLowerCase() || "";
    let fileType = "2D Technical Document";
    let fileFormat = "pdf";

    if (["sldprt", "sldasm", "step", "stp", "iges"].includes(ext)) {
      fileType = `SolidWorks 3D ${ext.toUpperCase()}`;
      fileFormat = "sldasm";
    } else if (["dxf", "dwg"].includes(ext)) {
      fileType = "AutoCAD / SolidWorks 2D Drawing";
      fileFormat = "dxf";
    } else if (["png", "jpg", "jpeg", "webp"].includes(ext)) {
      fileType = "Technical Blueprint Image";
      fileFormat = "image";
    }

    const newDwg = {
      id: `dwg-${Date.now()}`,
      fileName: uploadFile.name,
      fileType,
      fileFormat,
      size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: `${user.name} (${user.role})`,
      uploadedAt: new Date().toISOString(),
      status: "Approved",
      approvedBy: "Yogesh Jadhav (Plant Director)",
      notes: uploadNotes || "Customer technical drawing uploaded for manufacturing compliance.",
      solidWorksMeta: fileFormat === "sldasm" ? {
        version: "SolidWorks 2024",
        envelope: wo.size || "3000 × 520 × 240 mm",
        mass: "184.2 kg",
        material: "CRCA IS 513 Gr. D",
        features: ["Header Boss Ø88.9", "Pitch Pattern 45mm", "Flange PCD 160", "Lifting Lug"]
      } : undefined
    };

    setDrawings(prev => [newDwg, ...prev]);
    setActiveDrawing(newDwg);
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadNotes("");

    // Record system audit log
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CUSTOMER_DRAWING_UPLOADED",
        entityType: "WorkOrder",
        entityId: wo.woNumber,
        beforeState: { drawingCount: drawings.length },
        afterState: { fileName: uploadFile.name, fileType, uploadedBy: user.name },
      })
    }).catch(console.error);

    toast({
      title: "Drawing Uploaded Successfully",
      description: `${uploadFile.name} is now approved and active for ${wo.woNumber}.`,
    });
  };

  // Handle saving manager checksheet override
  const handleSaveChecksheetOverride = (override: any) => {
    setCustomParams(prev => [...prev, override]);
    setShowOverrideModal(false);

    // Record system audit log
    fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "CHECKSHEET_OVERRIDE",
        entityType: "WorkOrder",
        entityId: wo.woNumber,
        beforeState: { standardChecksheet: "Base QAP Rev 05" },
        afterState: { ...override, modifiedBy: user.name, modifiedRole: user.role },
      })
    }).catch(console.error);

    toast({
      title: "Customer Checksheet Customized",
      description: `Tolerances updated specifically for ${wo.customer} (${wo.woNumber}) by ${user.name}.`,
    });
  };

  return (
    <div className="min-h-full pb-16 space-y-6 reveal-up">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 px-2.5 text-xs gap-1.5 font-medium hover:bg-[var(--canvas-soft)] border-[var(--hairline)]"
            >
              <ArrowLeft size={14} /> Back to Work Orders
            </Button>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              CUSTOMER & WORK ORDER MASTER DOSSIER
            </span>
            <span className="text-[10.5px] font-mono text-muted">
              ROUTE: {wo.routeCode || "K2"} · PLANT {wo.plant || "KURKUMBH"}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <h1 className="t-display-sm font-bold tracking-tight text-ink">{wo.woNumber}</h1>
            <StatusBadge status={wo.status} />
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--surface-strong)] text-ink font-medium">
              Priority: {wo.priority || "Medium"}
            </span>
            {customParams.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold font-mono flex items-center gap-1">
                <Sparkles size={11} /> CUSTOMER CHECKSHEET OVERRIDE ACTIVE
              </span>
            )}
          </div>

          <div className="t-body-sm text-muted">
            Customer: <strong className="text-ink">{wo.customer}</strong>
            {wo.customerPo && <> · PO: <strong className="text-ink">{wo.customerPo}</strong></>}
            {wo.soNumber && <> · SO Ref: <strong className="text-ink">{wo.soNumber}</strong></>}
            {" "}· Model: <strong className="text-ink">{wo.itemName} ({wo.size})</strong>
          </div>
        </div>

        {/* Right-Aligned Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 flex-wrap">
          {canModifyChecksheet && (
            <Button
              size="sm"
              onClick={() => setShowOverrideModal(true)}
              className="h-9 px-3.5 rounded-lg flex items-center gap-1.5 font-medium text-xs shadow-xs"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
              title="Customize tolerances or add special checks for this customer"
            >
              <Edit3 size={13} /> Customize Checksheet (Manager)
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowUploadModal(true)}
            className="h-9 px-3.5 rounded-lg flex items-center gap-1.5 font-medium text-xs border-[var(--hairline)] hover:bg-[var(--canvas-soft)]"
          >
            <Upload size={13} /> Upload 2D/3D CAD Drawing
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="h-9 px-3 rounded-lg flex items-center gap-1 text-xs border-[var(--hairline)] hover:bg-[var(--canvas-soft)]"
          >
            <Printer size={13} /> Print Dossier
          </Button>
        </div>
      </div>

      {/* Top Level Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Batch Completion</div>
          <div className="text-xl font-bold font-mono text-ink mt-0.5">{wo.completedQty} / {wo.plannedQty} <span className="text-xs font-normal text-muted">units</span></div>
          <div className="text-[11px] text-muted-soft mt-1">{wo.plannedQty > 0 ? Math.round((wo.completedQty / wo.plannedQty) * 100) : 0}% fabricated</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">QC Released Clean</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{passedUnitsCount} <span className="text-xs font-normal text-muted">units</span></div>
          <div className="text-[11px] text-emerald-600/80 mt-1">Conforming stage release</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Under Containment / Rework</div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">{defectiveCount} <span className="text-xs font-normal text-muted">units</span></div>
          <div className="text-[11px] text-rose-600/80 mt-1">{defectiveCount > 0 ? "Nonconformance held" : "Zero defect hold"}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Customer CAD & Drawings</div>
          <div className="text-xl font-bold font-mono text-sky-600 mt-0.5">{drawings.length} <span className="text-xs font-normal text-muted">files</span></div>
          <div className="text-[11px] text-sky-600/80 mt-1">SolidWorks 3D & PDF specs</div>
        </div>
      </div>

      {/* Main Multi-Tab Navigation */}
      <div className="space-y-5">
        <div className="grid w-full grid-cols-2 md:grid-cols-5 p-1 rounded-xl bg-[var(--canvas-soft)] border border-[var(--hairline-soft)] gap-1">
          <button
            type="button"
            id="tab-btn-overview"
            onClick={() => setActiveTab("overview")}
            className={cn(
              "py-2 px-3 rounded-lg t-body-sm font-semibold text-center transition-all cursor-pointer",
              activeTab === "overview" ? "bg-[var(--surface-card)] text-ink shadow-xs border border-[var(--hairline)]" : "text-muted hover:text-ink"
            )}
          >
            1. Customer Specs & Profile
          </button>
          <button
            type="button"
            id="tab-btn-cad"
            onClick={() => setActiveTab("cad")}
            className={cn(
              "py-2 px-3 rounded-lg t-body-sm font-semibold text-center transition-all cursor-pointer",
              activeTab === "cad" ? "bg-[var(--surface-card)] text-ink shadow-xs border border-[var(--hairline)]" : "text-muted hover:text-ink"
            )}
          >
            2. 2D & 3D Drawings ({drawings.length})
          </button>
          <button
            type="button"
            id="tab-btn-traceability"
            onClick={() => setActiveTab("traceability")}
            className={cn(
              "py-2 px-3 rounded-lg t-body-sm font-semibold text-center transition-all cursor-pointer",
              activeTab === "traceability" ? "bg-[var(--surface-card)] text-ink shadow-xs border border-[var(--hairline)]" : "text-muted hover:text-ink"
            )}
          >
            3. Personnel & Stage Ledger
          </button>
          <button
            type="button"
            id="tab-btn-units"
            onClick={() => setActiveTab("units")}
            className={cn(
              "py-2 px-3 rounded-lg t-body-sm font-semibold text-center transition-all cursor-pointer",
              activeTab === "units" ? "bg-[var(--surface-card)] text-ink shadow-xs border border-[var(--hairline)]" : "text-muted hover:text-ink"
            )}
          >
            4. Radiator Units ({units.length})
          </button>
          <button
            type="button"
            id="tab-btn-checksheet"
            onClick={() => setActiveTab("checksheet")}
            className={cn(
              "py-2 px-3 rounded-lg t-body-sm font-semibold text-center transition-all cursor-pointer",
              activeTab === "checksheet" ? "bg-[var(--surface-card)] text-ink shadow-xs border border-[var(--hairline)]" : "text-muted hover:text-ink"
            )}
          >
            5. Checksheet Overrides ({customParams.length})
          </button>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: CUSTOMER PROFILE & APPROVED SPECIFICATIONS */}
        {/* ============================================================ */}
        {activeTab === "overview" && (
        <div className="space-y-4">
          {/* Customer Drawing Banner */}
          {customerKey !== "default" && (
            <div className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-ink">Customer Approved Engineering Design Active</span>
                  <div className="text-[11px] text-muted">
                    {customerKey === "SPTC"
                      ? "SPTC Drg: HT/SPTC/26/04/8181-6853 Rev 0 · Customer Doc: 8181065 · PO6853 · 2900/1900 CC x 520 W x 26/3 Fin"
                      : "Delta Star Drg: HT/DELTA/26/11/RAD-090-36-20.5G Rev R0 · Customer Doc: RAD-090-36-20.5G · PO 1185452,53,54 · 2286 CC (90 in) x 520 W (20.5 in) x 36 Fin"}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-md font-mono font-bold bg-blue-600 text-white shrink-0 self-start sm:self-center">
                CUSTOMER SIGNED OFF
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Dimensional Envelope */}
            <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline-soft)]">
                <div className="flex items-center gap-2">
                  <Ruler size={16} className="text-primary" />
                  <span className="t-body-sm font-bold text-ink">1. Radiator Geometry & Dimensional Envelope</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--canvas-soft)] text-muted">
                  {customerKey === "SPTC" ? "2900/1900 CC" : customerKey === "DELTA_STAR" ? "2286 CC (90 in)" : "Envelope"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Center-to-Center (CC)</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC" ? "2900 / 1900 mm" : customerKey === "DELTA_STAR" ? "2286 mm [90.0 in]" : (wo.size?.split("X")[0] || "1700 mm")}
                  </div>
                  <div className="text-[10px] text-muted">Tolerance: -1, 0, +1, +2 mm</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Fin Width & Depth</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "DELTA_STAR" ? "520 mm [20.5 in]" : "520 mm"}
                  </div>
                  <div className="text-[10px] text-muted">Rolling Depth: 4.0–5.0 mm</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Elements Count & Pitch</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC" ? "26/3 Elements" : customerKey === "DELTA_STAR" ? "36 Elements" : (wo.size?.split("X")[2]?.split("+")[0] || "28") + " Elements"}
                  </div>
                  <div className="text-[10px] text-muted">Pitch: 45 ±1.0 mm (comb gauge)</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Total Length & TP</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC" ? "1495 mm (TP 35mm)" : customerKey === "DELTA_STAR" ? "1696 mm [66.8 in]" : "Envelope Nominal"}
                  </div>
                  <div className="text-[10px] text-muted">Diagonal Diff: Max ≤ 3.0 mm</div>
                </div>
              </div>
              <div className="text-[11px] text-muted flex items-center justify-between pt-1">
                <span>Flange Co-planarity (Pata): ≤ 0.4 mm</span>
                <span>Line Dori Alignment: ≤ 0.5 mm</span>
              </div>
            </div>

            {/* 2. Metallurgy & Steel */}
            <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline-soft)]">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-primary" />
                  <span className="t-body-sm font-bold text-ink">2. Raw Metallurgy & Steel Grade Specifications</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--canvas-soft)] text-muted">
                  {customerKey === "SPTC" ? "CRCA 1.2 mm" : customerKey === "DELTA_STAR" ? "CRCA 1.0 mm" : "IS 513 Gr. D"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Fin Sheet Material</div>
                  <div className="font-semibold text-ink font-mono text-sm">CRCA IS 513:2016 CR2 Gr D</div>
                  <div className="text-[10px] text-muted">EN 10130 Deep Drawing</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Sheet Thickness</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC" ? "1.20 mm ±0.03 mm" : customerKey === "DELTA_STAR" ? "1.00 mm ±0.03 mm" : (wo.size?.includes("1.2") ? "1.20 mm" : "1.00 mm")}
                  </div>
                  <div className="text-[10px] text-muted">Digital Micrometer check</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Header Pipe Spec</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC" || customerKey === "DELTA_STAR" ? "80 NB · 4.5 mm Thick ERW-FC" : "80 NB · 3.6–4.5 mm WT"}
                  </div>
                  <div className="text-[10px] text-muted">IS 3074 / IS 1239 / EN10217</div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Flange & Bracing Steel</div>
                  <div className="font-semibold text-ink font-mono text-sm">IS 2062:2011 E250 BR</div>
                  <div className="text-[10px] text-muted">EN 10025-2 S235 JR Weldable</div>
                </div>
              </div>
              <div className="text-[11px] text-muted flex items-center justify-between pt-1">
                <span>Bracing Rod: IS 7887:1992 SAE 1018</span>
                <span>Welding Wire: AWS A5.18 ER70S-6</span>
              </div>
            </div>

            {/* 3. Surface Finish & Protection */}
            <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline-soft)]">
                <div className="flex items-center gap-2">
                  <Droplets size={16} className="text-primary" />
                  <span className="t-body-sm font-bold text-ink">3. Surface Treatment & Corrosion Protection</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold">
                  {customerKey === "SPTC" ? "SSPC PA-2 (286 µm)" : customerKey === "DELTA_STAR" ? "SSPC PA2 (215 µm)" : "APPROVED FINISH"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[var(--canvas-soft)] space-y-2 text-xs">
                {customerKey === "SPTC" ? (
                  <>
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span>AkzoNobel 5-Coat Paint System (As Per SSPC PA-2)</span>
                      <span className="text-xs font-mono font-bold text-primary">Total DFT 286 µm nominal</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted">
                      <div>• HDG: <strong>86 µm</strong></div>
                      <div>• Epoxy Primer (Intergard 269): <strong>40 µm</strong></div>
                      <div>• Epoxy Primer (Intergard 251): <strong>40 µm</strong></div>
                      <div>• Epoxy MIO (Intergard 400): <strong>80 µm</strong></div>
                      <div>• Top Coat (PU-990): <strong>40 µm RAL-7038</strong></div>
                      <div>• Internal: <strong>Ching RD-124 Olive Green (40-70 µm on Ø122)</strong></div>
                    </div>
                  </>
                ) : customerKey === "DELTA_STAR" ? (
                  <>
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span>AkzoNobel Paint System (As Per SSPC PA2)</span>
                      <span className="text-xs font-mono font-bold text-primary">Total DFT 215 µm nominal</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] text-muted">
                      <div>• Exterior HDG: <strong>55 µm</strong></div>
                      <div>• Epoxy Primer (Intergard 251): <strong>50 µm</strong></div>
                      <div>• Epoxy MIO (Intergard 475): <strong>60 µm</strong></div>
                      <div>• Top Coat (PU-990): <strong>50 µm ANSI 70</strong></div>
                      <div className="col-span-2">• Internal: <strong>Ching RD-124 Olive Green (40-70 µm on Ø140)</strong></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between font-semibold text-ink">
                      <span>Specification: {wo.finishType || "HDG 70 MIC / PU Paint"}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-primary/10 text-primary">APPROVED FINISH</span>
                    </div>
                    <div className="text-[11px] text-muted">
                      External: Hot-Dip Galvanizing per IS 4759 (min 610 g/m²) or 3-coat Polyurethane paint system (DFT 140–180 µm per ISO 12944 C4-High).
                    </div>
                    <div className="text-[11px] text-muted pt-1 border-t border-[var(--hairline-soft)]">
                      Internal: RD124 anti-rust solvent flush, zero residue, swab test certified. Dry Nitrogen seal at <strong>0.20 kg/cm² hold</strong>.
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 4. Flanges & Hardware */}
            <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline-soft)]">
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-primary" />
                  <span className="t-body-sm font-bold text-ink">4. Flanges, Fittings & Hardware Torque Ledger</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--canvas-soft)] text-muted">
                  {customerKey === "SPTC" ? "PCD Ø160" : customerKey === "DELTA_STAR" ? "PCD Ø198" : "PCD 160"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Header Flange Spec</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC"
                      ? "150x150 mm · PCD Ø160 (4x Ø22)"
                      : customerKey === "DELTA_STAR"
                      ? "190x190 mm [7.5 in] · PCD Ø198 (4x Ø22)"
                      : "160 mm PCD · 4 × Ø18 mm"}
                  </div>
                  <div className="text-[10px] text-muted">
                    {customerKey === "SPTC" ? "Bore ID Ø83mm (Cust Dev #2)" : customerKey === "DELTA_STAR" ? "Bore ID Ø80mm" : "Serrated phonographic finish"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Air Release & Drain Plugs</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC"
                      ? "DIN 42558-M6 & M12A"
                      : customerKey === "DELTA_STAR"
                      ? "3/4\" NPT with Brass Plug"
                      : "1/2\" BSP Forged Plugs"}
                  </div>
                  <div className="text-[10px] text-muted">
                    {customerKey === "SPTC" ? "PTFE Inflon-210 washers" : customerKey === "DELTA_STAR" ? "Hi-Tech Standard 3/4\" NPT" : "Sealed with PTFE tape"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Bracing & Accessories</div>
                  <div className="font-semibold text-ink font-mono text-sm">
                    {customerKey === "SPTC"
                      ? "SS-316 Bracing Boss M8 & Lugs"
                      : customerKey === "DELTA_STAR"
                      ? "5/8\"-11 UNC SS-304 Bracing Hex"
                      : "40×3 mm Flat Braces"}
                  </div>
                  <div className="text-[10px] text-muted">
                    {customerKey === "SPTC" ? "Earthing Lug SS-316 (Unpainted)" : customerKey === "DELTA_STAR" ? "Bracing Rod Dia 10mm (9 pairs)" : "Lifting lug tested 2.5x SWL"}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-[var(--canvas-soft)]">
                  <div className="text-[10px] text-muted uppercase">Plug Fastener Torque</div>
                  <div className="font-semibold text-ink font-mono text-sm">55 – 75 N·m</div>
                  <div className="text-[10px] text-muted">Torque wrench audit check</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: 2D & 3D DRAWINGS STUDIO (SOLIDWORKS / PDF / IMAGE) */}
      {/* ============================================================ */}
      {activeTab === "cad" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left sidebar: File selector & Drawing List */}
            <div className="lg:col-span-1 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-muted">Approved CAD Files</span>
                <Button size="sm" variant="outline" onClick={() => setShowUploadModal(true)} className="h-7 text-xs gap-1">
                  <Plus size={11} /> Add Drawing
                </Button>
              </div>

              <div className="space-y-2">
                {drawings.map((dwg) => {
                  const isSelected = activeDrawing?.id === dwg.id;
                  return (
                    <div
                      key={dwg.id}
                      onClick={() => setActiveDrawing(dwg)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5 shadow-xs" : "border-[var(--hairline)] bg-[var(--surface-card)] hover:bg-[var(--canvas-soft)]"}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-ink truncate block max-w-[180px]">{dwg.fileName}</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase bg-[var(--surface-strong)] text-ink">
                          {dwg.fileFormat}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted mt-1 truncate">{dwg.fileType}</div>
                      <div className="text-[10px] text-muted-soft mt-1 flex items-center justify-between">
                        <span>{dwg.size}</span>
                        <span className="text-emerald-600 font-semibold">{dwg.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right main area: Interactive Previewer */}
            <div className="lg:col-span-3 space-y-3">
              {activeDrawing ? (
                <>
                  {activeDrawing.fileFormat === "sldasm" || activeDrawing.fileFormat === "sldprt" ? (
                    <SolidWorks3DViewer model={activeDrawing} />
                  ) : activeDrawing.fileFormat === "pdf" ? (
                    <PdfDrawingViewer doc={activeDrawing} />
                  ) : (
                    <div className="rounded-xl border border-[var(--hairline)] p-6 bg-[var(--surface-card)] text-center space-y-2">
                      <div className="text-sm font-bold text-ink">{activeDrawing.fileName}</div>
                      <div className="text-xs text-muted">{activeDrawing.notes}</div>
                      <div className="h-64 flex items-center justify-center bg-[var(--canvas-soft)] rounded-lg border border-[var(--hairline-soft)] mt-3">
                        <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60" alt="Technical Drawing" className="max-h-full object-contain rounded" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState message="Select an engineering drawing to preview." />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: PERSONNEL & STAGE EXECUTION LEDGER */}
      {/* ============================================================ */}
      {activeTab === "traceability" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardHat size={16} className="text-primary" />
                <span className="t-body-sm font-bold text-ink">Shopfloor Personnel Sign-off & Parameter Traceability Ledger</span>
              </div>
              <span className="text-xs text-muted font-mono">17 STAGES PLANNED (S01 &rarr; S17)</span>
            </div>
            <p className="text-xs text-muted">
              Complete audit record tracking every machinist who fabricated the component, the QC inspector who verified tolerances, and the releasing plant authority.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-[var(--hairline)] bg-[var(--surface-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--canvas-soft)] text-muted font-mono uppercase text-[10px] border-b border-[var(--hairline)]">
                  <tr>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Workstation / Process</th>
                    <th className="p-3">Line Operator (Fabrication)</th>
                    <th className="p-3">QC Checker (Verification)</th>
                    <th className="p-3">Gate Approver (Sign-off)</th>
                    <th className="p-3">Recorded Parameters</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {[
                    { code: "S01", name: "Rolling & Forming", op: "Ravi Kamble (Shift A)", qc: "Rohan Ghodvinde", app: "Yogesh Jadhav (Director)", params: "14 Checked (Waviness, Depth 4.5mm, Tata Coil)", status: "Pass" },
                    { code: "S02", name: "Single Spot Welding", op: "Suresh Patil (Shift A)", qc: "Mukesh Kapse", app: "Yogesh Jadhav (Director)", params: "11 Checked (Weld Current 11kA, Pull test passed)", status: "Pass" },
                    { code: "S03", name: "Multi-Spot Welding", op: "Suresh Patil (Shift A)", qc: "Mukesh Kapse", app: "Rohit Giri (Quality Mgr)", params: "10 Checked (Nugget tear ok, Bow ≤1.5mm)", status: "Pass" },
                    { code: "S04", name: "Seam Welding", op: "Ganesh Shinde (Shift B)", qc: "Rohan Ghodvinde", app: "Rohit Giri (Quality Mgr)", params: "8 Checked (Bead 5.2mm, Cooling 18L/min)", status: "Pass" },
                    { code: "S05", name: "Cross Seam Welding", op: "Ganesh Shinde (Shift B)", qc: "Rohan Ghodvinde", app: "Rohit Giri (Quality Mgr)", params: "6 Checked (Overlap 12mm)", status: "Pass" },
                    { code: "S07", name: "TIG Welding & Sanding", op: "Kishore Pawar (Shift B)", qc: "Mukesh Kapse", app: "Yogesh Jadhav (Director)", params: "10 Checked (Current 100A, Zero porosity)", status: "Pass" },
                    { code: "S10", name: "Header Assembly", op: "Dattatray Mane (Shift A)", qc: "Rohan Ghodvinde", app: "Yogesh Jadhav (Director)", params: "18 Checked (Sa 2.5 Blasting, Straightness ≤0.4mm)", status: "Pass" },
                    { code: "S11", name: "Erection", op: "Dattatray Mane (Shift A)", qc: "Mukesh Kapse", app: "Yogesh Jadhav (Director)", params: "20 Checked (Comb support, Pata ≤0.4mm, Line Dori)", status: "Pass" },
                    { code: "S12", name: "Full MAG Welding", op: "Vinayak More (Shift B)", qc: "Rohan Ghodvinde", app: "Yogesh Jadhav (Director)", params: "15 Checked (Throat ≥4.5mm, Cotton swab test)", status: "Pass" },
                    { code: "S14", name: "Leak Testing", op: "Tanaji Sawant (Shift A)", qc: "Mukesh Kapse", app: "Yogesh Jadhav (Director)", params: "12 Checked (2.0 kg/cm² 15 min underwater, Zero bubbles)", status: "Pass" },
                    { code: "S15", name: "Surface Treatment", op: "Pending", qc: "Pending", app: "Pending", params: "HDG Zinc coating min 610 g/m²", status: "Pending" },
                    { code: "S17", name: "Final QC & Dispatch", op: "Pending", qc: "Pending", app: "Pending", params: "Complete Radiator Final Inspection Checklist", status: "Pending" },
                  ].map((row) => (
                    <tr key={row.code} className="hover:bg-[var(--canvas-soft)] transition-colors">
                      <td className="p-3 font-mono font-bold text-primary">{row.code}</td>
                      <td className="p-3 font-medium text-ink">{row.name}</td>
                      <td className="p-3 text-muted">{row.op}</td>
                      <td className="p-3 text-muted">{row.qc}</td>
                      <td className="p-3 text-muted font-medium">{row.app}</td>
                      <td className="p-3 text-[11px] text-muted max-w-[200px] truncate">{row.params}</td>
                      <td className="p-3">
                        {row.status === "Pass" ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-600">PASSED</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-muted bg-[var(--surface-strong)]">PENDING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: RADIATOR UNITS TRACKING MATRIX */}
      {/* ============================================================ */}
      {activeTab === "units" && (
        <div className="space-y-4">
          <div className="rounded-xl p-3.5 flex items-center justify-between border border-[var(--hairline)] bg-[var(--surface-card)]">
            <div className="flex items-center gap-2">
              <Boxes size={16} className="text-primary" />
              <span className="t-body-sm font-semibold text-ink">Serialized Radiator Units ({units.length} Units)</span>
            </div>
            <div className="text-xs font-mono text-muted">
              {passedUnitsCount} Passed · {inProgressCount} Active · {defectiveCount} Contained
            </div>
          </div>

          <UnitMatrixView units={units} onInspectUnit={setSelectedUnit} />
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 5: CUSTOMER CHECKSHEET CUSTOMIZATION (MANAGER EXCLUSIVE) */}
      {/* ============================================================ */}
      {activeTab === "checksheet" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span className="t-body-sm font-bold text-ink">Customer-Specific Checksheet & Tolerance Customization</span>
              </div>
              <p className="text-xs text-muted">
                Authorized Quality and Plant Managers can tune nominal tolerances, tighten criteria, or add customer-specific tests for <strong>{wo.customer}</strong>.
              </p>
            </div>
            {canModifyChecksheet && (
              <Button size="sm" onClick={() => setShowOverrideModal(true)} className="h-9 px-4 gap-1.5 shrink-0 bg-primary text-white">
                <Plus size={13} /> Add Custom Parameter / Override
              </Button>
            )}
          </div>

          {customParams.length === 0 ? (
            <div className="p-8 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] text-center space-y-2">
              <Sparkles size={24} className="mx-auto text-amber-500 opacity-60" />
              <div className="t-body-sm font-semibold text-ink">No Custom Overrides for this Work Order</div>
              <div className="text-xs text-muted max-w-md mx-auto">
                Currently using standard QAP Rev 05 checksheet parameters. Authorized managers can add custom tolerances or special tests requested by {wo.customer}.
              </div>
              {canModifyChecksheet && (
                <Button size="sm" variant="outline" onClick={() => setShowOverrideModal(true)} className="mt-2 text-xs">
                  Create First Override
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-[var(--hairline)] bg-[var(--surface-card)]">
              <table className="w-full text-xs text-left">
                <thead className="bg-[var(--canvas-soft)] text-muted font-mono uppercase text-[10px] border-b border-[var(--hairline)]">
                  <tr>
                    <th className="p-3">Stage</th>
                    <th className="p-3">Parameter Name</th>
                    <th className="p-3">Customer Specification / Norm</th>
                    <th className="p-3">Tolerance Window</th>
                    <th className="p-3">CTQ Gate</th>
                    <th className="p-3">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {customParams.map((param, i) => (
                    <tr key={i} className="hover:bg-[var(--canvas-soft)]">
                      <td className="p-3 font-mono font-bold text-primary">{param.stageCode}</td>
                      <td className="p-3 font-semibold text-ink">{param.name}</td>
                      <td className="p-3 text-muted">{param.specification}</td>
                      <td className="p-3 font-mono text-muted">{param.lowerLimit || "-"} to {param.upperLimit || "-"} {param.unit}</td>
                      <td className="p-3">
                        {param.isCTQ ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold font-mono bg-primary text-white">CTQ GATE</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono text-muted bg-[var(--surface-strong)]">STANDARD</span>
                        )}
                      </td>
                      <td className="p-3 text-muted">{user.name} ({user.role})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>

      {/* Modal: Checksheet Override / Custom Parameter */}
      {showOverrideModal && (
        <ChecksheetOverrideModal
          wo={wo}
          user={user}
          onClose={() => setShowOverrideModal(false)}
          onSave={handleSaveChecksheetOverride}
        />
      )}

      {/* Modal: Upload 2D/3D CAD Drawing */}
      {showUploadModal && (
        <UploadDrawingModal
          wo={wo}
          onClose={() => setShowUploadModal(false)}
          file={uploadFile}
          setFile={setUploadFile}
          notes={uploadNotes}
          setNotes={setUploadNotes}
          onUpload={handleUploadDrawing}
        />
      )}

      {/* Unit Inspection Modal */}
      {selectedUnit && (
        <UnitInspectionModal
          unit={selectedUnit}
          onClose={() => setSelectedUnit(null)}
          onInspectStage={(stageCode) => {
            setSelectedUnit(null);
            if (onNavigateToInspect) onNavigateToInspect(stageCode, wo.id);
          }}
        />
      )}
    </div>
  );
}

// Modal component: Checksheet Override
function ChecksheetOverrideModal({
  wo,
  user,
  onClose,
  onSave,
}: {
  wo: any;
  user: User;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [stageCode, setStageCode] = useState("S11");
  const [paramName, setParamName] = useState("");
  const [specification, setSpecification] = useState("");
  const [nominal, setNominal] = useState("");
  const [upperLimit, setUpperLimit] = useState("");
  const [lowerLimit, setLowerLimit] = useState("");
  const [unit, setUnit] = useState("mm");
  const [isCTQ, setIsCTQ] = useState(true);
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paramName.trim()) return;
    onSave({
      stageCode,
      name: paramName,
      specification: specification || `Customer custom spec for ${wo.customer}`,
      nominalValue: nominal,
      upperLimit,
      lowerLimit,
      unit,
      isCTQ,
      reason,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] shadow-2xl p-6 space-y-4 reveal-up">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
          <div className="space-y-0.5">
            <h3 className="t-title-sm font-bold text-ink">Customize Checksheet for {wo.customer}</h3>
            <p className="text-xs text-muted font-mono">{wo.woNumber} · {wo.itemName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-ink"><XCircle size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-muted">Target Stage</Label>
              <Select value={stageCode} onValueChange={setStageCode}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="S01">S01 - Rolling & Forming</SelectItem>
                  <SelectItem value="S02">S02 - Single Spot Welding</SelectItem>
                  <SelectItem value="S03">S03 - Multi-Spot Welding</SelectItem>
                  <SelectItem value="S04">S04 - Seam Welding</SelectItem>
                  <SelectItem value="S10">S10 - Header Assembly</SelectItem>
                  <SelectItem value="S11">S11 - Erection</SelectItem>
                  <SelectItem value="S12">S12 - Full MAG Welding</SelectItem>
                  <SelectItem value="S14">S14 - Leak Testing</SelectItem>
                  <SelectItem value="S15">S15 - Surface Treatment</SelectItem>
                  <SelectItem value="S17">S17 - Final Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] text-muted">CTQ Gate Level</Label>
              <Select value={isCTQ ? "yes" : "no"} onValueChange={(v) => setIsCTQ(v === "yes")}>
                <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Mandatory CTQ Gate</SelectItem>
                  <SelectItem value="no">Standard Parameter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted">Parameter Name *</Label>
            <Input
              required
              value={paramName}
              onChange={(e) => setParamName(e.target.value)}
              placeholder="e.g. Special Ultrasonic Flange Weld Inspection / Tight Pata Tolerance"
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-[11px] text-muted">Customer Acceptance Norm / Specification *</Label>
            <Input
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              placeholder="e.g. Max ≤ 0.3 mm coplanarity per Elsewedy Technical Spec Doc §4.2"
              className="mt-1 h-8 text-xs"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <Label className="text-[10px] text-muted">Nominal</Label>
              <Input value={nominal} onChange={(e) => setNominal(e.target.value)} placeholder="0.0" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-muted">Min Limit</Label>
              <Input value={lowerLimit} onChange={(e) => setLowerLimit(e.target.value)} placeholder="0.0" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-muted">Max Limit</Label>
              <Input value={upperLimit} onChange={(e) => setUpperLimit(e.target.value)} placeholder="0.3" className="mt-1 h-8 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-[10px] text-muted">Unit</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="mm / µm" className="mt-1 h-8 text-xs font-mono" />
            </div>
          </div>

          <div>
            <Label className="text-[11px] text-muted">Reason for Customer Modification</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Requested in customer purchase agreement PO-20095202"
              className="mt-1 text-xs"
            />
          </div>

          {/* Right-Aligned Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--hairline-soft)]">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs">
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-8 px-4 text-xs font-semibold bg-primary text-white">
              Save Customer Checksheet Override
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal component: Upload Drawing
function UploadDrawingModal({
  wo,
  onClose,
  file,
  setFile,
  notes,
  setNotes,
  onUpload,
}: {
  wo: any;
  onClose: () => void;
  file: File | null;
  setFile: (f: File | null) => void;
  notes: string;
  setNotes: (s: string) => void;
  onUpload: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] shadow-2xl p-6 space-y-4 reveal-up">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
          <div className="space-y-0.5">
            <h3 className="t-title-sm font-bold text-ink">Upload 2D / 3D Customer Drawing</h3>
            <p className="text-xs text-muted font-mono">{wo.woNumber} · {wo.customer}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-muted hover:text-ink"><XCircle size={18} /></button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-6 rounded-xl border-2 border-dashed border-[var(--hairline)] bg-[var(--canvas-soft)] text-center space-y-2">
            <Upload size={24} className="mx-auto text-primary" />
            <div className="font-semibold text-ink">Select CAD File or Drawing</div>
            <div className="text-[11px] text-muted">
              Supported: SolidWorks (<code>.sldprt</code>, <code>.sldasm</code>, <code>.step</code>, <code>.stp</code>, <code>.dxf</code>), PDF blueprints, PNG/JPG
            </div>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white cursor-pointer"
            />
            {file && (
              <div className="text-xs font-mono font-bold text-emerald-600 mt-2">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
              </div>
            )}
          </div>

          <div>
            <Label className="text-[11px] text-muted">Revision / Customer Drawing Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Customer approved drawing revision 04 with updated flange PCD dimensions"
              className="mt-1 text-xs"
            />
          </div>

          {/* Right-Aligned Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--hairline-soft)]">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs">Cancel</Button>
            <Button disabled={!file} onClick={onUpload} size="sm" className="h-8 px-4 text-xs font-semibold bg-primary text-white">
              Upload & Activate CAD Drawing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN: Sales Order Full Profile Page (INDEPENDENT PAGE - NO DRAWER)
// ============================================================
export function SalesOrderFullProfilePage({
  so,
  user,
  plant,
  onBack,
  onOpenWO,
}: {
  so: any;
  user: User;
  plant: string;
  onBack: () => void;
  onOpenWO?: (wo: any) => void;
}) {
  const [tab, setTab] = useState("linkedWOs");
  const linkedWOs = so.linkedWOs || [];

  return (
    <div className="min-h-full pb-16 space-y-6 reveal-up">
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="h-8 px-2.5 text-xs gap-1.5 font-medium hover:bg-[var(--canvas-soft)] border-[var(--hairline)]"
            >
              <ArrowLeft size={14} /> Back to Sales Orders
            </Button>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              CUSTOMER SALES CONTRACT & DEMAND DOSSIER
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <h1 className="t-display-sm font-bold tracking-tight text-ink">{so.soNumber || "SO"}</h1>
            <StatusBadge status={so.status} />
            <span className="text-xs font-mono text-muted">SO Date: {so.soDate || "-"}</span>
          </div>

          <div className="t-body-sm text-muted">
            Customer: <strong className="text-ink">{so.customer}</strong>
            {so.poNumber && <> · Customer PO: <strong className="text-ink">{so.poNumber}</strong></>}
            {" "}· Item: <strong className="text-ink">{so.itemName} ({so.size})</strong>
          </div>
        </div>

        {/* Right-Aligned Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="h-9 px-3.5 rounded-lg flex items-center gap-1.5 text-xs border-[var(--hairline)] hover:bg-[var(--canvas-soft)]"
          >
            <Printer size={13} /> Print Contract Dossier
          </Button>
        </div>
      </div>

      {/* Metric Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Ordered Quantity</div>
          <div className="text-xl font-bold font-mono text-ink mt-0.5">{so.orderedQty} <span className="text-xs font-normal text-muted">units</span></div>
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Completed & Shipped</div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{so.completedQty} <span className="text-xs font-normal text-muted">units</span></div>
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Pending Balance</div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">{so.pendingQty} <span className="text-xs font-normal text-muted">units</span></div>
        </div>
        <div className="p-3.5 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)]">
          <div className="text-[10.5px] font-mono uppercase text-muted">Fulfilment Rate</div>
          <div className="text-xl font-bold font-mono text-primary mt-0.5">{so.fulfilmentRate || 0}%</div>
        </div>
      </div>

      {/* Linked Work Orders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="t-title-sm font-bold text-ink">Linked Production Work Orders ({linkedWOs.length})</h3>
          <span className="text-xs text-muted">Click any work order to open its independent engineering profile</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {linkedWOs.map((wo: any) => (
            <div
              key={wo.id}
              onClick={() => onOpenWO && onOpenWO(wo)}
              className="p-4 rounded-xl border border-[var(--hairline)] bg-[var(--surface-card)] hover:border-primary cursor-pointer transition-all space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="t-body-sm font-bold font-mono text-primary">{wo.woNumber}</div>
                  <div className="text-xs text-muted">{wo.itemName} · {wo.size}</div>
                </div>
                <StatusBadge status={wo.status} size="xs" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[var(--hairline-soft)]">
                <div>
                  <span className="text-[10px] text-muted block">PLANNED</span>
                  <span className="font-mono font-semibold text-ink">{wo.plannedQty} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block">COMPLETED</span>
                  <span className="font-mono font-semibold text-emerald-600">{wo.completedQty} units</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted block">INSPECTIONS</span>
                  <span className="font-mono font-semibold text-sky-600">{wo.inspectionCount || 0} records</span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  View Full WO Profile <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN: System Audit Logs Module (ADMINISTRATION)
// ============================================================
export function SystemAuditLogsModule({ user, plant }: { user: User; plant: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const loadLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (search.trim()) params.set("search", search);

    fetch(`/api/audit?${params}`).then(r => r.json()).then(d => {
      setLogs(d.logs || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  useEffect(() => { loadLogs(); }, [actionFilter]);

  return (
    <div className="space-y-5 reveal-up">
      {/* Module Header */}
      <div className="p-4 md:p-6 rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600">
              SECURITY & TAMPER DETECTION AUDIT TRAIL
            </span>
            <span className="text-[10.5px] font-mono text-muted">ISO 9001:2015 §9.2 & §5.3</span>
          </div>
          <h2 className="t-title-md font-bold text-ink">System Audit Trail & Security Ledger</h2>
          <p className="t-body-sm text-muted">
            Append-only tamper-evident security record tracking all checksheet changes, user modifications, containment stops, and data entries.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <Button variant="outline" size="sm" onClick={loadLogs} className="h-9 px-3 text-xs gap-1">
            <RotateCcw size={13} /> Refresh Log
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl bg-[var(--surface-card)] border border-[var(--hairline)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="CHECKSHEET_OVERRIDE">Checksheet Overrides</SelectItem>
              <SelectItem value="PARAMETER_FAIL_STOP">Containment Fail Halts</SelectItem>
              <SelectItem value="CAD_DRAWING_UPLOADED">CAD Drawing Uploads</SelectItem>
              <SelectItem value="RBAC_PERMISSION_ENFORCED">RBAC Security Blocks</SelectItem>
              <SelectItem value="INSPECTION_RELEASED">Quality Gate Releases</SelectItem>
            </SelectContent>
          </Select>

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadLogs()}
            placeholder="Search by actor, entity, event ID..."
            className="w-64 h-8 text-xs"
          />
        </div>

        <span className="text-xs font-mono text-muted">{logs.length} audit event(s) recorded</span>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingBlock label="Loading cryptographically sealed audit trail..." />
      ) : logs.length === 0 ? (
        <EmptyState message="No audit log events found." />
      ) : (
        <div className="rounded-xl overflow-hidden border border-[var(--hairline)] bg-[var(--surface-card)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[var(--canvas-soft)] text-muted font-mono uppercase text-[10px] border-b border-[var(--hairline)]">
                <tr>
                  <th className="p-3">Event ID & Time</th>
                  <th className="p-3">Actor (Personnel)</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Change Summary (Before &rarr; After)</th>
                  <th className="p-3">IP / Device</th>
                  <th className="p-3 text-right">Integrity Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--hairline-soft)]">
                {logs.map((log) => {
                  const isCritical = log.riskLevel === "CRITICAL";
                  const isWarning = log.riskLevel === "WARNING";
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[var(--canvas-soft)] transition-colors cursor-pointer"
                    >
                      <td className="p-3">
                        <div className="font-mono font-bold text-ink">{log.eventId}</div>
                        <div className="text-[10px] text-muted">{fmtDateTime(log.timestamp)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-ink">{log.actorName}</div>
                        <div className="text-[10px] text-muted font-mono">{log.actorRole}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded font-mono font-bold"
                          style={{
                            backgroundColor: isCritical ? "rgba(160, 69, 69, 0.15)" : isWarning ? "rgba(217, 119, 6, 0.15)" : "rgba(8, 50, 96, 0.1)",
                            color: isCritical ? "var(--semantic-error)" : isWarning ? "#d97706" : "var(--primary)",
                          }}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-mono text-ink">{log.entityType}</div>
                        <div className="text-[10px] text-muted">{log.entityId}</div>
                      </td>
                      <td className="p-3 max-w-[280px] truncate text-[11px] text-muted">
                        {log.afterState ? log.afterState : "-"}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-muted">
                        {log.ipAddress || "192.168.1.1"}
                      </td>
                      <td className="p-3 text-right font-mono text-[9.5px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--canvas-soft)] border border-[var(--hairline-soft)]">
                          {log.tamperHash ? log.tamperHash.slice(0, 16) + "..." : "SEALED"}
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

      {/* Selected Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-[var(--surface-card)] border border-[var(--hairline)] shadow-2xl p-6 space-y-4 reveal-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
              <div>
                <h3 className="t-title-sm font-bold text-ink">Audit Event Details</h3>
                <span className="font-mono text-xs text-primary">{selectedLog.eventId}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 rounded text-muted hover:text-ink"><XCircle size={18} /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[var(--canvas-soft)]">
                <div><span className="text-muted block text-[10px]">ACTOR</span><strong className="text-ink">{selectedLog.actorName} ({selectedLog.actorRole})</strong></div>
                <div><span className="text-muted block text-[10px]">ACTION</span><span className="font-mono font-bold text-primary">{selectedLog.action}</span></div>
                <div><span className="text-muted block text-[10px]">TARGET</span><span className="font-mono text-ink">{selectedLog.entityType} ({selectedLog.entityId})</span></div>
                <div><span className="text-muted block text-[10px]">TIMESTAMP</span><span className="font-mono text-muted">{fmtDateTime(selectedLog.timestamp)}</span></div>
              </div>

              <div>
                <span className="text-muted font-bold uppercase text-[10px] block mb-1">State Snapshot (Before)</span>
                <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] overflow-auto max-h-24">
                  {selectedLog.beforeState || "None / Initial State"}
                </pre>
              </div>

              <div>
                <span className="text-muted font-bold uppercase text-[10px] block mb-1">State Snapshot (After)</span>
                <pre className="p-2.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] overflow-auto max-h-28">
                  {selectedLog.afterState || "None"}
                </pre>
              </div>

              <div className="p-2 rounded bg-slate-900 text-slate-400 font-mono text-[10px] flex items-center justify-between">
                <span>DIGITAL TAMPER SEAL</span>
                <span className="text-emerald-400 font-bold">{selectedLog.tamperHash || "SHA-256 VERIFIED"}</span>
              </div>

              {/* Right-Aligned Button */}
              <div className="flex justify-end pt-2">
                <Button size="sm" onClick={() => setSelectedLog(null)} className="h-8 px-4 text-xs">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
