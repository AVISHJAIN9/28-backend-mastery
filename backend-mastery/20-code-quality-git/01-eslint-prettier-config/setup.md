# Setup Guide - ESLint & Prettier Configuration

## Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- VS Code or similar editor

## Installation Steps

### 1. Install Dependencies
```bash
cd 01-eslint-prettier-config
npm install
```

### 2. Install ESLint and Prettier
```bash
npm install --save-dev eslint prettier eslint-config-prettier eslint-plugin-prettier
```

### 3. Initialize ESLint
```bash
npx eslint --init
```

### 4. Create Configuration Files

**.eslintrc.json**
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": ["eslint:recommended", "plugin:prettier/recommended"],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {
    "no-unused-vars": "error",
    "no-undef": "error",
    "eqeqeq": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2],
    "prefer-const": "error",
    "no-var": "error",
    "curly": "error"
  }
}
```

**.prettierrc**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "bracketSpacing": true,
  "endOfLine": "lf"
}
```

### 5. Update package.json Scripts

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Environment Setup

### Copy Environment File
```bash
cp .env.example .env
```

### Configure .env
```
HTTP_PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Module

### Start Server
```bash
npm run dev
```

Server runs on http://localhost:3001

### Run Linting

Check for issues:
```bash
npm run lint
```

Auto-fix issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## VS Code Integration

### Install Extensions
- ESLint (Microsoft)
- Prettier (Prettier)

### Configure VS Code (settings.json)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": ["javascript"],
  "prettier.requireConfig": true
}
```

## Next Steps

Move to Module 02: Husky & Lint-Staged Guide
## Dependencies
```bash
npm install 
```
## Environment Variables
## How to run
## How to test
