# Theory & Concepts
# Module 01: HTTP Versions (1.0, 1.1, 2, 3)

## Overview
HTTP (Hypertext Transfer Protocol) has evolved significantly since its inception. Understanding these versions helps you optimize web application performance and make informed decisions about protocol adoption.

---

## HTTP/1.0 (1996)

### Key Characteristics
- **Connection Model**: New TCP connection for each request
- **Request Format**: Simple text-based
- **Response Format**: Status line + headers + body
- **Caching**: Basic (no Cache-Control header)
- **Performance**: ~3-way handshake per request = high latency

### Limitations
```
Problem: Building a single web page requires multiple TCP connections
Website with 4 resources = 4 complete TCP handshakes
Time wasted on connection overhead, not data transfer
```

### Example Flow
```
1. Open connection to server
2. Send GET /index.html
3. Receive response
4. Close connection
5. Open NEW connection
6. Send GET /style.css
7. Receive response
8. Close connection
...and so on for each resource
```

---

## HTTP/1.1 (1997)

### Major Improvements

#### 1. **Keep-Alive (Persistent Connections)**
```javascript
// HTTP/1.1 default behavior
Connection: keep-alive
KeepAliveTimeout: 5s (default)

// Reuse same TCP connection for multiple requests
Request 1 → Response 1 (connection stays open)
Request 2 → Response 2 (same connection)
Request 3 → Response 3 (same connection)
```

**Impact**: 70-80% reduction in connection overhead.

#### 2. **Pipelining**
```
HTTP/1.1 Pipelining (not widely used in practice)
Send multiple requests without waiting for responses:

→ GET /index.html
→ GET /style.css
→ GET /script.js
← Response for index.html
← Response for style.css
← Response for script.js

Problem: Head-of-line blocking
If /index.html takes 5s, /style.css and /script.js must wait
```

#### 3. **Chunked Transfer Encoding**
```
Server can send response in chunks without knowing total size:
Transfer-Encoding: chunked

5\r\n
hello\r\n
6\r\n
 world\r\n
0\r\n
\r\n
```

#### 4. **Compression (gzip, deflate)**
```
Request:
Accept-Encoding: gzip, deflate

Response:
Content-Encoding: gzip
3.5MB asset → compresses to 1.2MB
Saves 65% bandwidth!
```

#### 5. **Virtual Hosting**
```
Host: example.com  ← Allows multiple sites on one IP
Host: another.com
```

### Real-World HTTP/1.1 Problem: 6-Connection Limit

Browsers impose ~6 parallel connections per domain (workaround: domain sharding)
```
webpage.com + css.webpage.com + img.webpage.com + js.webpage.com
Each domain gets 6 connections = 24 total

Problem: Hacky, adds complexity, doesn't scale
```

---

## HTTP/2 (2015)

### Revolutionary Changes

#### 1. **Multiplexing**
Multiple requests/responses on single TCP connection, frames interleaved:

```
HTTP/1.1 (6 connections):
Conn1: [req1][res1      ]
Conn2: [req2][res2   ]
Conn3: [req3][res3         ]
Conn4: [req4][res4]
Conn5: [req5][res5          ]
Conn6: [req6][res6     ]

HTTP/2 (1 connection):
[req1→req2→req3→req4→req5→req6]
[←res1][←res2][←res3][←res4][←res5][←res6]
```

**Benefit**: No head-of-line blocking between multiplexed streams.

#### 2. **Binary Framing Layer**
```
HTTP/1.1 sends plain text commands
HTTP/2 breaks everything into binary frames

{ type: 'HEADERS', streamId: 1, flags: 'END_STREAM' }
{ type: 'DATA', streamId: 1, data: '...' }
{ type: 'SETTINGS', settings: {...} }

Benefits:
- Efficient parsing (binary not text)
- Smaller frame sizes
- Better error handling
```

#### 3. **Server Push**
```
Client requests /index.html
Server KNOWS it needs /style.css and /script.js
Server PUSHES them before client asks:

→ GET /index.html
← /index.html
← PUSH /style.css (unsolicited)
← PUSH /script.js (unsolicited)
← /style.css data
← /script.js data

Timeline:
HTTP/1.1: 300ms (request) + 150ms (get css) + 150ms (get js) = 600ms
HTTP/2:   300ms all in parallel = 300ms
```

