import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:13006/api';

export default function App() {
  const [users, setUsers] = useState([]);
  const [context, setContext] = useState(null);
  const [activeTab, setActiveTab] = useState('augmented');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchContext();
  }, []);

  const fetchContext = async () => {
    try {
      const res = await fetch(`${API_URL}/declare/context`);
      const data = await res.json();
      setContext(data.data);
    } catch (err) {
      console.error('Error fetching context:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/declare/users`);
      const data = await res.json();
      setUsers(data.data);
      setMessage('Users fetched successfully');
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/declare/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'pass' })
      });
      const data = await res.json();
      setMessage('Login successful: Token = Bearer ' + data.data.user.id);
      fetchContext();
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/declare/validate-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John', email: 'john@example.com' })
      });
      const data = await res.json();
      setMessage(data.data.message || 'Validation result: ' + JSON.stringify(data.ok));
    } catch (err) {
      setMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Module 13.6 - Declaration Merging & Express Augmentation</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('augmented')} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Augmented Request/Response
        </button>
        <button onClick={() => setActiveTab('auth')} style={{ marginRight: '10px', padding: '8px 16px' }}>
          Authentication
        </button>
        <button onClick={() => setActiveTab('context')} style={{ padding: '8px 16px' }}>
          Request Context
        </button>
      </div>

      {activeTab === 'augmented' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Augmented Request/Response Properties</h3>
          <p>This demonstrates how declaration merging extends Express types:</p>
          <ul>
            <li><strong>req.user</strong> - Augmented user object from Bearer token</li>
            <li><strong>req.context</strong> - Augmented request context with metadata</li>
            <li><strong>req.validated</strong> - Augmented validation tracking</li>
            <li><strong>res.sendSuccess()</strong> - Augmented response helper</li>
            <li><strong>res.sendError()</strong> - Augmented error helper</li>
            <li><strong>res.sendPaginated()</strong> - Augmented pagination helper</li>
          </ul>
          <button onClick={fetchUsers} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            {loading ? 'Fetching...' : 'Fetch Users'}
          </button>
          {users.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <h4>Users:</h4>
              <ul>
                {users.map(u => (
                  <li key={u.id}>{u.name} ({u.role})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'auth' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Authentication with Augmented Request</h3>
          <p>Declaration merging adds user data to express.Request type</p>
          <button onClick={login} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer', marginRight: '10px' }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button onClick={validateUser} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            {loading ? 'Validating...' : 'Validate User'}
          </button>
          {message && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              {message}
            </div>
          )}
        </div>
      )}

      {activeTab === 'context' && (
        <div style={{ border: '1px solid #ccc', padding: '15px' }}>
          <h3>Request Context</h3>
          <p>Augmented context tracking during request lifecycle</p>
          <button onClick={fetchContext} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            {loading ? 'Loading...' : 'Fetch Context'}
          </button>
          {context && (
            <div style={{ marginTop: '15px', backgroundColor: '#f9f9f9', padding: '10px', borderRadius: '4px' }}>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', fontSize: '12px', color: '#666' }}>
        <p>API: {API_URL}</p>
        <p>Module demonstrates declaration merging extending Express types with custom properties and methods.</p>
      </div>
    </div>
  );
}
