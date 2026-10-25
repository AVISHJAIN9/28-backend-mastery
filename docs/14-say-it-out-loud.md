# Say It Out Loud: Spoken Interview Scripts

## Project Pitch (60 Seconds)
> "I built Backend Mastery, an exhaustive systems architecture reference spanning 30 core domains of server-side engineering. Built with Node.js, TypeScript, Express, MongoDB, and Redis, it details the engineering mechanics of high-throughput systems: from libuv event loops and memory leak profiling to double-entry FinTech ledgers, BullMQ job queues, and zero-downtime multi-tenant SaaS architectures."

## Feature Scripts
### F1: Distributed Authentication
> "In `01-authentication`, I implemented enterprise authentication. It utilizes a dual-token strategy: a short-lived 15-minute JWT access token and an httpOnly refresh cookie. To support instant revocation without sacrificing statelessness, logged-out tokens are stored in Redis with a TTL matching the token lifetime, ensuring compromised sessions are revoked immediately."

### F2: Real-Time WebSockets
> "In `05-realtime-communication`, I built a horizontally scalable WebSocket mesh using Socket.IO and the Redis adapter. When a message is sent in a chat room, the local server publishes the event to Redis, which broadcasts it across all Node instances in the cluster so clients connected to any server receive the event instantly."
