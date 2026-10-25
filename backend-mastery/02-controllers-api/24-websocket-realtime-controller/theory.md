# WebSocket Theory

## Protocol Overview

### HTTP vs WebSocket
- HTTP: Request-response, stateless, client initiates
- WebSocket: Persistent connection, stateful, bi-directional

### WebSocket Handshake
- Client sends HTTP upgrade request
- Server accepts, connection upgraded to WebSocket
- Full-duplex communication established

### Message Types
- **Text**: JSON-encoded messages
- **Binary**: Raw binary data
- **Control**: Ping/Pong, close frames

## Scalability Considerations
- Memory: Each connection consumes memory
- Broadcast: Use pub-sub for multi-server scenarios
- Reconnection: Handle dropped connections gracefully
