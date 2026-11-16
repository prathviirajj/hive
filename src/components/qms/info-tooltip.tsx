"use client";

import { Info } from "lucide-react";

/**
 * InfoTooltip - a small, always-visible (i) icon that shows a help bubble on
 * hover (desktop) or tap (mobile). Designed for non-technical operators.
 *
 * Key improvements:
 * - Uses position: relative wrapper so tooltip positions correctly
 * - Tooltip opens BELOW the icon by default (avoids header overlap)
 * - Icon has a subtle circular background so it's clearly clickable
 * - aria-label for screen readers
 *
 * Usage:
 *   <InfoTooltip text="HTU = Hi-Tech Unit serial number." />
 *   <InfoTooltip text="Click to start a new inspection form." size={14} position="right" />
 */
export function InfoTooltip({
  text,
  size = 12,
  className,
  position = "top",
}: {
  text: string;
  size?: number;
  className?: string;
  position?: "top" | "bottom" | "right" | "left";
}) {
  if (!text) return null;
  return (
    <span
      className={`inline-flex items-center justify-center cursor-help ${className || ""}`}
      data-tooltip={text}
      data-tooltip-pos={position}
      role="img"
      aria-label={text}
      tabIndex={0}
      style={{
        width: size + 4,
        height: size + 4,
        borderRadius: "50%",
        color: "var(--muted)",
        backgroundColor: "transparent",
        transition: "color 0.15s ease",
        verticalAlign: "middle",
        marginLeft: 3,
        flexShrink: 0,
        position: "relative",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
      onFocus={(e) => { e.currentTarget.style.color = "var(--primary)"; }}
      onBlur={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
    >
      <Info size={size} strokeWidth={2.5} />
    </span>
  );
}

/**
 * Convenience wrapper for putting an info icon right after a label string.
 *   <LabelWithInfo label="HTU Number" info="Hi-Tech Unit - unique serial per radiator" />
 */
export function LabelWithInfo({
  label,
  info,
  className,
}: {
  label: string;
  info: string;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center" }}>
      {label}
      <InfoTooltip text={info} />
    </span>
  );
}
