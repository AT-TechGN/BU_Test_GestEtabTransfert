import { faker } from '@faker-js/faker';

describe('Autorisation de crédit', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/credit-authorizations');
  });

  it('Autorisation d’un crédit valide', () => {

    const amount = faker.number.int({ min: 10000000, max: 99999999 }).toString();
    const startedAt = faker.date.future().toISOString().split('T')[0];
    const endedAt = faker.date.future({ years: 1 }).toISOString().split('T')[0];

    // Nouvelle demande — utiliser un sélecteur résilient basé sur le texte
    cy.get('.card-header > .btn').click();

    // attendre la navigation vers la page de création
    cy.url({ timeout: 10000 }).should('include', '/credit-authorizations/create');
    cy.get('form').should('exist');

    // =========================
    // FORMULAIRE
    // =========================

    // Bénéficiaire
    cy.get('[name="beneficiary_id"]')
      .should('not.be.disabled')
      .select(1); // idéalement par texte

    // Montant
    cy.get('[name="ceiling_amount"]')
      .clear()
      .type(amount);

    // Devise — choisir une option non-disabled par index/value plutôt que texte encodé
    cy.get('[name="currency_id"]').then(($sel) => {
      const $opts = $sel.find('option:not(:disabled)');
      if ($opts.length > 1) {
        const val = $opts.eq(1).val();
        cy.get('[name="currency_id"]').select(val);
      } else {
        // fallback: select first option
        const val = $opts.eq(0).val();
        cy.get('[name="currency_id"]').select(val);
      }
    });

    // Dates
    cy.setDateDebut('[name="started_at"]', startedAt)

    cy.setDateFin('[name="ended_at"]', endedAt);


    // Validation
    cy.get('.text-center > #btnnSubmit').click();

    // Assertion métier
    
  });

});
