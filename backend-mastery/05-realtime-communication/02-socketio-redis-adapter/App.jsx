import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function RedisAdapterApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [serverInfo, setServerInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Determine which server to connect to (load balanced)
    const serverPort = localStorage.getItem('serverPort') || 4000;
    
    const newSocket = io(`http://localhost:${serverPort}`, {
      auth: {
        token: 'guest_' + Math.random().toString(36).substr(2, 9)
      },
      reconnection: true,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setMessages(prev => [...prev, { type: 'system', text: `Connected on port ${serverPort}` }]);
      
      // Query server info
      newSocket.emit('server:info', {}, (info) => {
        setServerInfo(info);
      });
    });

    newSocket.on('message:received', (msg) => {
      setMessages(prev => [...prev, { type: 'message', ...msg }]);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setMessages(prev => [...prev, { type: 'system', text: 'Disconnected from server' }]);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Periodic metrics fetch
  useEffect(() => {
    if (!socket || !isConnected) return;

    const interval = setInterval(() => {
      fetch(`http://localhost:4000/api/ws/metrics`)
        .then(res => res.json())
        .then(data => setMetrics(data))
        .catch(err => console.error('Metrics fetch failed:', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [socket, isConnected]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    socket.emit('message:send', {
      content: input,
      channel: 'broadcast'
    });

    setInput('');
  };

  const switchServer = (port) => {
    localStorage.setItem('serverPort', port);
    window.location.reload();
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'Monospace' }}>
      <h1>🔄 Redis Adapter - Multi-Server Chat</h1>

      {/* Cluster Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>Connection Status</h3>
          <p><strong>Status:</strong> <span style={{ color: isConnected ? 'green' : 'red' }}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span></p>
          {serverInfo && (
            <>
              <p><strong>Server ID:</strong> {serverInfo.serverId}</p>
              <p><strong>Socket ID:</strong> {serverInfo.socketId}</p>
            </>
          )}
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <h3>Cluster Metrics</h3>
          {metrics ? (
            <>
              <p><strong>Total Servers:</strong> {metrics.servers}</p>
              <p><strong>Total Connections:</strong> {metrics.totalConnections}</p>
              <p><strong>Messages Sent:</strong> {metrics.messagesSent}</p>
              <p><strong>Uptime:</strong> {Math.floor(metrics.uptime / 1000)}s</p>
            </>
          ) : (
            <p>Loading metrics...</p>
          )}
        </div>
      </div>

      {/* Server Switcher */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff9e6', borderRadius: '5px' }}>
        <p><strong>⚡ Switch Server:</strong></p>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[4000, 4001, 4002].map(port => (
            <button
              key={port}
              onClick={() => switchServer(port)}
              style={{
                padding: '8px 16px',
                backgroundColor: serverInfo?.serverId === `server_${port - 3999}` ? '#007bff' : '#ddd',
                color: serverInfo?.serverId === `server_${port - 3999}` ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Port {port}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        border: '1px solid #ccc',
        height: '300px',
        overflowY: 'auto',
        marginBottom: '20px',
        padding: '10px',
        backgroundColor: '#fafafa',
        borderRadius: '5px',
        fontSize: '0.9em'
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999' }}>No messages yet...</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '8px', padding: '5px', borderLeft: '2px solid #007bff' }}>
              {msg.type === 'system' ? (
                <span style={{ color: '#999' }}>ℹ {msg.text}</span>
              ) : (
                <>
                  <span style={{ color: '#333' }}><strong>User:</strong> {msg.text}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type message (broadcast to all servers)..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            opacity: isConnected ? 1 : 0.5
          }}
        />
        <button
          type="submit"
          disabled={!isConnected}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: isConnected ? 1 : 0.5
          }}
        >
          Broadcast
        </button>
      </form>
    </div>
  );
}

