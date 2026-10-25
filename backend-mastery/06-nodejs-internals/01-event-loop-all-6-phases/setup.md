# Event Loop - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev clinic chai mocha
```

## Running Examples

```bash
# Monitor event loop
node controller.js

# Profile with clinic
clinic doctor -- node controller.js

# Run tests
npm test
```

## Profiling Tools

### Node.js Built-in
```bash
node --prof controller.js
node --prof-process isolate-*.log > output.txt
```

### Clinic.js
```bash
npm install -g clinic
clinic doctor -- node controller.js
clinic flame -- node controller.js
```

## Key Experiments

1. Timer delays and actual execution
2. Phase order with mixed callbacks
3. Event loop blocking detection
4. Microtask starvation scenarios
