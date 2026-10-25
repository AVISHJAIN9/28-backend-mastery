import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('h264');
  const [bitrate, setBitrate] = useState('5000k');
  const [resolution, setResolution] = useState('1920x1080');

  const API_URL = 'http://localhost:6605/api';

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

  const startTranscode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/transcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, bitrate, resolution })
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
        <h1>05 - Video Transcoding</h1>
        <p>Encode videos to H.264, VP9, AV1 formats</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'transcode' ? 'active' : ''}`} onClick={() => setActiveTab('transcode')}>Transcode</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'transcode' && (
          <div>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="h264">H.264</option>
              <option value="vp9">VP9</option>
            </select>
            <input type="text" value={bitrate} onChange={(e) => setBitrate(e.target.value)} placeholder="5000k" />
            <button onClick={startTranscode} disabled={loading}>{loading ? 'Processing...' : 'Start Transcoding'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
