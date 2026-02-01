const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(process.cwd(), 'cypress', 'screenshots');
const outFile = path.join(process.cwd(), 'REPORT_E2E_AUTOGEN.md');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fp));
    } else {
      results.push(fp);
    }
  });
  return results;
}

function relative(p) {
  return path.relative(process.cwd(), p).replace(/\\/g, '/');
}

function groupScreenshots(files) {
  // Group by spec folder (first-level under screenshots)
  const groups = {};
  files.forEach((f) => {
    const parts = relative(f).split('/');
    // expected: cypress/screenshots/<specFolder>/<...>
    const idx = parts.indexOf('screenshots');
    const group = parts[idx + 1] || 'root';
    groups[group] = groups[group] || [];
    groups[group].push(f);
  });
  return groups;
}

function buildReport() {
  const files = walk(screenshotsDir).filter((f) => /\.png$|\.jpg$|\.jpeg$/i.test(f));
  const groups = groupScreenshots(files);

  let md = '# Rapport E2E — Captures automatiques\n\n';
  md += `Généré le: ${new Date().toISOString()}\n\n`;
  if (files.length === 0) {
    md += 'Aucune capture trouvée dans `cypress/screenshots`. Exécutez `npx cypress run --spec "cypress/e2e/**"` puis relancez ce script.\n';
    fs.writeFileSync(outFile, md, 'utf8');
    console.log('Report generated (no screenshots):', outFile);
    return;
  }

  Object.keys(groups).forEach((g) => {
    md += `## Spec: ${g}\n\n`;
    groups[g].forEach((f) => {
      const rel = relative(f);
      const name = path.basename(f).replace(/_/g, ' ');
      md += `- **${name}**  \n`;
      md += `  ![${name}](${rel})\n\n`;
    });
  });

  fs.writeFileSync(outFile, md, 'utf8');
  console.log('Report generated:', outFile);
}

buildReport();
