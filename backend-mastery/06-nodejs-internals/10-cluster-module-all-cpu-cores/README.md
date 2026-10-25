# Cluster Module - Using All CPU Cores

## What You'll Learn

- Master/worker architecture
- Load balancing across cores
- Worker restarts and resilience
- Zero-downtime deployments
- Shared state patterns

## Module Contents

- **theory.md**: Clustering concepts
- **controller.js**: Implementation examples
- **setup.md**: Setup and benchmarking
- **checklist.md**: Deployment checklist

## Performance Gains

- Single core: 100% utilization
- 8 cores: ~70-80% utilization
- Throughput: ~5-6x on 8 cores
- Low latency maintained

## Key Patterns

- Worker auto-restart
- Graceful reload
- Sticky sessions
- Shared cache (Redis)
