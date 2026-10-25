import React, { useState } from 'react';

const API_BASE = 'http://localhost:4008';

export default function AdminApp() {
  const [token, setToken] = useState(null);
  const [tenantId, setTenantId] = useState('tenant-1');
  const [userId, setUserId] = useState('user-1');
  const [sessions, setSessions] = useState([]);
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [response, setResponse] = useState(null);

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setToken(data.token);
      setResponse({ success: true, message: `Logged in as ${data.admin.name}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const startImpersonation = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/impersonate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tenantId, userId })
      });
      const data = await res.json();
      setResponse({ success: true, message: `Started imperson for ${userId}`, data });
      getSessions();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getSessions = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSessions(data);
      setResponse({ success: true, message: `Retrieved ${data.length} sessions` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const logEvent = async (type) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tenantId,
          type,
          metadata: { admin_action: true }
        })
      });
      const data = await res.json();
      setResponse({ success: true, message: `Logged ${type}`, data });
      getEvents();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getEvents = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/events/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data);
      setResponse({ success: true, message: `Retrieved ${data.length} events` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const addDebugLog = async (level, message) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tenantId, level, message })
      });
      const data = await res.json();
      setResponse({ success: true, message: 'Log added', data });
      getLogs();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getLogs = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/admin/logs/${tenantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
      setResponse({ success: true, message: `Retrieved ${data.length} logs` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>08 - Admin Panel</h1>
      <button onClick={login}>Login as Admin</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in as Admin</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Admin Actions</h3>
          <div style={{ marginBottom: '15px' }}>
            <h4>Impersonate User</h4>
            <input type="text" placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <input type="text" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <button onClick={startImpersonation}>Start Impersonation</button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4>System Events</h4>
            <button onClick={() => logEvent('TENANT_CREATED')}>Log Tenant Created</button>
            <button onClick={() => logEvent('PAYMENT_FAILED')} style={{ marginLeft: '10px' }}>Log Payment Failed</button>
            <button onClick={getEvents} style={{ marginLeft: '10px' }}>Get Events</button>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4>Debug Logs</h4>
            <button onClick={() => addDebugLog('ERROR', 'Database connection timeout')}>Log Error</button>
            <button onClick={() => addDebugLog('WARNING', 'High API latency')} style={{ marginLeft: '10px' }}>Log Warning</button>
            <button onClick={getLogs} style={{ marginLeft: '10px' }}>Get Logs</button>
          </div>

          <button onClick={getSessions}>Get Sessions</button>
        </div>
      )}

      {sessions.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Impersonation Sessions ({sessions.length})</h3>
          {sessions.map((s) => (
            <div key={s.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              Admin: {s.admin_id} → User: {s.user_id} in Tenant: {s.tenant_id}
              <br />
              Started: {new Date(s.started_at).toLocaleString()} {s.ended_at ? `| Ended: ${new Date(s.ended_at).toLocaleString()}` : '(Active)'}
              <br />
              Actions: {s.action_log?.length || 0}
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>System Events ({events.length})</h3>
          {events.slice(0, 10).map((e) => (
            <div key={e.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{e.type}</strong> - {new Date(e.timestamp).toLocaleString()}
            </div>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Debug Logs ({logs.length})</h3>
          {logs.slice(0, 10).map((l) => (
            <div key={l.id} style={{ padding: '8px', borderBottom: '1px solid #eee', color: l.level === 'ERROR' ? 'red' : 'orange' }}>
              <strong>[{l.level}]</strong> {l.message} - {new Date(l.timestamp).toLocaleString()}
            </div>
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
