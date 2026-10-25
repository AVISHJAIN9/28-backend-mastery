# VM Module & Sandbox Theory

## What is the VM Module?

The VM module allows execution of JavaScript code within a sandboxed context. It's crucial for security when running untrusted code.

### Key Problems It Solves
```
1. Running user-submitted code safely
2. Code isolation from main process
3. Preventing access to sensitive globals
4. Controlling execution time
5. Memory-safe code execution
```

### Real-World Use Cases
```
1. Template engines (evaluate dynamic templates)
2. Serverless platforms (AWS Lambda sandboxing)
3. Plugin systems (isolate 3rd party code)
4. Educational platforms (execute student code safely)
5. API services (execute user formulas/scripts)
```

## Core VM Concepts

### 1. runInThisContext()

Executes code in current context (faster but less isolated).

```javascript
const vm = require('vm');

// Code runs in current context
const result = vm.runInThisContext('2 + 2');
console.log(result); // 4

// Access to current scope variables
const x = 10;
const result2 = vm.runInThisContext('x + 5');
console.log(result2); // 15

// But not safe for untrusted code!
vm.runInThisContext('process.exit()'); // DANGEROUS!
```

### 2. runInNewContext()

Executes code in isolated sandbox context (safer).

```javascript
const code = '2 + 2';
const sandbox = { result: 0 };
const context = vm.createContext(sandbox);
vm.runInContext(code, context);
console.log(sandbox.result); // Still 0

// Safer - no access to process
const malicious = 'process.exit()';
const safeContext = vm.createContext({});
try {
  vm.runInContext(malicious, safeContext);
} catch (e) {
  console.log('Safe! Process protected');
}
```

### 3. Script Pre-compilation

Compile once, execute multiple times.

```javascript
const vm = require('vm');
const script = new vm.Script(`
  result = input * 2;
  output = result + 10;
`);

// Execute 1000 times efficiently
for (let i = 0; i < 1000; i++) {
  const sandbox = { input: i, result: 0, output: 0 };
  const context = vm.createContext(sandbox);
  script.runInContext(context);
}
```

### 4. Context Creation

Sandbox with predefined variables.

```javascript
const vm = require('vm');

const sandbox = {
  name: 'Alice',
  greeting: () => 'Hello!',
  math: Math,
};

const context = vm.createContext(sandbox);
const code = `
  console.log(greeting()); // Hello!
  console.log(name); // Alice
  console.log(math.sqrt(16)); // 4
`;

vm.runInContext(code, context);
```

## VM Options & Security

### 1. Timeout Protection

Prevent infinite loops.

```javascript
const vm = require('vm');
const sandbox = {};

// Timeout after 1000ms
const code = `
  let i = 0;
  while (true) { i++; }
`;

try {
  vm.runInNewContext(code, sandbox, { timeout: 1000 });
} catch (error) {
  console.log('Timeout caught:', error.message);
  // Error: Code execution timed out
}
```

### 2. Filename for Error Tracking

```javascript
const code = 'throw new Error("Something broke")';

try {
  vm.runInThisContext(code, { filename: 'user-script.js' });
} catch (error) {
  console.log(error.stack);
  // user-script.js:1
  // ReferenceError: Something broke
}
```

### 3. Line Offset and Column Offset

```javascript
const code = 'x + y';

try {
  vm.runInThisContext(code, {
    filename: 'math.js',
    lineOffset: 10,
    columnOffset: 5,
  });
} catch (error) {
  console.log(error.stack); // Shows line 11 (10+1)
}
```

## Advanced Sandboxing Patterns

### 1. Safe Global Proxy

```javascript
const vm = require('vm');

// Create filtered global
const sandbox = {
  Math,
  JSON,
  console: { log: console.log },
  // Deliberately excluded: process, fs, require
};

const context = vm.createContext(sandbox);
const script = new vm.Script(`
  console.log(Math.sqrt(16)); // OK
  process.exit(); // Error: process is not defined
`);

try {
  script.runInContext(context);
} catch (e) {
  console.log('Sandbox protection works!');
}
```

### 2. Timeout with Cleanup

```javascript
const vm = require('vm');

function executeWithTimeout(code, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const sandbox = {};
    const options = {
      timeout,
      filename: 'user-code.js',
      displayErrors: true,
    };

    try {
      const result = vm.runInNewContext(code, sandbox, options);
      resolve({ success: true, result, sandbox });
    } catch (error) {
      if (error.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        reject(new Error('Execution timeout'));
      } else {
        reject(error);
      }
    }
  });
}

// Usage
executeWithTimeout('2 + 2', 5000)
  .then(res => console.log(res))
  .catch(err => console.error(err));
```

### 3. Data Processing Sandbox

```javascript
const vm = require('vm');

function processList(userCode, data) {
  const sandbox = {
    data,
    results: [],
    Math,
    console: { log: (...args) => results.push(args.join(' ')) },
  };

  const context = vm.createContext(sandbox);
  const script = new vm.Script(`
    results = data.map(x => {
      ${userCode}
    });
  `);

  script.runInContext(context);
  return sandbox.results;
}

const output = processList('return x * 2', [1, 2, 3, 4]);
console.log(output); // [2, 4, 6, 8]
```

### 4. Formula Evaluation Sandbox

```javascript
const vm = require('vm');

function evaluateFormula(formula, variables = {}) {
  const sandbox = {
    ...variables,
    Math,
    result: null,
  };

  const context = vm.createContext(sandbox);
  try {
    const script = new vm.Script(`result = ${formula}`);
    script.runInContext(context);
    return sandbox.result;
  } catch (error) {
    throw new Error(`Invalid formula: ${error.message}`);
  }
}

// Usage in spreadsheet-like app
console.log(evaluateFormula('2 + 2')); // 4
console.log(evaluateFormula('Math.sqrt(x)', { x: 16 })); // 4
console.log(evaluateFormula('a * b + c', { a: 2, b: 3, c: 5 })); // 11
```

