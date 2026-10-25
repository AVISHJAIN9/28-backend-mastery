# TCP vs UDP: Transport Layer Protocols

## Overview
TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are the two primary transport layer protocols that applications use to send data. Understanding their differences is fundamental to network programming.

## TCP (Transmission Control Protocol)

### Connection Model
TCP uses a **connection-oriented** model:
- Must establish connection first (3-way handshake)
- Connection is maintained throughout communication
- Must close connection explicitly

### 3-Way Handshake (SYN, SYN-ACK, ACK)
```
Client                                  Server
  |  SYN=1, seq=x                        |
  |------------------------------------>|
  |    SYN=1, ACK=1, seq=y, ack=x+1    |
  |<------------------------------------|
  |    ACK=1, seq=x+1, ack=y+1         |
  |------------------------------------>|
  |         Connection Established       |
```

Time cost: 1 RTT (25-100ms) just to open connection

### Reliability Features
1. **Acknowledgments**: Every segment acknowledged
2. **Retransmission**: Lost segments retransmitted
3. **Packet Ordering**: Delivered in-order
4. **Flow Control**: Windowing prevents overwhelming receiver
5. **Congestion Control**: Backs off when network congested

### Header Size
20 bytes minimum (can be up to 60 with options)

### Use Cases
- Email (SMTP, POP3, IMAP)
- Web (HTTP, HTTPS)
- File Transfer (FTP, SFTP)
- Remote Access (SSH, Telnet)
- Databases
- Any application prioritizing reliability over speed

### Pros
✅ Guaranteed delivery
✅ In-order delivery
✅ Flow control
✅ Congestion control
✅ Connection state tracking (knows when peer disconnects)

### Cons
❌ Slower (overhead of reliability)
❌ Higher bandwidth usage (acks, retransmissions)
❌ Connection setup latency
❌ Connection teardown latency

---

## UDP (User Datagram Protocol)

### Connection Model
UDP is **connectionless**:
- No connection setup required
- Fire-and-forget delivery model
- No connection state maintained

### Characteristics
- **No Handshake**: Send immediately
- **No Acknowledgments**: Don't know if received
- **No Retransmission**: Lost packets gone forever
- **No Ordering**: Packets may arrive out of order
- **No Flow Control**: Send at any rate
- **No Congestion Control**: Doesn't back off

### Header Size
8 bytes (very minimal)

### Use Cases
- DNS queries
- Streaming (Video, Audio)
- Online Gaming
- VoIP (Voice over IP)
- Live Broadcasting
- SNMP Monitoring
- IoT sensors
- Any real-time application

### Pros
✅ Fast (no handshake, minimal processing)
✅ Low latency
✅ Low bandwidth overhead
✅ Minimal CPU usage
✅ Good for broadcasts/multicasts

### Cons
❌ No delivery guarantee
❌ No ordering guarantee
❌ No congestion control (can overwhelm network)
❌ No flow control
❌ Difficult to detect disconnection

---

## Detailed Comparison

### Connection Setup
```
TCP:
SYN → SYN-ACK → ACK (3 packets, 1 RTT minimum, 25-100ms)

UDP:
Send immediately (0 RTT, can send in first packet)
```

### Packet Loss Scenario
```
TCP Behavior:
Packet 1: SENT → retransmit after 100ms if no ACK
Packet 1: RETRANSMITTED → received successfully
Packet 2: SENT → never lost...
Result: All data eventually delivered

UDP Behavior:
Packet 1: SENT → loss, never retransmitted
Packet 2: SENT → successfully delivered
Packet 3: SENT → lost, never retransmitted
Result: Packets 1 & 3 lost forever
```

### Bandwidth Usage
```
TCP:
Data: 100 bytes
+ TCP Header: 20 bytes
+ Acknowledgments: 20 bytes per ack
+ Potential Retransmissions: duplicates
Total: Can be 2-3x the actual data size

UDP:
Data: 100 bytes
+ UDP Header: 8 bytes
+ No Acks: nothing
+ No Retransmissions: nothing
Total: 108 bytes overhead
```

### Latency
```
HTTP request with TCP:
25ms connection setup
100ms HTTP roundtrip
Total: 125ms minimum

UDP DNS query:
Immediate send (0ms setup)
50ms network latency
Total: 50ms minimum (60% faster!)
```

---

## When to Choose Each

