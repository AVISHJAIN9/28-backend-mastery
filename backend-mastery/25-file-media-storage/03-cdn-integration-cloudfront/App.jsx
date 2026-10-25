import React, { useState } from 'react';

const API_BASE_URL = 'http://localhost:6603/api';

export default function App() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('health');
  const [invalidatePaths, setInvalidatePaths] = useState('/');
  const [cdnPath, setCdnPath] = useState('/images/photo.jpg');

  const handleApiCall = async (endpoint, method = 'GET', body = null) => {
    try {
      setLoading(true);
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
      const data = await res.json();
      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setResponse({
        status: 'ERROR',
        data: { error: error.message },
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🌐 CloudFront CDN Integration</h1>
        <p>Module 03: Caching & Global Distribution</p>
      </header>

      <div style={styles.content}>
        <div style={styles.tabs}>
          {[
            { id: 'health', label: '🏥 Health' },
            { id: 'config', label: '⚙️ Config' },
            { id: 'invalidate', label: '🔄 Invalidate' },
            { id: 'cdn-url', label: '🔗 CDN URL' }
          ].map(tab => (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(activeTab === tab.id ? styles.tabActive : {})
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'health' && (
          <div style={styles.section}>
            <h2>Health Check</h2>
            <button
              style={styles.button}
              onClick={() => handleApiCall('/health')}
              disabled={loading}
            >
              {loading ? 'Checking...' : '🔍 Check Health'}
            </button>
          </div>
        )}

        {activeTab === 'config' && (
          <div style={styles.section}>
            <h2>Distribution Config</h2>
            <button
              style={styles.button}
              onClick={() => handleApiCall('/distribution/config')}
              disabled={loading}
            >
              {loading ? 'Loading...' : '📋 Get Config'}
            </button>
          </div>
        )}

        {activeTab === 'invalidate' && (
          <div style={styles.section}>
            <h2>Invalidate Cache</h2>
            <input
              type="text"
              placeholder="/path/* (comma-separated)"
              value={invalidatePaths}
              onChange={(e) => setInvalidatePaths(e.target.value)}
              style={styles.input}
            />
            <button
              style={{ ...styles.button, backgroundColor: '#f59e0b' }}
              onClick={() => {
                const paths = invalidatePaths.split(',').map(p => p.trim());
                handleApiCall('/invalidate', 'POST', { paths });
              }}
              disabled={loading}
            >
              {loading ? 'Invalidating...' : '🔄 Invalidate'}
            </button>
          </div>
        )}

        {activeTab === 'cdn-url' && (
          <div style={styles.section}>
            <h2>Generate CDN URL</h2>
            <input
              type="text"
              placeholder="/images/photo.jpg"
              value={cdnPath}
              onChange={(e) => setCdnPath(e.target.value)}
              style={styles.input}
            />
            <button
              style={{ ...styles.button, backgroundColor: '#8b5cf6' }}
              onClick={() => handleApiCall('/cdn-url', 'POST', { path: cdnPath })}
              disabled={loading}
            >
              {loading ? 'Generating...' : '🔗 Generate URL'}
            </button>
          </div>
        )}

        {response && (
          <div style={styles.response}>
            <h3>Response</h3>
            <pre style={styles.responseBody}>
              {JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'system-ui' },
  header: { backgroundColor: '#1f2937', color: 'white', padding: '24px', textAlign: 'center' },
  content: { maxWidth: '1200px', margin: '24px auto', padding: '0 16px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '12px 16px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer' },
  tabActive: { backgroundColor: '#3b82f6', color: 'white', borderColor: '#3b82f6' },
  section: { backgroundColor: 'white', borderRadius: '8px', padding: '24px' },
  button: { padding: '12px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  input: { width: '100%', padding: '12px', marginBottom: '12px', border: '1px solid #d1d5db', borderRadius: '6px' },
  response: { marginTop: '24px', backgroundColor: 'white', borderRadius: '8px', padding: '16px' },
  responseBody: { backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', overflow: 'auto', maxHeight: '400px' }
};
