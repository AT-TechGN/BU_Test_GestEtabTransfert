// Point d'entrée de support pour tous les tests e2e
import './commands';

// Garder les tests robustes face aux erreurs inattendues de l'application
Cypress.on('uncaught:exception', (err, runnable) => {
  // Retourner false ici empêche Cypress d'échouer sur le test
  return false;
});

// Viewport par défaut pour la cohérence
before(() => {
  cy.viewport(1280, 800);
});

// Bloquer ou stubber les ressources tierces qui empêchent parfois le 'load' event
beforeEach(() => {
  const blocked = [
    '**/analytics.js',
    '**/gtag/js**',
    '**/googletagmanager.com/**',
    '**/google-analytics.com/**',
    '**/fonts.googleapis.com/**',
    '**/fonts.gstatic.com/**',
    '**/cdn.segment.com/**'
  ];
  blocked.forEach((pattern) => cy.intercept({ url: pattern }, { statusCode: 200, body: '' }));
});
// ***********************************************************
// Ce fichier support/e2e.js exemple est traité et
// chargé automatiquement avant vos fichiers de test.
//
// C'est un excellent endroit pour mettre la configuration globale et
// le comportement qui modifie Cypress.
//
// Vous pouvez changer l'emplacement de ce fichier ou désactiver
// la diffusion automatique des fichiers de support avec
// l'option de configuration 'supportFile'.
//
// Vous pouvez en lire plus ici :
// https://on.cypress.io/configuration
// ***********************************************************

// Importer commands.js en utilisant la syntaxe ES2015 :
import './commands'