import React, { useState } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('600');
  const [format, setFormat] = useState('jpeg');

  const API_URL = 'http://localhost:6604/api';

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

  const resizeImage = async () => {
    if (!file) return alert('Select an image');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('width', width);
      formData.append('height', height);
      const res = await fetch(`${API_URL}/resize`, { method: 'POST', body: formData });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  const convertFormat = async () => {
    if (!file) return alert('Select an image');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      const res = await fetch(`${API_URL}/convert`, { method: 'POST', body: formData });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `converted.${format}`;
      a.click();
      setResponse({ success: true, message: `Converted to ${format}` });
    } catch (error) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <header>
        <h1>04 - Image Processing with Sharp</h1>
        <p>Resize, convert, and optimize images</p>
      </header>
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>Health</button>
        <button className={`tab-btn ${activeTab === 'resize' ? 'active' : ''}`} onClick={() => setActiveTab('resize')}>Resize</button>
        <button className={`tab-btn ${activeTab === 'convert' ? 'active' : ''}`} onClick={() => setActiveTab('convert')}>Convert</button>
      </div>
      <div className="content">
        {activeTab === 'health' && (<div><button onClick={healthCheck} disabled={loading}>{loading ? 'Checking...' : 'Check Health'}</button></div>)}
        {activeTab === 'resize' && (
          <div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Width" />
            <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height" />
            <button onClick={resizeImage} disabled={loading}>{loading ? 'Processing...' : 'Resize'}</button>
          </div>
        )}
        {activeTab === 'convert' && (
          <div>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="jpeg">JPEG</option>
              <option value="png">PNG</option>
              <option value="webp">WebP</option>
            </select>
            <button onClick={convertFormat} disabled={loading}>{loading ? 'Converting...' : 'Convert'}</button>
          </div>
        )}
      </div>
      {response && <div className="response-box"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
};

export default App;

