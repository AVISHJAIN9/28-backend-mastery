import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const API_URL = 'http://localhost:6610/api';

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

  const extractMetadata = async () => {
    if (!file) return alert('Select an image');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/extract-metadata`, {
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

  const stripExif = async () => {
    if (!file) return alert('Select an image');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/strip-exif`, {
        method: 'POST',
        body: formData
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned.jpg';
      a.click();
      setResponse({ success: true, message: 'EXIF removed and downloaded' });
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>10 - EXIF Metadata Strip</h1>
        <p>Extract and remove EXIF metadata from images</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'extract' ? 'active' : ''}`} onClick={() => setActiveTab('extract')}>Extract</button>
        <button className={`tab-btn ${activeTab === 'strip' ? 'active' : ''}`} onClick={() => setActiveTab('strip')}>Remove EXIF</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'extract' && (
          <div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={extractMetadata} disabled={loading}>{loading ? 'Processing...' : 'Extract Metadata'}</button>
          </div>
        )}
        {activeTab === 'strip' && (
          <div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <button onClick={stripExif} disabled={loading}>{loading ? 'Processing...' : 'Remove EXIF'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
