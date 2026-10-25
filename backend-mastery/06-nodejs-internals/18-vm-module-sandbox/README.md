# 18: VM Module & Sandbox Execution

## Overview
The Node.js `vm` module allows you to run JavaScript code in isolated contexts (sandboxes). This enables secure code execution where scripts can't access the host environment directly.

## What You'll Learn
- Creating isolated sandbox contexts
- Running untrusted code safely
- Context scoping and namespace isolation
- Performance implications of sandbox execution
- Real-world use cases (plugins, templates, scripts)

## Key Concepts

### 1. **Sandbox Context**
```javascript
const vm = require('vm');
const sandbox = { x: 10 };
const context = vm.createContext(sandbox);
vm.runInContext('x = x + 5', context);
console.log(sandbox.x); // 15
```

### 2. **Script Compilation**
```javascript
const script = new vm.Script('a + b');
const result = script.runInNewContext({ a: 1, b: 2 });
console.log(result); // 3
```

### 3. **Security Boundaries**
Safe from:
- Access to require()
- Access to globals like process
- Access to file system
- Similar to browser sandboxing

### 4. **Performance Metrics**
- Script compilation is fast
- Execution has overhead vs direct code
- Context creation is relatively expensive
- Reusing scripted is recommended

## Module Structure

**Backend** (Port 3018):
- Route to create sandbox contexts
- Route to execute arbitrary code safely
- Route to demonstrate security boundaries
- Route showing data isolation
- Route comparing performance
- Route for multi-context execution

**Frontend** (React):
- Interactive UI to test sandboxes
- Code editor for script input
- Result display with timing
- Security validation checks
- Context visualization

## Files in This Module
- `server.js` - Express backend with VM endpoints
- `routes.js` - Route definitions
- `controller.js` - Sandbox execution logic
- `middleware.js` - Request parsing and validation
- `schema.js` - Data validation schemas
- `App.jsx` - React testing interface
- `package.json` - Dependencies
- `theory.md` - Deep dive documentation
- `setup.md` - Installation instructions
- `checklist.md` - Learning checklist

## Quick Start

1. Install dependencies: `npm install`
2. Start server: `npm start`
3. Open browser: `http://localhost:3018`
4. Try executing code in sandbox

## Common Pitfalls
- Forgetting that sandboxes don't have require()
- Not handling async code in contexts
- Creating too many contexts (memory leak)
- Assuming full security without escape analysis

## Testing Endpoints
- `GET /api/vm/sandbox-info` - Show current sandboxes
- `POST /api/vm/execute` - Execute code in context
- `GET /api/vm/security-test` - Verify isolation
- `POST /api/vm/performance` - Benchmark execution
- `GET /api/vm/context-data` - Inspect context vars
- `POST /api/vm/multi-context` - Compare multiple contexts
