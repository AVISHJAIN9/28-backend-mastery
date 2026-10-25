import React, { useState } from 'react';

const API_BASE = 'http://localhost:4005';

export default function SubdomainApp() {
  const [token, setToken] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [domains, setDomains] = useState([]);
  const [response, setResponse] = useState(null);
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  const login = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setToken(data.token);
      setTenant(data.tenant);
      setResponse({ success: true, message: 'Logged in' });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getCurrentTenant = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tenant`);
      const data = await res.json();
      setTenant(data);
      setResponse({ success: true, message: `Current: ${data.name}` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getAllTenants = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tenants`);
      const data = await res.json();
      setTenants(Object.values(data));
      setResponse({ success: true, message: `Retrieved ${Object.keys(data).length} tenants` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const registerSubdomain = async (tenantId) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    if (!subdomain) return setResponse({ error: 'Subdomain required' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/subdomain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subdomain })
      });
      const data = await res.json();
      setSubdomain('');
      setResponse({ success: true, message: `Registered: ${data.host}`, data });
      getDomains();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const registerCustomDomain = async (tenantId) => {
    if (!token) return setResponse({ error: 'Not logged in' });
    if (!customDomain) return setResponse({ error: 'Domain required' });
    try {
      const res = await fetch(`${API_BASE}/api/tenants/${tenantId}/domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ customDomain })
      });
      const data = await res.json();
      setCustomDomain('');
      setResponse({ success: true, message: `Registered: ${data.customDomain}` });
      getDomains();
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  const getDomains = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/domains`);
      const data = await res.json();
      setDomains(Object.entries(data).map(([host, mapping]) => ({ host, ...mapping })));
      setResponse({ success: true, message: `Retrieved ${Object.keys(data).length} domains` });
    } catch (e) {
      setResponse({ error: e.message });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>05 - Subdomain Routing</h1>
      <button onClick={login}>Login</button>
      <button onClick={getCurrentTenant} style={{ marginLeft: '10px' }}>Current Tenant</button>
      <button onClick={getAllTenants} style={{ marginLeft: '10px' }}>All Tenants</button>
      <button onClick={getDomains} style={{ marginLeft: '10px' }}>All Domains</button>

      {token && <p style={{ color: 'green' }}>✓ Logged in</p>}

      {tenant && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Current Tenant</h3>
          <p><strong>Name:</strong> {tenant.name}</p>
          <p><strong>Subdomain:</strong> {tenant.subdomain}</p>
          <p><strong>Custom Domain:</strong> {tenant.custom_domain || 'None'}</p>
        </div>
      )}

      {tenants.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>All Tenants ({tenants.length})</h3>
          {tenants.map((t) => (
            <div key={t.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{t.name}</strong> - {t.subdomain ? `${t.subdomain}.example.com` : 'No subdomain'} {t.custom_domain ? `(${t.custom_domain})` : ''}
            </div>
          ))}
        </div>
      )}

      {token && tenant && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>Configure Domain for {tenant.name}</h3>
          <div style={{ marginBottom: '15px' }}>
            <h4>Subdomain</h4>
            <input type="text" placeholder="E.g., mycompany" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <button onClick={() => registerSubdomain(tenant.id)}>Register Subdomain</button>
          </div>
          <div>
            <h4>Custom Domain</h4>
            <input type="text" placeholder="E.g., mycompany.com" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} style={{ padding: '5px', marginRight: '10px' }} />
            <button onClick={() => registerCustomDomain(tenant.id)}>Register Domain</button>
          </div>
        </div>
      )}

      {domains.length > 0 && (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ddd' }}>
          <h3>Domain Mappings ({domains.length})</h3>
          {domains.map((d) => (
            <div key={d.host} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <strong>{d.host}</strong> → Tenant: {d.tenant_id} {d.custom_domain ? '(Custom)' : '(Subdomain)'}
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
