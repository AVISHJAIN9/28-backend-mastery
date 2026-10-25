import React, { useState } from 'react';

const API_BASE = 'http://localhost:4004';

export default function MeteringApp() {
  const [token, setToken] = useState(null);
  const [tenantId, setTenantId] = useState('tenant-1');
  const [usage, setUsage] = useState(null);
  const [quota, setQuota] = useState(null);
  const [events, setEvents] = useState([]);
  const [response, setResponse] = useState(null);

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json ' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setToken(data.token);
      setResponse({ success: true, message: 'Logged in' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const recordEvent = async (metric, value) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/meter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ metric, value })
      });
      const data = await res.json();
      setResponse({ success: true, message: `Recorded ${value} ${metric}`, data });
      getUsage();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getUsage = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsage(data);
      setResponse({ success: true, message: 'Loaded usage' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getQuota = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/quota`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setQuota(data);
      setResponse({ success: true, message: 'Loaded quota' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getQuotaUsage = async (metric) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/quota/percentage/${metric}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResponse({ success: true, message: `${metric}: ${data.percentage}% of quota` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>04 - Usage Metering</h1>
      <button onClick={login}>Login</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Tenant: {tenantId}</h3>
          <button onClick={getUsage}>Get Usage</button>
          <button onClick={getQuota} style={{ marginLeft: '10px' }}>GetQuota</button>

          <div style={{ marginTop: '15px' }}>
            <h4>Record Event</h4>
            <button onClick={() => recordEvent('api_calls', 100)}>+100 API Calls</button>
            <button onClick={() => recordEvent('api_calls', 500)} style={{ marginLeft: '10px' }}>+500 API Calls</button>
            <button onClick={() => recordEvent('storage_bytes', 1000000)} style={{ marginLeft: '10px' }}>+1MB Storage</button>
          </div>

          <div style={{ marginTop: '15px' }}>
            <h4>Check Quota %</h4>
            <button onClick={() => getQuotaUsage('api_calls')}>API Calls %</button>
            <button onClick={() => getQuotaUsage('storage_bytes')} style={{ marginLeft: '10px' }}>Storage %</button>
          </div>
        </div>
      )}

      {usage && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Current Usage</h3>
          <p><strong>API Calls:</strong> {usage.api_calls || 0}</p>
          <p><strong>Storage:</strong> {(usage.storage_bytes / (1024*1024)).toFixed(2)} MB</p>
          <p><strong>Data Transfer:</strong> {usage.data_transfer_gb?.toFixed(2) || 0} GB</p>
        </div>
      )}

      {quota && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Quota Limits</h3>
          <p><strong>API Calls:</strong> {quota.api_call_limit?.toLocaleString() || 'Unlimited'}</p>
          <p><strong>Storage:</strong> {(quota.storage_limit_bytes / (1024*1024*1024)).toFixed(2)} GB</p>
          <p><strong>Data Transfer:</strong> {quota.data_transfer_limit_gb} GB</p>
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
