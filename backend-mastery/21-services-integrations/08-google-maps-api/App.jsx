import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6308';

function App() {
  const [address, setAddress] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
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
      <header className="header"><h1>🗺️ Google Maps API</h1></header>
      <div className="container">
        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" />
        <button onClick={() => callAPI('/geocode', { address })}>Geocode</button>
        <hr />
        <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin" />
        <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" />
        <button onClick={() => callAPI('/directions', { origin, destination, mode: 'driving' })}>Get Directions</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
