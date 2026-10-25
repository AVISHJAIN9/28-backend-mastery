# End-to-End Testing: Playwright & Cypress - Theory

## What is E2E Testing?

End-to-end testing automates user interactions through the UI to verify complete workflows work correctly. Unlike unit tests that verify functions, E2E tests verify that entire user journeys work.

### Testing Pyramid
```
        E2E Tests (Few)
       /              \\
    Integration Tests (Some)
   /                      \\
Unit Tests (Many)
```

## Playwright vs Cypress Comparison

| Feature | Playwright | Cypress |
|---------|-----------|---------|
| **Language** | JavaScript, Python, Java, C# | JavaScript |
| **Browsers** | Chrome, Firefox, Safari, Edge | Chrome, Firefox, Edge |
| **Speed** | Very fast | Fast |
| **Debugging** | Inspector, traces | Excellent |
| **API** | Modern, async | Event-driven |
| **Learning** | Steeper | Gentler |
| **Multi-tab** | ✅ Yes | ❌ No |
| **Testing** | Modern | Developer-friendly |

## Playwright Fundamentals

### Basic Test
```javascript
import { test, expect } from '@playwright/test';

test('should login and see dashboard', async ({ page }) => {
  // Navigate to login
  await page.goto('http://localhost:3000/login');
  
  // Fill credentials
  await page.fill('input[name="email"]', 'user@example.com');
  await page.fill('input[name="password"]', 'password123');
  
  // Click login
  await page.click('button:has-text("Login")');
  
  // Verify navigation
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
  
  // Verify element exists
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

### Playwright Locators
```javascript
// CSS selector
page.locator('button.submit');

// XPath
page.locator('//button[@class="submit"]');

// Text matching
page.locator('text=Click me');

// Role-based (recommended)
page.locator('role=button[name="Submit"]');

// Data test id
page.locator('[data-testid="submit-button"]');
```

### Playwright Interactions
```javascript
// Click
await page.click('button#submit');

// Type text
await page.type('input[name="email"]', 'user@example.com');

// Fill (clear then type)
await page.fill('input[name="password"]', 'password');

// Press key
await page.press('input', 'Enter');

// Select option
await page.selectOption('select', 'option1');

// Upload file
await page.setInputFiles('input[type="file"]', 'file.jpg');

// Scroll
await page.locator('button').scrollIntoViewIfNeeded();
```

## Cypress Fundamentals

### Basic Test
```javascript
describe('Authentication', () => {
  it('should login successfully', () => {
    cy.visit('http://localhost:3000/login');
    
    cy.get('input[name="email"]').type('user@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button:contains("Login")').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Welcome');
  });
});
```

### Cypress Selectors
```javascript
// CSS
cy.get('button.submit');

// By text
cy.contains('button', 'Click me');

// By data attribute
cy.get('[data-cy="submit"]');

// By role
cy.get('button[role="button"]');

// By placeholder
cy.get('input[placeholder="Enter name"]');
```

### Cypress Commands
```javascript
// Navigation
cy.visit('/');
cy.go('back');

// Interaction
cy.get('button').click();
cy.get('input').type('text');
cy.get('select').select('option');

// Assertions
cy.get('h1').should('be.visible');
cy.get('input').should('have.value', 'text');
cy.url().should('include', '/dashboard');

