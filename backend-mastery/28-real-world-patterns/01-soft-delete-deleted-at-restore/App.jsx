import React, { useState } from 'react';

export default function App() {
  const [endpoint, setEndpoint] = useState('/secure/users');
  const [methodType, setMethodType] = useState('GET');
  const [response, setResponse] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' });
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:4001/api';

  const callAPI = async (method, url, body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_URL}${url}`, options);
      const data = await res.json();
      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setResponse({
        error: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  const handleListActiveUsers = () => {
    callAPI('GET', '/secure/users');
  };

  const handleGetUser = () => {
    if (!userId) return alert('Enter user ID');
    callAPI('GET', `/secure/users/${userId}`);
  };

  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email) return alert('Fill all fields');
    callAPI('POST', '/secure/users', newUser);
    setNewUser({ name: '', email: '', role: 'user' });
  };

  const handleSoftDeleteUser = () => {
    if (!userId) return alert('Enter user ID');
    callAPI('DELETE', `/secure/users/${userId}`);
  };

  const handleRestoreUser = () => {
    if (!userId) return alert('Enter user ID');
    callAPI('POST', `/secure/users/${userId}/restore`);
  };

  const handleGetAuditTrail = () => {
    if (!userId) return alert('Enter user ID');
    callAPI('GET', `/secure/users/${userId}/audit-trail`);
  };

  const handleListDeletedUsers = () => {
    callAPI('GET', '/admin/deleted-users');
  };

  const handleListAllUsers = () => {
    callAPI('GET', '/vulnerable/users');
  };

  const handleHardDelete = () => {
    if (!userId) return alert('Enter user ID');
    if (!window.confirm('This will PERMANENTLY delete the user. Continue?')) return;
    callAPI('DELETE', `/vulnerable/users/${userId}/hard-delete`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🗑️ Soft Delete Pattern Demo</h1>
      <p>Learn how to safely delete data using soft delete with timestamps</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel: Commands */}
        <div>
          <h2>Commands</h2>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>✅ SECURE: Soft Delete Pattern</h3>
            
            <button onClick={handleListActiveUsers} style={buttonStyle}>List Active Users</button>
            
            <div style={{ margin: '10px 0' }}>
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleGetUser} style={buttonStyle}>Get User</button>
            </div>

            <div style={{ margin: '10px 0' }}>
              <input
                type="text"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                style={inputStyle}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                style={inputStyle}
              />
              <button onClick={handleCreateUser} style={buttonStyle}>Create User</button>
            </div>

            <div style={{ margin: '10px 0' }}>
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleSoftDeleteUser} style={{...buttonStyle, background: '#ff9800'}}>Soft Delete</button>
            </div>

            <div style={{ margin: '10px 0' }}>
              <input
                type="number"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={inputStyle}
              />
              <button onClick={handleRestoreUser} style={{...buttonStyle, background: '#4caf50'}}>Restore User</button>
            </div>

            <button onClick={handleGetAuditTrail} style={buttonStyle}>Get Audit Trail</button>
          </div>

          <div style={{ border: '1px solid #f44336', padding: '15px', borderRadius: '5px' }}>
            <h3>❌ VULNERABLE: Old Approach</h3>
            
            <button onClick={handleListAllUsers} style={{...buttonStyle, background: '#f44336'}}>
              List ALL Users (with deleted)
            </button>

            <button onClick={handleHardDelete} style={{...buttonStyle, background: '#d32f2f'}}>
              Hard Delete (Permanent)
            </button>

            <button onClick={handleListDeletedUsers} style={buttonStyle}>
              List Deleted Users Only
            </button>
          </div>
        </div>

        {/* Right Panel: Response */}
        <div>
          <h2>Response</h2>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            border: '1px solid #ddd',
            minHeight: '400px',
            maxHeight: '600px',
            overflow: 'auto'
          }}>
            {loading ? (
              <p>Loading...</p>
            ) : response ? (
              <div>
                <p style={{color: '#666'}}>
                  <strong>Time:</strong> {response.timestamp}
                </p>
                {response.status && (
                  <p style={{color: response.status === 200 || response.status === 201 ? '#4caf50' : '#f44336'}}>
                    <strong>Status:</strong> {response.status}
                  </p>
                )}
                {response.error && (
                  <p style={{color: '#f44336'}}>
                    <strong>Error:</strong> {response.error}
                  </p>
                )}
                <pre style={{
                  background: '#fff',
                  padding: '10px',
                  borderRadius: '3px',
                  overflow: 'auto',
                  fontSize: '12px'
                }}>
                  {JSON.stringify(response.data || response, null, 2)}
                </pre>
              </div>
            ) : (
              <p style={{color: '#999'}}>Click a button to see response...</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#e3f2fd', padding: '15px', borderRadius: '5px' }}>
        <h3>📚 Key Concepts</h3>
        <ul>
          <li><strong>Soft Delete:</strong> Set deleted_at timestamp instead of removing data</li>
          <li><strong>Data Recovery:</strong> Restore users by clearing deleted_at</li>
          <li><strong>Audit Trail:</strong> Track creation, updates, and deletions</li>
          <li><strong>Compliance:</strong> GDPR requires data retention for certain periods</li>
          <li><strong>Query Filtering:</strong> Always exclude deleted records from queries</li>
          <li><strong>Hard Delete:</strong> Permanently remove data (usually not recommended)</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle = {
  background: '#2196f3',
  color: 'white',
  padding: '10px 15px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '5px',
  marginTop: '5px',
  fontSize: '14px'
};

const inputStyle = {
  padding: '8px',
  marginRight: '5px',
  marginTop: '5px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '14px'
};

