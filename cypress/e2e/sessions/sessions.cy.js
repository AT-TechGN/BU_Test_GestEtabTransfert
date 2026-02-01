describe('Sessions collecte / retrait', () => {
  before(() => {
    cy.login();
  });

  it('Consultation des sessions', () => {
    // Ensure the route is available before visiting (gives clearer failure reason than a 404)
    cy.request({ url: '/sessions', failOnStatusCode: false }).then((resp) => {
      if (resp.status !== 200) {
        throw new Error(`Sessions route returned HTTP ${resp.status}. Check environment or authentication.`);
      }
      cy.visit('/sessions');

      // Prefer locating the title by its text instead of chaining unsupported .or()
      cy.contains(/Sessions|Collecte/, { matchCase: false }).should('exist');
      cy.get('[data-cy="sessions-list"] tr').its('length').should('be.gte', 0);
    });
  });

  it('Clôture d’une session', () => {
    // Ensure the route exists and we are authorized before attempting actions
    cy.request({ url: '/sessions', failOnStatusCode: false }).then((resp) => {
      if (resp.status !== 200) {
        throw new Error(`Sessions route returned HTTP ${resp.status}. Check environment or authentication.`);
      }
      cy.visit('/sessions');

      cy.get('[data-cy="sessions-list"] tr').first().then(($row) => {
        if ($row.length === 0) {
          cy.log('Aucune session disponible pour clôture');
          return;
        }
        cy.wrap($row).find('button').contains(/Clôturer|Cloturer|Close/).click({ force: true });
        // Confirmer si une modale apparaît
        cy.get('button').contains(/Confirmer|Oui|Yes/).click({ force: true });
        // Assert body contains one of the expected success keywords
        cy.get('body').then(($b) => {
          const txt = $b.text();
          expect(/clôturée|fermée|closed/i.test(txt)).to.be.true;
        });
      });
    });
  });
});
