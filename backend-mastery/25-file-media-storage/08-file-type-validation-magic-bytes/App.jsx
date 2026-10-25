import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const API_URL = 'http://localhost:6608/api';

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

  const validateFile = async () => {
    if (!file) return alert('Select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/validate`, {
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
        <h1>08 - File Type Validation</h1>
        <p>Validate files using magic bytes</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'validate' ? 'active' : ''}`} onClick={() => setActiveTab('validate')}>Validate</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'validate' && (
          <div>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={validateFile} disabled={loading}>{loading ? 'Processing...' : 'Validate File'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
