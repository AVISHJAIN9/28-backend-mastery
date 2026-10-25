# Circuit Breaker Theory

## States
- **Closed**: Normal operation, requests pass through
- **Open**: Failing, requests rejected immediately
- **Half-Open**: Testing recovery, limited requests allowed

## Transitions
- Closed → Open: Failure threshold reached
- Open → Half-Open: Timeout elapsed
- Half-Open → Closed: Success threshold reached
- Half-Open → Open: Failures continue

## Benefits
- Prevents cascading failures
- Fail fast (no timeouts)
- Allows recovery time
- Provides fallback behavior
