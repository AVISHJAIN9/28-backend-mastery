import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const API_BASE = 'http://localhost:6405/api';

  const [activeTab, setActiveTab] = useState('sync');
  const [formData, setFormData] = useState({ key: 'user:1', value: 'John Doe' });
  const [response, setResponse] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [writeLog, setWriteLog] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);

  // Fetch API endpoint
  const fetchAPI = async (endpoint, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      };
      const res = await fetch(endpoint, options);
      const data = await res.json();
      return data;
    } catch (error) {
      return { error: error.message };
    }
  };

  // Auto-refresh metrics every second
  useEffect(() => {
    const interval = setInterval(async () => {
      const metricsData = await fetchAPI(`${API_BASE}/metrics`);
      if (metricsData && !metricsData.error) {
        setMetrics(metricsData);
        if (metricsData.recentWrites) {
          setWriteLog(metricsData.recentWrites);
        }
      }

      const queueData = await fetchAPI(`${API_BASE}/queue/status`);
      if (queueData && !queueData.error) {
        setQueueStatus(queueData);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ============================================
  // TAB 1: Synchronous Write-Through
  // ============================================
  const renderSyncTab = () => (
    <div className="tab-content">
      <h3>Synchronous Write-Through</h3>
      <p>Write to cache and database sequentially. Total latency = cache_time + db_time.</p>

      <div className="form-group">
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          placeholder="Key (e.g., user:1)"
        />
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          placeholder="Value"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/write/sync`, 'POST', formData);
            setResponse(result);
          }}
          className="btn-primary"
        >
          Write-Through (Sync)
        </button>
      </div>

      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>Response:</h4>
          {response.success && (
            <div>
              <p><strong>Key:</strong> {response.key}</p>
              <p><strong>Value:</strong> {JSON.stringify(response.value)}</p>
              <p><strong>Cache Latency:</strong> {response.cacheLatency} ms</p>
              <p><strong>DB Latency:</strong> {response.dbLatency} ms</p>
              <p><strong>Total Latency:</strong> {response.totalLatency} ms</p>
              <p><strong>Strategy:</strong> {response.strategy}</p>
            </div>
          )}
          {response.error && <p>Error: {response.error}</p>}
        </div>
      )}

      <div className="explanation">
        <h4>How Synchronous Write-Through Works:</h4>
        <ul>
          <li><strong>Step 1:</strong> Write to cache (~1ms)</li>
          <li><strong>Step 2:</strong> Write to database (100ms)</li>
          <li><strong>Wait for both:</strong> Total = ~101ms per write</li>
          <li><strong>Advantage:</strong> Data is guaranteed in both places</li>
          <li><strong>Drawback:</strong> Slow writes, user waits for DB</li>
          <li><strong>Rollback:</strong> If DB fails, cache is reverted</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 2: Asynchronous Write-Through
  // ============================================
  const renderAsyncTab = () => (
    <div className="tab-content">
      <h3>Asynchronous Write-Through</h3>
      <p>Write to cache immediately, queue database write. Return instantly to user.</p>

      <div className="form-group">
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          placeholder="Key"
        />
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          placeholder="Value"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/write/async`, 'POST', formData);
            setResponse(result);
          }}
          className="btn-primary"
        >
          Write-Through (Async)
        </button>
      </div>

      {response && (
        <div className={`response ${response.error ? 'error' : 'success'}`}>
          <h4>Response:</h4>
          {response.success === false && (
            <div>
              <p><strong>Status:</strong> Queued (fire-and-forget)</p>
              <p><strong>Cache Latency:</strong> {response.cacheLatency} ms</p>
              <p><strong>Total Latency:</strong> {response.totalLatency} ms</p>
              <p><strong>Note:</strong> {response.note}</p>
            </div>
          )}
          {response.success && (
            <div>
              <p><strong>Key:</strong> {response.key}</p>
              <p><strong>Cache Latency:</strong> {response.cacheLatency} ms</p>
              <p><strong>Queued for Database:</strong> {response.queuedForDatabase ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      )}

      {queueStatus && (
        <div className="queue-status">
          <h4>Write Queue Status:</h4>
          <p><strong>Queue Size:</strong> {queueStatus.queueSize}</p>
          <p><strong>Processing:</strong> {queueStatus.isProcessing ? 'Yes' : 'No'}</p>
          {queueStatus.pendingWrites && queueStatus.pendingWrites.length > 0 && (
            <div>
              <p><strong>Pending Writes:</strong></p>
              <ul>
                {queueStatus.pendingWrites.slice(0, 5).map((w, idx) => (
                  <li key={idx}>{w.key}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="explanation">
        <h4>How Asynchronous Write-Through Works:</h4>
        <ul>
          <li><strong>Step 1:</strong> Write to cache (~1ms)</li>
          <li><strong>Step 2:</strong> Queue DB write, return immediately (~5ms total)</li>
          <li><strong>Background:</strong> Worker processes queue every 100ms</li>
          <li><strong>Advantage:</strong> Fast returns to user, consistent cache</li>
          <li><strong>Risk:</strong> If app crashes, queued writes are lost</li>
          <li><strong>Race condition:</strong> DB may lag behind cache</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 3: Comparison
  // ============================================
  const renderComparisonTab = () => (
    <div className="tab-content">
      <h3>Sync vs Async Write-Through</h3>

      <div className="form-group">
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          placeholder="Key"
        />
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          placeholder="Value"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/compare/latency`, 'POST', formData);
            setResponse(result);
          }}
          className="btn-primary"
        >
          Run Latency Comparison
        </button>
      </div>

      {response && response.success && (
        <div className="comparison-table">
          <h4>100 Reads Comparison:</h4>
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Total Time</th>
                <th>Avg Latency</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Cache</td>
                <td>{response.cache.totalTime} ms</td>
                <td>{response.cache.avgLatency}</td>
              </tr>
              <tr>
                <td>Database</td>
                <td>{response.database.totalTime} ms</td>
                <td>{response.database.avgLatency}</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Cache Speedup:</strong> {response.speedup}</p>
        </div>
      )}

      <div className="comparison-grid">
        <div className="comparison-box">
          <h4>Synchronous:</h4>
          <ul>
            <li>✓ Consistent data</li>
            <li>✓ No race conditions</li>
            <li>✗ Slow writes (100+ms)</li>
            <li>✗ Users wait for DB</li>
          </ul>
        </div>
        <div className="comparison-box">
          <h4>Asynchronous:</h4>
          <ul>
            <li>✓ Fast returns (5ms)</li>
            <li>✓ Good user experience</li>
            <li>✗ DB lag possible</li>
            <li>✗ Can lose queued writes</li>
          </ul>
        </div>
      </div>
    </div>
  );

  // ============================================
  // TAB 4: Failure Scenarios
  // ============================================
  const renderFailureTab = () => (
    <div className="tab-content">
      <h3>Failure Scenarios</h3>
      <p>Test what happens when cache or database fails during write-through.</p>

      <div className="form-group">
        <input
          type="text"
          name="key"
          value={formData.key}
          onChange={handleInputChange}
          placeholder="Key"
        />
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          placeholder="Value"
        />
      </div>

      <div className="button-group">
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/failure/cache-fail`, 'POST', formData);
            setResponse(result);
          }}
          className="btn-warning"
        >
          Simulate Cache Failure
        </button>
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/failure/db-fail`, 'POST', formData);
            setResponse(result);
          }}
          className="btn-danger"
        >
          Simulate Database Failure
        </button>
      </div>

      {response && (
        <div className={`response ${response.success ? 'warning' : 'error'}`}>
          <h4>Scenario: {response.scenario}</h4>
          <p><strong>Note:</strong> {response.note}</p>
          <p><strong>Consequence:</strong> {response.consequence}</p>
        </div>
      )}

      <div className="explanation">
        <h4>Handling Failures:</h4>
        <ul>
          <li><strong>Cache Fails:</strong> DB is written, but cache is empty = next read is slow</li>
          <li><strong>DB Fails:</strong> Cache must be rolled back to prevent inconsistency</li>
          <li><strong>Both Fail:</strong> User sees error, data not persisted</li>
          <li><strong>Async DB Fails:</strong> Queued write is lost unless persisted to disk</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 5: Metrics & Monitoring
  // ============================================
  const renderMetricsTab = () => (
    <div className="tab-content">
      <h3>Metrics & Monitoring</h3>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h4>Writes</h4>
            <p>Sync: <strong>{metrics.writes.sync}</strong></p>
            <p>Async: <strong>{metrics.writes.async}</strong></p>
            <p>Failed: <strong>{metrics.writes.failed}</strong></p>
          </div>

          <div className="metric-card">
            <h4>Reads</h4>
            <p>Cache Hits: <strong>{metrics.reads.cacheHit}</strong></p>
            <p>Cache Misses: <strong>{metrics.reads.cacheMiss}</strong></p>
            <p>Hit Rate: <strong>{metrics.reads.hitRate}</strong></p>
          </div>

          <div className="metric-card">
            <h4>Latencies</h4>
            <p>Avg Cache: <strong>{metrics.latencies.avgCacheLatency}</strong></p>
            <p>Avg DB: <strong>{metrics.latencies.avgDbLatency}</strong></p>
            <p>Avg Total: <strong>{metrics.latencies.avgTotalWriteLatency}</strong></p>
          </div>
        </div>
      )}

      {writeLog.length > 0 && (
        <div className="write-log">
          <h4>Recent Write Operations:</h4>
          <table>
            <thead>
              <tr>
                <th>Strategy</th>
                <th>Key</th>
                <th>Cache (ms)</th>
                <th>DB (ms)</th>
                <th>Total (ms)</th>
              </tr>
            </thead>
            <tbody>
              {writeLog.slice(-10).map((log, idx) => (
                <tr key={idx}>
                  <td>{log.strategy}</td>
                  <td>{log.key}</td>
                  <td>{log.cacheLatency}</td>
                  <td>{log.dbLatency || 'async'}</td>
                  <td>{log.totalLatency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="button-group">
        <button
          onClick={async () => {
            await fetchAPI(`${API_BASE}/clear`, 'POST');
            setResponse({ success: true, message: 'Data cleared' });
          }}
          className="btn-secondary"
        >
          Clear All Data
        </button>
        <button
          onClick={async () => {
            await fetchAPI(`${API_BASE}/metrics/reset`, 'POST');
            setResponse({ success: true, message: 'Metrics reset' });
          }}
          className="btn-secondary"
        >
          Reset Metrics
        </button>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>Write-Through Caching Patterns</h1>
        <p>Compare synchronous vs asynchronous write-through strategies</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'sync' ? 'active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          Sync Write-Through
        </button>
        <button
          className={`tab-button ${activeTab === 'async' ? 'active' : ''}`}
          onClick={() => setActiveTab('async')}
        >
          Async Write-Through
        </button>
        <button
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Comparison
        </button>
        <button
          className={`tab-button ${activeTab === 'failure' ? 'active' : ''}`}
          onClick={() => setActiveTab('failure')}
        >
          Failures
        </button>
        <button
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      <div className="tab-panel">
        {activeTab === 'sync' && renderSyncTab()}
        {activeTab === 'async' && renderAsyncTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
        {activeTab === 'failure' && renderFailureTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </div>
    </div>
  );
}
