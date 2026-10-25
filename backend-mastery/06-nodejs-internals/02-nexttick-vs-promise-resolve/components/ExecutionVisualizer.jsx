import React, { useState } from 'react';
import '../styles/ExecutionVisualizer.css';

const ExecutionVisualizer = () => {
  const [execution, setExecution] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoType, setDemoType] = useState('basic');

  const runDemo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/microtasks/run-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: demoType })
      });
      const data = await response.json();
      setExecution(data.execution);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to run demo');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseColor = (message) => {
    if (message.includes('nextTick')) return '#FF6B6B';
    if (message.includes('Promise')) return '#4ECDC4';
    if (message.includes('setTimeout')) return '#FFE66D';
    if (message.includes('setImmediate')) return '#95E1D3';
    return '#C7CEEA';
  };

  return (
    <div className="visualizer">
      <div className="controls">
        <div className="control-group">
          <label htmlFor="demo-type">Select Demo:</label>
          <select 
            id="demo-type"
            value={demoType} 
            onChange={(e) => setDemoType(e.target.value)}
          >
            <option value="basic">Basic Execution Order</option>
            <option value="mixed">Mixed Microtasks & Macrotasks</option>
            <option value="nested">Nested Callbacks</option>
            <option value="promise-vs-nexttick">Promise vs nextTick</option>
            <option value="setimmediate-comparison">Full Comparison</option>
          </select>
        </div>

        <button 
          onClick={runDemo} 
          disabled={loading}
          className="run-button"
        >
          {loading ? '⏳ Running...' : '▶ Run Demo'}
        </button>
      </div>

      <div className="execution-timeline">
        <h3>Execution Order</h3>
        {execution.length === 0 ? (
          <p className="empty-state">Click "Run Demo" to see execution order</p>
        ) : (
          <div className="timeline">
            {execution.map((item, idx) => (
              <div 
                key={idx} 
                className="timeline-item"
                style={{ 
                  borderLeftColor: getPhaseColor(item.message),
                  animationDelay: `${idx * 50}ms`
                }}
              >
                <div className="order-number">{item.order}</div>
                <div className="message">{item.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="legend">
        <div className="legend-item">
          <span className="color" style={{ backgroundColor: '#FF6B6B' }}></span>
          <span className="label">nextTick</span>
        </div>
        <div className="legend-item">
          <span className="color" style={{ backgroundColor: '#4ECDC4' }}></span>
          <span className="label">Promise</span>
        </div>
        <div className="legend-item">
          <span className="color" style={{ backgroundColor: '#FFE66D' }}></span>
          <span className="label">setTimeout</span>
        </div>
        <div className="legend-item">
          <span className="color" style={{ backgroundColor: '#95E1D3' }}></span>
          <span className="label">setImmediate</span>
        </div>
      </div>
    </div>
  );
};

export default ExecutionVisualizer;