// Waiting
cy.get('button').click();
cy.get('.loading').should('not.exist');
cy.get('.result').should('be.visible');
```

## Common E2E Test Patterns

### Pattern 1: Login Flow
```javascript
test('complete login flow', async ({ page }) => {
  // Navigate
  await page.goto('/login');
  
  // Enter credentials
  await page.fill('[data-testid="email"]', 'test@example.com');
  await page.fill('[data-testid="password"]', 'Password123!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect
  await page.waitForURL('/dashboard');
  
  // Verify logged in
  await expect(page.locator('.user-name')).toContainText('User');
});
```

### Pattern 2: Form Submission
```javascript
test('should submit form with validation', async ({ page }) => {
  await page.goto('/contact');
  
  // Try submit empty
  await page.click('button[type="submit"]');
  await expect(page.locator('.error')).toContainText('Required');
  
  // Fill form
  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('textarea[name="message"]', 'Test message');
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page.locator('.success')).toContainText('Sent');
});
```

### Pattern 3: Multi-step Workflow
```javascript
test('complete checkout flow', async ({ page }) => {
  // Step 1: Browse products
  await page.goto('/products');
  await page.click('button:has-text("Add to Cart")');
  
  // Step 2: Review cart
  await page.click('a[href="/cart"]');
  await expect(page.locator('.cart-item')).toHaveCount(1);
  
  // Step 3: Checkout
  await page.click('button:has-text("Checkout")');
  
  // Step 4: Payment
  await page.fill('input[name="cardNumber"]', '4111111111111111');
  await page.click('button:has-text("Pay")');
  
  // Step 5: Confirmation
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

### Pattern 4: Error Handling
```javascript
test('should handle errors gracefully', async ({ page }) => {
  await page.goto('/users/999'); // Non-existent user
  
  // Intercept API to return error
  await page.route('**/api/users/**', route => {
    route.abort('blockedbyclient');
  });
  
  // Verify error message
  await expect(page.locator('.error-message'))
    .toContainText('Unable to load user');
});
```

## Advanced Techniques

### Network Interception
```javascript
// Mock API response
page.route('**/api/users/**', async route => {
  if (route.request().postData()?.includes('invalid')) {
    await route.abort('failed');
  } else {
    await route.continue();
  }
});
```

### Waiting for Elements
```javascript
// Wait for element
await page.waitForSelector('.success-message');

// Wait for URL change
await page.waitForURL('/success');

// Wait for navigation
await page.waitForNavigation();

// Wait for condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.item').length === 5;
});
```

### Screenshots & Videos
```javascript
// Screenshot
await page.screenshot({ path: 'screenshot.png' });

// Full page
await page.screenshot({ path: 'full.png', fullPage: true });

// Specific element
await page.locator('button').screenshot({ path: 'button.png' });
```

### Parallel Execution
```javascript
// Playwright retries on failure
test.describe.configure({ timeout: 30000 });

test.setTimeout(60000); // Per test timeout
```

## Best Practices

1. **Use Data Attributes** - data-testid instead of selectors
```html
<button data-testid="submit">Submit</button>
```

2. **Avoid Hard Waits** - Use proper waits
```javascript
// ❌ Bad
await page.waitForTimeout(2000);

// ✅ Good
await page.waitForSelector('.loaded');
```

3. **Test User Behavior** - Not implementation
```javascript
// ❌ Bad
await page.evaluate(() => { app.login(); });

// ✅ Good
await page.fill('[data-testid="email"]', 'user@example.com');
await page.click('button:has-text("Login")');
```

4. **Keep Tests Independent** - No test should depend on another
```javascript
// Each test should be self-contained
test('test 1', async ({ page }) => { /* ... */ });
test('test 2', async ({ page }) => { /* ... */ }); // Fresh page
```

5. **Use Page Objects** - Reusable page interactions
```javascript
class LoginPage {
  constructor(page) { this.page = page; }
  
  async login(email, password) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login"]');
  }
}
```

6. **Test Critical Paths** - Not every scenario
```javascript
// Focus on user journeys, not all edge cases
- Happy path
- Common error paths
- Key workflows
```

7. **Avoid Timing Issues** - Use explicit waits
8. **Keep Tests Readable** - Clear assertions
9. **Debug Effectively** - Use trace viewer
10. **Run Headless in CI** - Real browser locally

## Debugging E2E Tests

### In Playwright
```bash
# Debug mode
npx playwright test --debug

# UI mode (interactive)
npx playwright test --ui

# Trace viewer  
npx playwright show-trace trace.zip
```

### In Cypress
```javascript
// Debug pause
cy.debug();
cy.pause();

// Log values
cy.get('button').then($btn => {
  console.log($btn);
});

// Interactive debugging
OpenDevTools while test runs
```

## When to Use E2E Tests

| Scenario | Use E2E |
|----------|---------|
| Critical user flows | ✅ Yes |
| Every feature | ❌ No |
| API errors | Unit test |
| UI edge cases | Integration |
| Full workflows | ✅ Yes |
| Performance | Load test |
| Accessibility | Separate |

## Conclusion

E2E tests verify that your application works end-to-end from the user's perspective. Both Playwright and Cypress are excellent frameworks - Playwright for speed and multi-browser support, Cypress for developer experience. Use E2E tests for critical paths, not as a replacement for unit and integration tests.

