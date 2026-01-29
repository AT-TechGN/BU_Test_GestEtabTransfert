# TODO: Refactor Faker Usage in Cypress Tests

## Tasks
- [x] Update cypress/fixtures/users.json: Add fake numero and password for admin user
- [x] Update cypress/e2e/auth/auth.cy.js: Fix faker.internet.numero() to faker.phone.number('06########') for invalid login test
- [x] Update cypress/support/commands.js: Remove faker from createEtablissement command, use fixed values, and remove faker import
- [x] Update cypress/e2e/etablissements/etablissements.cy.js: Remove faker usage, use fixed values, and remove faker import
- [x] Update cypress/e2e/credits/credits.cy.js: Remove faker usage, use fixed values, and remove faker import
