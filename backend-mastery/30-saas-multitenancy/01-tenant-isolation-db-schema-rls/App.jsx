import React, { useState } from 'react';

const API_BASE = 'http://localhost:4001';

export default function TenantIsolationApp() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [response, setResponse] = useState(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [testUserId, setTestUserId] = useState('user-1');

  // Login with a test user
  const login = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();

      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setResponse({ success: true, message: `Logged in as ${data.user.name}` });
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  // Get all documents (RLS filters by tenant)
  const fetchDocuments = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });

    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setDocuments(data);
        setResponse({
          success: true,
          message: `Retrieved ${data.length} documents for ${user.name}`,
          data
        });
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  // Create document
  const createDocument = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });
    if (!newDocTitle.trim()) return setResponse({ error: 'Title required' });

    try {
      const res = await fetch(`${API_BASE}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newDocTitle, content: newDocContent })
      });
      const data = await res.json();

      if (res.ok) {
        setNewDocTitle('');
        setNewDocContent('');
        setResponse({ success: true, message: 'Document created', data });
        fetchDocuments();
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  // Get tenant users
  const fetchTenantUsers = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });

    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setTenantUsers(data);
        setResponse({
          success: true,
          message: `Retrieved ${data.length} users in tenant`,
          data
        });
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  // Test RLS
  const testRLS = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });

    try {
      const res = await fetch(`${API_BASE}/api/test/rls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setResponse({
          success: data.rls_working,
          message: data.rls_working ? '✅ RLS is working!' : '❌ RLS may be broken!',
          data
        });
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  // Get tenant info
  const getTenantInfo = async () => {
    if (!token) return setResponse({ error: 'Not logged in' });

    try {
      const res = await fetch(`${API_BASE}/api/tenant/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok) {
        setResponse({ success: true, message: 'Tenant info', data });
      } else {
        setResponse({ error: data.error });
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🔒 Tenant Isolation & RLS Demo</h1>

      {/* Login Section */}
      <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>🔐 Authentication</h2>
        <div style={{ marginBottom: '10px' }}>
          <label>Select User:</label>
          <select
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="user-1">Alice (Acme Corp - Admin)</option>
            <option value="user-2">Bob (Acme Corp - Member)</option>
            <option value="user-3">Charlie (Beta Inc - Admin)</option>
          </select>
        </div>
        <button onClick={() => login(testUserId)} style={{ padding: '8px 15px' }}>
          Login
        </button>
        {user && (
          <p>
            ✅ Logged in as <strong>{user.name}</strong> (Tenant: {user.tenant_id})
          </p>
        )}
      </section>

      {/* Tenant Operations */}
      <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>📋 Tenant Operations</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
          <button onClick={getTenantInfo} style={{ padding: '8px' }}>
            📊 Get Tenant Info
          </button>
          <button onClick={fetchTenantUsers} style={{ padding: '8px' }}>
            👥 Get Tenant Users
          </button>
          <button onClick={testRLS} style={{ padding: '8px' }}>
            🔒 Test RLS
          </button>
        </div>

        {tenantUsers.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4>Users in Tenant:</h4>
            <ul>
              {tenantUsers.map((u) => (
                <li key={u.id}>
                  {u.name} ({u.email}) - {u.role}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Document Operations */}
      <section style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>📄 Documents</h2>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Document title"
            value={newDocTitle}
            onChange={(e) => setNewDocTitle(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <textarea
            placeholder="Document content"
            value={newDocContent}
            onChange={(e) => setNewDocContent(e.target.value)}
            style={{ padding: '8px', marginRight: '10px', width: '300px', height: '60px' }}
          />
          <button onClick={createDocument} style={{ padding: '8px 15px', verticalAlign: 'top' }}>
            ➕ Create Document
          </button>
        </div>

        <button onClick={fetchDocuments} style={{ padding: '8px 15px', marginBottom: '15px' }}>
          🔄 Fetch Documents
        </button>

        {documents.length > 0 && (
          <div>
            <h4>Your Documents ({documents.length}):</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Owner</th>
                  <th style={{ padding: '8px', textAlign: 'left', border: '1px solid #ddd' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{doc.title}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{doc.owner_name}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Response Display */}
      {response && (
        <section
          style={{
            border: `2px solid ${response.error ? '#d32f2f' : '#388e3c'}`,
            padding: '15px',
            marginTop: '20px',
            borderRadius: '8px',
            backgroundColor: response.error ? '#ffebee' : '#e8f5e9'
          }}
        >
          <h2>Response</h2>
          <pre style={{ overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </section>
      )}

      {/* Security Notes */}
      <section style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h3>🔐 Security Notes</h3>
        <ul>
          <li>
            <strong>Alice & Bob</strong> are in <strong>Acme Corp</strong> (tenant-1). They can only see Acme documents.
          </li>
          <li>
            <strong>Charlie</strong> is in <strong>Beta Inc</strong> (tenant-2). He cannot see Acme documents.
          </li>
          <li>
            <strong>RLS Test</strong> verifies all returned documents belong to the current tenant.
          </li>
          <li>
            Even if you try to query directly, the database enforces tenant boundaries via RLS policies.
          </li>
        </ul>
      </section>
    </div>
  );
}

