# Buffers & Streams - Setup & Testing

## Installation

```bash
npm init -y
npm install --save-dev mocha chai
```

## Creating Test Files

```bash
# Create test data
dd if=/dev/zero of=testfile.bin bs=1M count=100
```

## Running Examples

```bash
node controller.js
npm test
```

## Memory Monitoring

```bash
node --max-old-space-size=256 controller.js
```

## Testing Backpressure

Stream large files and observe memory usage.
