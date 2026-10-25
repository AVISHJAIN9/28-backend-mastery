# Memory Leaks - Profiling Setup

## Installation

```bash
npm init -y
npm install clinic
```

## Profiling

### Using clinic.js
```bash
clinic doctor -- node controller.js
clinic bubble -- node controller.js
```

### Using Node.js prof
```bash
node --prof controller.js
node --prof-process isolate-*.log > output.txt
```

### Chrome DevTools
```bash
node --inspect controller.js
# Open chrome://inspect
```

## Heap Snapshot Analysis

Use DevTools to compare snapshots before/after.
