# Health Monitoring Theory

## Health Check Types
- **Liveness**: Is process alive? Used to restart dead services
- **Readiness**: Can serve traffic? Used for load balancing
- **Startup**: Did initialization complete? Used to delay checks

## Metrics
- Request count
- Error rate
- Response time
- Resource usage (CPU, memory)
- Cache hit rate

## Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **AlertManager**: Alert routing
