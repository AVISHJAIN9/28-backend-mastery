# Server-Sent Events - Theory & Use Cases

## What is SSE?

Server-Sent Events (SSE) is a web standard for one-way server-to-client communication over HTTP. Unlike WebSocket which is bidirectional, SSE is purely unidirectional: server pushes data to client.

## HTTP vs SSE vs WebSocket

| Feature | HTTP | SSE | WebSocket |
|---------|------|-----|-----------|
| Direction | Request → Response | Server → Client | Bidirectional |
| Connection | Closes after response | Persistent (long-lived) | Persistent |
| Protocol | HTTP/1.1 | HTTP/1.1 | Upgraded protocol |
| Proxies/Firewalls | Works everywhere | Works most places | May be blocked |
| CPU Usage | Low (per request) | Low (polling) | Medium |
| Use Case | Static responses | Server push, unidirectional | Real-time chat |

## Event Stream Format

SSE uses a simple text-based format:

```
event: message_type
data: {"id": 1, "content": "Hello"}
retry: 5000
id: 1

:this is a comment
data: line 1
data: line 2

event: ping
data: keep-alive
```

### Field Meanings
- `event` - Event type name (optional, default "message")
- `data` - Payload (can be multiple lines)
- `id` - Event ID for reconnection
- `retry` - Milliseconds before client retries connection
- `:` - Comment (ignored by client)

## Connection Management

### Client Connection
```javascript
const source = new EventSource('/api/stream?userId=123');

// Listen for any event
source.addEventListener('message', (e) => {
  console.log('Data:', e.data);
});

// Listen for specific event
source.addEventListener('custom_event', (e) => {
  console.log('Custom:', e.data);
});

// Error handling
source.addEventListener('error', (e) => {
  if (e.readyState === EventSource.CLOSED) {
    console.log('Connection closed');
  }
});

// Cleanup
source.close();
```

### Server Connection
```javascript
// HTTP Headers
response.writeHead(200, {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
});

// Send event
response.write('event: message
');
response.write('data: {"content":"hello"}
');
response.write('id: 1
');
response.write('
');

// Heartbeat every 30s
setInterval(() => {
  response.write(':heartbeat

');
}, 30000);

// Cleanup on close
response.on('close', () => {
  clearInterval(heartbeat);
});
```

## Automatic Reconnection

SSE provides built-in reconnection:

```
1. Connection established
2. Server sends events successfully
3. Connection drops (network/server issue)
4. Browser waits for retry interval
5. Automatically reconnects
6. Server receives reconnection request with last event ID
7. Server can resend missed events
```

### Event ID Tracking
```javascript
// Server
let eventId = 1;
response.write(`id: ${eventId++}

`);

// Client receives
source.addEventListener('message', (e) => {
  console.log('Event ID:', e.lastEventId);
  // If reconnect, lastEventId contains last received ID
});
```

## Use Cases

### 1. Live Notifications
```
Notification Server → Multiple clients
Each client gets notifications instantly
No client-to-server communication needed
```

### 2. Activity Feed
```
Message Feed → Web Browser
New posts/likes streamed to feed
Chronological order maintained
```

### 3. Stock Ticker
```
Price Updates → Dashboard
Continuous price updates
One-way data flow
```

### 4. Logs/Monitoring
```
Application Logs → Console
Stream server logs to browser
Live debugging capability
```

### 5. Push Alerts
```
System Alerts → Users
Critical system notifications
Real-time status updates
```

## Advantages Over WebSocket

✅ **Simpler Protocol** - Standard HTTP, no protocol upgrade
✅ **Works Through Proxies** - Standard HTTP proxy support
✅ **Lower Latency** - No connection handshake delay
✅ **Fallback Support** - Built-in polling fallback
✅ **Less Code** - Browser handles most complexity
✅ **Better Browser Support** - Works in IE 10+

## Disadvantages vs WebSocket

❌ **No Client→Server** - Can't send data over SSE
❌ **Connection Per User** - One connection per client
❌ **No Binary Data** - Only text/UTF-8
❌ **Max 6 Connections** - Browser limits concurrent SSE connections
❌ **No Message Ordering Guarantee** - Under heavy load

## Performance Characteristics

### Memory Usage
```
Per connection: ~50-100KB base
+ Event data in buffer
10,000 connections ≈ 500MB-1GB
```

### CPU Usage
```
Low: ~1-5% per 1000 connections
Mainly I/O bound (network, not CPU)
```

### Bandwidth
```
Connection established: ~1KB headers
Per event: 2 bytes overhead + payload
Heartbeat: ~50 bytes every 30s
```

## Best Practices

✅ Always set Content-Type header correctly
✅ Implement heartbeat to detect dead connections
✅ Use event IDs for missed event recovery
✅ Set reasonable retry intervals (3-5 seconds)
✅ Handle reconnections gracefully
✅ Monitor connection count
✅ Implement rate limiting per user
✅ Clean up old connections after timeout
✅ Test with network failures
✅ Consider SSE + WebSocket hybrid approach
