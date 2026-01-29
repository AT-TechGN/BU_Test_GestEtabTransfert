# Cypress E2E — E-GestEtab (BU_Test ready)

This repo contains a professional Cypress E2E scaffold for E-GestEtab (test environment).

Prerequisites
- Node.js + npm
- Cypress installed in the project
- `@faker-js/faker` installed (already present in this workspace)

Quick start

1. Provide credentials via environment variables or update `cypress/fixtures/users.json`:

  - `USER_NUMBER` and `USER_PASSWORD` (Cypress env) or edit the fixture.

2. Run tests in interactive mode:

```bash
npx cypress open
```

3. Run full headless suite:

```bash
npx cypress run
```

Reporting
--------
This scaffold doesn't force a reporter so you can pick your preferred one.
Recommended: `mochawesome` for HTML reports.

Install reporter (example):

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Run with reporter:

```bash
npx cypress run --reporter mochawesome --reporter-options reportDir=cypress/reports,overwrite=false
```

Then merge/generate the final HTML report (example):

```bash
npx mochawesome-merge cypress/reports/*.json > mochawesome.json
npx mochawesome-report-generator mochawesome.json -o cypress/reports/html-report
```

Selectors & Adaptation
----------------------
The tests use stable selectors when possible (`data-cy`) and include fallback generic selectors. You should adapt selectors in `cypress/support/commands.js` and test files to the actual DOM of https://test-etabtransfert.badus.app if needed.

What was added
--------------
- `cypress/config.js` updated with `baseUrl` and sensible defaults.
- `cypress/fixtures/users.json` — placeholder to store credentials.
- `cypress/support/commands.js` — `cy.login()` and `cy.createEtablissement()` helpers.
- `cypress/support/e2e.js` — support entrypoint.
- E2E suites under `cypress/e2e/` organized by feature: `auth`, `majors`, `etablissements`, `credits`, `sessions`.

Next steps
----------
- Replace placeholder credentials with a test account or set env vars.
- Tweak selectors to match the app (data-cy attributes are preferred).
- Optionally install a reporter and enable the reporter commands above to produce HTML test reports.

Contact
-------
If you want, I can adapt selectors to the live DOM (I can inspect pages and refine tests). Run the suite and provide failing test output / page HTML and I will update selectors.
