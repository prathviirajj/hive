"use client";

import { useState, useEffect, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const THEME_KEY = "hive-theme";

/**
 * ThemeToggle - three-way theme selector (Light / Dark / System).
 *
 * The theme is applied by toggling the `.dark` class on <html>.
 * A blocking inline script in layout.tsx applies the stored theme
 * before first paint to prevent flash-of-wrong-theme (FOUC).
 *
 * "System" follows the OS prefers-color-scheme media query and
 * updates automatically when the OS theme changes.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = (localStorage.getItem(THEME_KEY) as Theme) || "system";
    setThemeState(stored);
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement;
    const isDark =
      t === "dark" ||
      (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      localStorage.setItem(THEME_KEY, t);
      applyTheme(t);
    },
    [applyTheme]
  );

  // Listen for OS theme changes when in "system" mode
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  if (!mounted) {
    // Render a placeholder to avoid hydration mismatch
    return <div style={{ width: compact ? 28 : 120, height: 28 }} />;
  }

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  if (compact) {
    // Compact: single icon button that cycles light -> dark -> system
    const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    return (
      <button
        onClick={() => setTheme(next)}
        className="relative p-2 rounded-md transition-colors hover:bg-[var(--canvas-soft)] flex items-center gap-1.5"
        aria-label={`Theme: ${theme}. Click to switch.`}
        data-tooltip={`Theme: ${theme} (click to switch)`}
        data-tooltip-pos="bottom"
      >
        <Icon size={16} style={{ color: "var(--ink)" }} />
        {!compact && (
          <span className="hidden lg:inline t-body-sm capitalize" style={{ color: "var(--ink)" }}>
            {theme}
          </span>
        )}
      </button>
    );
  }

  // Full: segmented control with all three options
  return (
    <div
      className="inline-flex items-center rounded-md p-0.5"
      style={{ border: "1px solid var(--hairline)", backgroundColor: "var(--canvas-soft)" }}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className="flex items-center gap-1 px-2 py-1 rounded-sm transition-colors"
            style={{
              backgroundColor: isActive ? "var(--primary)" : "transparent",
              color: isActive ? "var(--on-primary)" : "var(--muted)",
            }}
            aria-label={`${opt.label} theme`}
            aria-pressed={isActive}
          >
            <Icon size={13} />
            <span className="t-label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
