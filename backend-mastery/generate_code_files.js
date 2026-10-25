#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate generic controller for a module
function generateController(moduleName) {
  return `// ${moduleName} - Controller

// Get module info
const getInfo = (req, res) => {
  res.json({
    module: '${moduleName}',
    description: 'Learn about ${moduleName.toLowerCase()}',
    endpoints: {
      '/api/info': 'Module information',
      '/api/test': 'Test endpoint'
    },
    documentation: '/theory.md'
  });
};

// Test endpoint
const getTest = (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getInfo,
  getTest
};`;
}

// Generate generic routes
function generateRoutes() {
  return `const express = require('express');
const { getInfo, getTest } = require('./controller');
const router = express.Router();

// Info endpoint
router.get('/info', getInfo);

// Test endpoint
router.get('/test', getTest);

module.exports = router;`;
}

// Generate generic middleware
function generateMiddleware() {
  return `// Request logging middleware
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(\`[\${timestamp}] \${req.method} \${req.path}\`);
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(\`[ERROR] \${err.message}\`);
  res.status(err.status || 500).json({
    error: err.message,
    path: req.path,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  logger,
  errorHandler
};`;
}

// Generate generic schema
function generateSchema() {
  return `// Schema definitions and validation

const validationRules = {
  basicRequest: {
    required: ['data'],
    optional: ['format']
  }
};

module.exports = {
  validationRules
};`;
}

// Generate generic preview HTML
function generatePreview(moduleName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${moduleName} - Interactive Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { color: #4ec9b0; margin: 20px 0; }
    .tool { background: #252526; padding: 20px; margin: 20px 0; border-left: 4px solid #007acc; }
    .input-group { margin: 15px 0; }
    label { display: block; color: #9cdcfe; margin-bottom: 5px; font-weight: bold; }
    input, textarea { width: 100%; padding: 8px; background: #1e1e1e; color: #d4d4d4; border: 1px solid #3e3e42; border-radius: 4px; font-family: inherit; }
    button { background: #007acc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
    button:hover { background: #005a9e; }
    .output { background: #1e1e1e; border: 1px solid #3e3e42; padding: 15px; margin-top: 10px; max-height: 200px; overflow-y: auto; border-radius: 4px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
    .success { color: #4ec9b0; }
    .error { color: #f48771; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📚 ${moduleName} - Interactive Preview</h1>
    
    <div class="tool">
      <h2>Test API Endpoints</h2>
      <button onclick="testEndpoint('/api/info')">Get Info</button>
      <button onclick="testEndpoint('/api/test')">Test Endpoint</button>
      <div id="output" class="output" style="display:none;"></div>
    </div>

    <div class="tool">
      <h2>Documentation</h2>
      <ul>
        <li><a href="README.md" style="color: #9cdcfe;">📖 README</a></li>
        <li><a href="theory.md" style="color: #9cdcfe;">📚 Theory</a></li>
        <li><a href="setup.md" style="color: #9cdcfe;">⚙️ Setup</a></li>
        <li><a href="checklist.md" style="color: #9cdcfe;">✓ Checklist</a></li>
      </ul>
    </div>
  </div>

  <script>
    async function testEndpoint(endpoint) {
      const output = document.getElementById('output');
      try {
        const response = await fetch(endpoint);
        const data = await response.json();
        output.innerHTML = '<span class="success">✓ Success</span>\\n\\n<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        output.style.display = 'block';
      } catch (err) {
        output.innerHTML = '<span class="error">Error: ' + err.message + '</span>';
        output.style.display = 'block';
      }
    }
  </script>
</body>
</html>`;
}

// Main execution
const baseDir = '/Users/avishjain/Downloads/backend-mastery';
const projects = ['17-linux-os', '18-cryptography'];

console.log('🔧 Generating controller, routes, middleware, schema files...\n');

projects.forEach(project => {
  const projectPath = path.join(baseDir, project);
  const modules = fs.readdirSync(projectPath).filter(f => f.match(/^0\d-/));
  
  modules.forEach(module => {
    const modulePath = path.join(projectPath, module);
    const moduleName = module.replace(/^\d+-/, '').replace(/-/g, ' ');
    
    // Generate controller.js if empty or missing
    const controllerPath = path.join(modulePath, 'controller.js');
    if (!fs.existsSync(controllerPath) || fs.statSync(controllerPath).size < 150) {
      fs.writeFileSync(controllerPath, generateController(moduleName));
      console.log(`✓ ${module}/controller.js`);
    }

    // Generate routes.js if empty or missing
    const routesPath = path.join(modulePath, 'routes.js');
    if (!fs.existsSync(routesPath) || fs.statSync(routesPath).size < 150) {
      fs.writeFileSync(routesPath, generateRoutes());
      console.log(`✓ ${module}/routes.js`);
    }

    // Generate middleware.js if empty or missing
    const middlewarePath = path.join(modulePath, 'middleware.js');
    if (!fs.existsSync(middlewarePath) || fs.statSync(middlewarePath).size < 150) {
      fs.writeFileSync(middlewarePath, generateMiddleware());
      console.log(`✓ ${module}/middleware.js`);
    }

    // Generate schema.js if empty or missing
    const schemaPath = path.join(modulePath, 'schema.js');
    if (!fs.existsSync(schemaPath) || fs.statSync(schemaPath).size < 150) {
      fs.writeFileSync(schemaPath, generateSchema());
      console.log(`✓ ${module}/schema.js`);
    }

    // Generate preview.html if empty
    const previewPath = path.join(modulePath, 'preview.html');
    if (!fs.existsSync(previewPath) || fs.statSync(previewPath).size < 100) {
      fs.writeFileSync(previewPath, generatePreview(moduleName));
      console.log(`✓ ${module}/preview.html`);
    }
  });
});

console.log('\n✅ All code files generated!');
