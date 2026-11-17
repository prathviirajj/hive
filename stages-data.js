const fs = require('fs');
const path = require('path');

// Read logos
const htrLogoPath = path.resolve('public/htr-logo.png');
const htrLogoBase64 = fs.existsSync(htrLogoPath) ? fs.readFileSync(htrLogoPath).toString('base64') : '';
const logoDataUri = `data:image/png;base64,${htrLogoBase64}`;

const hiTechLogoPath = path.resolve('public/hi-tech-logo.png');
const hiTechLogoBase64 = fs.existsSync(hiTechLogoPath) ? fs.readFileSync(hiTechLogoPath).toString('base64') : '';
const hiTechLogoDataUri = `data:image/png;base64,${hiTechLogoBase64}`;

const STAGES = [
  {
    id: "S1",
    name: "Enquiry, RFQ, Technical Feasibility and Quotation",
    docRef: "SOP/SALES/01",
    owner: "Sales, Engineering, Costing",
    tag: "[CONFIRMED]",
    meaning: "The customer asks for radiator pricing and specifications. Hi-Tech checks if the design can be manufactured safely and accurately, calculates costs, and submits an official price quote.",
    terminology: [
      { term: "RFQ (Request for Quotation)", def: "Customer formal document specifying radiator dimensions, quantity, delivery target, and test standards." },
      { term: "Technical Feasibility", def: "Engineering review to ensure sheet thickness, fin pitch, header size, and paint meet factory capability." },
      { term: "CC Distance", def: "Center-to-center distance between top and bottom oil header pipes." }
    ],
    example: "SPTC sends an inquiry for 12 units of 2900/1900 CC radiators with AkzoNobel 5-layer paint. Sales coordinates with Engineering to verify tool tooling for 26/3 fin elements before quoting.",
    table: [
      { item: "1. Trigger", text: "Customer email, portal tender, or RFQ document received." },
      { item: "2. Responsible", text: "Sales Manager with Head of Engineering and Costing." },
      { item: "3. Inputs", text: "Customer specification sheet, preliminary outline drawing, paint specification, requested delivery dates." },
      { item: "4. Activities", text: "1. Log inquiry in CRM. 2. Cross-check envelope dimensions against tooling catalog. 3. Calculate raw steel, paint, and labor costs. 4. Generate quote proposal." },
      { item: "5. Machines / Tools", text: "CRM / ERP system, CAD viewer, standard costing sheet." },
      { item: "6. Records Captured", text: "Inquiry ID, customer name, target delivery date, quoted price, technical feasibility checklist." },
      { item: "7. Quality & Safety Checks", text: "Verify that requested pressure rating (e.g. 2.0 kg/cm2) matches production capability." },
      { item: "8. Failure Handling", text: "If non-standard tooling is needed, send engineering deviation request to customer or quote tooling surcharge." },
      { item: "9. Output", text: "Signed technical and commercial quotation submitted to customer." },
      { item: "10. Next Handoff", text: "Customer purchasing team for purchase order issuance (S2)." }
    ],
    states: {
      doc: "Sales logs inquiry into ERP within 24 hours and completes feasibility form within 48 hours.",
      actual: "Inquiries often arrive via WhatsApp or direct email, and technical checks are discussed verbally before quotation [VERIFY ON-SITE].",
      ideal: "Customer uploads RFQ into MES customer portal. The system auto-validates dimensions against standard tooling models and alerts Engineering if custom tooling is required."
    },
    mistakes: "Quoting without verifying paint system curing requirements or special flange PCD dimensions, causing margin loss or delays.",
    mesFeature: "MES-S01-01: Digital RFQ intake with automated design boundary checks and material cost calculation.",
    improvement: "RFQ turnaround time: measure baseline days from RFQ receipt to quote dispatch (target: under 48 hours).",
    verification: "Ask Sales: How do you confirm whether a customer paint specification requires special primer before quoting?"
  },
  {
    id: "S2",
    name: "Order / Contract / PO Receipt and Contract Review",
    docRef: "SOP/SALES/02",
    owner: "Sales, Production Planning, Quality",
    tag: "[CONFIRMED]",
    meaning: "The customer sends an official Purchase Order. Hi-Tech verifies that the price, quantity, delivery schedule, and technical standards match the accepted quote before accepting the contract.",
    terminology: [
      { term: "PO (Purchase Order)", def: "Legally binding document from the buyer authorizing manufacture." },
      { term: "Contract Review", def: "Formal cross-functional check that technical terms, commercial terms, and delivery dates are realistic." },
      { term: "QAP (Quality Assurance Plan)", def: "Agreed inspection stages, customer hold points, and witness requirements." }
    ],
    example: "Delta Star issues PO 1185452 for 36-fin radiators with ANSI 70 gray paint. Sales, Quality, and Planning review the PO terms and customer drawing RAD-090-36-20.5G.",
    table: [
      { item: "1. Trigger", text: "Receipt of signed customer PO or contract amendment." },
      { item: "2. Responsible", text: "Sales Coordinator, PPC Manager, Head of Quality." },
      { item: "3. Inputs", text: "Customer PO, final quote, customer drawings, approved technical specifications." },
      { item: "4. Activities", text: "1. Compare PO price and specifications against quotation. 2. Check plant capacity for requested shipping date. 3. Sign off contract review sheet. 4. Issue order confirmation." },
      { item: "5. Machines / Tools", text: "ERP sales module, contract review workflow, capacity scheduler." },
      { item: "6. Records Captured", text: "Sales Order number (SO), customer PO number, promised delivery date, signed contract review sheet." },
      { item: "7. Quality & Safety Checks", text: "Verify whether customer inspection witness or third-party inspection (TPI) is mandatory." },
      { item: "8. Failure Handling", text: "Discrepancy in price, drawing revision, or schedule triggers immediate clarification notice to customer." },
      { item: "9. Output", text: "Confirmed Sales Order (SO) in system and formal Order Acknowledgment sent to customer." },
      { item: "10. Next Handoff", text: "Engineering for NPI review (S3) or Master Data linking (S4)." }
    ],
    states: {
      doc: "Contract review completed and signed by Sales, PPC, and Quality within 24 hours of PO receipt.",
      actual: "PO is accepted in ERP immediately, with technical checks completed after order entry [VERIFY ON-SITE].",
      ideal: "Automated contract review workflow in MES where Sales, Planning, and Quality digitally sign off before the SO can release work orders."
    },
    mistakes: "Missing a customer drawing revision note attached to the PO, resulting in fabricating to an obsolete drawing.",
    mesFeature: "MES-S02-01: Multi-role contract review gate with drawing revision verification and customer hold point locks.",
    improvement: "Contract review cycle time: measure baseline hours from PO upload to release for production.",
    verification: "Ask Quality Manager: How do you identify if a PO requires customer witness inspection at leak testing?"
  },
  {
    id: "S3",
    name: "New Product Introduction / Change Handling (APQP, PPAP, ECN)",
    docRef: "SOP/ENG/01",
    owner: "R&D, Engineering, Quality, Production",
    tag: "[CONFIRMED]",
    meaning: "When a radiator model is brand new or has an engineering change, the team develops detailed drawings, tooling plans, risk analysis, and sample prototypes before full production.",
    terminology: [
      { term: "APQP", def: "Advanced Product Quality Planning - a structured framework to launch products with zero defects." },
      { term: "PPAP", def: "Production Part Approval Process - samples and test records proving process capability." },
      { term: "ECN (Engineering Change Notice)", def: "Official document authorizing a change in dimensions, material, or routing." }
    ],
    example: "A customer requests changing the air release plug from DIN 42558-M6 to 3/4 inch NPT with brass plug. Engineering issues an ECN with updated drawings and jig modifications.",
    table: [
      { item: "1. Trigger", text: "New radiator part number or receipt of customer ECN." },
      { item: "2. Responsible", text: "Lead Design Engineer, Quality Manager, Tooling Engineer." },
      { item: "3. Inputs", text: "Customer engineering drawings, 3D CAD models, material specifications, customer QAP." },
      { item: "4. Activities", text: "1. Prepare internal GA drawings and manufacturing blue-prints. 2. Develop Process FMEA (PFMEA) and Control Plan. 3. Validate tooling and welding dies. 4. Fabricate prototype / pilot unit. 5. Compile PPAP dossier." },
      { item: "5. Machines / Tools", text: "SolidWorks 3D CAD, CAM software, pilot assembly jig, measurement CMM/table." },
      { item: "6. Records Captured", text: "Internal drawing number, revision status, PFMEA report, Control Plan, initial sample inspection report (ISIR)." },
      { item: "7. Quality & Safety Checks", text: "Complete dimensional layout inspection and burst pressure testing on prototype." },
      { item: "8. Failure Handling", text: "If prototype fails leak or dimensional test, revise tooling layout and conduct root cause analysis before approval." },
      { item: "9. Output", text: "Approved engineering drawing package, active revision code, and customer-approved PPAP / first-article." },
      { item: "10. Next Handoff", text: "Master Data setup (S4) to configure production BOM and routing." }
    ],
    states: {
      doc: "APQP phase reviews conducted with cross-functional sign-offs at each design milestone.",
      actual: "Drawings are created in CAD and printed as PDFs. Control plans are updated in Excel [VERIFY ON-SITE].",
      ideal: "Digital APQP workbench in MES linking 3D CAD models directly to station checksheet parameters and inspection criteria."
    },
    mistakes: "Shopfloor using paper drawings with outdated revision marks while engineering holds the new revision in CAD.",
    mesFeature: "MES-S03-01: Centralized revision management showing only the latest approved CAD drawing on shopfloor tablets.",
    improvement: "Engineering drawing release cycle time and revision mismatch incidents (target: 0 obsolete drawings on floor).",
    verification: "Ask Design Engineer: How do you withdraw obsolete drawings from line workstations when an ECN is released?"
  },
  {
    id: "S4",
    name: "Master Data Setup (Item Master, BOM, Routing, Control Plan)",
    docRef: "SOP/IT/ENG/01",
    owner: "Engineering, Quality, IT",
    tag: "[CONFIRMED]",
    meaning: "Entering and verifying all baseline engineering data in the system, including part numbers, Bill of Materials (BOM), standard manufacturing stages, and quality inspection limits.",
    terminology: [
      { term: "BOM (Bill of Materials)", def: "Complete list of raw steel, pipes, flanges, paint, and fittings needed for one radiator." },
      { term: "Routing", def: "The exact sequence of manufacturing stations and operations (S01 to S17)." },
      { term: "Checksheet Master", def: "The exact parameters, nominal values, and tolerance limits enforced at each stage." }
    ],
    example: "Configuring Work Order BOM for SPTC 2900/1900 CC: 1.20 mm CRCA steel coil, 80 NB ERW pipe (4.5 mm thick), PCD 160 flange, AkzoNobel 5-coat paint formula.",
    table: [
      { item: "1. Trigger", text: "Approved engineering drawing package and customer part number release." },
      { item: "2. Responsible", text: "Master Data Specialist, Lead Production Engineer, Quality Engineer." },
      { item: "3. Inputs", text: "Approved drawing, material specifications, standard times, tooling lists." },
      { item: "4. Activities", text: "1. Create Item Master with unique part code. 2. Build multi-level BOM. 3. Define routing sequence with standard cycle times. 4. Configure inspection checksheet with CTQ limits." },
      { item: "5. Machines / Tools", text: "ERP Master Data module, MES routing editor, QMS checksheet template builder." },
      { item: "6. Records Captured", text: "Part Master code, BOM version, routing ID, checksheet configuration ID, approval digital signatures." },
      { item: "7. Quality & Safety Checks", text: "Engineering and Quality double sign-off required to activate routing." },
      { item: "8. Failure Handling", text: "Any data inconsistency flags an automatic system block, preventing Work Order release." },
      { item: "9. Output", text: "Activated Master Data package ready for production planning." },
      { item: "10. Next Handoff", text: "PPC / Demand Planning for MRP calculation and scheduling (S5)." }
    ],
    states: {
      doc: "Master data created in ERP and verified by Quality before any production order is issued.",
      actual: "BOM is entered in ERP, but checksheet limits are often managed on printed paper forms [VERIFY ON-SITE].",
      ideal: "Unified master data: single database where updating drawing tolerances automatically updates digital shopfloor tablets."
    },
    mistakes: "Entering incorrect nominal thickness (1.0 mm instead of 1.2 mm) leading to wrong raw coil issuance.",
    mesFeature: "MES-S04-01: Synchronized BOM and digital checksheet configurator with role-based engineering freeze locks.",
    improvement: "Master data setup accuracy rate (target: 100% first-time-right master data releases).",
    verification: "Ask IT / Engineering: What is the formal approval process before a revised BOM goes live in production?"
  },
  {
    id: "S5",
    name: "Demand Planning, MRP, Capacity Check and Production Plan",
    docRef: "SOP/PPC/01",
    owner: "Production Planning and Control (PPC)",
    tag: "[CONFIRMED]",
    meaning: "Planning calculates raw material requirements (steel coils, pipes, paint) using Material Requirements Planning (MRP), verifies machine capacity, and schedules the production calendar.",
    terminology: [
      { term: "MRP", def: "Material Requirements Planning - calculating what materials to order and when based on demand." },
      { term: "Capacity Check", def: "Ensuring available machine hours (e.g. seam welders, paint booths) can fulfill the schedule." },
      { term: "Production Plan", def: "Weekly and daily scheduled sequence of radiator batches by plant line." }
    ],
    example: "PPC plans the monthly schedule for Plant K2, sequencing 135 units of SPTC radiators and 15 units of Delta Star radiators to optimize rolling die setups.",
    table: [
      { item: "1. Trigger", text: "Approved Sales Orders and master production schedule requirements." },
      { item: "2. Responsible", text: "PPC Manager, Production Heads (K1 and K2)." },
      { item: "3. Inputs", text: "Active Sales Orders, stock on hand, open purchase orders, machine availability status." },
      { item: "4. Activities", text: "1. Run MRP to identify material net requirements. 2. Check line bottlenecks (welding and leak test capacity). 3. Create weekly production schedule. 4. Release purchase requisitions." },
      { item: "5. Machines / Tools", text: "ERP planning module, finite capacity scheduling board." },
      { item: "6. Records Captured", text: "Production Plan ID, planned start and finish dates, machine loading forecasts, material requisitions." },
      { item: "7. Quality & Safety Checks", text: "Confirm that scheduled radiator models have valid active drawing revisions." },
      { item: "8. Failure Handling", text: "If capacity is overloaded, reschedule batches, authorize overtime, or shift volume between K1 and K2." },
      { item: "9. Output", text: "Approved Weekly Production Schedule and material reservation requests." },
      { item: "10. Next Handoff", text: "Purchase for procurement (S6) and Stores for material staging (S7)." }
    ],
    states: {
      doc: "Weekly schedule issued every Friday after capacity balancing and material availability checks.",
      actual: "Planning uses Excel scheduling spreadsheets and adjusts schedules daily based on steel coil arrivals [VERIFY ON-SITE].",
      ideal: "Real-time MES dispatch board with dynamic capacity constraints and live inventory reservation links."
    },
    mistakes: "Scheduling a batch when required steel coil grade or paint primer is not physically in stock.",
    mesFeature: "MES-S05-01: Automated finite capacity scheduling board with live inventory reservation interlocks.",
    improvement: "Schedule adherence percentage: measure baseline planned vs actual batch start dates.",
    verification: "Ask PPC Planner: How do you verify paint booth throughput when scheduling heavy 5-coat radiators?"
  },
  {
    id: "S6",
    name: "Procurement, Supplier Delivery and Incoming Inspection (RM QC)",
    docRef: "SOP/PUR/01, QCI/F/01/01",
    owner: "Purchase, Stores, Incoming Quality (IQC)",
    tag: "[CONFIRMED]",
    meaning: "Purchasing orders raw materials. When steel coils, ERW pipes, flanges, and paints arrive at the plant, Incoming Quality tests them against standards before releasing them to stock.",
    terminology: [
      { term: "MTC (Mill Test Certificate)", def: "Manufacturer certificate showing chemical composition and mechanical strength of steel." },
      { term: "CRCA Steel", def: "Cold Rolled Close Annealed steel conforming to IS 513:2016 CR2 Grade D." },
      { term: "Goods Receipt Note (GRN)", def: "Warehouse record confirming physical delivery of materials." }
    ],
    example: "Tata Steel delivers 20 tons of 1.20 mm CRCA coil. Incoming Inspector verifies coil tag, checks thickness with digital micrometer, tests hardness, and scans the MTC into system.",
    table: [
      { item: "1. Trigger", text: "PPC material requisition or automated re-order point alert." },
      { item: "2. Responsible", text: "Purchase Officer, Stores Inward Clerk, Incoming Quality Inspector." },
      { item: "3. Inputs", text: "Approved Purchase Order, supplier delivery challan, Mill Test Certificate (MTC), raw material specification." },
      { item: "4. Activities", text: "1. Physical unloading and count verification. 2. Verify MTC against steel grade specifications. 3. Inspect thickness, width, surface finish, and coil waviness. 4. Record inspection in checksheet. 5. Apply Green Accepted tag or Red Rejected tag." },
      { item: "5. Machines / Tools", text: "Digital micrometer, Vernier caliper, hardness tester, coating thickness gauge, barcode printer." },
      { item: "6. Records Captured", text: "GRN number, heat number, coil serial, measured thickness, hardness value, MTC document attachment, inspector sign-off." },
      { item: "7. Quality & Safety Checks", text: "Checksheet parameters: Sheet thickness (1.00 or 1.20 mm ±0.03 mm), width (520 mm ±1.0 mm), zero rust or edge burrs. Wear safety boots and cut-resistant gloves during coil handling." },
      { item: "8. Failure Handling", text: "If thickness or chemistry fails, quarantine coil immediately, attach Red Hold Tag, generate NCR in system, and notify supplier for replacement." },
      { item: "9. Output", text: "Digitally accepted raw material lots with serialized barcode tracking tags." },
      { item: "10. Next Handoff", text: "Stores for warehouse location putaway and inventory logging (S7)." }
    ],
    states: {
      doc: "Every steel coil and chemical batch inspected against sampling plan and MTC verified before GRN.",
      actual: "MTC is checked and filed on paper. Visual inspection is done on floor, with data logged in logbook [VERIFY ON-SITE].",
      ideal: "Mobile tablet IQC app: inspector scans coil barcode, takes digital micrometer reading via Bluetooth, attaches MTC photo, and system auto-generates ERP GRN upon pass."
    },
    mistakes: "Accepting a steel coil with edge waviness or thickness variation exceeding ±0.04 mm, causing seam welding burns downstream.",
    mesFeature: "MES-S06-01: Digital incoming inspection checksheet with Bluetooth gauge integration, MTC attachment, and automatic quarantine locks.",
    improvement: "Incoming lot rejection rate and inspection logging turnaround time (target: 100% digital traceability to mill heat number).",
    verification: "Ask Incoming Inspector: What specific checks do you perform on ERW header pipes before accepting them for cutting?"
  },
  {
    id: "S7",
    name: "Material Storage, Kitting and Issue to Production",
    docRef: "SOP/STR/01",
    owner: "Stores / Warehouse",
    tag: "[CONFIRMED]",
    meaning: "Storing raw materials in designated rack and bay locations. When a Work Order is scheduled, Stores kits the exact coils, pipes, flanges, and accessories needed and transfers them to the shopfloor.",
    terminology: [
      { term: "Kitting", def: "Gathering all parts and raw materials for a specific batch into one staged pallet." },
      { term: "FIFO", def: "First-In, First-Out inventory rotation to prevent material aging or surface oxidation." },
      { term: "Line-Side Staging", def: "Pre-staging materials adjacent to the machine to eliminate operator waiting time." }
    ],
    example: "Stores kits 12 sets of 80 NB header pipes, 24 PCD 160 flanges, and DIN 42558 plugs for Work Order WO-3004, staging them at the Header Pre-treatment area.",
    table: [
      { item: "1. Trigger", text: "Work Order material picklist generated by PPC schedule." },
      { item: "2. Responsible", text: "Stores Executive, Material Handler, Forklift Operator." },
      { item: "3. Inputs", text: "Released Work Order picklist, accepted material inventory in warehouse." },
      { item: "4. Activities", text: "1. Locate accepted coil lot and pipe bundles via bin management. 2. Verify FIFO sequence. 3. Scan material barcode tags. 4. Transfer materials to line-side staging racks. 5. Confirm issue in system." },
      { item: "5. Machines / Tools", text: "Overhead crane, forklift, barcode scanner, warehouse bin racking." },
      { item: "6. Records Captured", text: "Issue slip number, Work Order number, coil lot number issued, issued quantity, timestamp, issuer and receiver signatures." },
      { item: "7. Quality & Safety Checks", text: "Verify that material has not developed surface rust during storage. Enforce safe crane rigging protocols." },
      { item: "8. Failure Handling", text: "If stock is missing or physically damaged, trigger material shortage alert and request immediate replacement." },
      { item: "9. Output", text: "Physically staged material kits with verified traceability tags at machine stations." },
      { item: "10. Next Handoff", text: "Production operators at Component Manufacturing (S9)." }
    ],
    states: {
      doc: "Materials issued strictly against authorized Work Order picklist using FIFO rotation.",
      actual: "Coils are moved by crane based on physical access in bay, sometimes bypassing FIFO [VERIFY ON-SITE].",
      ideal: "Warehouse Management System (WMS) module in MES directing crane operators to the exact FIFO rack location and validating scan before line delivery."
    },
    mistakes: "Issuing 1.0 mm steel coil instead of 1.2 mm coil because both were stored in the same raw bay without clear visual differentiation.",
    mesFeature: "MES-S07-01: Barcode scan verification on material issue: system sounds error alarm if wrong coil grade or thickness is scanned for a Work Order.",
    improvement: "Kitting accuracy and line-side material delivery time (target: zero wrong-material issue incidents).",
    verification: "Ask Stores Executive: How do you prevent mixing up standard MS flanges with specialized customer-specific PCD flanges?"
  },
  {
    id: "S8",
    name: "Work Order Release, Scheduling and Dispatch List",
    docRef: "SOP/PPC/02",
    owner: "Planning, Shopfloor Production Supervision",
    tag: "[CONFIRMED]",
    meaning: "Planning formally authorizes the factory to build a batch of radiators by generating a digital Work Order with defined sequence, quantities, target dates, and serialized tracking units.",
    terminology: [
      { term: "Work Order (WO)", def: "Official manufacturing authorization specifying product model, batch size, and route." },
      { term: "HTU Serial Number", def: "Hi-Tech Unit unique serialized barcode assigned to every single radiator unit." },
      { term: "Dispatch List", def: "The prioritized queue of jobs displayed at each machine station." }
    ],
    example: "PPC releases WO-3004 for 12 radiator units, generating serial numbers HTU-3004-001 through HTU-3004-012, pushing the job directly to the Rolling operator's tablet.",
    table: [
      { item: "1. Trigger", text: "Material kit confirmed staged at line and machine capacity ready." },
      { item: "2. Responsible", text: "PPC Planner, Shopfloor Shift Supervisor." },
      { item: "3. Inputs", text: "Confirmed Sales Order, verified routing, staged raw material lot numbers." },
      { item: "4. Activities", text: "1. Release WO in MES. 2. Auto-generate unit serial numbers (HTU barcodes). 3. Assign 4-tier crew (Operator, Checker, Inspector, Approver). 4. Populate digital dispatch list on station tablets." },
      { item: "5. Machines / Tools", text: "MES scheduling console, shopfloor operator touch tablets, barcode printer." },
      { item: "6. Records Captured", text: "WO number, batch size, planned start/end dates, assigned operators, HTU serial range, checksheet revision code." },
      { item: "7. Quality & Safety Checks", text: "System verifies that drawing revision and checksheet parameters match active customer specifications." },
      { item: "8. Failure Handling", text: "If engineering changes are pending, the system locks WO release until change review is finalized." },
      { item: "9. Output", text: "Active Work Order ready on shopfloor operator tablets with printable traveler barcodes." },
      { item: "10. Next Handoff", text: "Shopfloor operators to commence physical fabrication (S9)." }
    ],
    states: {
      doc: "Work Orders printed with paper job traveler attached to material batch pallet.",
      actual: "Paper travelers travel with the batch, but signatures are often filled at the end of the shift [VERIFY ON-SITE].",
      ideal: "Paperless digital traveler: operator scans HTU serial on tablet, viewing active 3D drawings, checksheet limits, and real-time instructions."
    },
    mistakes: "Releasing a Work Order before raw material inspection is fully approved in system, risking scrap.",
    mesFeature: "MES-S08-01: Digital dispatch list with automated release gates verifying material readiness and drawing currency.",
    improvement: "Work Order release to production cycle time and traveler loss rate (target: 100% paperless digital travelers).",
    verification: "Ask Shift Supervisor: How do operators know which Work Order has highest priority when multiple batches are on the floor?"
  },
  {
    id: "S9",
    name: "Component Manufacturing (Fin Rolling, Forming, Header Cutting)",
    docRef: "QCI/F/02/01, QCI/F/02/08",
    owner: "Fabrication Production, Line Quality",
    tag: "[CONFIRMED]",
    meaning: "Transforming flat steel coil into corrugated radiator fins through cold rolling and die forming, and cutting ERW steel pipes to exact length with plasma and deburring.",
    terminology: [
      { term: "Rolling Depth", def: "Depth of the formed corrugation flute (nominal 4.0 to 5.0 mm)." },
      { term: "Sheet Waviness", def: "Surface distortion across the rolled sheet (must be Nil / Conforming)." },
      { term: "Neck-to-Neck Distance", def: "Precision distance between fin oil flow ports (e.g. 1700 mm ±1.0 mm)." }
    ],
    example: "At Station S01, the operator cold-rolls 1.0 mm CRCA coil into radiator fins. Operator measures rolling depth at 4.65 mm, die depth at 4.15 mm, and confirms zero waviness.",
    table: [
      { item: "1. Trigger", text: "Work Order selected on machine station tablet." },
      { item: "2. Responsible", text: "Machine Operator, Line Quality Checker, Tooling Technician." },
      { item: "3. Inputs", text: "Staged steel coil lot, cutting dies, plasma torch, drawing dimensional specifications." },
      { item: "4. Activities", text: "1. First piece setup and alignment. 2. Cold rolling and die pressing of fins. 3. Fin length cutting. 4. Plasma pipe cutting and deburring. 5. Record dimensional checks in checksheet." },
      { item: "5. Machines / Tools", text: "Fin rolling line, hydraulic forming press, CNC plasma cutter, pipe deburring machine, digital depth micrometer, Vernier caliper, steel tape." },
      { item: "6. Records Captured", text: "Coil heat lot scanned, sheet thickness, sheet width, rolling depth, die depth, neck-to-neck distance, cut fin dimensions, pipe length, operator ID." },
      { item: "7. Quality & Safety Checks", text: "First-piece inspection approval before continuous run. CTQ parameters: Rolling Depth (4.0-5.0 mm), Waviness (Nil), Neck-to-Neck (±1.0 mm). Mandatory eye protection and earplugs." },
      { item: "8. Failure Handling", text: "If rolling depth drifts beyond 5.0 mm, stop machine immediately, adjust roll gap, tag defective fins for scrap, and re-verify first piece." },
      { item: "9. Output", text: "Inspected and stacked corrugated radiator fins and cut deburred header pipes." },
      { item: "10. Next Handoff", text: "Single Spot Welding (S11A) and Core Assembly (S10)." }
    ],
    states: {
      doc: "First piece inspected by QC and recorded on checksheet QCI/F/02/01 every shift or coil change.",
      actual: "Operators check dimensions with calipers, but records are often entered retrospectively on paper [VERIFY ON-SITE].",
      ideal: "Tablet checksheet with Bluetooth gauge data capture: measurements sync instantly, and system prevents machine start if first piece is outside tolerance."
    },
    mistakes: "Worn forming dies causing unequal flute depth on left and right sides, resulting in oil flow restriction or twisted assemblies.",
    mesFeature: "MES-S09-01: Station tablet checksheet with direct digital caliper capture, first-piece sign-off gate, and SPC run chart display.",
    improvement: "First-piece setup time and scrap rate at coil changeover (target: reduce setup scrap by 30%).",
    verification: "Ask Rolling Operator: How many sample fins do you measure across a 50-fin batch, and how do you detect die wear?"
  },
  {
    id: "S10",
    name: "Core Assembly and Pitch Alignment",
    docRef: "QCI/F/02/09",
    owner: "Assembly Production, Quality",
    tag: "[CONFIRMED]",
    meaning: "Stacking the formed fin elements into an assembly jig, setting the exact element count and pitch spacing with comb gauges, and verifying core squareness before welding.",
    terminology: [
      { term: "Element Pitch", def: "Center-to-center distance between adjacent radiator fins (nominal 45 mm ±1.0 mm)." },
      { term: "Comb Gauge", def: "Specialized toothed tooling fixture used to enforce uniform fin spacing." },
      { term: "Diagonal Difference", def: "Difference between corner-to-corner measurements to verify core squareness (max 3.0 mm)." }
    ],
    example: "Assembly crew stacks 26 fin elements for SPTC radiator in the assembly fixture, using a 45 mm comb gauge to maintain pitch, measuring total width at 1495 mm.",
    table: [
      { item: "1. Trigger", text: "Completion and inspection of fin batches and header pipes." },
      { item: "2. Responsible", text: "Assembly Fitter, Production Supervisor, Quality Checker." },
      { item: "3. Inputs", text: "Inspected fins, comb fixtures, assembly jig, drawing layout specs." },
      { item: "4. Activities", text: "1. Load fins into comb fixture. 2. Verify element count (e.g. 26 or 36 elements). 3. Clamp assembly jig to nominal width. 4. Measure pitch spacing, diagonal squareness, and total width. 5. Log inspection." },
      { item: "5. Machines / Tools", text: "Hydraulic clamping jig, precision comb gauges, calibrated measuring tape, right-angle framing square." },
      { item: "6. Records Captured", text: "HTU serial scanned, element count, pitch spacing (mm), total core width, diagonal difference, operator ID." },
      { item: "7. Quality & Safety Checks", text: "CTQ Check: Element pitch 45 ±1.0 mm, diagonal difference ≤ 3.0 mm, no bent fin flutes. Pinch point hazard precautions." },
      { item: "8. Failure Handling", text: "If pitch is uneven or diagonal difference exceeds 3.0 mm, loosen clamps, adjust fin alignment, and re-clamp." },
      { item: "9. Output", text: "Clamped and verified radiator core assembly ready for structural welding." },
      { item: "10. Next Handoff", text: "Welding operations (S11)." }
    ],
    states: {
      doc: "Core dimensions verified and recorded on traveler before releasing to welding.",
      actual: "Visual check done with comb gauge, but pitch measurements are rarely written down for every unit [VERIFY ON-SITE].",
      ideal: "Digital inspection station where operator scans HTU barcode and confirms pitch and squareness on tablet with pass/fail photo evidence."
    },
    mistakes: "Uneven clamping pressure causing pitch to fan out at one end, leading to header pipe fitment failure at erection.",
    mesFeature: "MES-S10-01: Unit serialization binding at assembly: scans link fin coil heat lot and pipe lot to the unique HTU barcode.",
    improvement: "Core dimensional conformance rate and fit-up rework at header welding (target: zero pitch misalignment defects).",
    verification: "Ask Assembly Fitter: What do you do when a fin has a minor bend during loading into the comb fixture?"
  },
  {
    id: "S11",
    name: "Joining Processes (Spot, Seam, TIG and MAG Welding) - Special Process",
    docRef: "QCI/F/02/02, 03, 04, 05, 07",
    owner: "Welding Production, Welding Quality, Maintenance",
    tag: "[CONFIRMED - SPECIAL PROCESS]",
    meaning: "Welding the radiator fin halves, edges, and headers together using resistance welding (spot, seam, cross-seam) and fusion welding (TIG, MAG) to create a leak-proof structural assembly.",
    terminology: [
      { term: "Pull-off / Nugget Test", def: "Destructive physical test tearing a weld nugget to verify weld penetration and fusion strength." },
      { term: "Seam Welding", def: "Continuous roller wheel resistance welding along the fin outer perimeter." },
      { term: "Electrode Sanding", def: "Periodic dressing and cleaning of copper welding wheels/electrodes to maintain conductivity." },
      { term: "WPS (Welding Procedure Specification)", def: "Qualified parameters for welding current, voltage, gas flow, and speed." }
    ],
    example: "At Seam Welding (S04), operator welds fin edges with 8.5 kA current at 2.2 m/min. Hourly nugget pull-off test confirms parent metal tear with zero cold weld.",
    table: [
      { item: "1. Trigger", text: "Clamped core delivered to welding station; start of shift / changeover." },
      { item: "2. Responsible", text: "Certified Welder / Robot Operator, Welding Inspector, Maintenance Technician." },
      { item: "3. Inputs", text: "Clamped core, qualified welding wire (AWS A5.18 ER70S-6), shielding gas (80/20 Ar/CO2), approved WPS." },
      { item: "4. Activities", text: "1. Perform electrode dressing. 2. Conduct mandatory start-of-shift nugget pull-off test on test coupons. 3. Execute spot welding of fin flutes. 4. Run longitudinal and cross seam welding. 5. Perform edge TIG welding. 6. Execute full MAG welding of header pipe and flanges. 7. Record welding current, voltage, and gas flow." },
      { item: "5. Machines / Tools", text: "Multi-spot welder, CNC seam welding machine, TIG welding inverter, MAG welding power source, gas flowmeter, tensile pull tester." },
      { item: "6. Records Captured", text: "Nugget pull-off test result (Pass/Fail), welding current (Amps), arc voltage (V), gas flow rate (L/min), electrode sanding count, operator ID." },
      { item: "7. Quality & Safety Checks", text: "CTQ Gates: Nugget pull-off parent metal failure required; zero seam burn-through; gas flow 14-18 L/min. Welding helmet, leather apron, local fume extraction active." },
      { item: "8. Failure Handling", text: "If pull-off test fails (button detachment without metal tear), stop line immediately. Quarantine all units welded since last valid test, dress electrodes, and recalibrate current." },
      { item: "9. Output", text: "Fully welded radiator body with sound structural joints and verified weld penetration." },
      { item: "10. Next Handoff", text: "Spatter removal and Leak Testing (S12)." }
    ],
    states: {
      doc: "Nugget tests conducted every shift, electrode dressing recorded every 500 strokes, welding parameters locked per WPS.",
      actual: "Welders adjust current knobs manually based on visual arc sound. Pull-off tests done on scrap pieces without systematic logging [VERIFY ON-SITE].",
      ideal: "MES interlocked smart welding stations: current and gas flow captured via IoT sensors, and machine is locked until the operator logs a passing pull-off test photo."
    },
    mistakes: "Continuing to run seam welding with pitted or mushroomed copper wheels, causing micro-voids that only leak during pressure test.",
    mesFeature: "MES-S11-01: Special process parameter recording (Current, Voltage, Gas Flow) with mandatory nugget test sign-off locks and electrode dress counter.",
    improvement: "Weld defect rate and seam re-weld percentage (target: zero weld porosity and under-penetration defects).",
    verification: "Ask Seam Welder: How often do you clean and dress the copper welding wheels, and where is that logged?"
  },
  {
    id: "S12",
    name: "Leak and Pressure Integrity Testing - Special Process",
    docRef: "QCI/F/02/10",
    owner: "Testing Lab, Quality Inspector",
    tag: "[CONFIRMED - SPECIAL PROCESS]",
    meaning: "Submerging the welded radiator underwater under pneumatic air pressure, followed by hydrostatic pressure testing, to verify 100% leak-proof structural integrity.",
    terminology: [
      { term: "Pneumatic Water Dip Test", def: "Pressurizing radiator with air (nominal 1.6 to 2.0 kg/cm2) while fully submerged in illuminated water tank." },
      { term: "Holding Time", def: "Mandatory duration (minimum 30 minutes) under pressure to detect microscopic bubble leaks." },
      { term: "Hydrostatic Test", def: "High-pressure water test (e.g. 2.5 to 3.0 kg/cm2) verifying pressure vessel strength without deformation." }
    ],
    example: "Radiator HTU-3004-001 is submerged in the illuminated test tank at 2.0 kg/cm2 air pressure for 35 minutes. Inspector observes zero air bubble emergence across all fin joints.",
    table: [
      { item: "1. Trigger", text: "Welded radiator assembly arrives at testing station." },
      { item: "2. Responsible", text: "Certified Leak Test Operator, Quality Inspector." },
      { item: "3. Inputs", text: "Welded radiator, calibrated pressure gauge, clean testing water, quick-connect pneumatic sealing plugs." },
      { item: "4. Activities", text: "1. Mount sealing flanges and plugs. 2. Connect air supply and pressurize to specification. 3. Submerge radiator in clean water tank with underwater lighting. 4. Hold pressure for mandatory 30 minutes. 5. Inspect for bubble leaks. 6. Drain, dry with hot air, and log certificate." },
      { item: "5. Machines / Tools", text: "Overhead pneumatic immersion hoist, illuminated water testing tank, digital pressure transducer, hot air drying blower, calibrated test gauge." },
      { item: "6. Records Captured", text: "HTU serial scanned, test type (Pneumatic / Hydrostatic), test pressure (kg/cm2), hold start time, hold end time, result (Zero Leakage Pass / Leak Detected Fail), inspector ID." },
      { item: "7. Quality & Safety Checks", text: "CTQ Zero Tolerance Gate: 100% units must pass with zero bubbles. Tank water must be clean and illuminated. Safety pressure relief valve calibrated." },
      { item: "8. Failure Handling", text: "If leak occurs: mark exact leak location with paint pen, log leak coordinates in MES, move unit to Red Rework Quarantine Bay, and trigger Rework Job Order." },
      { item: "9. Output", text: "Certified leak-proof radiator assembly with digital Pressure Integrity Certificate." },
      { item: "10. Next Handoff", text: "Header assembly completion and Surface Preparation (S13, S14)." }
    ],
    states: {
      doc: "100% radiators tested for 30 minutes at specified pressure and signed off in register QCI/F/02/10.",
      actual: "Radiators are submerged and inspected visually. When busy, holding time may be reduced to 15-20 minutes [VERIFY ON-SITE].",
      ideal: "Automated digital leak test bench: PLC locks hoist underwater for full 30 minutes, records pressure decay curve, and uploads pass certificate to MES."
    },
    mistakes: "Releasing a radiator without complete internal moisture drying, causing internal flash rust before oil filling.",
    mesFeature: "MES-S12-01: Digital leak test timer and pressure logger: timer prevents premature hoist lift; test certificate linked to HTU serial.",
    improvement: "First-pass leak test yield (target: achieve >98% first-pass yield with zero escape leaks).",
    verification: "Ask Leak Test Inspector: How do you track the exact duration a unit stays submerged under pressure?"
  },
  {
    id: "S13",
    name: "Header Pipe Assembly, Erection, Bracing and Fittings",
    docRef: "QCI/F/02/06",
    owner: "Fabrication Production, Line Quality",
    tag: "[CONFIRMED]",
    meaning: "Fitting and welding top and bottom header pipes, flange connections, lifting lugs, bracing straps, earthing bosses, and drain/vent sockets with precision alignment.",
    terminology: [
      { term: "Flange Coplanarity (Pata)", def: "Flatness and angular alignment of top and bottom mounting flanges (max deviation ≤ 0.4 mm)." },
      { term: "Bracing Lug", def: "Structural steel support welded between radiator fins to prevent vibration during transformer operation." },
      { term: "PCD (Pitch Circle Diameter)", def: "Diameter of bolt hole pattern on header mounting flanges." }
    ],
    example: "Fitters assemble 80 NB ERW headers on Delta Star radiator, checking flange right-angle with framing square and verifying 3/4 inch NPT brass drain sockets.",
    table: [
      { item: "1. Trigger", text: "Core leak test approval and staging of pre-treated header pipes." },
      { item: "2. Responsible", text: "Erection Fitter, Certified Welder, Line Quality Inspector." },
      { item: "3. Inputs", text: "Tested core, deburred header pipes, flanges, lifting lugs, bracing rods, customer drawing." },
      { item: "4. Activities", text: "1. Pre-treat and inspect header internal pipe cleanliness. 2. Fit and tack header pipes to fin necks. 3. Verify CC distance and right-angle alignment. 4. Full MAG welding of header joints. 5. Tack and weld bracing, lifting lugs, and drain sockets. 6. Inspect flange coplanarity." },
      { item: "5. Machines / Tools", text: "Assembly erection table, framing squares, filler gauges, line dori (string line), MIG/MAG welding set, torque wrench." },
      { item: "6. Records Captured", text: "HTU serial scanned, measured CC distance, flange right-angle deviation, flange coplanarity (mm), bracing weld inspection, operator and inspector signatures." },
      { item: "7. Quality & Safety Checks", text: "CTQ Check: CC distance tolerance (-1.0, +2.0 mm), Flange coplanarity ≤ 0.4 mm, complete weld penetration on lifting lugs. Fall protection on large radiator jigs." },
      { item: "8. Failure Handling", text: "If flange coplanarity is out of square, clamp in hydraulic straightening fixture before weld cooling." },
      { item: "9. Output", text: "Dimensionally verified, fully erected radiator assembly." },
      { item: "10. Next Handoff", text: "Surface Preparation, Internal Flushing and Painting (S14)." }
    ],
    states: {
      doc: "Erection inspection completed using calibrated right-angles and line dori, logged on checksheet QCI/F/02/06.",
      actual: "Fitters use framing squares and line dori. Measurements are logged on paper traveler [VERIFY ON-SITE].",
      ideal: "Digital erection inspection on tablet: operator enters CC distance and flange flatness measurements; system validates against customer drawing limits."
    },
    mistakes: "Flange bolt holes oriented out of square with header axis, preventing bolt alignment on the transformer tank on-site.",
    mesFeature: "MES-S13-01: Dimensional validation checksheet with flange hole orientation verification and lifting lug weld sign-off.",
    improvement: "Flange alignment rework rate (target: 100% compliance with customer flange coplanarity specs).",
    verification: "Ask Erection Supervisor: How do you verify internal header cleanliness after full welding of the header pipe?"
  },
  {
    id: "S14",
    name: "Surface Preparation, Coating and Painting - Special Process",
    docRef: "QCI/F/02/11, 12",
    owner: "Paint Shop Production, Coating Inspector",
    tag: "[CONFIRMED - SPECIAL PROCESS]",
    meaning: "Flushing the radiator interior with rust-preventive oil, shot-blasting the exterior to white metal finish (Sa 2.5), and applying hot-dip galvanizing (HDG) or multi-layer epoxy/polyurethane paint.",
    terminology: [
      { term: "Surface Profile (Sa 2.5)", def: "Near-white blast cleaning removing all rust, mill scale, and foreign matter to ISO 8501-1." },
      { term: "DFT (Dry Film Thickness)", def: "Thickness of cured paint coating measured in micrometers (microns, µm) per SSPC PA-2." },
      { term: "Cross-Hatch Adhesion", def: "Test measuring paint bond strength to metal substrate (must achieve Class 0 / 5B)." },
      { term: "Internal Flushing", def: "Circulating Ching RD-124 Olive Green rust-preventive oil inside radiator." }
    ],
    example: "For SPTC order, radiator exterior is grit-blasted to Sa 2.5, coated with HDG 86 µm, epoxy primer 80 µm, and PU-990 topcoat RAL-7038, achieving total DFT of 292 µm (spec: 286 µm nominal).",
    table: [
      { item: "1. Trigger", text: "Radiator erection and final welding inspection cleared." },
      { item: "2. Responsible", text: "Shot Blaster, Spray Painter, Certified Coating Inspector (NACE/SSPC)." },
      { item: "3. Inputs", text: "Radiator assembly, abrasive steel grit (G40), certified paint batches, solvent thinner, internal flushing oil (Ching RD-124)." },
      { item: "4. Activities", text: "1. Internal flushing and oil coating (40-70 µm). 2. Masking of flange faces and threads. 3. External shot blasting to Sa 2.5. 4. Application of primer coat and flash-off. 5. Application of intermediate and MIO coats. 6. Application of PU topcoat. 7. Oven baking / curing. 8. DFT measurement across 10 points." },
      { item: "5. Machines / Tools", text: "Enclosed shot blast booth, airless spray pumps, curing oven, digital surface profile gauge, electromagnetic DFT gauge, cross-hatch cutter." },
      { item: "6. Records Captured", text: "HTU serial scanned, blast profile (µm), ambient temp and relative humidity, paint batch numbers, wet film thickness (WFT), dry film thickness (DFT) at 10 spots, adhesion score, inspector ID." },
      { item: "7. Quality & Safety Checks", text: "CTQ Gates: Sa 2.5 surface cleanliness, zero paint runs or orange peel, total DFT within customer tolerance (e.g. 286 µm ±30 µm), adhesion ≥ 4B. Full face supplied-air respirator." },
      { item: "8. Failure Handling", text: "If DFT is below minimum, apply additional topcoat. If blistered or adhesion fails, blast back to bare metal and re-coat under deviation notice." },
      { item: "9. Output", text: "Fully coated, corrosion-protected radiator with validated Coating Inspection Report." },
      { item: "10. Next Handoff", text: "Final Quality Audit and Customer Release (S15)." }
    ],
    states: {
      doc: "Coating report QCI/F/02/12 records surface profile, environmental conditions, and 10-spot DFT readings.",
      actual: "Painter checks DFT with hand gauge; readings are summarized as average on traveler [VERIFY ON-SITE].",
      ideal: "Bluetooth DFT gauge feeding readings directly into MES tablet: system generates color-coded thickness heatmap and auto-validates SSPC PA-2 compliance."
    },
    mistakes: "Painting when ambient humidity exceeds 85% or substrate temperature is within 3°C of dew point, causing premature coating peeling.",
    mesFeature: "MES-S14-01: Special process coating module with Bluetooth DFT gauge synchronization, paint batch tracking, and environmental interlocks.",
    improvement: "Paint consumption efficiency and coating nonconformance rate (target: zero paint peeling complaints in field).",
    verification: "Ask Coating Inspector: How do you verify that internal flushing oil has covered 100% of the internal fin tubes?"
  },
  {
    id: "S15",
    name: "Final Inspection, Audit and Quality Release (PDI & COC)",
    docRef: "QCI/F/03/01",
    owner: "Quality Assurance Department",
    tag: "[CONFIRMED - QUALITY GATE]",
    meaning: "Independent Quality Assurance inspectors perform Pre-Dispatch Inspection (PDI), verifying all dimensions, paint finish, flange faces, clean interior, and compiling the Certificate of Conformance (COC).",
    terminology: [
      { term: "PDI (Pre-Dispatch Inspection)", def: "Final comprehensive audit of finished product against customer drawing before packaging." },
      { term: "COC (Certificate of Conformance)", def: "Official quality certificate declaring the product meets all contractual and technical requirements." },
      { term: "Quality Gate Release", def: "System authorization releasing the unit from production to finished goods warehouse." }
    ],
    example: "QA Inspector reviews radiator HTU-3004-001: verifies CC distance (2900 mm), flange PCD (160 mm), paint DFT (292 µm), inspects internal cavity with boroscope, and signs digital release.",
    table: [
      { item: "1. Trigger", text: "Painting cured and unit presented at final QA inspection bay." },
      { item: "2. Responsible", text: "Lead QA Inspector, Quality Manager." },
      { item: "3. Inputs", text: "Finished radiator, complete manufacturing traveler, customer drawing, customer QAP, stage inspection checksheets." },
      { item: "4. Activities", text: "1. Check traveler completeness for all 14 preceding stages. 2. Verify all CTQ measurements. 3. Inspect flange surface finish and protective covers. 4. Check internal cleanliness with boroscope lamp. 5. Inspect nameplate stamping. 6. Generate COC and sign digital release." },
      { item: "5. Machines / Tools", text: "Precision tape, optical boroscope, flange surface roughness gauge, calibrated digital torque wrench, digital camera." },
      { item: "6. Records Captured", text: "PDI checklist, overall dimensions, final DFT average, boroscope cleanliness photo, digital signature of QA Inspector, COC document number." },
      { item: "7. Quality & Safety Checks", text: "Final Gate: Zero open NCRs; all 14 stages digitally signed; zero foreign matter inside headers; protective plastic caps fitted." },
      { item: "8. Failure Handling", text: "Any dimensional or aesthetic nonconformance stops release. Unit remains on System Quality Hold until rectified." },
      { item: "9. Output", text: "Approved Certificate of Conformance (COC) and Green Dispatch Clearance Release." },
      { item: "10. Next Handoff", text: "Packing and Finished Goods Warehouse (S16)." }
    ],
    states: {
      doc: "QA reviews paper traveler, signs PDI report, and issues paper COC signed by Quality Manager.",
      actual: "Inspector checks dimensions and paint, signs paper traveler, and stamps approved on nameplate [VERIFY ON-SITE].",
      ideal: "MES automated quality release: system checks that all stage checksheets have passing data, compiles full 17-stage digital dossier, and unlocks packing barcode."
    },
    mistakes: "Signing off final release while a leak test or welding NCR remains open or unverified in the system.",
    mesFeature: "MES-S15-01: Automated quality gate interlock: unit cannot be released to packing if any preceding stage checksheet is missing or failed.",
    improvement: "Customer pre-dispatch rejection rate (target: 100% first-pass customer release with zero documentation errors).",
    verification: "Ask QA Head: What prevents a unit with an unclosed rework job from being packed and loaded on a truck?"
  },
  {
    id: "S16",
    name: "Packing, Barcode Labelling and Finished Goods Storage",
    docRef: "SOP/LOG/01",
    owner: "Packing Department, Finished Goods Stores",
    tag: "[CONFIRMED]",
    meaning: "Protecting the finished radiator against shipping damage, attaching weatherproof flange covers and desiccants, applying customer shipping barcode labels, and storing in FG warehouse.",
    terminology: [
      { term: "Wooden Saddle / Skid", def: "Treated timber cradle securing the radiator headers during transport to prevent fin bending." },
      { term: "VCI Packaging", def: "Vapor Corrosion Inhibitor plastic wrapping preventing atmospheric moisture corrosion." },
      { term: "FG Warehouse", def: "Designated covered storage area for packaged finished goods ready for dispatch." }
    ],
    example: "Packing crew fits blind flange covers with neoprene gaskets on Delta Star radiator, wraps core in VCI film, secures on fumigated wooden skid, and applies weatherproof shipping barcode label.",
    table: [
      { item: "1. Trigger", text: "QA Green Dispatch Release issued in system." },
      { item: "2. Responsible", text: "Packing Supervisor, Warehouse Material Handler." },
      { item: "3. Inputs", text: "Released radiator, wooden saddles, VCI film, silica gel desiccants, blind flanges, shipping barcode labels." },
      { item: "4. Activities", text: "1. Install protective blind flange covers with rubber gaskets. 2. Insert desiccant bags inside header pipe. 3. Wrap entire radiator in VCI stretch film. 4. Secure radiator to timber skid with steel/PET strapping. 5. Print and affix weatherproof barcode shipping label. 6. Move to FG bay location." },
      { item: "5. Machines / Tools", text: "Pneumatic strapping tool, thermal transfer label printer, overhead crane, forklift." },
      { item: "6. Records Captured", text: "HTU serial scanned, packing crate barcode ID, packing date, packing team ID, FG rack/bay location." },
      { item: "7. Quality & Safety Checks", text: "Verify desiccant insertion before sealing flanges. Confirm strapping tension does not crush outer fin edges. Proper crane rigging." },
      { item: "8. Failure Handling", text: "If packing wrap is torn or flange cover loose during staging, re-wrap and re-inspect before dispatch." },
      { item: "9. Output", text: "Packaged, labelled finished radiator safely positioned in Finished Goods warehouse." },
      { item: "10. Next Handoff", text: "Logistics for dispatch planning and vehicle loading (S17)." }
    ],
    states: {
      doc: "Packing completed per customer packaging standard and recorded on packing checklist SOP/LOG/01.",
      actual: "Packing team crates radiators according to truck size, printing paper shipping labels manually [VERIFY ON-SITE].",
      ideal: "MES barcode printing: scanning HTU serial auto-generates customer-compliant GS1 shipping label and assigns designated FG warehouse bay."
    },
    mistakes: "Using non-fumigated wooden skids for export shipments (violating ISPM-15 customs regulations).",
    mesFeature: "MES-S16-01: Finished goods packaging and palletization module with customer-specific barcode label generation.",
    improvement: "Packaging transit damage incidents (target: zero damage during transport).",
    verification: "Ask Packing Lead: How do you ensure export radiators have the required ISPM-15 treated timber certification stamps?"
  },
  {
    id: "S17",
    name: "Dispatch Planning, Shipping Documentation, Loading and Delivery",
    docRef: "SOP/LOG/02",
    owner: "Logistics, Sales, Security",
    tag: "[CONFIRMED]",
    meaning: "Scheduling delivery vehicles, generating legal transport documents (e-Way Bill, Delivery Challan, Packing List), loading radiators safely, and tracking freight delivery to customer site.",
    terminology: [
      { term: "Delivery Challan (DC)", def: "Official shipping document listing shipped goods, quantities, and serial numbers." },
      { term: "e-Way Bill", def: "Government electronic waybill required for commercial road transit in India." },
      { term: "Lashing & Chocking", def: "Securing cargo onto truck bed using timber wedges and ratchet straps to prevent shifting." }
    ],
    example: "Logistics loads 12 units of WO-3004 onto dedicated flatbed trailer for SPTC port shipping, verifying each crate barcode against the Delivery Challan and generating e-Way bill.",
    table: [
      { item: "1. Trigger", text: "Customer dispatch clearance notice or scheduled delivery date reached." },
      { item: "2. Responsible", text: "Logistics Officer, Dispatch Supervisor, Security Gate Clerk." },
      { item: "3. Inputs", text: "Packaged FG inventory, Sales Order, customer shipping instructions, approved transporter." },
      { item: "4. Activities", text: "1. Inspect incoming delivery truck condition. 2. Generate Delivery Challan and packing list. 3. Generate statutory e-Way bill. 4. Scan crate barcodes during crane loading onto truck bed. 5. Secure cargo with timber chocks and ratchet lashing. 6. Security gate vehicle inspection and outbound stamp." },
      { item: "5. Machines / Tools", text: "Handheld mobile barcode scanner, 10-ton overhead crane, ratchet lashings, ERP dispatch module." },
      { item: "6. Records Captured", text: "Dispatch Advice number, truck vehicle number, driver license, loaded HTU serial list, e-Way bill number, gate out timestamp." },
      { item: "7. Quality & Safety Checks", text: "Verify truck bed is clean, dry, and free of protruding nails. Ensure ratchet straps bear on wooden saddles, not fin edges." },
      { item: "8. Failure Handling", text: "If truck bed is damp or damaged, reject vehicle and request clean replacement from transporter." },
      { item: "9. Output", text: "Dispatched shipment with signed Delivery Challan, e-Way Bill, and outward security log." },
      { item: "10. Next Handoff", text: "Customer receiving dock and Sales / Finance for invoicing handoff (S18)." }
    ],
    states: {
      doc: "Loading supervised by dispatch officer with serial numbers verified on Delivery Challan before truck departure.",
      actual: "Crates are loaded and verified on paper checklist. Handheld barcode scanning is not fully deployed [VERIFY ON-SITE].",
      ideal: "Mobile truck loading app: logistics scans crate barcode as crane loads truck; system prevents gate pass generation if any unit on challan is unscanned."
    },
    mistakes: "Loading radiators without adequate side chocking, causing them to lean against truck sideboards and damage fin elements during transit.",
    mesFeature: "MES-S17-01: Digital dispatch loading verification with mobile barcode scan validation and automated e-Way bill link.",
    improvement: "On-time in-full delivery (OTIF) percentage and shipping documentation accuracy (target: 100% OTIF).",
    verification: "Ask Dispatch Supervisor: How do you verify that every serial number loaded on the truck exactly matches the shipping challan?"
  },
  {
    id: "S18",
    name: "Invoicing Handoff, Delivery Confirmation, Customer Feedback and CAPA",
    docRef: "SOP/FIN/01, SOP/QMS/05",
    owner: "Finance, Sales, Customer Quality",
    tag: "[CONFIRMED - CLOSING STAGE]",
    meaning: "Finance issues the commercial tax invoice upon verified delivery. Sales tracks customer receipt. If the customer reports any complaint, Quality initiates 8D root cause investigation and CAPA.",
    terminology: [
      { term: "POD (Proof of Delivery)", def: "Customer signed receiving acknowledgment confirming receipt in good condition." },
      { term: "8D Problem Solving", def: "Eight Disciplines methodology for identifying root cause and preventing defect recurrence." },
      { term: "CAPA", def: "Corrective and Preventive Action plan eliminating systematic quality flaws." }
    ],
    example: "Customer signs electronic POD upon delivery. Two weeks later, customer feedback rating is logged as 5/5 Stars. Any transit scratch is logged in CAPA module for carrier review.",
    table: [
      { item: "1. Trigger", text: "Confirmation of truck departure and customer receipt at destination site." },
      { item: "2. Responsible", text: "Finance Accountant, Sales Account Manager, Customer Quality Engineer." },
      { item: "3. Inputs", text: "Signed Delivery Challan, signed Proof of Delivery (POD), customer inspection report or feedback." },
      { item: "4. Activities", text: "1. Trigger ERP commercial tax invoice from verified dispatch record. 2. Upload signed POD into MES order archive. 3. Log customer delivery acceptance. 4. Capture customer satisfaction score. 5. If complaint received, initiate 8D investigation and CAPA." },
      { item: "5. Machines / Tools", text: "ERP finance module, CRM customer portal, QMS 8D investigation workbench." },
      { item: "6. Records Captured", text: "Invoice number, payment terms, customer POD attachment, customer rating (1-5), 8D incident ID (if applicable), CAPA closure record." },
      { item: "7. Quality & Safety Checks", text: "Ensure full manufacturing quality dossier (MTCs, checksheet records, leak certificate, paint certificate) is digitally archived." },
      { item: "8. Failure Handling", text: "If customer reports transit damage or leak: log immediate Customer Complaint, issue containment action within 24 hours, and dispatch field technician." },
      { item: "9. Output", text: "Closed Sales Order with archived digital manufacturing dossier, completed invoice, and logged customer feedback." },
      { item: "10. Next Handoff", text: "Continuous Improvement loop feeding lessons learned back into APQP / PFMEA (S3)." }
    ],
    states: {
      doc: "POD collected within 7 days of delivery and filed with invoice copy. Customer complaints logged in QMS within 24 hours.",
      actual: "POD collection can take weeks, and customer feedback is gathered informally during sales calls [VERIFY ON-SITE].",
      ideal: "Digital customer portal where client signs POD via mobile signature, accesses complete 17-stage manufacturing dossier in 1 click, and rates delivery."
    },
    mistakes: "Failing to document customer field complaints into the central quality system, preventing root cause resolution on future batches.",
    mesFeature: "MES-S18-01: Integrated customer delivery portal with digital POD capture, 8D incident manager, and continuous feedback loop.",
    improvement: "Customer satisfaction index and complaint resolution cycle time (target: zero repeat customer defects).",
    verification: "Ask Quality Manager: How are customer field issues linked back to the specific welding or leak test operator who worked on that unit?"
  }
];

console.log("Stage definitions compiled. Total stages:", STAGES.length);

module.exports = { STAGES, logoDataUri, hiTechLogoDataUri };
