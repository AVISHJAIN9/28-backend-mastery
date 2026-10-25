# Theory & Concepts
## HTTP Request Logging Overview
Morgan logs HTTP requests/responses including method, URL, status code, response time, and client info. Useful for debugging, monitoring, and audit trails.

## Log Information Captured
- **HTTP Method**: GET, POST, PUT, DELETE, PATCH
- **URL**: Request path and query string
- **Response Status**: 200, 404, 500, etc
- **Response Size**: Bytes sent to client
- **Response Time**: Milliseconds to process
- **Client IP**: Who made the request
- **User-Agent**: Browser/client type
- **Timestamp**: When request occurred

## Log Formats
- **dev**: Colored, concise (perfect for development)
- **combined**: Apache combined format (most detailed)
- **common**: Apache common format
- **short**: Minimal information
- **tiny**: Very minimal

## Destinations
- **Console**: stdout for development
- **File**: Write to access.log for persistence
- **Stream**: Pipe to log aggregation service
- **Service**: Send to ELK, Splunk, DataDog

## Use Cases
- Debugging: See what request caused the error
- Monitoring: Track API usage and performance
- Audit: Compliance and security logging
- Analytics: Usage patterns and trends

## Privacy Considerations
- Don't log passwords, API keys, tokens
- Be careful with PII (personally identifiable info)
- Comply with GDPR, HIPAA regulations
- Rotate and purge old logs
