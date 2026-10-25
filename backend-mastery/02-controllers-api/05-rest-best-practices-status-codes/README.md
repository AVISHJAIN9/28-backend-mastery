# REST Best Practices & HTTP Status Codes

## What is this?

This module demonstrates correct HTTP status code usage and REST API best practices for building consistent, predictable APIs that clients can rely on.

- **Correct status codes** for different scenarios
- **Status code families** (1xx, 2xx, 3xx, 4xx, 5xx)
- **Error response standardization**
- **Resource versioning** strategies
- **Content negotiation** (JSON, XML, etc.)

## Why does it matter?

HTTP status codes are a contract between client and server:
- **200 for success** tells client to process response
- **400 for validation error** tells client to check input
- **404 for not found** prevents infinite retries
- **500 for server error** tells client to retry later

Using wrong status codes breaks client logic and causes frustration.

## Key concepts

### Status Code Families

- **1xx (Informational)**: 100 Continue, 101 Switching Protocols
- **2xx (Success)**: 200 OK, 201 Created, 204 No Content
- **3xx (Redirection)**: 301 Moved, 302 Found, 304 Not Modified
- **4xx (Client Error)**: 400 Bad Request, 401 Unauthorized, 404 Not Found
- **5xx (Server Error)**: 500 Internal Error, 503 Service Unavailable

## Real world usage

- All production APIs must follow status code conventions
- Stripe, Twilio, GitHub all use standard status codes
- Incorrect codes break automated integration tests
