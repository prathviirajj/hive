"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { HelpCircle, X, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { getHelpContent, type HelpContent } from "@/lib/help-content";

/**
 * HelpTrigger - Layer 2 help experience as a compact popup (not a drawer).
 *
 * Uses a "?" icon (not an "i" icon). On click, opens a positioned popup
 * near the trigger element. The popup repositions to stay within the viewport.
 *
 * Usage:
 *   <HelpTrigger contentId="wo.unit-completion" />
 */

export function HelpTrigger({ contentId, size = 16, inlineContent }: { contentId?: string; size?: number; inlineContent?: HelpContent }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const content = (contentId ? getHelpContent(contentId) : undefined) || inlineContent;

  // Update popup position when opened
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !popupRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = triggerRect.bottom + 8;
    let left = triggerRect.left;

    // Flip above if not enough space below
    if (top + popupRect.height > viewportHeight - 20 && triggerRect.top > popupRect.height + 20) {
      top = triggerRect.top - popupRect.height - 8;
    }

    // Clamp to viewport horizontally
    if (left + popupRect.width > viewportWidth - 20) {
      left = viewportWidth - popupRect.width - 20;
    }
    if (left < 20) left = 20;

    setPopupStyle({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  if (!content) return null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="inline-flex items-center justify-center cursor-help"
        aria-label={`Help: ${content.title}`}
        style={{
          width: size + 4,
          height: size + 4,
          color: "var(--muted)",
          verticalAlign: "middle",
          marginLeft: 3,
          flexShrink: 0,
          transition: "color 0.15s ease",
          border: "none",
          background: "transparent",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--primary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
      >
        {/* "?" icon instead of "i" icon */}
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      {open && (
        <div
          ref={popupRef}
          className="fixed z-[10003]"
          style={{
            ...popupStyle,
            width: 360,
            maxWidth: "calc(100vw - 40px)",
            backgroundColor: "var(--surface-card)",
            border: "1px solid var(--hairline)",
            borderRadius: 6,
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}
        >
          <HelpPopupContent content={content} onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}

function HelpPopupContent({ content, onClose }: { content: HelpContent; onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>("detail");

  const sections: { key: string; label: string; body: string }[] = [];
  if (content.detail) sections.push({ key: "detail", label: "Overview", body: content.detail });
  if (content.why) sections.push({ key: "why", label: "Why It Matters", body: content.why });
  if (content.rule) sections.push({ key: "rule", label: "Business Rule", body: content.rule });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--hairline)" }}>
        <div className="flex items-center gap-2">
          <HelpCircle size={14} style={{ color: "var(--primary)" }} />
          <span className="t-label" style={{ color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, fontSize: 10 }}>
            Help
          </span>
        </div>
        <button onClick={onClose} className="p-0.5 rounded" style={{ color: "var(--muted)" }} aria-label="Close">
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto scroll-fine">
        {/* Title + short description */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{content.title}</h3>
          <p style={{ fontSize: 12, color: "var(--body)", lineHeight: 1.5 }}>{content.short}</p>
        </div>

        {/* Expandable sections */}
        {sections.map((section) => (
          <div key={section.key} className="rounded overflow-hidden" style={{ border: "1px solid var(--hairline-soft)" }}>
            <button
              onClick={() => setExpanded(expanded === section.key ? null : section.key)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-left transition-colors hover:bg-[var(--canvas-soft)]"
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink)" }}>{section.label}</span>
              {expanded === section.key
                ? <ChevronDown size={12} style={{ color: "var(--muted)" }} />
                : <ChevronRight size={12} style={{ color: "var(--muted)" }} />}
            </button>
            {expanded === section.key && (
              <div className="px-2.5 pb-2.5">
                <p style={{ fontSize: 11.5, color: "var(--body)", lineHeight: 1.55 }}>{section.body}</p>
              </div>
            )}
          </div>
        ))}

        {/* Valid states */}
        {content.states && content.states.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Valid States</div>
            <div className="flex flex-wrap gap-1">
              {content.states.map(s => (
                <span key={s} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, backgroundColor: "var(--canvas-soft)", color: "var(--ink)", border: "1px solid var(--hairline-soft)" }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Applicable roles */}
        {content.roles && content.roles.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Applicable Roles</div>
            <div className="flex flex-wrap gap-1">
              {content.roles.map(r => (
                <span key={r} style={{ fontSize: 10, padding: "2px 6px", borderRadius: 3, backgroundColor: "var(--primary)14", color: "var(--primary)" }}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related tour link */}
        <div className="pt-2 border-t" style={{ borderColor: "var(--hairline)" }}>
          <button
            onClick={() => {
              localStorage.removeItem("tour-completed");
              window.dispatchEvent(new CustomEvent("hive:start-tour"));
              onClose();
            }}
            className="flex items-center gap-1.5 transition-colors"
            style={{ fontSize: 11, color: "var(--primary)" }}
          >
            <ExternalLink size={12} /> Take the interactive tour
          </button>
        </div>
      </div>
    </div>
  );
}
