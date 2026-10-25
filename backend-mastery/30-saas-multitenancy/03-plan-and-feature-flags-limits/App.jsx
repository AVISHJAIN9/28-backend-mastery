import React, { useState } from 'react';

const API_BASE = 'http://localhost:4003';

export default function PlansApp() {
  const [token, setToken] = useState(null);
  const [tenantId, setTenantId] = useState('tenant-1');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [usage, setUsage] = useState(null);
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

  const getAllPlans = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/plans`);
      const data = await res.json();
      setPlans(Object.values(data));
      setResponse({ success: true, message: `Retrieved ${Object.keys(data).length} plans` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getCurrentPlan = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCurrentPlan(data);
      setResponse({ success: true, message: `Current Plan: ${data.name}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const checkFeature = async (feature) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/features/${feature}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setResponse({ success: data.allowed, message: `Feature ${feature}: ${data.allowed ? 'ALLOWED' : 'DENIED'}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const checkUsage = async (metric) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/usage/${metric}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setUsage(data);
      setResponse({ success: true, message: `Usage: ${data.percentage}%` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const upgradePlan = async (newPlanId) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPlanId })
      });
      const data = await res.json();
      setCurrentPlan(data.tenant ? { id: newPlanId, name: newPlanId } : null);
      setResponse({ success: true, message: `Upgraded to ${newPlanId}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>03 - Plans & Feature Flags</h1>
      <button onClick={login}>Login</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {token && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Tenant: {tenantId}</h3>
          <button onClick={getAllPlans}>Get All Plans</button>
          <button onClick={getCurrentPlan} style={{ marginLeft: '10px' }}>Get Current Plan</button>

          <div style={{ marginTop: '15px' }}>
            <h4>Check Features</h4>
            <button onClick={() => checkFeature('write')}>Check Write Feature</button>
            <button onClick={() => checkFeature('api')} style={{ marginLeft: '10px' }}>Check API Feature</button>
            <button onClick={() => checkFeature('sso')} style={{ marginLeft: '10px' }}>Check SSO Feature</button>
          </div>

          <div style={{ marginTop: '15px' }}>
            <h4>Check Usage</h4>
            <button onClick={() => checkUsage('api_calls')}>API Calls Usage</button>
            <button onClick={() => checkUsage('storage_gb')} style={{ marginLeft: '10px' }}>Storage Usage</button>
          </div>

          <div style={{ marginTop: '15px' }}>
            <h4>Upgrade Plan</h4>
            <button onClick={() => upgradePlan('pro')}>Upgrade to Pro</button>
            <button onClick={() => upgradePlan('enterprise')} style={{ marginLeft: '10px' }}>Upgrade to Enterprise</button>
          </div>
        </div>
      )}

      {currentPlan && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Current Plan</h3>
          <p><strong>Name:</strong> {currentPlan.name}</p>
          <p><strong>Price:</strong> ${currentPlan.price}/month</p>
          <p><strong>Features:</strong> {currentPlan.features?.join(', ') || 'N/A'}</p>
        </div>
      )}

      {plans.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>All Plans</h3>
          {plans.map((p) => (
            <div key={p.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{p.name}</strong> - ${p.price}/month - {p.features?.length || 0} features
            </div>
          ))}
        </div>
      )}

      {usage && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Usage Status</h3>
          <p><strong>Current:</strong> {usage.currentUsage || 'N/A'}</p>
          <p><strong>Limit:</strong> {usage.limit || 'Unlimited'}</p>
          <div style={{ width: '200px', height: '20px', border: '1px solid #333', backgroundColor: '#f0f0f0', position: 'relative' }}>
            <div style={{ width: `${Math.min(usage.percentage, 100)}%`, height: '100%', backgroundColor: usage.percentage > 80 ? 'red' : 'green' }}></div>
            <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: '12px' }}>{usage.percentage}%</span>
          </div>
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
