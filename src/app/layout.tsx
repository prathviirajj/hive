import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// All fonts are loaded via <link> tags in <head> below.
// This avoids Turbopack's next/font/google resolution bug
// ("next/font/google queries have exactly one entry").

export const metadata: Metadata = {
  title: "Hi-Tech Radiators - Hi-Tech Integrated Verification Engine",
  description:
    "One connected system, many contributors. Adaptive, risk-driven quality management for transformer radiator manufacturing.",
  keywords: ["Hi-Tech Radiators", "QMS", "Quality Management", "Transformer Radiator", "FMEA", "CAPA", "Inspection"],
  authors: [{ name: "Hi-Tech Radiators Pvt. Ltd." }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Flash-prevention: apply theme class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hive-theme');if(!t||t==='system'){if(window.matchMedia('(prefers-color-scheme: dark)').matches){document.documentElement.classList.add('dark');}}else if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{ backgroundColor: "var(--canvas)", color: "var(--ink)" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
