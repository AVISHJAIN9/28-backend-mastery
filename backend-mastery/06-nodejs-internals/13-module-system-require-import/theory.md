# Module System: Require vs Import - Deep Dive

## Overview

The Node.js module system is the foundation of code organization. Understanding CommonJS (`require()`) vs ES Modules (`import/export`) is critical for building scalable applications. This module explores module resolution, caching, circular dependencies, and performance implications.

## Part 1: CommonJS (require/module.exports)

### What is CommonJS?

CommonJS is Node.js's original module system. Every file is a module with its own scope.

```javascript
// math.js
function add(a, b) {
  return a + b;
}

module.exports = add;

// app.js
const add = require('./math.js');
console.log(add(2, 3)); // 5
```

### How require() Works

```
1. Resolve: Find the file
   - Try math.js, math.json, math/index.js
   - Check node_modules, parent directories
   
2. Load: Read file from disk
   - Cache lookup first (if already loaded)
   
3. Wrap: Wrap in function scope
   - Provides: module, exports, require, __filename, __dirname
   
4. Execute: Run the code
   - Set module.exports
   
5. Cache: Store in require.cache
   - Next require() returns cached module
```

### Module Scope

Each module has its own scope - nothing is global by default.

```javascript
// module1.js
const secret = 'private';
module.exports = { name: 'Module1' };

// module2.js
const mod1 = require('./module1.js');
console.log(mod1.secret); // undefined (not exported)
console.log(mod1.name);   // 'Module1'
```

### module.exports vs exports

```javascript
// These are equivalent initially:
module.exports = { /* ... */ };
exports.name = 'value';

// But beware:
exports = { re: 'assigned' }; // ❌ Breaks! module.exports unchanged

// Always use module.exports when reassigning
module.exports = { name: 'value' }; // ✅ Works
```

### Circular Dependencies

The most common gotcha.

```javascript
// a.js
console.log('A: top');
const b = require('./b.js');
console.log('A: b loaded', b.name);
module.exports = { name: 'A' };
console.log('A: bottom');

// b.js
console.log('B: top');
const a = require('./a.js');
console.log('B: a loaded', a.name);
module.exports = { name: 'B' };
console.log('B: bottom');

// Run: node a.js

// Output:
// A: top
// B: top
// B: a loaded { } (incomplete! A hasn't finished)
// B: bottom
// A: b loaded { name: 'B' }
// A: bottom
```

**Why?** When A requires B, B immediately requires A. But A hasn't finished executing yet, so `module.exports` is still empty.

### Solution to Circular Dependencies

```javascript
// Use lazy loading
// a.js
module.exports = {
  getName: function() {
    const b = require('./b.js'); // Load only when called
    return 'A from B: ' + b.name;
  }
};

// Or restructure to eliminate circular dependency
// Create a third file that requires both
```

### Caching Behavior

```javascript
// math.js
console.log('Math loaded');
module.exports = { pi: 3.14159 };

// app.js
const m1 = require('./math.js'); // Logs: "Math loaded"
const m2 = require('./math.js'); // No log (cached)
console.log(m1 === m2); // true (exact same object)

// Modify the cached reference
m1.pi = 100;
console.log(m2.pi); // 100 (same reference)

// Clear cache
delete require.cache[require.resolve('./math.js')];
const m3 = require('./math.js'); // Logs: "Math loaded" (reloaded)
```

### The Module Wrapper

Every module is wrapped in this function internally:

```javascript
(function(exports, require, module, __filename, __dirname) {
  // Your code here
});
```

This provides:
- **exports**: Reference to module.exports (initially)
- **require**: Function to load other modules
- **module**: Object with .exports property
- **__filename**: Absolute path to current file
- **__dirname**: Absolute path to current directory

## Part 2: ES Modules (import/export)

### What are ES Modules?

ES Modules (ESM) is the modern, standard way. Static structure enables better optimization.

```javascript
// math.js
export function add(a, b) {
  return a + b;
}

// app.js
import { add } from './math.js';
console.log(add(2, 3)); // 5
```

### Enabling ES Modules in Node.js

Option 1: Use .mjs extension
```javascript
// math.mjs
export const add = (a, b) => a + b;

// app.mjs
import { add } from './math.mjs';
```

Option 2: Set "type": "module" in package.json
```json
{
  "type": "module"
}
```

### Import Syntax Variations

```javascript
// Named import
import { add, subtract } from './math.js';

// Default import
import math from './math.js';

// Namespace import
import * as math from './math.js';

// Mix
import defaultExport, { namedExport } from './module.js';

// Async import (for conditional loading)
const module = await import('./module.js');
```

### Export Syntax Variations

```javascript
// Named exports
export function add(a, b) { return a + b; }
export const PI = 3.14159;
export class Calculator { }

// Default export
export default class Calculator { }

// Re-export
export { add, subtract } from './math.js';

// Export with renaming
export { add as addition } from './math.js';
```

### Top-Level Await

Only available in ES Modules.

