const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    // URL de base pour les tests — peut être surchargée via la variable d'environnement `CYPRESS_BASE_URL`
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://test-etabtransfert.badus.app',
    // Motif pour récupérer nos tests
    specPattern: 'cypress/e2e/**/*.cy.js',
    // Utiliser le point d'entrée de support que nous fournissons
    supportFile: 'cypress/support/e2e.js',
    defaultCommandTimeout: 8000,
    // Temps d'attente pour l'événement 'load' de la page (augmenté pour pages lentes)
    pageLoadTimeout: 120000,
    video: false,
    setupNodeEvents(on, config) {
      // Implémenter les écouteurs d'événements de nœud ici (reporters/plugins)
      return config;
    },
  },
});
