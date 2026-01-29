// import { faker } from '@faker-js/faker'; // Removed as per user request to avoid faker in logins

describe('Autorisation de crédit', () => {
  before(() => {
    cy.login();
  });

  it('Autorisation d’un crédit valide', () => {
    cy.visit('/credits');
    // Démarrer une nouvelle demande de crédit
    cy.contains(/Nouveau crédit|Autoriser/).click({ force: true });

    // Remplir le formulaire minimal
    const amount = faker.number.int({ min: 100, max: 5000 });
    cy.get('input[data-cy="credit-amount"], input[name="amount"]').type(String(amount));
    cy.get('input[data-cy="credit-beneficiary"], input[name="beneficiary"]').type(faker.person.fullName());
    cy.get('button[data-cy="submit-credit"], button[type="submit"]').click();

    // S'attendre au succès/approuvé
    cy.get('body').should('contain', 'autorisé').or('contain', 'approuvé').or('contain', 'success');
  });

  it('Refus d’un crédit', () => {
    cy.visit('/credits');
    // Essayer de soumettre un crédit invalide (montant très élevé ou champs manquants)
    const amount = '99999999';
    cy.contains(/Nouveau crédit|Autoriser/).click({ force: true });
    cy.get('input[data-cy="credit-amount"], input[name="amount"]').type(amount);
    cy.get('button[data-cy="submit-credit"], button[type="submit"]').click();

    // S'attendre au refus ou erreur de validation
    cy.get('body').should('contain', 'refus').or('contain', 'rejeté').or('contain', 'erreur');
  });
});
