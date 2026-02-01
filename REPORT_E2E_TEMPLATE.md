# Rapport E2E — Tests Cypress (Template)

**Résumé exécutif**
- **Application**: E-GestEtab (test)
- **URL de test**: https://test-etabtransfert.badus.app
- **Date du run**: {{RUN_DATE}}
- **Auteur**: {{TEST_AUTHOR}}

**Objectif du rapport**
Présenter les résultats E2E (stabilité, regressions, captures d'écran) de façon claire et actionnable pour le BU.

---

## 1. Contexte et périmètre
- Suites exécutées: `cypress/e2e/**` (spécifier les specs lancées)
- Environnement: navigateur (ex: Chrome headless), OS (Windows), baseUrl
- Métriques attendues: stabilité, temps moyen par spec, screenshots des échecs

## 2. Synthèse des résultats
- Total specs exécutées: {{TOTAL_SPECS}}
- Tests totaux: {{TOTAL_TESTS}} — Passés: {{PASSED}} — Échoués: {{FAILED}} — Skippés: {{PENDING}}
- Durée totale: {{DURATION}}

## 3. Liste des specs (résumé)
- `cypress/e2e/auth/auth.cy.js` — OK / KO
- `cypress/e2e/majors/majors.cy.js` — OK / KO
- `cypress/e2e/credits/credits.cy.js` — OK / KO
(ajouter détails / liens vers sections suivantes)

## 4. Détails des échecs (pour revue)
Pour chaque test échoué, fournir:
- **Nom du test**: 
- **Spec**: 
- **Message d'erreur**: 
- **Étapes reproduites**: 1) 2) 3)
- **Capture d'écran**: ![screenshot](cypress/screenshots/path/to/screenshot.png)
- **Logs / XHR pertinents**: (ex: 302 → /login)
- **Impact métier**: (faible/moyen/élevé)
- **Recommandation**: (ex: utiliser cy.session(), remplacer nth-child)

## 5. Galerie des captures d'écran (automatique)
Les images sont normalement situées dans `cypress/screenshots`. Le rapport auto-généré placera les captures sous les rubriques correspondantes.

## 6. Vidéos
Si activé, les vidéos sont dans `cypress/videos` et référencées ici.

## 7. Recommandations générales
- Toujours utiliser `data-cy` ou attributs `data-test` pour cibles stables.
- Favoriser `cy.session()` pour garder une session rapide et stable.
- Vérifier `cy.request()` dans la validation de session et exiger HTTP 200 sur page protégée.
- Remplacer `:nth-child()` et sélecteurs dépendants de Bootstrap par `cy.contains()` ou `data-cy`.

## 8. Commandes utiles (exécution + génération de rapport)
```bash
# Run full suite (headless) and keep screenshots/videos on failure
npx cypress run --record=false

# Run a single spec and save screenshots
npx cypress run --spec "cypress/e2e/credits/credits.cy.js"

# After run, generate a markdown report with screenshots (script provided)
node scripts/generate-e2e-report.js
```

## 9. Annexes
- Emplacement des screenshots: `cypress/screenshots`
- Emplacement des vidéos: `cypress/videos`
- Fichiers de configuration: `cypress.config.js`

---

> Template généré automatiquement. Pour un rapport finalisé, exécuter le script `scripts/generate-e2e-report.js` qui injectera les captures et métriques réelles.
