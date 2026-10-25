# Technology Comparisons & Architectural Decisions

## 1. Runtime: Node.js vs Go vs Python vs Java

| Comparison Factor | Node.js (Used) | Go (Golang) | Python (FastAPI) | Java (Spring Boot) |
|---|---|---|---|---|
| **Concurrency Model** | Single-threaded Event Loop (libuv) | Lightweight Goroutines | AsyncIO Event Loop | Multi-threaded / Virtual Threads |
| **I/O Performance** | Exceptional for Non-Blocking I/O | Exceptional | Good | High |
| **CPU-Bound Tasks** | Poor (Requires Worker Threads) | Native Multi-threading | Poor (GIL limited) | Native Multi-threading |
| **Ecosystem Size** | Massive NPM Ecosystem | Rapidly Growing | Massive ML/AI | Massive Enterprise |

- **Why Node.js**: Unmatched developer productivity and lightning-fast non-blocking I/O for web services, real-time WebSockets, and JSON APIs. [CONFIRM WITH DEVELOPER]

---

## 2. Job Queue: BullMQ vs RabbitMQ vs Apache Kafka

| Comparison Factor | BullMQ (Redis-backed) | RabbitMQ | Apache Kafka |
|---|---|---|---|
| **Operational Overhead** | Extremely Low (Reuses Redis) | Moderate (Erlang cluster) | High (JVM, ZooKeeper/KRaft) |
| **Delayed & Cron Jobs** | Native First-Class Support | Requires Plugin | Not Designed for Delayed Jobs |
| **Throughput** | $10k-50k$ jobs/sec | $50k-100k$ msgs/sec | $1M+$ events/sec |

- **Why BullMQ**: Delivers delayed jobs, retries with backoff, and priority scheduling using existing Redis infrastructure without running dedicated message broker clusters.
