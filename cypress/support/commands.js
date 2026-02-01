// import { faker } from '@faker-js/faker'; // Removed as per user request to avoid faker in logins

// Commande personnalisée de connexion — utilise les variables d'environnement Cypress ou fixtures/users.json.
// Utilisation : cy.login() ou cy.login(numero, password)
Cypress.Commands.add('login', (numero, password) => {
  const envNumero = numero || Cypress.env('USER_Numero') || Cypress.env('CYPRESS_USER_Numero');
  const envPassword = password || Cypress.env('USER_PASSWORD') || Cypress.env('CYPRESS_USER_PASSWORD');

  const performSession = (creds) => {
    cy.session([creds.numero, creds.password], () => {
      cy.visit('/login');
      cy.get('[name="numero"]').clear().type(creds.numero);
      cy.get('[name="current_password"]').clear().type(creds.password, { log: false });
      cy.get('button[type="submit"], button').contains(/Connexion|Se connecter|Login/i).click();
      cy.url({ timeout: 10000 }).should('not.include', '/login');
    }, {
      validate() {
        // Validate by requesting a protected page and requiring HTTP 200
        cy.request({ url: Cypress.config('baseUrl') + '/majors', failOnStatusCode: false }).then((resp) => {
          expect(resp.status, 'expected protected page to be accessible').to.equal(200);
        });
      }
    });
  };

  if (envNumero && envPassword) {
    return performSession({ numero: envNumero, password: envPassword });
  }

  return cy.fixture('users').then((users) => {
    const u = users && users.admin ? users.admin : (Array.isArray(users) ? users[0] : users || {});
    const final = {
      numero: envNumero || u.numero,
      password: envPassword || u.password,
    };
    if (!final.numero || !final.password) {
      throw new Error('No credentials provided. Set Cypress env vars (USER_Numero, USER_PASSWORD) or update cypress/fixtures/users.json');
    }
    return performSession(final);
  });

});
Cypress.Commands.add('setDateDebut', (selector, value) => {
  cy.get(selector).then(($els) => {
    const $el = $els.first();
    cy.wrap($el).invoke('val', value).trigger('change');
  });
});
Cypress.Commands.add('setDateFin', (selector, value) => {
  cy.get(selector).then(($els) => {
    const $el = $els.first();
    cy.wrap($el).invoke('val', value).trigger('change');
  });
});

//Message succès 
Cypress.Commands.add('messageSucces', (selector) =>{
  cy.get(selector)
  .should('contain', 'Ajout effectué avec succès');
})

//Message danger 
Cypress.Commands.add('danger', (selector) =>{
  cy.get(selector)
  .should('contain', 'Modifier')
})




// Les sélecteurs sont génériques et doivent être adaptés à l'application si nécessaire.
// Cypress.Commands.add('createEtablissement', (overrides = {}) => {
//   const name = overrides.name || faker.company.name();
//   const phone = overrides.phone || faker.phone.number('06########');
//   const address = overrides.address || faker.location.streetAddress();

//   // Navigue vers la page de création — ajuster la route si besoin
//   cy.visit('/etablissements/new');
//   cy.get('input[data-cy="etab-name"], input[name="name"]').clear().type(name);
//   cy.get('input[data-cy="etab-phone"], input[name="phone"]').clear().type(phone);
//   cy.get('input[data-cy="etab-address"], input[name="address"]').clear().type(address);
//   cy.get('.btn').click();

//   // Retourne les valeurs créées pour les assertions
//   return cy.wrap({ name, phone, address });
// });
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
// -- This will overwrite an existing command -