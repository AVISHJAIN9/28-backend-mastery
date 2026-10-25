import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const API_URL = 'http://localhost:6609/api';

  const healthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/health`);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  const scanFile = async () => {
    if (!file) return alert('Select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>09 - Virus Scanning</h1>
        <p>Scan files with ClamAV antivirus engine</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`} onClick={() => setActiveTab('scan')}>Scan</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'scan' && (
          <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={scanFile} disabled={loading}>{loading ? 'Scanning...' : 'Start Scan'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
