import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamName, setStreamName] = useState('');

  const API_URL = 'http://localhost:6606/api';

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

  const createStream = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: streamName })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  const getPlaylist = async () => {
    setLoading(true);
    try {
      const id = prompt('Enter Stream ID:');
      if (!id) return;
      const res = await fetch(`${API_URL}/streams/${id}/playlist.m3u8`);
      const text = await res.text();
      setResponse({ playlist: text });
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>06 - HLS Streaming</h1>
        <p>Create streams and generate M3U8 playlists</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>Create Stream</button>
        <button className={`tab-btn ${activeTab === 'playlist' ? 'active' : ''}`} onClick={() => setActiveTab('playlist')}>Get Playlist</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'create' && (
          <div>
            <input type="text" value={streamName} onChange={(e) => setStreamName(e.target.value)} placeholder="Stream name" />
            <button onClick={createStream} disabled={loading}>{loading ? 'Creating...' : 'Create Stream'}</button>
          </div>
        )}
        {activeTab === 'playlist' && (<div><button onClick={getPlaylist} disabled={loading}>{loading ? 'Loading...' : 'Get Playlist'}</button></div>)}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;
