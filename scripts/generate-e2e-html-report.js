const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const resultsPath = path.join(cwd, 'cypress', 'results.json');
const outDir = path.join(cwd, 'report');
const outFile = path.join(outDir, 'report.html');

if (!fs.existsSync(resultsPath)) {
  console.error('cypress/results.json not found. Run: npx cypress run --reporter json --spec "cypress/e2e/**" > cypress/results.json');
  process.exit(1);
}

let raw = fs.readFileSync(resultsPath, 'utf8');
// If the file contains replacement characters or null bytes, try reading as UTF-16LE
if (raw.indexOf('\uFFFD') !== -1 || raw.indexOf('\0') !== -1) {
  try {
    raw = fs.readFileSync(resultsPath, 'utf16le');
    console.log('Detected UTF-16LE encoding for results.json; re-read accordingly.');
  } catch (e) {
    // fallback: continue with original
  }
}

// Remove stray replacement chars and common console decorations
raw = raw.replace(/\uFFFD/g, '');
// Trim any leading non-json characters until first '{'
const firstBrace = raw.indexOf('{');
if (firstBrace > 0) raw = raw.slice(firstBrace);

let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  // attempt to locate a valid JSON object by finding matching braces from first '{'
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first >= 0 && last > first) {
    const sub = raw.slice(first, last + 1);
    try {
      json = JSON.parse(sub);
    } catch (e2) {
      console.error('Failed to parse cypress/results.json after extracting JSON substring.');
      throw e2;
    }
  } else {
    console.error('Failed to parse cypress/results.json: no JSON object found');
    throw e;
  }
}

function fixMojibake(s) {
  if (!s || typeof s !== 'string') return s;
  return s.replace(/├¿/g, 'û').replace(/├®/g, 'é').replace(/├┤/g, 'ô').replace(/ÔÇô/g, '–').replace(/ÔöÉ/g, 'É').replace(/Ôöç/g,'ç').replace(/ÔöÇ/g,'Ç').replace(/Ôöé/g,'é');
}

const runs = json.runs || [];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// build HTML
const title = 'Rapport E2E — Interactif';
const generated = new Date().toISOString();
const pdfPath = path.relative(outDir, path.join(cwd, 'REPORT_E2E.pdf')).replace(/\\/g, '/');

