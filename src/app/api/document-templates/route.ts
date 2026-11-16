import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/document-templates?docNumber=QCI/F/02/01
// Returns the actual checklist fields/structure for a controlled document
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docNumber = searchParams.get("docNumber");

  if (!docNumber) {
    return NextResponse.json({ error: "docNumber required" }, { status: 400 });
  }

  // Find the document
  const doc = await db.controlledDocument.findFirst({
    where: { docNumber: { contains: docNumber } },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Return the template structure based on the document number
  // These are the actual checklist fields from the Excel sheets
  const template = getTemplate(doc.docNumber);

  return NextResponse.json({
    document: {
      id: doc.id,
      docNumber: doc.docNumber,
      title: doc.title,
      revision: doc.revision,
      status: doc.status,
      effectiveDate: doc.effectiveDate,
      owner: doc.owner,
      category: doc.category,
    },
    template,
  });
}

function getTemplate(docNumber: string): { sections: { title: string; fields: { label: string; type: string; required?: boolean; spec?: string; unit?: string; method?: string; ctq?: boolean }[] }[] } {
  // Rolling Checklist (QCI/F/02/01)
  if (docNumber.includes("QCI/F/02/01")) {
    return {
      sections: [
        {
          title: "Header Information",
          fields: [
            { label: "Date", type: "date", required: true },
            { label: "Shift", type: "select", required: true, spec: "A / B" },
            { label: "Material (MS/SS)", type: "select", required: true, spec: "MS / SS" },
            { label: "Coil No.", type: "text" },
            { label: "Coil Make", type: "select", spec: "Tata / JSW / POSCO" },
            { label: "Customer", type: "text", required: true },
            { label: "W.O. No.", type: "text", required: true },
            { label: "Size", type: "text", required: true },
            { label: "Operator", type: "text", required: true },
            { label: "Inspector", type: "text", required: true },
          ],
        },
        {
          title: "Process Parameters",
          fields: [
            { label: "Sheet Thickness", type: "number", spec: "As per Drg./Tol. +/-0.03 mm", unit: "mm", method: "Micrometer", ctq: false },
            { label: "Sheet Width", type: "number", spec: "As per Drg./Tol. +/- 1 mm", unit: "mm", method: "Measuring tape" },
            { label: "Neck to Neck Distance (CTQ)", type: "number", spec: "As per Drg./Tolerance +/-1 mm", unit: "mm", method: "Measuring Tape", ctq: true, required: true },
            { label: "Length Wise Bow", type: "number", spec: "Max. 5 mm allowed", unit: "mm", method: "Line dori & Measuring tape" },
            { label: "Width Wise Bow", type: "number", spec: "Max. 3 mm allowed", unit: "mm", method: "Line dori & filler gauge" },
            { label: "Forming & Rolling Matching", type: "number", spec: "Max 2.0mm variation", unit: "mm", method: "Measuring tape" },
            { label: "Sheet Weaviness", type: "passfail", spec: "Not allowed", method: "Visual" },
            { label: "Die Depth", type: "number", spec: "3.5 to 5 mm", unit: "mm", method: "Depth Micrometer" },
            { label: "Rolling Depth", type: "number", spec: "4 to 5 mm", unit: "mm", method: "Depth Micrometer" },
            { label: "Cut Fin Dimension", type: "number", spec: "X & Y = +/-5 mm", unit: "mm", method: "Measuring tape" },
          ],
        },
        {
          title: "Notes & Sign-off",
          fields: [
            { label: "All Dimensional Tolerances as per QAP QCI/Q/02/01", type: "info" },
            { label: "Reaction Plan: Hold the job and inform QA and Production Head", type: "info" },
            { label: "Checked By", type: "text", required: true },
            { label: "Verified By", type: "text", required: true },
          ],
        },
      ],
    };
  }

  // Spot Welding Checklist (QCI/F/02/02)
  if (docNumber.includes("QCI/F/02/02")) {
    return {
      sections: [
        {
          title: "Machine & Setup",
          fields: [
            { label: "Machine Name/No.", type: "text", required: true },
            { label: "Date", type: "date", required: true },
            { label: "Shift", type: "select", required: true, spec: "A / B" },
          ],
        },
        {
          title: "CTQ Parameters (marked with *)",
          fields: [
            { label: "Welding Current * (CTQ)", type: "number", spec: "For 1.0mm: 10-12 kA, For 1.2mm: 12-14 kA", unit: "kA", method: "Weld Checker", ctq: true, required: true },
            { label: "Force * (CTQ)", type: "number", spec: "250 to 400 Kgs", unit: "kgf", method: "Force gauge", ctq: true },
            { label: "Air Pressure", type: "number", spec: "4 to 5 Kg/Cm Sq.", unit: "kg/cm2", method: "Pressure gauge" },
            { label: "Nugget Diameter", type: "number", spec: "6.5-8.5 MM", unit: "mm", method: "Vernier calliper" },
            { label: "Carbon Test", type: "number", spec: "8-10 MM impression", unit: "mm", method: "Carbon & paper" },
            { label: "Nugget Test (Pull off)", type: "passfail", spec: "Nugget should not break (parent material tear)", method: "Pull off test" },
            { label: "Distance Between Spots", type: "number", spec: "Max 45.0 mm", unit: "mm", method: "Measuring tape" },
            { label: "Electrode Dia", type: "number", spec: "8-10 mm", unit: "mm", method: "Vernier calliper" },
            { label: "Top/Bottom Electrode Alignment", type: "passfail", spec: "Matching required", method: "Visual" },
            { label: "Spot Burr", type: "passfail", spec: "Not allowed", method: "Visual" },
            { label: "Sanding Frequency of Electrode", type: "passfail", spec: "Carbon test", method: "Carbon & paper" },
          ],
        },
        {
          title: "Sign-off",
          fields: [
            { label: "Inspected By", type: "text", required: true },
            { label: "Verified By", type: "text", required: true },
            { label: "Note: * marks CTQ parameters", type: "info" },
          ],
        },
      ],
    };
  }

  // Leak Testing Report (QCI/F/05/08)
  if (docNumber.includes("QCI/F/05/08")) {
    return {
      sections: [
        {
          title: "Test Information",
          fields: [
            { label: "Date", type: "date", required: true },
            { label: "Shift", type: "select", required: true, spec: "A / B" },
            { label: "Inspector", type: "text", required: true },
          ],
        },
        {
          title: "Radiator Identification",
          fields: [
            { label: "Customer Name", type: "text", required: true },
            { label: "HTU No", type: "text", required: true },
            { label: "Radiator Size", type: "text", required: true },
            { label: "Panel Line No", type: "text" },
            { label: "C/C Distance", type: "text" },
          ],
        },
        {
          title: "Leak Test Results (CTQ)",
          fields: [
            { label: "Leakage (CTQ)", type: "passfail", spec: "Leakage free after min. 30 min. at 2 kg/cm2", ctq: true, required: true, method: "Pressure test tank" },
            { label: "Type of Leak (A/B/C)", type: "select", spec: "A=Top, B=Side, C=Bottom" },
            { label: "CO2 Leak Location", type: "text" },
            { label: "Cross Seam Leak (Top/Bottom)", type: "text" },
            { label: "Seam Leak (LHS/RHS)", type: "text" },
            { label: "Single Spot Leak", type: "text" },
            { label: "Multi Spot Leak", type: "text" },
            { label: "Header Pipe Leakage (Top/Z Pipe/Boss/Plug/Flange)", type: "text" },
          ],
        },
        {
          title: "Test Details",
          fields: [
            { label: "CO2 Welders Name", type: "text" },
            { label: "Assembly Fitter Name", type: "text" },
            { label: "Testing Welder Name", type: "text" },
            { label: "Start Time", type: "time" },
            { label: "End Time", type: "time" },
            { label: "Tank No", type: "text" },
            { label: "Melted Lug (Yes/No)", type: "passfail" },
            { label: "Loose Lug (Yes/No)", type: "passfail" },
            { label: "Testing After Rework", type: "select", spec: "OK / NOT OK" },
            { label: "Final Result", type: "select", spec: "OK / NOT OK", required: true },
          ],
        },
        {
          title: "Notes & Sign-off",
          fields: [
            { label: "Notes: All radiators checked for 2 kg/cm2 for 30 minutes", type: "info" },
            { label: "Checked By", type: "text", required: true },
            { label: "Verified By", type: "text", required: true },
          ],
        },
      ],
    };
  }

  // Edge Cutting Checklist (QCI/F/02/03)
  if (docNumber.includes("QCI/F/02/03")) {
    return {
      sections: [
        {
          title: "Setup",
          fields: [
            { label: "Date", type: "date", required: true },
            { label: "Shift", type: "select", required: true },
            { label: "Operator", type: "text", required: true },
            { label: "W.O. No.", type: "text", required: true },
            { label: "Size", type: "text", required: true },
          ],
        },
        {
          title: "Inspection Points",
          fields: [
            { label: "Fin Identification", type: "text" },
            { label: "Outside Seam Weld Width", type: "number", spec: "Min 5mm", unit: "mm" },
            { label: "Burr in Fin", type: "number", spec: "Max 0.8mm", unit: "mm", method: "Micrometer/Vernier" },
            { label: "Edge Opening", type: "passfail", spec: "Not allowed", method: "Visual" },
            { label: "Edge Cutting Diagonal", type: "number", spec: "Max 3 mm", unit: "mm", method: "Measuring" },
            { label: "Flute Pressing/Damage", type: "passfail", spec: "Not allowed", method: "Visual" },
            { label: "Throat Dimension", type: "number", spec: "18 +/- 1 mm", unit: "mm", method: "Vernier calliper" },
            { label: "Edge Cutting Length Y1", type: "number", unit: "mm" },
            { label: "Edge Cutting Length Y2", type: "number", unit: "mm" },
            { label: "Y1 & Y2 Variation", type: "number", spec: "Max 2mm", unit: "mm" },
          ],
        },
        {
          title: "Sign-off",
          fields: [
            { label: "Checked By", type: "text", required: true },
            { label: "Verified By", type: "text", required: true },
          ],
        },
      ],
    };
  }

  // Default generic template
  return {
    sections: [
      {
        title: "Document Information",
        fields: [
          { label: "Document Number", type: "text", required: true },
          { label: "Revision", type: "text", required: true },
          { label: "Effective Date", type: "date", required: true },
          { label: "Status", type: "select", spec: "Released / Draft / Obsolete" },
        ],
      },
      {
        title: "Inspection Parameters",
        fields: [
          { label: "This document template needs to be configured.", type: "info" },
          { label: "Contact Document Control to add the specific checklist fields.", type: "info" },
        ],
      },
    ],
  };
}
