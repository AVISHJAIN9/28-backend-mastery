# Architecture Decisions Log (ADR)

| Decision | Chosen Option | Alternative Considered | Deciding Factor |
|---|---|---|---|
| **Runtime** | Node.js 20+ | Python Django | Event loop non-blocking I/O efficiency for concurrent WebSocket connections. |
| **Job Queue** | BullMQ | Apache Kafka | Native delayed jobs and low operational overhead using existing Redis instances. |
| **Logging** | Pino | Winston | Ultra-low CPU overhead and structured JSON output for log aggregators. |