let html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:20px;color:#222}
  header{border-bottom:1px solid #ddd;padding-bottom:12px;margin-bottom:18px}
  h1{margin:0 0 6px 0;font-size:20px}
  .meta{color:#555;font-size:13px}
  .controls{margin-top:8px}
  .spec{border:1px solid #eee;padding:12px;margin-bottom:12px;border-radius:6px}
  .spec h2{margin:0;font-size:16px}
  .summary{background:#f6f7fb;padding:8px;border-radius:4px;margin-top:8px}
  .test{padding:8px;margin:8px 0;border-radius:4px}
  .passed{background:#e6ffed;border:1px solid #c7f0d1}
  .failed{background:#ffecec;border:1px solid #f5c2c2}
  .toggle{cursor:pointer;color:#0366d6;text-decoration:underline}
  .screenshot{max-width:100%;margin-top:8px;border:1px solid #ddd}
  #search{width:320px;padding:6px}
  .top-actions{float:right}
  footer{margin-top:30px;color:#666;font-size:12px;border-top:1px solid #eee;padding-top:10px}
</style>
</head>
<body>
<header>
  <h1>${title}</h1>
  <div class="meta">Généré le: ${generated} — Application: E-GestEtab (test)</div>
  <div class="controls">
    <input id="search" placeholder="Filtrer par spec / test..." />
    <span class="top-actions">
      <a id="downloadPdf" href="${pdfPath}" download>Télécharger PDF</a>
    </span>
  </div>
</header>
<main>
`;

if (runs.length === 0) {
  html += '<p>Aucune exécution trouvée dans cypress/results.json</p>';
} else {
  // overall summary
  let totalTests = 0, totalPass = 0, totalFail = 0, totalSpecs = runs.length;
  runs.forEach(r => {
    if (r.stats) {
      totalTests += r.stats.tests || 0;
      totalPass += r.stats.passes || 0;
      totalFail += r.stats.failures || 0;
    }
  });
  html += `<section class="summary">Specs: <strong>${totalSpecs}</strong> — Tests: <strong>${totalTests}</strong> — Passés: <strong style="color:green">${totalPass}</strong> — Échoués: <strong style="color:red">${totalFail}</strong></section>`;

  runs.forEach((r, idx) => {
    const specName = (r.spec && (r.spec.name || r.spec.path || r.spec.absolute)) || `spec-${idx}`;
    html += `<section class="spec" data-spec="${specName}">`;
    html += `<h2>${fixMojibake(specName)} <span class="toggle" data-action="toggle">[afficher/cacher]</span></h2>`;
    html += `<div class="summary">Tests: ${r.stats.tests || 0} — Passes: ${r.stats.passes || 0} — Failures: ${r.stats.failures || 0} — Durée: ${r.stats.duration || 0} ms</div>`;
    html += `<div class="tests">`;

    const tests = r.tests || [];
    tests.forEach((t) => {
      const title = fixMojibake(t.fullTitle || (Array.isArray(t.title) ? t.title.join(' / ') : t.title));
      const status = (t.err && Object.keys(t.err).length) ? 'failed' : 'passed';
      html += `<div class="test ${status}" data-title="${title}">`;
      html += `<strong>${title}</strong>`;
      html += `<div>Durée: ${t.duration || ''} ms</div>`;
      if (status === 'failed') {
        let msg = (t.err && (t.err.message || t.err.stack)) || 'Aucun message';
        msg = fixMojibake(String(msg));
        // Improve common messages
        if (/404: Not Found/.test(msg)) {
          msg += '\n\nCause probable: route manquante ou auth manquante. Vérifier `cy.request` ou baseUrl.';
        }
        if (/or is not a function/.test(msg)) {
          msg += '\n\nSuggestion: remplacez `.or()` par une assertion combinée ou `cy.contains()`.';
        }
        html += `<pre>${escapeHtml(msg)}</pre>`;

        // attach screenshots if any
        const specBase = path.basename(specName).replace(/\\.js$/i, '').toLowerCase();
        const screenshotsDir = path.join(cwd, 'cypress', 'screenshots');
        const relScreens = [];
        if (fs.existsSync(screenshotsDir)) {
          // search recursively for files matching specBase
          const walk = (d) => fs.readdirSync(d).forEach(f => {
            const fp = path.join(d, f);
            if (fs.statSync(fp).isDirectory()) return walk(fp);
            const rel = path.relative(outDir, fp).replace(/\\/g, '/');
            if (f.toLowerCase().includes(specBase) || rel.toLowerCase().includes(specBase)) relScreens.push(rel);
          });
          try { walk(screenshotsDir); } catch(e){}
        }
        if (relScreens.length) {
          relScreens.forEach(rs => {
            html += `<img class="screenshot" src="${rs}" alt="screenshot" />`;
          });
        }
      }
      html += `</div>`; // test
    });

    html += `</div>`; // tests
    html += `</section>`;
  });
}

html += `</main>
<footer>Report generated by scripts/generate-e2e-html-report.js — View locally and use the Download PDF link if REPORT_E2E.pdf exists in repo root.</footer>

<script>
  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  document.querySelectorAll('.toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sec = e.target.closest('.spec');
      const tests = sec.querySelector('.tests');
      tests.style.display = tests.style.display === 'none' ? 'block' : 'none';
    });
  });
  document.getElementById('search').addEventListener('input', (e) => {
    const v = e.target.value.toLowerCase();
    document.querySelectorAll('.spec').forEach(sec => {
      const spec = sec.getAttribute('data-spec').toLowerCase();
      let visible = spec.includes(v);
      sec.querySelectorAll('.test').forEach(test => {
        const title = test.getAttribute('data-title').toLowerCase();
        if (title.includes(v)) visible = true;
      });
      sec.style.display = visible ? '' : 'none';
    });
  });
</script>
</body>
</html>`;

fs.writeFileSync(outFile, html, 'utf8');
console.log('Generated HTML report:', outFile);

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
