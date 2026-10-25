import React, { useState } from 'react';

export default function App() {
  const [response, setResponse] = useState(null);
  const [recordId, setRecordId] = useState('');
  const [targetVersion, setTargetVersion] = useState(3);
  const [newRecord, setNewRecord] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:4008/api';

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

  const handleCreateRecord = () => {
    if (!newRecord.name || !newRecord.email) {
      return alert('Fill required fields');
    }

    const record = {
      name: newRecord.name,
      email: newRecord.email,
      ...(newRecord.phone && { phone: newRecord.phone }),
      ...(newRecord.avatar && { avatar: newRecord.avatar })
    };

    callAPI('POST', '/records', record);
    setNewRecord({ name: '', email: '', phone: '', avatar: '' });
  };

  const handleGetRecord = () => {
    if (!recordId) return alert('Enter record ID');
    callAPI('GET', `/records/${recordId}?targetVersion=${targetVersion}`);
  };

  const handleUpdateRecord = () => {
    if (!recordId || (!newRecord.name && !newRecord.email)) {
      return alert('Enter record ID and at least one field to update');
    }

    const updates = {};
    if (newRecord.name) updates.name = newRecord.name;
    if (newRecord.email) updates.email = newRecord.email;
    if (newRecord.phone) updates.phone = newRecord.phone;
    if (newRecord.avatar) updates.avatar = newRecord.avatar;

    callAPI('PATCH', `/records/${recordId}`, updates);
    setNewRecord({ name: '', email: '', phone: '', avatar: '' });
  };

  const handleGetSchema = () => {
    callAPI('GET', '/schema');
  };

  const handleMigrateSchema = () => {
    if (!window.confirm( `Migrate all records to v${targetVersion}?`)) return;
    callAPI('POST', '/schema/migrate', { targetVersion: parseInt(targetVersion) });
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
      <h1>📄 Schema Versioning with Backward Compatibility</h1>
      <p>Learn how to evolve database schemas without breaking existing code</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Left Panel: Commands */}
        <div>
          <h2>Commands</h2>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>➕ Create Record</h3>

            <input
              type="text"
              placeholder="Name"
              value={newRecord.name}
              onChange={(e) => setNewRecord({ ...newRecord, name: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <input
              type="email"
              placeholder="Email"
              value={newRecord.email}
              onChange={(e) => setNewRecord({ ...newRecord, email: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <input
              type="tel"
              placeholder="Phone (optional)"
              value={newRecord.phone}
              onChange={(e) => setNewRecord({ ...newRecord, phone: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <input
              type="url"
              placeholder="Avatar URL (optional)"
              value={newRecord.avatar}
              onChange={(e) => setNewRecord({ ...newRecord, avatar: e.target.value })}
              style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
            />

            <button onClick={handleCreateRecord} style={successButtonStyle}>
              💾 Create Record
            </button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>🔍 Get/Update Record</h3>

            <div>
              <label>Record ID:</label>
              <input
                type="number"
                value={recordId}
                onChange={(e) => setRecordId(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              />
            </div>

            <div>
              <label>Target Schema Version:</label>
              <select
                value={targetVersion}
                onChange={(e) => setTargetVersion(e.target.value)}
                style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
              >
                <option value="1">v1 (id, name, email)</option>
                <option value="2">v2 (+ phone)</option>
                <option value="3">v3 (+ avatar)</option>
              </select>
            </div>

            <button onClick={handleGetRecord} style={buttonStyle}>
              🔍 Get Record
            </button>

            <button onClick={handleUpdateRecord} style={buttonStyle}>
              ✍️ Update Record
            </button>
          </div>

          <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
            <h3>📊 Schema Management</h3>

            <button onClick={handleGetSchema} style={buttonStyle}>
              📚 Get Schema Info
            </button>

            <button onClick={handleMigrateSchema} style={warningButtonStyle}>
              🔄 Migrate All Records to v{targetVersion}
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
              <strong>Schema Versioning:</strong> Add new fields without breaking old code.
              Records can be retrieved in any schema version.
            </p>
            <p>
              <strong>Backward Compatibility:</strong> Dual-write updates support both old and new fields.
              Automatic migration on retrieval or batch migration.
            </p>
            <p>
              <strong>Migration Strategies:</strong> v1 (basic), v2 (add phone), v3 (add avatar)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
