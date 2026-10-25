# Rate Limiting & Throttling - Theory

## Overview
Rate limiting controls the rate at which jobs enter the system to prevent overload and manage resources.

## Algorithms
- **Token Bucket** - Fixed token generation rate
- **Sliding Window** - Time-based window of allowed requests
- **Leaky Bucket** - Constant outflow rate
- **Fixed Window** - Resets count at time intervals

## Rate Limiting Strategies
- Per-user limits
- Per-IP limits
- Global limits
- Priority-based throttling

## Key Metrics
- Requests per second (RPS)
- Requests per minute (RPM)
- Burst allowance
- Refill rate

## Use Cases
- API rate limiting
- Preventing DDoS
- Resource protection
- Cost control