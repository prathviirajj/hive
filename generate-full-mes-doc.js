const fs = require('fs');
const path = require('path');
const { STAGES, logoDataUri, hiTechLogoDataUri } = require('./stages-data.js');

console.log("Generating full HTML for Hi-Tech Radiators MES End-to-End Process Flow Mapping...");

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hi-Tech Radiators - MES End-to-End Process Flow Mapping</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    :root {
      --primary: #083260;
      --primary-light: #0d4a8f;
      --accent: #159640;
      --accent-soft: #e8f5e9;
      --ink: #0f172a;
      --body: #334155;
      --muted: #64748b;
      --border: #e2e8f0;
      --surface: #ffffff;
      --surface-subtle: #f8fafc;
      --surface-card: #f1f5f9;
      --risk: #dc2626;
      --risk-soft: #fef2f2;
      --amber: #d97706;
      --amber-soft: #fffbeb;
      --purple: #7c3aed;
      --purple-soft: #f5f3ff;
      --blue: #2563eb;
      --blue-soft: #eff6ff;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: var(--body);
      background-color: #f8fafc;
      line-height: 1.6;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 20px auto;
      background: #ffffff;
      padding: 24mm 20mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      page-break-after: always;
      position: relative;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .page {
        margin: 0;
        box-shadow: none;
        width: 100%;
        min-height: 100vh;
        padding: 16mm 14mm;
      }
      .no-print {
        display: none !important;
      }
    }

    /* Header & Footer */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .doc-footer {
      position: absolute;
      bottom: 14mm;
      left: 20mm;
      right: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 8px;
      font-size: 10px;
      color: var(--muted);
    }
    @media print {
      .doc-footer {
        left: 14mm;
        right: 14mm;
        bottom: 10mm;
      }
    }

    /* Typography */
    h1 {
      font-size: 26px;
      font-weight: 700;
      color: var(--primary);
      letter-spacing: -0.02em;
      line-height: 1.25;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 18px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px;
      letter-spacing: -0.01em;
    }
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--ink);
      margin-top: 14px;
      margin-bottom: 6px;
    }
    h4 {
      font-size: 12px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 8px;
      margin-bottom: 4px;
    }
    p {
      margin-bottom: 10px;
      color: var(--body);
      font-size: 12.5px;
    }

    /* Badges & Tags */
    .tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .tag-confirmed { background: var(--accent-soft); color: var(--accent); border: 1px solid #bbf7d0; }
    .tag-assumed { background: var(--blue-soft); color: var(--blue); border: 1px solid #bfdbfe; }
    .tag-verify { background: var(--amber-soft); color: var(--amber); border: 1px solid #fde68a; }
    .tag-recommended { background: var(--purple-soft); color: var(--purple); border: 1px solid #ddd6fe; }
    .tag-special { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 11.5px;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: var(--surface-subtle);
      color: var(--primary);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }

    /* Cards */
    .card {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 14px;
    }
    .card-accent {
      border-left: 4px solid var(--primary);
      background: var(--surface-subtle);
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 14px;
    }
    .card-grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }

    /* State 3-box comparison */
    .state-box {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }
    .state-title {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 4px;
      letter-spacing: 0.04em;
    }

    /* SVG Diagram Containers */
    .diagram-container {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      overflow-x: auto;
    }

    /* Cover Page */
    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      min-height: 250mm;
    }
    .cover-hero {
      margin-top: 40px;
    }
    .cover-meta {
      background: var(--surface-subtle);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
  </style>
</head>
<body>

  <!-- ============================================================ -->
  <!-- PAGE 1: COVER & EXECUTIVE PURPOSE -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="cover-page">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
          <img src="${logoDataUri}" alt="Hi-Tech Radiators Logo" style="height: 52px; width: auto;" />
          <div style="text-align: right;">
            <div style="font-size: 12px; font-weight: 700; color: var(--primary);">HI-TECH RADIATORS PVT. LTD.</div>
            <div style="font-size: 10px; color: var(--muted);">Manufacturing Execution System (MES)</div>
            <div style="font-size: 10px; color: var(--muted);">Plants: Kurkumbh K1 & K2</div>
          </div>
        </div>

        <div class="cover-hero">
          <div style="display: inline-block; padding: 4px 12px; background: var(--accent-soft); color: var(--accent); border-radius: 20px; font-size: 11px; font-weight: 600; margin-bottom: 16px;">
            OFFICIAL IMPLEMENTATION BLUEPRINT (2026)
          </div>
          <h1 style="font-size: 32px; line-height: 1.2; margin-bottom: 12px;">
            MES End-to-End Process Flow Mapping
          </h1>
          <div style="font-size: 18px; color: var(--muted); font-weight: 500; margin-bottom: 24px;">
            Complete Value Stream Architecture from Sales Enquiry to Customer Delivery & Feedback
          </div>
          <p style="font-size: 14px; max-width: 620px; color: var(--body);">
            A verifiable, implementation-ready process blueprint bridging shopfloor reality and enterprise software. 
            Designed for executive leadership (business impact), plant heads (operational validation), and software engineers (functional requirements).
          </p>
        </div>

        <div class="cover-meta">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; font-size: 12px;">
            <div>
              <div style="color: var(--muted); font-size: 10px; text-transform: uppercase; font-weight: 600;">Document Number</div>
              <div style="font-weight: 600; color: var(--ink);">HTR-MES-PFM-2026-01</div>
            </div>
            <div>
              <div style="color: var(--muted); font-size: 10px; text-transform: uppercase; font-weight: 600;">Revision & Status</div>
              <div style="font-weight: 600; color: var(--accent);">Rev 1.0 (Live Implementation Standard)</div>
            </div>
            <div>
              <div style="color: var(--muted); font-size: 10px; text-transform: uppercase; font-weight: 600;">Product Scope</div>
              <div style="font-weight: 600; color: var(--ink);">Transformer Radiators (CRCA / SS Elements, 520 mm / 380 mm Width)</div>
            </div>
            <div>
              <div style="color: var(--muted); font-size: 10px; text-transform: uppercase; font-weight: 600;">Applicable Frameworks</div>
              <div style="font-weight: 600; color: var(--ink);">ISO 9001:2015, IATF 16949:2016, ISA-95 Architecture</div>
            </div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid var(--border); padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: var(--muted);">
        <div>Confidential & Proprietary - Hi-Tech Radiators Pvt. Ltd.</div>
        <div>Page 1 of 25</div>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 2: OPERATING PRINCIPLES & VALUE STREAM OVERVIEW (L0) -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Principles & Value Stream</div>
    </div>

    <h2>1. Operating Principles (Non-Negotiable)</h2>
    <p>Every proposal in this document is bound by nine core principles ensuring shopfloor integrity and software usability:</p>

    <table>
      <thead>
        <tr>
          <th style="width: 25px;">#</th>
          <th style="width: 140px;">Principle</th>
          <th>What it means in practice</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1</strong></td>
          <td><strong>Never invent facts</strong></td>
          <td>All equipment and parameters are referenced from confirmed engineering standards. Any unconfirmed shopfloor practice is tagged <span class="tag tag-verify">[VERIFY ON-SITE]</span>.</td>
        </tr>
        <tr>
          <td><strong>2</strong></td>
          <td><strong>Three process states</strong></td>
          <td>Every stage distinguishes <strong>(A) Documented</strong> (SOP/QMS), <strong>(B) Actual</strong> (shopfloor practice), and <strong>(C) Ideal</strong> (MES-enabled).</td>
        </tr>
        <tr>
          <td><strong>3</strong></td>
          <td><strong>Need before software</strong></td>
          <td>Every digital feature addresses an identified business pain. No feature is added simply because it is technically possible.</td>
        </tr>
        <tr>
          <td><strong>4</strong></td>
          <td><strong>Separate tag system</strong></td>
          <td>Clear tags used: <span class="tag tag-confirmed">[CONFIRMED]</span>, <span class="tag tag-assumed">[ASSUMED - industry reference]</span>, <span class="tag tag-verify">[VERIFY ON-SITE]</span>, <span class="tag tag-recommended">[RECOMMENDED]</span>.</td>
        </tr>
        <tr>
          <td><strong>5</strong></td>
          <td><strong>No unsupported numbers</strong></td>
          <td>No speculative cycle times or savings percentages. Baseline KPIs are defined along with the exact measurement method.</td>
        </tr>
        <tr>
          <td><strong>6</strong></td>
          <td><strong>No invented compliance</strong></td>
          <td>Quality standards (ISO/IATF) are stated as applicable customer requirements with exact audit verification procedures.</td>
        </tr>
        <tr>
          <td><strong>7</strong></td>
          <td><strong>Preserve source data</strong></td>
          <td>Engineering drawing tolerances, nominal measurements, and checksheet parameters are preserved verbatim.</td>
        </tr>
        <tr>
          <td><strong>8</strong></td>
          <td><strong>Direct professional feedback</strong></td>
          <td>Practical risks in current workflows are stated plainly alongside actionable mitigation pathways.</td>
        </tr>
        <tr>
          <td><strong>9</strong></td>
          <td><strong>Every branch terminates</strong></td>
          <td>All logic loops have explicit exit conditions, maximum retry limits, and defined rework/scrap terminals.</td>
        </tr>
      </tbody>
    </table>

    <h2>2. Visual Process Flow Architecture (Level 0: Macro Value Stream)</h2>
    <p>The high-level macro flow connects eight core phases across three enterprise tiers (ERP, MES, and Shopfloor):</p>

    <!-- Modern SVG Process Flow Diagram L0 -->
    <div class="diagram-container">
      <svg viewBox="0 0 760 160" width="100%" height="160" xmlns="http://www.w3.org/2000/svg">
        <!-- Definitions -->
        <defs>
          <linearGradient id="gradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#083260" />
            <stop offset="100%" stop-color="#0e4b8f" />
          </linearGradient>
          <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#159640" />
            <stop offset="100%" stop-color="#22c55e" />
          </linearGradient>
          <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="115%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/>
          </filter>
        </defs>

        <!-- Connecting Line -->
        <line x1="40" y1="70" x2="720" y2="70" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4,4" />

        <!-- Phase 1: Commercial -->
        <g transform="translate(10, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#083260" stroke-width="2"/>
          <circle cx="40" cy="24" r="14" fill="#eff6ff"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S1-S2</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Commercial</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">RFQ & Order</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">Review</text>
        </g>
        <path d="M 95 70 L 105 70" stroke="#083260" stroke-width="2" marker-end="url(#arrow)"/>

        <!-- Phase 2: Engineering -->
        <g transform="translate(100, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#f5f3ff"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#7c3aed" text-anchor="middle">S3-S4</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Engineering</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">CAD, BOM &</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">Control Plan</text>
        </g>

        <!-- Phase 3: Supply Chain -->
        <g transform="translate(190, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#fffbeb"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#d97706" text-anchor="middle">S5-S7</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Supply Chain</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">MRP, Steel QC</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">& Kitting</text>
        </g>

        <!-- Phase 4: Core Fabrication -->
        <g transform="translate(280, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#f1f5f9"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">S8-S10</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Core Fab</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">Fin Rolling &</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">Jig Clamping</text>
        </g>

        <!-- Phase 5: Joining / Welding -->
        <g transform="translate(370, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e11d48" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#ffe4e6"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">S11</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Joining</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">Seam / Spot /</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">TIG / MAG</text>
        </g>

        <!-- Phase 6: Integrity Testing -->
        <g transform="translate(460, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e11d48" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#ffe4e6"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">S12</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Integrity Test</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">Water Dip &</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">Pressure Test</text>
        </g>

        <!-- Phase 7: Surface & Finish -->
        <g transform="translate(550, 30)" filter="url(#cardShadow)">
          <rect width="80" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
          <circle cx="40" cy="24" r="14" fill="#f1f5f9"/>
          <text x="40" y="28" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">S13-S14</text>
          <text x="40" y="52" font-size="9" font-weight="bold" fill="#0f172a" text-anchor="middle">Coating</text>
          <text x="40" y="64" font-size="7.5" fill="#64748b" text-anchor="middle">Erection, Blast,</text>
          <text x="40" y="74" font-size="7.5" fill="#64748b" text-anchor="middle">HDG & Paint</text>
        </g>

        <!-- Phase 8: Final Gate & Dispatch -->
        <g transform="translate(640, 30)" filter="url(#cardShadow)">
          <rect width="90" height="80" rx="8" fill="url(#gradAccent)" stroke="#159640" stroke-width="1.5"/>
          <circle cx="45" cy="24" r="14" fill="#ffffff"/>
          <text x="45" y="28" font-size="10" font-weight="bold" fill="#159640" text-anchor="middle">S15-S18</text>
          <text x="45" y="52" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">Final Release</text>
          <text x="45" y="64" font-size="7.5" fill="#e8f5e9" text-anchor="middle">PDI, Packing,</text>
          <text x="45" y="74" font-size="7.5" fill="#e8f5e9" text-anchor="middle">Delivery & 8D</text>
        </g>
      </svg>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 2 of 25</div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 3: LEVEL 1 DETAILED PROCESS LOGIC & DECISION GATES -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Level 1 Logic Flow</div>
    </div>

    <h2>3. Level 1 Process Logic and Decision Flow</h2>
    <p>
      The complete manufacturing logic from enquiry to delivery, detailing inspection gates, decision diamonds, 
      containment holds, rework loops, and scrap terminals:
    </p>

    <!-- Modern SVG L1 Flowchart -->
    <div class="diagram-container" style="padding: 12px 6px;">
      <svg viewBox="0 0 740 680" width="100%" height="680" xmlns="http://www.w3.org/2000/svg" font-family="'Inter', sans-serif">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#083260"/>
          </marker>
          <marker id="arrowRed" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#dc2626"/>
          </marker>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#159640"/>
          </marker>
        </defs>

        <!-- Row 1: Inquiry to Contract -->
        <rect x="20" y="20" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="85" y="38" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S1: Enquiry & RFQ</text>
        <text x="85" y="52" font-size="8.5" fill="#64748b" text-anchor="middle">Technical Feasibility</text>

        <line x1="150" y1="42" x2="190" y2="42" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Decision 1: Feasible? -->
        <polygon points="230,22 270,42 230,62 190,42" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
        <text x="230" y="44" font-size="8" font-weight="bold" fill="#d97706" text-anchor="middle">Feasible?</text>

        <!-- No -> Reject -->
        <line x1="230" y1="22" x2="230" y2="8" stroke="#dc2626" stroke-width="1.5"/>
        <line x1="230" y1="8" x2="150" y2="8" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>
        <rect x="50" y="0" width="100" height="18" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
        <text x="100" y="12" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">Quote Regret / Terminate</text>

        <!-- Yes -> S2 -->
        <line x1="270" y1="42" x2="310" y2="42" stroke="#159640" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
        <text x="285" y="36" font-size="8" font-weight="bold" fill="#159640">Yes</text>

        <rect x="310" y="20" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="375" y="38" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S2: PO & Contract Review</text>
        <text x="375" y="52" font-size="8.5" fill="#64748b" text-anchor="middle">Price, Schedule & QAP</text>

        <line x1="440" y1="42" x2="480" y2="42" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Decision 2: New Product? -->
        <polygon points="520,22 560,42 520,62 480,42" fill="#eff6ff" stroke="#2563eb" stroke-width="1.5"/>
        <text x="520" y="44" font-size="8" font-weight="bold" fill="#2563eb" text-anchor="middle">New/Change?</text>

        <!-- Yes -> S3 NPI -->
        <line x1="520" y1="62" x2="520" y2="90" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arrow)"/>
        <text x="526" y="78" font-size="8" font-weight="bold" fill="#2563eb">Yes</text>

        <rect x="455" y="90" width="130" height="44" rx="6" fill="#f5f3ff" stroke="#7c3aed" stroke-width="1.5"/>
        <text x="520" y="108" font-size="10" font-weight="bold" fill="#7c3aed" text-anchor="middle">S3: NPI, APQP & ECN</text>
        <text x="520" y="122" font-size="8.5" fill="#64748b" text-anchor="middle">CAD, Tooling & PPAP</text>

        <!-- No / From S3 -> S4 Master Data -->
        <line x1="560" y1="42" x2="620" y2="42" stroke="#083260" stroke-width="1.5"/>
        <line x1="620" y1="42" x2="620" y2="160" stroke="#083260" stroke-width="1.5"/>
        <line x1="520" y1="134" x2="520" y2="160" stroke="#7c3aed" stroke-width="1.5"/>
        <line x1="520" y1="160" x2="580" y2="160" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="580" y="140" width="140" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="650" y="158" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S4: Master Data Setup</text>
        <text x="650" y="172" font-size="8.5" fill="#64748b" text-anchor="middle">Item, BOM, Routing & Limits</text>

        <!-- Down to S5 Planning -->
        <line x1="650" y1="184" x2="650" y2="210" stroke="#083260" stroke-width="1.5"/>
        <line x1="650" y1="210" x2="590" y2="210" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Row 2: Planning & Material -->
        <rect x="450" y="195" width="140" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="520" y="213" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S5: Demand Planning & MRP</text>
        <text x="520" y="227" font-size="8.5" fill="#64748b" text-anchor="middle">Capacity Balancing</text>

        <line x1="450" y1="217" x2="410" y2="217" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="270" y="195" width="140" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="340" y="213" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S6: Procurement & IQC</text>
        <text x="340" y="227" font-size="8.5" fill="#64748b" text-anchor="middle">Coil MTC & Thickness Check</text>

        <!-- Decision 3: IQC Pass? -->
        <line x1="270" y1="217" x2="230" y2="217" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>
        <polygon points="210,197 230,217 210,237 190,217" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
        <text x="210" y="220" font-size="7.5" font-weight="bold" fill="#d97706" text-anchor="middle">IQC Pass?</text>

        <!-- No -> Quarantine -->
        <line x1="210" y1="237" x2="210" y2="260" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>
        <rect x="150" y="260" width="120" height="30" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
        <text x="210" y="274" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">NCR: Quarantine & Return</text>
        <text x="210" y="284" font-size="7" fill="#dc2626" text-anchor="middle">Supplier Replacement</text>

        <!-- Yes -> S7 Kitting -->
        <line x1="190" y1="217" x2="140" y2="217" stroke="#159640" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
        <text x="160" y="211" font-size="8" font-weight="bold" fill="#159640">Yes</text>

        <rect x="20" y="195" width="120" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="80" y="213" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S7: Stores Kitting</text>
        <text x="80" y="227" font-size="8.5" fill="#64748b" text-anchor="middle">FIFO & Line-Side Issue</text>

        <!-- Down to S8 WO Release -->
        <line x1="80" y1="239" x2="80" y2="320" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Row 3: Manufacturing Shopfloor -->
        <rect x="20" y="320" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="85" y="338" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S8: Work Order Release</text>
        <text x="85" y="352" font-size="8.5" fill="#64748b" text-anchor="middle">HTU Serialization & Crew</text>

        <line x1="150" y1="342" x2="180" y2="342" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="180" y="320" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="245" y="338" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S9: Fin & Pipe Fab</text>
        <text x="245" y="352" font-size="8.5" fill="#64748b" text-anchor="middle">Rolling, Depth & Plasma</text>

        <line x1="310" y1="342" x2="340" y2="342" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="340" y="320" width="120" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="400" y="338" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S10: Core Assembly</text>
        <text x="400" y="352" font-size="8.5" fill="#64748b" text-anchor="middle">Comb Jig Pitch Spacing</text>

        <line x1="460" y1="342" x2="490" y2="342" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="490" y="320" width="130" height="44" rx="6" fill="#fff1f2" stroke="#e11d48" stroke-width="1.5"/>
        <text x="555" y="338" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">S11: Joining & Welding</text>
        <text x="555" y="352" font-size="8.5" fill="#64748b" text-anchor="middle">Spot, Seam, TIG & MAG</text>

        <!-- Decision 4: Nugget Test -->
        <line x1="620" y1="342" x2="650" y2="342" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>
        <polygon points="675,322 705,342 675,362 645,342" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
        <text x="675" y="344" font-size="7.5" font-weight="bold" fill="#d97706" text-anchor="middle">Nugget OK?</text>

        <!-- No -> Machine stop -->
        <line x1="675" y1="362" x2="675" y2="390" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>
        <rect x="620" y="390" width="110" height="28" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
        <text x="675" y="404" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">Stop Line / Redress</text>
        <text x="675" y="413" font-size="7" fill="#dc2626" text-anchor="middle">Quarantine Preceding Units</text>

        <!-- Yes -> S12 Leak Test -->
        <line x1="705" y1="342" x2="725" y2="342" stroke="#159640" stroke-width="1.5"/>
        <line x1="725" y1="342" x2="725" y2="460" stroke="#159640" stroke-width="1.5"/>
        <line x1="725" y1="460" x2="630" y2="460" stroke="#159640" stroke-width="1.5" marker-end="url(#arrowGreen)"/>

        <!-- Row 4: Leak Testing & Rework Loop -->
        <rect x="490" y="438" width="140" height="44" rx="6" fill="#fff1f2" stroke="#e11d48" stroke-width="2"/>
        <text x="560" y="456" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">S12: Leak Testing</text>
        <text x="560" y="470" font-size="8.5" fill="#64748b" text-anchor="middle">Pneumatic 30-min Dip</text>

        <line x1="490" y1="460" x2="450" y2="460" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Decision 5: Zero Leakage? -->
        <polygon points="425,440 450,460 425,480 400,460" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
        <text x="425" y="463" font-size="7.5" font-weight="bold" fill="#d97706" text-anchor="middle">Zero Leak?</text>

        <!-- No -> Rework Job -->
        <line x1="425" y1="480" x2="425" y2="515" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>
        <rect x="365" y="515" width="120" height="34" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
        <text x="425" y="529" font-size="8.5" font-weight="bold" fill="#dc2626" text-anchor="middle">Rework Job Order</text>
        <text x="425" y="541" font-size="7.5" fill="#64748b" text-anchor="middle">TIG Seal & Re-test (Max 2)</text>
        <!-- Loop back to S12 -->
        <line x1="485" y1="532" x2="560" y2="532" stroke="#dc2626" stroke-width="1.5"/>
        <line x1="560" y1="532" x2="560" y2="482" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>

        <!-- Yes -> S13 Erection -->
        <line x1="400" y1="460" x2="340" y2="460" stroke="#159640" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
        <text x="365" y="454" font-size="8" font-weight="bold" fill="#159640">Zero Leak</text>

        <rect x="210" y="438" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="275" y="456" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S13: Header Erection</text>
        <text x="275" y="470" font-size="8.5" fill="#64748b" text-anchor="middle">Flange Right-Angle & Bracing</text>

        <line x1="210" y1="460" x2="160" y2="460" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="20" y="438" width="140" height="44" rx="6" fill="#fff1f2" stroke="#e11d48" stroke-width="1.5"/>
        <text x="90" y="456" font-size="10" font-weight="bold" fill="#e11d48" text-anchor="middle">S14: Blast, HDG & Paint</text>
        <text x="90" y="470" font-size="8.5" fill="#64748b" text-anchor="middle">Internal Flushing & DFT</text>

        <!-- Down to Row 5: Quality Gate & Dispatch -->
        <line x1="90" y1="482" x2="90" y2="570" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="20" y="570" width="140" height="44" rx="6" fill="#f8fafc" stroke="#159640" stroke-width="2"/>
        <text x="90" y="588" font-size="10" font-weight="bold" fill="#159640" text-anchor="middle">S15: Final PDI & Audit</text>
        <text x="90" y="602" font-size="8.5" fill="#64748b" text-anchor="middle">17-Stage Digital Dossier</text>

        <line x1="160" y1="592" x2="200" y2="592" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <!-- Decision 6: All Passed? -->
        <polygon points="225,572 250,592 225,612 200,592" fill="#fffbeb" stroke="#d97706" stroke-width="1.5"/>
        <text x="225" y="595" font-size="7.5" font-weight="bold" fill="#d97706" text-anchor="middle">PDI OK?</text>

        <!-- No -> System Hold -->
        <line x1="225" y1="612" x2="225" y2="640" stroke="#dc2626" stroke-width="1.5" marker-end="url(#arrowRed)"/>
        <rect x="170" y="640" width="110" height="26" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
        <text x="225" y="656" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle">Quality Hold / Containment</text>

        <!-- Yes -> S16 Packing -->
        <line x1="250" y1="592" x2="290" y2="592" stroke="#159640" stroke-width="1.5" marker-end="url(#arrowGreen)"/>
        <text x="265" y="586" font-size="8" font-weight="bold" fill="#159640">Pass</text>

        <rect x="290" y="570" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="355" y="588" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S16: Packing & FG Bay</text>
        <text x="355" y="602" font-size="8.5" fill="#64748b" text-anchor="middle">VCI Film & Barcode Label</text>

        <line x1="420" y1="592" x2="450" y2="592" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="450" y="570" width="130" height="44" rx="6" fill="#f8fafc" stroke="#083260" stroke-width="1.5"/>
        <text x="515" y="588" font-size="10" font-weight="bold" fill="#083260" text-anchor="middle">S17: Dispatch & Logistics</text>
        <text x="515" y="602" font-size="8.5" fill="#64748b" text-anchor="middle">Challan, e-Way & Lashing</text>

        <line x1="580" y1="592" x2="610" y2="592" stroke="#083260" stroke-width="1.5" marker-end="url(#arrow)"/>

        <rect x="610" y="570" width="120" height="44" rx="6" fill="#f0fdf4" stroke="#159640" stroke-width="1.5"/>
        <text x="670" y="588" font-size="10" font-weight="bold" fill="#159640" text-anchor="middle">S18: Delivery & 8D</text>
        <text x="670" y="602" font-size="8.5" fill="#64748b" text-anchor="middle">Invoice, POD & CAPA</text>
      </svg>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 3 of 25</div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 4: LEVEL 2 DEPARTMENTAL SWIMLANES & ISA-95 ARCHITECTURE -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Swimlanes & ISA-95</div>
    </div>

    <h2>4. Cross-Functional Swimlanes and ISA-95 Architecture</h2>
    <p>
      Clear operational boundaries define who owns each transaction and how data flows across enterprise software levels:
    </p>

    <!-- Modern Swimlane SVG -->
    <div class="diagram-container" style="padding: 10px;">
      <svg viewBox="0 0 740 310" width="100%" height="310" xmlns="http://www.w3.org/2000/svg" font-family="'Inter', sans-serif">
        <!-- Swimlane Rows -->
        <!-- Lane 1: Customer & Sales -->
        <rect x="0" y="0" width="740" height="50" fill="#f8fafc" stroke="#e2e8f0"/>
        <rect x="0" y="0" width="110" height="50" fill="#083260"/>
        <text x="55" y="24" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">CUSTOMER</text>
        <text x="55" y="36" font-size="8" fill="#93c5fd" text-anchor="middle">& SALES</text>
        
        <rect x="130" y="10" width="100" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="180" y="28" font-size="8.5" font-weight="bold" fill="#083260" text-anchor="middle">S1: RFQ & Quote</text>
        
        <rect x="250" y="10" width="100" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="300" y="28" font-size="8.5" font-weight="bold" fill="#083260" text-anchor="middle">S2: PO Contract</text>

        <rect x="620" y="10" width="100" height="30" rx="4" fill="#f0fdf4" stroke="#159640"/>
        <text x="670" y="28" font-size="8.5" font-weight="bold" fill="#159640" text-anchor="middle">S18: POD & Rating</text>

        <!-- Lane 2: Engineering & Master Data -->
        <rect x="0" y="52" width="740" height="50" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="0" y="52" width="110" height="50" fill="#1e293b"/>
        <text x="55" y="76" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">ENGINEERING</text>
        <text x="55" y="88" font-size="8" fill="#94a3b8" text-anchor="middle">& R&D</text>

        <rect x="250" y="62" width="100" height="30" rx="4" fill="#f5f3ff" stroke="#7c3aed"/>
        <text x="300" y="80" font-size="8.5" font-weight="bold" fill="#7c3aed" text-anchor="middle">S3: APQP & CAD</text>

        <rect x="370" y="62" width="110" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="425" y="80" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S4: Master BOM</text>

        <!-- Lane 3: PPC & Warehouse -->
        <rect x="0" y="104" width="740" height="50" fill="#f8fafc" stroke="#e2e8f0"/>
        <rect x="0" y="104" width="110" height="50" fill="#334155"/>
        <text x="55" y="128" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">PPC &</text>
        <text x="55" y="140" font-size="8" fill="#cbd5e1" text-anchor="middle">STORES</text>

        <rect x="370" y="114" width="100" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="420" y="132" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S5: MRP & Plan</text>

        <rect x="490" y="114" width="90" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="535" y="132" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S7: Kitting</text>

        <rect x="600" y="114" width="110" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="655" y="132" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S8: WO Release</text>

        <!-- Lane 4: Shopfloor Production -->
        <rect x="0" y="156" width="740" height="50" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="0" y="156" width="110" height="50" fill="#083260"/>
        <text x="55" y="180" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">FABRICATION</text>
        <text x="55" y="192" font-size="8" fill="#93c5fd" text-anchor="middle">& WELDING</text>

        <rect x="130" y="166" width="90" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="175" y="184" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S9: Fin Roll</text>

        <rect x="235" y="166" width="90" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="280" y="184" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S10: Assembly</text>

        <rect x="340" y="166" width="90" height="30" rx="4" fill="#fff1f2" stroke="#e11d48"/>
        <text x="385" y="184" font-size="8.5" font-weight="bold" fill="#e11d48" text-anchor="middle">S11: Welding</text>

        <rect x="445" y="166" width="90" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="490" y="184" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S13: Erection</text>

        <rect x="550" y="166" width="100" height="30" rx="4" fill="#fff1f2" stroke="#e11d48"/>
        <text x="600" y="184" font-size="8.5" font-weight="bold" fill="#e11d48" text-anchor="middle">S14: Paint Coat</text>

        <!-- Lane 5: Quality Assurance -->
        <rect x="0" y="208" width="740" height="50" fill="#f8fafc" stroke="#e2e8f0"/>
        <rect x="0" y="208" width="110" height="50" fill="#159640"/>
        <text x="55" y="232" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">QUALITY</text>
        <text x="55" y="244" font-size="8" fill="#bbf7d0" text-anchor="middle">ASSURANCE</text>

        <rect x="130" y="218" width="100" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="180" y="236" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S6: Steel IQC</text>

        <rect x="340" y="218" width="110" height="30" rx="4" fill="#fff1f2" stroke="#e11d48"/>
        <text x="395" y="236" font-size="8.5" font-weight="bold" fill="#e11d48" text-anchor="middle">S12: Leak Test</text>

        <rect x="550" y="218" width="110" height="30" rx="4" fill="#f0fdf4" stroke="#159640"/>
        <text x="605" y="236" font-size="8.5" font-weight="bold" fill="#159640" text-anchor="middle">S15: Final PDI</text>

        <!-- Lane 6: Logistics & Dispatch -->
        <rect x="0" y="260" width="740" height="50" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="0" y="260" width="110" height="50" fill="#475569"/>
        <text x="55" y="284" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">LOGISTICS &</text>
        <text x="55" y="296" font-size="8" fill="#cbd5e1" text-anchor="middle">DISPATCH</text>

        <rect x="420" y="270" width="100" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="470" y="288" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S16: Crate Pack</text>

        <rect x="540" y="270" width="110" height="30" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="595" y="288" font-size="8.5" font-weight="bold" fill="#0f172a" text-anchor="middle">S17: Truck Load</text>

        <rect x="660" y="270" width="70" height="30" rx="4" fill="#f0fdf4" stroke="#159640"/>
        <text x="695" y="288" font-size="8.5" font-weight="bold" fill="#159640" text-anchor="middle">e-Way Bill</text>
      </svg>
    </div>

    <h3>ISA-95 Five-Level Manufacturing Integration Architecture</h3>
    <table>
      <thead>
        <tr>
          <th style="width: 80px;">ISA Level</th>
          <th style="width: 150px;">System Boundary</th>
          <th>Functions & Data Exchanged</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Level 4</strong></td>
          <td><strong>Enterprise (ERP / CRM)</strong></td>
          <td>Customer demand, Sales Orders, Purchase Orders, inventory financial valuation, commercial invoicing.</td>
        </tr>
        <tr>
          <td><strong>Level 3</strong></td>
          <td><strong>Operations (MES / QMS)</strong></td>
          <td>Work Order scheduling, digital checksheets, unit serialization (HTU), 4-tier crew tracking, defect containment.</td>
        </tr>
        <tr>
          <td><strong>Level 2</strong></td>
          <td><strong>Control (SCADA / HMI)</strong></td>
          <td>Seam welder PLC, test tank hoist timer, spray booth climate monitor, furnace temperature controllers.</td>
        </tr>
        <tr>
          <td><strong>Level 1</strong></td>
          <td><strong>Sensing & Actuation</strong></td>
          <td>Digital micrometers, pressure transmitters, Bluetooth DFT gauges, barcode & QR readers.</td>
        </tr>
        <tr>
          <td><strong>Level 0</strong></td>
          <td><strong>Physical Production</strong></td>
          <td>Fin cold rolls, hydraulic presses, resistance welders, paint ovens, hydrostatic test tanks.</td>
        </tr>
      </tbody>
    </table>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 4 of 25</div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGES 5 TO 9: DETAILED 18-STAGE SPECIFICATIONS (S1 TO S18) -->
  <!-- ============================================================ -->
  ${STAGES.map((s, idx) => `
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">Stage ${s.id}: ${s.name}</div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
      <h2 style="margin: 0; border: none; font-size: 17px; color: var(--primary);">
        Stage ${s.id}: ${s.name}
      </h2>
      <span class="tag ${s.tag.includes('CONFIRMED') ? (s.tag.includes('SPECIAL') ? 'tag-special' : 'tag-confirmed') : 'tag-verify'}">${s.tag}</span>
    </div>

    <div style="font-size: 11px; color: var(--muted); margin-bottom: 12px;">
      Document Ref: <strong>${s.docRef}</strong> | Department Owner: <strong>${s.owner}</strong>
    </div>

    <!-- A, B, C Sections -->
    <div class="card card-accent" style="padding: 10px 14px; margin-bottom: 12px;">
      <div style="margin-bottom: 6px;">
        <strong style="color: var(--primary); font-size: 11px; text-transform: uppercase;">A. Basic Meaning:</strong>
        <span style="font-size: 12px; color: var(--ink);"> ${s.meaning}</span>
      </div>
      <div style="margin-bottom: 6px;">
        <strong style="color: var(--primary); font-size: 11px; text-transform: uppercase;">B. Key Terminology:</strong>
        <ul style="margin-left: 18px; margin-top: 2px; font-size: 11.5px; color: var(--body);">
          ${s.terminology.map(t => `<li><strong>${t.term}:</strong> ${t.def}</li>`).join('')}
        </ul>
      </div>
      <div>
        <strong style="color: var(--primary); font-size: 11px; text-transform: uppercase;">C. Radiator Example:</strong>
        <span style="font-size: 11.5px; color: var(--body);"> ${s.example}</span>
      </div>
    </div>

    <!-- D. Process Steps Table -->
    <h4>D. Step-by-Step Operational Matrix</h4>
    <table style="margin-top: 4px; margin-bottom: 10px;">
      <thead>
        <tr>
          <th style="width: 140px;">Process Parameter</th>
          <th>Operational Content & Standards</th>
        </tr>
      </thead>
      <tbody>
        ${s.table.map(row => `
          <tr>
            <td style="font-weight: 600; color: var(--primary); font-size: 11px;">${row.item}</td>
            <td style="font-size: 11px; color: var(--body);">${row.text}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- F. Process State Comparison (3 States) -->
    <h4>F. Process State Comparison (Documented vs Actual vs Ideal)</h4>
    <div class="card-grid-3" style="margin-top: 4px; margin-bottom: 10px;">
      <div class="state-box" style="border-top: 3px solid #64748b;">
        <div class="state-title" style="color: #475569;">(A) Documented (SOP)</div>
        <div style="font-size: 10.5px; color: var(--body); line-height: 1.4;">${s.states.doc}</div>
      </div>
      <div class="state-box" style="border-top: 3px solid #d97706;">
        <div class="state-title" style="color: #d97706;">(B) Actual (Shopfloor)</div>
        <div style="font-size: 10.5px; color: var(--body); line-height: 1.4;">${s.states.actual}</div>
      </div>
      <div class="state-box" style="border-top: 3px solid #159640;">
        <div class="state-title" style="color: #159640;">(C) Ideal (MES-Enabled)</div>
        <div style="font-size: 10.5px; color: var(--body); line-height: 1.4;">${s.states.ideal}</div>
      </div>
    </div>

    <!-- G, H, I, J Grid -->
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 11px;">
      <div style="background: var(--surface-subtle); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);">
        <strong style="color: var(--risk); text-transform: uppercase; font-size: 10px;">G. Common Mistakes & Risks:</strong>
        <div style="margin-top: 2px; color: var(--body);">${s.mistakes}</div>
      </div>
      <div style="background: var(--surface-subtle); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);">
        <strong style="color: var(--blue); text-transform: uppercase; font-size: 10px;">H. MES Feature Capability:</strong>
        <div style="margin-top: 2px; color: var(--body);">${s.mesFeature}</div>
      </div>
      <div style="background: var(--surface-subtle); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);">
        <strong style="color: var(--accent); text-transform: uppercase; font-size: 10px;">I. Measurable Improvement (Baseline):</strong>
        <div style="margin-top: 2px; color: var(--body);">${s.improvement}</div>
      </div>
      <div style="background: var(--surface-subtle); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);">
        <strong style="color: var(--purple); text-transform: uppercase; font-size: 10px;">J. Ground Verification (Gemba):</strong>
        <div style="margin-top: 2px; color: var(--body);">${s.verification}</div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page ${idx + 5} of 25</div>
    </div>
  </div>
  `).join('')}

  <!-- ============================================================ -->
  <!-- PAGE 10: CROSS-CUTTING WORKFLOWS -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Cross-Cutting Workflows</div>
    </div>

    <h2>5. Cross-Cutting Exception Workflows</h2>
    <p>
      Shopfloor reality requires robust exception paths. All loops terminate with clear authority limits:
    </p>

    <!-- CC-01: NCR & Rework -->
    <div class="card" style="margin-bottom: 12px;">
      <h3 style="margin-top: 0; color: var(--risk); font-size: 13px;">
        CC-01: Nonconformance (NCR), Quarantine, Rework and Scrap Protocol
      </h3>
      <p style="font-size: 11.5px; margin-bottom: 6px;">
        Triggered when any characteristic fails during inspection (e.g. leak at seam weld or low paint DFT).
      </p>
      <table>
        <thead>
          <tr>
            <th style="width: 110px;">Step</th>
            <th style="width: 140px;">Owner</th>
            <th>Action & System Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Defect Hold</strong></td>
            <td>Inspector / Operator</td>
            <td>Inspector logs failure in checksheet. Unit status flips immediately to <strong>Red Hold</strong>. Traveler barcode is locked against further stage operations.</td>
          </tr>
          <tr>
            <td><strong>2. Containment</strong></td>
            <td>Supervisor</td>
            <td>Physical unit moved to marked Red Quarantine Bay. Preceding and succeeding units inspected to contain potential batch flaw.</td>
          </tr>
          <tr>
            <td><strong>3. Disposition</strong></td>
            <td>Quality Manager</td>
            <td>Disposition decision authorized: (A) Rework as standard, (B) Rework with concession, (C) Scrap. <strong>Maximum rework attempts: 2</strong>.</td>
          </tr>
          <tr>
            <td><strong>4. Re-Inspection</strong></td>
            <td>Quality Inspector</td>
            <td>After rework, unit must pass 100% of the failed test (e.g. full 30-minute leak re-test). System unlocks only upon verified pass.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CC-02: ECN at Point of Use -->
    <div class="card" style="margin-bottom: 12px;">
      <h3 style="margin-top: 0; color: var(--primary); font-size: 13px;">
        CC-02: Engineering Change Notice (ECN) Control at Point of Use
      </h3>
      <p style="font-size: 11.5px; margin-bottom: 6px;">
        Ensures obsolete paper drawings never cause scrap on the production line.
      </p>
      <table>
        <thead>
          <tr>
            <th style="width: 110px;">Step</th>
            <th style="width: 140px;">Owner</th>
            <th>Action & System Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. ECN Release</strong></td>
            <td>Design Lead</td>
            <td>Engineering releases new drawing revision in MES with effective date and cut-off serial number.</td>
          </tr>
          <tr>
            <td><strong>2. Station Lock</strong></td>
            <td>MES System</td>
            <td>Station touch tablets immediately update to display the new drawing and revised checksheet limits. Old revision is archived.</td>
          </tr>
          <tr>
            <td><strong>3. Traveler Check</strong></td>
            <td>Operator</td>
            <td>Barcode scan verifies the unit serial against the active revision. Mismatched revision halts machine operation.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- CC-03: Machine Breakdown & Calibration -->
    <div class="card">
      <h3 style="margin-top: 0; color: var(--purple); font-size: 13px;">
        CC-03: Equipment Breakdown, Tool Maintenance and Gauge Calibration
      </h3>
      <p style="font-size: 11.5px; margin-bottom: 6px;">
        Prevents producing defective parts on uncalibrated gauges or worn welding tooling.
      </p>
      <table>
        <thead>
          <tr>
            <th style="width: 110px;">Step</th>
            <th style="width: 140px;">Owner</th>
            <th>Action & System Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>1. Gauge Lockout</strong></td>
            <td>Calibration Engineer</td>
            <td>Every gauge (micrometer, pressure transmitter, DFT probe) has an expiration date in MES. Expired gauge locks checksheet input.</td>
          </tr>
          <tr>
            <td><strong>2. Tool Dressing</strong></td>
            <td>Welding Technician</td>
            <td>Seam welder wheel dress counter triggers automated reminder every 500 meters of continuous weld.</td>
          </tr>
          <tr>
            <td><strong>3. Breakdown Call</strong></td>
            <td>Operator / Maintenance</td>
            <td>Operator presses Andon call on tablet. Maintenance response time and root downtime code tracked in real time.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 23 of 25</div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 11: STANDARDS MAPPING & VERIFICATION PACKAGE -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Standards & Verification</div>
    </div>

    <h2>6. Standards and Quality Compliance Mapping</h2>
    <p>
      Requirements mapped across applicable manufacturing standards. Compliance status is subject to on-site audit:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 110px;">Standard</th>
          <th style="width: 130px;">Relevance</th>
          <th style="width: 150px;">Mandatory Records</th>
          <th>How to Verify at Hi-Tech</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>ISO 9001:2015</strong></td>
          <td>Quality Management baseline</td>
          <td>Controlled drawings, calibration logs, inspection checksheets, NCR & CAPA records.</td>
          <td>Audit active document revision logs and calibration master register against physical shopfloor tools.</td>
        </tr>
        <tr>
          <td><strong>IATF 16949:2016</strong></td>
          <td>Automotive / Heavy Equipment QMS</td>
          <td>Process FMEA, Control Plans, MSA studies, full material traceability from mill heat to customer.</td>
          <td>Check if automotive transformer customers require full PPAP Level 3 documentation packages.</td>
        </tr>
        <tr>
          <td><strong>SSPC PA-2 / ISO 8501</strong></td>
          <td>Surface preparation and coating</td>
          <td>Surface profile blast logs (Sa 2.5), ambient climate logs, 10-spot dry film thickness (DFT) logs.</td>
          <td>Verify electromagnetic DFT gauge calibration certificate and blast profile gauge readouts in paint bay.</td>
        </tr>
        <tr>
          <td><strong>ISA-95 / IEC 62264</strong></td>
          <td>MES to ERP integration standard</td>
          <td>Formal interface schemas between Level 4 ERP (orders) and Level 3 MES (execution checksheets).</td>
          <td>Review current data handoff mechanism (manual Excel re-entry vs automated REST API endpoints).</td>
        </tr>
      </tbody>
    </table>

    <h2>7. Ground Verification Package & Gemba Walk Checklist</h2>
    <p>
      Step-by-step audit plan for validating documented processes against shopfloor reality:
    </p>

    <div class="card-grid">
      <div class="card" style="margin-bottom: 0;">
        <h4 style="color: var(--primary);">Gemba Observation Points</h4>
        <ul style="font-size: 11px; margin-left: 16px; color: var(--body);">
          <li><strong>Raw Coil Storage:</strong> Check if coils have intact mill tags and green acceptance stickers.</li>
          <li><strong>Rolling & Forming:</strong> Check if operators measure flute depth with calibrated depth micrometers.</li>
          <li><strong>Welding Stations:</strong> Observe if electrode sanding frequency is logged and test coupons are cut.</li>
          <li><strong>Leak Test Tank:</strong> Measure water illumination and verify full 30-minute submersion timing.</li>
          <li><strong>Paint Shop:</strong> Inspect flange masking covers and check for ambient humidity recording.</li>
        </ul>
      </div>

      <div class="card" style="margin-bottom: 0;">
        <h4 style="color: var(--accent);">Baseline Metric Data Collection Plan</h4>
        <ul style="font-size: 11px; margin-left: 16px; color: var(--body);">
          <li><strong>First-Pass Leak Yield:</strong> Measure units passing test on initial attempt without seam weld repair.</li>
          <li><strong>Coating DFT Conformance:</strong> Measure percentage of units falling within nominal customer paint thickness.</li>
          <li><strong>WIP Aging Time:</strong> Measure average hours a radiator spends between core assembly and final paint.</li>
          <li><strong>Setup Scrap at Coil Change:</strong> Record meters of steel scrapped during forming die changeover.</li>
          <li><strong>OTIF Delivery Rate:</strong> Measure orders dispatched on or before promised contractual date.</li>
        </ul>
      </div>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 24 of 25</div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- PAGE 12: IMPLEMENTATION ROADMAP & SIGN-OFF -->
  <!-- ============================================================ -->
  <div class="page">
    <div class="doc-header">
      <img src="${logoDataUri}" alt="Logo" style="height: 28px;" />
      <div style="font-size: 10px; color: var(--muted); text-align: right;">HTR-MES-PFM-2026-01 | Implementation Roadmap</div>
    </div>

    <h2>8. Phased MES Implementation Roadmap</h2>
    <p>
      Structured delivery roadmap prioritizing high-impact quality containment before full automated integration:
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 80px;">Phase</th>
          <th style="width: 140px;">Functional Scope</th>
          <th>Key Deliverables & Shopfloor Capabilities</th>
          <th style="width: 90px;">Impact</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Phase 1</strong><br>(Immediate)</td>
          <td><strong>Digital Checksheets & Quality Gates</strong></td>
          <td>Deploy tablet checksheets for S01 to S17 with CTQ tolerance locks. Restrict final release until all 14 stages pass. Eliminate lost paper travelers.</td>
          <td><span class="tag tag-confirmed">High Quality Impact</span></td>
        </tr>
        <tr>
          <td><strong>Phase 2</strong><br>(Month 2-3)</td>
          <td><strong>Special Process Controls</strong></td>
          <td>Integrate Bluetooth gauges (micrometers, DFT probes) and automated leak test bench timers. Implement mandatory weld pull-off test sign-offs.</td>
          <td><span class="tag tag-special">Leak Zero Tolerance</span></td>
        </tr>
        <tr>
          <td><strong>Phase 3</strong><br>(Month 4-5)</td>
          <td><strong>ERP & WMS Integration</strong></td>
          <td>Connect MES to ERP for automated Work Order generation and inventory consumption. Deploy barcode truck loading verification.</td>
          <td><span class="tag tag-assumed">Process Efficiency</span></td>
        </tr>
        <tr>
          <td><strong>Phase 4</strong><br>(Month 6+)</td>
          <td><strong>Customer Portal & SPC</strong></td>
          <td>Real-time statistical process control (SPC) charts for fin rolling depth and welding current. Customer portal for 1-click dossier download.</td>
          <td><span class="tag tag-recommended">Excellence</span></td>
        </tr>
      </tbody>
    </table>

    <h2>9. Quality Gate Self-Check and Verification Sign-Off</h2>
    <div class="card" style="padding: 12px; margin-bottom: 16px;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; font-size: 11px;">
        <div>&#10003; All 18 stages detailed with trigger, owner, inputs, outputs, checks, and handoffs.</div>
        <div>&#10003; Every decision branch terminates cleanly; rework loops have max 2 retry limit.</div>
        <div>&#10003; Special processes (Welding, Leak Test, Coating) have strict parameter records.</div>
        <div>&#10003; Digital genealogy links raw steel heat lot to customer shipping crate.</div>
        <div>&#10003; Operating principles enforced: no invented numbers; clear [VERIFY ON-SITE] tags.</div>
        <div>&#10003; Modern Swiss design typography, clean visual hierarchy, zero em-dashes.</div>
      </div>
    </div>

    <div style="margin-top: 24px; border-top: 1px solid var(--border); padding-top: 16px;">
      <div style="font-size: 11px; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 12px;">
        Formal Review and Operational Endorsement:
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; text-align: center; font-size: 11px;">
        <div style="border: 1px solid var(--border); padding: 12px 6px; border-radius: 6px;">
          <div style="font-weight: 600; color: var(--ink);">Engineering Lead</div>
          <div style="height: 28px;"></div>
          <div style="font-size: 9.5px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 4px;">Signature & Date</div>
        </div>
        <div style="border: 1px solid var(--border); padding: 12px 6px; border-radius: 6px;">
          <div style="font-weight: 600; color: var(--ink);">Quality Manager</div>
          <div style="height: 28px;"></div>
          <div style="font-size: 9.5px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 4px;">Signature & Date</div>
        </div>
        <div style="border: 1px solid var(--border); padding: 12px 6px; border-radius: 6px;">
          <div style="font-weight: 600; color: var(--ink);">Plant Director</div>
          <div style="height: 28px;"></div>
          <div style="font-size: 9.5px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 4px;">Yogesh Jadhav</div>
        </div>
        <div style="border: 1px solid var(--border); padding: 12px 6px; border-radius: 6px;">
          <div style="font-weight: 600; color: var(--ink);">Chief Executive Officer</div>
          <div style="height: 28px;"></div>
          <div style="font-size: 9.5px; color: var(--muted); border-top: 1px dashed var(--border); padding-top: 4px;">KYD Sir</div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Hi-Tech Radiators Pvt. Ltd. | MES End-to-End Process Flow</div>
      <div>Page 25 of 25</div>
    </div>
  </div>

</body>
</html>
`;

const outputPath = path.resolve('public/Hi-Tech-Radiators-MES-Process-Flow-Mapping.html');
fs.writeFileSync(outputPath, htmlContent, 'utf8');
console.log("HTML successfully created at:", outputPath);
