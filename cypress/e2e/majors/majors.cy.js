describe('Majors - Consultation', () => {
  beforeEach(() => {
    // garantir une session valide avant chaque test et augmenter le timeout de chargement
    Cypress.config('pageLoadTimeout', 120000);
    cy.login();
    cy.visit('/majors');
  });

  it('Consultation de la liste des majors', () => {
    cy.get('h4').should('contain', 'Liste des majors');
    // S'assurer qu'au moins une ligne est présente
    // cy.get('.table-responsive').its('length').should('be.gte', 0);
  });

  it('Accès au détail d’un major', () => {
    // 1. Vérifier qu'il y a au moins un major
    cy.get('table tbody tr').should('have.length.at.least', 1);
    
    // 2. Cliquer sur le bouton "Détail" (bouton avec l'icône liste)
    cy.get('.page-content > :nth-child(1) > .card > .card-body').first().within(() => {
      // Trouver le bouton avec les classes spécifiques et l'icône "fa-list"
      cy.get(':nth-child(1) > :nth-child(5) > .btn-group > .btn-sm.btn-primary') 
        .click({ force: true });
      
     
    });
    cy.get('h4').should('contain', 'Informations générales');
  });
});
