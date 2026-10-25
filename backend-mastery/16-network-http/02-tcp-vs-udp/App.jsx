import React, { useState } from 'react';

export default function App() {
  const [selectedProtocol, setSelectedProtocol] = useState('TCP');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [packetLoss, setPacketLoss] = useState(5);

  const API_BASE = 'http://localhost:5802/api';

  const fetchData = async (endpoint) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const simulatePacketLoss = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/simulate-loss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packetLossPercentage: packetLoss, delayMs: 10 })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🌐 TCP vs UDP Comparison</h1>
        <p>Understanding Connection Models and Transport Protocols</p>
      </header>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>Protocol Selection</h2>
          <div style={styles.buttonGroup}>
            <button 
              style={{...styles.button, backgroundColor: selectedProtocol === 'TCP' ? '#28a745' : '#6c757d'}}
              onClick={() => { setSelectedProtocol('TCP'); fetchData('/tcp-info'); }}
            >
              📤 TCP (Reliable)
            </button>
            <button 
              style={{...styles.button, backgroundColor: selectedProtocol === 'UDP' ? '#28a745' : '#6c757d'}}
              onClick={() => { setSelectedProtocol('UDP'); fetchData('/udp-info'); }}
            >
              ⚡ UDP (Fast)
            </button>
            <button 
              style={{...styles.button, backgroundColor: '#007bff'}}
              onClick={() => fetchData('/compare')}
            >
              🔄 Compare Both
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <h2>Network Simulation</h2>
          <div style={styles.sliderGroup}>
            <label>Packet Loss: {packetLoss}%</label>
            <input 
              type="range" 
              min="0" 
              max="50" 
              value={packetLoss}
              onChange={(e) => setPacketLoss(Number(e.target.value))}
              style={styles.slider}
            />
            <button 
              style={{...styles.button, backgroundColor: '#dc3545'}}
              onClick={simulatePacketLoss}
            >
              📊 Run Simulation
            </button>
          </div>
        </section>

        <section style={styles.section}>
          <button 
            style={{...styles.button, backgroundColor: '#20c997'}}
            onClick={() => fetchData('/metrics')}
          >
            📈 View Metrics
          </button>
        </section>

        {loading && <div style={styles.loading}>Loading...</div>}
        {error && <div style={styles.error}>❌ Error: {error}</div>}
        {response && (
          <section style={styles.response}>
            <h3>📊 Response Data</h3>
            <pre style={styles.json}>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '1000px',
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
    gap: '20px'
  },
  section: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '10px',
    marginTop: '15px'
  },
  sliderGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  slider: {
    width: '100%',
    height: '8px'
  },
  button: {
    padding: '12px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  response: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
    border: '1px solid #f5c6cb'
  }
};

