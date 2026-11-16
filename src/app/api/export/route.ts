import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/export?type=work-orders|inspections|ncrs|fmea|documents|traceability|materials|equipment&format=csv|xlsx|json&plant=K2
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "work-orders";
  const format = searchParams.get("format") || "csv";
  const plant = searchParams.get("plant") || "K2";

  let rows: any[] = [];
  let filename = "";

  switch (type) {
    case "work-orders": {
      const items = await db.workOrder.findMany({
        where: plant !== "all" ? { routeCode: plant } : {},
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { inspections: true, ncrs: true } } },
      });
      rows = items.map((w) => ({
        WO_Number: w.woNumber,
        SO_Number: w.soNumber || "",
        Customer: w.customer,
        Customer_PO: w.customerPo || "",
        Item_Name: w.itemName,
        Size: w.size,
        Finish_Type: w.finishType,
        Route: w.routeCode,
        Planned_Qty: w.plannedQty,
        Completed_Qty: w.completedQty,
        Rejected_Qty: w.rejectedQty,
        Rework_Qty: w.reworkQty,
        Priority: w.priority,
        Status: w.status,
        Material_Status: w.materialStatus,
        Sales_Person: w.salesPerson || "",
        Inspections: w._count.inspections,
        NCRs: w._count.ncrs,
        Created: new Date(w.createdAt).toISOString().slice(0, 10),
      }));
      filename = `work-orders-${plant}-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "inspections": {
      const items = await db.inspectionRecord.findMany({
        where: plant !== "all" ? { workOrder: { routeCode: plant } } : {},
        orderBy: { inspectedAt: "desc" },
        take: 500,
        include: { stage: true, workOrder: true },
      });
      rows = items.map((r) => ({
        Record_No: r.recordNo,
        WO_Number: r.workOrder?.woNumber || "",
        Customer: r.workOrder?.customer || "",
        Stage: r.stage?.name || "",
        Stage_Code: r.stage?.stageCode || "",
        Document_Ref: r.stage?.documentRef || "",
        HTU_No: r.htuNo || "",
        Shift: r.shift,
        Inspector: r.inspector,
        Operator: r.operator || "",
        CTQ_Result: r.ctqResult || "",
        Overall_Result: r.overallResult,
        Inspected_At: new Date(r.inspectedAt).toISOString(),
      }));
      filename = `inspections-${plant}-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "ncrs": {
      const items = await db.nonconformance.findMany({
        where: plant !== "all" ? { workOrder: { routeCode: plant } } : {},
        orderBy: { createdAt: "desc" },
        include: { workOrder: true },
      });
      rows = items.map((n) => ({
        NCR_Number: n.ncrNumber,
        WO_Number: n.workOrder?.woNumber || "",
        Customer: n.workOrder?.customer || "",
        Stage: n.stageName,
        HTU_No: n.htuno || "",
        Defect_Category: n.defectCategory,
        Severity: n.severity,
        Status: n.status,
        Description: n.description,
        Containment: n.containment || "",
        Root_Cause: n.rootCause || "",
        Corrective_Action: n.correctiveAction || "",
        CAPA_Owner: n.capaOwner || "",
        Effectiveness_Verified: n.effectivenessVerified ? "Yes" : "No",
        Created: new Date(n.createdAt).toISOString().slice(0, 10),
      }));
      filename = `ncrs-${plant}-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "fmea": {
      const items = await db.fmeaRecord.findMany({ orderBy: { rpn: "desc" } });
      rows = items.map((f) => ({
        FMEA_ID: f.fmeaId,
        Stage: f.stageName,
        Failure_Mode: f.failureMode,
        Failure_Effect: f.failureEffect,
        Potential_Cause: f.potentialCause,
        Prevention_Control: f.preventionControl || "",
        Detection_Control: f.detectionControl || "",
        Severity: f.severity,
        Occurrence: f.occurrence,
        Detection: f.detection,
        RPN: f.rpn,
        Action_Priority: f.actionPriority || "",
        Recommended_Action: f.recommendedAction || "",
        Action_Owner: f.actionOwner || "",
        Status: f.status,
        Last_Reviewed: f.lastReviewedAt ? new Date(f.lastReviewedAt).toISOString().slice(0, 10) : "",
      }));
      filename = `fmea-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "documents": {
      const items = await db.controlledDocument.findMany({ orderBy: [{ category: "asc" }, { docNumber: "asc" }] });
      rows = items.map((d) => ({
        Doc_Number: d.docNumber,
        Title: d.title,
        Revision: d.revision,
        Status: d.status,
        Type: d.docType,
        Category: d.category || "",
        Owner: d.owner || "",
        Effective_Date: new Date(d.effectiveDate).toISOString().slice(0, 10),
      }));
      filename = `documents-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "traceability": {
      const items = await db.productGenealogy.findMany({
        where: plant !== "all" ? { workOrder: { routeCode: plant } } : {},
        orderBy: { createdAt: "desc" },
        include: { workOrder: true },
      });
      rows = items.map((g) => ({
        HTU_No: g.htuno,
        WO_Number: g.workOrder?.woNumber || "",
        Customer: g.workOrder?.customer || "",
        Route: g.workOrder?.routeCode || "",
        Serial_No: g.serialNo,
        Fin_Count: g.finCount || "",
        Sheet_Thickness: g.sheetThickness || "",
        Coil_Make: g.coilMake || "",
        Coil_Number: g.coilNumber || "",
        Welding_Wire_Batch: g.weldingWireBatch || "",
        Primer_Batch: g.primerBatch || "",
        Paint_Batch: g.paintBatch || "",
        Zinc_Dip_Date: g.zincDipDate ? new Date(g.zincDipDate).toISOString().slice(0, 10) : "",
        Final_DFT: g.finalDft || "",
        Release_Date: g.releaseDate ? new Date(g.releaseDate).toISOString().slice(0, 10) : "",
      }));
      filename = `traceability-${plant}-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "materials": {
      const items = await db.materialLot.findMany({
        where: plant !== "all" ? { workOrder: { routeCode: plant } } : {},
        orderBy: { createdAt: "desc" },
        include: { workOrder: true },
      });
      rows = items.map((m) => ({
        Lot_Number: m.lotNumber,
        GRN_Number: m.grnNumber || "",
        Material_Type: m.materialType,
        Supplier: m.supplier || "",
        Specification: m.spec || "",
        WO_Number: m.workOrder?.woNumber || "",
        Quantity: m.quantity,
        Unit: m.unit,
        Inspection_Status: m.inspectionStatus,
        MTC_Available: m.mtcAvailable ? "Yes" : "No",
        Inspected_By: m.inspectedBy || "",
        Inspected_At: m.inspectedAt ? new Date(m.inspectedAt).toISOString().slice(0, 10) : "",
      }));
      filename = `materials-${plant}-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    case "equipment": {
      const items = await db.equipment.findMany({ orderBy: { assetCode: "asc" } });
      rows = items.map((e) => ({
        Asset_Code: e.assetCode,
        Name: e.name,
        Type: e.type,
        Location: e.location || "",
        Status: e.status,
        Last_Calibration: e.lastCalibration ? new Date(e.lastCalibration).toISOString().slice(0, 10) : "",
        Next_Calibration: e.nextCalibration ? new Date(e.nextCalibration).toISOString().slice(0, 10) : "",
        Calibration_Frequency: e.calibrationFrequency || "",
      }));
      filename = `equipment-${new Date().toISOString().slice(0, 10)}`;
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No data to export" }, { status: 404 });
  }

  if (format === "json") {
    return new NextResponse(JSON.stringify({ type, plant, exportedAt: new Date().toISOString(), count: rows.length, data: rows }, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  }

  if (format === "csv") {
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(","),
      ...rows.map((row) =>
        headers.map((h) => {
          const val = String(row[h] ?? "").replace(/"/g, '""');
          return val.includes(",") || val.includes("\n") || val.includes('"') ? `"${val}"` : val;
        }).join(",")
      ),
    ];
    const csv = csvLines.join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const XLSX = require("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  return NextResponse.json({ error: "Unknown format" }, { status: 400 });
}
