require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const vm = require('vm');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 3018;

// ==================== Middleware ====================

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== Routes ====================

// Basic sandbox execution
app.post('/api/vm/execute-basic', (req, res) => {
  const { code } = req.body;
  try {
    const sandbox = { result: 0 };
    vm.runInThisContext(`sandbox.result = ${code}`, { filename: 'sandbox.vm' });
    res.json({ success: true, result: sandbox.result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sandbox with context
app.post('/api/vm/execute-context', (req, res) => {
  const { code, context } = req.body;
  try {
    const sandbox = vm.createContext(context || {});
    const script = new vm.Script(code);
    const result = script.runInContext(sandbox);
    res.json({ success: true, result, sandbox });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Timeout execution
app.post('/api/vm/execute-timeout', (req, res) => {
  const { code, timeout } = req.body;
  try {
    const sandbox = {};
    const script = new vm.Script(code);
    const result = script.runInContext(sandbox, { timeout: timeout || 1000 });
    res.json({ success: true, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Security isolation test
app.post('/api/vm/test-isolation', (req, res) => {
  try {
    const isolated = vm.createContext({ safe: true });
    const untrusted = `
      try {
        global.hacked = true;
      } catch (e) {
        result = 'Protected';
      }
    `;
    vm.runInContext(untrusted, isolated);
    res.json({ 
      success: true,
      globals_compromised: global.hacked !== true,
      sandbox: isolated
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== Health Check ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    module: '18 VM Module Sandbox',
    category: '06 Nodejs Internals',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  });
});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {
  res.json({
    name: '18 VM Module Sandbox',
    module: '06-nodejs-internals - 18',
    description: 'VM module, sandboxing, code execution isolation',
    version: '1.0.0',
    category: '06 Nodejs Internals',
    endpoints: {
      health: '/health',
      executeBasic: 'POST /api/vm/execute-basic',
      executeContext: 'POST /api/vm/execute-context',
      executeTimeout: 'POST /api/vm/execute-timeout',
      testIsolation: 'POST /api/vm/test-isolation'
    }
  });
});

// ==================== Server Start ====================

app.listen(HTTP_PORT, () => {
  console.log(`[18-vm-module-sandbox] listening on http://localhost:${HTTP_PORT}`);
  console.log(`[18-vm-module-sandbox] API base: http://localhost:${HTTP_PORT}/api`);
});

module.exports = app;
