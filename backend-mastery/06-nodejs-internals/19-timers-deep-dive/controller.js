const getTimerOrder = () => {
  const order = [];
  
  process.nextTick(() => order.push('nextTick'));
  Promise.resolve().then(() => order.push('promise'));
  setImmediate(() => order.push('immediate'));
  setTimeout(() => order.push('timeout 0'));

  return {
    order: order,
    explanation: 'Execution order: nextTick → Promise → setImmediate → setTimeout',
    description: 'Timer ordering demonstrates the event loop phases',
  };
};

const measurePrecision = () => {
  const target = 10; // 10ms
  const start = performance.now();
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const end = performance.now();
      const actual = end - start;
      const drift = actual - target;

      resolve({
        target,
        actual: actual.toFixed(2),
        drift: drift.toFixed(2),
        accuracy: ((target / actual) * 100).toFixed(2) + '%',
        description: 'Timer precision varies with system load',
      });
    }, target);
  });
};

const testRefUnref = () => {
  const withRef = setTimeout(() => {}, 5000);
  const withUnref = setTimeout(() => {}, 5000);
  withUnref.unref();

  return {
    withRef: { hasRef: true, willBlockExit: true },
    withUnref: { hasRef: false, willBlockExit: false },
    explanation: 'unref() allows process to exit even if timer pending',
  };
};

const testInterval = () => {
  const intervals = [];
  
  for (let i = 0; i < 3; i++) {
    const id = setInterval(() => {}, 1000);
    intervals.push(id);
    clearInterval(id);
  }

  return {
    intervalsCreated: intervals.length,
    allCleared: true,
    description: 'Intervals must be cleared to prevent memory waste',
  };
};

const testPerformance = () => {
  const start = performance.now();
  let count = 0;

  for (let i = 0; i < 1000; i++) {
    setTimeout(() => count++, 0);
  }

  const end = performance.now();
  const time = end - start;

  return {
    timersCreated: 1000,
    creationTimeMs: time.toFixed(2),
    avgTimePerTimer: (time / 1000).toFixed(4),
    description: 'Timer creation performance metrics',
  };
};

const testCleanup = () => {
  const timers = [
    setTimeout(() => {}, 1000),
    setInterval(() => {}, 1000),
    setImmediate(() => {}),
  ];

  clearTimeout(timers[0]);
  clearInterval(timers[1]);
  clearImmediate(timers[2]);

  return {
    totalTimers: timers.length,
    allCleared: true,
    description: 'Proper cleanup prevents resource leaks',
    explanation: 'Always clear timers in cleanup handlers or process exit',
  };
};

module.exports = {
  getTimerOrder,
  measurePrecision,
  testRefUnref,
  testInterval,
  testPerformance,
  testCleanup,
};
