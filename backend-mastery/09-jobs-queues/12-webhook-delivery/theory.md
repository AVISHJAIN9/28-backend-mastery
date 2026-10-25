# Webhook Delivery - Theory

## Overview
Webhooks are HTTP callbacks that deliver asynchronous events to external systems with reliability guarantees.

## Webhook Lifecycle
1. Event occurs
2. Webhook queued as background job
3. HTTP POST sent to webhook URL
4. Response received and validated
5. Retry if failed (exponential backoff)

## Security Considerations
- HMAC signature verification
- Timestamp validation
- Webhook secret management
- HTTPS enforcement

## Delivery Guarantees
- **At-least-once** - May deliver multiple times
- **Exactly-once** - Requires idempotency
- **At-most-once** - May lose events

## Common Webhook Events
- user.created
- order.completed
- payment.processed
- subscription.updated