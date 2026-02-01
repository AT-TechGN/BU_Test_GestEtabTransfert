const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function sanitizeForMatch(s) {
  if (!s) return '';
  return s.replace(/["'`\\\/\s():]/g, '').toLowerCase();
}

(async () => {
  try {
    const cwd = process.cwd();
    const resultsPath = path.join(cwd, 'cypress', 'results.json');

    // If no existing results JSON, run Cypress to produce it and capture stdout reliably
    let raw = null;
    if (!fs.existsSync(resultsPath)) {
      console.log('Aucun fichier cypress/results.json trouvé — lancement de Cypress (reporter json)...');
      try {
        // capture stdout (reporter json prints JSON to stdout)
        const cmd = 'npx cypress run --reporter json --spec "cypress/e2e/**"';
        const stdout = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], shell: true });
        raw = stdout;
        // write raw stdout to resultsPath
        fs.writeFileSync(resultsPath, raw, 'utf8');
      } catch (err) {
        // try to salvage stdout from error object
        if (err && err.stdout) {
          raw = err.stdout.toString();
          try { fs.writeFileSync(resultsPath, raw, 'utf8'); } catch (e) {}
        }
        console.error("Echec lors de l'exécution de Cypress. Voir la sortie ci-dessus.");
        if (!raw) process.exit(1);
      }
    }

    if (!raw) raw = fs.readFileSync(resultsPath, 'utf8');

    // Try to parse raw as JSON; if there are stray logs, extract JSON substring
    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      // attempt to locate first/last brace pair
      const first = raw.indexOf('{');
      const last = raw.lastIndexOf('}');
      if (first >= 0 && last > first) {
        const sub = raw.slice(first, last + 1);
        try {
          json = JSON.parse(sub);
        } catch (e2) {
          console.error('Impossible de parser la sortie JSON de Cypress. Contenu extrait non valide.');
          throw e2;
        }
      } else {
        console.error('Aucun JSON détecté dans la sortie de Cypress.');
        throw e;
      }
    }

    // sanitize parsed stack entries and error messages to remove empty/whitespace-only nodes
    function cleanParsedStack(parsedStack) {
      if (!Array.isArray(parsedStack)) return parsedStack;
      return parsedStack
        .map((entry) => {
          const out = { ...entry };
          if (typeof out.message === 'string') out.message = out.message.replace(/\r/g, '').trim();
          if (typeof out.whitespace === 'string') out.whitespace = out.whitespace.replace(/\r/g, '');
          return out;
        })
        .filter((e) => {
          // keep if any useful field exists
          const hasMessage = e.message && e.message.trim().length > 0;
          const hasFunction = e.function && e.function.trim().length > 0;
          const hasFile = e.fileUrl || e.originalFile || e.relativeFile || e.absoluteFile || e.codeFrame;
          return hasMessage || hasFunction || hasFile;
        });
    }

    // normalize test attempt errors to include cleaned parsedStack and trimmed messages
    if (json.runs && Array.isArray(json.runs)) {
      json.runs.forEach((run) => {
        if (run.tests && Array.isArray(run.tests)) {
          run.tests.forEach((t) => {
            // attempts may hold err
            if (t.attempts && Array.isArray(t.attempts)) {
              t.attempts.forEach((a) => {
                if (a.err && a.err.parsedStack) a.err.parsedStack = cleanParsedStack(a.err.parsedStack);
                if (a.err && a.err.message) a.err.message = String(a.err.message).replace(/\r/g, '').trim();
              });
            }
            if (t.err && t.err.parsedStack) t.err.parsedStack = cleanParsedStack(t.err.parsedStack);
            if (t.err && t.err.message) t.err.message = String(t.err.message).replace(/\r/g, '').trim();
          });
        }
      });
    }

    // Basic stats
    const stats = json.stats || {};
    const totals = {
      tests: stats.tests || 0,
      passes: stats.passes || 0,
      failures: stats.failures || 0,
      pending: stats.pending || 0,
      duration: stats.duration || 0
    };

    // Gather screenshots
    const screenshots = walk(path.join(cwd, 'cypress', 'screenshots'));

    // Build markdown
    const author = process.env.TEST_AUTHOR || process.env.USER || 'N/A';
    const baseUrl = (function () {
      try {
        const cfg = fs.readFileSync(path.join(cwd, 'cypress.config.js'), 'utf8');
        const m = cfg.match(/baseUrl:\s*(?:process.env\.[A-Z_]+\s*\|\s*)?["']([^"']+)["']/m);
        return m ? m[1] : 'N/A';
      } catch (e) {
        return 'N/A';
      }
    })();

    const lines = [];
    lines.push('# Rapport E2E — Exécution complète');
    lines.push('');
    lines.push(`- **Application**: E-GestEtab (test)`);
    lines.push(`- **Base URL**: ${baseUrl}`);
    lines.push(`- **Généré le**: ${new Date().toISOString()}`);
    lines.push(`- **Auteur**: ${author}`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 1. Synthèse');
    lines.push('');
    lines.push(`- Specs exécutées: ${json.runs ? json.runs.length : 0}`);
    lines.push(`- Tests: ${totals.tests} — Passés: ${totals.passes} — Échoués: ${totals.failures} — Skippés: ${totals.pending}`);
    lines.push(`- Durée totale (ms): ${totals.duration}`);
    lines.push('');

    lines.push('---');
    lines.push('');
    lines.push('## 2. Détails par spec');
    lines.push('');

    if (!json.runs || json.runs.length === 0) {
      lines.push('Aucune exécution trouvée dans le fichier de résultats.');
    } else {
      json.runs.forEach((run) => {
        const specRel = path.relative(cwd, run.spec.absolute || run.spec.path || run.spec.name);
        lines.push(`### Spec: ${specRel}`);
        lines.push('');
        const specPass = (run.stats && run.stats.passes) || 0;
        const specFail = (run.stats && run.stats.failures) || 0;
        const specTests = (run.stats && run.stats.tests) || 0;
        lines.push(`- Tests: ${specTests} — Passés: ${specPass} — Échoués: ${specFail}`);
        lines.push(`- Durée (ms): ${(run.stats && run.stats.duration) || 0}`);
        lines.push('');

        // List tests
        if (run.tests && run.tests.length) {
          lines.push('| Statut | Titre | Durée (ms) |');
          lines.push('|---|---|---:|');
          run.tests.forEach((t) => {
            const status = t.state || (t.failures && t.failures.length ? 'failed' : 'unknown');
            lines.push(`| ${status} | ${t.title.join(' / ')} | ${(t.attempts && t.attempts[0] && t.attempts[0].duration) || ''} |`);
          });
          lines.push('');
        }

        // Failures details
        const failures = run.tests ? run.tests.filter((t) => t.state === 'failed' || (t.attempts && t.attempts.some(a => a.state === 'failed'))) : [];
        if (failures.length) {
          lines.push('#### Échecs');
          lines.push('');
          failures.forEach((f, idx) => {
            const title = f.title.join(' / ');
            const err = (f.attempts && f.attempts[0] && f.attempts[0].err) || f.err || {};
            lines.push(`- **${title}**`);
            if (err.message) lines.push(`  - Message: \n\n    ${'```'}\n${err.message}\n${'```'}`);
            if (err.stack) lines.push(`  - Stack: \n\n    ${'```'}\n${err.stack}\n${'```'}`);

            // Try to find screenshot(s) for this failed test
            const specBase = path.basename(run.spec.name || run.spec.path || run.spec.absolute || 'spec');
            const cand = screenshots.filter(s => {
              const rel = path.relative(cwd, s).replace(/\\/g, '/').toLowerCase();
              // match spec name and part of test title
              return rel.includes(specBase.toLowerCase().replace('.js','')) && rel.includes(sanitizeForMatch(title));
            });
            if (cand.length) {
              lines.push('  - Captures:');
              cand.forEach((c) => {
                lines.push(`    - ![${path.basename(c)}](${path.relative(cwd, c).replace(/\\/g, '/')})`);
              });
            }

          });
          lines.push('');
        }

        lines.push('---');
        lines.push('');
      });
    }

    lines.push('## 3. Recommandations');
    lines.push('');
    lines.push('- Utiliser `data-cy` pour éléments critiques.');
    lines.push('- Remplacer `:nth-child()` par sélecteurs métier ou `cy.contains()`.');
    lines.push('- Utiliser `cy.session()` pour stabiliser l\'authentification.');
    lines.push('- Ajouter surveillance des routes 404/500 sur pages protégées.');

    const out = lines.join('\n');
    const outFile = path.join(cwd, 'REPORT_E2E.md');
    fs.writeFileSync(outFile, out, 'utf8');

    console.log('Rapport complet généré:', outFile);
    console.log('Pour générer le PDF: node scripts/generate-e2e-report-pdf.js (ou npm run generate-e2e-pdf)');

  } catch (err) {
    console.error('Erreur lors de la génération du rapport complet:', err);
    process.exit(1);
  }
})();
