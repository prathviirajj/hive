"use client";

import React, { useState, useMemo } from "react";
import {
  Workflow,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Calculator,
  Eye,
  Activity,
  FileText,
  Sliders,
  Maximize2,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
  Clock,
  User,
  Wrench,
  Gauge,
  CornerDownRight,
  ExternalLink
} from "lucide-react";

export interface StageNode {
  id: string;
  code: string;
  name: string;
  phase: string;
  stream: "commercial" | "fin" | "header" | "assembly" | "surface" | "logistics";
  sequenceOrder: number;
  owner: string;
  isCTQ?: boolean;
  isGate?: boolean;
  docRef: string;
  formula?: string;
  calculatedParameters?: { label: string; value: string; tolerance: string }[];
  acceptanceCriteria: string;
  stepDetails: {
    inputs: string;
    activities: string;
    equipment: string;
    records: string;
  };
  failureModes: {
    pass: string;
    drift?: string;
    fail: string;
    reworkPolicy: string;
  };
}

export const COMPLETE_MES_STAGES: StageNode[] = [
  // Phase 1: Commercial & Contract Review
  {
    id: "stage-s1",
    code: "S01-COM",
    name: "Customer RFQ & Technical Feasibility Check",
    phase: "Phase 1: Commercial & Planning",
    stream: "commercial",
    sequenceOrder: 1,
    owner: "Sales Manager, Head of Engineering",
    docRef: "SOP/SALES/01",
    formula: "Tooling Compatibility = f(Center Distance, Fin Width, Element Count)",
    calculatedParameters: [
      { label: "Radiator Center Distance (CC)", value: "2900 / 2286 mm", tolerance: "+-1.0 mm" },
      { label: "Fin Width & Flute Depth", value: "520 mm / 4.0 - 5.0 mm", tolerance: "Nominal" },
      { label: "Element Count", value: "26 / 36 Fins", tolerance: "Exact per Drawing" }
    ],
    acceptanceCriteria: "Tooling envelope matches shopfloor press dies, center distance is within factory bed limits, paint specs verified.",
    stepDetails: {
      inputs: "Customer specification sheet, 2D outline drawing, paint specification, requested delivery schedule.",
      activities: "1. Log inquiry in CRM. 2. Verify tooling compatibility against die catalog. 3. Calculate raw steel, paint, and labor costs. 4. Issue formal quotation.",
      equipment: "CAD Viewer, Standard Costing Matrix, CRM System",
      records: "Inquiry ID, Technical Feasibility Sign-off, Signed Quotation"
    },
    failureModes: {
      pass: "Feasible -> Issue commercial & technical quotation.",
      drift: "Non-standard CC distance -> Propose nearest standard die tooling or quote custom tooling surcharge.",
      fail: "Exceeds press bed length (>4500mm) -> Issue polite regret or engineering deviation request.",
      reworkPolicy: "Re-evaluate with revised customer specs before final commercial sign-off."
    }
  },
  {
    id: "stage-s2",
    code: "S02-COM",
    name: "PO Receipt, Contract Review & QAP Agreement",
    phase: "Phase 1: Commercial & Planning",
    stream: "commercial",
    sequenceOrder: 2,
    owner: "Sales Manager, Quality Manager, PPC",
    docRef: "SOP/SALES/02",
    isGate: true,
    acceptanceCriteria: "Price, delivery dates, QAP witness hold points, and inspection standards strictly match accepted quotation.",
    stepDetails: {
      inputs: "Customer Purchase Order, technical specification sheet, approved QAP draft.",
      activities: "1. Cross-check PO terms against quotation. 2. Validate factory capacity with PPC. 3. Identify customer witness inspection points. 4. Issue Order Acknowledgment.",
      equipment: "ERP Contract Review Module, QAP Repository",
      records: "Sales Order Number, Signed Contract Review Form, Customer Approved QAP"
    },
    failureModes: {
      pass: "PO verified -> Release Sales Order & trigger Engineering APQP.",
      drift: "Delivery schedule mismatch -> Negotiate phased delivery batches with customer.",
      fail: "Commercial terms unresolvable -> Hold order until amendment is received.",
      reworkPolicy: "Contract review re-tabled upon receipt of customer formal PO amendment."
    }
  },
  {
    id: "stage-s3",
    code: "S03-ENG",
    name: "Engineering APQP, 3D CAD & Master Data Setup",
    phase: "Phase 2: Engineering & Master Setup",
    stream: "commercial",
    sequenceOrder: 3,
    owner: "Lead Design Engineer, ERP Master Data Admin",
    docRef: "SOP/ENG/01",
    formula: "Core Total Length L = (N - 1) * 45 mm + 2 * Plate Thickness",
    calculatedParameters: [
      { label: "Calculated Core Length (26 Fins)", value: "1137 mm", tolerance: "+-2.0 mm" },
      { label: "Header Pipe Length", value: "CC Distance + 200 mm", tolerance: "+-1.0 mm" },
      { label: "Theoretical Steel Weight", value: "Per SolidWorks Model", tolerance: "+-1.5%" }
    ],
    acceptanceCriteria: "SolidWorks 3D model approved by customer; Item Master, multi-level BOM, and routing limits locked in ERP.",
    stepDetails: {
      inputs: "Customer approved design drawing, engineering standards (IS 513, IS 1161, IS 1239).",
      activities: "1. Generate 3D CAD model & 2D shopfloor fabrication drawings. 2. Build multi-level BOM. 3. Configure inspection checksheet limits in MES.",
      equipment: "SolidWorks 2024, AutoCAD, ERP Master Data Hub",
      records: "Approved Engineering Drawing, Released BOM, MES Checksheet Template"
    },
    failureModes: {
      pass: "Master Data locked -> Trigger Demand Planning & Material Reservation.",
      drift: "Drawing revision pending -> Issue temporary engineering hold tag in MES.",
      fail: "Interference detected in 3D model -> Immediate CAD revision before drawing release.",
      reworkPolicy: "ECN (Engineering Change Notice) workflow with mandatory revision increment."
    }
  },
  {
    id: "stage-s4",
    code: "S04-PPC",
    name: "Demand Planning, MRP & Work Order Release",
    phase: "Phase 2: Engineering & Master Setup",
    stream: "commercial",
    sequenceOrder: 4,
    owner: "PPC Head, Production Supervisor",
    docRef: "SOP/PPC/01",
    isGate: true,
    acceptanceCriteria: "Raw material reserved, machine capacity allocated, HTU serial barcode traveler issued to shopfloor.",
    stepDetails: {
      inputs: "Sales Order, Item BOM, raw material stock levels, machine capacity calendar.",
      activities: "1. Run MRP calculation. 2. Verify steel coil and pipe batch availability. 3. Generate Work Order traveler with serialized barcode. 4. Assign 4-tier crew.",
      equipment: "ERP / MES Production Planning Dashboard",
      records: "Work Order Number, HTU Serial Barcode, Production Schedule Sheet"
    },
    failureModes: {
      pass: "All resources allocated -> Traveler printed -> Dispatch to shopfloor.",
      drift: "Raw material short -> Allocate alternate certified mill batch with QA approval.",
      fail: "Machine bottleneck -> Reschedule on parallel welding line.",
      reworkPolicy: "Re-run MRP capacity leveling algorithm."
    }
  },

  // Phase 3: Procurement & Incoming Quality (RM QC)
  {
    id: "stage-s5",
    code: "S05-RQC",
    name: "Incoming Raw Material Inspection (Coil, Pipe, Paint)",
    phase: "Phase 3: Raw Material Quality",
    stream: "commercial",
    sequenceOrder: 5,
    owner: "Incoming QC Inspector, Stores Manager",
    docRef: "SOP/QC/INCOMING/01",
    isCTQ: true,
    isGate: true,
    formula: "CRCA Coil Yield Strength: 140 - 240 MPa | Elongation >= 38% (IS 513:2016 CR2)",
    calculatedParameters: [
      { label: "Coil Thickness (1.2mm)", value: "1.20 mm", tolerance: "+-0.03 mm" },
      { label: "Coil Width (520mm)", value: "520 mm", tolerance: "-0, +1.0 mm" },
      { label: "ERW Header Pipe (80 NB)", value: "88.9 mm OD x 4.5 mm Wall", tolerance: "+-0.2 mm" },
      { label: "Paint Batch Viscosity", value: "AkzoNobel & Ching RD-124 MTC", tolerance: "100% Certified" }
    ],
    acceptanceCriteria: "Mill Test Certificate (MTC) 100% verified; zero surface rust, pits, or edge burrs; coil waviness nil.",
    stepDetails: {
      inputs: "Supplier delivery challan, Mill TC, physical steel coils and ERW pipes.",
      activities: "1. Verify heat number on coil against MTC. 2. Gauge thickness across 5 points using micrometer. 3. Check coil edge waviness on granite table. 4. Log in MES.",
      equipment: "Digital Micrometer, Vernier Caliper, Hardness Tester, Granite Surface Table",
      records: "Incoming Inspection Report (IIR), Mill TC Dossier, MES Raw Material Batch Log"
    },
    failureModes: {
      pass: "Conforming -> Attach Green Acceptance Tag -> Move to FIFO Kitting Bins.",
      drift: "Thickness near lower tolerance -> Segregate coil for non-critical element production.",
      fail: "Coil thickness out of tolerance (>+-0.03mm) or heavy surface pitting -> Attach Red Hold Tag -> Quarantine Bay.",
      reworkPolicy: "Supplier NCR issued; supplier must replace rejected coils within 48 hours."
    }
  },

  // Phase 4: Core Fin Fabrication (Stages S01 to S07)
  {
    id: "stage-s01",
    code: "S01-FAB",
    name: "Fin Cold Rolling, Forming & Cutting",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 6,
    owner: "Rolling Machine Operator, Line Quality Checker",
    docRef: "SOP/PROD/ROLL/01",
    formula: "Roll Depth Dr = 4.0 to 5.0 mm | Die Forming Depth Dd = 3.5 to 5.0 mm | Pitch P = 45 +- 1.0 mm",
    calculatedParameters: [
      { label: "Neck-to-Neck Length L", value: "1700 mm (Calculated from CC)", tolerance: "+-1.0 mm" },
      { label: "Rolling Flute Depth Dr", value: "4.5 mm", tolerance: "4.0 to 5.0 mm" },
      { label: "Die Forming Depth Dd", value: "4.0 mm", tolerance: "3.5 to 5.0 mm" },
      { label: "Sheet Waviness", value: "0.0 mm", tolerance: "Nil Allowed" }
    ],
    acceptanceCriteria: "Uniform flute depth, zero surface scoring, first piece 100% verified before batch run authorization.",
    stepDetails: {
      inputs: "CRCA steel coil 1.0/1.2mm, rolling machine tooling setup, shop drawing.",
      activities: "1. Mount coil on uncoiler. 2. Cold roll flute profiles. 3. Form neck profiles on hydraulic die. 4. Cut fin flutes to calculated length.",
      equipment: "Cold Fin Rolling Mill, Hydraulic Die Forming Press, Automatic Shearing Unit",
      records: "Stage S01 First-Piece Checksheet, Hourly Parameter Log"
    },
    failureModes: {
      pass: "Conforming -> Digital sign-off -> Continuous batch run unlocked.",
      drift: "Drift detected (Dr > 5.0mm) -> Operator adjusts roll gap clearance -> Run 1 trial piece.",
      fail: "Edge tear or neck pitch error (>1.5mm) -> Segment scrapped -> Tooling fault logged.",
      reworkPolicy: "Scrapped segments routed to steel recycling bin; die re-aligned."
    }
  },
  {
    id: "stage-s02",
    code: "S02-WLD",
    name: "Single Spot Resistance Welding",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 7,
    owner: "Spot Welder, Quality Inspector",
    docRef: "SOP/WELD/SPOT/01",
    formula: "Min Nugget Pull-Off Diameter dn >= 5 * sqrt(t) mm (dn >= 5.48 mm for 1.2 mm CRCA)",
    calculatedParameters: [
      { label: "Spot Welding Pitch", value: "25 mm", tolerance: "+-2.0 mm" },
      { label: "Min Pull-Off Nugget Diameter", value: "5.48 mm", tolerance: "Min 5.48 mm" },
      { label: "Failure Mode Type", value: "Parent Metal Button Tear", tolerance: "Required" },
      { label: "Electrode Dressing Limit", value: "Max 500 Spots", tolerance: "Mandatory Dress" }
    ],
    acceptanceCriteria: "Parent metal tear on coupon pull-off test; zero spot expulsion, burr, or deep electrode indentation.",
    stepDetails: {
      inputs: "Cold rolled and formed fin flutes, copper-chromium-zirconium electrodes.",
      activities: "1. Align fin pair in spot fixture. 2. Perform resistance spot welding along flute centerlines. 3. Hourly coupon pull-off test.",
      equipment: "Single Spot Resistance Welder (75 kVA), Pneumatic Pull-off Test Rig",
      records: "Hourly Nugget Pull-Off Test Record, Electrode Dressing Log"
    },
    failureModes: {
      pass: "Button tear confirmed (dn >= 5.48mm) -> Increment dressing counter -> Proceed.",
      drift: "Spot indentation > 20% of thickness -> Dress electrode tips.",
      fail: "Interface shear / cold weld without metal tear -> Machine interlocked -> Quarantine batch since last valid test.",
      reworkPolicy: "Quarantined fins tested; invalid units scrapped; welding current recalibrated."
    }
  },
  {
    id: "stage-s03",
    code: "S03-WLD",
    name: "Multi-Spot Resistance Welding",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 8,
    owner: "Multi-Spot Machine Operator, Line QC",
    docRef: "SOP/WELD/MSPO/01",
    formula: "Length Bow <= 2.0 mm | Width Bow <= 1.5 mm across full fin matrix",
    calculatedParameters: [
      { label: "Weld Current per Tip", value: "9.2 kA", tolerance: "8.5 to 10.0 kA" },
      { label: "Pneumatic Clamping Pressure", value: "4.5 bar", tolerance: "4.0 to 5.0 bar" },
      { label: "Fin Length Bow", value: "<= 1.5 mm", tolerance: "Max 2.0 mm" }
    ],
    acceptanceCriteria: "Simultaneous resistance welding of all flute bonding points; zero distortion or sheet warpage.",
    stepDetails: {
      inputs: "Single-spotted fin elements, multi-electrode array setup.",
      activities: "1. Load fin into pneumatic multi-electrode jig. 2. Fire synchronized weld pulse. 3. Check planarity on leveling table.",
      equipment: "Multi-Spot Welding Machine (200 kVA array), Dial Indicator Straightedge",
      records: "Multi-Spot Parameter Verification Log"
    },
    failureModes: {
      pass: "Flat, uniform multi-spot weld -> Transfer to Seam Welder.",
      drift: "Width bow near 1.5mm limit -> Check clamping cylinder pressure balance.",
      fail: "Burn-through pinhole on fin face -> Segregate to Red Quarantine Bay.",
      reworkPolicy: "Failed fin tagged and scrapped; electrodes resurfaced."
    }
  },
  {
    id: "stage-s04",
    code: "S04-WLD",
    name: "Longitudinal Seam Welding",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 9,
    owner: "Seam Welder Operator, Line Inspector",
    docRef: "SOP/WELD/SEAM/01",
    isCTQ: true,
    formula: "Heat Input Q = (V * I * 60) / (v * 1000) kJ/mm | I = 8.5 to 10.5 kA | Speed v = 2.0 to 2.5 m/min",
    calculatedParameters: [
      { label: "Welding Current I", value: "9.5 kA", tolerance: "8.5 to 10.5 kA" },
      { label: "Wheel Travel Speed v", value: "2.2 m/min", tolerance: "2.0 to 2.5 m/min" },
      { label: "Seam Bead Width", value: "4.5 mm", tolerance: "Min 4.0 mm" },
      { label: "Water Cooling Flow", value: "18 L/min", tolerance: "Min 15 L/min" }
    ],
    acceptanceCriteria: "Continuous hermetic overlap bead along both longitudinal fin edges; zero pinholes, burn-through, or skips.",
    stepDetails: {
      inputs: "Multi-spotted fin element, copper alloy seam welding roller wheels.",
      activities: "1. Feed fin into dual roller guide. 2. Continuous resistance seam welding under water cooling spray. 3. Visual 100% inspection of bead.",
      equipment: "Automatic Longitudinal Seam Welder (150 kVA), Chilled Water Circulation Unit",
      records: "Seam Welding Parameter Card, Seam Visual Inspection Log"
    },
    failureModes: {
      pass: "Continuous solid bead -> Proceed to Cross-Seam Welder.",
      drift: "Bead width narrowing (<4.0mm) -> Resurface copper roller wheel contour.",
      fail: "Skip / discontinuous weld or burn-through hole -> Move to TIG repair station.",
      reworkPolicy: "Max 1 TIG edge sealing repair allowed; documented in Rework Order."
    }
  },
  {
    id: "stage-s05",
    code: "S05-WLD",
    name: "Cross Seam Welding (Header Ports)",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 10,
    owner: "Cross-Seam Welder Operator",
    docRef: "SOP/WELD/XSEAM/01",
    formula: "Port Overlap Hermetic Weld: Zero Gap between Seam & Cross Seam",
    calculatedParameters: [
      { label: "Welding Current", value: "9.0 kA", tolerance: "+-0.5 kA" },
      { label: "Port Collar Seal Width", value: "5.0 mm", tolerance: "+-0.5 mm" }
    ],
    acceptanceCriteria: "Full perimeter hermetic seal where fin element joins header collar; complete closure.",
    stepDetails: {
      inputs: "Longitudinally seam-welded fin element.",
      activities: "1. Clamp fin in cross-seam rotatable fixture. 2. Weld transverse header port contours.",
      equipment: "Special Purpose Cross-Seam Welder",
      records: "Cross-Seam Inspection Log"
    },
    failureModes: {
      pass: "Leak-tight port collar -> Advance to Edge Trimming.",
      drift: "Electrode wear -> Clean and re-profile wheel.",
      fail: "Incomplete intersection weld -> Route to TIG touch-up.",
      reworkPolicy: "TIG seal weld per RWO protocol."
    }
  },
  {
    id: "stage-s06",
    code: "S06-TRM",
    name: "Edge Cutting & Trimming",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 11,
    owner: "Trimming Press Operator",
    docRef: "SOP/PROD/TRIM/01",
    formula: "Edge Burr <= 0.1 mm | Edge Overlap Margin: 2.0 +- 0.5 mm",
    calculatedParameters: [
      { label: "Max Allowable Burr", value: "0.08 mm", tolerance: "Max 0.1 mm" },
      { label: "Trimmed Flange Width", value: "2.0 mm", tolerance: "+-0.5 mm" }
    ],
    acceptanceCriteria: "Smooth sheared edge along fin perimeter; zero sharp burrs, notches, or blade tearing.",
    stepDetails: {
      inputs: "Seam-welded fin element, shearing die tooling.",
      activities: "1. Position fin in trimming press die. 2. Shear outer flash and excess metal. 3. Tactile and optical burr check.",
      equipment: "Mechanical Trimming Shear, Burr Inspection Gauge",
      records: "Trimming Dimensional Log"
    },
    failureModes: {
      pass: "Clean burr-free edge -> Advance to TIG Fin End Sealing.",
      drift: "Burr approaching 0.1mm -> Hone shear blades.",
      fail: "Torn seam weld edge -> Segregate for QA review.",
      reworkPolicy: "Manual deburring or scrap if base seam is compromised."
    }
  },
  {
    id: "stage-s07",
    code: "S07-TIG",
    name: "Fin End TIG Welding",
    phase: "Phase 4: Core Component Fabrication",
    stream: "fin",
    sequenceOrder: 12,
    owner: "Certified TIG Welder (EN ISO 9606-1)",
    docRef: "SOP/WELD/TIG/01",
    formula: "Shielding Gas: 99.99% Argon | Flow Rate: 14 to 18 L/min | Current: 70 to 110 A",
    calculatedParameters: [
      { label: "Argon Gas Flow Rate", value: "16 L/min", tolerance: "14 to 18 L/min" },
      { label: "TIG Current (DCSP)", value: "90 A", tolerance: "70 to 110 A" },
      { label: "Filler Wire (if required)", value: "AWS ER70S-6 (1.6mm)", tolerance: "Certified" }
    ],
    acceptanceCriteria: "Hermetic seal of all open fin tip ends; smooth convex weld profile with zero undercut, porosity, or tungsten inclusion.",
    stepDetails: {
      inputs: "Trimmed fin elements, pure argon cylinder, high-frequency TIG welding machine.",
      activities: "1. Sand fin ends to remove oxidation. 2. Manual TIG weld fin corner tips. 3. Wire brush joint.",
      equipment: "Inverter TIG Welding Machine, Gas Flowmeter, Stainless Steel Wire Brush",
      records: "TIG Welder ID, Gas Flow Verification Record"
    },
    failureModes: {
      pass: "Hermetic tip seal verified -> Stack finished fins in clean covered trolley.",
      drift: "Porosity pinhole -> Check argon cylinder purity and gas nozzle draft.",
      fail: "Severe burn-through at fin tip -> Route to rework station.",
      reworkPolicy: "Grind down defective tip and re-TIG weld (max 2 attempts)."
    }
  },

  // Stream 4: Header Pipe Preparation (Stages S08 & S09)
  {
    id: "stage-s08",
    code: "S08-HDR",
    name: "Plasma Pipe Cutting & Deburring",
    phase: "Phase 4: Core Component Fabrication",
    stream: "header",
    sequenceOrder: 13,
    owner: "Plasma Machine Operator",
    docRef: "SOP/PROD/PIPE/01",
    formula: "Header Cut Length = Center Distance + 200 mm | Tolerance: +-1.0 mm",
    calculatedParameters: [
      { label: "Cut Pipe Length", value: "3100 / 2486 mm", tolerance: "+-1.0 mm" },
      { label: "Header Pipe OD x Wall", value: "88.9 mm OD x 4.5 mm", tolerance: "+-0.2 mm" },
      { label: "Squareness of Cut Ends", value: "< 0.5 mm", tolerance: "Max 0.8 mm" }
    ],
    acceptanceCriteria: "100% deburred inside and outside; zero dross or slag adhering to cut edges.",
    stepDetails: {
      inputs: "80 NB ERW mild steel pipe (IS 1161 / IS 1239), approved drawing cut length.",
      activities: "1. Load pipe on roller bed. 2. CNC plasma cut to exact length. 3. Machine deburr pipe inner and outer diameters.",
      equipment: "CNC Rotary Pipe Plasma Cutter, Rotary Deburring Machine",
      records: "Pipe Cutting Quality Checksheet"
    },
    failureModes: {
      pass: "Length within +-1.0mm, clean chamfer -> Transfer to Header Pre-treatment.",
      drift: "Plasma torch nozzle wear -> Replace consumable nozzle.",
      fail: "Pipe cut short (>1.5mm) -> Scrapped or downgraded to shorter radiator size.",
      reworkPolicy: "Excess length faced off on lathe; short pipe scrapped."
    }
  },
  {
    id: "stage-s09",
    code: "S09-HDR",
    name: "Header Pre-treatment, Blasting & Fitting Tacking",
    phase: "Phase 4: Core Component Fabrication",
    stream: "header",
    sequenceOrder: 14,
    owner: "Fabrication Fitter, Welder",
    docRef: "SOP/PROD/HDR/02",
    formula: "Internal Shot Blast Cleanliness: Sa 2.5 Near-White Finish",
    calculatedParameters: [
      { label: "Internal Pipe Surface Cleanliness", value: "Sa 2.5", tolerance: "ISO 8501-1" },
      { label: "Flange Bolt Hole PCD", value: "Per Drawing", tolerance: "+-0.5 mm" }
    ],
    acceptanceCriteria: "Interior completely free of scale, rust, or cutting slag; oil drain/vent plugs and PCD flanges securely tack-welded in position.",
    stepDetails: {
      inputs: "Cut ERW header pipe, machined flange rings, vent/drain couplings, lifting lugs.",
      activities: "1. Internal grit blast pipe bore. 2. Tack weld flange rings and fittings per drawing coordinates.",
      equipment: "Internal Lance Pipe Blaster, Alignment Fixture, MAG Tack Welder",
      records: "Header Pre-assembly Inspection Checksheet"
    },
    failureModes: {
      pass: "Internal bore Sa 2.5, fittings aligned -> Transfer to Core Assembly.",
      drift: "Tack weld misalignment -> Re-clamp in jig before cooling.",
      fail: "Internal rust / slag remaining -> Repeat internal lance grit blast.",
      reworkPolicy: "Re-blast interior until 100% near-white metal is achieved."
    }
  },

  // Phase 5: Convergence - Core Assembly, Structural Welding & Leak Testing Gate
  {
    id: "stage-s10",
    code: "S10-ASY",
    name: "Core Assembly in Comb Fixture & Erection",
    phase: "Phase 5: Core Assembly & Testing Gate",
    stream: "assembly",
    sequenceOrder: 15,
    owner: "Core Assembly Fitter, Lead Quality Inspector",
    docRef: "SOP/ASY/COMB/01",
    isCTQ: true,
    isGate: true,
    formula: "Total Core Width L = (N - 1) * 45 mm + 2 * TP | Diagonal Diff Delta = |D1 - D2| <= 3.0 mm | Flange Pata delta <= 0.4 mm",
    calculatedParameters: [
      { label: "Fin Pitch (Comb Distance)", value: "45.0 mm", tolerance: "+-1.0 mm" },
      { label: "Diagonal Difference |D1 - D2|", value: "<= 2.0 mm", tolerance: "Max 3.0 mm" },
      { label: "Flange Coplanarity (Pata delta)", value: "<= 0.3 mm", tolerance: "Max 0.4 mm" },
      { label: "Flange Center-to-Center Distance", value: "2900 / 2286 mm", tolerance: "-1.0, +2.0 mm" }
    ],
    acceptanceCriteria: "Flanges coplanar (Pata <= 0.4mm across all 4 faces); square core geometry; uniform 45mm comb pitch; zero fin distortion.",
    stepDetails: {
      inputs: "Finished fin elements (26/36), top/bottom header pipes with tacked fittings, comb jig.",
      activities: "1. Slot fins into 45mm comb fixture. 2. Position top and bottom header pipes. 3. Clamp assembly in hydraulic alignment frame. 4. Tack weld header-to-fin joints. 5. Measure diagonals and flange pata.",
      equipment: "Precision 45mm Comb Fixture, Hydraulic Clamping Rig, Precision Framing Square, Line Dori, Laser CC Meter",
      records: "Stage S10 Erection & Assembly Checksheet, Fit-up Clearance Sign-off"
    },
    failureModes: {
      pass: "All geometric dimensions within tolerance -> Digital Fit-up Clearance issued -> Forward to Full MAG Welding.",
      drift: "Flange Pata between 0.4mm and 0.8mm -> Clamp in hydraulic straightening table before final cooling.",
      fail: "Diamond skew (Diagonal Diff > 3.0mm) or CC out of tolerance -> Disassemble tacks -> Re-align in comb.",
      reworkPolicy: "Tacks cut with pneumatic disc grinder; core completely re-squared in fixture."
    }
  },
  {
    id: "stage-s11",
    code: "S11-MAG",
    name: "Full Structural MAG Header Welding",
    phase: "Phase 5: Core Assembly & Testing Gate",
    stream: "assembly",
    sequenceOrder: 16,
    owner: "Certified MAG Welder (AWS D1.1 / ISO 9606-1)",
    docRef: "SOP/WELD/MAG/01",
    isCTQ: true,
    formula: "Shielding: 80% Argon + 20% CO2 | Solid Wire: AWS ER70S-6 (1.2mm) | Current: 180 - 240 A",
    calculatedParameters: [
      { label: "Welding Voltage", value: "24 - 28 V", tolerance: "+-1.0 V" },
      { label: "Fillet Weld Throat Thickness", value: "4.5 mm", tolerance: "Min 4.0 mm" },
      { label: "Weld Spatter Cleanliness", value: "100% Free", tolerance: "Zero Spatter" }
    ],
    acceptanceCriteria: "Full penetration continuous fillet weld connecting each fin neck to the header pipe; zero weld spatter, porosity, or undercut.",
    stepDetails: {
      inputs: "Tack-welded radiator assembly, AWS ER70S-6 welding wire, Ar/CO2 mixed shielding gas.",
      activities: "1. Weld header-to-fin joint full seams using staggered sequence to minimize thermal distortion. 2. Mechanically chisel and wire brush all spatter.",
      equipment: "MIG/MAG 400A Welding Inverter, Pneumatic Needle Scaler, Rotating Positioner",
      records: "MAG Welder ID Stamp, Visual Weld Inspection Record"
    },
    failureModes: {
      pass: "Continuous flawless fillet weld -> Mechanically cleaned -> Advance to Leak Testing.",
      drift: "Excess spatter -> Tune gas flow rate and wire feed speed.",
      fail: "Crater crack or visible porosity -> Gouge out defect and re-weld with preheat.",
      reworkPolicy: "Grind defective weld deposit flush; re-weld and wire brush before testing."
    }
  },
  {
    id: "stage-s12",
    code: "S12-LKT",
    name: "Pressure and Leak Integrity Testing Gate",
    phase: "Phase 5: Core Assembly & Testing Gate",
    stream: "assembly",
    sequenceOrder: 17,
    owner: "Leak Testing Inspector, Quality Head",
    docRef: "SOP/QC/LEAK/01",
    isCTQ: true,
    isGate: true,
    formula: "Pneumatic Test Pressure P = 2.0 kg/cm2 (Air) | Submersion Hold Time T >= 30 Minutes | Max Allowable Leaks = Exactly 0",
    calculatedParameters: [
      { label: "Pneumatic Air Pressure P", value: "2.0 kg/cm2", tolerance: "1.6 to 2.0 kg/cm2" },
      { label: "Submerged Water Hold Time", value: "30 Minutes", tolerance: "Min 30 Min Continuous" },
      { label: "Max Allowable Air Bubbles", value: "0 Bubbles", tolerance: "Zero Tolerance" },
      { label: "Internal Moisture Post-Bake", value: "Hot Air Blown Dry", tolerance: "100% Dry" }
    ],
    acceptanceCriteria: "Zero air bubbles observed escaping from any weld, seam, fin, or header during the mandatory 30-minute submersion test.",
    stepDetails: {
      inputs: "Completed welded radiator core, pneumatic air line, calibrated pressure gauge, water tank.",
      activities: "1. Bolt heavy-duty rubber-lined blind flanges. 2. Pressurize with dry air to 2.0 kg/cm2. 3. Submerge in illuminated water tank. 4. Hold for 30 continuous minutes with inspector observation. 5. Blow interior dry with hot air.",
      equipment: "Illuminated Leak Test Water Tank (6m length), Calibrated Test Manifold, Hot Air Blower Unit",
      records: "Digital Leak Test Certificate, Pressure Drop Log, Water Tank Log"
    },
    failureModes: {
      pass: "Zero air bubbles -> Blow dry interior -> Digital Leak Certificate signed -> Unlock traveler for Surface Treatment.",
      drift: "Slow pressure decay from fitting seal -> Retighten blind flange bolts and re-zero timer.",
      fail: "Air bubbles detected at weld seam -> Mark exact coordinates with yellow paint pen -> Move to Red Quarantine Bay -> Issue Digital RWO -> Max 2 TIG repair retries -> Full 30-min re-test.",
      reworkPolicy: "If leak recurs after 2 rework attempts or header pipe has through-crack: Trigger Material Review Board (MRB) scrap authorization -> Scrapped in ERP -> Recycled."
    }
  },

  // Phase 6: Surface Preparation & 5-Coat Paint System (Stages S13 & S14)
  {
    id: "stage-s13",
    code: "S13-FLS",
    name: "Internal Flushing & Rust-Preventive Oil Circulation",
    phase: "Phase 6: Surface Preparation & Coating",
    stream: "surface",
    sequenceOrder: 18,
    owner: "Flushing Station Operator, QA Checker",
    docRef: "SOP/SURF/FLUSH/01",
    formula: "Flushing Fluid: Ching RD-124 Olive Green Oil | Film Thickness: 40 to 70 um | Circulation Time >= 15 Min",
    calculatedParameters: [
      { label: "Flushing Oil Grade", value: "Ching RD-124 Olive Green", tolerance: "Approved Batch" },
      { label: "Internal Coating Film", value: "55 um", tolerance: "40 to 70 um" },
      { label: "Internal Cleanliness", value: "Zero particulate > 50 um", tolerance: "Transformer Grade" }
    ],
    acceptanceCriteria: "Radiator interior 100% coated with uniform protective oil film; zero debris, metal fines, moisture, or particulate.",
    stepDetails: {
      inputs: "Leak-tested dry radiator, certified Ching RD-124 oil, high-flow pump station.",
      activities: "1. Connect quick-release flushing hoses. 2. Circulate filtered oil through internal radiator channels for 15 minutes. 3. Drain and collect sample for particulate test.",
      equipment: "High-Volume Oil Flushing Rig with 5-Micron Inline Filters, Drain Trough",
      records: "Internal Flushing Record, Oil Batch Test Sheet"
    },
    failureModes: {
      pass: "Uniform internal oil coating, particle test clean -> Transfer to External Shot Blasting.",
      drift: "Filter pressure differential high -> Replace inline 5-micron filter elements.",
      fail: "Metal filings found in drain tray -> Re-flush with fresh oil until filter is clear.",
      reworkPolicy: "Repeat 15-minute oil flushing cycle until particle count meets standard."
    }
  },
  {
    id: "stage-s14",
    code: "S14-PNT",
    name: "External Shot Blasting & AkzoNobel 5-Coat Paint System",
    phase: "Phase 6: Surface Preparation & Coating",
    stream: "surface",
    sequenceOrder: 19,
    owner: "Blasting & Painting Supervisor, Coating Inspector (NACE / FROSIO)",
    docRef: "SOP/SURF/COAT/01",
    isCTQ: true,
    isGate: true,
    formula: "Blast Profile Rz = 40 to 70 um (Sa 2.5) | Total DFT = 286 +- 30 um (SPTC) / 215 +- 25 um (DSW) | Adhesion ASTM D3359 Class 4B/5B",
    calculatedParameters: [
      { label: "Grit Blast Surface Profile Rz", value: "55 um (Sa 2.5 Near-White)", tolerance: "40 to 70 um" },
      { label: "SPTC AkzoNobel 5-Layer Total DFT", value: "286 um", tolerance: "256 to 316 um" },
      { label: "Delta Star 4-Layer Total DFT", value: "215 um", tolerance: "190 to 240 um" },
      { label: "Cross-Hatch Adhesion", value: "Class 5B", tolerance: "Min Class 4B" }
    ],
    acceptanceCriteria: "Sa 2.5 near-white blast finish; 10-spot average DFT within customer approved limits; zero runs, sags, pinholes, blisters, or dry spray.",
    stepDetails: {
      inputs: "Internally flushed radiator, steel grit (G40), AkzoNobel paint systems (Zinc Silicate, Intergard 251, Intergard 475HS, Interthane 990).",
      activities: "1. Steel grit blast exterior to Sa 2.5. 2. Apply primer within 4 hours. 3. Apply intermediate and MIO coats with flash-off intervals. 4. Apply PU topcoat. 5. Oven bake at specified temperature. 6. 10-spot electromagnetic DFT check.",
      equipment: "Automated Grit Blasting Booth, Airless Paint Spray Systems, Forced Air Curing Oven, Elcometer DFT Gauge",
      records: "Surface Preparation & DFT Inspection Certificate, Cross-Hatch Adhesion Test Record"
    },
    failureModes: {
      pass: "DFT within tolerance, adhesion 5B -> Digital Coating Approval -> Release to Final QA.",
      drift: "Low DFT (< 256 um for SPTC) -> Apply additional polyurethane topcoat (PU-990) -> Re-bake.",
      fail: "Paint flaking, blistering, or adhesion failure (<4B) -> Solvent strip, re-blast to bare metal Sa 2.5, and completely re-paint.",
      reworkPolicy: "Total re-blasting and re-painting cycle required for adhesion failure."
    }
  },

  // Phase 7: Final QA Release, Shipping & Feedback Loop (Stages S15 to S18)
  {
    id: "stage-s15",
    code: "S15-PDI",
    name: "Final Quality Audit, Boroscope & PDI Release",
    phase: "Phase 7: Final Quality & Logistics",
    stream: "logistics",
    sequenceOrder: 20,
    owner: "Final Quality Auditor, Head of Quality",
    docRef: "SOP/QC/FINAL/01",
    isCTQ: true,
    isGate: true,
    acceptanceCriteria: "Boroscope inspection confirms clean internal channels; all 17 stage checksheets verified; COC and Green Gate Pass issued.",
    stepDetails: {
      inputs: "Cured painted radiator, full 17-stage traveler checksheet records, customer PO.",
      activities: "1. Insert digital boroscope into headers to audit internal cleanliness and weld roots. 2. Check flange bolt torque. 3. Verify all preceding stage checksheets are signed in MES. 4. Issue Certificate of Conformance (COC).",
      equipment: "High-Definition Industrial Boroscope Camera, Calibrated Torque Wrench, QMS Validation Terminal",
      records: "Pre-Dispatch Inspection (PDI) Report, Certificate of Conformance (COC), Green Gate Pass"
    },
    failureModes: {
      pass: "100% verified -> Digital QA Release -> Release to Packing.",
      drift: "Minor paint touch-up needed at flange face -> Sponge dab approved PU-990 paint.",
      fail: "Internal debris detected on boroscope or open NCR found in traveler -> Quality Containment Hold.",
      reworkPolicy: "Internal vacuuming/re-flushing or resolving open NCR before release."
    }
  },
  {
    id: "stage-s16",
    code: "S16-PKG",
    name: "Packaging, Blind Flanges & Weatherproof Preservation",
    phase: "Phase 7: Final Quality & Logistics",
    stream: "logistics",
    sequenceOrder: 21,
    owner: "Packing Supervisor, Stores Dispatcher",
    docRef: "SOP/LOG/PACK/01",
    acceptanceCriteria: "Neoprene blind flanges torqued with desiccants inside; wrapped in VCI protective film; seated on heavy-duty timber saddles.",
    stepDetails: {
      inputs: "PDI approved radiator, steel blind flanges with neoprene gaskets, silica gel pouches, VCI film, timber shipping saddles.",
      activities: "1. Place active silica gel pouches in each header. 2. Bolt blind flanges to all oil ports. 3. Wrap entire radiator in heat-sealed VCI film. 4. Strap securely to timber saddles. 5. Affix weatherproof GS1 shipping barcode.",
      equipment: "Heat Sealer, Pneumatic Strapping Machine, GS1 Barcode Label Printer",
      records: "Packing Checklist, Weatherproof Barcode Shipping Label"
    },
    failureModes: {
      pass: "Packing verified -> Transfer to Finished Goods Staging Bay.",
      drift: "Label damaged -> Re-print GS1 barcode label.",
      fail: "Missing silica gel or untightened blind flange -> Immediate correction.",
      reworkPolicy: "Packaging re-verified before transport clearance."
    }
  },
  {
    id: "stage-s17",
    code: "S17-DSP",
    name: "Loading, Shipping Clearance & Statutory Gate Pass",
    phase: "Phase 7: Final Quality & Logistics",
    stream: "logistics",
    sequenceOrder: 22,
    owner: "Logistics Manager, Security Officer",
    docRef: "SOP/LOG/SHIP/01",
    isGate: true,
    acceptanceCriteria: "Truck bed inspected, crane loaded with timber chocks, Delivery Challan and statutory e-Way bill verified.",
    stepDetails: {
      inputs: "Packed radiator, transport vehicle, shipping invoice, customer delivery address.",
      activities: "1. Inspect transport truck bed for nails/debris. 2. Overhead crane hoist using dedicated lifting lugs. 3. Secure with timber chocks and ratchet tension lashings. 4. Generate statutory e-Way bill and Delivery Challan (DC). 5. Gate security clearance.",
      equipment: "Overhead EOT Crane (10 Ton), Ratchet Cargo Straps, ERP Logistics Gate Terminal",
      records: "Delivery Challan (DC), Statutory e-Way Bill, Gate Security Clearance Pass"
    },
    failureModes: {
      pass: "Clearance approved -> Vehicle departs factory.",
      drift: "Ratchet tension slack -> Re-tighten and re-inspect lashings.",
      fail: "Transport vehicle bed damaged or e-Way bill expired -> Vehicle turned back.",
      reworkPolicy: "Re-issue e-Way bill or summon compliant replacement truck."
    }
  },
  {
    id: "stage-s18",
    code: "S18-DLV",
    name: "Customer Site Delivery, Electronic POD & 8D Feedback Loop",
    phase: "Phase 7: Final Quality & Logistics",
    stream: "logistics",
    sequenceOrder: 23,
    owner: "Customer Service, Head of Quality",
    docRef: "SOP/LOG/DELIV/01",
    acceptanceCriteria: "Clean customer site receipt; mobile digital signed Proof of Delivery (POD); order closed and archived in QMS dossier.",
    stepDetails: {
      inputs: "Delivered radiator at customer transformer plant (SPTC / Delta Star / Schneider).",
      activities: "1. Customer inward receiving inspection. 2. Sign mobile electronic POD. 3. Commercial invoice released in ERP. 4. If any transit dent/scratch reported: Trigger immediate 8D Root Cause Analysis and permanent CAPA feedback to S01/S03 engineering.",
      equipment: "Mobile Driver POD App, ERP Customer Account Module, 8D CAPA Repository",
      records: "Signed Proof of Delivery (POD), Customer Acceptance Rating, 8D CAPA Dossier"
    },
    failureModes: {
      pass: "Clean acceptance -> 5-Star rating -> Sales Order closed & archived.",
      drift: "Minor transit paint scratch -> Dispatch touch-up kit and local service technician.",
      fail: "Customer inward rejection (transit dent or flange bend) -> Initiate 8D Root Cause Analysis -> Update FMEA and packaging design.",
      reworkPolicy: "8D corrective action team deployed; containment within 24h, permanent CAPA within 14 days."
    }
  }
];

