import React, { useState, useEffect } from 'react';
import '../styles/TaskMetrics.css';

const TaskMetrics = ({ stats }) => {
  const [metrics, setMetrics] = useState({
    eventLoopCount: 0,
    totalTime: 0,
    averageTime: 0,
    maxTime: 0,
    phaseDistribution: {},
    throughput: 0,
    lag: 0
  });

  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (stats) {
      setMetrics(prev => ({
        ...prev,
        ...stats
      }));
      
      setHistory(prev => [...prev.slice(-99), stats]);
    }
  }, [stats]);

  const calculateMetrics = () => {
    if (history.length === 0) return {};
    
    const totalTime = history.reduce((sum, h) => sum + (h.totalTime || 0), 0);
    const avg = totalTime / history.length;
    const max = Math.max(...history.map(h => h.totalTime || 0));
    
    return {
      totalSamples: history.length,
      avgTime: avg.toFixed(2),
      maxTime: max.toFixed(2),
      throughput: (history.length / (totalTime / 1000)).toFixed(1)
    };
  };

  const stats_data = calculateMetrics();

  return (
    <div className="task-metrics">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="icon">📊</div>
          <div className="metric-content">
            <h4>Total Samples</h4>
            <p className="value">{stats_data.totalSamples || 0}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon">⏱️</div>
          <div className="metric-content">
            <h4>Average Time</h4>
            <p className="value">{stats_data.avgTime || 0}ms</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon">📈</div>
          <div className="metric-content">
            <h4>Max Time</h4>
            <p className="value">{stats_data.maxTime || 0}ms</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon">🚀</div>
          <div className="metric-content">
            <h4>Throughput</h4>
            <p className="value">{stats_data.throughput || 0} iter/s</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon">⏳</div>
          <div className="metric-content">
            <h4>Event Loop Lag</h4>
            <p className="value">{metrics.lag || 0}ms</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="icon">🔄</div>
          <div className="metric-content">
            <h4>Iterations</h4>
            <p className="value">{metrics.eventLoopCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="phase-breakdown">
        <h3>Phase Time Distribution</h3>
        <div className="phase-chart">
          {Object.entries(metrics.phaseDistribution || {}).map(([phase, time]) => (
            <div key={phase} className="phase-bar">
              <div className="phase-label">{phase}</div>
              <div className="bar-container">
                <div 
                  className="bar"
                  style={{ width: `${(time / (metrics.totalTime || 1)) * 100}%` }}
                ></div>
              </div>
              <div className="phase-time">{time.toFixed(2)}ms</div>
            </div>
          ))}
        </div>
      </div>

      <div className="timeline-chart">
        <h3>Event Loop Timeline</h3>
        <div className="chart-container">
          {history.length > 0 ? (
            <svg width="100%" height="200" className="timeline-svg">
              <polyline
                points={history.map((h, i) => 
                  `${(i / history.length) * 100}% ${Math.max(0, 200 - (h.totalTime || 0) * 20)}`
                ).join(' ')}
                fill="none"
                stroke="#4ECDC4"
                strokeWidth="2"
              />
            </svg>
          ) : (
            <p className="no-data">No data available yet. Start monitoring to see timeline.</p>
          )}
        </div>
      </div>

      <div className="insights">
        <h3>📊 Performance Insights</h3>
        <ul className="insight-list">
          {metrics.lag && metrics.lag > 100 && (
            <li className="warning">
              ⚠️ High event loop lag detected ({metrics.lag}ms). Consider optimizing blocking operations.
            </li>
          )}
          {metrics.lag && metrics.lag <= 100 && (
            <li className="good">
              ✅ Event loop lag is healthy ({metrics.lag}ms).
            </li>
          )}
          {stats_data.maxTime && Number(stats_data.maxTime) > 500 && (
            <li className="warning">
              ⚠️ Some iterations take longer than 500ms. This might be due to heavy operations.
            </li>
          )}
          {stats_data.throughput && Number(stats_data.throughput) > 100 && (
            <li className="good">
              ✅ Excellent throughput ({stats_data.throughput} iterations/second).
            </li>
          )}
        </ul>
      </div>

      <div className="metrics-explanation">
        <h4>Understanding Metrics:</h4>
        <dl>
          <dt>Total Samples</dt>
          <dd>Number of event loop iterations sampled</dd>
          
          <dt>Average Time</dt>
          <dd>Mean time per event loop iteration</dd>
          
          <dt>Max Time</dt>
          <dd>Longest event loop iteration time</dd>
          
          <dt>Throughput</dt>
          <dd>Iterations per second</dd>
          
          <dt>Event Loop Lag</dt>
          <dd>Delay between when a timer should fire and when it actually does</dd>
          
          <dt>Phase Distribution</dt>
          <dd>Time spent in each event loop phase</dd>
        </dl>
      </div>
    </div>
  );
};

export default TaskMetrics;
