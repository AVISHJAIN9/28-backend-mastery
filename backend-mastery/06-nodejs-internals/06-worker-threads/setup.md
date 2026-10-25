# Worker Threads - Setup & Benchmarking

## Installation

```bash
npm init -y
npm install piscina
```

## Creating Workers

```bash
# Create worker.js
touch worker.js
```

## Benchmarking

```bash
node controller.js
# Observe timing differences
```

## Memory Monitoring

```bash
node --inspect controller.js
# Open chrome://inspect in DevTools
```

## Load Testing

Run CPU-intensive tasks with and without workers.
