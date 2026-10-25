import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

export default function LiveStreamingApp() {
  // Socket connection
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Room state
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState([]);

  // UI state
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [userId] = useState(`user_${Math.random().toString(36).substr(2, 9)}`);
  const [username, setUsername] = useState(`Viewer_${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [response, setResponse] = useState(null);
  const [stats, setStats] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const socket = io('http://localhost:4005', {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ['websocket']
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✓ Connected to server');
      setConnected(true);
      setResponse({ type: 'success', message: 'Connected to server' });
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
      setConnected(false);
      setResponse({ type: 'error', message: 'Disconnected from server' });
    });

    // Room events
    socket.on('user:joined', (data) => {
      setViewerCount(data.viewerCount);
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${data.username} joined the stream`,
        timestamp: data.timestamp
      }]);
    });

    socket.on('user:left', (data) => {
      setViewerCount(data.viewerCount);
      setMessages(prev => [...prev, {
        type: 'system',
        text: `${data.username} left the stream`,
        timestamp: data.timestamp
      }]);
    });

    socket.on('room:viewers', (data) => {
      setViewerCount(data.viewerCount);
      setViewers(data.viewers);
    });

    // Message and stream events
    socket.on('message:received', (data) => {
      setMessages(prev => [...prev, {
        type: 'message',
        id: data.socketId,
        username: data.username,
        text: data.text,
        timestamp: data.timestamp
      }]);
    });

    socket.on('stream:update', (data) => {
      console.log('Stream update:', data);
    });

    socket.on('user:typing', (data) => {
      if (data.isTyping) {
        setMessages(prev => [...prev, {
          type: 'typing',
          username: data.username,
          timestamp: data.timestamp
        }]);
      }
    });

    socket.on('room:closed', (data) => {
      setMessages(prev => [...prev, {
        type: 'system',
        text: `Room closed: ${data.message}`,
        timestamp: data.timestamp
      }]);
      setCurrentRoom(null);
      setViewers([]);
      setViewerCount(0);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setResponse({ type: 'error', message: error.message });
    });

    socketRef.current = socket;

    return () => socket.close();
  }, []);

  // ==================== REST API Functions ====================

  // Create a new room
  const createRoom = async () => {
    try {
      if (!newRoomId || !newRoomName) {
        setResponse({ type: 'error', message: 'Room ID and name are required' });
        return;
      }

      const res = await fetch('http://localhost:4005/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: newRoomId,
          name: newRoomName,
          isLive: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResponse({ type: 'success', message: `Room ${newRoomId} created!` });
        setNewRoomId('');
        setNewRoomName('');
        await fetchRooms();
      } else {
        setResponse({ type: 'error', message: data.error });
      }
    } catch (error) {
      setResponse({ type: 'error', message: error.message });
    }
  };

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      const res = await fetch('http://localhost:4005/api/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
      setResponse({ type: 'success', message: `Loaded ${data.count || 0} rooms` });
    } catch (error) {
      setResponse({ type: 'error', message: error.message });
    }
  };

  // Get global stats
  const getGlobalStats = async () => {
    try {
      const res = await fetch('http://localhost:4005/api/stats/global');
      const data = await res.json();
      setStats(data.stats);
      setResponse({ type: 'success', message: 'Stats updated' });
    } catch (error) {
      setResponse({ type: 'error', message: error.message });
    }
  };

  // Join a room
  const joinRoom = (roomId) => {
    if (socketRef.current) {
      socketRef.current.emit('room:join', {
        roomId,
        userId,
        username
      });
      setCurrentRoom(roomId);
      setMessages([]);
      setResponse({ type: 'success', message: `Joined room: ${roomId}` });
    }
  };

  // Leave current room
  const leaveRoom = () => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('room:leave', { roomId: currentRoom });
      setCurrentRoom(null);
      setMessages([]);
      setViewers([]);
      setViewerCount(0);
      setResponse({ type: 'success', message: 'Left the room' });
    }
  };

  // Send message
  const sendMessage = () => {
    if (socketRef.current && currentRoom && messageText.trim()) {
      socketRef.current.emit('message:send', {
        roomId: currentRoom,
        text: messageText
      });
      setMessageText('');
    }
  };

  // Typing indicator
  const handleTyping = (isTyping) => {
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('user:typing', {
        roomId: currentRoom,
        isTyping
      });
      setIsTyping(isTyping);
    }
  };

  // Delete room
  const deleteRoom = async (roomId) => {
    try {
      const res = await fetch(`http://localhost:4005/api/rooms/${roomId}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (res.ok) {
        setResponse({ type: 'success', message: `Room ${roomId} deleted` });
        if (currentRoom === roomId) {
          leaveRoom();
        }
        await fetchRooms();
      } else {
        setResponse({ type: 'error', message: data.error });
      }
    } catch (error) {
      setResponse({ type: 'error', message: error.message });
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>✓ 05: Live Streaming Rooms</h1>

      {/* Status Indicator */}
      <div style={styles.statusBar}>
        <span style={{ color: connected ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
          {connected ? '✓ LIVE' : '✗ OFFLINE'}
        </span>
        <span style={styles.userInfo}>User: {username}</span>
      </div>

      {/* Response Message */}
      {response && (
        <div style={{
          ...styles.response,
          backgroundColor: response.type === 'success' ? '#c8e6c9' : '#ffcdd2',
          color: response.type === 'success' ? '#2e7d32' : '#c62828'
        }}>
          {response.message}
        </div>
      )}

      <div style={styles.grid}>
        {/* Left Panel: Room Creation & List */}
        <div style={styles.panel}>
          <h2>Create Room</h2>
          <input
            type="text"
            placeholder="Room ID (e.g., room1)"
            value={newRoomId}
            onChange={(e) => setNewRoomId(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="Room Name"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            style={styles.input}
          />
          <button onClick={createRoom} style={styles.buttonPrimary}>Create Room</button>
          <button onClick={fetchRooms} style={styles.buttonSecondary}>Refresh Rooms</button>
          <button onClick={getGlobalStats} style={styles.buttonSecondary}>Get Stats</button>

          <h2>Available Rooms ({rooms.length})</h2>
          <div style={styles.roomList}>
            {rooms.map(room => (
              <div key={room.id} style={styles.roomCard}>
                <strong>{room.name}</strong>
                <p style={styles.small}>ID: {room.id}</p>
                <p style={styles.small}>Viewers: {room.currentViewers}</p>
                <div style={styles.buttonGroup}>
                  <button
                    onClick={() => joinRoom(room.id)}
                    style={currentRoom === room.id ? styles.buttonActive : styles.buttonSecondary}
                  >
                    {currentRoom === room.id ? '✓ Current' : 'Join'}
                  </button>
                  <button
                    onClick={() => deleteRoom(room.id)}
                    style={styles.buttonDanger}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Stream & Chat */}
        <div style={styles.panel}>
          {currentRoom ? (
            <>
              <h2>Stream: {currentRoom}</h2>
              <button onClick={leaveRoom} style={styles.buttonDanger}>Leave Room</button>

              {/* Viewer Info */}
              <div style={styles.statsBox}>
                <p><strong>Viewers:</strong> {viewerCount}</p>
                <p><strong>Active Users:</strong> {viewers.length}</p>
              </div>

              {/* Viewers List */}
              <div style={styles.viewersList}>
                <h3>Active Viewers</h3>
                {viewers.length > 0 ? (
                  viewers.map((viewer, idx) => (
                    <div key={idx} style={styles.viewerItem}>
                      {viewer.username} ({viewer.userId})
                    </div>
                  ))
                ) : (
                  <p style={styles.small}>No viewers yet</p>
                )}
              </div>

              {/* Messages */}
              <div style={styles.messageBox}>
                {messages.map((msg, idx) => (
                  <div key={idx} style={styles.message}>
                    {msg.type === 'system' && (
                      <p style={{ ...styles.small, color: '#999', fontStyle: 'italic' }}>
                        {msg.text}
                      </p>
                    )}
                    {msg.type === 'message' && (
                      <p>
                        <strong style={{ color: '#1976d2' }}>{msg.username}:</strong> {msg.text}
                      </p>
                    )}
                    {msg.type === 'typing' && (
                      <p style={{ ...styles.small, color: '#999' }}>
                        <em>{msg.username} is typing...</em>
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => {
                    setMessageText(e.target.value);
                    handleTyping(e.target.value.length > 0);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                      handleTyping(false);
                    }
                  }}
                  style={styles.input}
                />
                <button onClick={() => {
                  sendMessage();
                  handleTyping(false);
                }} style={styles.buttonPrimary}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p>Select a room to start streaming</p>
              <p style={styles.small}>Pick a room from the left panel</p>
            </div>
          )}

          {/* Global Stats */}
          {stats && (
            <div style={styles.statsBox}>
              <h3>Global Stats</h3>
              <p><strong>Total Rooms:</strong> {stats.totalRooms}</p>
              <p><strong>Live Rooms:</strong> {stats.liveRooms}</p>
              <p><strong>Global Viewers:</strong> {stats.totalViewers}</p>
              <p><strong>Total Messages:</strong> {stats.totalMessages}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Styles ====================

const styles = {
  container: {
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  heading: {
    color: '#1976d2',
    marginBottom: '20px',
    textAlign: 'center'
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '10px 20px',
    borderRadius: '4px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  userInfo: {
    fontSize: '14px',
    color: '#666'
  },
  response: {
    padding: '10px 15px',
    borderRadius: '4px',
    marginBottom: '15px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  panel: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  buttonPrimary: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  buttonSecondary: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  buttonActive: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonDanger: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  roomCard: {
    border: '1px solid #ddd',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '4px',
    backgroundColor: '#fafafa'
  },
  roomList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  statsBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    borderLeft: '4px solid #1976d2'
  },
  viewersList: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '15px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  viewerItem: {
    fontSize: '14px',
    padding: '5px',
    borderBottom: '1px solid #eee'
  },
  messageBox: {
    border: '1px solid #ddd',
    borderRadius: '4px',
    padding: '10px',
    height: '250px',
    overflowY: 'auto',
    marginBottom: '15px',
    backgroundColor: '#fafafa'
  },
  message: {
    marginBottom: '10px',
    paddingBottom: '5px',
    borderBottom: '1px solid #eee'
  },
  small: {
    fontSize: '12px',
    margin: '5px 0',
    color: '#666'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#999'
  }
};