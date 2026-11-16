// Seed QMS users - Real organization structure from HR chart
// K2 Khopoli Galvanizing Plant - Radiator Division
// Effective: 1 September 2026
import { db } from "./db";

const STAGE_CODES = [
  "S01","S02","S03","S04","S05","S06","S07","S08","S09","S10",
  "S11","S12","S13","S14","S20","S21","S22","S23","S24","S27",
  "S28","S29","S30","S31","S33","S34","S35","S36","S37","S38",
];

const USERS = [
  // ===== ADMIN (IT Team) =====
  { username: "admin", password: "admin2026", name: "System Administrator", email: "admin@hitechradiators.com", role: "Admin", department: "IT", plant: "K2", phone: "", employeeId: "HTR-IT-000", status: "Active", shiftPreference: "General" },

  // ===== IT TEAM =====
  { username: "developers", password: "it2026", name: "IT Team", email: "developers@hitech.com", role: "IT", department: "IT", plant: "K2", phone: "", employeeId: "HTR-IT-001", status: "Active", shiftPreference: "General" },

  // ===== PLANT LEADERSHIP =====
  // Plant Director
  { username: "yogesh.jadhav", password: "director2026", name: "Yogesh Jadhav", email: "yogesh.jadhav@hitechradiators.com", role: "Director", department: "Management", plant: "K2", phone: "", employeeId: "HTR-DR-001", status: "Active", shiftPreference: "General" },

  // DGM Quality - Fabrication & Welding
  { username: "balasaheb.daphal", password: "dgm2026", name: "Balasaheb Daphal", email: "balasaheb.daphal@hitechradiators.com", role: "DGM", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-DGM-001", status: "Active", shiftPreference: "General", managedStages: ["S01","S02","S03","S04","S05","S06","S07","S11","S12","S13"] },

  // DGM Quality - Paint & Final
  { username: "ramji.niranjan", password: "dgm2026", name: "Ramji Niranjan", email: "ramji.niranjan@hitechradiators.com", role: "DGM", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-DGM-002", status: "Active", shiftPreference: "General", managedStages: ["S14","S20","S21","S22","S23","S24","S27","S28","S29","S30","S31","S33","S34","S35","S36","S37","S38"] },

  // ===== PRODUCTION - Section Heads =====
  // Section Head - Fabrication & Panel Line
  { username: "roshan.gaikar", password: "section2026", name: "Roshan Gaikar", email: "roshan.gaikar@hitechradiators.com", role: "PlantManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SH-001", status: "Active", shiftPreference: "General", managedStages: ["S01","S02","S03","S04","S05","S06","S07"] },

  // Section Head - Paint Shop
  { username: "naveen.tuniki", password: "section2026", name: "Naveen Tuniki", email: "naveen.tuniki@hitechradiators.com", role: "PlantManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SH-002", status: "Active", shiftPreference: "General", managedStages: ["S20","S21","S22","S23","S24"] },

  // Section Head - Galvanizing
  { username: "dayakrishan.bhatt", password: "section2026", name: "Dayakrishan Bhatt", email: "dayakrishan.bhatt@hitechradiators.com", role: "PlantManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SH-003", status: "Active", shiftPreference: "General", managedStages: ["S14"] },

  // Section Head - Internal Coating
  { username: "saurabh.jadhav", password: "section2026", name: "Saurabh Jadhav", email: "saurabh.jadhav@hitechradiators.com", role: "PlantManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SH-004", status: "Active", shiftPreference: "General" },

  // ===== PRODUCTION - Line Managers / Engineers =====
  // Fabrication Line Managers
  { username: "atul.patidar", password: "line2026", name: "Atul Patidar", email: "atul.patidar@hitechradiators.com", role: "LineManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-LM-001", status: "Active", shiftPreference: "A", assignedStages: ["S01"] },
  { username: "pankaj.karmikar", password: "line2026", name: "Pankaj Karmikar", email: "pankaj.karmikar@hitechradiators.com", role: "LineManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-LM-002", status: "Active", shiftPreference: "A", assignedStages: ["S01"] },
  { username: "yogesh.kharade", password: "line2026", name: "Yogesh Kharade", email: "yogesh.kharade@hitechradiators.com", role: "LineManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-LM-003", status: "Active", shiftPreference: "A", assignedStages: ["S01"] },
  // Panel Line Manager
  { username: "rakesh.gupte", password: "line2026", name: "Rakesh Gupte", email: "rakesh.gupte@hitechradiators.com", role: "LineManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-LM-004", status: "Active", shiftPreference: "A", assignedStages: ["S06","S07"] },
  // Paint Shop Line Manager
  { username: "pritam.padme", password: "line2026", name: "Pritam Padme", email: "pritam.padme@hitechradiators.com", role: "LineManager", department: "Paint", plant: "K2", phone: "", employeeId: "HTR-LM-005", status: "Active", shiftPreference: "A", assignedStages: ["S20","S21","S22","S23"] },
  // Galvanizing Line Manager / Senior Engineer
  { username: "ganesh.mhoprekar", password: "line2026", name: "Ganesh Mhoprekar", email: "ganesh.mhoprekar@hitechradiators.com", role: "LineManager", department: "Production", plant: "K2", phone: "", employeeId: "HTR-LM-006", status: "Active", shiftPreference: "General", assignedStages: ["S14"] },

  // ===== PRODUCTION - Shift Engineers / Shift Incharge (Galvanizing) =====
  { username: "mukesh.kapse", password: "shift2026", name: "Mukesh Kapse", email: "mukesh.kapse@hitechradiators.com", role: "ProductionSupervisor", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SE-001", status: "Active", shiftPreference: "A", assignedStages: ["S14"] },
  { username: "pradik.patil", password: "shift2026", name: "Pradik Patil", email: "pradik.patil@hitechradiators.com", role: "ProductionSupervisor", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SE-002", status: "Active", shiftPreference: "B", assignedStages: ["S14"] },
  { username: "akash.patil.galv", password: "shift2026", name: "Akash Patil", email: "akash.patil@hitechradiators.com", role: "ProductionSupervisor", department: "Production", plant: "K2", phone: "", employeeId: "HTR-SE-003", status: "Active", shiftPreference: "A", assignedStages: ["S14"] },

  // ===== QUALITY - Fabrication & Welding =====
  // Line Manager / Asst. Manager - Quality Fabrication
  { username: "rohit.giri", password: "qual2026", name: "Rohit Giri", email: "rohit.giri@hitechradiators.com", role: "QualityManager", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QM-001", status: "Active", shiftPreference: "General", managedStages: ["S01","S02","S03","S04","S05","S06","S07","S11","S12","S13"] },
  // Shift Engineer / Inspector - Quality Fabrication
  { username: "rohan.ghodvinde", password: "qc2026", name: "Rohan Ghodvinde", email: "rohan.ghodvinde@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-001", status: "Active", shiftPreference: "A", assignedStages: ["S01","S02","S03","S04","S05","S06","S07"] },
  { username: "chaitanya.aher", password: "qc2026", name: "Chaitanya Aher", email: "chaitanya.aher@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-002", status: "Active", shiftPreference: "B", assignedStages: ["S01","S02","S03","S04","S05","S06","S07"] },

  // ===== QUALITY - Paint & Final =====
  // Line Manager / Senior Manager - Galva Quality
  { username: "nirmal.kumar", password: "qual2026", name: "Nirmal Kumar", email: "nirmal.kumar@hitechradiators.com", role: "QualityManager", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QM-002", status: "Active", shiftPreference: "General", managedStages: ["S14"] },
  // Shift Engineer / Incharge - Galva
  { username: "rahul.patil", password: "qc2026", name: "Rahul Patil", email: "rahul.patil@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-003", status: "Active", shiftPreference: "A", assignedStages: ["S14"] },
  // Shift Engineer / Incharge - Internal Coating / Paint Shop
  { username: "rohit.dhakre", password: "qc2026", name: "Rohit Dhakre", email: "rohit.dhakre@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-004", status: "Active", shiftPreference: "A", assignedStages: ["S20","S21","S22","S23","S24"] },
  { username: "rakesh.ghosalkar", password: "qc2026", name: "Rakesh Ghosalkar", email: "rakesh.ghosalkar@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-005", status: "Active", shiftPreference: "B", assignedStages: ["S20","S21","S22","S23","S24"] },
  { username: "manish.ramdhane", password: "qc2026", name: "Manish Ramdhane", email: "manish.ramdhane@hitechradiators.com", role: "QCInspector", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-QC-006", status: "Active", shiftPreference: "A", assignedStages: ["S27","S28","S29","S30","S31"] },

  // ===== MAINTENANCE =====
  // Line Manager / Senior Manager - Maintenance
  { username: "nikhil.singh", password: "maint2026", name: "Nikhil Singh", email: "nikhil.singh@hitechradiators.com", role: "MaintenanceCalibration", department: "Maintenance", plant: "K2", phone: "", employeeId: "HTR-MC-001", status: "Active", shiftPreference: "General" },
  // Shift Engineer / Technician - Maintenance
  { username: "antaryami.dehury", password: "maint2026", name: "Antaryami Dehury", email: "antaryami.dehury@hitechradiators.com", role: "MaintenanceCalibration", department: "Maintenance", plant: "K2", phone: "", employeeId: "HTR-MC-002", status: "Active", shiftPreference: "A" },
  { username: "akash.patil.maint", password: "maint2026", name: "Akash Patil", email: "akash.patil.maint@hitechradiators.com", role: "MaintenanceCalibration", department: "Maintenance", plant: "K2", phone: "", employeeId: "HTR-MC-003", status: "Active", shiftPreference: "B" },
  { username: "shahbaz.jalgaonkar", password: "maint2026", name: "Shahbaz Jalgaonkar", email: "shahbaz.jalgaonkar@hitechradiators.com", role: "MaintenanceCalibration", department: "Maintenance", plant: "K2", phone: "", employeeId: "HTR-MC-004", status: "Active", shiftPreference: "A" },

  // ===== DISPATCH - K2 =====
  // Senior Engineer - Dispatch
  { username: "shailesh.rane", password: "dispatch2026", name: "Shailesh Rane", email: "shailesh.rane@hitechradiators.com", role: "DispatchEngineer", department: "Dispatch", plant: "K2", phone: "", employeeId: "HTR-DI-001", status: "Active", shiftPreference: "General" },
  // Line Manager / Engineer - Dispatch
  { username: "rupesh.deshmukh", password: "dispatch2026", name: "Rupesh Deshmukh", email: "rupesh.deshmukh@hitechradiators.com", role: "DispatchEngineer", department: "Dispatch", plant: "K2", phone: "", employeeId: "HTR-DI-002", status: "Active", shiftPreference: "A" },

  // ===== OPERATORS (sample operators per stage for inspection forms) =====
  { username: "operator.fab.a", password: "operator2026", name: "Operator Fab A-Shift", email: "operator.fab.a@hitechradiators.com", role: "Operator", department: "Production", plant: "K2", phone: "", employeeId: "HTR-OP-001", status: "Active", shiftPreference: "A", assignedStages: ["S01","S02","S03"] },
  { username: "operator.fab.b", password: "operator2026", name: "Operator Fab B-Shift", email: "operator.fab.b@hitechradiators.com", role: "Operator", department: "Production", plant: "K2", phone: "", employeeId: "HTR-OP-002", status: "Active", shiftPreference: "B", assignedStages: ["S01","S02","S03"] },
  { username: "operator.paint.a", password: "operator2026", name: "Operator Paint A-Shift", email: "operator.paint.a@hitechradiators.com", role: "Operator", department: "Paint", plant: "K2", phone: "", employeeId: "HTR-OP-003", status: "Active", shiftPreference: "A", assignedStages: ["S20","S21","S23","S24"] },
  { username: "operator.galv.a", password: "operator2026", name: "Operator Galv A-Shift", email: "operator.galv.a@hitechradiators.com", role: "Operator", department: "Production", plant: "K2", phone: "", employeeId: "HTR-OP-004", status: "Active", shiftPreference: "A", assignedStages: ["S14"] },

  // ===== AUDITOR (read-only) =====
  { username: "auditor", password: "audit2026", name: "Auditor", email: "auditor@hitech.com", role: "Auditor", department: "Quality", plant: "K2", phone: "", employeeId: "HTR-AU-001", status: "Active", shiftPreference: "General" },
];

async function seedUsers() {
  console.log("Seeding QMS users from real org structure...");
  await db.qmsUser.deleteMany();

  for (const u of USERS) {
    await db.qmsUser.create({
      data: {
        username: u.username,
        password: u.password,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        plant: u.plant,
        phone: u.phone,
        employeeId: u.employeeId,
        status: u.status,
        shiftPreference: u.shiftPreference,
        assignedStages: u.assignedStages ? JSON.stringify(u.assignedStages) : null,
        managedStages: u.managedStages ? JSON.stringify(u.managedStages) : null,
      },
    });
  }

  console.log(`Seeded ${USERS.length} users.`);
  console.log("Roles breakdown:");
  const roles: Record<string, number> = {};
  for (const u of USERS) roles[u.role] = (roles[u.role] || 0) + 1;
  for (const [r, c] of Object.entries(roles)) console.log(`  ${r}: ${c}`);
}

seedUsers().catch(e => { console.error(e); process.exit(1); });
