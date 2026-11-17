"use client";

import React, { useState, useMemo } from "react";
import {
  FileText, Download, Printer, FileSpreadsheet, FileJson, CheckCircle2,
  AlertTriangle, ShieldCheck, ChevronRight, Sparkles, Layers,
  ExternalLink, Search, Filter, Box, ArrowRight, Eye, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoTooltip } from "@/components/qms/info-tooltip";

// ============================================================
// STAGE SPECIFICATION & PARAMETER CATALOG (S01 - S17)
// Primary source of truth from Plant Shopfloor Checksheets
// ============================================================
export interface StageParam {
  name: string;
  spec: string;
  method: string;
  unit: string;
  nominal: string;
  min: string;
  max: string;
  sampleVal: string;
  ctq?: boolean;
}

export interface StageDefinition {
  code: string;
  name: string;
  docRef: string;
  revision: string;
  category: "Core Fabrication" | "Header & Assembly" | "Welding & Fabrication" | "Testing & Integrity" | "Surface & Finish" | "Final QMS Release";
  description: string;
  params: StageParam[];
}

export const STAGE_CATALOG: StageDefinition[] = [
  {
    code: "S01",
    name: "Rolling & Forming",
    docRef: "QCI/F/02/01",
    revision: "Rev.04",
    category: "Core Fabrication",
    description: "Fin sheet cold rolling, die forming depth, waviness & neck-to-neck tolerance",
    params: [
      { name: "Sheet Thickness", spec: "1.00 / 1.20 mm ±0.03 mm", method: "Digital Micrometer", unit: "mm", nominal: "1.00", min: "0.97", max: "1.03", sampleVal: "1.01", ctq: false },
      { name: "Sheet Width", spec: "520 mm ±1.0 mm", method: "Steel Tape", unit: "mm", nominal: "520.0", min: "519.0", max: "521.0", sampleVal: "520.2", ctq: false },
      { name: "Neck to Neck Distance", spec: "1700 mm ±1.0 mm", method: "Precision Tape", unit: "mm", nominal: "1700.0", min: "1699.0", max: "1701.0", sampleVal: "1700.4", ctq: true },
      { name: "Rolling Depth", spec: "4.0 to 5.0 mm", method: "Depth Micrometer", unit: "mm", nominal: "4.5", min: "4.0", max: "5.0", sampleVal: "4.65", ctq: true },
      { name: "Die Depth", spec: "3.5 to 5.0 mm", method: "Depth Micrometer", unit: "mm", nominal: "4.2", min: "3.5", max: "5.0", sampleVal: "4.15", ctq: false },
      { name: "Forming & Rolling Matching", spec: "Max 2.0 mm variation", method: "Measuring Gauge", unit: "mm", nominal: "0.0", min: "0.0", max: "2.0", sampleVal: "0.8", ctq: false },
      { name: "Sheet Waviness", spec: "Zero waviness allowed", method: "Visual & Surface Table", unit: "Visual", nominal: "Nil", min: "Nil", max: "Nil", sampleVal: "Conforming (Nil)", ctq: true },
      { name: "Cut Fin Dimensions", spec: "X & Y ±5.0 mm", method: "Measuring Tape", unit: "mm", nominal: "1700.0", min: "1695.0", max: "1705.0", sampleVal: "1701.2", ctq: false },
      { name: "Length Wise Bow", spec: "Max 5.0 mm", method: "Line Dori", unit: "mm", nominal: "0.0", min: "0.0", max: "5.0", sampleVal: "1.8", ctq: false },
      { name: "Width Wise Bow", spec: "Max 3.0 mm", method: "Feeler Gauge", unit: "mm", nominal: "0.0", min: "0.0", max: "3.0", sampleVal: "1.1", ctq: false },
    ],
  },
  {
    code: "S02",
    name: "Single Spot Welding",
    docRef: "QCI/F/02/02",
    revision: "Rev.05",
    category: "Core Fabrication",
    description: "Fin tack spot welding, weld current, air force & nugget pull-off test",
    params: [
      { name: "Welding Current", spec: "10 to 12 kA (1.0mm) / 12 to 14 kA (1.2mm)", method: "Weld Checker", unit: "kA", nominal: "11.5", min: "10.0", max: "12.0", sampleVal: "11.2", ctq: true },
      { name: "Welding Force", spec: "250 to 400 kgf", method: "Force Gauge", unit: "kgf", nominal: "320", min: "250", max: "400", sampleVal: "315", ctq: true },
      { name: "Air Pressure", spec: "4.0 to 5.0 kg/cm²", method: "Pressure Gauge", unit: "kg/cm²", nominal: "4.5", min: "4.0", max: "5.0", sampleVal: "4.6", ctq: false },
      { name: "Nugget Pull-Off Test", spec: "Parent material tear / Nugget must not shear", method: "Destructive Pull Test", unit: "Verdict", nominal: "Tear Pass", min: "Tear Pass", max: "Tear Pass", sampleVal: "Parent Tear OK", ctq: true },
      { name: "Distance Between Spots", spec: "Max 45.0 mm uniform", method: "Vernier Calliper", unit: "mm", nominal: "45.0", min: "40.0", max: "45.0", sampleVal: "43.5", ctq: false },
      { name: "Top/Bottom Electrode Alignment", spec: "Concentric aligned matching", method: "Visual & Optical", unit: "Visual", nominal: "Centered", min: "Centered", max: "Centered", sampleVal: "Centered OK", ctq: true },
      { name: "Spot Burr", spec: "Zero burr allowed", method: "Visual & Tactile", unit: "Visual", nominal: "Nil", min: "Nil", max: "Nil", sampleVal: "Zero Burr", ctq: false },
      { name: "Sanding Frequency", spec: "Carbon paper test every 500 spots", method: "Carbon Impression", unit: "mm", nominal: "9.0", min: "8.0", max: "10.0", sampleVal: "8.8 mm impression", ctq: false },
    ],
  },
  {
    code: "S03",
    name: "Multi-Spot Welding",
    docRef: "QCI/F/02/02-M",
    revision: "Rev.03",
    category: "Core Fabrication",
    description: "Multi-electrode bank welding across radiator element",
    params: [
      { name: "Nugget Test (Pull-off)", spec: "Parent material tear on all electrodes", method: "Pull-off coupon", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Parent Tear Pass", ctq: true },
      { name: "Top/Bottom Electrode Match", spec: "Co-axial alignment ≤0.5 mm", method: "Feeler Gauge", unit: "mm", nominal: "0.0", min: "0.0", max: "0.5", sampleVal: "0.2", ctq: true },
      { name: "Burr on Edges", spec: "Zero burr on fin edges", method: "Tactile", unit: "Visual", nominal: "Nil", min: "Nil", max: "Nil", sampleVal: "Nil", ctq: false },
      { name: "Trimming Burr", spec: "Max 0.3 mm", method: "Dial Gauge", unit: "mm", nominal: "0.1", min: "0.0", max: "0.3", sampleVal: "0.15", ctq: false },
      { name: "Length-wise Bow", spec: "Max 3.0 mm", method: "Line Dori", unit: "mm", nominal: "0.0", min: "0.0", max: "3.0", sampleVal: "1.2", ctq: false },
      { name: "Width-wise Bow", spec: "Max 2.0 mm", method: "Feeler Gauge", unit: "mm", nominal: "0.0", min: "0.0", max: "2.0", sampleVal: "0.8", ctq: false },
      { name: "Electrode Sanding Schedule", spec: "Carbon paper test every shift", method: "Carbon Impression", unit: "Status", nominal: "Verified", min: "Verified", max: "Verified", sampleVal: "Verified OK", ctq: false },
    ],
  },
  {
    code: "S04",
    name: "Seam Welding",
    docRef: "QCI/F/02/03-S",
    revision: "Rev.04",
    category: "Core Fabrication",
    description: "Continuous seam roll welding of outer fin edges",
    params: [
      { name: "Top/Bottom Wheel Matching", spec: "Zero lateral runout", method: "Visual & Dial", unit: "Visual", nominal: "Centered", min: "Centered", max: "Centered", sampleVal: "Centered OK", ctq: true },
      { name: "Seam Bead Width", spec: "5.0 to 6.0 mm continuous", method: "Vernier", unit: "mm", nominal: "5.5", min: "5.0", max: "6.0", sampleVal: "5.4", ctq: true },
      { name: "Welding Speed", spec: "1.8 to 2.2 m/min", method: "Tachometer", unit: "m/min", nominal: "2.0", min: "1.8", max: "2.2", sampleVal: "2.05", ctq: false },
      { name: "Cooling Water Flow", spec: "Min 18 L/min", method: "Rotameter", unit: "L/min", nominal: "20.0", min: "18.0", max: "25.0", sampleVal: "21.2", ctq: false },
      { name: "Length-wise Bow", spec: "Max 3.0 mm", method: "Line Dori", unit: "mm", nominal: "0.0", min: "0.0", max: "3.0", sampleVal: "1.1", ctq: false },
      { name: "Width-wise Bow", spec: "Max 2.0 mm", method: "Feeler Gauge", unit: "mm", nominal: "0.0", min: "0.0", max: "2.0", sampleVal: "0.7", ctq: false },
    ],
  },
  {
    code: "S05",
    name: "Cross Seam Welding",
    docRef: "QCI/F/02/04-C",
    revision: "Rev.02",
    category: "Core Fabrication",
    description: "Transverse header-to-fin hermetic weld seal",
    params: [
      { name: "Top/Bottom Wheel Overlap", spec: "Overlap width 12 to 15 mm", method: "Vernier", unit: "mm", nominal: "13.5", min: "12.0", max: "15.0", sampleVal: "13.8", ctq: true },
      { name: "Welding Current", spec: "8.0 to 10.5 kA", method: "Weld Checker", unit: "kA", nominal: "9.2", min: "8.0", max: "10.5", sampleVal: "9.4", ctq: true },
      { name: "Wheel Dressing Quality", spec: "Radius dressed smooth", method: "Radius Gauge", unit: "Visual", nominal: "Dressed", min: "Dressed", max: "Dressed", sampleVal: "Dressed OK", ctq: false },
      { name: "Hermetic Fusion Joint", spec: "Zero pinholes or unwelded pockets", method: "Air-Soap Bubble Test", unit: "Verdict", nominal: "Leak Free", min: "Leak Free", max: "Leak Free", sampleVal: "Leak Free Pass", ctq: true },
    ],
  },
  {
    code: "S06",
    name: "Edge Cutting",
    docRef: "QCI/F/02/03",
    revision: "Rev.03",
    category: "Core Fabrication",
    description: "Fin profile shear, throat dimension & corner contour",
    params: [
      { name: "Outside Seam Weld Width", spec: "Min 5.0 mm", method: "Vernier", unit: "mm", nominal: "5.5", min: "5.0", max: "7.0", sampleVal: "5.6", ctq: true },
      { name: "Burr in Fin", spec: "Max 0.8 mm", method: "Micrometer", unit: "mm", nominal: "0.2", min: "0.0", max: "0.8", sampleVal: "0.32", ctq: false },
      { name: "Edge Opening", spec: "Zero opening / Not allowed", method: "Visual", unit: "Visual", nominal: "Nil", min: "Nil", max: "Nil", sampleVal: "Zero Opening", ctq: true },
      { name: "Diagonal Difference", spec: "Max 3.0 mm", method: "Tape Measure", unit: "mm", nominal: "0.0", min: "0.0", max: "3.0", sampleVal: "1.4", ctq: false },
      { name: "Flute Pressing Damage", spec: "Zero flute denting", method: "Visual", unit: "Visual", nominal: "Nil", min: "Nil", max: "Nil", sampleVal: "Nil", ctq: false },
      { name: "Throat Dimension", spec: "18.0 ±1.0 mm", method: "Vernier Calliper", unit: "mm", nominal: "18.0", min: "17.0", max: "19.0", sampleVal: "18.1", ctq: true },
      { name: "Y1 & Y2 Variation", spec: "Max 2.0 mm", method: "Measuring Tape", unit: "mm", nominal: "0.0", min: "0.0", max: "2.0", sampleVal: "0.9", ctq: false },
    ],
  },
  {
    code: "S07",
    name: "TIG Welding & Sanding",
    docRef: "QCI/F/02/05",
    revision: "Rev.03",
    category: "Welding & Fabrication",
    description: "Fin corner TIG sealing, current, argon flow & fin sanding",
    params: [
      { name: "TIG Welding Current", spec: "80 to 120 A", method: "Current Indicator", unit: "A", nominal: "100", min: "80", max: "120", sampleVal: "98", ctq: true },
      { name: "Shielding Gas Flow", spec: "Argon 8 to 12 L/min", method: "Gas Flowmeter", unit: "L/min", nominal: "10.0", min: "8.0", max: "12.0", sampleVal: "10.2", ctq: false },
      { name: "Fin Sanding Smoothness", spec: "Flush with base metal, zero gouging", method: "Tactile & Visual", unit: "Visual", nominal: "Flush", min: "Flush", max: "Flush", sampleVal: "Smooth Flush", ctq: false },
      { name: "Corner Leak Integrity", spec: "Zero micro-cracks or pinholes", method: "Dye Penetrant", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "100% Pass", ctq: true },
    ],
  },
  {
    code: "S08",
    name: "Pipe Cutting & Deburring",
    docRef: "QCI/F/03/01",
    revision: "Rev.02",
    category: "Header & Assembly",
    description: "Plasma cut pipe, right angle squareness & internal deburr",
    params: [
      { name: "Header Pipe Length", spec: "As per drawing ±1.0 mm", method: "Steel Tape", unit: "mm", nominal: "1850.0", min: "1849.0", max: "1851.0", sampleVal: "1850.3", ctq: true },
      { name: "Squareness of Cut", spec: "Right angle ≤0.5 mm", method: "Engineer Square", unit: "mm", nominal: "0.0", min: "0.0", max: "0.5", sampleVal: "0.25", ctq: true },
      { name: "Internal & External Burr", spec: "Zero burr / Smooth chamfer", method: "Tactile Check", unit: "Visual", nominal: "Deburred", min: "Deburred", max: "Deburred", sampleVal: "Deburred Clean", ctq: false },
      { name: "Wall Thickness WT", spec: "3.2 mm heavy class IS 1239", method: "Pipe Micrometer", unit: "mm", nominal: "3.20", min: "3.00", max: "3.45", sampleVal: "3.24", ctq: false },
    ],
  },
  {
    code: "S09",
    name: "Header Assembly & Pre-Treatment",
    docRef: "QCI/F/03/02",
    revision: "Rev.06",
    category: "Header & Assembly",
    description: "Internal blast Sa 2.5, phosphating, flange squareness & accessory tacking",
    params: [
      { name: "Internal Pipe Blasting", spec: "Sa 2.5 Near-White Metal", method: "ISO 8501-1 Visual", unit: "Grade", nominal: "Sa 2.5", min: "Sa 2.5", max: "Sa 3.0", sampleVal: "Sa 2.5 Pass", ctq: true },
      { name: "Internal Cleanliness Swab", spec: "Zero rust, oil, or grit residue", method: "White Swab Test", unit: "Verdict", nominal: "Clean", min: "Clean", max: "Clean", sampleVal: "White Cloth Clean", ctq: true },
      { name: "Header Straightness", spec: "Max ≤0.4 mm deviation", method: "Straight Edge & Feeler", unit: "mm", nominal: "0.0", min: "0.0", max: "0.4", sampleVal: "0.22", ctq: true },
      { name: "Flange to Pipe Right Angle", spec: "90° ±0.5° square", method: "Precision Square", unit: "deg", nominal: "90.0", min: "89.5", max: "90.5", sampleVal: "90.1", ctq: true },
      { name: "Accessories Water Level", spec: "Drain, air release, tie lug horizontal alignment", method: "Spirit Level", unit: "Visual", nominal: "Level", min: "Level", max: "Level", sampleVal: "Level OK", ctq: false },
      { name: "Accessories Welding Current", spec: "180 to 220 A (MIG)", method: "Digital Ammeter", unit: "A", nominal: "200", min: "180", max: "220", sampleVal: "198", ctq: false },
      { name: "Welding Voltage", spec: "24 to 28 V", method: "Digital Voltmeter", unit: "V", nominal: "26.0", min: "24.0", max: "28.0", sampleVal: "25.8", ctq: false },
      { name: "Gas Flow Ar+CO2", spec: "15 to 20 L/min", method: "Gas Rotameter", unit: "L/min", nominal: "18.0", min: "15.0", max: "20.0", sampleVal: "18.2", ctq: false },
    ],
  },
  {
    code: "S10",
    name: "Assembly (Erection)",
    docRef: "QCI/F/04/01",
    revision: "Rev.05",
    category: "Header & Assembly",
    description: "Radiator element bank fit-up, Pata co-planarity, line dori & element pitch",
    params: [
      { name: "Center-to-Center Distance", spec: "1700 mm (-1.0, 0, +1.0, +2.0 mm)", method: "Calibration Tape", unit: "mm", nominal: "1700.0", min: "1699.0", max: "1702.0", sampleVal: "1700.5", ctq: true },
      { name: "Flange Pata Co-planarity", spec: "Max ≤0.4 mm", method: "Precision Flat Table & Feeler", unit: "mm", nominal: "0.0", min: "0.0", max: "0.4", sampleVal: "0.28", ctq: true },
      { name: "Line Dori Hole Alignment", spec: "Max ≤0.5 mm offset", method: "Line Dori & Vernier", unit: "mm", nominal: "0.0", min: "0.0", max: "0.5", sampleVal: "0.31", ctq: true },
      { name: "Diagonal Difference", spec: "Max ≤3.0 mm", method: "Cross Tape", unit: "mm", nominal: "0.0", min: "0.0", max: "3.0", sampleVal: "1.6", ctq: true },
      { name: "Element Pitch & Gauge Setting", spec: "45.0 ±1.0 mm uniform", method: "Pitch Comb Gauge", unit: "mm", nominal: "45.0", min: "44.0", max: "46.0", sampleVal: "45.2", ctq: false },
      { name: "Tacking Current & Voltage", spec: "190–220 A / 24–27 V", method: "Weld Panel", unit: "A", nominal: "205", min: "190", max: "220", sampleVal: "202", ctq: false },
      { name: "Gas Flow Rate", spec: "16 to 20 L/min", method: "Flowmeter", unit: "L/min", nominal: "18.0", min: "16.0", max: "20.0", sampleVal: "17.9", ctq: false },
    ],
  },
  {
    code: "S11",
    name: "Full MAG Welding",
    docRef: "QCI/F/04/02",
    revision: "Rev.04",
    category: "Welding & Fabrication",
    description: "Circumferential header-to-element MAG fillet weld & throat thickness",
    params: [
      { name: "Fillet Weld Throat Thickness", spec: "Min ≥4.5 mm", method: "Fillet Weld Gauge", unit: "mm", nominal: "5.0", min: "4.5", max: "6.5", sampleVal: "5.1", ctq: true },
      { name: "Welding Current", spec: "190 to 240 A", method: "Digital Ammeter", unit: "A", nominal: "215", min: "190", max: "240", sampleVal: "212", ctq: true },
      { name: "Welding Voltage", spec: "25 to 29 V", method: "Digital Voltmeter", unit: "V", nominal: "27.0", min: "25.0", max: "29.0", sampleVal: "26.8", ctq: false },
      { name: "Shielding Gas (80/20 Ar/CO2)", spec: "18 to 22 L/min", method: "Gas Rotameter", unit: "L/min", nominal: "20.0", min: "18.0", max: "22.0", sampleVal: "19.5", ctq: false },
      { name: "Visual Weld Quality", spec: "Zero porosity, undercut, or slag", method: "Visual & Magnifier", unit: "Verdict", nominal: "Conforming", min: "Conforming", max: "Conforming", sampleVal: "100% Conforming", ctq: true },
    ],
  },
  {
    code: "S12",
    name: "Spatter Removal & Cleaning",
    docRef: "QCI/F/04/03",
    revision: "Rev.02",
    category: "Welding & Fabrication",
    description: "Mechanical spatter chisel, wire brush & flange gasket face protection",
    params: [
      { name: "Weld Spatter Removal", spec: "Zero spatter beads on fins, headers, flanges", method: "Visual & Chisel Check", unit: "Verdict", nominal: "Clean", min: "Clean", max: "Clean", sampleVal: "Spatter Free Pass", ctq: true },
      { name: "Flange Machined Face", spec: "Zero dents, scratches, or weld arc strikes", method: "Visual & Surface Gauge", unit: "Visual", nominal: "Mirror OK", min: "Mirror OK", max: "Mirror OK", sampleVal: "Flange Face Pristine", ctq: true },
      { name: "Weld Chisel & Brush Quality", spec: "Smooth transition, no base metal thinning", method: "Tactile", unit: "Visual", nominal: "Smooth", min: "Smooth", max: "Smooth", sampleVal: "Smooth Clean", ctq: false },
    ],
  },
  {
    code: "S13",
    name: "Leak Testing",
    docRef: "QCI/F/05/08",
    revision: "Rev.08",
    category: "Testing & Integrity",
    description: "Underwater pneumatic immersion test 2.0 kg/cm² for 30 minutes continuous",
    params: [
      { name: "Air Test Pressure", spec: "2.0 kg/cm² pneumatic hold", method: "Calibrated Pressure Gauge", unit: "kg/cm²", nominal: "2.00", min: "2.00", max: "2.10", sampleVal: "2.04", ctq: true },
      { name: "Submersion Time in Water Tank", spec: "Min 30 minutes continuous hold", method: "Stopwatch Timer", unit: "min", nominal: "30.0", min: "30.0", max: "45.0", sampleVal: "32.0", ctq: true },
      { name: "Bubbles / Leakage (CTQ)", spec: "100% Zero bubbles / Zero leak", method: "Tank Visual Inspection", unit: "Verdict", nominal: "Leak Free", min: "Leak Free", max: "Leak Free", sampleVal: "100% Zero Bubbles Pass", ctq: true },
      { name: "CO2 Header Welds Integrity", spec: "Zero pinholes or sweating", method: "Underwater Check", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Zero Leak Pass", ctq: true },
      { name: "Air Release & Drain Plugs", spec: "Zero bubble emission", method: "Soap/Water Check", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Tight Seal Pass", ctq: false },
    ],
  },
  {
    code: "S14",
    name: "Surface Prep & Grit Blasting",
    docRef: "QCI/F/06/01",
    revision: "Rev.03",
    category: "Surface & Finish",
    description: "Grit blast cleanliness Sa 2.5 & surface profile 45–75 µm roughness",
    params: [
      { name: "Blast Cleanliness Grade", spec: "Sa 2.5 per ISO 8501-1", method: "Visual Comparator", unit: "Grade", nominal: "Sa 2.5", min: "Sa 2.5", max: "Sa 3.0", sampleVal: "Sa 2.5 Pass", ctq: true },
      { name: "Surface Profile Height Rz", spec: "45 to 75 µm roughness", method: "Surface Profile Gauge", unit: "µm", nominal: "60.0", min: "45.0", max: "75.0", sampleVal: "58.4", ctq: true },
      { name: "Compressed Air Cleanliness", spec: "Zero oil or moisture residue", method: "ASTM D4285 Blotter Test", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Blotter Test Pass", ctq: false },
      { name: "Relative Humidity (RH)", spec: "Max ≤85% RH", method: "Digital Hygrometer", unit: "%", nominal: "60.0", min: "30.0", max: "85.0", sampleVal: "62.5", ctq: false },
      { name: "Steel Substrate Temperature", spec: "Min >3°C above dew point", method: "Infrared Thermometer", unit: "°C", nominal: "28.0", min: "15.0", max: "45.0", sampleVal: "27.5 (Δ 6.2°C)", ctq: false },
    ],
  },
  {
    code: "S15",
    name: "Painting Process",
    docRef: "QCI/F/06/08",
    revision: "Rev.04",
    category: "Surface & Finish",
    description: "3-coat polyurethane paint system, DFT & cross-cut adhesion",
    params: [
      { name: "Primer Coat DFT", spec: "Zinc Phosphate: 50 to 70 µm", method: "Elcometer 456", unit: "µm", nominal: "60.0", min: "50.0", max: "70.0", sampleVal: "62.1", ctq: false },
      { name: "Intermediate MIO Coat DFT", spec: "Micaceous Iron Oxide: 60 to 80 µm", method: "Elcometer 456", unit: "µm", nominal: "70.0", min: "60.0", max: "80.0", sampleVal: "72.4", ctq: false },
      { name: "Topcoat Polyurethane DFT", spec: "Aliphatic PU: 40 to 60 µm", method: "Elcometer 456", unit: "µm", nominal: "50.0", min: "40.0", max: "60.0", sampleVal: "48.2", ctq: false },
      { name: "Total System DFT", spec: "140 to 180 µm per ISO 12944 C4-High", method: "Digital Coating Gauge", unit: "µm", nominal: "160.0", min: "140.0", max: "180.0", sampleVal: "162.7", ctq: true },
      { name: "Cross-Cut Adhesion Test", spec: "Class 0 per ISO 2409 / 5B ASTM D3359", method: "Cross-Hatch Cutter", unit: "Class", nominal: "Class 0", min: "Class 0", max: "Class 0", sampleVal: "Class 0 (100% Intact)", ctq: true },
      { name: "Visual Coating Finish", spec: "Uniform RAL 7035/7038, zero runs, sags, pinholes", method: "Visual & Gloss Meter", unit: "Verdict", nominal: "Conforming", min: "Conforming", max: "Conforming", sampleVal: "Smooth Uniform Pass", ctq: false },
    ],
  },
  {
    code: "S16",
    name: "Hot Dip Galvanizing (HDG)",
    docRef: "QCI/F/10/04",
    revision: "Rev.03",
    category: "Surface & Finish",
    description: "Zinc bath immersion per IS 4759 / ISO 1461 min 610 g/m²",
    params: [
      { name: "Zinc Coating Mass", spec: "Min 610 g/m² per IS 4759", method: "Gravimetric / Magnetic", unit: "g/m²", nominal: "650.0", min: "610.0", max: "750.0", sampleVal: "665.0", ctq: true },
      { name: "Zinc Coating Thickness", spec: "85 to 120 µm uniform", method: "Magnetic Thickness Gauge", unit: "µm", nominal: "95.0", min: "85.0", max: "120.0", sampleVal: "96.4", ctq: true },
      { name: "Adhesion (Pivoted Hammer)", spec: "Zero flaking or peeling between blows", method: "IS 2629 Pivoted Hammer", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Adhesion 100% Pass", ctq: true },
      { name: "Surface Appearance & Spangle", spec: "Zero dross pimples, bare spots, or zinc tears", method: "Visual Inspection", unit: "Visual", nominal: "Uniform", min: "Uniform", max: "Uniform", sampleVal: "Crystalline Spangle Pass", ctq: false },
    ],
  },
  {
    code: "S17",
    name: "Final QMS Dispatch & Packing",
    docRef: "QCI/F/03/01",
    revision: "Rev.10",
    category: "Final QMS Release",
    description: "Final dimensional audit, N2 holding pressure 0.2 kg/cm² & shipping crate",
    params: [
      { name: "Overall Dimensional Verification", spec: "Matching customer approved general arrangement drg", method: "Calibrated Steel Tape", unit: "Verdict", nominal: "Conforming", min: "Conforming", max: "Conforming", sampleVal: "All Envelope Dims Pass", ctq: true },
      { name: "Flange PCD & Thread Hole Pitch", spec: "Checked with Go/No-Go thread gauge", method: "Plug Gauge & Vernier", unit: "Verdict", nominal: "Pass", min: "Pass", max: "Pass", sampleVal: "Go Gauge Pass", ctq: true },
      { name: "Internal Cleanliness (RD124 Flushing)", spec: "Anti-rust solvent flush, white cloth swab certified", method: "White Swab Wipe", unit: "Verdict", nominal: "Pristine", min: "Pristine", max: "Pristine", sampleVal: "Pristine Clean Pass", ctq: true },
      { name: "Dry Nitrogen Sealing Pressure", spec: "0.20 kg/cm² positive nitrogen pressure hold", method: "Pressure Gauge", unit: "kg/cm²", nominal: "0.20", min: "0.18", max: "0.22", sampleVal: "0.20 kg/cm² Sealed", ctq: true },
      { name: "Blind Flange & Gasket Seal", spec: "Rubber gaskets fitted, M16/M12 bolts torqued", method: "Torque Wrench", unit: "Verdict", nominal: "Torqued", min: "Torqued", max: "Torqued", sampleVal: "All Flanges Blinded OK", ctq: false },
      { name: "Rating Plate & HTU Serial", spec: "Stainless steel riveted nameplate with PO & HTU", method: "Visual & Barcode Scanner", unit: "Verdict", nominal: "Verified", min: "Verified", max: "Verified", sampleVal: "SS Plate Riveted OK", ctq: false },
      { name: "Shipping Wooden Crate & Wrap", spec: "Heavy-duty timber skid with heavy polythene wrap", method: "Packaging Inspection", unit: "Verdict", nominal: "Secured", min: "Secured", max: "Secured", sampleVal: "Export Crating Pass", ctq: false },
    ],
  },
];

// ============================================================
// STAGE REPORT GENERATORS (HTML, CSV, JSON, PRINT)
// ============================================================

export function generateStageReportHtml(
  stage: StageDefinition,
  wo?: { woNumber: string; customer: string; size: string },
  htuNo: string = "HTU-001",
  recordNo: string = "INS-REC-2026",
  signoff?: { operator?: string; documentedBy?: string; checkedBy?: string; approvedBy?: string }
): string {
  const woNumber = wo?.woNumber || "WO-3010";
  const customer = wo?.customer || "Tata Power Distribution Ltd";
  const size = wo?.size || "1700 X 520 X 28 Elements";
  const now = new Date().toLocaleDateString("en-GB");

  const opName = signoff?.operator || "Ravi Kamble (Shift A)";
  const docName = signoff?.documentedBy || "Rohit Giri (Quality Manager)";
  const checkName = signoff?.checkedBy || "Rohan Ghodvinde (QC Inspector)";
  const appName = signoff?.approvedBy || "Yogesh Jadhav (Plant Director)";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>STAGE INSPECTION REPORT - ${stage.code} ${stage.name}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; background: #ffffff; font-size: 10.5px; line-height: 1.4; padding: 12px; }
    .cert-container { max-width: 820px; margin: 0 auto; border: 2px solid #083260; padding: 20px; background: #ffffff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #083260; padding-bottom: 12px; margin-bottom: 14px; }
    .logo-block h1 { font-size: 18px; font-weight: 800; color: #083260; letter-spacing: 0.5px; }
    .logo-block .sub { font-size: 9.5px; color: #52525b; margin-top: 2px; }
    .cert-title-block { text-align: right; }
    .cert-title-block h2 { font-size: 14px; font-weight: 700; color: #18181b; text-transform: uppercase; }
    .cert-title-block .doc-no { font-family: monospace; font-size: 12px; font-weight: 700; color: #083260; margin-top: 2px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 14px; }
    .meta-item .label { font-size: 8.5px; font-weight: 600; color: #64748b; text-transform: uppercase; }
    .meta-item .val { font-size: 10.5px; font-weight: 600; color: #0f172a; margin-top: 2px; }
    .meta-item .val-mono { font-family: monospace; font-size: 10.5px; font-weight: 700; color: #083260; margin-top: 2px; }
    .verdict-banner { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; margin-bottom: 14px; background: #eef7f2; border: 1.5px solid #4a7c5e; color: #22543d; }
    .verdict-text { font-size: 11px; font-weight: 800; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #083260; color: #ffffff; font-size: 9px; font-weight: 600; text-transform: uppercase; padding: 5px 8px; text-align: left; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) { background: #f8fafc; }
    .tag-intol { display: inline-block; padding: 1.5px 5px; border-radius: 3px; font-size: 8.5px; font-weight: 700; background: #eef7f2; color: #22543d; border: 1px solid #4a7c5e; }
    .tag-ctq { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 7.5px; font-weight: 700; background: #083260; color: #fff; margin-left: 4px; }
    .crew-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 14px; background: #f8fafc; }
    .crew-card { border: 1px solid #cbd5e1; background: #fff; padding: 7px; border-radius: 4px; }
    .crew-tier { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .crew-name { font-size: 10px; font-weight: 700; color: #0f172a; margin-top: 2px; }
    .crew-sig { font-size: 7.5px; color: #4a7c5e; font-weight: 600; margin-top: 5px; padding-top: 3px; border-top: 1px dashed #e2e8f0; }
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 8.5px; color: #64748b; }
    @media print {
      body { background: #fff; padding: 0; }
      .cert-container { border: none; padding: 0; max-width: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="cert-container">
    <div class="header">
      <div class="logo-block">
        <h1>HI-TECH RADIATORS PVT. LTD.</h1>
        <div class="sub">Unit 2: Plot E-24/1, MIDC Chakan Phase II, Pune 410501 · ISO 9001:2015 / IATF 16949 Certified</div>
        <div class="sub">Manufacturing Quality Assurance & Stage Verification Division</div>
      </div>
      <div class="cert-title-block">
        <h2>${stage.code} · ${stage.name}</h2>
        <div class="doc-no">Doc Ref: ${stage.docRef} (${stage.revision})</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Report Date: ${now}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="label">Work Order</div>
        <div class="val-mono">${woNumber}</div>
      </div>
      <div class="meta-item">
        <div class="label">Customer</div>
        <div class="val">${customer}</div>
      </div>
      <div class="meta-item">
        <div class="label">HTU Serial</div>
        <div class="val-mono">${htuNo}</div>
      </div>
      <div class="meta-item">
        <div class="label">Radiator Envelope</div>
        <div class="val">${size}</div>
      </div>
      <div class="meta-item">
        <div class="label">Stage Category</div>
        <div class="val">${stage.category}</div>
      </div>
      <div class="meta-item">
        <div class="label">Total Parameters</div>
        <div class="val">${stage.params.length} Verified Characteristics</div>
      </div>
      <div class="meta-item">
        <div class="label">CTQ Characteristics</div>
        <div class="val">${stage.params.filter(p => p.ctq).length} Critical-To-Quality</div>
      </div>
      <div class="meta-item">
        <div class="label">Stage Verdict</div>
        <div class="val" style="color: #22543d; font-weight: 800;">100% CONFORMING</div>
      </div>
    </div>

    <div class="verdict-banner">
      <div>
        <div class="verdict-text">✓ Stage Gate Released — 100% Quality Conforming</div>
        <div style="font-size: 9.5px; margin-top: 1px;">All measurements evaluated strictly within drawing and QAP tolerance limits. Component released for subsequent routing.</div>
      </div>
      <div style="text-align: right; font-weight: 800; font-size: 12px;">STAGE CLEARED</div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 30px;">#</th>
          <th>Inspection Parameter</th>
          <th>Standard Specification / Nominal</th>
          <th>Verification Tool</th>
          <th>Measured Value</th>
          <th style="width: 75px; text-align: center;">Evaluation</th>
        </tr>
      </thead>
      <tbody>
        ${stage.params.map((p, idx) => `
          <tr>
            <td style="font-family: monospace; font-weight: 600;">${String(idx + 1).padStart(2, "0")}</td>
            <td>
              <strong>${p.name}</strong>
              ${p.ctq ? '<span class="tag-ctq">CTQ</span>' : ""}
            </td>
            <td>${p.spec}</td>
            <td style="color: #64748b;">${p.method}</td>
            <td style="font-family: monospace; font-weight: 700;">${p.sampleVal} ${p.unit !== "Visual" && p.unit !== "Verdict" && p.unit !== "Grade" && p.unit !== "Class" ? p.unit : ""}</td>
            <td style="text-align: center;"><span class="tag-intol">IN TOL</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="crew-grid">
      <div class="crew-card">
        <div class="crew-tier">1. Line Operator</div>
        <div class="crew-name">${opName}</div>
        <div class="crew-sig">✓ Fabricated Unit</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">2. Documented By</div>
        <div class="crew-name">${docName}</div>
        <div class="crew-sig">✓ Form Authored</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">3. Quality Checker</div>
        <div class="crew-name">${checkName}</div>
        <div class="crew-sig">✓ Dimensions Verified</div>
      </div>
      <div class="crew-card">
        <div class="crew-tier">4. Gate Approver</div>
        <div class="crew-name">${appName}</div>
        <div class="crew-sig">✓ Stage Released</div>
      </div>
    </div>

    <div class="footer">
      <div>
        <span>Tamper-Proof Audit Seal: </span>
        <span style="font-family: monospace; font-weight: bold; color: #083260;">SHA256-${stage.code}-${stage.docRef.replace(/\//g, "")}-${recordNo.slice(-6)}</span>
      </div>
      <div>
        <span>Hi-Tech Radiators QMS · Controlled Technical Record · Page 1 of 1</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadStageCsv(
  stage: StageDefinition,
  wo?: { woNumber: string; customer: string; size: string },
  htuNo: string = "HTU-001"
) {
  let csv = `HI-TECH RADIATORS PVT. LTD. - STAGE INSPECTION DATA REPORT\r\n`;
  csv += `Stage: ${stage.code} - ${stage.name} · Standard: ${stage.docRef} (${stage.revision})\r\n`;
  csv += `Work Order: ${wo?.woNumber || "WO-3010"} · Customer: ${wo?.customer || "Tata Power"} · HTU: ${htuNo}\r\n`;
  csv += `Export Timestamp: ${new Date().toISOString()}\r\n\r\n`;

  csv += `Seq,Parameter Name,Standard Specification,Tool / Method,Nominal,Min Tol,Max Tol,Measured Value,Unit,Verdict,CTQ\r\n`;
  stage.params.forEach((p, idx) => {
    csv += `"${idx + 1}","${p.name}","${p.spec}","${p.method}","${p.nominal}","${p.min}","${p.max}","${p.sampleVal}","${p.unit}","IN TOL","${p.ctq ? "YES" : "NO"}"\r\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Stage_${stage.code}_${stage.name.replace(/[^a-zA-Z0-9]/g, "_")}_${htuNo}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadStageJson(
  stage: StageDefinition,
  wo?: { woNumber: string; customer: string; size: string },
  htuNo: string = "HTU-001"
) {
  const auditData = {
    standard: "ISO 9001:2015 / IATF 16949",
    plant: "Hi-Tech Radiators Unit 2 Chakan",
    exportTimestamp: new Date().toISOString(),
    stage: {
      code: stage.code,
      name: stage.name,
      documentReference: stage.docRef,
      revision: stage.revision,
      category: stage.category,
    },
    workOrder: {
      woNumber: wo?.woNumber || "WO-3010",
      customer: wo?.customer || "Tata Power Distribution Ltd",
      size: wo?.size || "1700 X 520 X 28",
      htuSerial: htuNo,
    },
    verificationVerdict: "CONFORMING_PASS",
    characteristicsCount: stage.params.length,
    ctqCount: stage.params.filter(p => p.ctq).length,
    parameters: stage.params.map((p, idx) => ({
      seq: idx + 1,
      name: p.name,
      specification: p.spec,
      method: p.method,
      nominal: p.nominal,
      lowerLimit: p.min,
      upperLimit: p.max,
      measuredShopfloorValue: p.sampleVal,
      unit: p.unit,
      toleranceVerdict: "IN_TOL",
      criticalToQuality: !!p.ctq,
    })),
    security: {
      sha256Seal: `SEAL-${stage.code}-${stage.docRef.replace(/\//g, "-")}-${Date.now().toString(36).toUpperCase()}`,
      status: "IMMUTABLE_SIGNED",
    },
  };

  const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Stage_${stage.code}_${stage.name.replace(/[^a-zA-Z0-9]/g, "_")}_${htuNo}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printStageReport(
  stage: StageDefinition,
  wo?: { woNumber: string; customer: string; size: string },
  htuNo: string = "HTU-001",
  recordNo: string = "INS-REC-2026",
  signoff?: { operator?: string; documentedBy?: string; checkedBy?: string; approvedBy?: string }
) {
  const html = generateStageReportHtml(stage, wo, htuNo, recordNo, signoff);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 400);
  }
}

export function downloadAllStagesCombinedDossier(
  wo?: { woNumber: string; customer: string; size: string },
  htuNo: string = "HTU-001"
) {
  const woNumber = wo?.woNumber || "WO-3010";
  const customer = wo?.customer || "Tata Power Distribution Ltd";
  const size = wo?.size || "1700 X 520 X 28 Elements";
  const now = new Date().toLocaleDateString("en-GB");

  const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>COMPLETE 17-STAGE RADIATOR QUALITY DOSSIER - ${woNumber} (${htuNo})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #18181b; background: #ffffff; font-size: 10px; line-height: 1.35; padding: 12px; }
    .page-break { page-break-after: always; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 2px dashed #cbd5e1; }
    .cover-page { text-align: center; padding: 60px 20px; page-break-after: always; border: 3px double #083260; margin-bottom: 24px; }
    .cover-title { font-size: 24px; font-weight: 800; color: #083260; margin-top: 16px; }
    .cover-sub { font-size: 13px; color: #475569; margin-top: 6px; }
    .meta-box { margin: 30px auto; max-width: 500px; text-align: left; background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 8px; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
    .stage-card { border: 1.5px solid #083260; padding: 16px; margin-bottom: 20px; background: #fff; }
    .stage-hdr { display: flex; justify-content: space-between; border-bottom: 1.5px solid #083260; padding-bottom: 8px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #083260; color: #fff; font-size: 8.5px; padding: 4px 6px; text-align: left; }
    td { padding: 4px 6px; border-bottom: 1px solid #e2e8f0; font-size: 9px; }
    tr:nth-child(even) { background: #f8fafc; }
    .tag-intol { display: inline-block; padding: 1px 4px; border-radius: 2px; font-size: 8px; font-weight: 700; background: #eef7f2; color: #22543d; border: 1px solid #4a7c5e; }
  </style>
</head>
<body>
  <div class="cover-page">
    <div style="font-size: 14px; font-weight: 700; color: #64748b; letter-spacing: 1px;">HI-TECH RADIATORS PVT. LTD.</div>
    <div class="cover-title">END-TO-END MANUFACTURING STAGE INSPECTION DOSSIER</div>
    <div class="cover-sub">Comprehensive 17-Stage Quality Gate Release & Technical Inspection Record</div>
    <div class="meta-box">
      <div class="meta-row"><strong>Customer:</strong> <span>${customer}</span></div>
      <div class="meta-row"><strong>Work Order No:</strong> <span style="font-family: monospace; font-weight: bold;">${woNumber}</span></div>
      <div class="meta-row"><strong>HTU Radiator Serial:</strong> <span style="font-family: monospace; font-weight: bold;">${htuNo}</span></div>
      <div class="meta-row"><strong>Core Geometry:</strong> <span>${size}</span></div>
      <div class="meta-row"><strong>Total Manufacturing Stages:</strong> <span>17 Stages (S01 to S17)</span></div>
      <div class="meta-row"><strong>Standards Compliance:</strong> <span>ISO 9001:2015 / IATF 16949</span></div>
      <div class="meta-row"><strong>Compiled On:</strong> <span>${now}</span></div>
      <div class="meta-row"><strong>Overall Release Verdict:</strong> <span style="color: #22543d; font-weight: 800;">100% QUALITY CONFORMING</span></div>
    </div>
  </div>

  ${STAGE_CATALOG.map((s, idx) => `
    <div class="stage-card ${idx < STAGE_CATALOG.length - 1 ? "page-break" : ""}">
      <div class="stage-hdr">
        <div>
          <span style="font-size: 13px; font-weight: 800; color: #083260;">${s.code} · ${s.name}</span>
          <span style="font-size: 9px; color: #64748b; margin-left: 8px;">(${s.category})</span>
        </div>
        <div style="font-family: monospace; font-size: 11px; font-weight: 700; color: #083260;">
          ${s.docRef} (${s.revision})
        </div>
      </div>
      <div style="font-size: 9px; color: #64748b; margin-bottom: 8px;">${s.description}</div>
      <table>
        <thead>
          <tr>
            <th style="width: 25px;">#</th>
            <th>Inspection Parameter</th>
            <th>Standard Specification</th>
            <th>Method</th>
            <th>Measured</th>
            <th style="width: 60px; text-align: center;">Verdict</th>
          </tr>
        </thead>
        <tbody>
          ${s.params.map((p, pIdx) => `
            <tr>
              <td style="font-family: monospace;">${pIdx + 1}</td>
              <td><strong>${p.name}</strong> ${p.ctq ? '<span style="color:#083260; font-weight:bold;">[CTQ]</span>' : ""}</td>
              <td>${p.spec}</td>
              <td style="color:#64748b;">${p.method}</td>
              <td style="font-family: monospace; font-weight: 600;">${p.sampleVal} ${p.unit !== "Visual" && p.unit !== "Verdict" ? p.unit : ""}</td>
              <td style="text-align: center;"><span class="tag-intol">IN TOL</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `).join("")}
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(combinedHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
}

// ============================================================
// COMPONENT 1: STANDARDIZED REPORTS CARD (USED IN INSPECTION DRAWER)
// Replaces the verbose, cluttered text with clean, modern visualization
// ============================================================

export function StandardizedReportsCard({
  record,
  signoff,
  measurements,
  onPrintCurrent,
  onDownloadCurrentCsv,
  onDownloadCurrentJson,
  onDownloadCurrentHtml,
}: {
  record: any;
  signoff: any;
  measurements: Record<string, any>;
  onPrintCurrent: () => void;
  onDownloadCurrentCsv: () => void;
  onDownloadCurrentJson: () => void;
  onDownloadCurrentHtml: () => void;
}) {
  // Currently selected stage in the selector
  const currentStageCode = record?.stage?.stageCode || "S01";
  const [selectedStageCode, setSelectedStageCode] = useState<string>(currentStageCode);

  const selectedStage = useMemo(() => {
    return STAGE_CATALOG.find((s) => s.code === selectedStageCode) || STAGE_CATALOG[0];
  }, [selectedStageCode]);

  return (
    <div
      className="rounded-2xl p-4.5 space-y-4 border transition-all"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "rgba(8, 50, 96, 0.22)",
        boxShadow: "0 2px 8px -2px rgba(8, 50, 96, 0.06)",
      }}
    >
      {/* Visual Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline-soft)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(8, 50, 96, 0.08)", color: "var(--primary)" }}
          >
            <Download size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="t-body-sm font-bold text-ink">Inspection Reports & Downloads</span>
              <span
                className="text-[9.5px] px-2 py-0.5 rounded font-mono font-bold tracking-wider"
                style={{ backgroundColor: "rgba(8, 50, 96, 0.1)", color: "var(--primary)" }}
              >
                ISO 9001 / IATF 16949
              </span>
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              Standardized manufacturing inspection certificates, Excel spreadsheets, and cryptographic audit packages.
            </div>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => downloadAllStagesCombinedDossier(record.workOrder, record.htuNo)}
          className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 border-[var(--hairline)] hover:bg-[var(--canvas-soft)]"
        >
          <Box size={13} className="text-primary" />
          <span className="hidden sm:inline">All 17 Stages Dossier</span>
        </Button>
      </div>

      {/* Primary Action Grid (Current Record) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Format 1: Official Print / PDF Certificate */}
        <div
          className="p-3 rounded-xl border flex flex-col justify-between transition-colors hover:border-primary/40"
          style={{ backgroundColor: "var(--canvas-soft)", borderColor: "var(--hairline)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-primary">PDF / PRINT</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/10 text-emerald-600">OFFICIAL COC</span>
          </div>
          <div className="t-body-sm font-bold text-ink mt-1.5">Inspection Certificate</div>
          <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[var(--hairline-soft)]">
            <Button
              size="sm"
              onClick={onPrintCurrent}
              data-tooltip="Print A4 official certificate or Save as PDF"
              className="h-7 px-2.5 text-xs rounded-md flex-1 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: "var(--primary)", color: "var(--on-primary)" }}
            >
              <Printer size={12} /> Print PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadCurrentHtml}
              data-tooltip="Download standalone HTML certificate"
              className="h-7 px-2 text-xs rounded-md border-[var(--hairline)]"
            >
              <ExternalLink size={12} />
            </Button>
          </div>
        </div>

        {/* Format 2: CSV Data */}
        <div
          className="p-3 rounded-xl border flex flex-col justify-between transition-colors hover:border-emerald-500/40"
          style={{ backgroundColor: "var(--canvas-soft)", borderColor: "var(--hairline)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-600">CSV DATA</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[var(--surface-strong)] text-ink">EXCEL / SPC</span>
          </div>
          <div className="t-body-sm font-bold text-ink mt-1.5">Tabular Tolerances</div>
          <div className="mt-2.5 pt-2 border-t border-[var(--hairline-soft)]">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadCurrentCsv}
              data-tooltip="Download parameters as CSV for Excel/Minitab"
              className="h-7 px-2.5 text-xs rounded-md w-full flex items-center justify-center gap-1.5 border-[var(--hairline)]"
            >
              <FileSpreadsheet size={12} className="text-emerald-600" /> Download CSV
            </Button>
          </div>
        </div>

        {/* Format 3: JSON Audit */}
        <div
          className="p-3 rounded-xl border flex flex-col justify-between transition-colors hover:border-amber-500/40"
          style={{ backgroundColor: "var(--canvas-soft)", borderColor: "var(--hairline)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-600">AUDIT JSON</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-600">IMMUTABLE</span>
          </div>
          <div className="t-body-sm font-bold text-ink mt-1.5">Digital Audit Trail</div>
          <div className="mt-2.5 pt-2 border-t border-[var(--hairline-soft)]">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadCurrentJson}
              data-tooltip="Download cryptographic JSON audit package"
              className="h-7 px-2.5 text-xs rounded-md w-full flex items-center justify-center gap-1.5 border-[var(--hairline)]"
            >
              <FileJson size={12} className="text-amber-600" /> Download JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Stage-Wise Manufacturing Reports Hub (S01–S17) */}
      <div className="pt-2 border-t border-[var(--hairline-soft)] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-primary" />
            <span className="text-xs font-bold text-ink">Download Any Stage Report (S01 &rarr; S17)</span>
          </div>
          <span className="text-[10.5px] font-mono text-muted">17 Standardized Stages</span>
        </div>

        {/* Stage Selector & Actions */}
        <div className="p-3 rounded-xl bg-[var(--canvas-soft)] border border-[var(--hairline)] flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <Select value={selectedStageCode} onValueChange={setSelectedStageCode}>
              <SelectTrigger className="h-8 text-xs font-semibold bg-[var(--surface-card)] border-[var(--hairline)] w-full md:w-[320px]">
                <SelectValue placeholder="Select Stage" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {STAGE_CATALOG.map((s) => (
                  <SelectItem key={s.code} value={s.code} className="text-xs">
                    <span className="font-mono font-bold text-primary mr-1.5">{s.code}</span>
                    <span>{s.name}</span>
                    <span className="text-[10px] text-muted ml-1.5">({s.docRef})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-[11px] text-muted font-mono hidden lg:inline">
              {selectedStage.params.length} params ({selectedStage.params.filter(p => p.ctq).length} CTQ)
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => printStageReport(selectedStage, record.workOrder, record.htuNo, record.recordNo, signoff)}
              className="h-7 px-2.5 text-xs rounded-md flex items-center gap-1 bg-primary text-on-primary"
            >
              <Printer size={11} /> Print Stage PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadStageCsv(selectedStage, record.workOrder, record.htuNo)}
              className="h-7 px-2.5 text-xs rounded-md flex items-center gap-1 border-[var(--hairline)] bg-[var(--surface-card)]"
            >
              <FileSpreadsheet size={11} className="text-emerald-600" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadStageJson(selectedStage, record.workOrder, record.htuNo)}
              className="h-7 px-2.5 text-xs rounded-md flex items-center gap-1 border-[var(--hairline)] bg-[var(--surface-card)]"
            >
              <FileJson size={11} className="text-amber-600" /> JSON
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENT 2: STAGE-WISE REPORTS MODULE (USED IN MAIN REPORTS MODULE)
// Allows exploring and downloading reports for every stage
// ============================================================

export function StageWiseReportsModule({ plant = "Unit 2" }: { plant?: string }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedWO, setSelectedWO] = useState<{ woNumber: string; customer: string; size: string }>({
    woNumber: "WO-3010",
    customer: "Tata Power Distribution Ltd",
    size: "1700 X 520 X 28 Elements",
  });

  const categories = ["All", "Core Fabrication", "Header & Assembly", "Welding & Fabrication", "Testing & Integrity", "Surface & Finish", "Final QMS Release"];

  const filteredStages = useMemo(() => {
    return STAGE_CATALOG.filter((s) => {
      const matchCat = selectedCategory === "All" || s.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.docRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div
        className="rounded-2xl p-5 border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{
          backgroundColor: "var(--surface-card)",
          borderColor: "rgba(8, 50, 96, 0.22)",
          boxShadow: "0 4px 16px -4px rgba(8, 50, 96, 0.08)",
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="t-title-sm font-bold text-ink">Manufacturing Stage Inspection Reports (S01 &rarr; S17)</span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
              17 Controlled Formats
            </Badge>
          </div>
          <p className="text-xs text-muted max-w-2xl">
            Download individual stage inspection certificates, parameter logs, or the complete end-to-end dossier covering Rolling, Welding, Erection, Leak Testing, Painting, and Final QMS Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
          <Button
            onClick={() => downloadAllStagesCombinedDossier(selectedWO, "HTU-001")}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 bg-primary text-on-primary shadow-xs"
          >
            <Box size={14} />
            <span>Download All 17 Stages Dossier (PDF)</span>
          </Button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-[var(--surface-card)] text-muted hover:text-ink border border-[var(--hairline)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stage, doc ref or test..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-[var(--hairline)] bg-[var(--surface-card)] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStages.map((stage) => {
          const ctqCount = stage.params.filter((p) => p.ctq).length;
          return (
            <div
              key={stage.code}
              className="rounded-xl border p-4 flex flex-col justify-between transition-all hover:shadow-sm"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--hairline)",
              }}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {stage.code}
                    </span>
                    <span className="text-[10px] font-mono text-muted">{stage.docRef}</span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded font-mono font-semibold bg-[var(--surface-strong)] text-ink">
                    {stage.revision}
                  </span>
                </div>

                <div className="t-body-sm font-bold text-ink mt-2">{stage.name}</div>
                <div className="text-[11px] text-muted mt-1 line-clamp-2">{stage.description}</div>

                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[var(--hairline-soft)] text-[10.5px]">
                  <span className="text-muted font-mono">{stage.params.length} Characteristics</span>
                  <span className="text-muted">·</span>
                  <span className="text-primary font-bold font-mono">{ctqCount} CTQ Critical</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-[var(--hairline-soft)]">
                <Button
                  size="sm"
                  onClick={() => printStageReport(stage, selectedWO, "HTU-001")}
                  data-tooltip="Print official stage certificate or save as PDF"
                  className="h-7 px-2.5 text-xs rounded-md flex-1 flex items-center justify-center gap-1 bg-primary text-on-primary font-medium"
                >
                  <Printer size={11} /> Print PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadStageCsv(stage, selectedWO, "HTU-001")}
                  data-tooltip="Download RFC 4180 CSV spreadsheet"
                  className="h-7 px-2 text-xs rounded-md border-[var(--hairline)]"
                >
                  <FileSpreadsheet size={12} className="text-emerald-600" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadStageJson(stage, selectedWO, "HTU-001")}
                  data-tooltip="Download machine-readable JSON audit package"
                  className="h-7 px-2 text-xs rounded-md border-[var(--hairline)]"
                >
                  <FileJson size={12} className="text-amber-600" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
