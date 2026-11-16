"use client";

import { useState, useRef, useMemo, ChangeEvent, DragEvent } from "react";
import {
  Camera, Upload, FileText, Image as ImageIcon, X, ZoomIn, Download,
  FileSpreadsheet, AlertTriangle, CheckCircle2, ChevronRight, Tag
} from "lucide-react";

export interface EvidenceItem {
  id: string;
  name: string;
  type: "image" | "document";
  mimeType: string;
  size: number;
  category: string;
  dataUrl: string;
  notes?: string;
  uploadedAt: string;
}

// Stage and defect tailored recommendations for shopfloor proof capture
export function getProofRecommendations(stageCode?: string, defectCategory?: string): string[] {
  const code = (stageCode || "").toUpperCase();
  const defect = (defectCategory || "").toLowerCase();

  const recommendations: string[] = [];

  // Stage-specific criteria
  if (code === "S01" || code === "S02" || code === "S03" || defect.includes("sheet") || defect.includes("burr") || defect.includes("thickness")) {
    recommendations.push(
      "Sheet Thickness Micrometer Reading",
      "Cut Edge Burr / Waviness Photo",
      "Coil Mill Test Certificate (MTC)",
      "Dimensional Inspection Sheet (QCI/F/01)"
    );
  } else if (code.startsWith("S04") || code.startsWith("S05") || code.startsWith("S06") || code.startsWith("S07") || defect.includes("spot") || defect.includes("seam")) {
    recommendations.push(
      "Spot Weld Nugget Pull-Off Test",
      "Seam Weld Penetration Macro Photo",
      "Weld Seam Burn-through / Porosity Photo",
      "Welder Qualification & WPS Parameter Sheet"
    );
  } else if (code.startsWith("S08") || code.startsWith("S09") || code.startsWith("S10") || defect.includes("header") || defect.includes("flange") || defect.includes("pipe")) {
    recommendations.push(
      "Flange Hole Pitch / PCD Vernier Reading",
      "Header Pipe Bevel Slag / Angle Photo",
      "Hole Diameter Tolerance Vernier Gauge",
      "Header Pipe Cut Length Measurement"
    );
  } else if (code.startsWith("S11") || code.startsWith("S12") || code.startsWith("S13") || defect.includes("assembly") || defect.includes("weld")) {
    recommendations.push(
      "Center-to-Center Bow / Squareness Gauge Photo",
      "Fillet Weld Throat / Undercut Defect Photo",
      "Internal Spatter / Foreign Object Photo",
      "WPS Parameter Adherence Record"
    );
  } else if (code === "S14" || defect.includes("leak") || defect.includes("pressure") || defect.includes("hydro")) {
    recommendations.push(
      "Soap Bubble Leak Point Close-up Photo",
      "Pressure Drop Dial Gauge Reading (2.0 kg/cm²)",
      "Immersion Water Tank Leak Bubble Photo",
      "Hydro Test Chart Recorder Log"
    );
  } else if (code.startsWith("S15") || code.startsWith("S16") || code.startsWith("S17") || code.startsWith("S18") || code.startsWith("S19") || defect.includes("zinc") || defect.includes("galvaniz") || defect.includes("dross")) {
    recommendations.push(
      "Elcometer Zinc DFT Gauge Reading (min 70µm)",
      "Dross / Ash / Roughness Surface Defect Photo",
      "Flux & Acid Bath Lab Analysis Certificate",
      "Zinc Coating Knife Adhesion Test Photo"
    );
  } else if (code.startsWith("S20") || code.startsWith("S21") || code.startsWith("S22") || code.startsWith("S23") || code.startsWith("S24") || code.startsWith("S25") || code.startsWith("S26") || code.startsWith("S27") || code.startsWith("S28") || code.startsWith("S29") || code.startsWith("S30") || code.startsWith("S31") || code.startsWith("S32") || code.startsWith("S33") || defect.includes("paint") || defect.includes("dft") || defect.includes("coat")) {
    recommendations.push(
      "Surface Profile Gauge Photo (Sa 2.5 standard)",
      "Paint Dry Film Thickness (DFT) Gauge Reading",
      "Cross-Hatch Paint Adhesion Test (ASTM D3359)",
      "Internal Borescope Cleanliness Photo",
      "Paint Batch Test Certificate (MTC)"
    );
  } else if (code.startsWith("S34") || code.startsWith("S35") || code.startsWith("S36") || code.startsWith("S37") || code.startsWith("S38") || defect.includes("final") || defect.includes("dispatch") || defect.includes("pack")) {
    recommendations.push(
      "4-Angle Radiator Full Assembly Photo",
      "Nitrogen Sealing Valve & Pressure Dial Reading",
      "ISPM-15 Wooden Pallet Heat Treatment Stamp",
      "Customer Pre-Dispatch Inspection Certificate"
    );
  } else {
    recommendations.push(
      "Defect Visual Close-up Photo",
      "Measurement Instrument / Gauge Reading",
      "Calibration / Lab Test Certificate PDF",
      "Nonconformance Incident Documentation"
    );
  }

  return recommendations;
}

