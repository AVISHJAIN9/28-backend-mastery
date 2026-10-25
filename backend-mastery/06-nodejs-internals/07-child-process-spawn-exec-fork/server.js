const express = require('express');
const { spawn, exec, fork, execFile } = require('child_process');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3007;

// Module 7: Child Process (spawn, exec, fork)

// Route: Spawn demo
app.post('/api/child/spawn-demo', (req, res) => {
  const { command = 'ls', args = ['-la'] } = req.body;
  
  let output = '';
  let error = '';

  const child = spawn(command, args);

  child.stdout.on('data', (data) => {
    output += data.toString();
  });

  child.stderr.on('data', (data) => {
    error += data.toString();
  });

  child.on('close', (code) => {
    res.json({
      method: 'spawn',
      command,
      exitCode: code,
      output: output.slice(0, 500), // Limit output
      error: error || 'None',
      streaming: 'Yes (data event-based)',
      memorySafe: true
    });
  });
});

// Route: Exec demo
app.post('/api/child/exec-demo', (req, res) => {
  const { command = 'echo hello' } = req.body;

  exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    res.json({
      method: 'exec',
      command,
      error: error ? error.message : 'None',
      stdout: stdout.slice(0, 500),
      stderr: stderr || 'None',
      streaming: 'No (buffered)',
      limit: '1MB buffer default',
      useCase: 'Simple commands with small output'
    });
  });
});

// Route: ExecFile demo
app.post('/api/child/execfile-demo', (req, res) => {
  const { file = 'ls', args = ['-la'] } = req.body;

  execFile(file, args, (error, stdout, stderr) => {
    res.json({
      method: 'execFile',
      file,
      error: error ? error.message : 'None',
      output: stdout.slice(0, 500),
      benefit: 'Faster than exec (no shell)',
      security: 'Better (no shell injection)'
    });
  });
});

// Route: Fork demo (IPC)
app.post('/api/child/fork-demo', (req, res) => {
  const childScript = path.join(__dirname, 'worker-fork.js');
  
  let messages = [];

  const child = fork(childScript);

  // Send message to child
  child.send({ type: 'START', value: 10 });

  child.on('message', (msg) => {
    messages.push(msg);

    if (msg.type === 'DONE') {
      child.kill();
      res.json({
        method: 'fork',
        ipc: 'Yes - bidirectional communication',
        messages: messages.length,
        communication: 'parent <--> child messaging',
        useCase: 'Background workers with communication'
      });
    }
  });

  setTimeout(() => {
    if (!res.headersSent) {
      child.kill();
      res.json({ error: 'Timeout' });
    }
  }, 5000);
});

// Route: Comparison table
app.get('/api/child/comparison', (req, res) => {
  res.json({
    spawn: {
      streams: 'Yes (EventEmitter)',
      buffering: 'No (streaming)',
      largeData: 'Yes',
      shell: 'No (direct)',
      execution: 'Immediate',
      useCase: 'Large output, streaming data'
    },
    exec: {
      streams: 'No (callback)',
      buffering: 'Yes (entire output)',
      largeData: 'Limited (1MB default)',
      shell: 'Yes (shell interpretation)',
      execution: 'Via shell',
      useCase: 'Simple shell commands'
    },
    execFile: {
      streams: 'No (callback)',
      buffering: 'Yes',
      largeData: 'No',
      shell: 'No',
      execution: 'Direct',
      useCase: 'Security-sensitive, faster'
    },
    fork: {
      streams: 'No',
      buffering: 'Message-based',
      largeData: 'With serialization',
      shell: 'No',
      ipc: 'Yes (full-duplex)',
      useCase: 'Background workers'
    }
  });
});

// Route: Best practices
app.get('/api/child/best-practices', (req, res) => {
  res.json({
    practices: [
      'Use spawn() for large or streaming output',
      'Use exec() only for small, simple commands',
      'Avoid exec() with untrusted input (shell injection)',
      'Use fork() for worker processes',
      'Always handle errors and timeouts',
      'Monitor child process memory',
      'Implement graceful shutdown',
      'Use clustering for multiple cores'
    ],
    securityWarning: 'Never exec() user-provided commands',
    performanceTip: 'Use spawn() for better memory efficiency'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Child Process server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/child/spawn-demo - Spawn demonstration');
  console.log('  POST /api/child/exec-demo - Exec demonstration');
  console.log('  POST /api/child/execfile-demo - ExecFile demonstration');
  console.log('  POST /api/child/fork-demo - Fork with IPC');
  console.log('  GET /api/child/comparison - Method comparison');
  console.log('  GET /api/child/best-practices - Best practices');
});

module.exports = app;
