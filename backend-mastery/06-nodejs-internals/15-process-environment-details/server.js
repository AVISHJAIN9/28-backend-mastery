const express = require('express');
const os = require('os');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3015;

// Module 15: Process/Environment Details

// Route: Process information
app.get('/api/process/info', (req, res) => {
  res.json({
    pid: process.pid,
    ppid: process.ppid,
    version: process.version,
    versions: process.versions,
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    uptime: process.uptime(),
    cwd: process.cwd(),
    argv: process.argv
  });
});

// Route: Environment variables
app.get('/api/process/env', (req, res) => {
  const envCopy = { ...process.env };
  // Don't expose sensitive data in real apps
  delete envCopy.PATH;
  delete envCopy.HOME;

  res.json({
    totalEnvVars: Object.keys(process.env).length,
    examples: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set',
      HOME: process.env.HOME ? 'set' : 'not set',
      PATH: process.env.PATH ? 'set' : 'not set'
    },
    nodeRelated: {
      NODE_PATH: process.env.NODE_PATH,
      NODE_DEBUG: process.env.NODE_DEBUG,
      NODE_SKIP_PLATFORM_CHECK: process.env.NODE_SKIP_PLATFORM_CHECK
    }
  });
});

// Route: Set and get env vars
app.post('/api/process/env-set', (req, res) => {
  const { key, value } = req.body;

  if (!key) {
    return res.status(400).json({ error: 'key required' });
  }

  process.env[key] = value || '';

  res.json({
    set: key,
    value: process.env[key],
    retrieved: process.env[key] === value,
    note: 'Process-wide, not system-wide'
  });
});

// Route: Memory usage
app.get('/api/process/memory', (req, res) => {
  const mem = process.memoryUsage();

  res.json({
    rss: {
      bytes: mem.rss,
      mb: (mem.rss / 1024 / 1024).toFixed(2),
      description: 'Resident set size - total memory allocated'
    },
    heapTotal: {
      bytes: mem.heapTotal,
      mb: (mem.heapTotal / 1024 / 1024).toFixed(2),
      description: 'Heap capacity'
    },
    heapUsed: {
      bytes: mem.heapUsed,
      mb: (mem.heapUsed / 1024 / 1024).toFixed(2),
      description: 'Actual heap used'
    },
    external: {
      bytes: mem.external,
      mb: (mem.external / 1024 / 1024).toFixed(2),
      description: 'C++ bindings memory'
    },
    arrayBuffers: {
      bytes: mem.arrayBuffers,
      mb: (mem.arrayBuffers / 1024 / 1024).toFixed(2),
      description: 'ArrayBuffer memory'
    }
  });
});

// Route: CPU usage
app.get('/api/process/cpu', (req, res) => {
  const usage = process.cpuUsage();

  res.json({
    user: (usage.user / 1000).toFixed(2) + ' ms',
    system: (usage.system / 1000).toFixed(2) + ' ms',
    total: ((usage.user + usage.system) / 1000).toFixed(2) + ' ms',
    description: 'CPU time spent in user and system code'
  });
});

// Route: System resources
app.get('/api/process/resources', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const loadAvg = os.loadavg();

  res.json({
    cpus: {
      count: cpus.length,
      model: cpus[0]?.model,
      speed: cpus[0]?.speed
    },
    memory: {
      total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      used: ((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2) + ' GB'
    },
    loadAverage: {
      '1min': loadAvg[0].toFixed(2),
      '5min': loadAvg[1].toFixed(2),
      '15min': loadAvg[2].toFixed(2)
    }
  });
});

// Route: Process signals
app.get('/api/process/signals', (req, res) => {
  res.json({
    signals: {
      SIGTERM: 'Termination signal - graceful shutdown',
      SIGKILL: 'Kill signal - cannot be caught',
      SIGINT: 'Interrupt signal - Ctrl+C',
      SIGUSR1: 'User-defined signal 1',
      SIGUSR2: 'User-defined signal 2',
      SIGHUP: 'Hang up signal'
    },
    handling: {
      method: 'process.on("SIGTERM", () => {})',
      note: 'SIGKILL cannot be handled',
      example: 'Graceful shutdown on SIGTERM'
    }
  });
});

// Route: Process events
app.post('/api/process/handle-signal', (req, res) => {
  const { signal } = req.body;

  const handler = () => {
    res.json({
      signal: signal,
      handled: true,
      timestamp: new Date().toISOString(),
      gracefulShutdown: true
    });
  };

  // Register signal handler (will only respond once)
  process.once(signal, handler);

  res.json({
    waiting: true,
    signal: signal,
    note: 'Handler registered, send system signal'
  });
});

// Route: Exit codes
app.get('/api/process/exit-codes', (req, res) => {
  res.json({
    meanings: {
      0: 'Success',
      1: 'General error',
      2: 'Misuse of shell command',
      130: 'Script terminated by Ctrl+C',
      143: 'Terminated by SIGTERM',
      255: 'Exit status out of range'
    },
    nodeSpecific: {
      3: 'Internal JavaScript parse error',
      4: 'Internal JavaScript evaluation failure',
      5: 'Fatal error'
    },
    custom: 'Use process.exit(code) for custom'
  });
});

// Route: stdout/stderr
app.post('/api/process/output', (req, res) => {
  const { message } = req.body;

  // Log to stdout
  console.log('LOG:', message);

  // Log to stderr
  console.error('ERROR:', message);

  res.json({
    stdout: 'Use console.log()',
    stderr: 'Use console.error()',
    file: 'Redirect with > and 2>',
    example: 'node app.js > log.txt 2> err.txt'
  });
});

// Route: Graceful patterns
app.get('/api/process/graceful-patterns', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Signal Handler',
        code: 'process.on("SIGTERM", () => { shutdown() });'
      },
      {
        name: 'Exit Handler',
        code: 'process.on("exit", () => { cleanup() });'
      },
      {
        name: 'Exit Code',
        code: 'process.exit(code);'
      },
      {
        name: 'Uncaught Exception',
        code: 'process.on("uncaughtException", (err) => {});'
      },
      {
        name: 'Unhandled Rejection',
        code: 'process.on("unhandledRejection", (reason) => {});'
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Process/Environment server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  GET /api/process/info - Process information');
  console.log('  GET /api/process/env - Environment variables');
  console.log('  POST /api/process/env-set - Set env variable');
  console.log('  GET /api/process/memory - Memory usage');
  console.log('  GET /api/process/cpu - CPU usage');
  console.log('  GET /api/process/resources - System resources');
  console.log('  GET /api/process/signals - Signal handling');
  console.log('  POST /api/process/handle-signal - Handle signal');
  console.log('  GET /api/process/exit-codes - Exit codes');
  console.log('  POST /api/process/output - stdout/stderr');
  console.log('  GET /api/process/graceful-patterns - Patterns');
});

module.exports = app;
