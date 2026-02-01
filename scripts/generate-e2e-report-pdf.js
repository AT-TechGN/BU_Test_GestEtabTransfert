const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const cwd = process.cwd();
    const mdCandidates = [
      path.join(cwd, 'REPORT_E2E_AUTOGEN.md'),
      path.join(cwd, 'REPORT_E2E_TEMPLATE.md'),
      path.join(cwd, 'REPORT_E2E.md')
    ];

    const mdFile = mdCandidates.find((p) => fs.existsSync(p));
    if (!mdFile) {
      console.error('Aucun fichier Markdown de rapport trouvé. Exécutez d\'abord `node scripts/generate-e2e-report.js`.');
      process.exit(1);
    }

    const mdContent = fs.readFileSync(mdFile, 'utf8');
    const md = new MarkdownIt({ html: true, linkify: true });
    const rendered = md.render(mdContent);

    const basePath = path.dirname(mdFile);
    // simple CSS for print
    const css = `
      body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 24px; }
      h1,h2,h3 { color: #0b5; }
      img { max-width: 100%; height: auto; page-break-inside: avoid; }
      .screenshot { page-break-after: always; margin-bottom: 12px; }
      pre { background: #f6f8fa; padding: 12px; overflow: auto; }
      table { border-collapse: collapse; width: 100%; }
      table, th, td { border: 1px solid #ddd; }
      th, td { padding: 8px; }
    `;

    // Rewrite relative image URLs so Puppeteer can load file:// URLs
    // Convert markdown relative paths (e.g., cypress/screenshots/...) into file:// absolute paths
    const htmlWithFixedImgs = rendered.replace(/<img src="([^"\)]+)"/g, (m, src) => {
      // ignore http(s) images
      if (/^https?:\/\//i.test(src)) return `<img src="${src}"`;
      const abs = path.resolve(basePath, src);
      if (fs.existsSync(abs)) return `<img src="file://${abs.replace(/\\/g, '/')}"`;
      // try relative to repo root
      const abs2 = path.resolve(cwd, src);
      if (fs.existsSync(abs2)) return `<img src="file://${abs2.replace(/\\/g, '/')}"`;
      return `<img src="${src}"`;
    });

    // Build a header with useful metadata (run date, author, baseUrl, counts)
    const generatedDateMatch = mdContent.match(/^Généré le:\s*(.+)$/m);
    const generatedDate = generatedDateMatch ? generatedDateMatch[1].trim() : new Date().toISOString();
    const author = process.env.TEST_AUTHOR || process.env.USER || 'N/A';
    // try to read baseUrl from cypress.config.js
    let baseUrl = 'N/A';
    try {
      const cfg = fs.readFileSync(path.join(process.cwd(), 'cypress.config.js'), 'utf8');
      const m = cfg.match(/baseUrl:\s*(?:process.env\.[A-Z_]+\s*\|\s*)?['"]([^'"]+)['"]/m);
      if (m) baseUrl = m[1];
    } catch (e) {
      // ignore
    }

    const specCount = (mdContent.match(/^## Spec:/gm) || []).length;
    const imgCount = (mdContent.match(/!\[.*\]\(/g) || []).length;
    const headerHtml = `
      <div style="border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px;">
        <h1 style="margin:0;padding:0;font-size:20px;">Rapport E2E — Tests Cypress</h1>
        <div style="font-size:12px;color:#555;margin-top:6px;">
          <strong>Application:</strong> E-GestEtab (test) &nbsp;|&nbsp;
          <strong>Base URL:</strong> ${baseUrl} &nbsp;|&nbsp;
          <strong>Généré le:</strong> ${generatedDate} &nbsp;|&nbsp;
          <strong>Auteur:</strong> ${author}
        </div>
        <div style="font-size:12px;color:#555;margin-top:6px;">
          <strong>Specs:</strong> ${specCount} &nbsp;|&nbsp; <strong>Captures:</strong> ${imgCount}
        </div>
      </div>
    `;

    const fullHtml = `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Rapport E2E</title>
        <style>${css}</style>
      </head>
      <body>
        ${headerHtml}
        ${htmlWithFixedImgs}
      </body>
      </html>
    `;

    const tmpHtml = path.join(cwd, '.tmp_e2e_report.html');
    fs.writeFileSync(tmpHtml, fullHtml, 'utf8');

    console.log('Lancement de Puppeteer pour générer le PDF...');

    // Prefer using a local Chrome/Chromium executable if provided via env var
    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.CHROME_EXE;
    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (execPath) {
      launchOptions.executablePath = execPath;
      console.log('Using browser executable from PUPPETEER_EXECUTABLE_PATH:', execPath);
    } else if (process.env.PUPPETEER_SKIP_DOWNLOAD) {
      console.warn('PUPPETEER_SKIP_DOWNLOAD is set. Ensure a compatible Chrome/Chromium is available and set PUPPETEER_EXECUTABLE_PATH if needed.');
    }

    let browser;
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
      console.error('Erreur au lancement de Puppeteer:', launchErr.message || launchErr);
      if (!execPath) {
        console.error('Astuce: si votre machine a Chrome installé, définissez l\'env var PUPPETEER_EXECUTABLE_PATH avec le chemin complet vers chrome.exe');
        console.error('Ex: $env:PUPPETEER_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (PowerShell)');
      }
      if (process.env.PUPPETEER_SKIP_DOWNLOAD) {
        console.error('Vous avez défini PUPPETEER_SKIP_DOWNLOAD ; soit installez Chrome localement et définissez PUPPETEER_EXECUTABLE_PATH, soit réessayez `npm install` sans cette variable pour permettre le téléchargement de Chromium.');
      }
      process.exit(1);
    }
    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });

    const outPdf = path.join(cwd, 'REPORT_E2E.pdf');
    await page.pdf({ path: outPdf, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '12mm', right: '12mm' } });

    await browser.close();
    fs.unlinkSync(tmpHtml);

    console.log('PDF généré:', outPdf);
  } catch (err) {
    console.error('Erreur lors de la génération du PDF:', err);
    process.exit(1);
  }
})();
