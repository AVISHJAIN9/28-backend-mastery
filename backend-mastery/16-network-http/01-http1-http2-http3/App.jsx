import React, { useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const API_BASE = 'http://localhost:5801/api';

  const fetchData = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse({ endpoint, data, timestamp: new Date().toLocaleTimeString() });
    } catch (err) {
      setError(err.message);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceTest = async () => {
    setLoading(true);
    setError(null);
    try {
      // Test with 6 parallel resources to see connection behavior
      const res = await fetch(`${API_BASE}/resources/6`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse({ 
        endpoint: '/resources/6',
        data,
        message: 'Check DevTools Network tab to see parallelization behavior',
        timestamp: new Date().toLocaleTimeString() 
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📡 HTTP Versions (1.0, 1.1, 2, 3)</h1>
        <p>Testing different HTTP protocol versions</p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>📊 Protocol Information</h2>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.button}
              onClick={() => fetchData('/protocol-info')}
              disabled={loading}
            >
              Get Protocol Info
            </button>
            <button 
              style={{...styles.button, backgroundColor: '#007bff'}}
              onClick={() => fetchData('/compare')}
              disabled={loading}
            >
              Compare Versions
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2>⚡ Protocol Features</h2>
          <div style={styles.buttonGroup}>
            <button 
              style={{...styles.button, backgroundColor: '#20c997'}}
              onClick={() => fetchData('/multiplexing')}
              disabled={loading}
            >
              Multiplexing Demo
            </button>
            <button 
              style={{...styles.button, backgroundColor: '#ffc107'}}
              onClick={() => fetchData('/server-push')}
              disabled={loading}
            >
              Server Push Demo
            </button>
            <button 
              style={{...styles.button, backgroundColor: '#dc3545'}}
              onClick={() => fetchData('/performance')}
              disabled={loading}
            >
              Performance Data
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2>🔗 Connection Tests</h2>
          <div style={styles.buttonGroup}>
            <button 
              style={{...styles.button, backgroundColor: '#6f42c1'}}
              onClick={handleResourceTest}
              disabled={loading}
            >
              Test Parallelization (6 Resources)
            </button>
            <p style={styles.hint}>💡 Open DevTools (F12) → Network tab to see the difference</p>
          </div>
        </section>

        {loading && <div style={styles.loading}>Loading...</div>}

        {error && (
          <div style={styles.error}>
            ❌ Error: {error}
          </div>
        )}

        {response && (
          <section style={styles.response}>
            <h3>✅ Response from {response.endpoint}</h3>
            <p style={styles.timestamp}>Time: {response.timestamp}</p>
            {response.message && <p style={styles.hint}>{response.message}</p>}
            <pre style={styles.json}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </section>
        )}
      </main>

      <footer style={styles.footer}>
        <p>Module 01: HTTP Versions and Protocol Evolution</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  main: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px'
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s'
  },
  response: {
    gridColumn: '1 / -1',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px'
  },
  json: {
    backgroundColor: '#f4f4f4',
    padding: '15px',
    borderRadius: '6px',
    overflow: 'auto',
    fontSize: '12px',
    fontFamily: 'Courier New, monospace',
    maxHeight: '400px'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '18px',
    color: '#666'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '20px',
    border: '1px solid #f5c6cb'
  },
  hint: {
    fontSize: '12px',
    color: '#666',
    marginTop: '10px',
    fontStyle: 'italic'
  },
  timestamp: {
    fontSize: '12px',
    color: '#999',
    margin: '10px 0'
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: '12px',
    borderTop: '1px solid #ddd',
    paddingTop: '20px'
  }
};

