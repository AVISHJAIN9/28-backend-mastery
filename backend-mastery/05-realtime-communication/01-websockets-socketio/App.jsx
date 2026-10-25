import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

export default function WebSocketApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [username, setUsername] = useState('User_' + Math.floor(Math.random() * 1000));
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:4000', {
      auth: {
        token: 'guest_' + username
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('✓ Connected to server');
      setIsConnected(true);
      
      // Emit user join event
      newSocket.emit('user:join', {
        userId: username,
        username: username
      });
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Message events
    newSocket.on('message:received', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('message:private', (message) => {
      setMessages((prev) => [...prev, { ...message, isPrivate: true }]);
    });

    // User events
    newSocket.on('users:list', (userList) => {
      setUsers(userList);
    });

    newSocket.on('user:joined', (data) => {
      setUsers((prev) => [...prev, data.user]);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          content: `${data.user.username} joined (${data.totalUsers} total)`
        }
      ]);
    });

    newSocket.on('user:left', (data) => {
      setUsers((prev) => prev.filter((u) => u.socketId !== data.userId));
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: 'system',
          content: `${data.username} left (${data.totalUsers} total)`
        }
      ]);
    });

    // Typing indicators
    newSocket.on('user:typing', (typingData) => {
      if (typingData.isTyping && typingData.userId !== username) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: 'typing',
            username: typingData.username
          }
        ]);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !socket) return;

    socket.emit('message:send', {
      content: messageInput,
      recipientId: 'all'
    });

    setMessageInput('');
    setIsTyping(false);
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('user:typing', { isTyping: true });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('user:typing', { isTyping: false });
    }, 3000);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🔌 WebSocket Chat</h1>

      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <p>
          <strong>Status:</strong>{' '}
          <span style={{ color: isConnected ? 'green' : 'red' }}>
            {isConnected ? '● Connected' : '● Disconnected'}
          </span>
        </p>
        <p>
          <strong>You:</strong> {username}
        </p>
        <p>
          <strong>Users Online:</strong> {users.length}
        </p>
      </div>

      {/* Messages */}
      <div
        style={{
          border: '1px solid #ccc',
          height: '300px',
          overflowY: 'auto',
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#fafafa',
          borderRadius: '5px'
        }}
      >
        {messages.length === 0 ? (
          <p style={{ color: '#999' }}>No messages yet...</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '10px', padding: '8px', borderLeft: '3px solid #007bff' }}>
              {msg.type === 'system' ? (
                <p style={{ color: '#999', margin: 0, fontSize: '0.9em' }}>ℹ {msg.content}</p>
              ) : msg.type === 'typing' ? (
                <p style={{ color: '#aaa', margin: 0, fontSize: '0.9em' }}>✎ {msg.username} is typing...</p>
              ) : (
                <>
                  <strong style={{ color: msg.isPrivate ? '#e74c3c' : '#333' }}>
                    {msg.senderName}
                    {msg.isPrivate && ' (private)'}
                  </strong>
                  <p style={{ margin: '5px 0 0 0' }}>{msg.content}</p>
                  <small style={{ color: '#999' }}>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={messageInput}
          onChange={handleInputChange}
          placeholder="Type a message..."
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            opacity: isConnected ? 1 : 0.5
          }}
        />
        <button
          type="submit"
          disabled={!isConnected || !messageInput.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            opacity: isConnected ? 1 : 0.5
          }}
        >
          Send
        </button>
      </form>

      {/* Active Users */}
      <div style={{ marginTop: '20px' }}>
        <h3>Active Users ({users.length})</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {users.map((user, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                backgroundColor: '#e7f3ff',
                border: '1px solid #b3d9ff',
                borderRadius: '20px',
                fontSize: '0.9em'
              }}
            >
              ● {user.username}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