## VM vs eval() vs Function()

### Comparison

```javascript
// 1. eval() - NEVER USE!
eval('x = 5'); // Runs in current scope, HUGE security risk

// 2. Function() - Better but still risky
const fn = new Function('x', 'return x * 2');
fn(10); // 20

// 3. VM - BEST for untrusted code
const sandbox = {};
vm.runInNewContext('x = 5', sandbox);
sandbox.x; // 5 (isolated)
```

### Security Comparison

```javascript
// eval - VULNERABLE
eval('global.secret = process.env.SECRET;');
console.log(global.secret); // LEAKED!

// Function - BETTER (new scope)
const fn = new Function('return process');
fn(); // Still can access process!

// VM - SAFE (isolated context)
const sandbox = {};
vm.runInNewContext(`
  try {
    process.exit();
  } catch (e) {
    result = 'Protected!';
  }
`, sandbox);
console.log(sandbox.result); // Protected!
```

## Real-World: Dynamic Template Engine

```javascript
const vm = require('vm');

function renderTemplate(template, data) {
  const sandbox = {
    ...data,
    output: '',
  };

  const context = vm.createContext(sandbox);
  const script = new vm.Script(`
    output = \`${template}\`;
  `);

  try {
    script.runInContext(context);
    return sandbox.output;
  } catch (error) {
    throw new Error(`Template error: ${error.message}`);
  }
}

// Template usage
const html = renderTemplate(
  'Hello, \${name}! You have \${count} messages.',
  { name: 'Alice', count: 5 }
);
// Result: "Hello, Alice! You have 5 messages."
```

## Real-World: Rule Engine

```javascript
const vm = require('vm');

class RuleEngine {
  constructor(rules = {}) {
    this.rules = rules;
  }

  evaluate(ruleName, context) {
    const rule = this.rules[ruleName];
    if (!rule) throw new Error(`Rule not found: ${ruleName}`);

    const sandbox = {
      ...context,
      result: false,
    };

    const script = new vm.Script(`result = ${rule}`);
    const ctx = vm.createContext(sandbox);
    
    try {
      script.runInContext(ctx, { timeout: 1000 });
      return sandbox.result;
    } catch (error) {
      throw new Error(`Rule evaluation failed: ${error.message}`);
    }
  }
}

// Usage in business logic
const engine = new RuleEngine({
  premiumUser: 'user.plan === "premium" && user.active',
  discountEligible: 'order.total > 100 && user.loyaltyPoints > 50',
  riskFlag: 'transaction.amount > 10000 || !user.verified',
});

const eligible = engine.evaluate('discountEligible', {
  order: { total: 150 },
  user: { loyaltyPoints: 75 },
});
```

## Common Pitfalls

### 1. Forgotten Timeout

```javascript
// DANGEROUS - infinite loop never stops
const code = 'while(true) {}';
vm.runInThisContext(code); // Hangs forever!

// FIXED
vm.runInThisContext(code, { timeout: 1000 }); // Throws error
```

### 2. Prototype Pollution via Context

```javascript
// DANGEROUS
const sandbox = {};
vm.runInContext('Object.prototype.admin = true', sandbox);
console.log({}.admin); // true - LEAKED!

// FIXED - freeze prototypes
const sandbox = Object.create(null);
vm.runInContext('this.safe = true', sandbox);
```

### 3. Accidental Global Leaks

```javascript
// DANGEROUS
const sandbox = { evil: () => process.exit() };
vm.runInContext('evil()', sandbox); // Process exits!

// FIXED
const sandbox = {
  safe: () => { return 'ok'; },
  // process not included
};
```

## Performance Optimization

### Pre-compile Scripts

```javascript
const vm = require('vm');

// Compile once
const script = new vm.Script(userCode);

// Execute multiple times (much faster)
for (let i = 0; i < 10000; i++) {
  const sandbox = { i, result: 0 };
  script.runInContext(vm.createContext(sandbox));
}
```

### String Concatenation vs Template

```javascript
// SLOW - recompiles each time
function evaluate(formula, variables) {
  const sandbox = { ...variables };
  vm.runInNewContext(`result = ${formula}`, sandbox);
  return sandbox.result;
}

// FAST - pre-compiled
const script = new vm.Script('result = formula(a, b)');
function evaluateFast(formula, a, b) {
  const sandbox = { formula, a, b, result: 0 };
  script.runInContext(vm.createContext(sandbox));
  return sandbox.result;
}
```

## Security Best Practices

### 1. Never Trust User Code
Always assume code is malicious. Use VM module.

### 2. Always Set Timeout
Prevent resource exhaustion attacks.

### 3. Minimal Sandbox
Only expose what user needs.

### 4. Validate Output
Check returned values.

### 5. Log Executions
Track all dynamic code executions.

### 6. Version Control
Keep VM scripts in configuration, not database.

```javascript
// GOOD
const rules = {
  discount: 'order.total > 100',
  premium: 'user.plan === "pro"',
};

// BAD
db.query('SELECT rule FROM rules WHERE id = ?');
```

## VM Module Conclusion

The VM module is essential for:
- Safely executing untrusted code
- Building plugin systems
- Creating dynamic evaluation engines
- Protecting application stability

Always combine with proper error handling, timeouts, and minimal context exposure.
