// import { faker } from '@faker-js/faker'; // Removed as per user request to avoid faker in logins

// Commande personnalisée de connexion — utilise les variables d'environnement Cypress ou fixtures/users.json.
// Utilisation : cy.login() ou cy.login(numero, password)
Cypress.Commands.add('login', (numero, password) => {
  const providedNumero = numero || Cypress.env('USER_Numero') || Cypress.env('CYPRESS_USER_Numero');
  const providedPassword = password || Cypress.env('USER_PASSWORD') || Cypress.env('CYPRESS_USER_PASSWORD');

  const creds = { numero: providedNumero, password: providedPassword };

  if (!creds.numero || !creds.password) {
    // Try fixtures fallback
    cy.fixture('users').then((users) => {
      const u = users && users.admin ? users.admin : {};
      creds.numero = creds.numero || u.numero;
      creds.password = creds.password || u.password;
      if (!creds.numero || !creds.password) {
        throw new Error('No credentials provided. Set Cypress env vars (USER_Numero, USER_PASSWORD) or update cypress/fixtures/users.json');
      }
    });
  }

  // Use cy.session to cache authentication and speed up tests
  cy.session([creds.numero, creds.password], () => {
    cy.visit('/login');
    cy.get('[name="numero"]').clear().type(creds.numero);
    cy.get('[name="current_password"]').clear().type(creds.password, { log: false });
    cy.get('.btn').click();
    // Ensure login succeeded by asserting we're not on the login page
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  }, {
    validate() {
      // Basic validation: visiting a protected page should not redirect to login
      cy.request({ url: Cypress.config('baseUrl') + '/majors', failOnStatusCode: false }).then((resp) => {
        // If the server returns 200, assume session valid; otherwise force a new session
        expect([200, 302, 304]).to.include(resp.status);
      });
    }
  });

});

// Commande utilitaire pour créer un établissement via l'interface utilisateur.
// Les sélecteurs sont génériques et doivent être adaptés à l'application si nécessaire.
Cypress.Commands.add('createEtablissement', (overrides = {}) => {
  const name = overrides.name || faker.company.name();
  const phone = overrides.phone || faker.phone.number('06########');
  const address = overrides.address || faker.location.streetAddress();

  // Navigue vers la page de création — ajuster la route si besoin
  cy.visit('/etablissements/new');
  cy.get('input[data-cy="etab-name"], input[name="name"]').clear().type(name);
  cy.get('input[data-cy="etab-phone"], input[name="phone"]').clear().type(phone);
  cy.get('input[data-cy="etab-address"], input[name="address"]').clear().type(address);
  cy.get('.btn').click();

  // Retourne les valeurs créées pour les assertions
  return cy.wrap({ name, phone, address });
});
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (numero, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })