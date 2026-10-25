# 06 - End-to-End Testing: Playwright & Cypress

## Overview
Test complete user workflows from browser automation using Playwright and Cypress.

## What You'll Learn
- **Playwright** - Cross-browser automation
- **Cypress** - Developer-focused E2E testing
- **Browser Automation** - Simulating user interactions
- **Selectors** - Finding elements reliably
- **Assertions** - Front-end validation
- **Screenshots/Videos** - Visual debugging

## Key Concepts

### Playwright
- Faster, more reliable
- Multi-browser (Chrome, Firefox, Safari)
- Native mobile support
- Better debugging

### Cypress  
- Developer experience
- Great debugging tools
- Snapshot testing
- Built-in retry
- Better for Chrome

## Testing Scenarios
1. User registration flow
2. Login workflow
3. Form submission
4. Navigation
5. Error handling
6. Responsive design

## API Endpoints
- `/` - Landing page
- `/register` - Registration
- `/login` - Login
- `/dashboard` - Protected route
- `/products` - Product listing

## Common Patterns
1. Page object model
2. Fixtures for test data
3. Screenshot on failure
4. Parallel execution
5. Visual comparison

## Quick Start
```bash
npm install
npm run dev
npx playwright test
# or
npx cypress open
```

## Best Practices
- Use data attributes
- Avoid hardcoded waits
- Use proper locators
- Test user journeys
- Keep tests independent
- Use page objects
