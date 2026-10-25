import React, { useEffect, useState } from 'react';

export default function WebSocketDemo() {
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:5024/socket');
    ws.onopen = () => setConnected(true);
    ws.onmessage = (e) => setMessages(prev => [...prev, e.data]);
    ws.onclose = () => setConnected(false);
  }, []);

  const sendMessage = () => {
    if (message) {
      setMessages(prev => [...prev, message]);
      setMessage('');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>WebSocket Demo</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
      <button onClick={sendMessage} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Send</button>
      <div style={{ marginTop: 20, maxHeight: 300, overflow: 'auto' }}>
        {messages.map((msg, i) => <div key={i} style={{ padding: 8, background: '#f0f0f0', marginBottom: 4, borderRadius: 4 }}>{msg}</div>)}
      </div>
    </div>
  );
}
