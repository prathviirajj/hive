// QMS seed data - based on MES-QMS Process Excel
// Hi-Tech Radiators manufacturing routes, stages, characteristics, sample work orders

import { db } from "./db";

const ROUTES = [
  { code: "K1", name: "Radiator Assembly Route - K1 (Standard MS)", description: "Standard mild-steel radiator: rolling → fin welding → erection → MAG → leak test → optional HDG/paint → packing." },
  { code: "K2", name: "K2 - Stainless Steel Radiator Plant", description: "Stainless steel radiator assembly: rolling → fin welding → erection → MAG → leak test → sweep blasting → painting → packing. Active plant." },
  { code: "K3", name: "Radiator Assembly Route - K3 (Heavy-duty)", description: "Heavy-duty MS radiator with thicker fins and additional bracing." },
  { code: "K4", name: "Header Manufacturing Route", description: "Standalone header pipe manufacturing: plasma cutting → slotting → header assembly. Output handed off to radiator assembly." },
  { code: "INDO", name: "Tank Manufacturing Route", description: "Transformer conservator / radiator tank fabrication and painting." },
];

// Manufacturing stages mapped 1:1 from the Excel "In-Process Quality Plan" sheet.
// seq numbers match the source (10, 20, 30, ...). H1-H5 are HDG-specific.
const STAGES = [
  // Fin fabrication
  { seq: 10,  stageCode: "S01", name: "Rolling & forming",                department: "Quality Inspector",          workCenter: "Rolling m/c + compound die", documentRef: "QCI/F/02/01 Rev.05", responsibleRole: "Quality Inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "All radiator routes" },
  { seq: 20,  stageCode: "S02", name: "Single spot Welding",              department: "Operator Production",         workCenter: "Single spot welding m/c",    documentRef: "QCI/F/02/02 Rev.04", responsibleRole: "Operator Production", timing: "During / after", isCTQ: false, isGate: false, applicability: "All radiator routes" },
  { seq: 30,  stageCode: "S03", name: "Multi spot Welding",               department: "Operator Production",         workCenter: "Single spot welding m/c",    documentRef: "QCI/F/02/02 Rev.04", responsibleRole: "Operator Production", timing: "During / after", isCTQ: false, isGate: false, applicability: "All radiator routes" },
  { seq: 40,  stageCode: "S04", name: "Seam Welding & Trimming",          department: "Operator Production / QA Engineer", workCenter: "Seam welding m/c",     documentRef: "QCI/F/02/06",         responsibleRole: "Operator Production / QA Engineer", timing: "During / after", isCTQ: false, isGate: false, applicability: "Fin fabrication" },
  { seq: 50,  stageCode: "S05", name: "Cross Seam Welding",               department: "Operator Production / QA Engineer", workCenter: "Seam welding m/c",     documentRef: "QCI/F/02/06",         responsibleRole: "Operator Production / QA Engineer", timing: "During / after", isCTQ: false, isGate: false, applicability: "Fin fabrication" },
  { seq: 60,  stageCode: "S06", name: "Edge Cutting",                     department: "Operator Production",         workCenter: "Edge Cutting m/c",           documentRef: "QCI/F/02/03 Rev.04", responsibleRole: "Operator Production", timing: "During / after", isCTQ: false, isGate: false, applicability: "Fin fabrication" },
  { seq: 70,  stageCode: "S07", name: "TIG Welding & fin sandering",      department: "Operator Production / QA inspector", workCenter: "TIG m/c + Sander",   documentRef: "QCI/F/02/04 Rev.03", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Fin fabrication" },
  // Header
  { seq: 80,  stageCode: "S08", name: "Pipe Cutting By Plasma & Deburring", department: "Operator Production / QC inspector", workCenter: "Plasma pipe cutting m/c", documentRef: "QCI/F/05/01", responsibleRole: "Operator Production / QC inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "K4 / Header" },
  { seq: 90,  stageCode: "S09", name: "Header Assembly with Pretreatment", department: "Operator Production / QA Engineer", workCenter: "MAG/MMAW / SPM welding", documentRef: "QCI/F/05/02", responsibleRole: "First piece by Operator Production / QA Engineer", timing: "During / after", isCTQ: true, isGate: true, applicability: "K4 / Header" },
  { seq: 100, stageCode: "S10", name: "Fin Flaring Process",              department: "QC inspector / Operator",      workCenter: "Flaring machine",            documentRef: "QCI/F/02/06",         responsibleRole: "QC inspector / Operator", timing: "During / after", isCTQ: false, isGate: false, applicability: "Header / fin prep" },
  // Radiator assembly
  { seq: 110, stageCode: "S11", name: "Assembly (Erection)",              department: "Operator Production / QA inspector", workCenter: "MAG m/c + Fixture",   documentRef: "QCI/F/05/03 Rev.09", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: true, applicability: "Radiator assembly" },
  { seq: 120, stageCode: "S12", name: "Full MAG Welding",                 department: "Operator Production and QC inspector", workCenter: "MAG Welding m/c",     documentRef: "QCI/F/05/04 Rev.03", responsibleRole: "Operator Production and QC inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Radiator assembly" },
  { seq: 130, stageCode: "S13", name: "Spatter Cleaning",                 department: "Operator Production and QC inspector", workCenter: "File/Chisel",         documentRef: "QCI/F/05/07 Rev.02", responsibleRole: "Operator Production and QC inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Radiator assembly" },
  { seq: 140, stageCode: "S14", name: "Leak Testing with Dimension & Visual", department: "Operator Production / QA inspector", workCenter: "Leak testing tank + compressed air", documentRef: "QCI/F/05/08 Rev.03", responsibleRole: "Operator Production / QA inspector", timing: "After", isCTQ: true, isGate: true, applicability: "All radiator finish routes" },
  // HDG route (H1-H5)
  { seq: 145, stageCode: "S15", name: "Pre-Galvanizing Release",          department: "Galvanizing / QA",            workCenter: "Galva plant",                documentRef: "QCI/F/10/01 Rev.003", responsibleRole: "Production / QA", timing: "Before pretreatment", isCTQ: false, isGate: true, applicability: "Galva; Galva and Painted" },
  { seq: 146, stageCode: "S16", name: "HDG Pretreatment",                 department: "Galvanizing / QA",            workCenter: "Pre-treatment tanks",        documentRef: "QCI/F/10/02 Rev.005", responsibleRole: "Operator / QA", timing: "Before galvanizing", isCTQ: false, isGate: false, applicability: "Galva; Galva and Painted" },
  { seq: 147, stageCode: "S17", name: "HDG Laboratory Control",           department: "Laboratory / QA",             workCenter: "Lab",                        documentRef: "QCI/F/10/05 Rev.004", responsibleRole: "Laboratory / QA", timing: "Before / during galvanizing", isCTQ: false, isGate: false, applicability: "Galva; Galva and Painted" },
  { seq: 148, stageCode: "S18", name: "Hot-Dip Galvanizing",              department: "Galvanizing / QA",            workCenter: "Zinc bath 450-460°C",         documentRef: "QCI/F/10/03 Rev.03", responsibleRole: "Operator / QA", timing: "During / after galvanizing", isCTQ: true, isGate: false, applicability: "Galva; Galva and Painted" },
  { seq: 149, stageCode: "S19", name: "Final HDG Inspection and Type Test", department: "Galvanizing / Laboratory / QA", workCenter: "Final inspection bay",   documentRef: "QCI/F/10/04 Rev.02", responsibleRole: "QA / Laboratory", timing: "After galvanizing", isCTQ: true, isGate: true, applicability: "Galva; Galva and Painted" },
  // Painted route
  { seq: 150, stageCode: "S20", name: "Grit Blasting (Painted MS)",       department: "Operator production / QA inspector", workCenter: "Blasting booth",      documentRef: "QCI/F/06/01",         responsibleRole: "Operator production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 160, stageCode: "S21", name: "Sweep Blasting (HDG / SS)",        department: "Operator production / QA inspector", workCenter: "Blasting booth",      documentRef: "QCI/F/06/01",         responsibleRole: "Operator production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 170, stageCode: "S22", name: "Internal cleaning before internal coating", department: "QA inspector", workCenter: "Solvent tank",        documentRef: "PRO/F/02/25",         responsibleRole: "QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 180, stageCode: "S23", name: "Primer Flooding",                  department: "QA inspector",                workCenter: "Flooding chamber",           documentRef: "Job card / QCI/F/06/04", responsibleRole: "QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 190, stageCode: "S24", name: "Internal coating",                 department: "QA inspector",                workCenter: "Internal paint storage tank", documentRef: "QCI/F/06/04",         responsibleRole: "QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 200, stageCode: "S25", name: "Tilting the Radiator A & B side",  department: "QA inspector",                workCenter: "Tilting crane",              documentRef: "PRO/S/02/60",         responsibleRole: "QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 210, stageCode: "S26", name: "Hot Air Purging",                  department: "QA inspector",                workCenter: "Hot air blower",             documentRef: "PRO/S/02/60",         responsibleRole: "QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 220, stageCode: "S27", name: "Paint (MIO)",                      department: "Operator Production / QA inspector", workCenter: "Flooding chamber",  documentRef: "QCI/F/06/04",         responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 230, stageCode: "S28", name: "Radiator ovening",                 department: "Operator Production / QA inspector", workCenter: "Oven no.1",          documentRef: "QCI/F/06/04",         responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 240, stageCode: "S29", name: "PU Paint Flooding",                department: "Operator Production / QA inspector", workCenter: "Flooding chamber",  documentRef: "QCI/F/06/04",         responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 250, stageCode: "S30", name: "Internal pipe & flange cleaning & coating & ovening", department: "Operator Production / QA inspector", workCenter: "Drain station booth no.1", documentRef: "QCI/F/06/04 & QCI/F/06/08", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Painted radiator route" },
  { seq: 260, stageCode: "S31", name: "Endoscopic Check",                 department: "QA Inspector",                workCenter: "Oiling station",             documentRef: "QCI/S/06/05 & QCI/F/06/10", responsibleRole: "QA Inspector", timing: "After", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 270, stageCode: "S32", name: "Oil circulation inside radiator",  department: "QA inspector",                workCenter: "Oiling station",             documentRef: "QCI/F/06/07",         responsibleRole: "QA inspector", timing: "During / after", isCTQ: false, isGate: false, applicability: "Painted radiator route" },
  { seq: 280, stageCode: "S33", name: "Spray painting & Final inspection", department: "Operator Production, QA Engineer/inspector", workCenter: "Painting booth & final inspection area", documentRef: "QCI/F/06/02, QCI/F/06/08, QCI/F/06/06", responsibleRole: "Operator Production, QA Engineer/inspector", timing: "After", isCTQ: true, isGate: true, applicability: "Painted radiator route" },
  { seq: 290, stageCode: "S34", name: "Final product inspection",         department: "Operator Production, QA Engineer/inspector", workCenter: "Final product inspection area", documentRef: "QCI/F/03/01", responsibleRole: "Operator Production, QA Engineer/inspector", timing: "After", isCTQ: true, isGate: true, applicability: "Painted radiator route" },
  // Dispatch
  { seq: 300, stageCode: "S35", name: "Dry air / N2 Filling",             department: "Operator Production / QA inspector", workCenter: "Dry air / N2 cylinder", documentRef: "QCI/F/07/01", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Final release / dispatch" },
  { seq: 310, stageCode: "S36", name: "Crate / pallet making & fumigation", department: "Operator Production / QA inspector", workCenter: "Wood cutting & fumigation", documentRef: "QCI/F/07/01 & QCI/F/07/02", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: true, isGate: false, applicability: "Final release / dispatch" },
  { seq: 320, stageCode: "S37", name: "TC & Documentation",               department: "QA inspector",                workCenter: "TC documentation",           documentRef: "PRO/F/02/05",         responsibleRole: "QA inspector", timing: "After", isCTQ: false, isGate: true, applicability: "Final release / dispatch" },
  { seq: 330, stageCode: "S38", name: "Packing & Dispatch",               department: "Operator Production / QA inspector", workCenter: "Wooden crates",      documentRef: "QCI/F/07/01 & QCI/F/07/02", responsibleRole: "Operator Production / QA inspector", timing: "During / after", isCTQ: false, isGate: true, applicability: "Final release / dispatch" },
];

// Inspection characteristics per stage - drawn directly from the In-Process Quality Plan
type CharSpec = {
  seq: number;
  name: string;
  charType: string;
  isCTQ?: boolean;
  specification?: string;
  unit?: string;
  method?: string;
  frequency?: string;
};

const CHARACTERISTICS: Record<string, CharSpec[]> = {
  S01: [
    { seq: 1, name: "Sheet Thickness",            charType: "dimensional", isCTQ: false, specification: "As per Drg./Tol.±0.03 mm", unit: "mm", method: "Micrometer", frequency: "First piece + SPC Min 25-50 sheet" },
    { seq: 2, name: "Sheet width",                charType: "dimensional", isCTQ: false, specification: "As per Drg./Tol. ± 1 mm", unit: "mm", method: "Measuring tape", frequency: "First piece + SPC" },
    { seq: 3, name: "Neck to neck distance (CTQ)",charType: "dimensional", isCTQ: true,  specification: "As per Drg./Tolerance ±1 mm", unit: "mm", method: "Measuring Tape", frequency: "SPC Min 25-50 sheet" },
    { seq: 4, name: "Length wise bow",            charType: "dimensional", isCTQ: false, specification: "Max. 5 mm allowed", unit: "mm", method: "Line dori & Measuring tape", frequency: "First piece + SPC" },
    { seq: 5, name: "Width wise bow",             charType: "dimensional", isCTQ: false, specification: "Max. 3 mm allowed", unit: "mm", method: "Line dori & filler gauge", frequency: "First piece + SPC" },
    { seq: 6, name: "Forming & Rolling matching", charType: "dimensional", isCTQ: false, specification: "Max 2.0mm variation", unit: "mm", method: "Measuring tape", frequency: "First piece + SPC" },
    { seq: 7, name: "Sheet weaviness",            charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "First piece + SPC" },
    { seq: 8, name: "Die Depth",                  charType: "dimensional", isCTQ: false, specification: "3.5 to 5 mm", unit: "mm", method: "Depth Micrometer", frequency: "First piece + SPC" },
    { seq: 9, name: "Rolling Depth",              charType: "dimensional", isCTQ: false, specification: "4 to 5 mm", unit: "mm", method: "Depth Micrometer", frequency: "First piece + SPC" },
    { seq: 10, name: "Cut fin dimension",         charType: "dimensional", isCTQ: false, specification: "X & Y = ±5 mm", unit: "mm", method: "Measuring tape", frequency: "First piece + SPC" },
  ],
  S02: [
    { seq: 1, name: "Electrode dia.",                 charType: "dimensional", isCTQ: false, specification: "8-10 mm", unit: "mm", method: "Vernier calliper", frequency: "2 time per shift (1 recorded)" },
    { seq: 2, name: "Nugget Diameter",                charType: "dimensional", isCTQ: false, specification: "6.5-8.5 MM", unit: "mm", method: "Vernier calliper", frequency: "2 time per shift (1 recorded)" },
    { seq: 3, name: "Nugget test (Pull off test)",    charType: "parameter",   isCTQ: false, specification: "Nugget should not break (parent material tear)", unit: "-", method: "Pull off test", frequency: "2 time per shift" },
    { seq: 4, name: "Welding current (CTQ)",          charType: "parameter",   isCTQ: true,  specification: "WPS NO: VAA/HTR/CS/WPS", unit: "kA", method: "Weld Checker", frequency: "Once a day by QC Inspector" },
    { seq: 5, name: "Distance between two spots",     charType: "dimensional", isCTQ: false, specification: "Max 45.0 mm", unit: "mm", method: "Measuring tape", frequency: "First piece + sample" },
    { seq: 6, name: "Air Pressure",                   charType: "parameter",   isCTQ: false, specification: "4 to 5 kg/cm²", unit: "kg/cm²", method: "Pressure gauge", frequency: "2 time per shift" },
    { seq: 7, name: "Force between two electrodes (CTQ)", charType: "parameter", isCTQ: true, specification: "300-450 kgf", unit: "kgf", method: "Force gauge", frequency: "2 time per shift" },
    { seq: 8, name: "Top & bottom electrode matching",charType: "visual",      isCTQ: false, specification: "Carbon Test-Dia of impression 8-10 mm", unit: "mm", method: "Carbon & paper", frequency: "Every fin by operator" },
    { seq: 9, name: "Spot Burr",                      charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "Sample inspection" },
  ],
  S04: [
    { seq: 1, name: "Wheel Dia",                      charType: "dimensional", isCTQ: false, specification: "210-310 mm", unit: "mm", method: "Vernier calliper", frequency: "1 time per shift" },
    { seq: 2, name: "Welding current (CTQ)",          charType: "parameter",   isCTQ: true,  specification: "18-24 KA", unit: "kA", method: "Weld Checker", frequency: "Once a day by QC" },
    { seq: 3, name: "Pressure",                       charType: "parameter",   isCTQ: false, specification: "4-4.5 kg/cm²", unit: "kg/cm²", method: "Pressure gauge", frequency: "1 time per shift" },
    { seq: 4, name: "Top & bottom wheel matching",    charType: "visual",      isCTQ: false, specification: "Carbon test", unit: "-", method: "Carbon & paper", frequency: "First piece + every 20 fins MS / 100% SS" },
    { seq: 5, name: "Length wise bow",                charType: "dimensional", isCTQ: false, specification: "Max. 5 mm", unit: "mm", method: "Line dori", frequency: "1 time per shift" },
    { seq: 6, name: "Seam burr / Burr marking",       charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "Sample" },
    { seq: 7, name: "Trimming burr",                  charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "Sample" },
    { seq: 8, name: "Leakage",                        charType: "leak",        isCTQ: true,  specification: "No leakage allowed", unit: "-", method: "Individual fin leak test", frequency: "First piece + every 20 fins MS / 100% SS" },
  ],
  S06: [
    { seq: 1, name: "Fin Diagonal Difference",        charType: "dimensional", isCTQ: false, specification: "Max. 3 mm allowed", unit: "mm", method: "Measuring", frequency: "100% by operator, min 5 recorded/shift" },
    { seq: 2, name: "Burr After edge cutting",        charType: "dimensional", isCTQ: false, specification: "Max 0.8 mm", unit: "mm", method: "Micrometer / Vernier", frequency: "100% by operator" },
    { seq: 3, name: "Flute press / damage",           charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100% by operator" },
    { seq: 4, name: "Throat Opening",                 charType: "dimensional", isCTQ: false, specification: "18 ± 1 mm", unit: "mm", method: "Vernier calliper", frequency: "100% by operator" },
  ],
  S08: [
    { seq: 1, name: "First slot (For FF)",            charType: "dimensional", isCTQ: false, specification: "±2 mm", unit: "mm", method: "Measuring Tape", frequency: "Once in shift" },
    { seq: 2, name: "TP distance",                    charType: "dimensional", isCTQ: false, specification: "±2 mm", unit: "mm", method: "Measuring Tape", frequency: "Once in shift" },
    { seq: 3, name: "Pitch (CTQ)",                    charType: "dimensional", isCTQ: true,  specification: "±1 mm", unit: "mm", method: "Measuring Tape", frequency: "Once in shift" },
    { seq: 4, name: "Total Pipe length",              charType: "dimensional", isCTQ: false, specification: "±2 mm", unit: "mm", method: "Measuring Tape", frequency: "Once in shift" },
    { seq: 5, name: "Boss/Thermometer Hole Id",       charType: "dimensional", isCTQ: false, specification: "±1 mm", unit: "mm", method: "Vernier calliper", frequency: "Once in shift" },
    { seq: 6, name: "Burr (CTQ)",                     charType: "visual",      isCTQ: true,  specification: "Not allowed", unit: "-", method: "Visual", frequency: "Once in shift" },
    { seq: 7, name: "Foreign matters inside (CTQ)",   charType: "visual",      isCTQ: true,  specification: "Not allowed", unit: "-", method: "Visual", frequency: "Once in shift" },
    { seq: 8, name: "Pipe rusting (CTQ)",             charType: "visual",      isCTQ: true,  specification: "Not allowed", unit: "-", method: "Visual", frequency: "Once in shift" },
    { seq: 9, name: "Internal Blasting of pipe",      charType: "visual",      isCTQ: false, specification: "Should be proper blasted", unit: "-", method: "Visual", frequency: "Once in shift" },
  ],
  S09: [
    { seq: 1, name: "Flange Hole alignment",          charType: "dimensional", isCTQ: false, specification: "Misalignment not allowed. Coplanarity diff upto 1mm", unit: "mm", method: "Square Bar & Filler Gauge", frequency: "100%" },
    { seq: 2, name: "Flange Flatness/straightness (CTQ)", charType: "dimensional", isCTQ: true, specification: "No bend allowed", unit: "-", method: "Flat plate", frequency: "100%" },
    { seq: 3, name: "Flange Dimension",                charType: "dimensional", isCTQ: false, specification: "As per Drawing/P.O", unit: "mm", method: "Measuring tape/Vernier", frequency: "100%" },
    { seq: 4, name: "Header pipe assy Straightness (CTQ)", charType: "dimensional", isCTQ: true, specification: "1 mm", unit: "mm", method: "Right Angle & filler gauge", frequency: "100%" },
    { seq: 5, name: "Flange to pipe right angle (CTQ)", charType: "dimensional", isCTQ: true, specification: "0.4 MM", unit: "mm", method: "Right Angle & filler gauge", frequency: "100%" },
    { seq: 6, name: "Accessories welding - Current/Voltage/Gas flow", charType: "parameter", isCTQ: false, specification: "As per WPS-HTR-K-135 series", unit: "A / V / lpm", method: "Ammeter / Voltmeter / Flow meter", frequency: "Once in shift" },
    { seq: 7, name: "Internal pipe blasting",          charType: "visual",      isCTQ: false, specification: "Should be proper blasted", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 8, name: "Pipe pre-treatment process",      charType: "lab",         isCTQ: false, specification: "PH Temp, Titration & Conductivity", unit: "-", method: "pH meter / conductivity meter / Titration", frequency: "Daily" },
  ],
  S11: [
    { seq: 1, name: "Gauge setting (CTQ)",            charType: "dimensional", isCTQ: true,  specification: "As per check sheet", unit: "-", method: "Measuring tape + Water level", frequency: "Each setup / changeover" },
    { seq: 2, name: "Diagonal difference",            charType: "dimensional", isCTQ: false, specification: "Not more than 5 mm", unit: "mm", method: "Measuring tape", frequency: "100%" },
    { seq: 3, name: "CC distance (CTQ)",              charType: "dimensional", isCTQ: true,  specification: "CC 0 to +3 mm", unit: "mm", method: "Measuring tape", frequency: "100%" },
    { seq: 4, name: "No. of fins",                    charType: "dimensional", isCTQ: false, specification: "As per Drg./P.O", unit: "Nos", method: "Counting", frequency: "100%" },
    { seq: 5, name: "Fin straightness (CTQ)",         charType: "visual",      isCTQ: true,  specification: "Bend fins not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 6, name: "Pitch (CTQ)",                    charType: "dimensional", isCTQ: true,  specification: "As per Drg./± 1 mm", unit: "mm", method: "Measuring tape", frequency: "100%" },
    { seq: 7, name: "Flange to fin right angle (CTQ)",charType: "dimensional", isCTQ: true,  specification: "1 mm", unit: "mm", method: "Right Angle & filler gauge", frequency: "100%" },
    { seq: 8, name: "Flange coplanarity",             charType: "dimensional", isCTQ: false, specification: "0.4 mm", unit: "mm", method: "Straight edge & filler gauge", frequency: "100%" },
    { seq: 9, name: "Flange Hole alignment",          charType: "dimensional", isCTQ: false, specification: "0.5 mm", unit: "mm", method: "Nylon string", frequency: "100%" },
    { seq: 10, name: "Burr / Dust in Header pipe (CTQ)", charType: "visual",    isCTQ: true,  specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 11, name: "QC ok sticker by Inspector",    charType: "visual",      isCTQ: false, specification: "After final verification", unit: "-", method: "Visual / Sticker", frequency: "100%" },
  ],
  S12: [
    { seq: 1, name: "Current (CTQ)",                  charType: "parameter",   isCTQ: true,  specification: "WPS-HTR-K-135-EN-17", unit: "A", method: "Ammeter", frequency: "Once in shift by QC" },
    { seq: 2, name: "Voltage (CTQ)",                  charType: "parameter",   isCTQ: true,  specification: "WPS-HTR-K-135-EN-17", unit: "V", method: "Voltmeter", frequency: "Once in shift by QC" },
    { seq: 3, name: "Gas flow (CTQ)",                 charType: "parameter",   isCTQ: true,  specification: "WPS-HTR-K-135-EN-17", unit: "lpm", method: "Gas Flow meter", frequency: "Once in shift by QC" },
    { seq: 4, name: "Internal pipe Spatter/scale/lug",charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Magnet + wire brush + vacuum", frequency: "100%" },
    { seq: 5, name: "Cavities, blow holes, undercut, weld crack", charType: "visual", isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 6, name: "Flange co-planarity & Co-linarity", charType: "dimensional", isCTQ: false, specification: "As per requirement", unit: "mm", method: "Line dori/Pata", frequency: "100%" },
    { seq: 7, name: "Distortion control gauge for CC distance (CTQ)", charType: "dimensional", isCTQ: true, specification: "-1.0mm to +2.0mm", unit: "mm", method: "Measuring tape", frequency: "100%" },
  ],
  S14: [
    { seq: 1, name: "Leakage (CTQ)",                  charType: "leak",        isCTQ: true,  specification: "Leakage free after min. 30 min. at 2 kg/cm²", unit: "kg/cm²", method: "Pressure test tank", frequency: "100%" },
    { seq: 2, name: "CC distance (CTQ)",              charType: "dimensional", isCTQ: true,  specification: "±2.0 mm", unit: "mm", method: "Measuring tape", frequency: "100%" },
    { seq: 3, name: "Flange Coplanarity (CTQ)",       charType: "dimensional", isCTQ: true,  specification: "Diff upto 1 mm allowed", unit: "mm", method: "Square Bar & Filler Gauge", frequency: "100%" },
    { seq: 4, name: "Flange to fin right angle (CTQ)",charType: "dimensional", isCTQ: true,  specification: "1.5 mm allowed", unit: "mm", method: "Right Angle & filler gauge", frequency: "100%" },
    { seq: 5, name: "Flange Hole alignment (CTQ)",    charType: "dimensional", isCTQ: true,  specification: "0.5 mm allowed", unit: "mm", method: "Nylon string", frequency: "100%" },
    { seq: 6, name: "Internal cleaning of Header Pipes (CTQ)", charType: "visual", isCTQ: true, specification: "No impurities inside", unit: "-", method: "Magnet / vacuum cleaner", frequency: "100%" },
    { seq: 7, name: "Torque for Boss & plug",         charType: "parameter",   isCTQ: false, specification: "ABB USA 65-75 Nm, Teflon Big 25-30 Nm, Nylon Big 45-50 Nm", unit: "Nm", method: "Torque wrench", frequency: "100%" },
    { seq: 8, name: "Blanking plate leakproofness",   charType: "visual",      isCTQ: false, specification: "No leakage allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 9, name: "Blanking plate thickness",       charType: "dimensional", isCTQ: false, specification: "10 mm", unit: "mm", method: "Vernier calliper", frequency: "100%" },
    { seq: 10, name: "QC ok sticker by Inspector",    charType: "visual",      isCTQ: false, specification: "With sticker only radiator moves to blasting", unit: "-", method: "Sticker", frequency: "100%" },
  ],
  S18: [
    { seq: 1, name: "Bath temperature",               charType: "parameter",   isCTQ: true,  specification: "450 to 460 °C", unit: "°C", method: "Thermocouple", frequency: "Continuous / per job" },
    { seq: 2, name: "Dipping time",                   charType: "parameter",   isCTQ: true,  specification: "180 Sec / As per DFT required", unit: "sec", method: "Timer", frequency: "Per HDG job" },
    { seq: 3, name: "Skimming of ash before withdrawal", charType: "visual",   isCTQ: false, specification: "Ash removed before withdrawal", unit: "-", method: "Visual", frequency: "Per job" },
    { seq: 4, name: "Air quenching - cooling time",   charType: "parameter",   isCTQ: false, specification: "10 Min, reduce to 60-65 °C", unit: "min / °C", method: "Timer / Temp gun", frequency: "Per job" },
    { seq: 5, name: "Water quenching - temp below",   charType: "parameter",   isCTQ: false, specification: "Below 45 °C in 2 min", unit: "°C", method: "Thermometer", frequency: "Per job" },
    { seq: 6, name: "Passivation",                    charType: "visual",      isCTQ: false, specification: "Just dipping, 2 min", unit: "min", method: "Timer", frequency: "Per job" },
    { seq: 7, name: "Surface defects (pimples, blisters, drainage spikes)", charType: "visual", isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 8, name: "Bare spot / Black spot / Ash deposit / Oxide lines", charType: "visual", isCTQ: true, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 9, name: "Zinc icing / Lumpiness",         charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 10, name: "Distortion",                    charType: "visual",      isCTQ: false, specification: "Not allowed", unit: "-", method: "Visual", frequency: "100%" },
  ],
  S20: [
    { seq: 1, name: "Chilled Iron Grit",              charType: "visual",      isCTQ: false, specification: "G 58 Grade", unit: "-", method: "Sample grit", frequency: "Once in shift" },
    { seq: 2, name: "Surface as per Sa 2.5 (CTQ)",    charType: "visual",      isCTQ: true,  specification: "Match master sample of Sa 2.5", unit: "-", method: "Master sample", frequency: "Once in shift" },
    { seq: 3, name: "Blasting pressure (CTQ)",        charType: "parameter",   isCTQ: true,  specification: "5 to 6 kg/cm²", unit: "kg/cm²", method: "Pressure gauge", frequency: "Sample basis" },
    { seq: 4, name: "Surface Profile",                charType: "dimensional", isCTQ: false, specification: "40-60 MICRONS", unit: "microns", method: "Snap gauge / digital profile gauge", frequency: "Sample basis" },
    { seq: 5, name: "Vibrating radiator (CTQ)",       charType: "visual",      isCTQ: true,  specification: "Vibrate on vibration table", unit: "-", method: "Physical verification", frequency: "100%" },
    { seq: 6, name: "Humidity (CTQ)",                 charType: "parameter",   isCTQ: true,  specification: "Max. 85 % allowed", unit: "%", method: "Hygrometer / Digital temp gauge", frequency: "Once in shift" },
    { seq: 7, name: "Pre Heating of radiator",        charType: "parameter",   isCTQ: false, specification: "Temp 70°C for time 30 min", unit: "°C / min", method: "Timer and temp gun", frequency: "100%" },
    { seq: 8, name: "Steel surface temp & Dew point", charType: "parameter",   isCTQ: false, specification: "Surface temp min 3°C above dew point", unit: "°C", method: "Temperature gauge & Hygrometer", frequency: "Once in shift" },
    { seq: 9, name: "Time interval blasting → 1st primer coat (CTQ)", charType: "parameter", isCTQ: true, specification: "Max. 4 hours", unit: "hours", method: "Job card", frequency: "100%" },
  ],
  S23: [
    { seq: 1, name: "Time interval blasting → 1st primer coat", charType: "parameter", isCTQ: false, specification: "Max. 4 hours", unit: "hours", method: "Job card", frequency: "100%" },
    { seq: 2, name: "Viscosity (CTQ)",                charType: "parameter",   isCTQ: true,  specification: "As per Internal specification", unit: "sec", method: "B4 Ford Cup + Stop watch", frequency: "Per batch" },
    { seq: 3, name: "DFT",                            charType: "dimensional", isCTQ: false, specification: "As per Drg./P.O", unit: "microns", method: "Coating thickness gauge", frequency: "Per radiator" },
    { seq: 4, name: "Drying time between two coats (CTQ)", charType: "parameter", isCTQ: true, specification: "Internal specification", unit: "min", method: "Job card", frequency: "Per radiator" },
    { seq: 5, name: "Visual defects (rundown, dust, pin hole, primer drop)", charType: "visual", isCTQ: false, specification: "Defect not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 6, name: "Type of primer & no. of coat",   charType: "visual",      isCTQ: false, specification: "As per Drg./P.O", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 7, name: "Pot life",                       charType: "parameter",   isCTQ: false, specification: "As per paint/primer data sheet", unit: "min", method: "Paint kitchen issue slip", frequency: "Per batch" },
    { seq: 8, name: "Humidity (CTQ)",                 charType: "parameter",   isCTQ: true,  specification: "Max. 85 % allowed", unit: "%", method: "Temperature gauge & Hygrometer", frequency: "Once in shift" },
  ],
  S34: [
    { seq: 1, name: "Visual defects (rundown, dust, pin hole, primer drop, peel off)", charType: "visual", isCTQ: false, specification: "Defect not allowed", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 2, name: "DFT in inaccessible area & internal pipe (CTQ)", charType: "dimensional", isCTQ: true, specification: "As per Drg./P.O", unit: "microns", method: "DFT meter", frequency: "100%" },
    { seq: 3, name: "Dimension - accessories, fan support, ring, flute", charType: "dimensional", isCTQ: false, specification: "As per Drg./P.O", unit: "mm", method: "Vernier calliper", frequency: "100%" },
    { seq: 4, name: "CC, flange hole alignment & right angle (CTQ)", charType: "dimensional", isCTQ: true, specification: "±2.0 mm", unit: "mm", method: "Line dori, Measuring tape & right angle", frequency: "100%" },
    { seq: 5, name: "SS-Labels on flange - HTU NO",   charType: "visual",      isCTQ: false, specification: "As per specification", unit: "-", method: "SS Labels", frequency: "As per customer" },
    { seq: 6, name: "SS & MS Plug verification",      charType: "visual",      isCTQ: false, specification: "As per Drg./P.O", unit: "-", method: "Magnet", frequency: "100%" },
    { seq: 7, name: "Peel off Test after drying (CTQ)", charType: "parameter", isCTQ: true,  specification: "As per std.", unit: "-", method: "Transparent adhesive tape", frequency: "Random" },
    { seq: 8, name: "Paint shade (CTQ)",              charType: "visual",      isCTQ: true,  specification: "As per Drg./P.O", unit: "-", method: "Shade Card + Visual", frequency: "100%" },
    { seq: 9, name: "Internal paint inside pipe & fin", charType: "visual",    isCTQ: false, specification: "Defect not allowed", unit: "-", method: "Endoscopic camera", frequency: "100%" },
    { seq: 10, name: "Holiday inspection",            charType: "parameter",   isCTQ: false, specification: "As per std & defect not allowed", unit: "-", method: "Holiday detector", frequency: "As per customer" },
    { seq: 11, name: "Rod touch up (CTQ)",            charType: "visual",      isCTQ: true,  specification: "Paint damage free on rod", unit: "-", method: "Visual", frequency: "100%" },
    { seq: 12, name: "Torque application on plug",    charType: "parameter",   isCTQ: false, specification: "As per std.", unit: "Nm", method: "Torque wrench", frequency: "100%" },
    { seq: 13, name: "QC ok sticker by quality inspector", charType: "visual", isCTQ: false, specification: "Without sticker not moved to packing", unit: "-", method: "Sticker", frequency: "100%" },
  ],
};

const CUSTOMERS = [
  { name: "S.E.A. Societa Elettromeccanica Arzignanese S.p.A.", country: "Italy" },
  { name: "Ayr Energy India Private Limited", country: "India" },
  { name: "Elsewedy Electric for Electrical Products S.A.E", country: "Egypt" },
  { name: "Saudi Power Transformers Company", country: "Saudi Arabia" },
  { name: "Delta Star Inc.", country: "USA" },
  { name: "Hitachi Energy Turkey Elektrik", country: "Turkey" },
  { name: "Hi-Tech Radiators Pvt Ltd (Tank Division)", country: "India" },
];

const PRODUCTS = [
  { partNo: "HTRFG01254", itemName: "SEA ITALY 2000 / 1700 X 520 X 13 + 3 x 1.20 HDG 70 MIC", productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K3", finishType: "HDG 70 MIC" },
  { partNo: "HTRFG02042", itemName: "AYR ENERGY 1700 X 520 X 15 x 1.20 HDG 80 MIC",          productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K1", finishType: "HDG 80 MIC" },
  { partNo: "HTRFG01965", itemName: "ELSEWEDY 3500 / 2500 X 520 X 32 + 3 x 1.20 HDG + Painted 80+230 RAL 7035", productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K3", finishType: "HDG + Painted 80+230 RAL 7035" },
  { partNo: "HTRFG02044", itemName: "SPTC 3000 / 1800 X 520 X 31 + 3 x 1.20 HDG + Painted 85+200 RAL 7035",    productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K1", finishType: "HDG + Painted 85+200 RAL 7035" },
  { partNo: "HTRFG02043", itemName: "SPTC 2500 / 2100 X 520 X 26 + 3 x 1.20 HDG + Painted 70+210 RAL 7038",    productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K2", finishType: "HDG + Painted 70+210 RAL 7038" },
  { partNo: "HTRFG01548", itemName: "Delta Star FG 2896 X 520 X 36 x 1.00 HDG 55 MIC",                        productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K3", finishType: "HDG 55 MIC" },
  { partNo: "HTRFG02045", itemName: "HITACHI TURKEY 1600 X 520 X 25 x 1.00 HDG + Painted 55+160 ANSI 70 Akzo EP", productGroup: "RADIATORS-FG", category: "Finished Good", defaultRoute: "K1", finishType: "HDG + Painted 55+160 ANSI 70" },
];

// Sample work orders - K2 plant focus (stainless steel radiators)
const WORK_ORDERS = [
  { woNumber: "WO-3001", soNumber: "ESO-R/0195/26-27", customer: "S.E.A. Societa Elettromeccanica Arzignanese S.p.A.", customerPo: "ODA100139", partNo: "HTRFG01254", itemName: "SEA ITALY SS 2000/1700 X 520 X 13 + 3 x 1.20 Sweep Blast + Painted 70+210 RAL 7038", size: "2000 / 1700 X 520 X 13", finishType: "Sweep Blast + Painted 70+210 RAL 7038", routeCode: "K2", plannedQty: 6, completedQty: 6, priority: "High", status: "Completed", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3002", soNumber: "API-RD/SO/0522/26-27", customer: "Ayr Energy India Private Limited", customerPo: "AEIPL-M-2610-538", partNo: "HTRFG02042", itemName: "AYR ENERGY SS 1700 X 520 X 15 x 1.20 Painted 80+230 RAL 7035", size: "1700 X 520 X 15", finishType: "Painted 80+230 RAL 7035", routeCode: "K2", plannedQty: 3, completedQty: 1, priority: "High", status: "In Progress", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3003", soNumber: "API-RD/SO/0523/26-27", customer: "Elsewedy Electric for Electrical Products S.A.E", customerPo: "20095201", partNo: "HTRFG01965", itemName: "ELSEWEDY SS 3500/2500 X 520 X 32 + 3 x 1.20 Sweep Blast + Painted 80+230 RAL 7035", size: "3500 / 2500 X 520 X 32", finishType: "Sweep Blast + Painted 80+230 RAL 7035", routeCode: "K2", plannedQty: 22, completedQty: 8, priority: "High", status: "In Progress", materialStatus: "Partial", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3004", soNumber: "API-RD/SO/0524/26-27", customer: "Saudi Power Transformers Company", customerPo: "SPTC-PO7831", partNo: "HTRFG02044", itemName: "SPTC SS 3000/1800 X 520 X 31 + 3 x 1.20 Painted 85+200 RAL 7035", size: "3000 / 1800 X 520 X 31", finishType: "Painted 85+200 RAL 7035", routeCode: "K2", plannedQty: 12, completedQty: 0, priority: "Medium", status: "Released", materialStatus: "Partial", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3005", soNumber: "API-RD/SO/0524/26-27", customer: "Saudi Power Transformers Company", customerPo: "SPTC-PO7831", partNo: "HTRFG02043", itemName: "SPTC SS 2500/2100 X 520 X 26 + 3 x 1.20 Painted 70+210 RAL 7038", size: "2500 / 2100 X 520 X 26", finishType: "Painted 70+210 RAL 7038", routeCode: "K2", plannedQty: 44, completedQty: 12, priority: "High", status: "In Progress", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3006", soNumber: "ESO-R/0196/26-27", customer: "Delta Star Inc.", customerPo: "1186296", partNo: "HTRFG01548", itemName: "Delta Star SS FG 2896 X 520 X 36 x 1.00 Painted 55+160 ANSI 70", size: "2896 X 520 X 36", finishType: "Painted 55+160 ANSI 70", routeCode: "K2", plannedQty: 1, completedQty: 1, priority: "Medium", status: "Completed", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3007", soNumber: "API-RD/SO/0525/26-27", customer: "Hitachi Energy Turkey Elektrik", customerPo: "4502487837", partNo: "HTRFG02045", itemName: "HITACHI TURKEY SS 1600 X 520 X 25 x 1.00 Painted 55+160 ANSI 70 Akzo EP", size: "1600 X 520 X 25", finishType: "Painted 55+160 ANSI 70", routeCode: "K2", plannedQty: 4, completedQty: 0, priority: "High", status: "On Hold", materialStatus: "Not Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3008", soNumber: "ESO-R/0197/26-27", customer: "S.E.A. Societa Elettromeccanica Arzignanese S.p.A.", customerPo: "ODA100140", partNo: "HTRFG01255", itemName: "SEA ITALY SS 2200/1800 X 520 X 15 + 3 x 1.20 Painted 70+200 RAL 7035", size: "2200 / 1800 X 520 X 15", finishType: "Painted 70+200 RAL 7035", routeCode: "K2", plannedQty: 8, completedQty: 3, priority: "Medium", status: "In Progress", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3009", soNumber: "API-RD/SO/0526/26-27", customer: "Ayr Energy India Private Limited", customerPo: "AEIPL-M-2610-539", partNo: "HTRFG02043", itemName: "AYR ENERGY SS 1900 X 520 X 13 x 1.00 Painted 70+180 RAL 9003", size: "1900 X 520 X 13", finishType: "Painted 70+180 RAL 9003", routeCode: "K2", plannedQty: 16, completedQty: 16, priority: "High", status: "Completed", materialStatus: "Available", salesPerson: "Taufique Khan" },
  { woNumber: "WO-3010", soNumber: "API-RD/SO/0527/26-27", customer: "Elsewedy Electric for Electrical Products S.A.E", customerPo: "20095202", partNo: "HTRFG01966", itemName: "ELSEWEDY SS 3000/2200 X 520 X 28 + 3 x 1.20 Sweep Blast + Painted 80+200 RAL 7035", size: "3000 / 2200 X 520 X 28", finishType: "Sweep Blast + Painted 80+200 RAL 7035", routeCode: "K2", plannedQty: 18, completedQty: 5, priority: "High", status: "In Progress", materialStatus: "Partial", salesPerson: "Taufique Khan" },
];

const DOCUMENTS = [
  { docNumber: "QCI/Q/01/01", title: "Governing Incoming Quality Plan", revision: "Rev.05", effectiveDate: new Date("2023-10-29"), status: "Released", docType: "plan", category: "incoming", owner: "Yogesh Balate" },
  { docNumber: "QCI/Q/02/01", title: "In-Process Quality Plan (Radiator)", revision: "Rev.08", effectiveDate: new Date("2024-02-07"), status: "Released", docType: "plan", category: "in-process", owner: "Yogesh Balate" },
  { docNumber: "QCI/F/02/01", title: "Rolling Checklist", revision: "Rev.05", effectiveDate: new Date("2024-04-19"), status: "Released", docType: "checklist", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/02/02", title: "Resistance Spot Welding Checklist", revision: "Rev.04", effectiveDate: new Date("2022-06-10"), status: "Released", docType: "checklist", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/02/03", title: "Edge Cutting Checklist", revision: "Rev.04", effectiveDate: new Date("2024-03-26"), status: "Released", docType: "checklist", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/02/04", title: "TIG Welding Checklist", revision: "Rev.03", effectiveDate: new Date("2022-08-30"), status: "Released", docType: "checklist", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/02/05", title: "Individual Fin Leak Test Record", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/01", title: "Pipe Slotting Checklist", revision: "Rev.04", effectiveDate: new Date("2024-01-20"), status: "Released", docType: "checklist", category: "header", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/03", title: "Erection Checklist", revision: "Rev.09", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "checklist", category: "assembly", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/04", title: "Welding Parameter Check List", revision: "Rev.03", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "checklist", category: "welding", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/05", title: "Gauge Setting Checklist", revision: "Rev.03", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "checklist", category: "assembly", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/06", title: "CO2 Full Welding Checklist", revision: "Rev.02", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "checklist", category: "welding", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/07", title: "Spatter Cleaning Checklist", revision: "Rev.02", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "checklist", category: "assembly", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/08", title: "Leak Testing Report", revision: "Rev.03", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "report", category: "leak-test", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/09", title: "Leak Inspection (Dimensional & Visual)", revision: "Rev.07", effectiveDate: new Date("2025-10-13"), status: "Released", docType: "checklist", category: "leak-test", owner: "QA Document Control" },
  { docNumber: "QCI/F/03/01", title: "Final Product Inspection", revision: "Rev.10", effectiveDate: new Date("2025-09-01"), status: "Released", docType: "report", category: "final", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/01", title: "Blasting Process Checklist", revision: "Rev.03", effectiveDate: new Date("2024-04-19"), status: "Released", docType: "checklist", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/02", title: "Inspection Report - Weather Condition", revision: "Rev.02", effectiveDate: new Date("2024-04-19"), status: "Released", docType: "report", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/04", title: "Corrosion Protection / Flow Coating", revision: "Rev.11", effectiveDate: new Date("2025-09-01"), status: "Released", docType: "report", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/06", title: "Peel Off Test", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/07", title: "Oil Flushing", revision: "Rev.03", effectiveDate: new Date("2024-04-19"), status: "Released", docType: "report", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/06/08", title: "Final Paint Inspection", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "paint", owner: "QA Document Control" },
  { docNumber: "QCI/F/07/01", title: "Packing Checklist", revision: "Rev.10", effectiveDate: new Date("2025-09-01"), status: "Released", docType: "checklist", category: "packing", owner: "QA Document Control" },
  { docNumber: "QCI/F/07/02", title: "Container Loading Inspection", revision: "Rev.02", effectiveDate: new Date("2024-04-19"), status: "Released", docType: "checklist", category: "packing", owner: "QA Document Control" },
  { docNumber: "QCI/F/07/03", title: "Dispatch Document Gate", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "checklist", category: "packing", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/01", title: "Pre-Galvanizing Checklist", revision: "Rev.003", effectiveDate: new Date("2023-10-08"), status: "Released", docType: "checklist", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/02", title: "Pre-treatment Check Sheet", revision: "Rev.005", effectiveDate: new Date("2025-08-19"), status: "Released", docType: "checklist", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/03", title: "Galvanizing Check Sheet", revision: "Rev.03", effectiveDate: new Date("2026-03-30"), status: "Released", docType: "checklist", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/04", title: "Final HDG Radiator Inspection Report", revision: "Rev.02", effectiveDate: new Date("2023-10-08"), status: "Released", docType: "report", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/05", title: "Pre-treatment & Post-treatment Chemical Test Report", revision: "Rev.004", effectiveDate: new Date("2025-07-20"), status: "Released", docType: "report", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/10/06", title: "HDG Type Test Certificate", revision: "Rev.01", effectiveDate: new Date("2017-10-01"), status: "Released", docType: "report", category: "HDG", owner: "QA Document Control" },
  { docNumber: "QCI/F/09/05", title: "Daily FPY - Rolling", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "performance", owner: "QA Document Control" },
  { docNumber: "QCI/F/09/06", title: "Daily FPY - Header Assembly", revision: "Rev.02", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "performance", owner: "QA Document Control" },
  { docNumber: "QCI/F/09/07", title: "Daily FPY - Erection", revision: "Rev.02", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "performance", owner: "QA Document Control" },
  { docNumber: "QCI/F/09/08", title: "Daily FPY - Leak Testing", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "performance", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/13", title: "Pressure Test Report (Annexure I)", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "leak-test", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/14", title: "Dye Penetration Test Report (Annexure III)", revision: "Rev.01", effectiveDate: new Date("2021-04-15"), status: "Released", docType: "report", category: "leak-test", owner: "QA Document Control" },
  // Legacy / under review
  { docNumber: "QCI/F/02/01", title: "Rolling Checklist (Legacy)", revision: "Rev.04", effectiveDate: new Date("2024-02-07"), status: "Obsolete", docType: "checklist", category: "in-process", owner: "QA Document Control" },
  { docNumber: "QCI/F/05/03", title: "Erection Checklist (Legacy)", revision: "Rev.08", effectiveDate: new Date("2025-08-12"), status: "Obsolete", docType: "checklist", category: "assembly", owner: "QA Document Control" },
];

const EQUIPMENT = [
  { assetCode: "MIC-101", name: "Micrometer 0-25mm", type: "measuring", location: "Rolling line", lastCalibration: new Date("2026-04-15"), nextCalibration: new Date("2026-10-15"), calibrationFrequency: "6 months" },
  { assetCode: "MIC-102", name: "Depth Micrometer", type: "measuring", location: "Rolling line", lastCalibration: new Date("2026-03-20"), nextCalibration: new Date("2026-09-20"), calibrationFrequency: "6 months" },
  { assetCode: "VER-201", name: "Vernier Calliper 300mm", type: "measuring", location: "QC Lab", lastCalibration: new Date("2026-05-10"), nextCalibration: new Date("2026-11-10"), calibrationFrequency: "6 months" },
  { assetCode: "WC-301", name: "Weld Checker (Spot)", type: "measuring", location: "Spot welding m/c", lastCalibration: new Date("2026-02-15"), nextCalibration: new Date("2026-08-15"), calibrationFrequency: "6 months" },
  { assetCode: "FG-401", name: "Force Gauge 0-500 kgf", type: "measuring", location: "Spot welding m/c", lastCalibration: new Date("2026-01-30"), nextCalibration: new Date("2026-07-30"), calibrationFrequency: "6 months" },
  { assetCode: "PG-501", name: "Pressure Gauge 0-10 kg/cm²", type: "measuring", location: "Seam welding m/c", lastCalibration: new Date("2026-04-05"), nextCalibration: new Date("2026-10-05"), calibrationFrequency: "6 months" },
  { assetCode: "DFT-601", name: "Coating Thickness Gauge", type: "measuring", location: "Paint shop", lastCalibration: new Date("2026-03-15"), nextCalibration: new Date("2026-09-15"), calibrationFrequency: "6 months" },
  { assetCode: "TW-701", name: "Torque Wrench 20-150 Nm", type: "measuring", location: "Leak test", lastCalibration: new Date("2026-02-28"), nextCalibration: new Date("2026-08-28"), calibrationFrequency: "6 months" },
  { assetCode: "HYG-801", name: "Digital Hygrometer", type: "measuring", location: "Paint shop", lastCalibration: new Date("2026-05-01"), nextCalibration: new Date("2026-11-01"), calibrationFrequency: "6 months" },
  { assetCode: "PH-901", name: "pH Meter", type: "measuring", location: "HDG Lab", lastCalibration: new Date("2026-04-20"), nextCalibration: new Date("2026-07-20"), calibrationFrequency: "3 months" },
  { assetCode: "TEMP-1001", name: "Infrared Temp Gun", type: "measuring", location: "HDG plant", lastCalibration: new Date("2026-03-25"), nextCalibration: new Date("2026-09-25"), calibrationFrequency: "6 months" },
  { assetCode: "HD-1101", name: "Holiday Detector", type: "measuring", location: "Final inspection", lastCalibration: new Date("2026-01-15"), nextCalibration: new Date("2026-07-15"), calibrationFrequency: "6 months" },
];

const FMEA_RECORDS = [
  { fmeaId: "FMEA-001", stageName: "Seam Welding & Trimming", failureMode: "Leakage at seam weld", failureEffect: "Radiator fails leak test, rework required, customer complaint risk", potentialCause: "Welding current below 18 kA or wheel misalignment", preventionControl: "Weld Checker verification daily + carbon test every 20 fins", detectionControl: "Individual fin leak test first piece + every 20 fins", severity: 9, occurrence: 4, detection: 3, actionPriority: "High", recommendedAction: "Add real-time current monitoring on seam welding m/c", actionOwner: "Welding Engg", status: "In Progress" },
  { fmeaId: "FMEA-002", stageName: "Single spot Welding", failureMode: "Nugget failure in pull-off test", failureEffect: "Fin detachment during service", potentialCause: "Electrode force below 300 kgf or electrode tip wear", preventionControl: "Force gauge check 2x/shift + electrode sandering", detectionControl: "Pull off test 2x/shift + visual carbon test every fin", severity: 10, occurrence: 3, detection: 4, actionPriority: "High", recommendedAction: "Auto-rejection when force < 300 kgf", actionOwner: "Production Head", status: "Open" },
  { fmeaId: "FMEA-003", stageName: "Hot-Dip Galvanizing", failureMode: "Bare spot / black spot on HDG surface", failureEffect: "Customer rejection, rework cost, type test failure", potentialCause: "Insufficient surface cleaning pre-dip or flux contamination", preventionControl: "Pre-treatment bath chemistry control + lab PT check", detectionControl: "100% visual after galvanizing + DFT at 5 locations", severity: 9, occurrence: 3, detection: 2, actionPriority: "Medium", recommendedAction: "Increase pickling time monitoring + fluxing pH auto-log", actionOwner: "HDG In-charge", status: "In Progress" },
  { fmeaId: "FMEA-004", stageName: "Leak Testing", failureMode: "Leakage at flange-to-pipe weld", failureEffect: "Field failure, oil leak in transformer", potentialCause: "Undercut / porosity in MAG welding", preventionControl: "WPS compliance + parameter check every shift", detectionControl: "100% pressure test 30 min @ 2 kg/cm²", severity: 10, occurrence: 2, detection: 2, actionPriority: "Medium", recommendedAction: "Add robotic welding parameter auto-record", actionOwner: "Welding Engg", status: "Action-Verified" },
  { fmeaId: "FMEA-005", stageName: "Primer Flooding", failureMode: "Primer peel off after drying", failureEffect: "Corrosion in service, customer complaint", potentialCause: "Surface humidity > 85% or time interval blasting→primer > 4 hrs", preventionControl: "Hygrometer monitoring + job card timestamp", detectionControl: "Peel off test after drying", severity: 8, occurrence: 4, detection: 3, actionPriority: "High", recommendedAction: "Weather station integration with paint booth", actionOwner: "Paint Shop Head", status: "Open" },
  { fmeaId: "FMEA-006", stageName: "Assembly (Erection)", failureMode: "CC distance out of tolerance", failureEffect: "Assembly mismatch with transformer, field rework", potentialCause: "Gauge setting drift or fixture wear", preventionControl: "Gauge setting checklist each setup + water level verification", detectionControl: "100% CC measurement + diagonal difference check", severity: 8, occurrence: 3, detection: 2, actionPriority: "Medium", recommendedAction: "Digital gauge with auto-record", actionOwner: "Assembly Head", status: "Open" },
  { fmeaId: "FMEA-007", stageName: "Final product inspection", failureMode: "DFT below spec in inaccessible areas", failureEffect: "Premature corrosion, warranty claim", potentialCause: "Spray gun clogging or painter technique", preventionControl: "DFT gauge calibration + painter training", detectionControl: "100% DFT at inaccessible points + holiday inspection", severity: 8, occurrence: 3, detection: 3, actionPriority: "Medium", recommendedAction: "Painter competency certification renewal", actionOwner: "QA Head", status: "In Progress" },
  { fmeaId: "FMEA-008", stageName: "Pipe Cutting By Plasma", failureMode: "Burr inside pipe (CTQ)", failureEffect: "Internal pipe contamination, oil flow restriction", potentialCause: "Plasma torch wear or deburring incomplete", preventionControl: "Torch inspection every shift + deburring SOP", detectionControl: "Visual inspection + internal blasting verification", severity: 7, occurrence: 4, detection: 3, actionPriority: "Medium", recommendedAction: "Auto-deburring fixture", actionOwner: "Production Head", status: "Open" },
];

const NCR_TEMPLATES = [
  { ncrNumber: "NCR-2026-001", woNumber: "WO-3003", stageName: "Leak Testing with Dimension & Visual", htuno: "EL-3500-008", defectCategory: "Leakage", severity: "Major", status: "Contained", description: "Cross seam leak detected at 2 kg/cm² pressure test. Leak source: bottom side LHS seam.", containment: "Job placed on hold. Rework weld at leak point. Re-test after 4 hrs cooling.", rootCause: "Seam welding current was at lower end (18.2 kA) on Day shift - within spec but borderline.", correctiveAction: "Adjusted seam welding current to 21 kA midpoint. Re-verified 5 sample fins.", capaOwner: "S. Patil (Welding Engg)", effectivenessVerified: false },
  { ncrNumber: "NCR-2026-002", woNumber: "WO-3005", stageName: "Final product inspection", htuno: "SPTC-2100-014", defectCategory: "DFT out of spec", severity: "Major", status: "CAPA-Open", description: "Final DFT at flange backside measured 65 microns vs spec 70+210 RAL 7038 (top coat). Internal pipe DFT 180 microns (below 210).", containment: "Radiator held at final inspection. Touch-up spray applied at low DFT areas.", rootCause: "PU paint viscosity below spec (28 sec vs 30-35 sec) - thinner over-added in paint kitchen.", correctiveAction: "Paint kitchen SOP revision + dual-check on viscosity. Painter re-training.", capaOwner: "R. More (Paint Shop Head)", effectivenessVerified: false },
  { ncrNumber: "NCR-2026-003", woNumber: "WO-3005", stageName: "Assembly (Erection)", htuno: "SPTC-2100-021", defectCategory: "CC distance out", severity: "Minor", status: "Closed", description: "CC distance measured +4 mm (spec 0 to +3 mm) on SPTC 2500/2100 radiator.", containment: "Distortion control gauge applied, weld re-heated and re-aligned.", rootCause: "Gauge setting drift on Gauge-2 after bracing rod tightening sequence change.", correctiveAction: "Gauge setting checklist re-verified. Operator retrained on tightening sequence.", capaOwner: "A. Jadhav (Assembly Head)", effectivenessVerified: true },
  { ncrNumber: "NCR-2026-004", woNumber: "WO-3003", stageName: "Hot-Dip Galvanizing", htuno: "EL-3500-003", defectCategory: "Surface defect", severity: "Major", status: "Investigating", description: "Bare spot (15 mm dia) detected on top plate after HDG. Zinc coating absent at spot.", containment: "Job sent for sweep blasting + re-galvanizing of affected area.", rootCause: "Under investigation - suspected flux contamination or insufficient pre-cleaning.", correctiveAction: "Pending root cause analysis completion.", capaOwner: "M. Shaikh (HDG In-charge)", effectivenessVerified: false },
  { ncrNumber: "NCR-2026-005", woNumber: "WO-3002", stageName: "Single spot Welding", htuno: "AYR-1700-002", defectCategory: "Nugget failure", severity: "Critical", status: "CAPA-Open", description: "Pull-off test failure on 2 of 5 sample fins. Nugget separated at weld (not parent material tear).", containment: "Hold on 12 fins produced in shift A. 100% pull-off test on hold lot.", rootCause: "Electrode tip worn beyond 8 mm. Sandering frequency not maintained.", correctiveAction: "Electrode replaced. Sandering frequency increased from 2x to 3x per shift.", capaOwner: "K. Pawar (Production Head)", effectivenessVerified: false },
  { ncrNumber: "NCR-2026-006", woNumber: "WO-3005", stageName: "Spatter Cleaning", htuno: "SPTC-2100-019", defectCategory: "Spatter inside pipe", severity: "Minor", status: "Closed", description: "Spatter and welding wire inside header pipe detected at leak-stage internal cleaning check.", containment: "Re-cleaning with magnet + vacuum cleaner. Re-inspected.", rootCause: "Spatter cleaning operator skipped vacuum step on B-shift.", correctiveAction: "SOP reissue with explicit vacuum step. B-shift supervisor additional verification.", capaOwner: "V. Deshmukh", effectivenessVerified: true },
  { ncrNumber: "NCR-2026-007", woNumber: "WO-3003", stageName: "Primer Flooding", htuno: "EL-3500-011", defectCategory: "Primer peel off", severity: "Major", status: "Effectiveness-Check", description: "Peel off test failed on 3 of 5 sample areas. Primer came off in sheet form.", containment: "Primer stripped, surface re-blasted (sweep), primer re-applied.", rootCause: "Humidity 87% (max 85%) at time of primer application. Steel surface temp only 2°C above dew point.", correctiveAction: "Paint shop weather station integration + auto-hold when humidity > 85%.", capaOwner: "R. More", effectivenessVerified: false },
];

async function seed() {
  console.log("Seeding QMS database...");

  // Clear all data first (order matters for FK constraints)
  await db.inspectionRecord.deleteMany();
  await db.nonconformance.deleteMany();
  await db.fmeaRecord.deleteMany();
  await db.dailyFpy.deleteMany();
  await db.materialLot.deleteMany();
  await db.productGenealogy.deleteMany();
  await db.stageCharacteristic.deleteMany();
  await db.processStage.deleteMany();
  await db.processRoute.deleteMany();
  await db.workOrder.deleteMany();
  await db.product.deleteMany();
  await db.customer.deleteMany();
  await db.controlledDocument.deleteMany();
  await db.equipment.deleteMany();

  // Routes
  for (const r of ROUTES) {
    await db.processRoute.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { ...r },
    });
  }

  // Stages (assign to all routes for now - real system would have route-specific)
  const allRoutes = await db.processRoute.findMany();
  for (const route of allRoutes) {
    for (const s of STAGES) {
      const stage = await db.processStage.create({
        data: {
          routeId: route.id,
          seq: s.seq,
          stageCode: s.stageCode,
          name: s.name,
          department: s.department,
          workCenter: s.workCenter,
          documentRef: s.documentRef,
          responsibleRole: s.responsibleRole,
          timing: s.timing,
          reactionPlan: "Hold the job and inform the QA and production Head or Concern Engineer in shift.",
          isCTQ: s.isCTQ,
          isGate: s.isGate,
          applicability: s.applicability,
        },
      });
      // Add characteristics
      const chars = CHARACTERISTICS[s.stageCode] || [];
      for (const c of chars) {
        await db.stageCharacteristic.create({
          data: {
            stageId: stage.id,
            seq: c.seq!,
            name: c.name!,
            charType: c.charType!,
            isCTQ: c.isCTQ || false,
            specification: c.specification || null,
            unit: c.unit || null,
            method: c.method || null,
            frequency: c.frequency || null,
          },
        });
      }
    }
  }

  // Customers
  for (const c of CUSTOMERS) {
    await db.customer.upsert({
      where: { name: c.name },
      update: { country: c.country },
      create: { ...c },
    });
  }

  // Products
  for (const p of PRODUCTS) {
    await db.product.upsert({
      where: { partNo: p.partNo },
      update: { ...p },
      create: { ...p },
    });
  }

  // Work orders
  for (const w of WORK_ORDERS) {
    const product = await db.product.findUnique({ where: { partNo: w.partNo } });
    const customer = await db.customer.findUnique({ where: { name: w.customer } });
    await db.workOrder.upsert({
      where: { woNumber: w.woNumber },
      update: {},
      create: {
        woNumber: w.woNumber,
        soNumber: w.soNumber,
        customerId: customer?.id,
        customer: w.customer,
        customerPo: w.customerPo,
        productId: product?.id,
        itemName: w.itemName,
        size: w.size,
        finishType: w.finishType,
        routeCode: w.routeCode,
        plannedQty: w.plannedQty,
        completedQty: w.completedQty,
        priority: w.priority,
        status: w.status,
        materialStatus: w.materialStatus,
        salesPerson: w.salesPerson,
        plannedStart: new Date(),
        plannedEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Documents
  for (const d of DOCUMENTS) {
    await db.controlledDocument.create({
      data: {
        docNumber: d.docNumber + " " + d.revision,
        title: d.title,
        revision: d.revision,
        effectiveDate: d.effectiveDate,
        status: d.status,
        docType: d.docType,
        category: d.category,
        owner: d.owner,
      },
    });
  }

  // Equipment
  for (const e of EQUIPMENT) {
    await db.equipment.upsert({
      where: { assetCode: e.assetCode },
      update: {},
      create: { ...e },
    });
  }

  // FMEA
  for (const f of FMEA_RECORDS) {
    await db.fmeaRecord.create({
      data: {
        ...f,
        rpn: f.severity * f.occurrence * f.detection,
        lastReviewedAt: new Date(),
      } as any,
    });
  }

  // NCRs
  for (const n of NCR_TEMPLATES) {
    const wo = await db.workOrder.findUnique({ where: { woNumber: n.woNumber } });
    if (!wo) continue;
    await db.nonconformance.create({
      data: {
        ncrNumber: n.ncrNumber,
        workOrderId: wo.id,
        stageName: n.stageName,
        htuno: n.htuno,
        defectCategory: n.defectCategory,
        severity: n.severity,
        status: n.status,
        description: n.description,
        containment: n.containment,
        rootCause: n.rootCause,
        correctiveAction: n.correctiveAction,
        capaOwner: n.capaOwner,
        effectivenessVerified: n.effectivenessVerified,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Sample inspection records - generate a few per work order
  const stages = await db.processStage.findMany({ take: 10 });
  const inspectors = ["Yogesh Balate", "S. Shinde", "R. Patil", "A. Kulkarni", "M. Jadhav"];
  const operators = ["S. Pawar", "R. Deshmukh", "K. More", "A. Shaikh", "V. Patil"];
  let recCounter = 1;
  for (const wo of WORK_ORDERS) {
    const woRecord = await db.workOrder.findUnique({ where: { woNumber: wo.woNumber } });
    if (!woRecord) continue;
    // Generate 4-6 inspection records per WO spread across stages
    const numRecords = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numRecords; i++) {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const chars = await db.stageCharacteristic.findMany({ where: { stageId: stage.id } });
      const measurements: any = {};
      let allPass = true;
      let ctqFail = false;
      for (const ch of chars.slice(0, 5)) {
        const pass = Math.random() > 0.12;
        if (!pass) allPass = false;
        if (!pass && ch.isCTQ) ctqFail = true;
        measurements[ch.id] = {
          name: ch.name,
          value: pass ? "OK" : "Out of spec",
          pass,
          spec: ch.specification,
          ctq: ch.isCTQ,
        };
      }
      const result = ctqFail ? "Fail" : (allPass ? "Pass" : "Hold");
      const htuNo = wo.woNumber.replace("WO-", "").substring(0, 3) + "-" + String(100 + recCounter).padStart(3, "0");
      await db.inspectionRecord.create({
        data: {
          recordNo: `INS-2026-${String(recCounter).padStart(4, "0")}`,
          workOrderId: woRecord.id,
          stageId: stage.id,
          htuNo,
          shift: recCounter % 2 === 0 ? "A" : "B",
          inspector: inspectors[recCounter % inspectors.length],
          operator: operators[recCounter % operators.length],
          overallResult: result,
          ctqResult: ctqFail ? "Fail" : "Pass",
          measurements: JSON.stringify(measurements),
          defectsFound: result !== "Pass" ? JSON.stringify([stage.name + " - " + (ctqFail ? "CTQ fail" : "Minor deviation")]) : null,
        },
      });
      recCounter++;
    }
  }

  // Daily FPY snapshots - last 30 days for key stages
  const fpyStages = ["Rolling", "Single spot Welding", "Seam Welding", "Header Assembly", "Erection", "Leak Testing", "Hot-Dip Galvanizing", "Primer Flooding", "Final product inspection"];
  for (let d = 30; d >= 0; d--) {
    const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    for (const stage of fpyStages) {
      for (const shift of ["A", "B"]) {
        const total = 20 + Math.floor(Math.random() * 40);
        const rejected = Math.floor(Math.random() * 4);
        const rework = Math.floor(Math.random() * 5);
        const hold = Math.floor(Math.random() * 3);
        const ok = total - rejected - rework - hold;
        await db.dailyFpy.create({
          data: {
            date,
            stage,
            shift,
            totalJobs: total,
            okJobs: ok,
            holdJobs: hold,
            rejectedJobs: rejected,
            reworkJobs: rework,
          },
        });
      }
    }
  }

  // Material lots - sample
  const materialTypes = [
    { type: "CRCA sheet", spec: "IS 513 Grade D", supplier: "Tata Steel" },
    { type: "CRCA sheet", spec: "IS 513 Grade D", supplier: "JSW Steel" },
    { type: "Header Pipe (ERW)", spec: "IS 3074", supplier: "Maharashtra Seamless" },
    { type: "CCMS Welding Wire", spec: "0.8/1.2 mm", supplier: "ESAB" },
    { type: "Primer (Zinc phosphate)", spec: "Internal spec", supplier: "Akzo Nobel" },
    { type: "MIO Paint", spec: "RAL 7035", supplier: "Jotun" },
    { type: "Blasting Grit", spec: "G58 / G30", supplier: "Vishal Industries" },
    { type: "Packing Wood", spec: "IS 1364", supplier: "Local vendor" },
  ];
  for (let i = 0; i < 24; i++) {
    const m = materialTypes[i % materialTypes.length];
    const woRecord = i < WORK_ORDERS.length ? await db.workOrder.findUnique({ where: { woNumber: WORK_ORDERS[i].woNumber } }) : null;
    const statuses = ["Accepted", "Accepted", "Accepted", "Accepted", "Under Review", "Pending"];
    await db.materialLot.create({
      data: {
        lotNumber: `LOT-2026-${String(i + 1).padStart(4, "0")}`,
        grnNumber: `GRN-${1000 + i}`,
        materialType: m.type,
        supplier: m.supplier,
        spec: m.spec,
        workOrderId: woRecord?.id,
        quantity: 100 + Math.random() * 500,
        unit: m.type === "CRCA sheet" || m.type === "Packing Wood" ? "NOS" : m.type === "Header Pipe (ERW)" ? "MTR" : "KGS",
        inspectionStatus: statuses[Math.floor(Math.random() * statuses.length)],
        mtcAvailable: Math.random() > 0.2,
        inspectedBy: inspectors[i % inspectors.length],
        inspectedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Product genealogy - for completed work orders
  for (const wo of WORK_ORDERS.filter(w => w.completedQty > 0)) {
    const woRecord = await db.workOrder.findUnique({ where: { woNumber: wo.woNumber } });
    if (!woRecord) continue;
    for (let i = 0; i < Math.min(wo.completedQty, 3); i++) {
      const htuno = wo.woNumber.replace("WO-", "") + "-" + String(i + 1).padStart(3, "0");
      await db.productGenealogy.create({
        data: {
          workOrderId: woRecord.id,
          htuno,
          serialNo: i + 1,
          finCount: 25 + Math.floor(Math.random() * 15),
          sheetThickness: wo.size.includes("1.20") ? "1.20 mm" : wo.size.includes("1.00") ? "1.00 mm" : "1.20 mm",
          coilMake: ["Tata", "JSW", "POSCO"][i % 3],
          coilNumber: "COIL-" + (1000 + i),
          weldingWireBatch: "WIRE-" + (2000 + i),
          primerBatch: wo.finishType.includes("Painted") ? "PRM-" + (3000 + i) : null,
          paintBatch: wo.finishType.includes("Painted") ? "PNT-" + (4000 + i) : null,
          zincDipDate: wo.finishType.includes("HDG") ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null,
          finalDft: wo.finishType.includes("HDG") ? 70 + Math.random() * 15 : wo.finishType.includes("Painted") ? 200 + Math.random() * 50 : null,
          releaseDate: new Date(),
        },
      });
    }
  }

  console.log("Seed complete.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
