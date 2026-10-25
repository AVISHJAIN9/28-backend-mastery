import React from 'react';
import '../styles/MicrotaskExplainer.css';

const MicrotaskExplainer = () => {
  return (
    <div className="explainer">
      <div className="concept-grid">
        <div className="concept-card">
          <h3>process.nextTick()</h3>
          <div className="icon">⏱️</div>
          <div className="content">
            <p><strong>When:</strong> Immediately after current code, before event loop</p>
            <p><strong>Priority:</strong> HIGHEST</p>
            <p><strong>Queue:</strong> nextTick queue (NOT microtask queue)</p>
            <pre><code>{`process.nextTick(() => {
  console.log('Runs first!');
});`}</code></pre>
          </div>
        </div>

        <div className="concept-card">
          <h3>Promise.then()</h3>
          <div className="icon">🤝</div>
          <div className="content">
            <p><strong>When:</strong> After nextTick, before event loop phases</p>
            <p><strong>Priority:</strong> SECOND</p>
            <p><strong>Queue:</strong> Microtask queue</p>
            <pre><code>{`Promise.resolve().then(() => {
  console.log('Runs second');
});`}</code></pre>
          </div>
        </div>

        <div className="concept-card">
          <h3>setTimeout()</h3>
          <div className="icon">⏰</div>
          <div className="content">
            <p><strong>When:</strong> During Timers phase</p>
            <p><strong>Priority:</strong> THIRD (in event loop)</p>
            <p><strong>Queue:</strong> Timer queue (macrotask)</p>
            <pre><code>{`setTimeout(() => {
  console.log('Runs third');
}, 0);`}</code></pre>
          </div>
        </div>

        <div className="concept-card">
          <h3>setImmediate()</h3>
          <div className="icon">⚡</div>
          <div className="content">
            <p><strong>When:</strong> During Check phase</p>
            <p><strong>Priority:</strong> FOURTH (in event loop)</p>
            <p><strong>Queue:</strong> Immediate queue (macrotask)</p>
            <pre><code>{`setImmediate(() => {
  console.log('Runs fourth');
});`}</code></pre>
          </div>
        </div>
      </div>

      <div className="execution-order-box">
        <h3>Complete Execution Order</h3>
        <ol className="order-list">
          <li>Synchronous code</li>
          <li>process.nextTick callbacks</li>
          <li>All microtasks (Promises)</li>
          <li>Event loop phases start:</li>
          <li style={{ marginLeft: '20px' }}>Timers phase (setTimeout)</li>
          <li style={{ marginLeft: '20px' }}>Pending callbacks phase</li>
          <li style={{ marginLeft: '20px' }}>Idle/Prepare phase</li>
          <li style={{ marginLeft: '20px' }}>Poll phase (I/O)</li>
          <li style={{ marginLeft: '20px' }}>Check phase (setImmediate)</li>
          <li style={{ marginLeft: '20px' }}>Close phase</li>
          <li>Loop repeats...</li>
        </ol>
      </div>

      <div className="code-example">
        <h3>Full Example Code</h3>
        <pre className="code-block"><code>{`console.log('1. Start');

setTimeout(() => {
  console.log('5. setTimeout');
}, 0);

Promise.resolve()
  .then(() => console.log('3. Promise 1'))
  .then(() => console.log('4. Promise 2'));

process.nextTick(() => {
  console.log('2. nextTick');
});

console.log('1.5. End of sync');

/* Output:
1. Start
1.5. End of sync
2. nextTick
3. Promise 1
4. Promise 2
5. setTimeout
*/`}</code></pre>
      </div>

      <div className="why-matters">
        <h3>Why Does This Matter?</h3>
        <ul>
          <li>🐛 <strong>Debugging:</strong> Understanding order helps find race conditions</li>
          <li>⚡ <strong>Performance:</strong> Choose right tool for performance-critical code</li>
          <li>🎯 <strong>Precision:</strong> Control exact execution timing</li>
          <li>🔄 <strong>Dependencies:</strong> Ensure code runs in correct order</li>
        </ul>
      </div>
    </div>
  );
};

export default MicrotaskExplainer;
