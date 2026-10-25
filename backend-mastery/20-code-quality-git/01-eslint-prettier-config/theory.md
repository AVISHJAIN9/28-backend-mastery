# ESLint & Prettier Configuration: Theory & Best Practices

## Table of Contents
1. [Introduction](#introduction)
2. [What is ESLint?](#what-is-eslint)
3. [What is Prettier?](#what-is-prettier)
4. [Why They Matter](#why-they-matter)
5. [Key Concepts](#key-concepts)
6. [Configuration Details](#configuration-details)
7. [Best Practices](#best-practices)
8. [Real-World Scenarios](#real-world-scenarios)
9. [Anti-Patterns](#anti-patterns)

---

## Introduction

Code quality is the foundation of maintainable software. When teams work together on large codebases, inconsistency in code style, formatting, and potential bugs can lead to:

- Difficult code reviews (spending time on style instead of logic)
- Inconsistent codebases that are hard to navigate
- Potential runtime errors from common mistakes
- Poor performance due to undetected issues
- Increased technical debt

**ESLint** and **Prettier** are two complementary tools that solve these problems:
- **ESLint** enforces code quality rules and catches potential bugs
- **Prettier** automatically formats code for consistency

Together, they create an invaluable development workflow that catches errors early, enforces standards, and saves developers time.

---

## What is ESLint?

### Definition

ESLint is a **static code analysis tool** that examines your JavaScript/TypeScript code without running it and identifies problems based on configurable rules. It can:

1. Detect syntax errors and logical bugs
2. Enforce coding standards
3. Suggest improvements
4. Auto-fix certain issues

### How ESLint Works

```javascript
// Example: ESLint detecting unused variables
const unusedVar = "I'm not used"; // ESLint warns: 'unusedVar' is assigned but never used

function example(x, y) {
  console.log(x); // 'y' is never used
  return x;
}
```

### Key ESLint Concepts

#### 1. Rules
Rules are the core of ESLint. Each rule targets a specific aspect of code quality:

```javascript
{
  "rules": {
    "no-console": "warn",           // Console statements trigger warning
    "no-unused-vars": "error",      // Unused variables cause error
    "semi": ["error", "always"],    // Enforce semicolons
    "quotes": ["error", "single"],  // Enforce single quotes
    "indent": ["error", 2]          // Enforce 2-space indentation
  }
}
```

#### 2. Rule Severity Levels
- `off` or `0`: Rule disabled
- `warn` or `1`: Trigger warning (code still runs)
- `error` or `2`: Trigger error (build fails)

#### 3. Configurations
ESLint supports multiple configuration formats:

```javascript
// Option 1: .eslintrc.js
module.exports = {
  rules: {
    "semi": ["error", "always"]
  }
};

// Option 2: .eslintrc.json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "rules": {
    "semi": ["error", "always"]
  }
}
```

#### 4. Environment Detection
Different environments have different globals:

```javascript
{
  "env": {
    "browser": true,      // window, document, navigator
    "node": true,         // process, global, __dirname
    "es2021": true,       // Promise, Symbol, etc.
    "jest": true          // describe, it, expect for tests
  }
}
```

#### 5. Extending Configurations
Instead of writing all rules from scratch, extend popular configs:

```javascript
{
  "extends": [
    "eslint:recommended",           // ESLint's best practices
    "plugin:react/recommended",     // React plugin
    "plugin:@typescript-eslint/recommended" // TypeScript plugin
  ]
}
```

### Common ESLint Rules

| Rule | Purpose | Example |
|------|---------|----------|
| `no-unused-vars` | Catches unused variables | `const x = 1;` (never used) |
| `no-console` | Discourages debug logs in production | `console.log()` |
| `no-implicit-globals` | Prevents `var` in global scope | `var name = "global"` |
| `eqeqeq` | Enforces `===` instead of `==` | `x == 5` should be `x === 5` |
| `semi` | Enforces semicolons | Missing semicolons |
| `indent` | Enforces consistent spacing | Mixed tabs/spaces |
| `quotes` | Enforces quote style | `"double"` vs `'single'` |
| `no-var` | Encourages `const`/`let` | `var x = 1` should use `const` |

### ESLint in Action: Before & After

**VULNERABLE - No ESLint:**
```javascript
// User service with multiple issues
function getUserData(id){
var user=db.getUser(id);   // wrong indentation, var instead of const
console.log("Getting user:", id); // logging production data
let name=user.name;
  let email=user.email;      // inconsistent indentation
  X_API_KEY = "secret123";   // global variable leak!
return { name: name, email: email }
}
```

**SECURE - With ESLint:**
```javascript
// ESLint catches:
// - Missing semicolon
// - Indentation issues
// - Using 'var' instead of 'const'
// - console.log in production code
// - Global variable 'X_API_KEY'

// Properly linted:
function getUserData(id) {
  const user = db.getUser(id);
  const name = user.name;
  const email = user.email;
  // API key should be in environment variables
  return { name, email };
}
```

---

## What is Prettier?

ESLint is a static code analysis tool that helps developers find and fix problematic patterns in JavaScript code. It enforces coding standards, catches potential bugs, and helps maintain code consistency across a team.

### Key Benefits
- **Detects bugs early** - Identifies unused variables, unreachable code, and logic errors
- **Enforces standards** - Maintains consistent coding style across the team
- **Auto-fixes issues** - Can automatically correct many violations
- **Team alignment** - Shared rules ensure everyone follows the same patterns

### Rules vs Warnings
- **Error (level 2)** - Build fails, code won't run
- **Warning (level 1)** - Code works, but violates guidelines
- **Off (level 0)** - Rule is disabled

---

## What is Prettier?

Prettier is an opinionated code formatter that automatically formats your code based on predefined rules. It focuses on code formatting (whitespace, quotes, semicolons) rather than code quality.

### Key Benefits
- **No configuration decisions** - Opinionated, minimal configuration
- **Consistent formatting** - All code looks identical regardless of editor
- **Removes bikeshedding** - No debates about formatting
- **Integrates with editors** - Format on save, right-click format
- **Pre-commit hooks** - Format code automatically before commits

### Prettier vs ESLint

| Aspect | ESLint | Prettier |
|--------|--------|----------|
| **Purpose** | Code quality & bugs | Code formatting |
| **Rules** | 200+ rules (configurable) | Minimal, opinionated |
| **Auto-fix** | Partial support | Full auto-formatting |
| **Configuration** | Highly configurable | Minimal needed |
| **Example** | Detects unused variable | Fixes indentation |

---

## Common ESLint Rules

### 1. no-unused-vars
```javascript
// ❌ ESLint Error
const unused = 42;
console.log('hello');

// ✅ Fixed
console.log('hello');
```

### 2. no-undef
```javascript
// ❌ ESLint Error
console.log(unknownVariable);

// ✅ Fixed
const knownVariable = 'value';
console.log(knownVariable);
```

### 3. no-console
```javascript
// ❌ ESLint Warning
console.log('debug info');

// ✅ Fixed (or disable for specific file)
// Production code should use proper logging
```

### 4. no-var
```javascript
// ❌ ESLint Warning (legacy ES5)
var x = 5;

// ✅ Fixed (use let/const)
const x = 5;
```

### 5. eqeqeq (Strict Equality)
```javascript
// ❌ ESLint Warning
if (x == '5') {}

// ✅ Fixed
if (x === '5') {}
```

### 6. curly (Require Braces)
```javascript
// ❌ ESLint Warning
if (true) console.log('hi');

// ✅ Fixed
if (true) {
  console.log('hi');
}
```

### 7. semi (Require Semicolons)
```javascript
// ❌ ESLint Error (if configured)
const x = 5

// ✅ Fixed
const x = 5;
```

### 8. quotes (Quote Style)
```javascript
// ❌ ESLint Error (if double quotes configured)
const message = 'hello';

// ✅ Fixed
const message = "hello";
```

### 9. indent (Indentation)
```javascript
// ❌ ESLint Error (wrong indentation)
function test() {
return 42;
}

// ✅ Fixed
function test() {
  return 42;
}
```

### 10. no-duplicate-imports
```javascript
// ❌ ESLint Error
import { a } from './module';
import { b } from './module';

// ✅ Fixed
import { a, b } from './module';
```

---

## Configuration Files

### .eslintrc.json (Main Configuration)
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended"],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "error",
    "eqeqeq": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2]
  }
}
```

### .prettierrc (Prettier Configuration)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true
}
```

### .prettierignore
```
node_modules
dist
build
coverage
.env
```

### .eslintignore
```
node_modules
dist
build
coverage
.env
*.min.js
```

---

## Workflow Integration

### 1. Pre-commit with Husky
```bash
npm run lint        # Check for errors
npm run lint:fix    # Auto-fix errors
npm run format      # Format with Prettier
```

### 2. Editor Integration
**VS Code Extensions:**
- ESLint (Microsoft)
- Prettier (Prettier)

**settings.json:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript"],
  "eslint.autoFixOnSave": true
}
```

### 3. CI/CD Pipeline
```bash
# In GitHub Actions
npm run lint        # Fail build if errors
npm run test        # Run tests
npm run build       # Build project
```

---

## Best Practices

### ✅ DO's
- **Enforce team standards** - Use shared .eslintrc
- **Auto-fix on save** - Reduce manual formatting
- **Pre-commit linting** - Catch errors before commit
- **Progressive adoption** - Add rules gradually
- **Document custom rules** - Explain why in team wiki

### ❌ DON'Ts
- **Disable too many rules** - Defeats the purpose
- **Ignore linting errors** - They indicate real problems
- **Mix formatters** - Use Prettier or Beautify, not both
- **Over-configure** - Start with recommended configs
- **Skip CI checks** - Let the tool catch issues early

---

## Real-World Scenarios

### Scenario 1: Code Review Reduction
**Before:** Code reviews focus on formatting, style, and typos  
**After:** Code reviews focus on logic, performance, and design  
**Benefit:** 40% reduction in review comments

### Scenario 2: Onboarding New Developers
**Before:** New devs waste time learning team's coding standards  
**After:** Configured tools enforce standards automatically  
**Benefit:** 2-3 days saved per onboarded developer

### Scenario 3: Large Refactoring
**Before:** Manual style fixes mixed with refactoring changes  
**After:** Auto-format refactored code consistently  
**Benefit:** Easier code reviews, cleaner diffs

### Scenario 4: CI/CD Integration
**Before:** Inconsistent code quality in production builds  
**After:** Build fails if linting rules violated  
**Benefit:** 50% fewer production bugs related to code quality

---

## Common Violations & Fixes

| Violation | Problem | Fix |
|-----------|---------|-----|
| Unused variable | Increases file size, confuses readers | Remove or use it |
| Missing semicolon | Potential ASI bugs | Add `;` or configure auto-fix |
| var instead of const | Function scope confusion | Use `const` or `let` |
| == instead of === | Type coercion bugs | Use strict `===` |
| console.log in production | Debug clutter, security risk | Remove or use logger |
| Missing braces | Maintainability issues | Always use `{ }` |

---

## Assessment

### Questions to understand your level:
1. What's the difference between ESLint and Prettier?
2. Which rule would catch an unused variable?
3. How do you auto-fix ESLint violations?
4. Should ESLint rules be enforced in CI/CD?
5. When would you disable an ESLint rule?
