REPORT — Génération PDF des rapports E2E

But: Ce fichier rassemble les commandes et solutions pour générer le rapport PDF à partir des tests Cypress (screenshots générés dans `cypress/screenshots`).

Pré-requis
- Node.js (v16+ recommandé, Node 22 fonctionne)
- npm
- Chrome installé localement (recommandé) ou accès réseau pour permettre Puppeteer à télécharger Chromium

Étapes rapides (PowerShell)

1) Nettoyer et installer dépendances (si problèmes de permissions, ouvrir PowerShell en administrateur)

```powershell
# supprimer node_modules si corrompu / verrouillé
Remove-Item -Recurse -Force .\node_modules
npm cache clean --force
```

2) Installer sans forcer le téléchargement de Chromium (évite erreurs réseau)

```powershell
# Empêche Puppeteer de télécharger Chromium
$env:PUPPETEER_SKIP_DOWNLOAD = "true"
npm install
```

3) Utiliser Chrome local pour générer le PDF (recommandé)

```powershell
# Définir le chemin vers chrome.exe (PowerShell)
$env:PUPPETEER_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
# Générer le PDF
node scripts/generate-e2e-report-pdf.js
```

4) Alternative — autoriser Puppeteer à télécharger Chromium (nécessite connexion stable)

```powershell
# supprimer node_modules si nécessaire
Remove-Item -Recurse -Force .\node_modules
# retirer la variable skip et réinstaller
$env:PUPPETEER_SKIP_DOWNLOAD = ""
npm install
node scripts/generate-e2e-report-pdf.js
```

5) Générer d'abord le markdown (galerie d'images) si besoin

```powershell
# Exécuter les tests (prod des screenshots)
npx cypress run --spec "cypress/e2e/**"
# Regénérer le markdown auto-généré
node scripts/generate-e2e-report.js
```

Variables d'environnement utiles
- `PUPPETEER_SKIP_DOWNLOAD=1` : empêche le téléchargement de Chromium lors de `npm install`.
- `PUPPETEER_EXECUTABLE_PATH` : chemin absolu vers `chrome.exe`/`chromium` si présent localement.
- `TEST_AUTHOR` : nom de l'auteur qui apparaîtra dans l'en-tête du PDF (optionnel).

Dépannage rapide
- EPERM lors de suppression de dossiers `node_modules`: fermez VS Code/terminaux, lancez PowerShell en administrateur et réessayez `Remove-Item -Recurse -Force .\node_modules`.
- ECONNRESET pendant l'installation: réseau instable empêchant le téléchargement de Chromium — utiliser `PUPPETEER_SKIP_DOWNLOAD` et un Chrome local.
- Si `puppeteer.launch()` échoue: définissez `PUPPETEER_EXECUTABLE_PATH` vers votre Chrome, ou réinstallez Puppeteer sans skip-download.

Exemples pratiques
- Générer PDF en une commande (avec Chrome local défini) :
```powershell
$env:PUPPETEER_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
node scripts/generate-e2e-report-pdf.js
```

- Générer tout (tests -> markdown -> pdf) :
```powershell
npx cypress run --spec "cypress/e2e/**"
node scripts/generate-e2e-report.js
$env:PUPPETEER_EXECUTABLE_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
node scripts/generate-e2e-report-pdf.js
```

Points d'amélioration possibles
- Ajouter un CLI optionnel acceptant `--author`, `--output`.
- Intégration CI: installer Chrome sur l'agent ou permettre le téléchargement de Chromium (sans `PUPPETEER_SKIP_DOWNLOAD`).

Fichier générés
- `REPORT_E2E_AUTOGEN.md` : galerie auto (images)
- `REPORT_E2E.pdf` : PDF final
- `REPORT_E2E_TEMPLATE.md` : template pour résumer et présenter au BU

Si vous voulez, j'ajoute :
- Un petit CLI (node) `npm run report -- --author "Votre Nom" --out report.pdf`.
- Support d'un header/foot personnalisé (numérotation, page X/Y).
