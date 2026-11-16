"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { CombinedLogo } from "@/components/qms/brand";

interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  plant: string;
  assignedStages?: string[];
  managedStages?: string[];
  shiftPreference?: string;
}

// Quick-login shortcuts mapped to the real org structure.
const QUICK_LOGINS = [
  { username: "admin",             password: "admin2026",    name: "Admin" },
  { username: "yogesh.jadhav",     password: "director2026", name: "Director" },
  { username: "balasaheb.daphal",  password: "dgm2026",      name: "DGM Qual" },
  { username: "roshan.gaikar",     password: "section2026",  name: "Section Hd" },
  { username: "rohit.giri",        password: "qual2026",     name: "Qual Mgr" },
  { username: "rohan.ghodvinde",   password: "qc2026",       name: "Inspector" },
  { username: "operator.fab.a",    password: "operator2026", name: "Operator" },
];

export function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.toLowerCase(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const quickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: "var(--canvas)" }}
    >
      {/* Logo - top centered */}
      <div className="mb-10">
        <CombinedLogo height={48} />
      </div>

      {/* Login card - Swiss minimal, max constraint */}
      <div className="w-full" style={{ maxWidth: 360 }}>
        {/* Heading */}
        <div className="mb-6">
          <h1
            className="leading-tight"
            style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", letterSpacing: "-0.01em" }}
          >
            Sign in to HIVE QMS
          </h1>
          <p className="mt-1.5" style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
            Enter your credentials to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label
              className="block mb-1"
              style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}
            >
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sneha.patel"
              autoFocus
              className="w-full h-10 px-3 outline-none transition-colors focus:border-[var(--primary)]"
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: 4,
                backgroundColor: "var(--canvas-soft)",
                color: "var(--ink)",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              className="block mb-1"
              style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 pr-10 outline-none transition-colors focus:border-[var(--primary)]"
                style={{
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                  backgroundColor: "var(--canvas-soft)",
                  color: "var(--ink)",
                  fontSize: 14,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5"
                style={{ color: "var(--muted)" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div
              className="flex items-start gap-2 px-3 py-2"
              style={{
                backgroundColor: "#a045450d",
                border: "1px solid #a0454533",
                borderRadius: 4,
              }}
            >
              <AlertCircle size={13} className="shrink-0 mt-0.5" style={{ color: "var(--semantic-error)" }} />
              <span style={{ fontSize: 12, color: "var(--semantic-error)", lineHeight: 1.4 }}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full h-10 flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--on-primary)",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        {/* Quick login - compact single row of chips */}
        <div className="mt-6 pt-5 border-t" style={{ borderColor: "var(--hairline)" }}>
          <div className="mb-2" style={{ fontSize: 11, fontWeight: 500, color: "var(--muted-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Quick demo login
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_LOGINS.map((c) => {
              const isActive = username === c.username;
              return (
                <button
                  key={c.username}
                  type="button"
                  onClick={() => quickFill(c.username, c.password)}
                  className="px-2.5 py-1 transition-colors"
                  style={{
                    border: isActive
                      ? "1px solid var(--primary)"
                      : "1px solid var(--hairline)",
                    borderRadius: 3,
                    backgroundColor: isActive ? "#0832600d" : "transparent",
                    color: isActive ? "var(--primary)" : "var(--body)",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer - minimal */}
      <div className="mt-12" style={{ fontSize: 11, color: "var(--muted-soft)" }}>
        Hi-Tech Radiators Pvt. Ltd. · K2 Khopoli · © 2026
      </div>
    </div>
  );
}

export type { User };
