# Theory & Concepts
## Request Timeout Overview
Timeout middleware terminates requests that exceed a time limit, protecting server from slow/hung requests.

## Timeout Scenarios
- **Slow database query**: Query takes too long
- **External API**: Calling slow 3rd party API
- **Infinite loop**: Bug causes infinite processing
- **Resource leak**: Request holds resources
- **DOS attack**: Attacker sends slow requests

## Timeout Types
- **Request Timeout**: How long entire request can take (usually 30-120 seconds)
- **Socket Timeout**: TCP connection idle timeout
- **Keep-Alive Timeout**: Idle connection persistence

## Error Response
When timeout occurs, server responds with 408 Request Timeout and closes connection.

## Resource Protection
Timeout frees up resources:
- Database connections returned to pool
- Memory released
- File handles closed
- Socket cleaned up

## Configuration
Find right balance:
- **Too short**: Legitimate requests timeout
- **Too long**: Server gets stuck on slow requests
- **Different per endpoint**: Some need longer timeout
- **Typical**: 30 seconds for REST, varies for streaming

## Testing
Create intentionally slow endpoint, verify it times out. Monitor production for timeout frequency.

## Handling Timeouts
Client should retry or show error message. Logging timeouts helps identify slow endpoints.