```javascript
// app.js (with type: "module")
const response = await fetch('https://api.example.com');
const data = await response.json();

console.log(data); // Direct access to awaited result
```

### Module Metadata

```javascript
// ESM has no __filename or __dirname by default
// Get them:

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

## Part 3: CommonJS vs ESM Comparison

### Resolution Differences

**CommonJS:**
```javascript
require('./module')     // Tries: module.js, module/index.js, module.json
```

**ES Modules:**
```javascript
import x from './module.js'  // Must use extension
```

### Performance Implications

**CommonJS:**
- Dynamic loading can cause runtime surprises
- No tree-shaking optimization
- Slower module resolution scanning

**ES Modules:**
- Static analysis enables optimization
- Tree-shaking removes unused code
- Lighter final bundles

### Compatibility

**CommonJS → ESM:**
```javascript
import { readFileSync } from 'fs';
```

**ESM → CommonJS:**
```javascript
// ESM cannot directly require() CommonJS in Node.js 14+
// Must use dynamic import
const { module } = await import('./legacy.js');
```

## Part 4: Module Resolution Algorithm

### Node.js Resolution Steps

```
require('./module.js')

1. Check for /absolute/path/to/module.js
2. Check cache first
3. Try node_modules in current dir, parent, parent of parent...
4. For 'fs', 'path' etc, use core modules
5. If not found, throw MODULE_NOT_FOUND error
```

### require.resolve()

```javascript
// Get path without loading
const path = require.resolve('./module.js');
console.log(path); // /full/path/to/module.js

// Check if module exists
try {
  require.resolve('some-package');
  console.log('Package installed');
} catch (e) {
  console.log('Package NOT installed');
}
```

### package.json Configuration

```json
{
  "name": "my-package",
  "main": "dist/index.js",
  "exports": {
    ".": "./dist/index.js",
    "./utils": "./dist/utils.js"
  }
}
```

When someone does `require('my-package')`, it loads `dist/index.js`.

## Part 5: Performance & Best Practices

### Circular Dependency Impact

```javascript
// ❌ Bad: Performance issues and incomplete objects
// module-a.js
const b = require('./module-b.js');
// module-b.js
const a = require('./module-a.js');
// module-c.js
const a = require('./module-a.js'); // Complex resolution
```

### Module Size Impact

```javascript
// ❌ Slow: Requires entire module
const slowModule = require('./huge-module.js');
const onlyNeed = slowModule.onlyThisFunction;

// ✅ Fast: Only required function exported
const { onlyThisFunction } = require('./huge-module.js');
```

### Lazy Loading for Performance

```javascript
// ❌ Loads all modules upfront
const db = require('./db');
const cache = require('./cache');
const logger = require('./logger');
const api = require('./api');

// ✅ Loads on demand
function getDB() {
  return require('./db');
}

function getCache() {
  return require('./cache');
}
```

### ESM Tree-Shaking

ES Modules enable dead code elimination:

```javascript
// math.js
export function used() { }
export function unused() { }

// app.js (webpack, vite)
import { used } from './math.js';

// Final bundle: ONLY 'used' function included
// 'unused' eliminated during build
```

## Part 6: Real-World Patterns

### Plugin Architecture

```javascript
// plugins.js
const plugins = [];

module.exports = {
  register: (plugin) => {
    plugins.push(plugin);
  },
  
  load: () => {
    return plugins.map(p => require(p));
  }
};

// app.js
const pm = require('./plugins');
pm.register('./plugins/auth');
pm.register('./plugins/logging');
const loaded = pm.load();
```

### Feature Detection

```javascript
// Check if module exists before loading
function loadOptionalModule(name) {
  try {
    return require(name);
  } catch (e) {
    console.log(`${name} not installed`);
    return null;
  }
}

const redis = loadOptionalModule('redis');
const db = redis || require('./fallback-db');
```

## Part 7: Common Pitfalls & Solutions

### Pitfall 1: Modification During Require

```javascript
// ❌ Won't work as expected
const a = require('./a.js');
a.modified = true;
const b = require('./a.js');
console.log(b.modified); // true (same reference, not fresh copy)
```

### Pitfall 2: Mixed .mjs vs .js

```javascript
// ❌ Mixing causes issues
// a.mjs (ESM)
import { b } from './b.js'; // b.js is CommonJS?

// ✅ Solution
// a.mjs (ESM)
import { b } from './b.mjs'; // Consistent extension

// Or set package.json "type": "module"
```

### Pitfall 3: Untrusted Module Loading

```javascript
// ❌ Never do this with user input
const module = require(userInput); // 🔓 Security hole

// ✅ Whitelist known modules
const ALLOWED = ['./plugins/auth', './plugins/logging'];
const modulePath = ALLOWED.find(p => p === userInput);
if (modulePath) {
  require(modulePath);
}
```

## Summary

**CommonJS** provides synchronous loading but lacks tree-shaking and has circular dependency challenges. **ES Modules** are the modern standard with better performance and optimization capabilities. Best practice: migrate to ESM for new projects while maintaining CommonJS support for existing code.
