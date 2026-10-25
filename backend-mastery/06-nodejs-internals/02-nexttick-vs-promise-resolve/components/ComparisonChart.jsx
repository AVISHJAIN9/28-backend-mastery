import React from 'react';
import '../styles/ComparisonChart.css';

const ComparisonChart = () => {
  const comparisons = [
    {
      feature: 'Execution Timing',
      nextTick: 'After current code, before event loop',
      promise: 'After nextTick, before event loop',
      setTimeout: 'During event loop (Timers phase)',
      setImmediate: 'During event loop (Check phase)'
    },
    {
      feature: 'Priority',
      nextTick: '⭐⭐⭐⭐⭐ Highest',
      promise: '⭐⭐⭐⭐ High',
      setTimeout: '⭐⭐⭐ Medium',
      setImmediate: '⭐⭐ Lower'
    },
    {
      feature: 'Queue Type',
      nextTick: 'nextTick queue (OS-agnostic)',
      promise: 'Microtask queue',
      setTimeout: 'Timer queue (libuv)',
      setImmediate: 'Immediate queue'
    },
    {
      feature: 'Blocks Event Loop',
      nextTick: '❌ No (before event loop)',
      promise: '❌ No (before event loop)',
      setTimeout: '✅ Yes (during phase)',
      setImmediate: '✅ Yes (during phase)'
    },
    {
      feature: 'Common Use Case',
      nextTick: 'Ensure code runs asap',
      promise: 'Async operations, promise chains',
      setTimeout: 'Delay execution',
      setImmediate: 'Defer to I/O phase'
    }
  ];

  const executionTimeline = [
    { label: '1. Sync Code', time: 0, color: '#C7CEEA' },
    { label: '2. process.nextTick', time: 1, color: '#FF6B6B' },
    { label: '3. Promise.then', time: 2, color: '#4ECDC4' },
    { label: '4. setTimeout (0ms)', time: 3, color: '#FFE66D' },
    { label: '5. setImmediate', time: 4, color: '#95E1D3' },
  ];

  return (
    <div className="comparison">
      <div className="timeline-visual">
        <h3>Execution Timeline</h3>
        <div className="timeline">
          {executionTimeline.map((item, idx) => (
            <div key={idx} className="timeline-step">
              <div 
                className="timeline-marker"
                style={{ backgroundColor: item.color }}
              >
                {item.time + 1}
              </div>
              <div className="timeline-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="comparison-table">
        <h3>Detailed Comparison</h3>
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>process.nextTick()</th>
              <th>Promise.then()</th>
              <th>setTimeout()</th>
              <th>setImmediate()</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((row, idx) => (
              <tr key={idx}>
                <td className="feature">{row.feature}</td>
                <td>{row.nextTick}</td>
                <td>{row.promise}</td>
                <td>{row.setTimeout}</td>
                <td>{row.setImmediate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="decision-tree">
        <h3>Decision Tree: Which Should I Use?</h3>
        <div className="tree-container">
          <div className="tree-node root">
            <p>Need to schedule async work?</p>
          </div>

          <div className="tree-branches">
            <div className="branch">
              <div className="tree-node decision">
                <p>🤔 Do you need MAXIMUM priority?</p>
                <div className="answer">
                  <p><strong>✅ YES:</strong> Use <code>process.nextTick()</code></p>
                  <p className="reason">Runs before everything else</p>
                </div>
              </div>
            </div>

            <div className="branch">
              <div className="tree-node decision">
                <p>🤔 Is it a Promise-based operation?</p>
                <div className="answer">
                  <p><strong>✅ YES:</strong> Use <code>Promise.then()</code></p>
                  <p className="reason">Natural for promise chains</p>
                </div>
              </div>
            </div>

            <div className="branch">
              <div className="tree-node decision">
                <p>🤔 Need to defer until after I/O?</p>
                <div className="answer">
                  <p><strong>✅ YES:</strong> Use <code>setImmediate()</code></p>
                  <p className="reason">Runs after poll phase</p>
                </div>
              </div>
            </div>

            <div className="branch">
              <div className="tree-node decision">
                <p>🤔 Need to delay by specific time?</p>
                <div className="answer">
                  <p><strong>✅ YES:</strong> Use <code>setTimeout()</code></p>
                  <p className="reason">Only option for time-based delay</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="performance-notes">
        <h3>⚡ Performance Notes</h3>
        <div className="note-grid">
          <div className="note">
            <strong>process.nextTick()</strong>
            <p>Fastest but can starve event loop if overused</p>
          </div>
          <div className="note">
            <strong>Promise.then()</strong>
            <p>Ideal for most async operations</p>
          </div>
          <div className="note">
            <strong>setTimeout()</strong>
            <p>Slower due to timer overhead</p>
          </div>
          <div className="note">
            <strong>setImmediate()</strong>
            <p>Best for deferring after I/O operations</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonChart;
