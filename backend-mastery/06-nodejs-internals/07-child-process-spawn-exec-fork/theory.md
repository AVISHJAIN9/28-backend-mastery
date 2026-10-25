# Child Process - spawn, exec, fork Theory

## What is Child Process?

Starting a separate process from Node.js.

### Use Cases
```
- Run system commands (ffmpeg, ImageMagick)
- Execute other languages (Python, Ruby)
- Long-running tasks
- Process isolation
```

## The 4 Methods

### 1. spawn() - Stream-Based

Best for large data/streaming

```javascript
const { spawn } = require('child_process');

const child = spawn('ls', ['-l']);

child.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});
```

### 2. exec() - Full Output in Callback

Best for small commands

```javascript
const { exec } = require('child_process');

exec('ls -l', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
```

### 3. execFile() - No Shell

Like exec() but no shell overhead

```javascript
const { execFile } = require('child_process');

execFile('node', ['script.js'], (err, stdout) => {
  console.log(stdout);
});
```

### 4. fork() - Node to Node

Spawns another Node.js process with IPC channel

```javascript
const { fork } = require('child_process');

const child = fork('./child.js');

child.send({ hello: 'world' });
child.on('message', (msg) => {
  console.log(msg);
});
```

## spawn() Deep Dive

### Streaming Output
```javascript
const { spawn } = require('child_process');

const ls = spawn('ls');
ls.stdout.pipe(process.stdout);
```

### Handling Events
```javascript
spawn('ls')
  .on('close', (code) => {
    console.log(`Process exited with code ${code}`);
  })
  .on('error', (err) => {
    console.error('Failed to start:', err);
  });
```

### Large Output
```javascript
// Good for video encoding, file processing
spawn('ffmpeg', [
  '-i', 'input.mp4',
  '-c:v', 'libx264',
  'output.mp4'
]).on('exit', () => {
  console.log('Encoding done');
});
```

## exec() vs execFile()

### exec() - With Shell
```javascript
exec('cat file.txt | grep "pattern"', (err, stdout) => {
  // Shell pipes work
});

// ⚠️ Shell injection risk
// exec(`cat ${filename}`) // UNSAFE!
```

### execFile() - No Shell
```javascript
execFile('grep', ['pattern', 'file.txt'], (err, stdout) => {
  // Faster, no shell overhead
});

// Safer from injection
```

## fork() for Node Modules

### Child Process
```javascript
// child.js
process.on('message', (msg) => {
  console.log('Message from parent:', msg);
  
  // Send back result
  process.send({
    result: msg.value * 2,
    processId: process.pid
  });
});
```

### Parent Process
```javascript
// parent.js
const { fork } = require('child_process');

const child = fork('./child.js');

child.send({ value: 10 });
child.on('message', (msg) => {
  console.log('Received:', msg.result); // 20
});
```

## Output Handling

### Buffer Limit
```javascript
// exec() has 200KB default buffer
exec('huge_command', (err, stdout, stderr) => {
  // Output > 200KB = error
});

// spawn() has no limit (streams output)
spawn('huge_command').stdout.pipe(process.stdout);
```

### Large Files
```
❌ exec() with large output: Entire output in memory
✅ spawn() with large output: Streamed, low memory
✅ spawn() piped: Data flows directly
```

## Error Handling

### spawn()
```javascript
const child = spawn('command', ['arg']);

child.on('error', (err) => {
  console.error('spawn error:', err);
});

child.on('close', (code, signal) => {
  if (code !== 0) {
    console.error(`Process exited: ${code}`);
  }
});
```

### exec()
```javascript
exec('command', (err, stdout, stderr) => {
  if (err) {
    console.error('Command failed:', err);
    return;
  }
  console.log(stdout);
});
```

## Detached Processes

### Keep Running After Parent Dies
```javascript
const child = spawn('long_task', {
  detached: true,
  stdio: 'ignore'
});

child.unref(); // Don't keep parent alive

// Parent can exit, child still runs
```

## Performance

### spawn() vs exec()
```
spawn: ~2-5ms to start, streaming
exec: ~5-10ms to start, buffers output

For large output: spawn() much better
For small output: exec() simpler
```

## IPC with fork()

### Two-Way Communication
```javascript
// parent.js
const child = fork('./worker.js');

function calculate(value) {
  return new Promise((resolve) => {
    child.once('message', resolve);
    child.send({ task: 'calculate', value });
  });
}

const result = await calculate(40);
```

### Serialization
```javascript
// Data serialized via JSON
child.send({
  string: 'text',
  number: 42,
  array: [1, 2, 3],
  buffer: Buffer.from([1, 2, 3])
  // function: () => {} // NOT serializable
});
```

## PromisifiedVersion
```javascript
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function runCommand() {
  try {
    const {stdout, stderr} = await exec('ls -l');
    console.log(stdout);
  } catch (err) {
    console.error(err);
  }
}
```

## Best Practices

✅ Use spawn() for large output
✅ Use exec() for simple commands
✅ Use fork() for Node-to-Node
✅ Handle errors always
✅ Set timeout on long processes
✅ Validate command inputs
✅ Use execFile() over exec() when possible
✅ Don't detach unnecessarily
✅ Clean up child processes
✅ Monitor resource usage
