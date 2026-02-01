# Cypress E2E — E-GestEtab (BU_Test prêt)

Ce dépôt contient un échafaudage professionnel Cypress E2E pour E-GestEtab (environnement de test).

## Description
Suite de tests E2E Cypress pour l'application web E-GestEtab, dédiée à la gestion des établissements de transfert d'argent. Couvre les fonctionnalités d'authentification, gestion des majors, établissements, crédits et sessions.

## Prérequis
- Node.js + npm
- Cypress installé dans le projet
- `@faker-js/faker` installé (déjà présent dans cet espace de travail)
- Chrome installé localement (recommandé pour la génération de rapports PDF)

## Installation
1. Cloner le dépôt : https://github.com/AT-TechGN/BU_Test_GestEtabTransfert.git
2. Installer les dépendances :
```bash
npm install
```

## Démarrage rapide
1. Fournir les identifiants via variables d'environnement ou mettre à jour `cypress/fixtures/users.json` :
   - `USER_Numero` et `USER_PASSWORD` (variables d'environnement Cypress) ou éditer le fixture.

2. Exécuter les tests en mode interactif :
```bash
npx cypress open
```

3. Exécuter la suite complète en mode headless :
```bash
npx cypress run
```

## Scripts
- `npm run install-deps` : Installer les dépendances
- `npm run generate-e2e-md-report` : Générer le rapport E2E en Markdown
- `npm run generate-e2e-pdf` : Générer le rapport E2E en PDF
- `npm run generate-e2e-html` : Générer le rapport E2E en HTML

## Structure des fichiers
- `cypress.config.js` : Configuration Cypress avec baseUrl et paramètres par défaut
- `cypress/e2e/` : Tests organisés par fonctionnalité (auth, majors, établissements, crédits, sessions)
- `cypress/fixtures/users.json` : Données de test pour les identifiants
- `cypress/support/commands.js` : Commandes personnalisées (cy.login(), cy.setDateDebut(), cy.setDateFin(), cy.messageSucces(), cy.danger())
- `scripts/` : Scripts pour génération de rapports (MD, HTML, PDF)
- `REPORTING.md` : Instructions détaillées pour la génération de rapports PDF
- `Plan_Test_E-GestEtab.docx` et `Use_Cases_E-GestEtab.docx` : Documentation du plan de test et cas d'usage

## Reporting
Ce projet inclut des scripts avancés pour générer des rapports détaillés.

### Rapport HTML (optionnel)
Installer un reporter comme mochawesome :
```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

Exécuter avec reporter :
```bash
npx cypress run --reporter mochawesome --reporter-options reportDir=cypress/reports,overwrite=false
```

Fusionner/générer le rapport HTML final :
```bash
npx mochawesome-merge cypress/reports/*.json > mochawesome.json
npx mochawesome-report-generator mochawesome.json -o cypress/reports/html-report
```

### Rapport PDF
Voir `REPORTING.md` pour des instructions détaillées sur la génération de rapports PDF utilisant Puppeteer.

Étapes rapides :
1. Définir le chemin vers Chrome :
```powershell
$env:PUPPETEER_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
```

2. Générer le PDF :
```bash
npm run generate-e2e-pdf
```

Variables d'environnement :
- `PUPPETEER_SKIP_DOWNLOAD=1` : Empêche le téléchargement de Chromium
- `PUPPETEER_EXECUTABLE_PATH` : Chemin vers Chrome local
- `TEST_AUTHOR` : Nom de l'auteur pour l'en-tête du PDF

## Sélecteurs & Adaptation
Les tests utilisent des sélecteurs stables quand possible (`data-cy`) et incluent des sélecteurs génériques de secours. Vous devriez adapter les sélecteurs dans `cypress/support/commands.js` et les fichiers de test au DOM réel de https://test-etabtransfert.badus.app si nécessaire.

## Ce qui a été ajouté
- `cypress/config.js` mis à jour avec `baseUrl` et paramètres par défaut.
- `cypress/fixtures/users.json` — espace réservé pour stocker les identifiants.
- `cypress/support/commands.js` — aides `cy.login()` et autres commandes personnalisées (cy.setDateDebut, cy.setDateFin, cy.messageSucces, cy.danger).
- `cypress/support/e2e.js` — point d'entrée de support.
- Suites E2E sous `cypress/e2e/` organisées par fonctionnalité : `auth`, `majors`, `etablissements`, `credits`, `sessions`.
- Scripts de génération de rapports (MD, HTML, PDF).
- Configuration pour génération de rapports PDF avec Puppeteer.
- Documentation : Plan de test et cas d'usage en format DOCX.

## Prochaines étapes
- Remplacer les identifiants de substitution par un compte de test ou définir des variables d'environnement.
- Ajuster les sélecteurs pour correspondre à l'application (les attributs `data-cy` sont préférés).
- Installer un reporter optionnellement et activer les commandes de reporter ci-dessus pour produire des rapports de test HTML.
- Générer des rapports PDF en suivant les instructions dans `REPORTING.md`.
- Examiner les fichiers de documentation (Plan_Test_E-GestEtab.docx, Use_Cases_E-GestEtab.docx) pour comprendre les exigences des tests.

## Contact
Si vous le souhaitez, je peux adapter les sélecteurs au DOM en direct (je peux inspecter les pages et affiner les tests). Exécutez la suite et fournissez la sortie des tests échouants / HTML de la page et je mettrai à jour les sélecteurs.