#### 4. **Header Compression (HPACK)**
```
HTTP/1.1 repeats headers on every request:
GET /api/user/1 HTTP/1.1
Host: api.example.com
User-Agent: Mozilla/5.0
Accept: */*
Referer: https://example.com/dashboard
Cookie: sessionId=abc123; userId=456; preferences=dark_mode
Accept-Encoding: gzip, deflate, br

GET /api/user/2 HTTP/1.1
Host: api.example.com           ← REPEATED
User-Agent: Mozilla/5.0         ← REPEATED
Accept: */*                      ← REPEATED
Referer: https://example.com/dashboard  ← REPEATED (mostly)
Cookie: sessionId=abc123; userId=456; preferences=dark_mode ← REPEATED
Accept-Encoding: gzip, deflate, br     ← REPEATED

HTTP/2 HPACK compression:
Common headers cached and sent as indices (1-5 bytes instead of 100+ bytes)
Result: 80-90% header reduction
```

#### 5. **Stream Prioritization**
```
Tell server which resources are most important:

Priority: CSS (high) - needed for rendering
Priority: JS (medium) - needed for interactivity
Priority: Images (low) - can load progressively

Server allocates bandwidth accordingly
```

### HTTP/2 Limitations
- **Still uses TCP**: Head-of-line blocking at TCP layer
- **Needs HTTPS**: All HTTP/2 implementations require TLS
- **Server Push Complexity**: Hard to predict what client needs

---

## HTTP/3 (2022)

### Built on QUIC Protocol

#### 1. **UDP Instead of TCP**
```
TCP requires connection setup (3-way handshake):
SYN → SYNACK → ACK (3 roundtrips = 30-100ms)

QUIC over UDP (0-RTT):
Can send data in first packet without waiting
```

#### 2. **Connection Migration**
```
User on WiFi, moves to 4G LTE mid-transfer
TCP: Connection breaks, must restart
QUIC: Connection persists using connection ID (not IP/port)
```

#### 3. **Independent Streams**
```
HTTP/2: TCP packet loss affects all streams
HTTP/3: UDP packet loss only affects that stream
Others continue unaffected (QUIC-level retransmission)
```

#### 4. **Independent Encryption**
```
Each stream can have independent encryption state
Enhanced security and performance
```

#### 5. **Performance Gains**
```
                     TCP        QUIC
Initial Handshake    TLS 1-RTT  0-RTT
Connection Setup     25-50ms    0-5ms
Packet Loss          ~20% perf hit  ~5% perf hit
Mobile Switching     Connection lost  Seamless

Example (mobile user):
HTTP/2: 2.5s load time
HTTP/3: 1.8s load time (28% faster)
```

### Browser Support
```
Chrome 43+        (2015+)
Edge 79+          (2020+)
Firefox 88+       (2021+)
Safari 16+        (2022+)
Coverage: ~80% of users
```

---

## Performance Comparison

### Empirical Data

#### Page Load Time (100 small resources, 5MB total)
```
HTTP/1.0:  2500ms  (extreme - serial connections)
HTTP/1.1:  ~800ms  (reuses connections, still 6-connection limit batches)
HTTP/2:    ~300ms  (multiplexing eliminates batching)
HTTP/3:    ~200ms  (QUIC optimizations)
```

#### Header Size (100 requests to same domain)
```
HTTP/1.1:  ~80KB headers + data
HTTP/2:    ~8KB headers (90% reduction)
HTTP/3:    ~8KB headers + QUIC overhead
```

#### Connection Overhead
```
                    Connections Needed    3-Way Handshake Time
HTTP/1.0 (50 assets)    50 connections        ~5000ms per page
HTTP/1.1 (50 assets)    9 connections         ~450ms per page
HTTP/2 (50 assets)      1 connection          ~100ms per page
HTTP/3 (50 assets)      1 connection          ~0-5ms per page
```
