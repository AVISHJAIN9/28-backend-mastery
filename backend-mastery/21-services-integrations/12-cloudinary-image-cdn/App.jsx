import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6312';

function App() {
  const [imagePath, setImagePath] = useState('');
  const [publicId, setPublicId] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, body) => {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setResponse(await res.json());
  };

  return (
    <div className="app">
      <header className="header"><h1>📸 Cloudinary CDN</h1></header>
      <div className="container">
        <h3>Upload Image</h3>
        <input type="text" value={imagePath} onChange={(e) => setImagePath(e.target.value)} placeholder="Image path" />
        <button onClick={() => callAPI('/upload', { imagePath, publicId, folder: 'uploads' })}>Upload</button>
        <hr />
        <h3>Transform Image</h3>
        <input type="text" value={publicId} onChange={(e) => setPublicId(e.target.value)} placeholder="Public ID" />
        <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Width" />
        <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Height" />
        <button onClick={() => callAPI('/transform', { publicId, width: parseInt(width), height: parseInt(height), crop: 'fill' })}>Transform</button>
        <button onClick={() => callAPI('/list', { prefix: '' })}>List Images</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
