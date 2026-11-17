const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.resolve('C:/Users/Prathviraj Jadhav/.gemini/antigravity/brain/f1df4cf8-9f4e-40e0-8ad8-ba8536f3dd38');
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function main() {
  console.log("Launching headless Chrome for PDF and Image rendering...");
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200, deviceScaleFactor: 2 });

  const htmlPath = path.resolve('public/Hi-Tech-Radiators-MES-Process-Flow-Mapping.html');
  const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
  console.log("Loading HTML from:", fileUrl);

  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Generate Print-Ready PDF
  const pdfPath = path.resolve('public/Hi-Tech-Radiators-MES-Process-Flow-Mapping.pdf');
  console.log("Rendering PDF to:", pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' }
  });
  console.log("PDF generation complete! Size:", fs.statSync(pdfPath).size, "bytes");

  // Copy PDF to artifact directory
  const artifactPdfPath = path.join(ARTIFACT_DIR, 'Hi-Tech-Radiators-MES-Process-Flow-Mapping.pdf');
  fs.copyFileSync(pdfPath, artifactPdfPath);
  console.log("Copied PDF to artifact directory:", artifactPdfPath);

  // 2. Generate Full Process Flow Chart Image (PNG)
  // Let's take high-resolution screenshots of the key visual pages and the full overview
  const chartImgPath = path.resolve('public/Hi-Tech-Radiators-MES-Process-Flow-Chart.png');
  console.log("Capturing full process flow chart image to:", chartImgPath);
  await page.screenshot({
    path: chartImgPath,
    fullPage: false,
    clip: { x: 0, y: 0, width: 1440, height: 2600 }
  });
  console.log("Captured full flow chart! Size:", fs.statSync(chartImgPath).size, "bytes");

  // Copy image to artifact directory
  const artifactImgPath = path.join(SCREENSHOT_DIR, 'Hi-Tech-Radiators-MES-Process-Flow-Chart.png');
  fs.copyFileSync(chartImgPath, artifactImgPath);
  console.log("Copied Image to artifact directory:", artifactImgPath);

  // Also capture the L1 Decision Flowchart page as a dedicated crisp image
  const pages = await page.$$('.page');
  if (pages.length >= 3) {
    // Page 2: L0 Value Stream
    await pages[1].screenshot({
      path: path.join(SCREENSHOT_DIR, 'Hi-Tech-MES-L0-Value-Stream.png')
    });
    console.log("Captured Hi-Tech-MES-L0-Value-Stream.png");

    // Page 3: L1 Decision Flowchart
    await pages[2].screenshot({
      path: path.join(SCREENSHOT_DIR, 'Hi-Tech-MES-L1-Process-Flowchart.png')
    });
    console.log("Captured Hi-Tech-MES-L1-Process-Flowchart.png");

    // Page 4: Swimlanes & ISA-95
    if (pages.length >= 4) {
      await pages[3].screenshot({
        path: path.join(SCREENSHOT_DIR, 'Hi-Tech-MES-L2-Swimlanes-ISA95.png')
      });
      console.log("Captured Hi-Tech-MES-L2-Swimlanes-ISA95.png");
    }
  }

  await browser.close();
  console.log("All rendering tasks completed successfully!");
}

main().catch(err => {
  console.error("Rendering failed:", err);
  process.exit(1);
});
