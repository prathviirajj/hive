import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/search?q=...&plant=K2 - global search across all entity types
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const plant = searchParams.get("plant") || "K2";

  if (!q || q.length < 1) {
    return NextResponse.json({ results: [] });
  }

  const woFilter = plant !== "all" ? { routeCode: plant } : {};
  const results: { type: string; icon: string; id: string; title: string; subtitle: string; status: string; module: string }[] = [];

  // Work Orders - search WO number, SO number, customer, item, PO
  const wos = await db.workOrder.findMany({
    where: { ...woFilter, OR: [
      { woNumber: { contains: q } },
      { soNumber: { contains: q } },
      { customer: { contains: q } },
      { itemName: { contains: q } },
      { customerPo: { contains: q } },
      { size: { contains: q } },
    ]},
    take: 8,
  });
  for (const w of wos) {
    results.push({ type: "Work Order", icon: "ClipboardList", id: w.woNumber, title: w.woNumber, subtitle: `${w.customer} · ${w.size}`, status: w.status, module: "workorders" });
  }

  // Inspections
  const inspections = await db.inspectionRecord.findMany({
    where: { workOrder: woFilter, OR: [{ recordNo: { contains: q } }, { htuNo: { contains: q } }, { inspector: { contains: q } }] },
    take: 8,
    include: { stage: true },
  });
  for (const r of inspections) {
    results.push({ type: "Inspection", icon: "ClipboardCheck", id: r.recordNo, title: r.recordNo, subtitle: `${r.stage?.name || ""} · HTU ${r.htuNo || ""}`, status: r.overallResult, module: "inspection" });
  }

  // NCRs
  const ncrs = await db.nonconformance.findMany({
    where: { workOrder: woFilter, OR: [{ ncrNumber: { contains: q } }, { htuno: { contains: q } }, { defectCategory: { contains: q } }, { description: { contains: q } }] },
    take: 8,
  });
  for (const n of ncrs) {
    results.push({ type: "NCR", icon: "AlertTriangle", id: n.ncrNumber, title: n.ncrNumber, subtitle: `${n.defectCategory} · ${n.htuno || ""}`, status: n.status, module: "ncr" });
  }

  // FMEA
  const fmeas = await db.fmeaRecord.findMany({
    where: { OR: [{ fmeaId: { contains: q } }, { stageName: { contains: q } }, { failureMode: { contains: q } }, { failureEffect: { contains: q } }] },
    take: 5,
  });
  for (const f of fmeas) {
    results.push({ type: "FMEA", icon: "ShieldAlert", id: f.fmeaId, title: f.fmeaId, subtitle: `${f.stageName} · ${f.failureMode}`, status: f.status, module: "fmea" });
  }

  // Documents - search doc number, title
  const docs = await db.controlledDocument.findMany({
    where: { OR: [{ docNumber: { contains: q } }, { title: { contains: q } }] },
    take: 8,
  });
  for (const d of docs) {
    results.push({ type: "Document", icon: "FileText", id: d.docNumber, title: d.docNumber, subtitle: d.title, status: d.status, module: "documents" });
  }

  // Traceability / Genealogy
  const genes = await db.productGenealogy.findMany({
    where: { workOrder: woFilter, OR: [
      { htuno: { contains: q } },
      { coilMake: { contains: q } },
      { coilNumber: { contains: q } },
      { weldingWireBatch: { contains: q } },
      { primerBatch: { contains: q } },
      { paintBatch: { contains: q } },
    ]},
    take: 5,
    include: { workOrder: true },
  });
  for (const g of genes) {
    results.push({ type: "Genealogy", icon: "Network", id: g.htuno, title: g.htuno, subtitle: `${g.workOrder?.woNumber || ""} · ${g.workOrder?.customer || ""}`, status: "Released", module: "traceability" });
  }

  // Material Lots
  const lots = await db.materialLot.findMany({
    where: { workOrder: woFilter, OR: [
      { lotNumber: { contains: q } },
      { materialType: { contains: q } },
      { supplier: { contains: q } },
      { grnNumber: { contains: q } },
      { spec: { contains: q } },
    ]},
    take: 5,
  });
  for (const m of lots) {
    results.push({ type: "Material", icon: "Boxes", id: m.lotNumber, title: m.lotNumber, subtitle: `${m.materialType} · ${m.supplier || ""}`, status: m.inspectionStatus, module: "traceability" });
  }

  // Equipment
  const equipment = await db.equipment.findMany({
    where: { OR: [{ assetCode: { contains: q } }, { name: { contains: q } }, { location: { contains: q } }] },
    take: 5,
  });
  for (const e of equipment) {
    results.push({ type: "Equipment", icon: "Wrench", id: e.assetCode, title: e.assetCode, subtitle: `${e.name} · ${e.location || ""}`, status: e.status, module: "documents" });
  }

  // Products
  const products = await db.product.findMany({
    where: { OR: [{ partNo: { contains: q } }, { itemName: { contains: q } }] },
    take: 5,
  });
  for (const p of products) {
    results.push({ type: "Product", icon: "Package", id: p.partNo, title: p.partNo, subtitle: p.itemName, status: "Active", module: "workorders" });
  }

  // Reports (virtual - report templates)
  const reportTemplates = [
    { id: "inspection-report", title: "Inspection Result Report", subtitle: "Per-inspection detailed report" },
    { id: "ncr-report", title: "Nonconformance Report", subtitle: "NCR with CAPA evidence" },
    { id: "genealogy-report", title: "Product Genealogy Pack", subtitle: "Full material history" },
    { id: "kpi-report", title: "Quality KPI Summary", subtitle: "FPY, Pareto, route summary" },
  ];
  for (const r of reportTemplates) {
    if (r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q) || r.id.includes(q)) {
      results.push({ type: "Report", icon: "FileBarChart", id: r.id, title: r.title, subtitle: r.subtitle, status: "Available", module: "reports" });
    }
  }

  return NextResponse.json({ results, query: q, plant });
}
