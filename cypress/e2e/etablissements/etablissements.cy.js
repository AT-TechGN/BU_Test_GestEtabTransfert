import { faker } from '@faker-js/faker';

describe('Établissements de transfert – Ajout & Modification', () => {

  beforeEach(() => {
    cy.login();
    cy.visit('/transfer-estabs');
  });

  it('Ajouter un établissement de transfert', () => {
    const etabName = `ETAB ${faker.company.name()}`;
    const phone = '610000000';
    const email = faker.internet.email();
    const number = faker.string.numeric(8);

    // Ouvrir le formulaire d’ajout
    cy.get('.card-header > :nth-child(2) > .btn').click();

    // Informations générales
    cy.get('[name="name"]').type(etabName);
    cy.get('[name="acronym"]').type(faker.string.numeric(5));
    cy.get('[name="origin"]').type('NATIONAL{enter}');
    cy.get('[name="email"]').type(email)
    cy.get('[name="phone"]').type(phone);
    cy.get('[name="numero"]').type(number);
    cy.get('[name="email"]').type(email);

    // Origine & forme juridique (déjà préremplies mais on sécurise)
    cy.contains('NATIONAL').click({ force: true });
    cy.contains('PARTICULIER').click({ force: true });

    // Localisation
    cy.contains('GUINEE').should('exist');
    cy.get('select').eq(0).select(1); // Région
    cy.get('select').eq(1).select(1); // Localité

    // Valider
    cy.contains('button', 'Confirmer').click();

    // Assertion métier
    cy.contains(etabName, { timeout: 10000 }).should('be.visible');
  });

  it('Modifier un établissement existant', () => {
    const newPhone = '+224622999999';

    // Ouvrir le détail du premier établissement
    cy.get('table tbody tr').first().within(() => {
      cy.get('button').first().click(); // bouton action (bleu)
    });

    // Modifier téléphone
    cy.get('input[placeholder*="téléphone"]')
      .clear()
      .type(newPhone);

    cy.contains('button', 'Confirmer').click();

    // Vérification
    cy.contains(newPhone, { timeout: 10000 }).should('be.visible');
  });

});
