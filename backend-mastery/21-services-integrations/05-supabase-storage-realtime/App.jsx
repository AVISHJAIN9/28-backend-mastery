import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6305';

function App() {
  const [token, setToken] = useState('test-token');
  const [activeTab, setActiveTab] = useState('database');
  const [table, setTable] = useState('users');
  const [data, setData] = useState('{}');
  const [fileName, setFileName] = useState('');
  const [channel, setChannel] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, method = 'GET', body = null) => {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      };
      const res = await fetch(`${API_BASE}/api${path}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🗄️ Supabase Storage & Realtime</h1>
      </header>

      <div className="tabs">
        <button className={`tab ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
          🗄️ Database
        </button>
        <button className={`tab ${activeTab === 'storage' ? 'active' : ''}`} onClick={() => setActiveTab('storage')}>
          💾 Storage
        </button>
        <button className={`tab ${activeTab === 'realtime' ? 'active' : ''}`} onClick={() => setActiveTab('realtime')}>
          ⚡ Realtime
        </button>
      </div>

      <div className="container">
        {activeTab === 'database' && (
          <div className="tab-content">
            <h2>Database Operations</h2>
            <input type="text" value={table} onChange={(e) => setTable(e.target.value)} placeholder="Table name" />
            <textarea value={data} onChange={(e) => setData(e.target.value)} placeholder="JSON data" rows="4" />
            <button onClick={() => callAPI('/db/insert', 'POST', { table, data: JSON.parse(data) })}>Create</button>
            <button onClick={() => callAPI(`/db/${table}`, 'GET')}>Read</button>
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="tab-content">
            <h2>File Storage</h2>
            <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="File name" />
            <button onClick={() => callAPI('/storage/upload', 'POST', { bucket: 'uploads', fileName })}>Upload</button>
            <button onClick={() => callAPI('/storage/files', 'GET')}>List Files</button>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="tab-content">
            <h2>Realtime Subscriptions</h2>
            <input type="text" value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Channel name" />
            <button onClick={() => callAPI(`/realtime/${channel}/subscribe`, 'POST')}>Subscribe</button>
            <button onClick={() => callAPI(`/realtime/${channel}/publish`, 'POST', { event: 'message', payload: {} })}>Publish</button>
          </div>
        )}
      </div>

      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;

