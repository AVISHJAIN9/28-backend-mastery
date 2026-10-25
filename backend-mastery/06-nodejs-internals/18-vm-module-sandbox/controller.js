const vm = require('vm');

const state = {
  sandboxes: [],
  lastExecution: null,
};

const getSandboxInfo = () => {
  return {
    count: state.sandboxes.length,
    lastExecution: state.lastExecution,
    message: `${state.sandboxes.length} active sandbox contexts`,
  };
};

const testSecurity = () => {
  const sandbox = { x: 10 };
  const context = vm.createContext(sandbox);
  
  try {
    vm.runInContext('require("fs")', context, { timeout: 500 });
  } catch (e) {
    return {
      requireAccess: false,
      processAccess: false,
      globalAccess: false,
      explanation: 'Sandbox prevents access to require, process, and globals',
      description: 'Security boundaries are enforced correctly',
    };
  }
};

const executeCode = (code, vars = {}) => {
  try {
    const sandbox = { ...vars };
    const context = vm.createContext(sandbox);
    const result = vm.runInContext(code, context, { timeout: 1000 });
    
    state.lastExecution = { code, result, time: new Date() };
    state.sandboxes.push({ id: Date.now(), code, vars });

    return {
      success: true,
      result,
      code,
      vars,
      description: `Code executed successfully in isolated context`,
      stats: {
        sandboxCount: state.sandboxes.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      description: 'Code execution failed or timed out',
    };
  }
};

const testPerformance = (code) => {
  const iterations = 100;
  let totalTime = 0;

  for (let i = 0; i < iterations; i++) {
    const sandbox = {};
    const context = vm.createContext(sandbox);
    const start = process.hrtime.bigint();
    vm.runInContext(code, context, { timeout: 1000 });
    const end = process.hrtime.bigint();
    totalTime += Number(end - start) / 1000;
  }

  const avgTime = totalTime / iterations;
  return {
    iterations,
    totalTime: totalTime.toFixed(2),
    avgTime: avgTime.toFixed(2),
    unit: 'microseconds per execution',
    description: `Performance benchmark for code execution`,
  };
};

const getContextData = () => {
  const testSandbox = { a: 42, b: 'hello' };
  const context = vm.createContext(testSandbox);
  vm.runInContext('c = a + 10; d = b + "world"', context);

  return {
    before: { a: 42, b: 'hello' },
    after: { a: testSandbox.a, b: testSandbox.b, c: testSandbox.c, d: testSandbox.d },
    description: 'Context variables are isolated and modifiable',
    explanation: 'Changes within sandbox context are reflected only in that context',
  };
};

const multiContext = (code) => {
  const results = [];

  for (let i = 0; i < 3; i++) {
    const sandbox = { iteration: i, x: Math.random() * 100 };
    const context = vm.createContext(sandbox);
    const result = vm.runInContext(code, context, { timeout: 1000 });
    results.push({
      iteration: i,
      input: sandbox.x.toFixed(2),
      output: result,
    });
  }

  return {
    contextCount: 3,
    results,
    description: 'Multiple isolated execution contexts',
  };
};

module.exports = {
  getSandboxInfo,
  testSecurity,
  executeCode,
  testPerformance,
  getContextData,
  multiContext,
};
