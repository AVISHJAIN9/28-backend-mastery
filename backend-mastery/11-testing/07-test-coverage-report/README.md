# 07 - Test Coverage Reports

## Overview
Measure code coverage and generate reports to identify untested code.

## What You'll Learn
- **Coverage Metrics** - Lines, branches, functions  
- **Coverage Reports** - HTML, text, JSON formats
- **Coverage Thresholds** - Enforcing minimum coverage
- **Istanbul** - Coverage tool
- **Gap Analysis** - Finding untested code
- **Trending** - Coverage over time

## Coverage Types

### Line Coverage
Percentage of lines executed during tests

### Branch Coverage  
Percentage of if/else branches tested

### Function Coverage
Percentage of functions called

### Statement Coverage
Percentage of statements executed

## Key Concepts

### Generate Coverage
```javascript
// package.json
"test:coverage": "jest --coverage"
```

### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    lines: 80,
    branches: 80,
    functions: 80,
    statements: 80
  }
}
```

### Reports
- HTML reports in `coverage/`
- Text summary in console
- JSON for CI/CD integration
- Badge generation

## Common Goals
1. Minimum 80% coverage
2. Critical paths 100%
3. Utils and helpers 90%+
4. Controllers 85%+
5. Error paths covered

## Quick Start
```bash
npm install
npm run test:coverage
open coverage/index.html
```

## Integration
- CI/CD pipelines
- Pre-commit hooks
- Pull request comments
- Code quality tools
- Dashboard monitoring

## Best Practices
- Don't chase 100%
- Focus on critical code
- Known gaps are fine
- Monitor trends
- Incentivize coverage
