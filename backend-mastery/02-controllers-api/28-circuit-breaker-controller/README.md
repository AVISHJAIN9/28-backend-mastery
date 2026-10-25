# Circuit Breaker Controller

## What is this?

Circuit breaker pattern for handling external service failures gracefully.

## Features
- Failure detection
- Open/Closed/Half-open states
- Automatic recovery
- Fallback responses

## Why does it matter?

Circuit breakers prevent cascading failures and allow graceful degradation.

## How it works

1. Call external service
2. Track failures
3. Open circuit when threshold exceeded
4. Return fallback immediately
5. Periodically test recovery

## Real world usage

- Third-party API integration
- Database failover
- Service mesh communication
- Cascading failure prevention
