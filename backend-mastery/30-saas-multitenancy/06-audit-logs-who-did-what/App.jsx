import React, { useState } from 'react';

const API_BASE = 'http://localhost:4006';

export default function AuditApp() {
  const [token, setToken] = useState(null);
  const [tenantId, setTenantId] = useState('tenant-1');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [response, setResponse] = useState(null);
  const [action, setAction] = useState('CREATE_DOCUMENT');
  const [resourceId, setResourceId] = useState('doc-1');

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setToken(data.token);
      setResponse({ success: true, message: 'Logged in' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getAuditLogs = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
      setResponse({ success: true, message: `Retrieved ${data.length} logs` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const logAction = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/audit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 'user-1',
          action,
          resourceType: 'document',
          resourceId,
          status: 'success',
          metadata: { title: 'Test Doc' }
        })
      });
      const data = await res.json();
      setResponse({ success: true, message: 'Logged action', data });
      getAuditLogs();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getStats = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/audit-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStats(data);
      setResponse({ success: true, message: 'Loaded stats' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>06 - Audit Logs</h1>
      <button onClick={login}>Login</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Tenant: {tenantId}</h3>
          <button onClick={getAuditLogs}>Get Audit Logs</button>
          <button onClick={getStats} style={{ marginLeft: '10px' }}>Get Stats</button>

          <div style={{ marginTop: '15px' }}>
            <h4>Log Action</h4>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '5px', marginRight: '10px' }}>
              <option>CREATE_DOCUMENT</option>
              <option>UPDATE_DOCUMENT</option>
              <option>DELETE_DOCUMENT</option>
              <option>LOGIN_SUCCESS</option>
              <option>LOGIN_FAILED</option>
            </select>
            <input type="text" placeholder="Resource ID" value={resourceId} onChange={(e) => setResourceId(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <button onClick={logAction}>Log</button>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Audit Logs ({logs.length})</h3>
          {logs.slice(0, 10).map((l) => (
            <div key={l.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{l.action}</strong> on {l.resource_type}:{l.resource_id} by {l.user_id} - <span style={{ color: l.status === 'success' ? 'green' : 'red' }}>{l.status}</span> at {new Date(l.timestamp).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Audit Stats</h3>
          <p><strong>Total:</strong> {stats.total}</p>
          <p><strong>Success:</strong> {stats.success}</p>
          <p><strong>Failure:</strong> {stats.failure}</p>
          <h4>By Action</h4>
          {Object.entries(stats.byAction || {}).filter(([_, v]) => v > 0).map(([action, count]) => (
            <p key={action}>{action}: {count}</p>
          ))}
        </div>
      )}

      {response && (
        <div style={{ marginTop: '20px', padding: '10px', border: `2px solid ${response.success ? 'green' : 'red'}`, backgroundColor: response.success ? '#f0fff0' : '#fff0f0' }}>
          {response.success ? '✓' : '✗'} {response.message || response.error}
        </div>
      )}
    </div>
  );
}
