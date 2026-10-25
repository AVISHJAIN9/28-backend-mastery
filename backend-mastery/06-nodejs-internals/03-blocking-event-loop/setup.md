# Blocking Event Loop - Setup & Measurement

## Installation

```bash
npm init -y
npm install event-loop-lag clinic
```

## Detecting Blocking

```javascript
const lag = require('event-loop-lag');

setInterval(() => {
  console.log(`Event loop lag: ${lag()}ms`);
}, 1000);
```

## Measurement Tools

### Clinic.js
```bash
clinic doctor -- node controller.js
```

### Custom Monitoring
```bash
node controller.js
# Observe lag output
```

## Load Testing

```bash
npm install -g autocannon
autocannon -d 30 -c 10 http://localhost:3000
```
