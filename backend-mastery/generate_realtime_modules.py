#!/usr/bin/env python3
"""
Generate comprehensive content for all Real-Time Communication modules
"""

import os
import json

BASE_PATH = "/Users/avishjain/Downloads/backend-mastery/05-realtime-communication"

MODULES = {
    "03-sse-server-sent-events": {
        "name": "Server-Sent Events (SSE)",
        "description": "One-way server-to-client streaming communication",
        "controller": """// SSE Controller - Server-Sent Events implementation

class SSEController {
  constructor(io) {
    this.io = io;
    this.subscribers = new Map(); // userId -> responseStream
  }

  handleSSEConnection(userId, response) {
    // Set SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Store connection
    this.subscribers.set(userId, response);
    
    response.write(':connection established\\n\\n');

    // Heartbeat to keep connection alive
    const heartbeat = setInterval(() => {
      response.write(':heartbeat\\n\\n');
    }, 30000);

    response.on('close', () => {
      clearInterval(heartbeat);
      this.subscribers.delete(userId);
      console.log(`SSE connection closed for user ${userId}`);
    });
  }

  broadcast(eventName, data) {
    this.subscribers.forEach((response, userId) => {
      response.write(`event: ${eventName}\\n`);
      response.write(`data: ${JSON.stringify(data)}\\n\\n`);
    });
  }

  sendToUser(userId, eventName, data) {
    const response = this.subscribers.get(userId);
    if (response) {
      response.write(`event: ${eventName}\\n`);
      response.write(`data: ${JSON.stringify(data)}\\n\\n`);
    }
  }

  getActiveConnections() {
    return this.subscribers.size;
  }
}

module.exports = SSEController;""",
        "middleware": """// SSE Middleware - Connection validation

const sseAuthMiddleware = (req, res, next) => {
  const userId = req.query.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  req.userId = userId;
  next();
};

module.exports = { sseAuthMiddleware };""",
        "routes": """// SSE Routes - Server-Sent Events setup

const express = require('express');
const SSEController = require('./controller');
const { sseAuthMiddleware } = require('./middleware');

module.exports = (app) => {
  const sseController = new SSEController(null);
  app.locals.sseController = sseController;

  const router = express.Router();

  // SSE connection endpoint
  router.get('/connect', sseAuthMiddleware, (req, res) => {
    sseController.handleSSEConnection(req.userId, res);
  });

  // Broadcast endpoint
  router.post('/broadcast', (req, res) => {
    const { eventName, data } = req.body;
    sseController.broadcast(eventName, data);
    res.json({ success: true });
  });

  // Send to specific user
  router.post('/send/:userId', (req, res) => {
    const { eventName, data } = req.body;
    sseController.sendToUser(req.params.userId, eventName, data);
    res.json({ success: true });
  });

  return router;
};"""
    },
    "04-socket-auth-jwt-handshake": {
        "name": "Socket Authentication & JWT Handshake",
        "description": "Securing real-time connections with JWT",
        "controller": """// Socket Auth Controller - JWT validation

const jwt = require('jsonwebtoken');

class SocketAuthController {
  constructor(io) {
    this.io = io;
    this.jwtSecret = process.env.JWT_SECRET || 'dev-secret';
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      return null;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { userId, iat: Math.floor(Date.now() / 1000) },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  handleSocketAuth(socket) {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = this.verifyToken(token);
    if (!decoded) {
      throw new Error('Invalid token');
    }

    socket.userId = decoded.userId;
    socket.authenticated = true;
    
    socket.on('token:refresh', (data, callback) => {
      const newToken = this.generateToken(socket.userId);
      callback({ token: newToken });
    });
  }
}

module.exports = SocketAuthController;""",
        "middleware": """// Socket Auth Middleware

const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};

module.exports = { socketAuthMiddleware };""",
        "routes": """// Socket Auth Routes

const express = require('express');
const jwt = require('jsonwebtoken');
const SocketAuthController = require('./controller');

module.exports = (app, server) => {
  const authController = new SocketAuthController(null);

  const router = express.Router();

  router.post('/login', (req, res) => {
    const { userId } = req.body;
    const token = authController.generateToken(userId);
    res.json({ token });
  });

  router.post('/refresh', (req, res) => {
    const { token } = req.body;
    const decoded = authController.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const newToken = authController.generateToken(decoded.userId);
    res.json({ token: newToken });
  });

  return router;
};"""
    },
    "05-live-streaming-rooms": {
        "name": "Live Streaming Rooms",
        "description": "Real-time rooms for isolated communication",
        "controller": """// Live Streaming Rooms Controller

class RoomsController {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  createRoom(roomName, roomData) {
    const room = {
      id: roomName,
      name: roomData.name,
      createdAt: new Date(),
      isLive: true,
      viewers: new Set(),
      ...roomData
    };
    this.rooms.set(roomName, room);
    return room;
  }

  handleUserJoinRoom(socket, roomName, userData) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    socket.join(roomName);
    room.viewers.add(socket.userId);

    this.io.to(roomName).emit('room:userJoined', {
      user: userData,
      viewerCount: room.viewers.size
    });
  }

  handleUserLeaveRoom(socket, roomName) {
    const room = this.rooms.get(roomName);
    if (!room) return;

    socket.leave(roomName);
    room.viewers.delete(socket.userId);

    this.io.to(roomName).emit('room:userLeft', {
      userId: socket.userId,
      viewerCount: room.viewers.size
    });
  }

  broadcastToRoom(roomName, event, data) {
    this.io.to(roomName).emit(event, data);
  }

  getRoomInfo(roomName) {
    return this.rooms.get(roomName);
  }

  listRooms() {
    return Array.from(this.rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      viewers: room.viewers.size,
      isLive: room.isLive
    }));
  }
}

module.exports = RoomsController;""",
        "middleware": """// Rooms Middleware

const roomAuthMiddleware = (io) => {
  return (socket, next) => {
    socket.on('room:join', (roomData) => {
      if (!roomData.roomName) {
        next(new Error('Room name required'));
      }
      next();
    });
  };
};

module.exports = { roomAuthMiddleware };""",
        "routes": """// Rooms Routes

const express = require('express');
const RoomsController = require('./controller');

module.exports = (app, server) => {
  const roomsController = new RoomsController(null);

  const router = express.Router();

  router.post('/create', (req, res) => {
    const room = roomsController.createRoom(req.body.id, req.body);
    res.json(room);
  });

  router.get('/list', (req, res) => {
    res.json(roomsController.listRooms());
  });

  router.get('/:roomId', (req, res) => {
    const room = roomsController.getRoomInfo(req.params.roomId);
    if (!room) return res.status(404).json({ error: 'Not found' });
    res.json(room);
  });

  return router;
};"""
    }
}

