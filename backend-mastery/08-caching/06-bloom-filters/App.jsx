import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const API_BASE = 'http://localhost:6406/api';

  const [activeTab, setActiveTab] = useState('bloom-basic');
  const [formData, setFormData] = useState({ email: '', url: '', id: '' });
  const [response, setResponse] = useState(null);
  const [stats, setStats] = useState(null);

  // Fetch API
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

  // Auto-refresh stats
  useEffect(() => {
    const interval = setInterval(async () => {
      const statsData = await fetchAPI(`${API_BASE}/stats`);
      if (statsData && !statsData.error) {
        setStats(statsData);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ============================================
  // TAB 1: Basic Bloom Filter (Emails)
  // ============================================
  const renderBloomBasicTab = () => (
    <div className="tab-content">
      <h3>Basic Bloom Filter (Email Deduplication)</h3>
      <p>Use a Bloom filter to quickly detect duplicate emails without querying database.</p>

      <div className="form-group">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter email address"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/bloom/add-email`, 'POST', {
              email: formData.email
            });
            setResponse(result);
          }}
          className="btn-primary"
        >
          Add Email
        </button>
      </div>

      <div className="form-group">
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Check if email exists"
        />
        <button
          onClick={async () => {
            if (!formData.email) return;
            const result = await fetchAPI(
              `${API_BASE}/bloom/check-email/${encodeURIComponent(formData.email)}`
            );
            setResponse(result);
          }}
          className="btn-secondary"
        >
          Check Email
        </button>
      </div>

      {response && (
        <div className={`response ${response.mightBeInSet ? 'warning' : 'success'}`}>
          <h4>Result:</h4>
          <p><strong>Email:</strong> {response.email}</p>
          <p><strong>Status:</strong> {response.result}</p>
          <p><strong>Note:</strong> {response.note}</p>
          {response.filterSize && (
            <>
              <p><strong>Items in Filter:</strong> {response.itemCount}</p>
              <p><strong>Est. False Positive Rate:</strong> {response.estimatedFPRate}</p>
            </>
          )}
        </div>
      )}

      <div className="explanation">
        <h4>How Email Deduplication Works:</h4>
        <ul>
          <li><strong>Add Email:</strong> Hash email → set bits in filter</li>
          <li><strong>Check Email:</strong> Hash email → check if all bits are 1</li>
          <li><strong>Result:</strong> "definitely new" or "probably duplicate"</li>
          <li><strong>Guarantee:</strong> Never false negative (no missed duplicates)</li>
          <li><strong>Possible:</strong> False positives (maybe 1-5% of checks)</li>
          <li><strong>Benefit:</strong> Avoid slow database queries</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 2: URL Filtering (Bloom Filter)
  // ============================================
  const renderURLFilterTab = () => (
    <div className="tab-content">
      <h3>URL Blacklist (Bloom Filter)</h3>
      <p>Similar to Chrome Safe Browsing - quickly check if URL is blacklisted.</p>

      <div className="form-group">
        <input
          type="url"
          name="url"
          value={formData.url}
          onChange={handleInputChange}
          placeholder="https://example.com"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/bloom/add-url`, 'POST', {
              url: formData.url
            });
            setResponse(result);
          }}
          className="btn-warning"
        >
          Add to Blacklist
        </button>
      </div>

      <div className="form-group">
        <input
          type="url"
          name="url"
          value={formData.url}
          onChange={handleInputChange}
          placeholder="Check if URL is suspicious"
        />
        <button
          onClick={async () => {
            if (!formData.url) return;
            const result = await fetchAPI(
              `${API_BASE}/bloom/check-url/${encodeURIComponent(formData.url)}`
            );
            setResponse(result);
          }}
          className="btn-secondary"
        >
          Check URL
        </button>
      </div>

      {response && (
        <div className={`response ${response.mightBeBlacklisted ? 'danger' : 'success'}`}>
          <h4>Result:</h4>
          <p><strong>URL:</strong> {response.url}</p>
          <p><strong>Status:</strong> {response.result}</p>
          <p><strong>Analysis:</strong> {response.note}</p>
        </div>
      )}

      <div className="explanation">
        <h4>Real-World Browser Safety:</h4>
        <ul>
          <li><strong>Chrome:</strong> Uses Bloom filters locally for URL checking</li>
          <li><strong>Speed:</strong> Takes microseconds instead of network roundtrip</li>
          <li><strong>Offline:</strong> Works without connecting to safety servers</li>
          <li><strong>Accuracy:</strong> Chrome accepts some false positives</li>
          <li><strong>Privacy:</strong> Only exact matches trigger detailed checks</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 3: Counting Bloom Filter
  // ============================================
  const renderCountingTab = () => (
    <div className="tab-content">
      <h3>Counting Bloom Filter (Frequency Tracking)</h3>
      <p>Track frequency of items and support deletion (unlike standard Bloom).</p>

      <div className="form-group">
        <input
          type="text"
          name="id"
          value={formData.id}
          onChange={handleInputChange}
          placeholder="Item ID (e.g., user:123)"
        />
        <button
          onClick={async () => {
            const result = await fetchAPI(`${API_BASE}/counting/add-id`, 'POST', {
              id: formData.id
            });
            setResponse(result);
          }}
          className="btn-primary"
        >
          Increment Frequency
        </button>
      </div>

      <div className="form-group">
        <input
          type="text"
          name="id"
          value={formData.id}
          onChange={handleInputChange}
          placeholder="Check frequency of item"
        />
        <button
          onClick={async () => {
            if (!formData.id) return;
            const result = await fetchAPI(
              `${API_BASE}/counting/frequency/${encodeURIComponent(formData.id)}`
            );
            setResponse(result);
          }}
          className="btn-secondary"
        >
          Get Frequency
        </button>
      </div>

      <button
        onClick={async () => {
          const result = await fetchAPI(`${API_BASE}/counting/remove-id`, 'POST', {
            id: formData.id
          });
          setResponse(result);
        }}
        className="btn-secondary"
      >
        Decrement Frequency
      </button>

      {response && (
        <div className="response success">
          <h4>Result:</h4>
          <p><strong>ID:</strong> {response.id}</p>
          <p><strong>Frequency:</strong> {response.frequency}</p>
          {response.isFrequent && <p><strong>⚠️ High frequency access detected</strong></p>}
        </div>
      )}

      <div className="explanation">
        <h4>Counting Bloom Filter Differences:</h4>
        <ul>
          <li><strong>Standard Bloom:</strong> Bits (0 or 1) - no deletion</li>
          <li><strong>Counting Bloom:</strong> Counters (0-255) - supports deletion</li>
          <li><strong>Deletion:</strong> Decrement counter, can fully remove items</li>
          <li><strong>Frequency:</strong> Track how many times item accessed</li>
          <li><strong>Memory:</strong> More storage (4-8 bits per counter vs 1 bit)</li>
          <li><strong>Use Case:</strong> Cache frequency, rate limiting, analytics</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 4: Comparison & Space Efficiency
  // ============================================
  const renderComparisonTab = () => (
    <div className="tab-content">
      <h3>Space Efficiency Comparison</h3>
      <p>Compare Bloom filter vs Hash Set memory usage.</p>

      <button
        onClick={async () => {
          const result = await fetchAPI(`${API_BASE}/compare/space`, 'POST', {
            testSet: Array(1000).fill(0).map((_, i) => `item-${i}`)
          });
          setResponse(result);
        }}
        className="btn-primary"
      >
        Compare 1,000 Items
      </button>

      {response && (
        <div className="comparison-table">
          <h4>Memory Usage Comparison:</h4>
          <table>
            <thead>
              <tr>
                <th>Data Structure</th>
                <th>Memory</th>
                <th>Advantage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Hash Set (50 bytes/item)</td>
                <td>{response.hashSetMemory}</td>
                <td>Exact membership</td>
              </tr>
              <tr>
                <td>Bloom Filter</td>
                <td>{response.bloomFilterMemory}</td>
                <td>Probabilistic, compact</td>
              </tr>
            </tbody>
          </table>
          <p><strong>Compression Ratio:</strong> {response.compressionRatio} smaller!</p>
          <p><strong>Trade-off:</strong> Bloom filter is {response.compressionRatio} smaller but has false positives</p>
        </div>
      )}

      <div className="explanation">
        <h4>When to Use Each:</h4>
        <ul>
          <li><strong>Bloom Filter:</strong> Space-critical, false positives acceptable (emails, URLs)</li>
          <li><strong>Hash Set:</strong> Need exact matching, memory not critical (directories, caches)</li>
          <li><strong>Database:</strong> Persistent storage, complex queries, ACID guarantees</li>
        </ul>
      </div>
    </div>
  );

  // ============================================
  // TAB 5: Metrics & Monitoring
  // ============================================
  const renderMetricsTab = () => (
    <div className="tab-content">
      <h3>Bloom Filter Statistics</h3>
      <p>Real-time monitoring of filter performance and false positive rates.</p>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>Email Filter</h4>
            <p>Items: <strong>{stats.bloomFilters.emails.itemCount}</strong></p>
            <p>Memory: <strong>{stats.bloomFilters.emails.memory}</strong></p>
            <p>Est. FP Rate: <strong>{stats.bloomFilters.emails.estimatedFPRate}</strong></p>
          </div>

          <div className="stat-card">
            <h4>URL Filter</h4>
            <p>Items: <strong>{stats.bloomFilters.urls.itemCount}</strong></p>
            <p>Memory: <strong>{stats.bloomFilters.urls.memory}</strong></p>
            <p>Est. FP Rate: <strong>{stats.bloomFilters.urls.estimatedFPRate}</strong></p>
          </div>

          <div className="stat-card">
            <h4>Operations</h4>
            <p>Bloom Checks: <strong>{stats.metrics.bloomChecks}</strong></p>
            <p>Counting Ops: <strong>{stats.metrics.countingOperations}</strong></p>
            <p>False +ve: <strong>{stats.metrics.bloomFalsePositives}</strong></p>
          </div>
        </div>
      )}

      <div className="explanation">
        <h4>Understanding False Positives:</h4>
        <ul>
          <li><strong>Estimated FP Rate:</strong> Theoretical based on fill ratio</li>
          <li><strong>Measured FP Rate:</strong> Actual observed in production</li>
          <li><strong>Good Sign:</strong> Measured ≈ Estimated (filter parameters optimal)</li>
          <li><strong>Bad Sign:</strong> Measured {'>'}{'>'} Estimated (need larger filter)</li>
          <li><strong>Monitor:</strong> Track FP rate over time as data grows</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>Bloom Filters & Probabilistic Data Structures</h1>
        <p>Space-efficient membership testing with tunable false positive rates</p>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'bloom-basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('bloom-basic')}
        >
          Email Deduplication
        </button>
        <button
          className={`tab-button ${activeTab === 'url-filter' ? 'active' : ''}`}
          onClick={() => setActiveTab('url-filter')}
        >
          URL Safety Filter
        </button>
        <button
          className={`tab-button ${activeTab === 'counting' ? 'active' : ''}`}
          onClick={() => setActiveTab('counting')}
        >
          Counting Filter
        </button>
        <button
          className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Space Efficiency
        </button>
        <button
          className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </div>

      <div className="tab-panel">
        {activeTab === 'bloom-basic' && renderBloomBasicTab()}
        {activeTab === 'url-filter' && renderURLFilterTab()}
        {activeTab === 'counting' && renderCountingTab()}
        {activeTab === 'comparison' && renderComparisonTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </div>
    </div>
  );
}
