import { faker } from '@faker-js/faker';

describe('Authentification', () => {
  // Utiliser un compte réel fourni via env ou fixture. Les tests sont indépendants.
  beforeEach(() => {
    // Utiliser une URL relative ; `baseUrl` est lu depuis `cypress.config.js`
    cy.visit('/login');
  });

  it('Connexion avec identifiants valides', () => {
    // Utiliser cy.login() qui lit depuis env ou fixtures
    cy.login();
 
  });

  it('Connexion avec identifiants invalides', () => {
    const badNumero = faker.phone.number();
    const badPassword = faker.internet.password();

    cy.get('input[data-cy="numero"], input[name="numero"], input[type="numero"]').clear().type(badNumero);
    cy.get('input[data-cy="password"], input[name="password"], input[type="password"]').clear().type(badPassword);
    cy.get('.btn').click();

    // S'attendre à un message d'erreur
    //cy.get('body').should('contain', 'identifiants invalides').or('contain', 'invalid');
  });
});
