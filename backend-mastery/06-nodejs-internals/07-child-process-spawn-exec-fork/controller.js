/**
 * Child Process Controller
 * Demonstrates spawn, exec, and fork
 */

const { spawn, exec, execFile, fork } = require('child_process');
const path = require('path');

// ============================================
// Spawn - Stream-based Child Process
// ============================================

exports.demonstrateSpawn = (req, res) => {
  const results = {
    operation: 'spawn',
    platform: process.platform,
    command: process.platform === 'win32' ? 'ipconfig' : 'ifconfig',
    output: [],
    errors: [],
  };

  console.log(`\n=== SPAWN: Network info ===`);

  const cmd = process.platform === 'win32' ? 'ipconfig' : 'ifconfig';
  const child = spawn(cmd);
  let lineCount = 0;

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.slice(0, 10).forEach((line) => {
      if (line.trim()) {
        results.output.push(line);
        lineCount++;
      }
    });
  });

  child.stderr.on('data', (data) => {
    results.errors.push(data.toString());
  });

  child.on('close', (code) => {
    results.exitCode = code;
    results.totalLines = lineCount;
    results.status = code === 0 ? 'success' : 'failed';
    res.json(results);
  });

  setTimeout(() => {
    if (!res.headersSent) {
      child.kill();
      results.status = 'timeout';
      res.json(results);
    }
  }, 5000);
};

// ============================================
// Exec - Shell Command Execution
// ============================================

exports.demonstrateExec = (req, res) => {
  const results = {
    operation: 'exec',
    command: process.platform === 'win32' ? 'echo Hello from exec' : 'echo Hello from exec && date',
  };

  console.log(`\n=== EXEC: Shell command ===`);

  const cmd = process.platform === 'win32' ? 'echo Hello from exec' : 'echo Hello from exec && date';

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      results.error = error.message;
      results.status = 'failed';
      res.status(500).json(results);
      return;
    }

    results.stdout = stdout;
    results.stderr = stderr;
    results.status = 'success';
    res.json(results);
  });
};

// ============================================
// Fork - Node.js Process
// ============================================

exports.demonstrateFork = (req, res) => {
  const { value = 10 } = req.query;
  const results = {
    operation: 'fork',
    value: parseInt(value),
    messages: [],
  };

  console.log(`\n=== FORK: Child Node.js process ===`);

  // Create child process script
  const childScript = path.join(__dirname, 'child.js');

  // For demo, use inline child logic
  const child = fork('-e', [require.resolve('./child.js')], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  });

  // Send message to child
  child.send({ task: 'fibonacci', value: parseInt(value) });

  child.on('message', (msg) => {
    results.messages.push(msg);

    if (msg.type === 'result') {
      results.result = msg.data;
      results.status = 'completed';
      child.kill();
      res.json(results);
    }
  });

  child.on('error', (err) => {
    results.error = err.message;
    results.status = 'error';
    res.status(500).json(results);
  });

  setTimeout(() => {
    if (!res.headersSent) {
      child.kill();
      results.status = 'timeout';
      res.json(results);
    }
  }, 10000);
};

// ============================================
// Comparison: spawn vs exec vs fork
// ============================================

exports.compareChildProcessTypes = (req, res) => {
  const results = {
    operation: 'comparison_child_processes',
    comparisons: {
      spawn: {
        advantages: [
          'Streams for large data',
          'Better resource efficiency',
          'Suitable for file operations',
        ],
        disadvantages: ['More complex', 'Need to parse output'],
        useCase: 'Large file processing, streaming data',
      },
      exec: {
        advantages: ['Simple for small commands', 'Executes in shell context'],
        disadvantages: ['Buffer size limit', 'Shells interpretation overhead'],
        useCase: 'Simple shell commands, small output',
      },
      fork: {
        advantages: [
          'IPC channel',
          'Dedicated Node.js process',
          'Message passing',
        ],
        disadvantages: ['Only for Node.js scripts', 'Memory overhead'],
        useCase: 'CPU-intensive tasks, background workers',
      },
    },
  };

  console.log(`\n=== CHILD PROCESS TYPES COMPARISON ===`);

  res.json(results);
};

// ============================================
// Batch Command Execution
// ============================================

exports.executeBatchCommands = (req, res) => {
  const results = {
    operation: 'batch_commands',
    commands: [],
  };

  console.log(`\n=== BATCH COMMAND EXECUTION ===`);

  const commands = [
    { cmd: 'echo Command 1', type: 'exec' },
    { cmd: 'echo Command 2', type: 'exec' },
    { cmd: 'echo Command 3', type: 'exec' },
  ];

  let completed = 0;

  commands.forEach((cmdObj, index) => {
    exec(cmdObj.cmd, (error, stdout, stderr) => {
      results.commands.push({
        index,
        command: cmdObj.cmd,
        status: error ? 'failed' : 'success',
        output: stdout.trim(),
        error: error?.message,
      });

      completed++;
      if (completed === commands.length) {
        results.totalCompleted = completed;
        results.status = 'all_completed';
        res.json(results);
      }
    });
  });
};
