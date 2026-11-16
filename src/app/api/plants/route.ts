import { NextResponse } from "next/server";

// GET /api/plants - plant configuration
export async function GET() {
  const plants = [
    { code: "K2", name: "K2 - Stainless Steel Radiators", shortName: "K2", status: "active", description: "Stainless steel radiator assembly line", productType: "Radiators", color: "#1b1938" },
    { code: "K1", name: "K1 - Standard MS Radiators", shortName: "K1", status: "coming-soon", description: "Standard mild-steel radiator assembly", productType: "Radiators", color: "#73706d" },
    { code: "K3", name: "K3 - Heavy-duty Radiators", shortName: "K3", status: "coming-soon", description: "Heavy-duty MS radiator with thicker fins", productType: "Radiators", color: "#73706d" },
    { code: "K4", name: "K4 - Header Manufacturing", shortName: "K4", status: "coming-soon", description: "Standalone header pipe manufacturing", productType: "Headers", color: "#73706d" },
    { code: "INDO", name: "INDO - Tank Manufacturing", shortName: "INDO", status: "coming-soon", description: "Transformer tank fabrication and painting", productType: "Tanks", color: "#73706d" },
  ];
  return NextResponse.json({ plants, activePlant: "K2" });
}
