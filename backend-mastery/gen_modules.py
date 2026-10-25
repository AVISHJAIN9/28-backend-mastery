#!/usr/bin/env python3
"""Auto-generate content for all remaining Real-Time Communication modules"""

import os
import sys

BASE = "/Users/avishjain/Downloads/backend-mastery/05-realtime-communication"

MODULES = [
    {
        "id": "03",
        "name": "SSE - Server-Sent Events",
        "dir": "03-sse-server-sent-events",
        "schema": "const Joi = require('joi');\nconst sseEventSchema = Joi.object({\n  eventType: Joi.string().required(),\n  data: Joi.any().required(),\n  userId: Joi.string().optional()\n});\nmodule.exports = { sseEventSchema };",
        "controller": "class SSEController {\n  constructor() { this.clients = new Map(); }\n  addClient(userId, res) { this.clients.set(userId, res); res.write(':connected\\n\\n'); }\n  broadcast(event, data) { this.clients.forEach(res => res.write(`data: ${JSON.stringify({event,data})}\\n\\n`)); }\n  removeClient(userId) { this.clients.delete(userId); }\n}\nmodule.exports = SSEController;",
        "middleware": "module.exports = { sseAuth: (req,res,next) => { const uid = req.query.uid; if(!uid) return res.status(401).json({error:'UID required'}); req.userId = uid; next(); } };",
        "routes": "const express = require('express');\nconst SSEController = require('./controller');\nmodule.exports = (app) => { const sse = new SSEController(); const r = express.Router(); r.get('/stream', (req,res) => { res.setHeader('Content-Type','text/event-stream'); sse.addClient(req.query.id, res); res.on('close', () => sse.removeClient(req.query.id)); }); r.post('/send', (req,res) => { sse.broadcast(req.body.event, req.body.data); res.json({ok:true}); }); return r; };",
        "readme": "# SSE - Server-Sent Events\n\n## One-way server-to-client streaming\n\nSSE enables servers to push real-time events to clients via HTTP long-connections.\n\n### When to use\n- Stock tickers, notifications\n- Live feeds, status updates\n- No need for client→server messaging\n\n### Key Features\n- Automatic reconnection\n- Simple HTTP protocol\n- Works with any framework\n- Built-in browser support\n\n### Advantages over WebSocket\n- Simpler protocol\n- Automatic reconnection\n- Works through proxies\n- Better for unidirectional data",
        "theory": "# SSE Theory\n\n## Event Stream Format\n```\nevent: message\\ndata: {\"content\":\"hello\"}\\n\\n\n```\n\n## Browser API\n```javascript\nconst es = new EventSource('/stream?id=user1');\nes.addEventListener('message', (e) => console.log(e.data));\nes.close();\n```\n\n## Reconnection\n- Automatic after 3s timeout\n- Configurable retry-after header\n- Preserves event ID for missed events",
        "checklist": "- [ ] Create SSE endpoint\n- [ ] Implement client tracking\n- [ ] Add reconnection logic\n- [ ] Test with multiple clients\n- [ ] Verify event delivery\n- [ ] Add monitoring\n- [ ] Load test 1000+ clients\n- [ ] Production deployment"
    },
    {
        "id": "04",
        "name": "Socket Auth & JWT",
        "dir": "04-socket-auth-jwt-handshake",
        "schema": "const Joi = require('joi');\nconst tokenSchema = Joi.object({\n  token: Joi.string().required(),\n  refreshToken: Joi.string().optional()\n});\nmodule.exports = { tokenSchema };",
        "controller": "const jwt = require('jsonwebtoken');\nclass AuthController {\n  verifyToken(token) { try { return jwt.verify(token, process.env.JWT_SECRET); } catch(e) { return null; }}\n  generateToken(userId) { return jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '24h'}); }\n  handleAuth(socket) { const decoded = this.verifyToken(socket.handshake.auth.token); if(!decoded) throw new Error('Invalid'); socket.userId = decoded.userId; }\n}\nmodule.exports = AuthController;",
        "middleware": "module.exports = {\n  socketAuthMiddleware: (socket, next) => {\n    const token = socket.handshake.auth.token;\n    if (!token) return next(new Error('Token required'));\n    try {\n      const decoded = jwt.verify(token, process.env.JWT_SECRET);\n      socket.userId = decoded.userId;\n      next();\n    } catch (e) { next(new Error('Invalid token')); }\n  }\n};",
        "routes": "const express = require('express');\nconst jwt = require('jsonwebtoken');\nmodule.exports = () => {\n  const router = express.Router();\n  router.post('/login', (req,res) => {\n    const token = jwt.sign({userId: req.body.userId}, process.env.JWT_SECRET, {expiresIn: '24h'});\n    res.json({token});\n  });\n  return router;\n};",
        "readme": "# Socket Authentication & JWT\n\n## Secure WebSocket Connections\n\nImplement JWT-based authentication for Socket.io connections.\n\n### Features\n- Token validation on connect\n- Token refresh mechanism\n- User context propagation\n- Secure handshake\n\n### Best Practices\n- Use HTTPS/WSS only\n- Short token expiry\n- Rotate refresh tokens\n- Store securely on client",
        "theory": "# JWT Socket Auth\n\n## Token Flow\n1. Client logs in → receive JWT\n2. Connect with JWT in auth header\n3. Server validates on handshake\n4. User context attached to socket\n5. Token refresh on demand\n\n## Security\n- HMAC signature validation\n- Expiry checks\n- Blacklist revoked tokens\n- HttpOnly cookies for refresh",
        "checklist": "- [ ] Generate JWT on login\n- [ ] Validate on socket connect\n- [ ] Implement token refresh\n- [ ] Handle expiry\n- [ ] Test auth failures\n- [ ] Verify user isolation\n- [ ] Monitor token leaks\n- [ ] Production security review"
    },
    {
        "id": "05",
        "name": "Live Streaming Rooms",
        "dir": "05-live-streaming-rooms",
        "schema": "const Joi = require('joi');\nconst roomSchema = Joi.object({\n  roomId: Joi.string().required(),\n  name: Joi.string().required(),\n  isPrivate: Joi.boolean().default(false)\n});\nmodule.exports = { roomSchema };",
        "controller": "class RoomsController {\n  constructor(io) { this.io = io; this.rooms = new Map(); }\n  createRoom(id, data) { const r = {id, ...data, viewers:new Set(), createdAt:new Date()}; this.rooms.set(id, r); return r; }\n  handleJoin(socket, roomId) { socket.join(roomId); this.io.to(roomId).emit('user:joined', {socketId:socket.id}); }\n  handleLeave(socket, roomId) { socket.leave(roomId); this.io.to(roomId).emit('user:left', {socketId:socket.id}); }\n  listRooms() { return Array.from(this.rooms.values()); }\n}\nmodule.exports = RoomsController;",
        "middleware": "module.exports = { roomAuth: (req,res,next) => { if(!req.params.roomId) return res.status(400).json({error:'Room ID required'}); next(); } };",
        "routes": "const express = require('express'), RoomsController = require('./controller');\nmodule.exports = (app, server) => { const rc = new RoomsController(null); const r = express.Router(); r.post('/', (req,res) => { const room = rc.createRoom(req.body.id, req.body); res.json(room); }); r.get('/', (req,res) => res.json(rc.listRooms())); return r; };",
        "readme": "# Live Streaming Rooms\n\n##Isolated Real-Time Spaces\n\nCreate managed rooms for separate groups of users.\n\n### Features\n- Room creation/deletion\n- User join/leave tracking\n- Room-specific broadcasting\n- Private room support\n- Viewer count tracking\n\n### Use Cases\n- Live streams\n- Chat channels\n- Game lobbies\n- Collaborative sessions",
        "theory": "# Rooms Pattern\n\n## Architecture\nRooms organize sockets into groups. Broadcasting to a room only reaches members.\n\n## Operations\n- socket.join('room')\n- socket.leave('room')\n- io.to('room').emit()\n- socket.broadcast.to('room')\n\n## Memory Efficiency\nSocket.io maintains room membership efficiently with Sets.",
        "checklist": "- [ ] Create room model\n- [ ] Implement join handler\n- [ ] Implement leave handler\n- [ ] Track room members\n- [ ] Broadcast to room\n- [ ] Handle room deletion\n- [ ] Test multiple rooms\n- [ ] Monitor memory usage"
    }
]

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    return path

def generate(modules):
    for m in modules:
        base_dir = f"{BASE}/{m['dir']}"
        os.makedirs(base_dir, exist_ok=True)
        
        # Write files
        write_file(f"{base_dir}/schema.js", m["schema"])
        write_file(f"{base_dir}/controller.js", m["controller"])
        write_file(f"{base_dir}/middleware.js", m["middleware"])
        write_file(f"{base_dir}/routes.js", m["routes"])
        write_file(f"{base_dir}/README.md", m["readme"])
        write_file(f"{base_dir}/theory.md", m["theory"])
        write_file(f"{base_dir}/checklist.md", m["checklist"])
        write_file(f"{base_dir}/.env.example", "NODE_ENV=development\nPORT=4000\nLOG_LEVEL=info")
        write_file(f"{base_dir}/App.jsx", f"import React from 'react';\nexport default function {m['id']}App() {{ return <div><h1>{m['name']}</h1></div>; }}")
        
        print(f"✓ Generated {m['id']}: {m['name']}")

if __name__ == "__main__":
    generate(MODULES)
    print("\n✅ Complete!")
