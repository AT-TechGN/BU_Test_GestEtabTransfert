const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const resultsFile = path.join(cwd, 'cypress', 'results.json');
const outFile = path.join(cwd, 'REPORT_E2E_CLEAN.md');

if (!fs.existsSync(resultsFile)) {
  console.error('cypress/results.json not found');
  process.exit(1);
}

let raw = fs.readFileSync(resultsFile, 'utf8');
// If file contains replacement characters or null bytes, try reading as UTF-16LE
if (raw.indexOf('\uFFFD') !== -1 || raw.indexOf('\0') !== -1) {
  try {
    raw = fs.readFileSync(resultsFile, 'utf16le');
    console.log('Detected UTF-16LE encoding for results.json; re-read accordingly.');
  } catch (e) {
    console.warn('Failed to read as utf16le, continuing with original content.');
  }
}
// Extract JSON blocks by locating occurrences of "\"stats\"" and parsing balanced braces from there
const blocks = [];
let idx = 0;
while (true) {
  const statsIdx = raw.indexOf('"stats"', idx);
  if (statsIdx === -1) break;
  // find the opening brace that starts the object (scan backwards)
  let start = raw.lastIndexOf('{', statsIdx);
  if (start === -1) { idx = statsIdx + 6; continue; }
  // now scan forward to find matching closing brace
  let depth = 0;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end !== -1) {
    const candidate = raw.slice(start, end + 1);
    blocks.push(candidate);
    idx = end + 1;
  } else {
    idx = statsIdx + 6;
  }
}

if (blocks.length === 0) {
  console.error('No JSON blocks found in results.json');
  process.exit(1);
}

const runs = [];
blocks.forEach((b) => {
  try {
    const obj = JSON.parse(b);
    runs.push(obj);
  } catch (e) {
    // try to sanitize common mojibake sequences (windows-1252 misdecoded as utf8)
    let s = b.replace(/├¿/g, 'û').replace(/├®/g, 'é').replace(/├┤/g, 'ô').replace(/ÔÇô/g, '–').replace(/ÔöÉ/g, 'É').replace(/Ôöç/g,'ç').replace(/ÔöÇ/g,'Ç').replace(/Ôöé/g,'é');
    try {
      const obj = JSON.parse(s);
      runs.push(obj);
      return;
    } catch (e2) {
      console.warn('Failed to parse a JSON block, skipping');
    }
  }
});

// Build cleaned markdown
const lines = [];
lines.push('# Rapport E2E (nettoyé)');
lines.push('');
lines.push(`Généré le: ${new Date().toISOString()}`);
lines.push('');
lines.push('---');
lines.push('');

let totalTests = 0, totalPass = 0, totalFail = 0;

runs.forEach((r) => {
  if (r.stats) {
    totalTests += r.stats.tests || 0;
    totalPass += r.stats.passes || 0;
    totalFail += r.stats.failures || 0;
  }
});

lines.push('## Synthèse');
lines.push('');
lines.push(`- Specs traitées: ${runs.length}`);
lines.push(`- Tests totaux: ${totalTests} — Passés: ${totalPass} — Échoués: ${totalFail}`);
lines.push('');
lines.push('---');
lines.push('');

runs.forEach((r) => {
  // get spec name
  let specName = 'unknown spec';
  if (r && r.tests && r.tests.length && r.tests[0].fullTitle) {
    // try infer spec from sample fullTitle
    specName = (r.tests[0].fullTitle.split(' ')[0] || 'spec').toString();
  } else if (r && r.stats && r.stats.spec) {
    specName = r.stats.spec;
  }
  lines.push(`## Spec: ${r.spec ? (r.spec.path || r.spec.name || JSON.stringify(r.spec)) : specName}`);
  lines.push('');
  lines.push(`- Tests: ${r.stats.tests} — Passes: ${r.stats.passes} — Failures: ${r.stats.failures}`);
  lines.push('');

  if (r.tests && r.tests.length) {
    r.tests.forEach((t) => {
      const status = t.err && Object.keys(t.err).length ? 'FAILED' : 'PASSED';
      lines.push(`### ${t.fullTitle || t.title.join(' / ')} — ${status}`);
      lines.push('');
      lines.push(`- Durée (ms): ${t.duration || ''}`);

      if (status === 'FAILED') {
        // clean messages
        const msg = t.err && t.err.message ? String(t.err.message) : (t.err && t.err.stack ? t.err.stack : 'No message');
        // transform known issues
        let cleaned = String(msg).replace(/\r/g, '');
        // Replace the cy.get(...).should(...).or error with actionable note
        if (/or is not a function/.test(cleaned)) {
          cleaned += "\n\nAide: l'utilisation de \".or()\" n'est pas supportée par Cypress. Remplacer par une assertion combinée, par ex.: \nExemple: cy.get(...).invoke('text').should(text => expect(text).to.match(/Sessions|Collecte/)) \nou utiliser cy.contains() pour cibler l'élément par texte.";
        }
        // Improve 404 visits
        if (/404: Not Found/.test(cleaned) || /failed trying to load:\s*https?:\/\//.test(cleaned)) {
          cleaned += '\n\nExplication probable: la route `/sessions` renvoie 404 sur l\'environnement de test (page manquante ou URL modifiée), ou l\'utilisateur n\'est pas authentifié/autorisé. Recommandation: vérifier que `https://test-etabtransfert.badus.app/sessions` répond avec HTTP 200, et que la session est active. Pour diagnostic temporaire, exécuter `cy.visit(\"/sessions\", { failOnStatusCode: false })` pour capturer le HTML retourné.';
        }

        lines.push('');
        lines.push('**Message d\'erreur (nettoyé)**:');
        lines.push('');
        lines.push('```');
        lines.push(cleaned);
        lines.push('```');
        lines.push('');

        // include codeFrame if exists
        if (t.err && t.err.parsedStack && Array.isArray(t.err.parsedStack)) {
          const frame = t.err.parsedStack.find(e => e.codeFrame || e.originalFile || e.relativeFile);
          if (frame && frame.codeFrame) {
            lines.push('**Code frame**:');
            lines.push('');
            lines.push('```js');
            lines.push(frame.codeFrame.frame || frame.codeFrame || '');
            lines.push('```');
            lines.push('');
          }
        }

        // screenshots for failed test
        const screenshotsDir = path.join(cwd, 'cypress', 'screenshots');
        const allScreens = fs.existsSync(screenshotsDir) ? fs.readdirSync(path.join(screenshotsDir, path.basename((r.spec && (r.spec.name || r.spec.path)) || 'sessions') || 'sessions')) : [];
        if (allScreens && allScreens.length) {
          lines.push('**Captures associées**:');
          lines.push('');
          allScreens.forEach(fn => {
            const rel = path.join('cypress', 'screenshots', path.basename((r.spec && (r.spec.name || r.spec.path)) || 'sessions'), fn).replace(/\\/g, '/');
            lines.push(`- ![${fn}](${rel})`);
          });
          lines.push('');
        }
      }

    });
  }

  lines.push('---');
  lines.push('');
});

fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log('Generated cleaned report:', outFile);
