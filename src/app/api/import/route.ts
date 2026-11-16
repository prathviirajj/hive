import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/import - parse + validate + commit
// Body: { entityType: "work-orders", data: [...], action: "preview" | "commit" }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { entityType, data, action } = body;

  if (!entityType || !data || !Array.isArray(data)) {
    return NextResponse.json({ error: "entityType and data array required" }, { status: 400 });
  }

  // Validate
  const errors: { row: number; field: string; message: string }[] = [];
  const warnings: { row: number; message: string }[] = [];
  const valid: any[] = [];

  data.forEach((row: any, idx: number) => {
    const rowNum = idx + 2; // +2 because row 1 is header
    if (entityType === "work-orders") {
      if (!row.WO_Number && !row.woNumber) { errors.push({ row: rowNum, field: "WO_Number", message: "WO Number is required" }); return; }
      if (!row.Customer && !row.customer) { errors.push({ row: rowNum, field: "Customer", message: "Customer is required" }); return; }
      if (!row.Item_Name && !row.itemName) { errors.push({ row: rowNum, field: "Item_Name", message: "Item Name is required" }); return; }
      if (!row.Size && !row.size) { errors.push({ row: rowNum, field: "Size", message: "Size is required" }); return; }
      const woNumber = row.WO_Number || row.woNumber;
      const routeCode = (row.Route || row.routeCode || "K2").toUpperCase();
      if (!["K1", "K2", "K3", "K4", "INDO"].includes(routeCode)) {
        warnings.push({ row: rowNum, message: `Unknown route "${routeCode}", defaulting to K2` });
      }
      valid.push({
        woNumber,
        soNumber: row.SO_Number || row.soNumber || null,
        customer: row.Customer || row.customer,
        customerPo: row.Customer_PO || row.customerPo || null,
        itemName: row.Item_Name || row.itemName,
        size: row.Size || row.size,
        finishType: row.Finish_Type || row.finishType || "HDG 70 MIC",
        routeCode: ["K1", "K2", "K3", "K4", "INDO"].includes(routeCode) ? routeCode : "K2",
        plannedQty: Number(row.Planned_Qty || row.plannedQty) || 1,
        priority: row.Priority || row.priority || "Medium",
        status: row.Status || row.status || "Released",
        materialStatus: row.Material_Status || row.materialStatus || "Available",
        salesPerson: row.Sales_Person || row.salesPerson || null,
      });
    } else if (entityType === "inspections") {
      if (!row.WO_Number && !row.woNumber) { errors.push({ row: rowNum, field: "WO_Number", message: "WO Number is required" }); return; }
      if (!row.Stage_Code && !row.stageCode) { errors.push({ row: rowNum, field: "Stage_Code", message: "Stage Code is required" }); return; }
      valid.push({
        woNumber: row.WO_Number || row.woNumber,
        stageCode: row.Stage_Code || row.stageCode,
        htuNo: row.HTU_No || row.htuNo || null,
        shift: row.Shift || row.shift || "A",
        inspector: row.Inspector || row.inspector || "QA",
        operator: row.Operator || row.operator || null,
        overallResult: row.Overall_Result || row.overallResult || "Pending",
        ctqResult: row.CTQ_Result || row.ctqResult || "Pass",
      });
    } else if (entityType === "materials") {
      if (!row.Lot_Number && !row.lotNumber) { errors.push({ row: rowNum, field: "Lot_Number", message: "Lot Number is required" }); return; }
      if (!row.Material_Type && !row.materialType) { errors.push({ row: rowNum, field: "Material_Type", message: "Material Type is required" }); return; }
      valid.push({
        lotNumber: row.Lot_Number || row.lotNumber,
        grnNumber: row.GRN_Number || row.grnNumber || null,
        materialType: row.Material_Type || row.materialType,
        supplier: row.Supplier || row.supplier || null,
        spec: row.Specification || row.spec || null,
        quantity: Number(row.Quantity || row.quantity) || 0,
        unit: row.Unit || row.unit || "NOS",
        inspectionStatus: row.Inspection_Status || row.inspectionStatus || "Pending",
        mtcAvailable: (row.MTC_Available || row.mtcAvailable || "").toLowerCase() === "yes",
      });
    } else {
      errors.push({ row: rowNum, field: "entityType", message: `Import not supported for ${entityType}` });
    }
  });

  if (action === "preview") {
    return NextResponse.json({
      total: data.length,
      valid: valid.length,
      errors: errors.length,
      warnings: warnings.length,
      errorDetails: errors,
      warningDetails: warnings,
      preview: valid.slice(0, 10),
    });
  }

  if (action === "commit") {
    let committed = 0;
    let skipped = 0;
    const commitErrors: string[] = [];

    for (const item of valid) {
      try {
        if (entityType === "work-orders") {
          const existing = await db.workOrder.findUnique({ where: { woNumber: item.woNumber } });
          if (existing) { skipped++; continue; }
          await db.workOrder.create({
            data: {
              woNumber: item.woNumber,
              soNumber: item.soNumber,
              customer: item.customer,
              customerPo: item.customerPo,
              itemName: item.itemName,
              size: item.size,
              finishType: item.finishType,
              routeCode: item.routeCode,
              plannedQty: item.plannedQty,
              priority: item.priority,
              status: item.status,
              materialStatus: item.materialStatus,
              salesPerson: item.salesPerson,
              plannedStart: new Date(),
              plannedEnd: new Date(Date.now() + 7 * 86400000),
            },
          });
          committed++;
        } else if (entityType === "materials") {
          const existing = await db.materialLot.findUnique({ where: { lotNumber: item.lotNumber } });
          if (existing) { skipped++; continue; }
          await db.materialLot.create({ data: item });
          committed++;
        }
      } catch (e: any) {
        commitErrors.push(`Row skipped: ${e.message}`);
        skipped++;
      }
    }

    return NextResponse.json({
      committed,
      skipped,
      errors: commitErrors.length,
      errorDetails: commitErrors,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
