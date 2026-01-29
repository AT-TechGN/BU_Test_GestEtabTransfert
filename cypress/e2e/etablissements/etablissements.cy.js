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

    // Origine & forme juridique (déjà préremplies mais on sécurise)
    cy.contains('NATIONAL').click({ force: true });
    cy.contains('PARTICULIER').click({ force: true });

    // ================================
    // LOCALISATION — SELECTS AJAX
    // ================================

    // 1️⃣ Pays
    cy.get('select[name="countryId"]')
      .should('be.visible')
      .and('not.be.disabled')
      .select('GUINEE');

    // Vérifier que le pays est bien sélectionné
    cy.get('select[name="countryId"]')
      .find(':selected');

    // 2️⃣ Région (chargée après sélection du pays)
    cy.get('[name="locality_id"]')
      .should('be.visible')
      .and('not.be.disabled')
      .find('option')
      .should('have.length.greaterThan', 1);

    cy.get('[name="locality_id"]').select('Conakry');

    // Vérification métier
    cy.get('[name="locality_id"]')
      .find(':selected');

    // 3️⃣ Localité (chargée après sélection région)
    cy.get('select[name="locaity_id"]')
      .should('be.visible')
      .and('not.be.disabled')
      .find('option')
      .should('have.length.greaterThan', 1);

    cy.get('[name="locaity_id"]').select('DIXINN');

    // Vérification finale
    cy.get('[name="locaity_id"]')
      .find(':selected');

    // 4️⃣ Valider
    cy.contains('button', 'Confirmer').should('be.enabled').click();


    // Assertion métier
    cy.get('.alert-success').should('contain', 'Ajout effectué avec succès');
  });

  it('Modifier complètement un établissement existant', () => {

    const newName = `ETAB MOD ${faker.company.name()}`;
    const newPhone = '+224622999999';
    const newEmail = faker.internet.email();
    const newNumber = faker.string.numeric(8);
    const newAcronym = faker.string.numeric(5);

    // ================================
    // Ouvrir la page de modification
    // ================================
    cy.get('table tbody tr')
      .should('have.length.greaterThan', 0);

    cy.get('table tbody tr').first().within(() => {
      cy.get('button.btn-primary')
        .should('be.visible')
        .click();
    });

    // ================================
    // INFORMATIONS GÉNÉRALES
    // ================================
    cy.get('[name="name"]').clear().type(newName);
    cy.get('[name="acronym"]').clear().type(newAcronym);

    cy.get('[name="origin"]')
      .clear()
      .type('NATIONAL{enter}');

    cy.get('[name="email"]').clear().type(newEmail);
    cy.get('[name="phone"]').clear().type(newPhone);
    cy.get('[name="numero"]').clear().type(newNumber);

    // Forme juridique
    cy.contains('PARTICULIER').click({ force: true });

    // ================================
    // LOCALISATION — SELECTS AJAX
    // ================================

    // Pays
    cy.get('select[name="countryId"]')
      .should('be.visible')
      .and('not.be.disabled')
      .select('GUINEE');

    // Région
    cy.get('[name="locality_id"]')
      .find('option')
      .should('have.length.greaterThan', 1);

    cy.get('[name="locality_id"]').select('Conakry');

    // Localité
    cy.get('select[name="locaity_id"]')
      .find('option')
      .should('have.length.greaterThan', 1);

    cy.get('select[name="locaity_id"]').select('DIXINN');

    // ================================
    // VALIDATION
    // ================================
    cy.contains('button', 'Confirmer')
      .should('be.enabled')
      .click();

    // ================================
    // ASSERTIONS MÉTIER
    // ================================
    cy.contains(newName, { timeout: 10000 }).should('be.visible');
    cy.contains(newPhone).should('be.visible');
  });


});
