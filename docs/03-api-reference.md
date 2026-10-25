# API Reference: Core Architectural Endpoints

## 1. Authentication
- `POST /api/auth/login`: Authenticates user credentials; returns JWT access token and sets refresh cookie.
- `POST /api/auth/refresh`: Validates refresh token and issues fresh access token.
- `POST /api/auth/logout`: Revokes current access token into Redis blacklist.

## 2. Transactions & Payments
- `POST /api/transactions/transfer`: Executes double-entry fund transfer inside an atomic ACID session.

## 3. Observability
- `GET /metrics`: Exposes Prometheus-compatible operational metrics (HTTP duration, event loop lag, memory RSS).
- `GET /health`: Readiness and liveness health probe.