// Format bytes into readable KB/MB
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// -------------------------------------------------------------
// Interactive Upload Studio for Inspection Forms
// -------------------------------------------------------------
export function EvidenceUploadStudio({
  items,
  onChange,
  stageCode,
  defectCategory,
  hasFailure = false,
}: {
  items: EvidenceItem[];
  onChange: (items: EvidenceItem[]) => void;
  stageCode?: string;
  defectCategory?: string;
  hasFailure?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [activePreview, setActivePreview] = useState<EvidenceItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const recommendations = useMemo(
    () => getProofRecommendations(stageCode, defectCategory),
    [stageCode, defectCategory]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith("image/");
      const isDoc = file.type.includes("pdf") || file.type.includes("sheet") || file.type.includes("excel") || file.type.includes("word") || file.type.includes("text") || file.name.endsWith(".pdf") || file.name.endsWith(".xlsx") || file.name.endsWith(".docx");

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const newItem: EvidenceItem = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: isImg ? "image" : "document",
          mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "application/octet-stream"),
          size: file.size,
          category: selectedCategory || (isImg ? "Visual Defect Proof" : "Inspection Document"),
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        onChange([...items, newItem]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeItem = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  const updateItemCategory = (id: string, cat: string) => {
    onChange(items.map((it) => (it.id === id ? { ...it, category: cat } : it)));
  };

  const updateItemNotes = (id: string, notes: string) => {
    onChange(items.map((it) => (it.id === id ? { ...it, notes } : it)));
  };

  return (
    <div className="space-y-3">
      {/* Failure alert banner if test has failed but no visual proof attached */}
      {hasFailure && items.length === 0 && (
        <div
          className="rounded-lg p-3 flex items-start gap-2.5 transition-all animate-pulse"
          style={{
            backgroundColor: "rgba(160, 69, 69, 0.08)",
            border: "1px solid var(--semantic-error)",
          }}
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
          <div className="t-body-sm" style={{ color: "var(--semantic-error)" }}>
            <strong>Visual / Document Proof Strongly Recommended:</strong> This inspection has flagged a failure. Upload photos or gauge documents below to provide evidence for the Nonconformance Report (NCR) and Rework Job Order.
          </div>
        </div>
      )}

      {/* Recommended proof categories */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="t-label" style={{ color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 10 }}>
            Recommended Proof Category
          </span>
          <span className="t-label" style={{ color: "var(--muted-soft)", fontSize: 10 }}>
            Click to tag upcoming upload
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {recommendations.map((rec) => {
            const isSelected = selectedCategory === rec;
            return (
              <button
                key={rec}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? "" : rec)}
                className="px-2.5 py-1 rounded-md text-left transition-all"
                style={{
                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--hairline)",
                  backgroundColor: isSelected ? "rgba(8, 50, 96, 0.08)" : "var(--surface-card)",
                  color: isSelected ? "var(--primary)" : "var(--ink)",
                  fontSize: 11,
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span className="inline-flex items-center gap-1">
                  <Tag size={10} style={{ color: isSelected ? "var(--primary)" : "var(--muted)" }} />
                  {rec}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-5 text-center cursor-pointer transition-colors"
        style={{
          border: isDragging ? "2px dashed var(--primary)" : "1px dashed var(--hairline)",
          backgroundColor: isDragging ? "rgba(8, 50, 96, 0.04)" : "var(--canvas-soft)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,.xlsx,.xls,.docx,.txt"
          className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
        />
        <div className="flex justify-center items-center gap-2 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
          >
            <Camera size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--surface-card)", border: "1px solid var(--hairline)" }}
          >
            <FileText size={18} style={{ color: "var(--muted)" }} />
          </div>
        </div>
        <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>
          Upload Visual Proof or Inspection Document
        </div>
        <div className="t-label mt-1" style={{ color: "var(--muted)" }}>
          Drag & drop photos (.jpg, .png, .webp) or documents (.pdf, .xlsx, .docx) · or <span style={{ color: "var(--primary)", textDecoration: "underline" }}>browse device</span>
        </div>
        {selectedCategory && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs" style={{ backgroundColor: "rgba(8, 50, 96, 0.08)", color: "var(--primary)" }}>
            <Tag size={10} /> Active Category Tag: <strong>{selectedCategory}</strong>
          </div>
        )}
      </div>

      {/* Uploaded items grid */}
      {items.length > 0 && (
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between">
            <span className="t-label" style={{ color: "var(--ink)", fontWeight: 600 }}>
              Attached Proofs ({items.length})
            </span>
            <span className="t-label" style={{ color: "var(--muted)" }}>
              Stored with inspection record & passed to NCR / Rework
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-2.5 flex items-start gap-2.5 relative group"
                style={{
                  backgroundColor: "var(--surface-card)",
                  border: "1px solid var(--hairline)",
                }}
              >
                {/* Thumbnail / Icon */}
                {item.type === "image" ? (
                  <div
                    onClick={() => setActivePreview(item)}
                    className="w-16 h-16 rounded overflow-hidden shrink-0 cursor-zoom-in relative bg-neutral-900 flex items-center justify-center"
                    style={{ border: "1px solid var(--hairline)" }}
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn size={14} className="text-white" />
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded shrink-0 flex flex-col items-center justify-center"
                    style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}
                  >
                    {item.name.endsWith(".xlsx") || item.name.endsWith(".xls") ? (
                      <FileSpreadsheet size={22} style={{ color: "#4a7c5e" }} />
                    ) : (
                      <FileText size={22} style={{ color: "var(--primary)" }} />
                    )}
                    <span className="text-[9px] mt-1 uppercase font-bold" style={{ color: "var(--muted)" }}>
                      {item.name.split(".").pop()}
                    </span>
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="t-body-sm font-medium truncate" style={{ color: "var(--ink)" }} title={item.name}>
                      {item.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                      style={{ color: "var(--muted)" }}
                      title="Remove proof"
                    >
                      <X size={13} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="t-label text-[10px]" style={{ color: "var(--muted)" }}>
                      {formatFileSize(item.size)}
                    </span>
                    <span className="t-label text-[10px]" style={{ color: "var(--muted)" }}>·</span>
                    <span
                      className="t-label text-[10px] px-1.5 py-0 rounded font-medium truncate max-w-[140px]"
                      style={{ backgroundColor: "var(--canvas-soft)", color: "var(--primary)" }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Add brief observation note..."
                    value={item.notes || ""}
                    onChange={(e) => updateItemNotes(item.id, e.target.value)}
                    className="w-full mt-1.5 h-6 px-1.5 rounded t-label text-[11px] outline-none"
                    style={{
                      border: "1px solid var(--hairline)",
                      backgroundColor: "var(--canvas-soft)",
                      color: "var(--ink)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-[10010] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-[var(--surface-card)] rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid var(--hairline)" }}
          >
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div>
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{activePreview.name}</div>
                <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>{activePreview.category} · {formatFileSize(activePreview.size)}</div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview.dataUrl}
                  download={activePreview.name}
                  className="p-1.5 rounded hover:bg-[var(--canvas-soft)] transition-colors"
                  style={{ color: "var(--muted)" }}
                  title="Download file"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setActivePreview(null)}
                  className="p-1.5 rounded hover:bg-[var(--canvas-soft)] transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto bg-neutral-950">
              <img
                src={activePreview.dataUrl}
                alt={activePreview.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            {activePreview.notes && (
              <div className="p-3 border-t t-body-sm" style={{ borderColor: "var(--hairline)", color: "var(--body)" }}>
                <strong>Note:</strong> {activePreview.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Read-Only Gallery for InspectionDetail, NcrDetail, ReworkJobDetail
// -------------------------------------------------------------
export function EvidenceGallery({
  evidenceData,
  title = "Visual Proof & Document Evidence",
}: {
  evidenceData: string | EvidenceItem[] | null | undefined;
  title?: string;
}) {
  const [activePreview, setActivePreview] = useState<EvidenceItem | null>(null);

  const items = useMemo<EvidenceItem[]>(() => {
    if (!evidenceData) return [];
    if (Array.isArray(evidenceData)) return evidenceData;
    try {
      const parsed = JSON.parse(evidenceData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [evidenceData]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--canvas-soft)", border: "1px solid var(--hairline)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera size={15} style={{ color: "var(--primary)" }} />
          <span className="t-body-sm font-semibold" style={{ color: "var(--ink)" }}>
            {title} ({items.length})
          </span>
        </div>
        <span className="t-label text-[11px]" style={{ color: "var(--muted)" }}>
          Authentic shopfloor capture
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg overflow-hidden flex flex-col group transition-all"
            style={{
              backgroundColor: "var(--surface-card)",
              border: "1px solid var(--hairline)",
            }}
          >
            {item.type === "image" ? (
              <div
                onClick={() => setActivePreview(item)}
                className="h-28 w-full bg-neutral-900 cursor-zoom-in relative flex items-center justify-center overflow-hidden"
              >
                <img
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <ZoomIn size={16} className="text-white" />
                </div>
              </div>
            ) : (
              <div
                className="h-28 w-full flex flex-col items-center justify-center p-2"
                style={{ backgroundColor: "var(--surface-card)" }}
              >
                {item.name.endsWith(".xlsx") || item.name.endsWith(".xls") ? (
                  <FileSpreadsheet size={28} style={{ color: "#4a7c5e" }} />
                ) : (
                  <FileText size={28} style={{ color: "var(--primary)" }} />
                )}
                <span className="text-[10px] uppercase font-bold mt-1" style={{ color: "var(--muted)" }}>
                  {item.name.split(".").pop()}
                </span>
                <a
                  href={item.dataUrl}
                  download={item.name}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary underline"
                >
                  <Download size={10} /> Download
                </a>
              </div>
            )}
            <div className="p-2 flex-1 flex flex-col justify-between">
              <div>
                <div className="t-body-sm text-[11px] font-medium truncate" style={{ color: "var(--ink)" }} title={item.name}>
                  {item.name}
                </div>
                <div className="t-label text-[9.5px] truncate mt-0.5" style={{ color: "var(--primary)" }}>
                  {item.category}
                </div>
              </div>
              {item.notes && (
                <div className="t-label text-[10px] mt-1.5 p-1 rounded italic truncate" style={{ backgroundColor: "var(--canvas-soft)", color: "var(--body)" }}>
                  "{item.notes}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-[10010] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-[var(--surface-card)] rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ border: "1px solid var(--hairline)" }}
          >
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--hairline)" }}>
              <div>
                <div className="t-body-sm font-medium" style={{ color: "var(--ink)" }}>{activePreview.name}</div>
                <div className="t-label text-[10px]" style={{ color: "var(--muted)" }}>
                  {activePreview.category} · {formatFileSize(activePreview.size)} · {new Date(activePreview.uploadedAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview.dataUrl}
                  download={activePreview.name}
                  className="p-1.5 rounded hover:bg-[var(--canvas-soft)] transition-colors"
                  style={{ color: "var(--muted)" }}
                  title="Download file"
                >
                  <Download size={16} />
                </a>
                <button
                  onClick={() => setActivePreview(null)}
                  className="p-1.5 rounded hover:bg-[var(--canvas-soft)] transition-colors"
                  style={{ color: "var(--muted)" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center max-h-[75vh] overflow-auto bg-neutral-950">
              <img
                src={activePreview.dataUrl}
                alt={activePreview.name}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>
            {activePreview.notes && (
              <div className="p-3 border-t t-body-sm" style={{ borderColor: "var(--hairline)", color: "var(--body)" }}>
                <strong>Inspector Note:</strong> {activePreview.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// Compact Table Badge for Evidence Count
// -------------------------------------------------------------
export function EvidenceBadge({ evidenceData }: { evidenceData: string | null | undefined }) {
  if (!evidenceData) return null;
  try {
    const parsed = typeof evidenceData === "string" ? JSON.parse(evidenceData) : evidenceData;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const imgCount = parsed.filter((it: any) => it.type === "image").length;
    const docCount = parsed.filter((it: any) => it.type === "document").length;

    return (
      <span
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono tracking-tight"
        style={{
          backgroundColor: "rgba(8, 50, 96, 0.08)",
          color: "var(--primary)",
          border: "1px solid rgba(8, 50, 96, 0.15)",
        }}
        title={`${parsed.length} proof file(s) attached: ${imgCount} image(s), ${docCount} document(s)`}
      >
        <Camera size={10} />
        {parsed.length} {parsed.length === 1 ? "proof" : "proofs"}
      </span>
    );
  } catch {
    return null;
  }
}
