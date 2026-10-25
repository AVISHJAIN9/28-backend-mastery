const express = require('express');
const Module = require('module');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3013;

// Module 13: Module System (require, import, caching, circular dependencies)

// Track module cache info
const moduleCache = Module._cache;

// Route: Module cache inspection
app.get('/api/modules/cache', (req, res) => {
  const cacheKeys = Object.keys(moduleCache);
  const builtInModules = require('module').builtinModules;
  
  res.json({
    totalModulesLoaded: cacheKeys.length,
    builtInModulesCount: builtInModules.length,
    builtInModules: builtInModules.slice(0, 20),
    cacheSize: cacheKeys.length,
    cacheExamples: cacheKeys.slice(0, 10)
  });
});

// Route: Module resolution
app.post('/api/modules/resolve', (req, res) => {
  const { moduleName } = req.body;
  
  try {
    const resolved = require.resolve(moduleName);
    res.json({
      moduleName,
      resolved,
      cached: !!moduleCache[resolved],
      type: resolved.endsWith('.json') ? 'JSON' : 'JS'
    });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Route: CommonJS vs ESM comparison
app.get('/api/modules/cjs-vs-esm', (req, res) => {
  res.json({
    commonjs: {
      syntax: 'require(), module.exports',
      async: 'No (synchronous)',
      caching: 'Automatic (module._cache)',
      circular_deps: 'Handled via partial exports',
      tree_shaking: 'No',
      defaultSupport: 'Yes (all Node versions)'
    },
    esm: {
      syntax: 'import/export',
      async: 'Yes (asynchronous)',
      caching: 'Via V8 module cache',
      circular_deps: 'Careful binding',
      tree_shaking: 'Yes',
      defaultSupport: 'Node 12.20+, requires .mjs or "type": "module"'
    }
  });
});

// Route: Circular dependency demo
app.post('/api/modules/circular-demo', (req, res) => {
  const circular = {
    issue: 'Two modules requiring each other',
    example: {
      'moduleA.js': 'const B = require("./modB"); module.exports = { B, dataA: "A" }',
      'moduleB.js': 'const A = require("./modA"); module.exports = { A, dataB: "B" }'
    },
    problem: 'Partial exports when first module loads',
    solution: 'Export at end, use lazy require, restructure code'
  };

  res.json(circular);
});

// Route: Module caching implications
app.post('/api/modules/caching-demo', (req, res) => {
  // Demonstrate module caching
  const originalLength = Object.keys(moduleCache).length;
  
  // Require same module twice
  require('path');
  require('path');
  
  const finalLength = Object.keys(moduleCache).length;

  res.json({
    note: 'Requiring same module twice uses cache',
    modulesCachedInitially: originalLength,
    modulesCachedFinal: finalLength,
    newModulesLoaded: finalLength - originalLength,
    benefit: 'Avoid duplicate execution and memory'
  });
});

// Route: Module loading strategies
app.get('/api/modules/strategies', (req, res) => {
  res.json({
    strategies: [
      {
        name: 'Eager Loading',
        approach: 'Load all modules at startup',
        pros: 'Catch errors early',
        cons: 'Slower startup'
      },
      {
        name: 'Lazy Loading',
        approach: 'Load on-demand when needed',
        pros: 'Faster startup',
        cons: 'Runtime errors possible'
      },
      {
        name: 'Dynamic Require',
        approach: 'require(variable)',
        pros: 'Flexible',
        cons: 'No static analysis, tree-shaking impossible'
      },
      {
        name: 'Clear Cache',
        approach: 'delete require.cache[moduleId]',
        pros: 'Force reload',
        cons: 'Rarely needed, can cause issues'
      }
    ]
  });
});

// Route: Module exports patterns
app.get('/api/modules/export-patterns', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Function Export',
        code: 'module.exports = function() {}',
        use: 'Single responsibility modules'
      },
      {
        name: 'Object with Methods',
        code: 'module.exports = { method1: fn, method2: fn }',
        use: 'Multiple related functions'
      },
      {
        name: 'Class Export',
        code: 'module.exports = class MyClass {}',
        use: 'Object-oriented modules'
      },
      {
        name: 'Singleton Pattern',
        code: 'module.exports = new MyClass()',
        use: 'Shared instance across imports'
      }
    ]
  });
});

// Route: Performance tips
app.get('/api/modules/performance', (req, res) => {
  res.json({
    tips: [
      'Avoid circular dependencies',
      'Use lazy require for optional features',
      'Minimize top-level side effects',
      'Use ESM for better tree-shaking',
      'Split large modules',
      'Cache computed values module-level',
      'Use conditional requires carefully'
    ],
    monitoring: {
      step1: 'Measure startup time: time node app.js',
      step2: 'Profile with: node --prof app.js',
      step3: 'Analyze: node --prof-process isolate-*.log'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Module System server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  GET /api/modules/cache - Cache inspection');
  console.log('  POST /api/modules/resolve - Module resolution');
  console.log('  GET /api/modules/cjs-vs-esm - CJS vs ESM');
  console.log('  POST /api/modules/circular-demo - Circular deps');
  console.log('  POST /api/modules/caching-demo - Caching behavior');
  console.log('  GET /api/modules/strategies - Loading strategies');
  console.log('  GET /api/modules/export-patterns - Export patterns');
  console.log('  GET /api/modules/performance - Performance tips');
});

module.exports = app;
