import React, { useState } from 'react';

export default function JWTKeyRotationApp() {
  const [activeTab, setActiveTab] = useState('verify');
  const [token, setToken] = useState('');
  const [verified, setVerified] = useState(null);
  const [keys, setKeys] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPublicKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/keys/public');
      const data = await res.json();
      setKeys(data.keys);
      setSuccess('Public keys fetched');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (res.ok) {
        setVerified(data);
        setSuccess('Token is valid');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const rotateKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/keys/rotate', {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Keys rotated successfully');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/keys/history');
      const data = await res.json();
      setHistory(data.history);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🔑 JWT Key Rotation</h1>
        <p>Automatic signing key management and rotation</p>
      </header>

      {error && <div style={styles.alert_error}>{error}</div>}
      {success && <div style={styles.alert_success}>{success}</div>}

      <div style={styles.tabs}>
        {['verify', 'keys', 'history', 'rotate'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tab_active : {}) }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.content}>
        {activeTab === 'verify' && (
          <>
            <h2>Verify Token</h2>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste JWT token here..."
              style={styles.input}
            />
            <button onClick={verifyToken} disabled={loading}>{loading ? 'Verifying...' : 'Verify'}</button>
            {verified && <pre style={styles.pre}>{JSON.stringify(verified, null, 2)}</pre>}
          </>
        )}

        {activeTab === 'keys' && (
          <>
            <h2>Public Keys</h2>
            <button onClick={fetchPublicKeys} disabled={loading}>{loading ? 'Loading...' : 'Fetch Keys'}</button>
            {keys.map(k => (
              <div key={k.kid} style={styles.card}>
                <strong>{k.kid.substring(0, 16)}...</strong>
                <p>Status: {k.status} | Algorithm: {k.alg}</p>
              </div>
            ))}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <h2>Rotation History</h2>
            <button onClick={fetchHistory} disabled={loading}>{loading ? 'Loading...' : 'Fetch History'}</button>
            {history.map((h, i) => (
              <div key={i} style={styles.card}>
                <strong>{h.kid.substring(0, 16)}...</strong>
                <p>Status: {h.status}</p>
              </div>
            ))}
          </>
        )}

        {activeTab === 'rotate' && (
          <>
            <h2>Rotate Keys</h2>
            <p>This will create a new active key and deprecate the current one.</p>
            <button onClick={rotateKeys} disabled={loading} style={styles.danger}>
              {loading ? 'Rotating...' : 'Rotate Now'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: 900, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' },
  header: { background: '#667eea', color: 'white', padding: 30, borderRadius: 8, marginBottom: 30, textAlign: 'center' },
  alert_error: { background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20, borderLeft: '4px solid #c33' },
  alert_success: { background: '#efe', color: '#3c3', padding: 15, borderRadius: 4, marginBottom: 20, borderLeft: '4px solid #3c3' },
  tabs: { display: 'flex', gap: 10, marginBottom: 20, borderBottom: '2px solid #eee' },
  tab: { padding: '12px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '3px solid transparent' },
  tab_active: { borderBottomColor: '#667eea', color: '#667eea', fontWeight: 'bold' },
  content: { background: 'white', padding: 30, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  input: { width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ddd', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 },
  button: { padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 },
  danger: { padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  pre: { background: '#f5f5f5', padding: 15, borderRadius: 4, overflow: 'auto', marginTop: 15 },
  card: { background: '#f5f5f5', padding: 15, borderRadius: 4, marginTop: 10, borderLeft: '4px solid #667eea' }
};