export function ProcessFlowInteractive({ onInspect }: { onInspect?: (stageCode: string | null) => void }) {
  const [selectedStream, setSelectedStream] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<StageNode | null>(COMPLETE_MES_STAGES[9]); // Default to S01
  const [showFormulasOnly, setShowFormulasOnly] = useState<boolean>(false);

  const filteredStages = useMemo(() => {
    let list = COMPLETE_MES_STAGES;
    if (selectedStream !== "all") {
      list = list.filter(s => s.stream === selectedStream);
    }
    if (showFormulasOnly) {
      list = list.filter(s => s.formula);
    }
    return list;
  }, [selectedStream, showFormulasOnly]);

  const streamMetrics = useMemo(() => {
    return {
      total: COMPLETE_MES_STAGES.length,
      ctq: COMPLETE_MES_STAGES.filter(s => s.isCTQ).length,
      gates: COMPLETE_MES_STAGES.filter(s => s.isGate).length,
      formulas: COMPLETE_MES_STAGES.filter(s => s.formula).length
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                Corrected 18-Stage Manufacturing Sequence
              </span>
              <span className="text-xs text-stone-500 font-mono">IS 513:2016 · IS 1161 · ISO 9001</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Workflow className="text-blue-600 dark:text-blue-400" size={22} />
              MES End-to-End Shopfloor Process & Userflow
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1 max-w-3xl">
              Parallel fin forming and header pipe preparation streams converging into Core Erection (S10), structural MAG welding (S11), and the zero-tolerance 30-minute leak test gate (S12).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowFormulasOnly(!showFormulasOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                showFormulasOnly
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200"
              }`}
            >
              <Calculator size={14} />
              {showFormulasOnly ? "Showing Formulas Only" : "Filter by Formulas"}
            </button>

            {onInspect && (
              <button
                onClick={() => onInspect(selectedStage?.code || null)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-sm transition-all"
              >
                <FileText size={14} />
                Open Digital Checksheet
              </button>
            )}
          </div>
        </div>

        {/* Stream Filter Pills */}
        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-stone-500 mr-2 flex items-center gap-1">
            <Filter size={12} /> Filter Stream:
          </span>
          {[
            { id: "all", label: "Full Value Stream (S01 to S18)" },
            { id: "commercial", label: "Phase 1-3: Sales & RM QC" },
            { id: "fin", label: "Fin Stream (S01 to S07)" },
            { id: "header", label: "Header Stream (S08 to S09)" },
            { id: "assembly", label: "Core Assembly & Leak Gate (S10-S12)" },
            { id: "surface", label: "Surface & Paint (S13-S14)" },
            { id: "logistics", label: "PDI, Packing & Delivery (S15-S18)" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStream(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedStream === tab.id
                  ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm"
                  : "bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Left = Sequence Pipeline, Right = Active Stage Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Horizontal / Vertical Stepper List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center justify-between">
            <span>Process Sequence Map ({filteredStages.length} Stages)</span>
            <span className="text-stone-400">Click a stage to inspect formulas & failure paths</span>
          </div>

          <div className="space-y-2.5">
            {filteredStages.map((stage, idx) => {
              const isSelected = selectedStage?.id === stage.id;
              return (
                <div
                  key={stage.id}
                  onClick={() => setSelectedStage(stage)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500 shadow-sm ring-1 ring-blue-500"
                      : "bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                          stage.isCTQ
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-300 dark:border-rose-800"
                            : stage.stream === "fin"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                            : stage.stream === "header"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            : stage.stream === "assembly"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
                            : "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                        }`}
                      >
                        {stage.code.split("-")[0]}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                            {stage.code}
                          </span>
                          <span className="text-xs text-stone-400">·</span>
                          <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                            {stage.phase}
                          </span>
                          {stage.isCTQ && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              CTQ GATE
                            </span>
                          )}
                          {stage.isGate && !stage.isCTQ && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              GATEWAY
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                          {stage.name}
                        </h3>

                        {stage.formula && (
                          <div className="mt-1.5 text-xs font-mono text-blue-700 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 flex items-center gap-1.5">
                            <Calculator size={12} className="shrink-0" />
                            <span className="truncate">{stage.formula}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-mono text-stone-400">
                        Seq #{stage.sequenceOrder}
                      </span>
                      <ChevronRight
                        size={16}
                        className={`mt-2 ml-auto transition-transform ${
                          isSelected ? "text-blue-600 dark:text-blue-400 rotate-90" : "text-stone-400"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Flow Connector Indicator if not last */}
                  {idx < filteredStages.length - 1 && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-stone-400 mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                      <ArrowDown size={11} className="text-stone-400" />
                      <span>Next Sequence: {filteredStages[idx + 1].code} ({filteredStages[idx + 1].name.split("(")[0]})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Card of Active Stage (5 Cols) */}
        <div className="lg:col-span-5 sticky top-4 space-y-4">
          {selectedStage ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {selectedStage.code}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    Doc: {selectedStage.docRef}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {selectedStage.name}
                </h3>
                <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                  <User size={13} />
                  <span>Responsible: <strong className="text-stone-700 dark:text-stone-300">{selectedStage.owner}</strong></span>
                </p>
              </div>

              {/* Mathematical Formula & Tolerances */}
              {selectedStage.formula && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1.5">
                    <Calculator size={14} />
                    <span>ENGINEERING CALCULATION & FORMULA</span>
                  </div>
                  <div className="text-xs font-mono font-semibold text-blue-800 dark:text-blue-300 bg-white/70 dark:bg-stone-900/60 p-2 rounded border border-blue-100 dark:border-blue-900 mb-2.5">
                    {selectedStage.formula}
                  </div>

                  {selectedStage.calculatedParameters && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-400">
                        Nominal Parameters & Tolerances:
                      </div>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        {selectedStage.calculatedParameters.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-stone-900/80 border border-blue-100 dark:border-blue-900/40 text-[11px]"
                          >
                            <span className="text-stone-600 dark:text-stone-400">{p.label}:</span>
                            <div className="font-mono text-stone-900 dark:text-stone-100 font-medium">
                              <span>{p.value}</span>{" "}
                              <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">
                                ({p.tolerance})
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Acceptance Criteria */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800">
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span>ACCEPTANCE CRITERIA</span>
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                  {selectedStage.acceptanceCriteria}
                </p>
              </div>

              {/* Three-Tier Failure Handling Pathway */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders size={13} />
                  <span>3-Tier Failure Handling & Possibilities</span>
                </div>

                {/* Pass Path */}
                <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                    <CheckCircle2 size={13} />
                    <span>Condition 1: PASS / Conforming</span>
                  </div>
                  <div className="text-stone-700 dark:text-stone-300 text-[11px]">
                    {selectedStage.failureModes.pass}
                  </div>
                </div>

                {/* Drift Path */}
                {selectedStage.failureModes.drift && (
                  <div className="p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs">
                    <div className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1 mb-0.5">
                      <AlertTriangle size={13} />
                      <span>Condition 2: DRIFT / Minor Tooling Deviation</span>
                    </div>
                    <div className="text-stone-700 dark:text-stone-300 text-[11px]">
                      {selectedStage.failureModes.drift}
                    </div>
                  </div>
                )}

                {/* Fail / Scrap Path */}
                <div className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-xs">
                  <div className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1 mb-0.5">
                    <XCircle size={13} />
                    <span>Condition 3: DEFECT / Quarantine Bay / Scrap</span>
                  </div>
                  <div className="text-stone-700 dark:text-stone-300 text-[11px]">
                    {selectedStage.failureModes.fail}
                  </div>
                </div>

                {/* Rework Policy */}
                <div className="p-2.5 rounded-lg bg-stone-100 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                  <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1 mb-0.5">
                    <RotateCcw size={13} />
                    <span>Rework & Quarantine Policy:</span>
                  </div>
                  <div className="text-stone-600 dark:text-stone-400 text-[11px]">
                    {selectedStage.failureModes.reworkPolicy}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {onInspect && (
                <button
                  onClick={() => onInspect(selectedStage.code)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileText size={14} />
                  <span>Open {selectedStage.code} Checksheet Form</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-center text-stone-500">
              Select a stage from the sequence map to inspect its parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
