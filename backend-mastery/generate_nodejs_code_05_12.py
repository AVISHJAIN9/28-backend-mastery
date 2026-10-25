#!/usr/bin/env python3
"""Generate comprehensive code for Node.js internals modules 05-12 (simple version)"""

BASE = "/Users/avishjain/Downloads/backend-mastery/06-nodejs-internals"

# Comprehensive code for modules 05-12
MODULES = {
    "05-async-local-storage": {
        "schema.js": "const Joi = require('joi');\n\nconst contextSchema = Joi.object({\n  userId: Joi.string().required(),\n  requestId: Joi.string().required(),\n  tenantId: Joi.string()\n});\n\nmodule.exports = { contextSchema };\n",
        "controller.js": "const { AsyncLocalStorage } = require('async_hooks');\n\nconst storage = new AsyncLocalStorage();\n\nmodule.exports = {\n  getContext: (req, res) => {\n    const ctx = storage.getStore();\n    res.json({ context: ctx });\n  },\n  \n  setContext: (req, res) => {\n    const context = { userId: req.query.userId, requestId: req.id };\n    storage.run(context, () => {\n      res.json({ set: true, context });\n    });\n  }\n};\n",
        "middleware.js": "const { AsyncLocalStorage } = require('async_hooks');\nconst storage = new AsyncLocalStorage();\n\nconst contextMiddleware = (req, res, next) => {\n  const context = {\n    userId: req.user?.id,\n    requestId: req.id,\n    timestamp: Date.now()\n  };\n  \n  storage.run(context, () => {\n    next();\n  });\n};\n\nmodule.exports = { contextMiddleware, storage };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/context', controller.getContext);\nrouter.post('/context', controller.setContext);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function AsyncLocalStorageDemo() {\n  const [context, setContext] = useState(null);\n\n  const getContext = async () => {\n    const res = await fetch('/api/als/context');\n    const data = await res.json();\n    setContext(data);\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>AsyncLocalStorage</h1>\n      <button onClick={getContext}>Get Context</button>\n      {context && <pre>{JSON.stringify(context, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "06-worker-threads": {
        "schema.js": "const Joi = require('joi');\n\nconst jobSchema = Joi.object({\n  id: Joi.string().required(),\n  task: Joi.string().required(),\n  data: Joi.any()\n});\n\nmodule.exports = { jobSchema };\n",
        "controller.js": "const { Worker } = require('worker_threads');\nconst path = require('path');\n\nmodule.exports = {\n  fibonacci: (req, res) => {\n    const n = parseInt(req.query.n) || 35;\n    const worker = new Worker(path.join(__dirname, 'worker.js'));\n    \n    worker.on('message', (result) => {\n      res.json({ n, result });\n      worker.terminate();\n    });\n    \n    worker.postMessage({ task: 'fibonacci', n });\n  },\n  \n  cpu: (req, res) => {\n    const cpuCount = require('os').cpus().length;\n    res.json({ cpuCount });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  console.error('Worker error:', err);\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/fibonacci', controller.fibonacci);\nrouter.get('/cpu', controller.cpu);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function WorkerThreadsDemo() {\n  const [result, setResult] = useState(null);\n  const [loading, setLoading] = useState(false);\n\n  const compute = async () => {\n    setLoading(true);\n    const res = await fetch('/api/workers/fibonacci?n=40');\n    const data = await res.json();\n    setResult(data);\n    setLoading(false);\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Worker Threads</h1>\n      <button onClick={compute} disabled={loading}>{loading ? 'Computing...' : 'Compute Fib(40)'}</button>\n      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "07-child-process-spawn-exec-fork": {
        "schema.js": "const Joi = require('joi');\n\nconst commandSchema = Joi.object({\n  cmd: Joi.string().required(),\n  args: Joi.array().items(Joi.string())\n});\n\nmodule.exports = { commandSchema };\n",
        "controller.js": "const { spawn, exec, execFile } = require('child_process');\nconst util = require('util');\nconst execPromise = util.promisify(exec);\n\nmodule.exports = {\n  list: (req, res) => {\n    const command = process.platform === 'win32' ? 'dir' : 'ls';\n    const child = spawn(command);\n    \n    child.stdout.on('data', (data) => {\n      res.write(data);\n    });\n    \n    child.on('close', () => {\n      res.end();\n    });\n  },\n  \n  exec: async (req, res) => {\n    try {\n      const { stdout, stderr } = await execPromise('echo Hello from exec');\n      res.json({ stdout, stderr });\n    } catch (err) {\n      res.status(500).json({ error: err.message });\n    }\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/list', controller.list);\nrouter.get('/exec', controller.exec);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function ChildProcessDemo() {\n  const [output, setOutput] = useState('');\n\n  const runExec = async () => {\n    const res = await fetch('/api/child/exec');\n    const data = await res.json();\n    setOutput(data.stdout);\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Child Processes</h1>\n      <button onClick={runExec}>Run Exec</button>\n      {output && <pre>{output}</pre>}\n    </div>\n  );\n}\n"
    },
    "08-memory-leaks-patterns": {
        "schema.js": "const Joi = require('joi');\n\nconst leakSchema = Joi.object({\n  type: Joi.string().valid('cache', 'listener', 'timer').required(),\n  size: Joi.number()\n});\n\nmodule.exports = { leakSchema };\n",
        "controller.js": "const cache = new Map();\n\nmodule.exports = {\n  memory: (req, res) => {\n    const used = process.memoryUsage();\n    res.json({\n      heapUsed: Math.round(used.heapUsed / 1024 / 1024),\n      heapTotal: Math.round(used.heapTotal / 1024 / 1024),\n      rss: Math.round(used.rss / 1024 / 1024)\n    });\n  },\n  \n  addToCache: (req, res) => {\n    const size = cache.size;\n    cache.set(Date.now(), new Array(1000).fill('data'));\n    res.json({ cached: cache.size, new: cache.size - size });\n  },\n  \n  clearCache: (req, res) => {\n    cache.clear();\n    res.json({ cleared: true });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/memory', controller.memory);\nrouter.post('/cache', controller.addToCache);\nrouter.delete('/cache', controller.clearCache);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function MemoryLeaksDemo() {\n  const [memory, setMemory] = useState(null);\n\n  const getMemory = async () => {\n    const res = await fetch('/api/memory/memory');\n    const data = await res.json();\n    setMemory(data);\n  };\n\n  const addCache = async () => {\n    await fetch('/api/memory/cache', { method: 'POST' });\n    getMemory();\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Memory Leaks</h1>\n      <button onClick={getMemory}>Check Memory</button>\n      <button onClick={addCache}>Add to Cache</button>\n      {memory && <pre>{JSON.stringify(memory, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "09-graceful-shutdown": {
        "schema.js": "const Joi = require('joi');\n\nconst shutdownSchema = Joi.object({\n  signal: Joi.string().required(),\n  timestamp: Joi.number().required()\n});\n\nmodule.exports = { shutdownSchema };\n",
        "controller.js": "module.exports = {\n  health: (req, res) => {\n    res.json({ status: 'healthy', uptime: process.uptime() });\n  },\n  \n  ready: (req, res) => {\n    res.json({ ready: true });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/health', controller.health);\nrouter.get('/ready', controller.ready);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState, useEffect } from 'react';\n\nexport default function GracefulShutdownDemo() {\n  const [health, setHealth] = useState(null);\n\n  useEffect(() => {\n    const interval = setInterval(async () => {\n      const res = await fetch('/api/shutdown/health');\n      const data = await res.json();\n      setHealth(data);\n    }, 2000);\n    return () => clearInterval(interval);\n  }, []);\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Graceful Shutdown</h1>\n      {health && <pre>{JSON.stringify(health, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "10-cluster-module-all-cpu-cores": {
        "schema.js": "const Joi = require('joi');\n\nconst clusterSchema = Joi.object({\n  workers: Joi.number().required(),\n  cpus: Joi.number().required()\n});\n\nmodule.exports = { clusterSchema };\n",
        "controller.js": "const os = require('os');\n\nmodule.exports = {\n  cpuInfo: (req, res) => {\n    res.json({\n      count: os.cpus().length,\n      model: os.cpus()[0].model\n    });\n  },\n  \n  process: (req, res) => {\n    res.json({\n      pid: process.pid,\n      uptime: process.uptime()\n    });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/cpu', controller.cpuInfo);\nrouter.get('/process', controller.process);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function ClusterDemo() {\n  const [info, setInfo] = useState(null);\n\n  const getInfo = async () => {\n    const res = await fetch('/api/cluster/cpu');\n    const data = await res.json();\n    setInfo(data);\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Cluster Module</h1>\n      <button onClick={getInfo}>Get CPU Info</button>\n      {info && <pre>{JSON.stringify(info, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "11-async-await-patterns": {
        "schema.js": "const Joi = require('joi');\n\nconst operationSchema = Joi.object({\n  parallel: Joi.boolean(),\n  timeout: Joi.number()\n});\n\nmodule.exports = { operationSchema };\n",
        "controller.js": "const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));\n\nmodule.exports = {\n  sequential: async (req, res) => {\n    const start = Date.now();\n    await delay(100);\n    await delay(100);\n    res.json({ time: Date.now() - start });\n  },\n  \n  parallel: async (req, res) => {\n    const start = Date.now();\n    await Promise.all([delay(100), delay(100)]);\n    res.json({ time: Date.now() - start });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/sequential', controller.sequential);\nrouter.get('/parallel', controller.parallel);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState } from 'react';\n\nexport default function AsyncAwaitDemo() {\n  const [result, setResult] = useState(null);\n\n  const test = async (type) => {\n    const res = await fetch('/api/async/' + type);\n    const data = await res.json();\n    setResult(data);\n  };\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>async/await Patterns</h1>\n      <button onClick={() => test('sequential')}>Sequential</button>\n      <button onClick={() => test('parallel')}>Parallel</button>\n      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}\n    </div>\n  );\n}\n"
    },
    "12-express-routing-internals": {
        "schema.js": "const Joi = require('joi');\n\nconst userSchema = Joi.object({\n  id: Joi.string().required(),\n  name: Joi.string().required()\n});\n\nmodule.exports = { userSchema };\n",
        "controller.js": "module.exports = {\n  getUsers: (req, res) => {\n    res.json([{ id: '1', name: 'John' }]);\n  },\n  \n  getUser: (req, res) => {\n    res.json({ id: req.params.id, name: 'User ' + req.params.id });\n  },\n  \n  createUser: (req, res) => {\n    res.status(201).json({ id: Date.now(), ...req.body });\n  }\n};\n",
        "middleware.js": "const errorHandler = (err, req, res, next) => {\n  res.status(500).json({ error: err.message });\n};\n\nmodule.exports = { errorHandler };\n",
        "routes.js": "const express = require('express');\nconst router = express.Router();\nconst controller = require('./controller');\n\nrouter.get('/', controller.getUsers);\nrouter.get('/:id', controller.getUser);\nrouter.post('/', controller.createUser);\n\nmodule.exports = router;\n",
        "App.jsx": "import React, { useState, useEffect } from 'react';\n\nexport default function RoutingDemo() {\n  const [users, setUsers] = useState([]);\n\n  useEffect(() => {\n    fetch('/api/routing/').then(r => r.json()).then(setUsers);\n  }, []);\n\n  return (\n    <div style={{ padding: '20px' }}>\n      <h1>Express Routing</h1>\n      <ul>\n        {users.map(user => <li key={user.id}>{user.name}</li>)}\n      </ul>\n    </div>\n  );\n}\n"
    }
}

def write_files(module_name, files):
    module_path = f"{BASE}/{module_name}"
    for filename, content in files.items():
        filepath = f"{module_path}/{filename}"
        with open(filepath, 'w') as f:
            f.write(content)
    print(f"✅ {module_name}")

for module, files in MODULES.items():
    write_files(module, files)

print(f"\n✅ Modules 05-12 code generated successfully!")