def generate_schema(module_name):
    return f"""// {module_name} Schema - Joi validation

const Joi = require('joi');

const eventSchema = Joi.object({
  eventType: Joi.string().required(),
  data: Joi.object().optional()
});

module.exports = {{ eventSchema }};"""

def generate_theory(module_name):
    return f"""# {module_name} Theory

## Overview
{module_name} provides real-time communication capabilities for {module_name.lower()} applications.

## Key Concepts
- Real-time updates
- Event-driven architecture
- Scalable messaging

## Best Practices
- Implement proper error handling
- Use connection pooling
- Monitor performance
- Add authentication checks"""

def generate_readme(module_name):
    return f"""# {module_name}

## What is this?
{module_name} enables real-time communication features.

## Why does it matter?
- Instant updates
- Better user experience
- Scalable architecture

## How it works
Messages flow through the event bus to connected clients.

## Key concepts
- Events
- Broadcasting
- Rooms

## Common mistakes
- Missing error handling
- No reconnection logic
- Poor performance monitoring

## Real world usage
Chat applications, notifications, live updates"""

def generate_checklist(module_name):
    return f"""# {module_name} - Implementation Checklist

## Setup
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Set up database
- [ ] Create test client

## Implementation
- [ ] Write controller
- [ ] Implement middleware
- [ ] Create routes
- [ ] Add error handling

## Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing
- [ ] Error scenarios

## Deployment
- [ ] Production build
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] Ready for production"""

def generate_env_example():
    return """# Module Configuration

PORT=4000
NODE_ENV=development
DEBUG=false

# Redis (if applicable)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your_secret

# Logging
LOG_LEVEL=info"""

def generate_app_jsx(module_name):
    return f"""import React, {{ useEffect, useState }} from 'react';

export default function {module_name.replace(' ', '').replace('-', '')}App() {{
  const [data, setData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {{
    setIsConnected(true);
  }}, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>{module_name}</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
    </div>
  );
}}"""

def create_module_files(module_dir, module_data):
    """Create all files for a module"""
    os.makedirs(module_dir, exist_ok=True)
    
    files = {
        'schema.js': module_data.get('schema', generate_schema(module_data['name'])),
        'controller.js': module_data.get('controller', ''),
        'middleware.js': module_data.get('middleware', ''),
        'routes.js': module_data.get('routes', ''),
        'theory.md': module_data.get('theory', generate_theory(module_data['name'])),
        'README.md': module_data.get('readme', generate_readme(module_data['name'])),
        'checklist.md': module_data.get('checklist', generate_checklist(module_data['name'])),
        '.env.example': generate_env_example(),
        'App.jsx': generate_app_jsx(module_data['name']),
    }
    
    for filename, content in files.items():
        filepath = os.path.join(module_dir, filename)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✓ Created {filepath}")

if __name__ == "__main__":
    # Generate modules 03-05 with detailed content
    for module_key, module_data in MODULES.items():
        module_path = os.path.join(BASE_PATH, module_key)
        print(f"\n📦 Generating {module_key}...")
        create_module_files(module_path, module_data)
    
    print("\n✅ Module generation complete!")
