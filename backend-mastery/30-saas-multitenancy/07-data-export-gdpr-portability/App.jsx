import React, { useState } from 'react';

const API_BASE = 'http://localhost:4007';

export default function ExportApp() {
  const [token, setToken] = useState(null);
  const [tenantId, setTenantId] = useState('tenant-1');
  const [exports, setExports] = useState([]);
  const [deletions, setDeletions] = useState([]);
  const [response, setResponse] = useState(null);

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

  const createExport = async (type) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: 'user-1',
          requestType: type,
          format: 'JSON'
        })
      });
      const data = await res.json();
      setResponse({ success: true, message: `Export requested: ${type}`, data });
      getExports();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getExports = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/exports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setExports(data);
      setResponse({ success: true, message: `Retrieved ${data.length} exports` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const requestDeletion = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/deletion-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: 'user-1' })
      });
      const data = await res.json();
      setResponse({ success: true, message: 'Deletion requested (30-day grace period)', data });
      getDeletions();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getDeletions = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/deletions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDeletions(data);
      setResponse({ success: true, message: `Retrieved ${data.length} deletion requests` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>07 - Data Export & GDPR</h1>
      <button onClick={login}>Login</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Tenant: {tenantId}</h3>
          <button onClick={getExports}>Get Exports</button>
          <button onClick={getDeletions} style={{ marginLeft: '10px' }}>Get Deletions</button>

          <div style={{ marginTop: '15px' }}>
            <h4>Export Data</h4>
            <button onClick={() => createExport('FULL_DATA_EXPORT')}>Full Data Export</button>
            <button onClick={() => createExport('PERSONAL_DATA_EXPORT')} style={{ marginLeft: '10px' }}>Personal Data</button>
            <button onClick={() => createExport('DOCUMENT_EXPORT')} style={{ marginLeft: '10px' }}>Documents Only</button>
          </div>

          <div style={{ marginTop: '15px', padding: '10px', border: '1px solid #f00', borderRadius: '4px' }}>
            <h4>⚠️ Danger Zone: Account Deletion</h4>
            <p>Request account deletion with 30-day grace period to cancel</p>
            <button onClick={requestDeletion} style={{ backgroundColor: '#f00', color: 'white', padding: '10px', borderRadius: '4px' }}>Request Delete Account</button>
          </div>
        </div>
      )}

      {exports.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Exports ({exports.length})</h3>
          {exports.map((e) => (
            <div key={e.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{e.request_type}</strong> - Status: <span style={{ color: e.status === 'completed' ? 'green' : 'orange' }}>{e.status}</span>
              {e.download_url && <> | <a href={e.download_url} target="_blank" rel="noreferrer">Download</a></>}
              <br />
              Created: {new Date(e.created_at).toLocaleDateString()}
            </div>
          ))}
        </div>
      )}

      {deletions.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '2px solid #f00' }}>
          <h3>⚠️ Deletion Requests ({deletions.length})</h3>
          {deletions.map((d) => (
            <div key={d.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>Status: {d.status}</strong> - Scheduled: {new Date(d.scheduled_deletion_at).toLocaleDateString()}
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
