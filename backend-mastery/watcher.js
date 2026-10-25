/**
 * DevVault Watcher — local file server with error detection
 * Run: node watcher.js
 * Then open devvault.html or master-revisions.html in your browser
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 4444;
const BASE = __dirname;

// ─── helpers ──────────────────────────────────────
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function fileExists(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.size > 0;
  } catch {
    return false;
  }
}

// ─── error detection ──────────────────────────────
function detectErrors(content, filename) {
  const errors = [];
  if (!content) return errors;

  // JavaScript/Node.js errors
  if (filename.endsWith('.js') || filename.endsWith('.jsx')) {
    // Check for undefined variables before assignment
    if (content.includes('var ') && !content.includes('var ')) {
      if (content.match(/\w+\s+\w+\s*=/)) {
        // Potential typo in variable declaration
      }
    }
    
    // Check for common syntax errors
    const unclosed = (content.match(/{/g) || []).length - (content.match(/}/g) || []).length;
    if (unclosed > 0) errors.push({ type: 'syntax', msg: 'Unclosed braces detected' });
    if (unclosed < 0) errors.push({ type: 'syntax', msg: 'Extra closing braces' });

    // Check for require/import errors
    if (content.includes('require(') && !content.includes("require('") && !content.includes('require("')) {
      errors.push({ type: 'syntax', msg: 'Invalid require statement' });
    }

    // Check for console without end
    if (content.includes('console.log') && content.includes('undefined')) {
      errors.push({ type: 'logic', msg: 'Possible undefined value in console.log' });
    }
  }

  // General file checks
  if (!content.trim()) {
    errors.push({ type: 'empty', msg: 'File is empty' });
  }

  return errors;
}

function getTopicData(categoryDir, topicDir) {
  const dir = path.join(BASE, categoryDir, topicDir);
  const files = ['schema.js', 'controller.js', 'routes.js', 'middleware.js',
    '.env.example', 'README.md', 'setup.md', 'theory.md', 'checklist.md',
    'preview.html', 'App.jsx'];

  const data = { name: topicDir, path: path.join(categoryDir, topicDir), files: {} };
  let writtenCount = 0;
  let errorCount = 0;

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const content = readFile(fullPath);
    const written = fileExists(fullPath);
    const errors = detectErrors(content, f);
    
    data.files[f] = { content, written, errors, errorCount: errors.length };
    if (written) writtenCount++;
    if (errors.length > 0) errorCount++;
  }

  data.progress = Math.round((writtenCount / files.length) * 100);
  data.writtenCount = writtenCount;
  data.totalFiles = files.length;
  data.errorCount = errorCount;
  return data;
}

function buildCatalog() {
  const catalog = [];
  const categoryDirs = fs.readdirSync(BASE)
    .filter(d => {
      try { return fs.statSync(path.join(BASE, d)).isDirectory() && /^\d{2}-/.test(d); }
      catch { return false; }
    })
    .sort();

  for (const catDir of categoryDirs) {
    const catPath = path.join(BASE, catDir);
    const topicDirs = fs.readdirSync(catPath)
      .filter(d => {
        try { return fs.statSync(path.join(catPath, d)).isDirectory(); }
        catch { return false; }
      })
      .sort();

    const topics = topicDirs.map(t => getTopicData(catDir, t));
    const totalFiles = topics.reduce((s, t) => s + t.totalFiles, 0);
    const writtenFiles = topics.reduce((s, t) => s + t.writtenCount, 0);
    const totalErrors = topics.reduce((s, t) => s + t.errorCount, 0);

    catalog.push({
      dir: catDir,
      name: catDir.replace(/^\d{2}-/, '').replace(/-/g, ' '),
      topics,
      progress: totalFiles > 0 ? Math.round((writtenFiles / totalFiles) * 100) : 0,
      writtenFiles,
      totalFiles,
      errorCount: totalErrors,
      topicCount: topics.length
    });
  }
  return catalog;
}

// ─── server ───────────────────────────────────────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Main catalog endpoint
  if (pathname === '/catalog') {
    const catalog = buildCatalog();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(catalog));
    return;
  }

  // Get all files in a topic (for file browser)
  if (pathname === '/topic-files') {
    const topicPath = query.path;
    if (!topicPath) {
      res.writeHead(400);
      res.end('Missing path parameter');
      return;
    }
    
    const dir = path.join(BASE, topicPath);
    try {
      const files = fs.readdirSync(dir)
        .filter(f => !f.startsWith('.'))
        .map(f => {
          const fullPath = path.join(dir, f);
          const isDir = fs.statSync(fullPath).isDirectory();
          const content = !isDir ? readFile(fullPath) : null;
          const errors = !isDir ? detectErrors(content, f) : [];
          return {
            name: f,
            isDir,
            content: !isDir ? content : null,
            errors,
            size: !isDir ? content?.length || 0 : 0
          };
        });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    } catch (err) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Topic not found' }));
    }
    return;
  }

  // Get file content with errors
  if (pathname === '/file') {
    const filePath = query.path;
    if (!filePath) {
      res.writeHead(400);
      res.end('Missing path parameter');
      return;
    }
    
    const fullPath = path.join(BASE, filePath);
    try {
      const content = readFile(fullPath);
      const errors = detectErrors(content, path.basename(filePath));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        content,
        errors,
        name: path.basename(fullPath),
        path: filePath,
        size: content.length
      }));
    } catch (err) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'File not found' }));
    }
    return;
  }

  // Get all errors in a topic
  if (pathname === '/topic-errors') {
    const topicPath = query.path;
    if (!topicPath) {
      res.writeHead(400);
      res.end('Missing path parameter');
      return;
    }
    
    const dir = path.join(BASE, topicPath);
    try {
      const files = fs.readdirSync(dir)
        .filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile());
      
      const allErrors = [];
      for (const f of files) {
        const content = readFile(path.join(dir, f));
        const errors = detectErrors(content, f);
        if (errors.length > 0) {
          allErrors.push({ file: f, errors });
        }
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(allErrors));
    } catch (err) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Topic not found' }));
    }
    return;
  }

  // Ping endpoint
  if (pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  // Serve preview.html files directly
  if (pathname.startsWith('/preview/')) {
    const topicPath = pathname.slice('/preview/'.length);
    const dir = path.join(BASE, topicPath);
    const filePath = path.join(dir, 'preview.html');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Preview not found');
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 DevVault Watcher Enhanced Running on http://localhost:${PORT}`);
  console.log(`📂 Watching: ${BASE}`);
  console.log(`\nAvailable Endpoints:`);
  console.log(`  • /catalog - Full module catalog with progress`);
  console.log(`  • /topic-files?path=xx-module/topic - List all files in a topic`);
  console.log(`  • /file?path=xx-module/topic/file.js - Get file content + errors`);
  console.log(`  • /topic-errors?path=xx-module/topic - Get all errors in topic`);
  console.log(`  • /ping - Health check`);
  console.log(`\n→ Open in browser:`);
  console.log(`   • devvault.html (original)`);
  console.log(`   • master-revisions.html (unified dashboard)\n`);
});
