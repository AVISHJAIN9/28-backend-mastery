import React, { useState } from 'react';

export default function App() {
  const [response, setResponse] = useState(null);
  const [seedVersion, setSeedVersion] = useState(1);
  const [forceReseed, setForceReseed] = useState(false);
  const [newRecord, setNewRecord] = useState({
    idempotencyKey: '',
    name: '',
    email: '',
    price: '',
    stock: '',
    role: 'user'
  });
  const [recordType, setRecordType] = useState('users');
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:4007/api';

  const callAPI = async (method, endpoint, body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_URL}${endpoint}`, options);
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

  const handleSeedData = () => {
    callAPI('POST', '/seed', {
      seedVersion: parseInt(seedVersion),
      force: forceReseed
    });
  };

  const handleGetVersion = () => {
    callAPI('GET', '/version');
  };

  const handleGetRecords = () => {
    callAPI('GET', `/records?type=${recordType}`);
  };

  const handleUpsertRecord = () => {
    if (!newRecord.idempotencyKey || !newRecord.name) {
      return alert('Fill required fields');
    }

    const recordData = {
      idempotencyKey: newRecord.idempotencyKey,
      name: newRecord.name,
      ...(recordType === 'users' && {
        email: newRecord.email || 'user@test.com',
        role: newRecord.role
      }),
      ...(recordType === 'products' && {
        price: parseFloat(newRecord.price) || 0,
        stock: parseInt(newRecord.stock) || 0
      })
    };

    callAPI('POST', '/upsert', {
      records: [recordData],
      type: recordType
    });

    setNewRecord({
      idempotencyKey: '',
      name: '',
      email: '',
      price: '',
      stock: '',
      role: 'user'
    });
  };

  const handleResetSeeds = () => {
    if (!window.confirm('⚠️ This will delete ALL seeded data. Continue?')) return;
    callAPI('POST', '/reset', { confirm: true });
  };

  const buttonStyle = {
    padding: '8px 15px',
    margin: '5px 0',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%'
  };

  const warningButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545'
  };

  const successButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#28a745'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🌱 Idempotent Database Seeding Demo</h1>
      <p>Learn how to seed data safely without creating duplicates</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel: Commands */}
        <div>
          <h2>Commands</h2>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>🚀 Seed Operations</h3>

            <div>
              <label>Seed Version:</label>
              <input
                type="number"
                min="1"
                value={seedVersion}
                onChange={(e) => setSeedVersion(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={forceReseed}
                onChange={(e) => setForceReseed(e.target.checked)}
              />
              <span style={{ marginLeft: '10px' }}>Force Reseed (Override existing)</span>
            </label>

            <button onClick={handleSeedData} style={successButtonStyle}>
              💾 Seed Default Data
            </button>

            <button onClick={handleGetVersion} style={buttonStyle}>
              📊 Get Seed Version & Stats
            </button>

            <button onClick={handleGetRecords} style={buttonStyle}>
              📋 Get All Seeded Records
            </button>

            <button onClick={handleResetSeeds} style={warningButtonStyle}>
              🗑️ Reset All Seeds (DESTRUCTIVE)
            </button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>➕ Upsert Record</h3>

            <div>
              <label>Record Type:</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              >
                <option value="users">Users</option>
                <option value="products">Products</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Idempotency Key (unique)"
              value={newRecord.idempotencyKey}
              onChange={(e) => setNewRecord({ ...newRecord, idempotencyKey: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <input
              type="text"
              placeholder={recordType === 'users' ? 'Name' : 'Product Name'}
              value={newRecord.name}
              onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            {recordType === 'users' && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={newRecord.email}
                  onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <select
                  value={newRecord.role}
                  onChange={(e) => setNewRecord({ ...newRecord, role: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}

            {recordType === 'products' && (
              <>
                <input
                  type="number"
                  placeholder="Price"
                  step="0.01"
                  value={newRecord.price}
                  onChange={(e) => setNewRecord({ ...newRecord, price: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={newRecord.stock}
                  onChange={(e) => setNewRecord({ ...newRecord, stock: e.target.value })}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
              </>
            )}

            <button onClick={handleUpsertRecord} style={successButtonStyle}>
              📝 Upsert Record
            </button>
          </div>
        </div>

        {/* Right Panel: Response */}
        <div>
          <h2>Response</h2>
          <div style={{
            border: '1px solid #ddd',
            padding: '15px',
            borderRadius: '5px',
            backgroundColor: '#f9f9f9',
            maxHeight: '600px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: '12px'
          }}>
            {loading ? (
              <span style={{ color: '#666' }}>Loading...</span>
            ) : response ? (
              JSON.stringify(response, null, 2)
            ) : (
              <span style={{ color: '#999' }}>Response will appear here...</span>
            )}
          </div>

          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', fontSize: '12px' }}>
            <h3>ℹ️ Pattern Explanation</h3>
            <p>
              <strong>Idempotent Seeding:</strong> Uses idempotency keys to prevent duplicate insertions.
              Calling seed multiple times won't create duplicates.
            </p>
            <p>
              <strong>Upsert:</strong> If idempotency key exists, update it; otherwise insert new record.
            </p>
            <p>
              <strong>Seed Versioning:</strong> Track which version of seed data is active and prevent rollbacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
