const getDebugInfo = () => {
  return {
    inspectorPort: 9229,
    inspectorURL: 'chrome://inspect',
    inspectorRunning: process.versions.v8 !== undefined,
    description: 'Debug with Chrome DevTools at chrome://inspect',
  };
};

const testBreakpoint = () => {
  const x = 10;
  const y = 20;
  const z = x + y; // Set breakpoint here

  return {
    x,
    y,
    z,
    description: 'Breakpoint example - inspect variables at this point',
  };
};

const getStackTrace = () => {
  const stack = new Error().stack;
  const lines = stack.split('\n').slice(1, 6);

  return {
    stackDepth: lines.length,
    trace: lines,
    description: 'Call stack shows execution path',
  };
};

const profileExecution = () => {
  const start = performance.now();

  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += Math.sqrt(i);
  }

  const end = performance.now();
  const duration = end - start;

  return {
    iterations: 1000000,
    duration: duration.toFixed(2) + 'ms',
    description: 'Profile code execution time with DevTools',
  };
};

const getMemoryUsage = () => {
  const mem = process.memoryUsage();
  return {
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss: Math.round(mem.rss / 1024 / 1024) + 'MB',
    external: Math.round(mem.external / 1024) + 'KB',
    description: 'Memory usage snapshot from process',
  };
};

const inspectVariables = () => {
  const obj = {
    name: 'app',
    version: '1.0.0',
    nested: {
      deep: {
        value: 42,
      },
    },
  };

  return {
    object: obj,
    typeof: typeof obj,
    keys: Object.keys(obj),
    description: 'Inspect object structure and properties',
  };
};

module.exports = {
  getDebugInfo,
  testBreakpoint,
  getStackTrace,
  profileExecution,
  getMemoryUsage,
  inspectVariables,
};
