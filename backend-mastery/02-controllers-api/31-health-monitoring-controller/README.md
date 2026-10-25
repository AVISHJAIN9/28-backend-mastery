# Health Monitoring Controller

## What is this?

Health checks and metrics monitoring for system reliability.

## Features
- Liveness probes
- Readiness probes
- Metrics collection
- Prometheus integration

## Why does it matter?

Health monitoring enables orchestration platforms to manage service lifecycles.

## How it works

1. Health check requested
2. Check internal state
3. Check dependencies (DB, cache)
4. Return status
5. Orchestrator takes action

## Real world usage

- Kubernetes health checks
- Load balancer checks
- Monitoring and alerting
- Auto-scaling triggers
