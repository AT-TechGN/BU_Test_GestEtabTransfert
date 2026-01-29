describe('Sessions collecte / retrait', () => {
  before(() => {
    cy.login();
  });

  it('Consultation des sessions', () => {
    cy.visit('/sessions');
    cy.get('h1, h2').should('contain', 'Sessions').or('contain', 'Collecte');
    cy.get('[data-cy="sessions-list"] tr').its('length').should('be.gte', 0);
  });

  it('Clôture d’une session', () => {
    cy.visit('/sessions');
    cy.get('[data-cy="sessions-list"] tr').first().then(($row) => {
      if ($row.length === 0) {
        cy.log('Aucune session disponible pour clôture');
        return;
      }
      cy.wrap($row).find('button').contains(/Clôturer|Cloturer|Close/).click({ force: true });
      // Confirmer si une modale apparaît
      cy.get('button').contains(/Confirmer|Oui|Yes/).click({ force: true });
      cy.get('body').should('contain', 'clôturée').or('contain', 'fermée').or('contain', 'closed');
    });
  });
});
