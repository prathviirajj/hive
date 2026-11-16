"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, Compass, SkipForward } from "lucide-react";

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position?: "bottom" | "top" | "right" | "left";
  segment: string;
}

// Tour steps - covers ADVANCED and complex features, not just basics.
// Organized into segments so users can understand the platform's depth.
const TOUR_STEPS: TourStep[] = [
  // ── Segment 1: Navigation & Core ──
  {
    selector: "[data-tour='sidebar']",
    title: "Navigation Sidebar",
    description:
      "The sidebar is your module switcher. It's role-filtered - you only see modules your role has access to. Modules under construction (RCA, Intelligence, Governance, FMEA) are hidden for everyone until ready. Click any item to navigate. Use COLLAPSE to free up screen space.",
    position: "right",
    segment: "Navigation",
  },
  {
    selector: "[data-tour='search']",
    title: "Global Search",
    description:
      "Search across work orders, NCRs, inspections, and HTU numbers simultaneously. Results are grouped by type and update as you type. Click any result to jump directly to that record - no need to navigate through menus first.",
    position: "bottom",
    segment: "Navigation",
  },
  {
    selector: "[data-tour='plant-selector']",
    title: "Plant Selector",
    description:
      "Switch between manufacturing plants. K2 (Khopoli - Stainless Steel) is currently active. Each plant has its own process routes, stages, and quality data. Other plants will be enabled as they come online.",
    position: "bottom",
    segment: "Navigation",
  },

  // ── Segment 2: Dashboard & Analytics ──
  {
    selector: "[data-tour='tour-guide']",
    title: "Tour Guide Button",
    description:
      "Click this compass icon anytime to restart this guided tour. Useful for training new colleagues or refreshing your memory on advanced features. The tour covers navigation, dashboards, quality workflows, rework management, and administration.",
    position: "bottom",
    segment: "Navigation",
  },
  {
    selector: "[data-tour='notifications']",
    title: "Notifications Panel",
    description:
      "Real-time alerts appear here: CTQ inspection failures, overdue CAPAs, calibration warnings, and work order completions. A blue dot indicates unread items. Click to expand the full notification list with timestamps and severity indicators.",
    position: "bottom",
    segment: "Navigation",
  },
  {
    selector: "[data-tour='profile']",
    title: "Profile & Role Context",
    description:
      "Shows your name, QMS role (e.g. Director, QC Inspector), and assigned plant. Click to view your assigned stages, access settings, or sign out. Your role determines module access, data scope, and workflow authority - not just what you can see, but what actions you can perform.",
    position: "bottom",
    segment: "Navigation",
  },

  // ── Segment 3: Quality Workflows ──
  {
    selector: "[data-tour='start-inspection']",
    title: "Start Digital Inspection",
    description:
      "This button (visible on the dashboard for inspector/operator roles) opens the digital inspection form directly. The HTU number is auto-generated, and the inspector/operator are pre-filled. Each stage has CTQ (Critical-To-Quality) checks that auto-create NCRs on failure and hold the work order.",
    position: "bottom",
    segment: "Quality",
  },
];

