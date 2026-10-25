# WebRTC - Peer-to-Peer Communication Theory

## What is WebRTC?

Web Real-Time Communication - browser technology for:
- Audio calls
- Video conferences
- Screen sharing
- Data channels
- P2P connections

## Direct P2P Connection

### Why P2P?
```
Traditional: Client ↔ Server ↔ Client (bandwidth x2)
P2P: Client ↔ Client (bandwidth x1, low latency)

Benefits:
- Lower latency (no server hop)
- Lower bandwidth
- More private (data doesn't traverse server)
- Scales better (no server bottleneck)
```

## WebRTC Architecture

### Signaling
```
Problem: Browsers don't know each other's IP/port
Solution: Exchange signaling messages via server

1. Caller creates offer (session description)
2. Sends offer to Callee via signaling server
3. Callee creates answer
4. Sends answer back to Caller
5. Both have session description
6. Ready for media
```

### ICE (Interactive Connectivity Establishment)
```
Problem: Network traversal, firewalls, NAT
Solution: Find route to reach peer

1. Gather local candidates (IP addresses)
2. Get STUN server candidates (public IP)
3. Send candidates to peer via signaling
4. Test connectivity:
   - Direct connection (best)
   - TURN relay (fallback)
5. Use best route
```

## Offer/Answer Model

### Step 1: Create Offer
```javascript
// Caller
const peerConnection = new RTCPeerConnection();
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Send offer to callee via signaling
socket.emit('signal:offer', {
  to: calleeId,
  offer: offer
});
```

### Step 2: Receive Offer & Create Answer
```javascript
// Callee
socket.on('signal:offer', async (data) => {
  const peerConnection = new RTCPeerConnection();
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(data.offer)
  );
  
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  
  // Send answer back
  socket.emit('signal:answer', {
    to: data.from,
    answer: answer
  });
});
```

### Step 3: ICE Candidates
```javascript
// Both sides send ICE candidates
peerConnection.addEventListener('icecandidate', (event) => {
  if (event.candidate) {
    socket.emit('signal:icecandidate', {
      candidate: event.candidate
    });
  }
});

// Receive and add ICE candidates
socket.on('signal:icecandidate', (data) => {
  peerConnection.addIceCandidate(
    new RTCIceCandidate(data.candidate)
  );
});
```

## STUN & TURN Servers

### STUN (Session Traversal Utilities for NAT)
```
Purpose: Find your public IP address
Query: "What's my public IP?"
Response: 203.0.113.45:51234

Cost: Free (usually)
Examples: stun.l.google.com, stun.services.mozilla.com
```

### TURN (Traversal Using Relays around NAT)
```
Purpose: Relay data if P2P fails
Path: Client1 → TURN Server ← Client2

Used as fallback when:
- Both behind different NATs
- Restrictive firewalls
- Corporate networks

Cost: Pay per GB relayed (~$1-5 per GB)
```

## Media Streams

### Adding Constraints
```javascript
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 }
  }
};

const stream = await navigator.mediaDevices
  .getUserMedia(constraints);
```

### Adding Tracks
```javascript
const audioTrack = stream.getAudioTracks()[0];
const videoTrack = stream.getVideoTracks()[0];

peerConnection.addTrack(audioTrack, stream);
peerConnection.addTrack(videoTrack, stream);

// Receive remote tracks
peerConnection.addEventListener('track', (event) => {
  remoteVideo.srcObject = event.streams[0];
});
```

## Connection States

### ICE Connection States
```
new → checking → connected → completed → disconnected
└─→ failed
└─→ closed

connected = can send/receive data
failed = cannot establish connection
```

### Connection Health
```javascript
peerConnection.addEventListener('connectionstatechange', () => {
  switch (peerConnection.connectionState) {
    case 'connected':
      console.log('Call established');
      break;
    case 'disconnected':
      console.log('Call disconnected');
      recover();
      break;
    case 'failed':
      console.log('Call failed');
      endCall();
      break;
  }
});
```

## Data Channels

### Arbitrary Data Transfer
```javascript
const dataChannel = peerConnection.createDataChannel('chat');

dataChannel.addEventListener('message', (event) => {
  console.log('Message:', event.data);
});

dataChannel.send('Hello from sender');
```

## Performance Metrics

### Gathering ICE Candidates
```
Time: 1-5 seconds typically
Depends on:
- Network configuration
- Number of available candidates
- STUN/TURN server speed

If takes > 30s, likely connection failure
```

### Latency
```
P2P direct: 10-50ms (excellent)
P2P relayed: 50-100ms (good)
Server-based: 100-300ms (acceptable)
```

## Security

### DTLS (Datagram Transport Layer Security)
```
All peer connections encrypted
Certificates automatically generated
No need for manual certificate setup
```

### Limitations
```
Audio/video streams encrypted
Signaling server unencrypted (HTTPS recommended)
Peer discovery via server (privacy concern)
```

## Best Practices

✅ Use STUN/TURN configuration
✅ Handle ice candidate trickling
✅ Monitor connection state
✅ Implement reconnection logic
✅ Test with restrictive networks
✅ Handle media permissions
✅ Implement timeout fallbacks
✅ Log connection metrics
✅ Test on real devices
✅ Handle browser incompatibilities
