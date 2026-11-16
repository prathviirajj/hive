"use client";

import { cn } from "@/lib/utils";

// ============================================================
// Hi-Tech Brand Components - follows official brand guidelines
//
// Logo Selection and Combined Usage:
//   - HTR Innovations: radiator-related modules and communication
//   - HTT Innovations: tank-related modules and communication
//   - Combined logo: common software screens (login, dashboard, reports)
//     HTR on the left, HTT on the right, separated by a thin grey vertical divider
//
// Logo Appearance and Placement:
//   - Preserve original design, proportions, lettering, colours
//   - Do NOT stretch, compress, rotate, crop or recolour the logos
//   - Maintain clear space and adequate margins from screen edges
//
// Brand Colours:
//   Primary:  Navy Blue #083260, Sustainable Green #159640, Black, White
//   Secondary: Burnt Orange #D36E2E, Moss Green #A5B76C,
//              Slate Blue #576590, Caramel #B58B45
//
// Taglines:
//   HTR: "Radiating Success, Engineering Excellence"
//   HTT: "Mastering Precision, Engineering Innovation"
// ============================================================

// ============================================================
// HTR Logo - Hi-Tech Radiators (radiator modules)
// ============================================================
export function HtrLogo({
  height = 28,
  className,
  showTagline = false,
}: {
  height?: number;
  className?: string;
  showTagline?: boolean;
}) {
  // Source image is 958x640 → aspect ratio ~1.497:1 (w:h)
  const width = Math.round(height * 1.497);
  return (
    <div className={cn("inline-flex flex-col", className)}>
      <img
        src="/htr-logo.png"
        alt="HTR Innovations - Hi-Tech Radiators"
        height={height}
        width={width}
        className="object-contain"
        style={{ height, width, display: "block" }}
      />
      {showTagline && (
        <div
          className="t-label"
          style={{
            color: "var(--ht-slate-blue)",
            fontSize: Math.max(7, height * 0.18),
            letterSpacing: "0.08em",
            marginTop: 4,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Radiating Success, Engineering Excellence
        </div>
      )}
    </div>
  );
}

// ============================================================
// HTT Logo - Hi-Tech Transformers (tank modules)
// ============================================================
export function HttLogo({
  height = 28,
  className,
  showTagline = false,
}: {
  height?: number;
  className?: string;
  showTagline?: boolean;
}) {
  // Source image is 948x640 → aspect ratio ~1.481:1 (w:h)
  const width = Math.round(height * 1.481);
  return (
    <div className={cn("inline-flex flex-col", className)}>
      <img
        src="/htt-logo.png"
        alt="HTT Innovations - Hi-Tech Transformers"
        height={height}
        width={width}
        className="object-contain"
        style={{ height, width, display: "block" }}
      />
      {showTagline && (
        <div
          className="t-label"
          style={{
            color: "var(--ht-slate-blue)",
            fontSize: Math.max(7, height * 0.18),
            letterSpacing: "0.08em",
            marginTop: 4,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          Mastering Precision, Engineering Innovation
        </div>
      )}
    </div>
  );
}

// ============================================================
// Combined Logo - HTR (left) + grey divider + HTT (right)
// For shared screens: login, dashboard, reports, certificates.
// Per brand guidelines: equal visual prominence, aligned baselines,
// balanced spacing, thin grey vertical divider.
// ============================================================
export function CombinedLogo({
  height = 28,
  className,
  showTaglines = false,
}: {
  height?: number;
  className?: string;
  showTaglines?: boolean;
}) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <HtrLogo height={height} showTagline={showTaglines} />
      {/* Thin grey vertical divider - per brand guidelines */}
      <div
        className="mx-3"
        style={{
          width: 1,
          height: height * 0.85,
          backgroundColor: "var(--divider-grey)",
        }}
        aria-hidden="true"
      />
      <HttLogo height={height} showTagline={showTaglines} />
    </div>
  );
}

// ============================================================
// Backward-compatible HiTechLogo - defaults to Combined.
// Pass variant="htr" or variant="htt" for single-logo contexts.
// ============================================================
export function HiTechLogo({
  variant = "combined",
  height = 28,
  className,
  showWordmark = true,
}: {
  variant?: "combined" | "htr" | "htt";
  height?: number;
  className?: string;
  showWordmark?: boolean;
}) {
  if (variant === "htr") return <HtrLogo height={height} className={className} />;
  if (variant === "htt") return <HttLogo height={height} className={className} />;
  return <CombinedLogo height={height} className={className} />;
}

// ============================================================
// Hi-Tech Radiators Logo Lockup - Hi-Tech Combined logo + Hi-Tech Radiators wordmark
// Used in header, login, report headers, certificates.
// ============================================================
export function HiveLockup({
  size = "md",
  showTagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}) {
  const dims = {
    sm: { logo: 22, title: "t-title-sm", tag: "t-label" },
    md: { logo: 26, title: "t-title-md", tag: "t-label" },
    lg: { logo: 44, title: "t-display-sm", tag: "t-body-sm" },
  }[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CombinedLogo height={dims.logo} />
      <div className="w-px h-6" style={{ backgroundColor: "var(--hairline)" }} />
      <div>
        <div className={dims.title} style={{ color: "var(--ink)", letterSpacing: "0.04em", fontWeight: 600 }}>
          Hi-Tech Radiators
        </div>
        {showTagline && (
          <div className={dims.tag} style={{ color: "var(--muted)" }}>
            Hi-Tech Integrated Verification Engine
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Report Header - for printable reports and certificates.
// Includes Combined Hi-Tech logo, Hi-Tech Radiators wordmark, document title,
// and meta row. Follows brand guidelines for shared screens.
// ============================================================
export function ReportHeader({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <div className="border-b pb-5 mb-6" style={{ borderColor: "var(--hairline)" }}>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <CombinedLogo height={40} />
          <div className="w-px h-10" style={{ backgroundColor: "var(--hairline)" }} />
          <div>
            <div className="t-display-sm" style={{ color: "var(--ink)", letterSpacing: "0.04em", fontWeight: 600 }}>
              Hi-Tech Radiators
            </div>
            <div className="t-label" style={{ color: "var(--muted)" }}>
              Hi-Tech Integrated Verification Engine
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="t-label" style={{ color: "var(--muted)" }}>Hi-Tech Radiators Pvt. Ltd.</div>
          <div className="t-body-sm" style={{ color: "var(--body)" }}>Khopoli, Maharashtra</div>
          <div className="t-body-sm t-num" style={{ color: "var(--muted)" }}>ISO 9001 · AWS · IEC 60076</div>
        </div>
      </div>
      <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--hairline-soft)" }}>
        <div className="t-label mb-1" style={{ color: "var(--primary)" }}>DOCUMENT</div>
        <h1 className="t-display-md" style={{ color: "var(--ink)" }}>{title}</h1>
        {subtitle && <p className="t-body-md mt-1" style={{ color: "var(--body)" }}>{subtitle}</p>}
        {meta && meta.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {meta.map((m) => (
              <div key={m.label}>
                <div className="t-label" style={{ color: "var(--muted)" }}>{m.label}</div>
                <div className="t-body-sm mt-0.5" style={{ color: "var(--ink)", fontWeight: 500 }}>{m.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Certificate Seal - for quality certificates, test certificates
// Uses HT Navy as the seal colour.
// ============================================================
export function CertificateSeal({ size = 80 }: { size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: size,
        height: size,
        border: "1.5px solid var(--primary)",
        backgroundColor: "var(--canvas-soft)",
      }}
    >
      <div className="text-center">
        <div className="t-label" style={{ color: "var(--primary)", fontSize: 8, letterSpacing: "0.1em" }}>CERTIFIED</div>
        <div className="t-display-sm" style={{ color: "var(--primary)", fontSize: 18, fontWeight: 600 }}>Hi-Tech Radiators</div>
        <div className="t-label" style={{ color: "var(--muted)", fontSize: 7 }}>QMS · v6</div>
      </div>
    </div>
  );
}