export function TourGuide() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Allow the tour to be (re)started from anywhere via a custom event.
  useEffect(() => {
    const onStart = () => startTour();
    window.addEventListener("hive:start-tour", onStart as EventListener);
    return () => window.removeEventListener("hive:start-tour", onStart as EventListener);
  }, []);

  // Auto-start once for first-time users.
  useEffect(() => {
    const seen = localStorage.getItem("tour-completed");
    if (!seen) {
      const timer = setTimeout(() => startTour(), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Update target position when step changes.
  useEffect(() => {
    if (!active) return;
    const updatePosition = () => {
      const currentStep = TOUR_STEPS[step];
      if (!currentStep) { endTour(); return; }
      const el = document.querySelector(currentStep.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      } else {
        // Element not found - skip to next step.
        if (step < TOUR_STEPS.length - 1) setStep(step + 1);
        else endTour();
      }
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [active, step]);

  const startTour = () => {
    setActive(true);
    setStep(0);
  };

  const endTour = () => {
    setActive(false);
    setStep(0);
    localStorage.setItem("tour-completed", "true");
  };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else endTour();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!active || !targetRect) return null;

  const currentStep = TOUR_STEPS[step];
  if (!currentStep) return null;

  // Calculate popover position - with smart edge avoidance.
  const popoverWidth = 340;
  const popoverHeight = 220;
  let popoverStyle: React.CSSProperties = {};
  let popoverPos: "bottom" | "top" | "right" | "left" = currentStep.position || "bottom";

  // Smart positioning: if the tooltip would go off-screen, flip it.
  switch (currentStep.position) {
    case "bottom": {
      const spaceBelow = window.innerHeight - targetRect.bottom;
      if (spaceBelow < popoverHeight + 20 && targetRect.top > popoverHeight + 20) {
        popoverPos = "top";
      }
      if (popoverPos === "bottom") {
        popoverStyle = {
          top: targetRect.bottom + 12,
          left: Math.max(12, Math.min(
            targetRect.left + targetRect.width / 2 - popoverWidth / 2,
            window.innerWidth - popoverWidth - 12
          )),
        };
      } else {
        popoverStyle = {
          top: Math.max(12, targetRect.top - popoverHeight - 12),
          left: Math.max(12, Math.min(
            targetRect.left + targetRect.width / 2 - popoverWidth / 2,
            window.innerWidth - popoverWidth - 12
          )),
        };
      }
      break;
    }
    case "top": {
      const spaceAbove = targetRect.top;
      if (spaceAbove < popoverHeight + 20 && window.innerHeight - targetRect.bottom > popoverHeight + 20) {
        popoverPos = "bottom";
      }
      if (popoverPos === "top") {
        popoverStyle = {
          top: Math.max(12, targetRect.top - popoverHeight - 12),
          left: Math.max(12, Math.min(
            targetRect.left + targetRect.width / 2 - popoverWidth / 2,
            window.innerWidth - popoverWidth - 12
          )),
        };
      } else {
        popoverStyle = {
          top: targetRect.bottom + 12,
          left: Math.max(12, Math.min(
            targetRect.left + targetRect.width / 2 - popoverWidth / 2,
            window.innerWidth - popoverWidth - 12
          )),
        };
      }
      break;
    }
    case "right": {
      const spaceRight = window.innerWidth - targetRect.right;
      if (spaceRight < popoverWidth + 20 && targetRect.left > popoverWidth + 20) {
        popoverPos = "left";
      }
      if (popoverPos === "right") {
        popoverStyle = {
          top: Math.max(12, Math.min(
            targetRect.top + targetRect.height / 2 - popoverHeight / 2,
            window.innerHeight - popoverHeight - 12
          )),
          left: Math.min(targetRect.right + 12, window.innerWidth - popoverWidth - 12),
        };
      } else {
        popoverStyle = {
          top: Math.max(12, Math.min(
            targetRect.top + targetRect.height / 2 - popoverHeight / 2,
            window.innerHeight - popoverHeight - 12
          )),
          left: Math.max(12, targetRect.left - popoverWidth - 12),
        };
      }
      break;
    }
    case "left": {
      const spaceLeft = targetRect.left;
      if (spaceLeft < popoverWidth + 20 && window.innerWidth - targetRect.right > popoverWidth + 20) {
        popoverPos = "right";
      }
      if (popoverPos === "left") {
        popoverStyle = {
          top: Math.max(12, Math.min(
            targetRect.top + targetRect.height / 2 - popoverHeight / 2,
            window.innerHeight - popoverHeight - 12
          )),
          left: Math.max(12, targetRect.left - popoverWidth - 12),
        };
      } else {
        popoverStyle = {
          top: Math.max(12, Math.min(
            targetRect.top + targetRect.height / 2 - popoverHeight / 2,
            window.innerHeight - popoverHeight - 12
          )),
          left: Math.min(targetRect.right + 12, window.innerWidth - popoverWidth - 12),
        };
      }
      break;
    }
    default:
      popoverStyle = { top: targetRect.bottom + 12, left: targetRect.left };
  }

  // Highlight box with padding.
  const padding = 6;
  const highlightStyle: React.CSSProperties = {
    position: "fixed",
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
    borderRadius: 4,
  };

  // Current segment for display.
  const currentSegment = currentStep.segment;
  const segmentSteps = TOUR_STEPS.filter(s => s.segment === currentSegment);
  const segmentIndex = segmentSteps.findIndex(s => s === currentStep);

  return (
    <>
      {/* Dark overlay */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 9998,
        pointerEvents: "none",
      }} />

      {/* Highlight box */}
      <div style={{
        ...highlightStyle,
        zIndex: 9999,
        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.55), 0 0 0 3px var(--primary)`,
        backgroundColor: "transparent",
        pointerEvents: "none",
        borderRadius: 4,
      }} />

      {/* Popover */}
      <div
        ref={popoverRef}
        style={{
          ...popoverStyle,
          position: "fixed",
          zIndex: 10002,
          width: popoverWidth,
          backgroundColor: "var(--surface-card)",
          border: "1px solid var(--hairline)",
          borderRadius: 6,
          padding: 18,
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header - segment + step counter */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Compass size={15} style={{ color: "var(--primary)" }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {currentSegment} · {segmentIndex + 1}/{segmentSteps.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 10, color: "var(--muted-soft)" }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={endTour}
              className="ml-1 p-0.5 rounded"
              style={{ color: "var(--muted)" }}
              aria-label="Close tour"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          marginBottom: 6,
          lineHeight: 1.3,
        }}>
          {currentStep.title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: 12.5,
          color: "var(--body)",
          lineHeight: 1.55,
          marginBottom: 14,
        }}>
          {currentStep.description}
        </p>

        {/* Footer - progress + nav buttons */}
        <div className="flex items-center justify-between">
          {/* Progress dots - grouped by segment */}
          <div className="flex items-center gap-1 flex-wrap" style={{ maxWidth: 140 }}>
            {TOUR_STEPS.map((s, i) => {
              const isCurrentSegment = s.segment === currentSegment;
              return (
                <div
                  key={i}
                  style={{
                    width: i === step ? 16 : 5,
                    height: 5,
                    borderRadius: 2.5,
                    backgroundColor: i === step
                      ? "var(--primary)"
                      : isCurrentSegment
                        ? "var(--hairline-strong)"
                        : "var(--hairline)",
                    transition: "all 0.2s",
                  }}
                />
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            {step > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 px-2.5 h-7 rounded text-xs transition-colors"
                style={{ border: "1px solid var(--hairline)", color: "var(--muted)" }}
              >
                <ChevronLeft size={12} /> Back
              </button>
            )}
            <button
              onClick={endTour}
              className="flex items-center gap-1 px-2.5 h-7 rounded text-xs transition-colors"
              style={{ color: "var(--muted-soft)" }}
            >
              <SkipForward size={12} /> Skip
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-3 h-7 rounded text-xs font-medium transition-colors"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              {step === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
              {step < TOUR_STEPS.length - 1 && <ChevronRight size={12} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Dispatch the "start tour" event. Attach to any button.
 */
export function startTourFromButton() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tour-completed");
    window.dispatchEvent(new CustomEvent("hive:start-tour"));
  }
}
