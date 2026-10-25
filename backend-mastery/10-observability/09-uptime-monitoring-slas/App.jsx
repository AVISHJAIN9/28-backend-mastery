import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:4009/api';

function App() {
  const [activeTab, setActiveTab] = useState('metrics');
  const [slaStatus, setSlaStatus] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [error, setError] = useState(null);

  // Auto-refresh metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);

    // Load initial data
    fetchAllData();

    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [metricsRes, statusRes, slaRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/metrics`),
        fetch(`${API_BASE}/status`),
        fetch(`${API_BASE}/sla-status`),
        fetch(`${API_BASE}/statistics`)
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
      if (slaRes.ok) setSlaStatus(await slaRes.json());
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStatistics(data);
      }

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    }
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents);
      }
    } catch (err) {
      setError('Failed to fetch incidents');
    }
  };

  const startSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'api_error',
          durationSeconds: 30
        })
      });

      if (res.ok) {
        setSimulationActive(true);
        setTimeout(() => {
          setSimulationActive(false);
        }, 30000);
      }
    } catch (err) {
      setError('Failed to start simulation: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stop-incident`, {
        method: 'POST'
      });

      if (res.ok) {
        setSimulationActive(false);
        fetchAllData();
      }
    } catch (err) {
      setError('Failed to stop simulation');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMetrics = async () => {
    if (!window.confirm('Clear all metrics? This cannot be undone.')) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/clear-metrics`, {
        method: 'POST'
      });

      if (res.ok) {
        fetchAllData();
        setError(null);
      }
    } catch (err) {
      setError('Failed to clear metrics');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'down': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getComplianceColor = (meetsTarget) => {
    return meetsTarget ? '#4caf50' : '#f44336';
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📊 Uptime Monitoring & SLA Dashboard</h1>
        <p>Service Level Agreement & Metrics Tracking</p>
        <div style={styles.lastUpdate}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </header>

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* Status Summary Cards */}
      {status && (
        <div style={styles.cardRow}>
          <div style={{...styles.card, borderLeft: `4px solid ${getStatusColor(status.status)}`}}>
            <div style={styles.cardLabel}>System Status</div>
            <div style={{...styles.cardValue, color: getStatusColor(status.status)}}>
              {status.status.toUpperCase()}
            </div>
            <div style={styles.cardSubtext}>{status.metrics.uptime} uptime</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Error Rate</div>
            <div style={styles.cardValue}>{status.metrics.errorRate}</div>
            <div style={styles.cardSubtext}>Last 24h</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>P95 Latency</div>
            <div style={styles.cardValue}>{status.metrics.latencyP95}</div>
            <div style={styles.cardSubtext}>95th percentile</div>
          </div>

          {slaStatus && (
            <div style={{...styles.card, borderLeft: `4px solid ${getComplianceColor(slaStatus.meetsTarget)}`}}>
              <div style={styles.cardLabel}>SLA Status</div>
              <div style={{...styles.cardValue, color: getComplianceColor(slaStatus.meetsTarget)}}>
                {slaStatus.status}
              </div>
              <div style={styles.cardSubtext}>Target: {slaStatus.sloTarget}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('metrics')}
          style={{
            ...styles.tab,
            ...(!activeTab || activeTab === 'metrics' ? styles.activeTab : {})
          }}
        >
          📈 Metrics
        </button>
        <button
          onClick={() => { setActiveTab('incidents'); fetchIncidents(); }}
          style={{
            ...styles.tab,
            ...(activeTab === 'incidents' ? styles.activeTab : {})
          }}
        >
          🚨 Incidents
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          style={{
            ...styles.tab,
            ...(activeTab === 'sla' ? styles.activeTab : {})
          }}
        >
          📋 SLA
        </button>
        <button
          onClick={() => setActiveTab('test')}
          style={{
            ...styles.tab,
            ...(activeTab === 'test' ? styles.activeTab : {})
          }}
        >
          🧪 Testing
        </button>
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && metrics && (
        <div style={styles.content}>
          <h2>Real-Time Metrics</h2>
          <div style={styles.metricsGrid}>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>Total Requests (24h)</div>
              <div style={styles.metricValue}>{metrics.totals?.requests || 0}</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>Successful Requests</div>
              <div style={styles.metricValue}>{metrics.totals?.successful || 0}</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>Failed Requests</div>
              <div style={styles.metricValue} style={{color: '#f44336'}}>
                {metrics.totals?.failed || 0}
              </div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>Availability</div>
              <div style={styles.metricValue}>{metrics.metrics?.availability.toFixed(2)}%</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>Error Rate</div>
              <div style={styles.metricValue}>{metrics.metrics?.errorRate.toFixed(2)}%</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>P50 Latency</div>
              <div style={styles.metricValue}>{metrics.metrics?.latency?.p50 || 0}ms</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>P95 Latency</div>
              <div style={styles.metricValue}>{metrics.metrics?.latency?.p95 || 0}ms</div>
            </div>
            <div style={styles.metricBox}>
              <div style={styles.metricLabel}>P99 Latency</div>
              <div style={styles.metricValue}>{metrics.metrics?.latency?.p99 || 0}ms</div>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === 'incidents' && (
        <div style={styles.content}>
          <h2>Recent Incidents</h2>
          {incidents.length === 0 ? (
            <p style={{color: '#999'}}>No incidents recorded</p>
          ) : (
            <div>
              {incidents.map((incident) => (
                <div key={incident.id} style={styles.incidentBox}>
                  <div style={styles.incidentHeader}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: incident.severity === 'critical' ? '#f44336' : '#ff9800'
                    }}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span style={styles.incidentType}>{incident.type}</span>
                    <span style={{...styles.badge, backgroundColor: '#2196f3'}}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={styles.incidentBody}>
                    <p><strong>Description:</strong> {incident.description}</p>
                    <p><strong>Start Time:</strong> {new Date(incident.startTime).toLocaleString()}</p>
                    {incident.duration && (
                      <p><strong>Duration:</strong> {(incident.duration / 1000).toFixed(0)} seconds</p>
                    )}
                    {incident.resolution && (
                      <p><strong>Resolution:</strong> {incident.resolution}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SLA Tab */}
      {activeTab === 'sla' && slaStatus && (
        <div style={styles.content}>
          <h2>SLA Compliance Report</h2>
          <div style={styles.slaReport}>
            <div style={styles.slaRow}>
              <span>SLO Target:</span>
              <strong>{slaStatus.sloTarget}</strong>
            </div>
            <div style={styles.slaRow}>
              <span>Actual Uptime:</span>
              <strong style={{color: slaStatus.meetsTarget ? '#4caf50' : '#f44336'}}>
                {slaStatus.actualUptime}
              </strong>
            </div>
            <div style={styles.slaRow}>
              <span>Status:</span>
              <strong style={{color: slaStatus.meetsTarget ? '#4caf50' : '#f44336'}}>
                {slaStatus.status}
              </strong>
            </div>
            <div style={styles.slaRow}>
              <span>Allowed Downtime (Month):</span>
              <strong>{slaStatus.allowedDowntime}</strong>
            </div>
            <div style={styles.slaRow}>
              <span>Actual Downtime:</span>
              <strong>{slaStatus.actualDowntime}</strong>
            </div>
            <div style={styles.slaRow}>
              <span>Remaining Budget:</span>
              <strong style={{color: '#2196f3'}}>{slaStatus.remainingBudget}</strong>
            </div>
          </div>

          {statistics && (
            <div>
              <h3>Historical Uptime</h3>
              <div style={styles.historyGrid}>
                <div style={styles.historyBox}>
                  <div style={styles.historyLabel}>24 Hours</div>
                  <div style={styles.historyValue}>{statistics.uptime['24h']}</div>
                </div>
                <div style={styles.historyBox}>
                  <div style={styles.historyLabel}>7 Days</div>
                  <div style={styles.historyValue}>{statistics.uptime['7d']}</div>
                </div>
                <div style={styles.historyBox}>
                  <div style={styles.historyLabel}>30 Days</div>
                  <div style={styles.historyValue}>{statistics.uptime['30d']}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Testing Tab */}
      {activeTab === 'test' && (
        <div style={styles.content}>
          <h2>Testing & Simulation</h2>
          <div style={styles.testSection}>
            <h3>Incident Simulation</h3>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Simulate a service outage to test your monitoring and alerting
            </p>
            <div style={styles.buttonGroup}>
              <button
                onClick={startSimulation}
                disabled={simulationActive || isLoading}
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  opacity: simulationActive || isLoading ? 0.5 : 1
                }}
              >
                {simulationActive ? '⏳ Simulation Running (30s)' : '▶️ Start Simulation'}
              </button>
              <button
                onClick={stopSimulation}
                disabled={!simulationActive || isLoading}
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary,
                  opacity: !simulationActive || isLoading ? 0.5 : 1
                }}
              >
                ⏹️ Stop Simulation
              </button>
            </div>
          </div>

          <div style={styles.testSection}>
            <h3>Data Management</h3>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Clear all metrics and start fresh
            </p>
            <button
              onClick={clearMetrics}
              disabled={isLoading}
              style={{
                ...styles.button,
                ...styles.buttonDanger,
                opacity: isLoading ? 0.5 : 1
              }}
            >
              🗑️ Clear All Metrics
            </button>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <p>Module: 09-uptime-monitoring-slas | Learn SLAs, SLOs, SLIs & Uptime Monitoring</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  lastUpdate: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#999'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #ef5350'
  },
  cardRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardLabel: {
    fontSize: '12px',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: '10px'
  },
  cardValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  cardSubtext: {
    fontSize: '12px',
    color: '#666'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '1px solid #ddd'
  },
  tab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s'
  },
  activeTab: {
    color: '#2196f3',
    borderBottomColor: '#2196f3'
  },
  content: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px',
    marginTop: '20px'
  },
  metricBox: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    textAlign: 'center'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#999',
    marginBottom: '10px'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2196f3'
  },
  incidentBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    borderLeft: '4px solid #ff9800'
  },
  incidentHeader: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '3px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  incidentType: {
    fontWeight: 'bold',
    flex: 1
  },
  incidentBody: {
    fontSize: '13px',
    color: '#333',
    lineHeight: '1.6'
  },
  slaReport: {
    marginTop: '20px'
  },
  slaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px',
    borderBottom: '1px solid #eee'
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginTop: '20px'
  },
  historyBox: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '4px',
    textAlign: 'center'
  },
  historyLabel: {
    fontSize: '12px',
    color: '#999'
  },
  historyValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#4caf50',
    marginTop: '10px'
  },
  testSection: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '1px solid #eee'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  buttonPrimary: {
    backgroundColor: '#4caf50',
    color: '#fff'
  },
  buttonSecondary: {
    backgroundColor: '#2196f3',
    color: '#fff'
  },
  buttonDanger: {
    backgroundColor: '#f44336',
    color: '#fff'
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#999',
    fontSize: '12px'
  }
};

export default App;

