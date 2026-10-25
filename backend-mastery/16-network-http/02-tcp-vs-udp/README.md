# TCP vs UDP: Understanding Transport Protocols

## 🎯 What is This?
This module compares TCP and UDP, the two primary transport layer protocols. Understanding these is critical for:
- Choosing the right protocol for your application
- Optimizing network performance
- Understanding latency vs reliability trade-offs

## Key Learning Outcomes
- Understand TCP connection model (3-way handshake)
- Understand UDP connectionless model
- Know reliability trade-offs
- Choose appropriate protocol for use cases
- Understand when to use each

## 📊 Quick Comparison

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Required | Not needed |
| Reliability | 100% guaranteed | Best effort |
| Ordering | In-order | No guarantee |
| Speed | Slower | Faster |
| Overhead | High (acks) | Low (8 bytes) |
| Setup Time | 1 RTT (~50ms) | 0 RTT |
| Use Case | Web, Email, SSH | Gaming, VoIP, DNS |

## 🔧 How They Work

### TCP: Connection-Oriented
```
1. Connect (SYN → SYN-ACK → ACK)
2. Send data (DATA → ACK)
3. Receive data (DATA → ACK)
4. Close connection (FIN → ACK)
```

### UDP: Connectionless
```
1. Send datagram (fires immediately)
2. Receive datagram (if it arrives)
3. That's it!
```

## 📈 Performance Impact

**100 MB Download:**
- TCP: 85,000ms (reliable, slower)
- UDP: 65,000ms (fast, but 5% may be lost)

## Real-World Trade-offs

### Banking (TCP)
- Lost transaction = money lost
- Slight delay acceptable
- TCP's guarantee essential

### Skype Video (UDP)
- Lost frame = slight visualization glitch
- Users accept occasional artifacts
- Sub-100ms latency essential
- UDP's speed critical

## Summary
- Use TCP for anything critical (financial, file transfer)
- Use UDP for real-time (gaming, VoIP)
- Modern web moving to QUIC (UDP-based with TCP-like features)

