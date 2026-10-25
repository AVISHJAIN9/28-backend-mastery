import React, { useState } from 'react';
import '../styles/InteractiveDemo.css';

const InteractiveDemo = () => {
  const [code, setCode] = useState(`console.log('1. Start');

process.nextTick(() => {
  console.log('2. nextTick');
});

Promise.resolve().then(() => {
  console.log('3. Promise');
});

setTimeout(() => {
  console.log('4. setTimeout');
}, 0);

console.log('5. End');`);

  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState([]);

  const templates = {
    'nexttick-first': `console.log('Start');

process.nextTick(() => {
  console.log('nextTick - Always runs first!');
});

Promise.resolve().then(() => {
  console.log('Promise - Runs second');
});

console.log('Sync - Runs immediately');`,

    'nested-promises': `console.log('1');

Promise.resolve()
  .then(() => {
    console.log('2');
    return Promise.resolve();
  })
  .then(() => {
    console.log('3');
    return Promise.resolve();
  })
  .then(() => {
    console.log('4');
  });

console.log('5');`,

    'mixed-all': `console.log('A');

setTimeout(() => console.log('B'), 0);
process.nextTick(() => console.log('C'));
Promise.resolve().then(() => console.log('D'));
setImmediate(() => console.log('E'));

console.log('F');`,

    'nested-nexttick': `console.log('1');

process.nextTick(() => {
  console.log('2');
  process.nextTick(() => {
    console.log('3');
  });
});

process.nextTick(() => {
  console.log('4');
});

console.log('5');`,

    'starve-event-loop': `console.log('Start');

// This will starve the event loop
let i = 0;
function recursiveNextTick() {
  if (i < 5) {
    i++;
    console.log(\`nextTick \${i}\`);
    process.nextTick(recursiveNextTick);
  }
}

recursiveNextTick();

setTimeout(() => {
  console.log('setTimeout blocked until all nextTick finish!');
}, 0);

console.log('End');`
  };

  const runCode = async () => {
    setRunning(true);
    try {
      // Simulate execution
      const lines = code.split('\n');
      const order = [];
      
      // Parse and predict
      let hasNextTick = code.includes('nextTick');
      let hasPromise = code.includes('Promise');
      let hasTimeout = code.includes('setTimeout');
      let hasImmediate = code.includes('setImmediate');

      if (hasNextTick) order.push('nextTick callbacks');
      if (hasPromise) order.push('Promise callbacks');
      if (hasTimeout) order.push('setTimeout callbacks');
      if (hasImmediate) order.push('setImmediate callbacks');

      setPredictions(order);
      
      // Show output
      setOutput(`✅ Execution Order Predicted:\n\n${order.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n(Sync code runs first)\n\nTry modifying the code to see different execution orders!`);
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const loadTemplate = (template) => {
    setCode(templates[template]);
    setOutput('');
    setPredictions([]);
  };

  return (
    <div className="interactive-demo">
      <div className="editor-container">
        <div className="editor-panel">
          <h3>Code Editor</h3>
          <div className="templates">
            <strong>Templates:</strong>
            <button onClick={() => loadTemplate('nexttick-first')}>nextTick First</button>
            <button onClick={() => loadTemplate('nested-promises')}>Nested Promises</button>
            <button onClick={() => loadTemplate('mixed-all')}>All Mixed</button>
            <button onClick={() => loadTemplate('nested-nexttick')}>Nested nextTick</button>
            <button onClick={() => loadTemplate('starve-event-loop')}>Starve Event Loop</button>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="code-editor"
            placeholder="Write your JavaScript code..."
          />

          <button 
            onClick={runCode}
            disabled={running}
            className="run-button"
          >
            {running ? '⏳ Analyzing...' : '▶ Analyze Code'}
          </button>
        </div>

        <div className="output-panel">
          <h3>Execution Order</h3>
          {output ? (
            <pre className="output-box">
              {output}
            </pre>
          ) : (
            <p className="placeholder">Click "Analyze Code" to see execution order</p>
          )}
        </div>
      </div>

      <div className="learning-tips">
        <h3>🎓 Learning Tips</h3>
        <div className="tips-grid">
          <div className="tip">
            <h4>Sync First</h4>
            <p>All synchronous code (console.log outside callbacks) runs first</p>
          </div>

          <div className="tip">
            <h4>nextTick Priority</h4>
            <p>process.nextTick always runs before Promises</p>
          </div>

          <div className="tip">
            <h4>Microtasks Second</h4>
            <p>All Promise callbacks run before setTimeout</p>
          </div>

          <div className="tip">
            <h4>Event Loop Last</h4>
            <p>setTimeout and setImmediate depend on event loop phase</p>
          </div>

          <div className="tip">
            <h4>Event Loop Starvation</h4>
            <p>Recursive nextTick can block setTimeout</p>
          </div>

          <div className="tip">
            <h4>Nested Microtasks</h4>
            <p>Promise chains execute sequentially before event loop</p>
          </div>
        </div>
      </div>

      <div className="common-patterns">
        <h3>🔄 Common Patterns</h3>
        <div className="pattern-grid">
          <div className="pattern">
            <h4>Pattern: Ensure Next Tick</h4>
            <pre><code>{`// Use nextTick when you need guaranteed execution
// before event loop starts
process.nextTick(() => {
  console.log('This is priority!');
});`}</code></pre>
          </div>

          <div className="pattern">
            <h4>Pattern: Promise Chain</h4>
            <pre><code>{`// Promises ensure sequential async execution
Promise.resolve()
  .then(() => step1())
  .then(() => step2())
  .then(() => step3());`}</code></pre>
          </div>

          <div className="pattern">
            <h4>Pattern: Defer to I/O</h4>
            <pre><code>{`// Use setImmediate to defer after I/O
fs.readFile('file.txt', () => {
  setImmediate(() => {
    // This runs after current I/O
    doSomething();
  });
});`}</code></pre>
          </div>

          <div className="pattern">
            <h4>Pattern: Microtask Drain</h4>
            <pre><code>{`// Drain microtasks with recursive nextTick
function drainMicrotasks() {
  process.nextTick(() => {
    console.log('All microtasks drained');
  });
}`}</code></pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemo;