### Choose TCP When:
- **Data Integrity**: Cannot lose data (banking, healthcare)
- **Ordering Matters**: Data sequence important (file transfer)
- **Connection State**: Need to know if peer disconnected
- **Flow Control Needed**: Can't overwhelm receiver
- **Congestion Control**: Want to share network fairly

**Examples**: HTTP, HTTPS, Email, SSH, FTP, Database, any transaction system

### Choose UDP When:
- **Real-Time Critical**: Latency more important than reliability
- **Packet Loss Acceptable**: Losing 1-2% is OK (voice still understandable)
- **Low Overhead**: Bandwidth limited (mobile, IoT)
- **Multicast/Broadcast**: Sending to multiple receivers
- **Stateless**: Don't need connection tracking

**Examples**: VoIP, gaming, streaming, DNS, live video, IoT sensors

---

## Hybrid Approaches

### QUIC (HTTP/3)
Built on UDP but adds:
- Connection concept (for state tracking)
- Reliability where needed (retransmissions)
- Congestion control
- Multiplexing
- 0-RTT handshake

### Reliable UDP (Games)
UDP base + custom:
- Selective retransmissions
- Sequence numbers for ordering
- Lighter than TCP

---

## Performance Comparison

### Scenario: 10 MB File Transfer

**TCP (reliable HTTP/1.1)**
- Connection setup: 50ms
- Transfer: 10,000 ms (limited by network)
- Retransmissions: ~5% loss = 500ms additional
- Total: 10,550ms

**UDP (raw, no congestion control)**
- Setup: 0ms
- Transfer: 8,000ms (can send faster, less overhead)
- Lost packets: ~50 packets (5% loss at 10 Mbps)
- Total: 8,000ms (but missing 5%)

**UDP with reliability layer** (like QUIC)
- Setup: 5ms (faster than TCP)
- Transfer: 8,000ms
- Recovery for missing: 50ms
- Total: 8,055ms (complete + faster!)

---

## Real-World Examples

### Video Streaming (YouTube)
- Uses TCP (DASH/HLS) for stability
- Accepts temporary buffering over packet loss
- Trade-off: Better user experience > real-time

### Live Streaming (Twitch)
- Uses RTMP (over TCP)
- Slight latency (5-10s) acceptable
- Reliability > 0-RTT

### FaceTime/Skype
- Primary: UDP (0 RTT, low latency)
- Fallback: TCP (if UDP blocked)
- Choice: Speed > occasional drops,  user doesn't notice

### Online Gaming (CS:GO, Fortnite)
- Uses custom UDP protocol
- 60+ updates/second
- Packet loss < 1% acceptable
- Latency critical (shooter games unplayable above 200ms)

### DNS
- Uses UDP (port 53)
- 512 byte limit historically
- If timeout, client retries
- Ultra-fast lookup critical
- Rare timeout acceptable

---

## TCP vs UDP in Modern Protocols

| Protocol | Transport | Why |
|----------|-----------|-----|
| HTTP/1.1 | TCP | Reliability needed for web |
| HTTP/2 | TCP | Single connection multiplexing |
| HTTP/3 | UDP (QUIC) | 0-RTT handshake, mobile friendly |
| HTTPS | TCP | Encrypted, reliable |
| DNS | UDP | Fast lookups, retries |
| VoIP (SIP) | UDP | Real-time communication |
| Game updates | TCP | Critical data reliable |
| Game physics | UDP | High-frequency, loss OK |
| Email | TCP | Data integrity necessary |
| NTP (time sync) | UDP | Eventual consistency OK |

---

## TCP Tuning Parameters

### Buffer Sizes
```
SO_SNDBUF: Send buffer size (affects bandwidth)
SO_RCVBUF: Receive buffer size (affects loss tolerance)
TCP_WINDOW_SCALE: For high-bandwidth connections
```

### Timeouts
```
SO_KEEPALIVE: Detect dead connections
TCP_KEEPIDLE: Time before keepalive starts (2 hours)
TCP_KEEPINTVL: Keepalive interval (75 seconds)
```

### Congestion Control
```
TCP_CONGESTION: Algorithm (reno, cubic, bbr)
tcp_notsent_lowat: Amount to buffer
```

---

## Summary
- **TCP**: Choose when you need reliability, ordering, and congestion control
- **UDP**: Choose when you need speed and can tolerate some loss
- **Modern Web**: Moving toward QUIC (UDP-based) for 0-RTT and better mobile support
- **Trade-off**: Reliability vs Latency (TCP/UDP at opposite ends of spectrum)

