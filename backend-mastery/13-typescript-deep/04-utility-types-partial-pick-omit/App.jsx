import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:13004/api/utility-types';

export default function App() {
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [features, setFeatures] = useState({});
  const [activeTab, setActiveTab] = useState('partial');
  const [loading, setLoading] = useState(false);
  const [partialUpdate, setPartialUpdate] = useState({ name: '' });

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchFeatures();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsers(data.data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${API_URL}/permissions/admin`);
      const data = await res.json();
      setPermissions(data.data || {});
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchFeatures = async () => {
    try {
      const res = await fetch(`${API_URL}/features`);
      const data = await res.json();
      setFeatures(data.data || {});
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const applyPartialUpdate = async (userId) => {
    if (!partialUpdate.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/${userId}/partial`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partialUpdate)
      });
      if (res.ok) {
        setPartialUpdate({ name: '' });
        fetchUsers();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (flag) => {
    try {
      const res = await fetch(`${API_URL}/features/${flag}/toggle`, { method: 'POST' });
      if (res.ok) fetchFeatures();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🎯 Module 13.4: Utility Types</h1>
      
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        {['partial', 'pick', 'omit', 'record', 'readonly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              marginRight: '10px',
              padding: '8px 16px',
              backgroundColor: activeTab === tab ? '#007bff' : '#f0f0f0',
              color: activeTab === tab ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === 'partial' && (
        <div>
          <h2>Partial&lt;T&gt; - Optional Fields</h2>
          <p>Update any subset of fields</p>
          {users.map(user => (
            <div key={user.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
              <h3>{user.name}</h3>
              <p>Email: {user.email}</p>
              <input
                type="text"
                placeholder="New name"
                value={partialUpdate.name}
                onChange={(e) => setPartialUpdate({ name: e.target.value })}
              />
              <button onClick={() => applyPartialUpdate(user.id)} disabled={loading}>
                Update
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pick' && (
        <div>
          <h2>Pick&lt;T, K&gt; - Safe Fields Only</h2>
          <p>Returns only: id, name, role (no password)</p>
          {users.map(user => (
            <div key={user.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'omit' && (
        <div>
          <h2>Omit&lt;T, K&gt; - Exclude Sensitive</h2>
          <p>Returns all fields except password</p>
          {users.map(user => (
            <div key={user.id} style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'record' && (
        <div>
          <h2>Record&lt;K, V&gt; - Mappings</h2>
          <p>Role to Permissions mapping</p>
          <div style={{ marginBottom: '20px' }}>
            <h3>Permissions:</h3>
            {permissions.allowed?.map((p, i) => (
              <span key={i} style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                ✓ {p}
              </span>
            ))}
          </div>
          <div>
            <h3>Feature Flags:</h3>
            {Object.entries(features).map(([flag, enabled]) => (
              <label key={flag} style={{ display: 'block', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleFeature(flag)}
                />
                {' '}{flag} {enabled ? '✓' : '✗'}
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'readonly' && (
        <div>
          <h2>Readonly&lt;T&gt; - Immutable</h2>
          <p>🔒 These fields are frozen and cannot be changed</p>
          <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
            <h3>Admin Permissions (Readonly)</h3>
            <ul>
              <li>✓ read</li>
              <li>✓ write</li>
              <li>✓ delete</li>
              <li>✓ manage_users</li>
            </ul>
            <p><em>Array is frozen - cannot be modified at runtime</em></p>
          </div>
        </div>
      )}
    </div>
  );
}

