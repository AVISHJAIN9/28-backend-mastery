# Project Map: 34-backend-mastery

## Folder Structure
```
34-backend-mastery/
├── docs/                               # Comprehensive VitePress Documentation Suite
└── backend-mastery/                    # 30 Production Backend Architecture Modules
    ├── 01-authentication/              # JWT, OAuth2, Sessions, RBAC, MFA
    ├── 02-controllers-api/             # Clean controllers, REST contracts, pagination
    ├── 03-middleware/                  # Error handlers, rate limiting, request tracing
    ├── 04-models-database/             # Mongoose schemas, indexes, aggregation, ACID
    ├── 05-realtime-communication/      # Socket.IO, WebSockets, SSE, presence
    ├── 06-nodejs-internals/            # Event loop, libuv, streams, buffers, workers
    ├── 07-security/                    # OWASP Top 10, CORS, Helmet, sanitization
    ├── 08-caching/                     # Redis cache-aside, write-through, invalidation
    ├── 09-jobs-queues/                 # BullMQ, background workers, DLQ, cron
    ├── 10-observability/               # Pino structured logging, Prometheus, tracing
    ├── 11-testing/                     # Jest, Supertest, unit & integration tests
    ├── 12-devops-cicd/                 # Docker, GitHub Actions, rolling deploys
    ├── 13-typescript-deep/             # Generics, utility types, strict interfaces
    ├── 14-design-patterns/             # Factory, Singleton, Observer, Strategy
    ├── 15-algorithms-dsa/              # Rate limit algorithms, bloom filters, LRU
    ├── 16-network-http/                # HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS handshakes
    ├── 17-linux-os/                    # Signals, file descriptors, process management
    ├── 18-cryptography/                # AES-GCM, RSA, HMAC, bcrypt, PBKDF2
    ├── 19-payments-fintech/            # Double-entry ledger, Stripe webhooks, idempotency
    ├── 20-code-quality-git/            # Conventional commits, ESLint, Prettier
    ├── 21-services-integrations/       # External API wrappers, circuit breakers
    ├── 22-compliance-privacy/          # GDPR, data retention, PII masking
    ├── 23-i18n/                        # Localization, timezone handling, UTC normalization
    ├── 24-architecture-patterns/       # Hexagonal, Clean, Event-Driven, Microservices
    ├── 25-file-media-storage/          # Multer, S3 pre-signed URLs, streaming uploads
    ├── 26-notifications-communication/ # Omnichannel dispatch, SendGrid, Twilio
    ├── 28-real-world-patterns/         # Outbox pattern, Saga pattern, idempotency keys
    ├── 29-ai-ml-backend/               # Vector embeddings, LLM streaming, Python sidecars
    └── 30-saas-multitenancy/           # Tenant isolation, dynamic connection pooling
```

## Tech Stack & Dependencies
- `node >= 20.0.0`: Modern LTS runtime.
- `express`: Core routing and middleware framework.
- `mongoose`: MongoDB object modeling.
- `ioredis`: Redis client for caching and pub/sub.
- `jsonwebtoken`: Stateless authentication.
- `pino`: Ultra-low overhead structured JSON logging.
