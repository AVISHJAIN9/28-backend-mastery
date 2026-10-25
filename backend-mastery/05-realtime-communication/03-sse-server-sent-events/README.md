# SSE - Server-Sent Events

## One-way server-to-client streaming

SSE enables servers to push real-time events to clients via HTTP long-connections.

### When to use
- Stock tickers, notifications
- Live feeds, status updates
- No need for client→server messaging

### Key Features
- Automatic reconnection
- Simple HTTP protocol
- Works with any framework
- Built-in browser support

### Advantages over WebSocket
- Simpler protocol
- Automatic reconnection
- Works through proxies
- Better for unidirectional data