/**
 * DevVault Watcher — local file server
 * Run: node watcher.js
 * Then open devvault.html in your browser
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

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

function getTopicData(categoryDir, topicDir) {
  const dir = path.join(BASE, categoryDir, topicDir);
  const files = ['schema.js', 'controller.js', 'routes.js', 'middleware.js',
    '.env.example', 'README.md', 'setup.md', 'theory.md', 'checklist.md'];

  const data = { name: topicDir, path: path.join(categoryDir, topicDir), files: {} };
  let writtenCount = 0;

  for (const f of files) {
    const fullPath = path.join(dir, f);
    const content = readFile(fullPath);
    const written = fileExists(fullPath);
    data.files[f] = { content, written };
    if (written) writtenCount++;
  }

  data.progress = Math.round((writtenCount / files.length) * 100);
  data.writtenCount = writtenCount;
  data.totalFiles = files.length;
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

    catalog.push({
      dir: catDir,
      name: catDir.replace(/^\d{2}-/, '').replace(/-/g, ' '),
      topics,
      progress: totalFiles > 0 ? Math.round((writtenFiles / totalFiles) * 100) : 0,
      writtenFiles,
      totalFiles
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

  if (req.url === '/catalog') {
    const catalog = buildCatalog();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(catalog));
    return;
  }

  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\n🚀 DevVault Watcher running on http://localhost:${PORT}`);
  console.log(`📂 Watching: ${BASE}`);
  console.log(`\n→ Now open devvault.html in your browser\n`);
});
