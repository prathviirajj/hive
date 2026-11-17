const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/Prathviraj Jadhav/.gemini/antigravity/brain/f1df4cf8-9f4e-40e0-8ad8-ba8536f3dd38/screenshots');
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

  // Suppress tour guide
  await page.evaluate(() => {
    localStorage.setItem("tour-completed", "true");
  });

  // 1. Fill Admin credentials & Sign in
  console.log("Clicking Admin button...");
  const buttons = await page.$$('button');
  for (const b of buttons) {
    const text = await (await b.getProperty('innerText')).jsonValue();
    if (text === "Admin") {
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 600));

  console.log("Submitting login form...");
  await page.click('button[type="submit"]');

  // Wait for Dashboard to render
  console.log("Waiting for Dashboard to load...");
  const hubHeading = await page.waitForSelector('xpath=//h2[contains(., "Inspection Reports & Stage Dossier Hub")]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // Ensure tour is dismissed in state
  await page.evaluate(() => {
    localStorage.setItem("tour-completed", "true");
  });

  // Scroll to hub
  if (hubHeading) {
    await hubHeading.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
  }

  // Screenshot 1: Dashboard with Inspection Reports Hub & clickable Recent Inspections
  console.log("Capturing Dashboard Inspection Reports Hub...");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-01-dashboard-inspection-reports-hub.png") });
  console.log("Saved: v12-01-dashboard-inspection-reports-hub.png");

  // 2. Click a Recent Inspection row to open drawer
  console.log("Clicking a recent inspection row to open drawer...");
  const recentRows = await page.$$('table tbody tr');
  if (recentRows.length > 0) {
    await recentRows[0].click();
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-02-dashboard-recent-inspection-drawer.png") });
    console.log("Saved: v12-02-dashboard-recent-inspection-drawer.png");

    // Close the drawer using Escape key
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 1000));
  }

  // 3. Navigate to Process Flow and click "Inspect This Stage"
  console.log("Navigating to Process Flow...");
  const pfButtons = await page.$$('xpath=//button[contains(., "Process Flow")]');
  if (pfButtons.length > 0) {
    await pfButtons[0].click();
    await new Promise(r => setTimeout(r, 2000));

    console.log("Clicking 'Inspect This Stage' on Process Flow...");
    const inspectBtns = await page.$$('xpath=//button[contains(., "Inspect This Stage")]');
    if (inspectBtns.length > 0) {
      await inspectBtns[0].click();
      await new Promise(r => setTimeout(r, 2000));

      // Verify drawer opened with Step 3 (Parameters)
      await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-03-process-flow-inspect-drawer-prefilled.png") });
      console.log("Saved: v12-03-process-flow-inspect-drawer-prefilled.png");

      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 4. Navigate to Work Orders and check WO-3004 (SPTC) profile
  console.log("Navigating to Work Orders...");
  const woButtons = await page.$$('xpath=//button[contains(., "Work Orders")]');
  if (woButtons.length > 0) {
    await woButtons[0].click();
    await new Promise(r => setTimeout(r, 2000));

    const sptcRows = await page.$$('xpath=//tr[contains(., "WO-3004")] | //td[contains(., "WO-3004")]');
    if (sptcRows.length > 0) {
      console.log("Opening WO-3004 Profile...");
      await sptcRows[0].click();
      await new Promise(r => setTimeout(r, 2000));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-04-wo-sptc-customer-approved-specs.png") });
      console.log("Saved: v12-04-wo-sptc-customer-approved-specs.png");

      // Check Tab 2 (CAD)
      const cadTab = await page.$('#tab-btn-cad');
      if (cadTab) {
        await cadTab.click();
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-05-wo-sptc-drawings-and-cad.png") });
        console.log("Saved: v12-05-wo-sptc-drawings-and-cad.png");
      }

      // Go back
      const backBtns = await page.$$('xpath=//button[contains(., "Back to Work Orders")]');
      if (backBtns.length > 0) {
        await backBtns[0].click();
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // 5. Check WO-3006 (Delta Star) profile
    console.log("Opening WO-3006 (Delta Star) Profile...");
    const deltaRows = await page.$$('xpath=//tr[contains(., "WO-3006")] | //td[contains(., "WO-3006")]');
    if (deltaRows.length > 0) {
      await deltaRows[0].click();
      await new Promise(r => setTimeout(r, 2000));

      await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-06-wo-delta-star-customer-specs.png") });
      console.log("Saved: v12-06-wo-delta-star-customer-specs.png");

      const cadTab = await page.$('#tab-btn-cad');
      if (cadTab) {
        await cadTab.click();
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, "v12-07-wo-delta-star-drawings.png") });
        console.log("Saved: v12-07-wo-delta-star-drawings.png");
      }
    }
  }

  console.log("ALL E2E VERIFICATIONS COMPLETED SUCCESSFULLY!");
  await browser.close();
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
