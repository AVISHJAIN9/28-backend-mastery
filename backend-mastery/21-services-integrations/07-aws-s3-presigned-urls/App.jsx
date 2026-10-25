import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6307';

function App() {
  const [bucketName, setBucketName] = useState('my-bucket');
  const [fileName, setFileName] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, method = 'POST', body = null) => {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    };
    const res = await fetch(`${API_BASE}/api${path}`, options);
    setResponse(await res.json());
  };

  return (
    <div className="app">
      <header className="header"><h1>☁️ AWS S3 Presigned URLs</h1></header>
      <div className="container">
        <input type="text" value={bucketName} onChange={(e) => setBucketName(e.target.value)} placeholder="Bucket name" />
        <input type="text" value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="File name" />
        <button onClick={() => callAPI('/url/upload', 'POST', { bucketName, fileName, expiresIn: 3600 })}>Get Upload URL</button>
        <button onClick={() => callAPI('/url/download', 'POST', { bucketName, fileName, expiresIn: 3600 })}>Get Download URL</button>
        <button onClick={() => callAPI('/list', 'POST', { bucketName })}>List Files</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
