import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6310';

function App() {
  const [audioUrl, setAudioUrl] = useState('');
  const [text, setText] = useState('');
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
      <header className="header"><h1>🎤 Speech-to-Text & TTS</h1></header>
      <div className="container">
        <h3>Speech-to-Text</h3>
        <input type="text" value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="Audio URL" />
        <button onClick={() => callAPI('/transcribe', { audioUrl, language: 'en-US' })}>Transcribe</button>
        <hr />
        <h3>Text-to-Speech</h3>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Text to synthesize" rows="4" />
        <button onClick={() => callAPI('/synthesize', { text, language: 'en-US', voice: 'female' })}>Synthesize</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
