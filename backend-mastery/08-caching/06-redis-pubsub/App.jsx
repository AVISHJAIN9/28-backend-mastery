import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [userId, setUserId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const [userName, setUserName] = useState(`User_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const { io } = window;
    const newSocket = io('http://localhost:6406', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    newSocket.on('new-message', (data) => {
      setMessages(prev => [...prev, { ...data, id: Date.now(), type: 'message', source: 'received' }]);
    });

    newSocket.on('user-joined', (data) => {
      setMessages(prev => [...prev, { ...data, id: Date.now(), type: 'system', source: 'server' }]);
    });

    newSocket.on('system-notification', (data) => {
      setNotifications(prev => [...prev, { ...data, id: Date.now() }]);
    });

    newSocket.on('channel-message', (data) => {
      setMessages(prev => [...prev, { ...data, id: Date.now(), type: 'channel-message' }]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:6406/api/rooms');
        const data = await res.json();
        setRooms(data.rooms || []);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const joinRoom = (roomId) => {
    if (!socket) return;
    setCurrentRoom(roomId);
    setMessages([]);
    socket.emit('join-room', { roomId, userId, userName });
  };

  const sendMessage = () => {
    if (!socket || !inputValue.trim() || !currentRoom) return;

    socket.emit('send-message', {
      roomId: currentRoom,
      text: inputValue
    });

    setMessages(prev => [...prev, {
      id: Date.now(),
      userId,
      userName,
      text: inputValue,
      timestamp: new Date().toISOString(),
      type: 'message',
      source: 'sent'
    }]);

    setInputValue('');
  };

  const publishToChannel = async () => {
    if (!inputValue.trim()) return;

    try {
      const res = await fetch('http://localhost:6406/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: `demo_${Math.random().toString(36).substr(2, 9)}`,
          message: { text: inputValue, sender: userName }
        })
      });
      const data = await res.json();
      setNotifications(prev => [...prev, { id: Date.now(), title: 'Published', message: `${data.subscribersReceived} subscribers received` }]);
      setInputValue('');
    } catch (err) {
      console.error('Publish error:', err);
    }
  };

  const broadcastNotification = async () => {
    try {
      await fetch('http://localhost:6406/api/broadcast-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'System Alert',
          message: inputValue || 'Test notification',
          severity: 'info'
        })
      });
      setNotifications(prev => [...prev, { id: Date.now(), title: 'Broadcasted', message: 'To all clients' }]);
      setInputValue('');
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🔴 Redis Pub/Sub</h1>
        <div className="status">
          <span className={`indicator ${connected ? 'connected' : 'disconnected'}`}></span>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <div className="container">
        <div className="sidebar">
          <div className="rooms-section">
            <h3>Rooms ({rooms.length})</h3>
            <div className="rooms-list">
              {rooms.map((room) => (
                <button
                  key={room.roomId}
                  className={`room-btn ${currentRoom === room.roomId ? 'active' : ''}`}
                  onClick={() => joinRoom(room.roomId)}
                >
                  {room.roomId} <span>{room.memberCount}</span>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => joinRoom(`room_${Date.now()}`)}>
              New Room
            </button>
          </div>

          <div className="notifications-section">
            <h3>Notifications ({notifications.length})</h3>
            {notifications.slice(-3).map(n => (
              <div key={n.id} className="notification">
                <strong>{n.title}</strong>
                <p>{n.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="main">
          <div className="header-bar">
            <h2>{currentRoom || 'Select room'}</h2>
          </div>

          <div className="messages">
            {messages.length === 0 ? (
              <p className="empty">No messages</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message ${msg.type}`}>
                  {msg.type === 'system' ? (
                    <em>{msg.userName} joined</em>
                  ) : (
                    <>
                      <strong>{msg.userName}</strong>: {msg.text || msg.message}
                    </>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type message..."
              className="message-input"
            />
            <div className="button-group">
              <button className="btn btn-primary" onClick={sendMessage} disabled={!currentRoom}>
                Send
              </button>
              <button className="btn btn-secondary" onClick={publishToChannel}>
                Publish
              </button>
              <button className="btn btn-warning" onClick={broadcastNotification}>
                Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

