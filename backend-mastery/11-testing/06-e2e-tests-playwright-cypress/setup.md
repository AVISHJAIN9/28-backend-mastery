# Module 06: End-to-End Testing - Setup Guide

## Quick Start (5 minutes)

```bash
# Install dependencies
npm install

# Start server
npm run dev

# Run tests (opens browser)
npm test

# Visit app
open http://localhost:4006
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

**Key Packages (Choose One):**

**Playwright Option:**
- `@playwright/test` - Cross-browser E2E
- `@playwright/browser` - Browser automation
- Installation: `npm install --save-dev @playwright/test`

**Cypress Option:**
- `cypress` - E2E with interactive GUI
- `cypress-testing-library` - DOM queries
- Installation: `npm install --save-dev cypress`

### 2. Environment Setup

Create `.env`:

```env
HTTP_PORT=4006
NODE_ENV=development
FRONTEND_URL=http://localhost:4006
LOG_LEVEL=debug
```

### 3. Start Server

```bash
npm run dev
```

### 4. Run E2E Tests

**Playwright:**
```bash
# Run tests
npm test

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

**Cypress:**
```bash
# Run tests with GUI
npx cypress open

# Run headless
npx cypress run
```

## Playwright Patterns

### Basic Test

```javascript
import { test, expect } from '@playwright/test';

test('should load app', async ({ page }) => {
  await page.goto('http://localhost:4006');
  await expect(page).toHaveTitle('Testing App');
});
```

### Page Interactions

```javascript
test('should fill form and submit', async ({ page }) => {
  await page.goto('http://localhost:4006');
  
  // Fill input
  await page.fill('input[name="name"]', 'Alice');
  
  // Click button
  await page.click('button:has-text("Submit")');
  
  // Wait for response
  await page.waitForNavigation();
});
```

### Assertions

```javascript
test('verify user data', async ({ page }) => {
  await page.goto('http://localhost:4006/users');
  
  // Check text
  await expect(page.locator('h1')).toHaveText('Users');
  
  // Check visibility
  await expect(page.locator('[data-testid="user-row"]')).toBeVisible();
  
  // Count elements
  const count = await page.locator('[data-testid="user-row"]').count();
  expect(count).toBe(3);
});
```

### Page Objects

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
  }
  
  async goto() {
    await this.page.goto('http://localhost:4006/login');
  }
  
  async login(email, password) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button:has-text("Login")');
  }
}

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@test.com', 'password123');
  
  await expect(page).toHaveURL('http://localhost:4006/dashboard');
});
```

### Screenshots

```javascript
test('screenshot on failure', async ({ page }) => {
  await page.goto('http://localhost:4006');
  await page.screenshot({ path: 'screenshot.png' });
});
```

## Cypress Patterns

### Basic Test

```javascript
describe('User App', () => {
  it('should load home page', () => {
    cy.visit('http://localhost:4006');
    cy.title().should('equal', 'Testing App');
  });
});
```

### Form Interaction

```javascript
it('should create user', () => {
  cy.visit('http://localhost:4006/users/new');
  
  cy.get('input[name="name"]').type('Alice');
  cy.get('input[name="email"]').type('alice@test.com');
  cy.get('button:contains("Create")').click();
  
  cy.url().should('include', '/users');
});
```

### Custom Commands

```javascript
// cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.visit('http://localhost:4006/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button').click();
});

// In test
it('should access dashboard', () => {
  cy.login('user@test.com', 'password');
  cy.url().should('include', '/dashboard');
});
```

### Waiting for Elements

```javascript
it('should wait for async data', () => {
  cy.visit('http://localhost:4006/users');
  cy.get('[data-testid="loading"]').should('not.exist');
  cy.get('[data-testid="user-list"]').should('be.visible');
});
```

## Common Scenarios

### Authentication Flow

```javascript
test('complete auth flow', async ({ page }) => {
  // Go to login
  await page.goto('http://localhost:4006/login');
  
  // Fill credentials
  await page.fill('input[name="email"]', 'user@test.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect
  await expect(page).toHaveURL('http://localhost:4006/dashboard');
});
```

### CRUD Operations

```javascript
test('user CRUD operations', async ({ page }) => {
  await page.goto('http://localhost:4006/users');
  
  // Create
  await page.click('button:has-text("New User")');
  await page.fill('input[name="name"]', 'Bob');
  await page.click('button:has-text("Save")');
  
  // Read
  await expect(page.locator('text=Bob')).toBeVisible();
  
  // Update
  await page.click('button:has-text("Edit")');
  await page.fill('input[name="name"]', 'Bob Updated');
  await page.click('button:has-text("Save")');
  
  // Delete
  await page.click('button:has-text("Delete")');
  await expect(page.locator('text=Bob')).not.toBeVisible();
});
```

### Error Handling

```javascript
test('handle validation errors', async ({ page }) => {
  await page.goto('http://localhost:4006/users/new');
  
  // Submit empty form
  await page.click('button[type="submit"]');
  
  // Verify error shown
  await expect(page.locator('.error')).toHaveText('Name is required');
  
  // Fix and retry
  await page.fill('input[name="name"]', 'Alice');
  await page.click('button[type="submit"]');
  
  // Success
  await expect(page).toHaveURL(/\/users\/\d+/);
});
```

## Best Practices

### 1. Use Data Attributes

```html
<!-- HTML -->
<button data-testid="submit-btn">Submit</button>

<!-- Test -->
test('click submit', async ({ page }) => {
  await page.click('[data-testid="submit-btn"]');
});
```

### 2. Page Objects Pattern

```javascript
class UserListPage {
  constructor(page) {
    this.page = page;
    this.addButton = 'button:has-text("Add User")';
    this.userRows = '[data-testid="user-row"]';
  }
  
  async goto() { await this.page.goto('/users'); }
  async clickAdd() { await this.page.click(this.addButton); }
  async getUserCount() { 
    return await this.page.locator(this.userRows).count(); 
  }
}
```

### 3. Avoid Waits

```javascript
// BAD
await page.waitForTimeout(1000);

// GOOD
await page.waitForSelector('[data-testid="data-loaded"]');
```

### 4. Headless for CI

```bash
# Development (headed)
npx playwright test --headed

# CI (headless)
npx playwright test
```

## Debugging

### Playwright

```bash
# Debug mode with inspector
npx playwright test --debug

# Record test
npx playwright codegen http://localhost:4006
```

### Cypress

```bash
# Open interactive GUI
npx cypress open

# Run with detailed logs
npx cypress run --config-file=cypress.config.js
```

## Configuration

### playwright.config.js

```javascript
export default {
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4006',
    screenshot: 'only-on-failure',
  },
};
```

### cypress.config.js

```javascript
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:4006',
    setupNodeEvents(on, config) {
      // plugins
    },
  },
};
```

## Next Steps

1. ✅ Choose Playwright or Cypress
2. ✅ Write first E2E test
3. ✅ Test authentication flow
4. ✅ Test CRUD operations
5. ✅ Add error scenarios

## Resources

- [Playwright Docs](https://playwright.dev)
- [Cypress Docs](https://docs.cypress.io)
- [Web Testing Best Practices](https://testingjavascript.com)
