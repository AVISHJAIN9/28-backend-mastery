import React, { useState } from 'react';
import '../styles/BlockingExample.css';

const BlockingExample = () => {
  const [selected, setSelected] = useState('cpu-blocking');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);

  const examples = {
    'cpu-blocking': {
      title: 'CPU Blocking Example',
      description: 'Heavy CPU computation blocks the event loop',
      code: `function heavyComputation() {
  console.log('Starting heavy computation...');
  let sum = 0;
  for (let i = 0; i < 1e9; i++) {
    sum += i;
  }
  console.log('Computation done, sum:', sum);
}

// This will block for ~2 seconds
heavyComputation();`,
      effect: 'The event loop is blocked for the entire duration. No other callbacks (timers, promises, I/O) can execute until this finishes.'
    },
    'solution-worker': {
      title: 'Solution: Worker Threads',
      description: 'Offload heavy computation to a worker thread',
      code: `const { Worker } = require('worker_threads');

function runHeavyAsync() {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./heavy-task.js');
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error('Worker stopped'));
    });
  });
}

// Event loop remains responsive
runHeavyAsync().then(result => {
  console.log('Result:', result);
});

setTimeout(() => console.log('Timer works!'), 100);`,
      effect: 'The computation runs on a separate thread. The main event loop remains responsive to other callbacks.'
    },
    'solution-async': {
      title: 'Solution: Async Chunks',
      description: 'Break computation into smaller async chunks',
      code: `async function heavyComputationAsync() {
  console.log('Starting computation in chunks...');
  
  for (let batch = 0; batch < 10; batch++) {
    let sum = 0;
    for (let i = 0; i < 1e8; i++) {
      sum += i;
    }
    console.log(\`Batch \${batch} done\`);
    
    // Yield to event loop
    await new Promise(resolve => setImmediate(resolve));
  }
  
  console.log('All batches done');
}

// Event loop processes other tasks between batches
heavyComputationAsync();

setTimeout(() => console.log('Timer works!'), 100);`,
      effect: 'The computation is broken into chunks with setImmediate() yielding to the event loop between chunks, allowing other tasks to execute.'
    },
    'blocking-io': {
      title: 'Blocking I/O (Sync vs Async)',
      description: 'Comparison of blocking and non-blocking I/O',
      code: `const fs = require('fs');

// ❌ BLOCKING - Halts event loop
const data = fs.readFileSync('large-file.txt');
console.log('File size:', data.length);

// ✅ NON-BLOCKING - Event loop continues
fs.readFile('large-file.txt', (err, data) => {
  if (!err) console.log('File size:', data.length);
});

setTimeout(() => console.log('Timer fires!'), 0);`,
      effect: 'Synchronous I/O blocks the entire event loop. Asynchronous I/O allows the event loop to handle other tasks while waiting.'
    },
    'microtask-priority': {
      title: 'Microtask Priority',
      description: 'Microtasks execute before the next event loop phase',
      code: `console.log('Script start');

setTimeout(() => {
  console.log('setTimeout (Timers phase)');
}, 0);

Promise.resolve()
  .then(() => console.log('Promise 1 (Microtask)'))
  .then(() => console.log('Promise 2 (Microtask)'));

setImmediate(() => {
  console.log('setImmediate (Check phase)');
});

console.log('Script end');

/* Output order:
Script start
Script end
Promise 1 (Microtask)
Promise 2 (Microtask)
setTimeout (Timers phase)
setImmediate (Check phase)
*/`,
      effect: 'Promises (microtasks) always execute before the next phase, even before setTimeout!'
    }
  };

  const current = examples[selected];

  const runExample = async () => {
    setRunning(true);
    setOutput('Running...\n');
    
    try {
      const response = await fetch('/api/event-loop/run-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ example: selected })
      });
      
      const data = await response.json();
      setOutput(data.output);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="blocking-example">
      <div className="examples-nav">
        {Object.entries(examples).map(([key, value]) => (
          <button
            key={key}
            className={selected === key ? 'active' : ''}
            onClick={() => setSelected(key)}
          >
            {value.title}
          </button>
        ))}
      </div>

      <div className="example-content">
        <div className="description">
          <h3>{current.title}</h3>
          <p>{current.description}</p>
        </div>

        <div className="code-section">
          <h4>Code:</h4>
          <pre>
            <code>{current.code}</code>
          </pre>
        </div>

        <div className="effect-section">
          <h4>Effect on Event Loop:</h4>
          <div className="effect-box">
            {current.effect}
          </div>
        </div>

        <div className="run-section">
          <button 
            onClick={runExample} 
            disabled={running}
            className="run-button"
          >
            {running ? 'Running...' : '▶ Run Example'}
          </button>
        </div>

        {output && (
          <div className="output-section">
            <h4>Output:</h4>
            <pre className="output-box">
              {output}
            </pre>
          </div>
        )}
      </div>

      <div className="tips-section">
        <h4>💡 Best Practices:</h4>
        <ul>
          <li>Avoid blocking the event loop with long synchronous operations</li>
          <li>Use async/await or callbacks for I/O operations</li>
          <li>Break heavy CPU work into smaller chunks with setImmediate()</li>
          <li>Consider worker threads for truly CPU-intensive tasks</li>
          <li>Use profiling tools to identify event loop blocking</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockingExample;
