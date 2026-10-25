const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3014;

// Module 14: FileSystem APIs - All Patterns

// Route: File operations comparison
app.post('/api/files/read-comparison', async (req, res) => {
  const { method = 'async' } = req.body;
  const testFile = path.join(__dirname, 'test.txt');

  // Create test file
  await fs.writeFile(testFile, 'Test data');

  try {
    let duration, result;
    const start = Date.now();

    if (method === 'sync') {
      result = fsSync.readFileSync(testFile, 'utf8');
      duration = Date.now() - start;
    } else if (method === 'async') {
      result = await fs.readFile(testFile, 'utf8');
      duration = Date.now() - start;
    } else if (method === 'promises') {
      result = await fs.readFile(testFile, 'utf8');
      duration = Date.now() - start;
    } else if (method === 'callback') {
      result = await new Promise((resolve, reject) => {
        const cbStart = Date.now();
        fsSync.readFile(testFile, 'utf8', (err, data) => {
          if (err) reject(err);
          duration = Date.now() - cbStart;
          resolve(data);
        });
      });
    }

    res.json({
      method,
      durationMs: duration,
      blocking: method === 'sync',
      eventLoopSafe: method !== 'sync',
      dataLength: result.length
    });

    // Cleanup
    await fs.unlink(testFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Directory operations
app.post('/api/files/directory-ops', async (req, res) => {
  const { operation } = req.body;
  const testDir = path.join(__dirname, 'testdir');

  try {
    switch (operation) {
      case 'create':
        await fs.mkdir(testDir, { recursive: true });
        res.json({ operation, result: 'Created', path: testDir });
        break;

      case 'read':
        const files = await fs.readdir(testDir);
        res.json({ operation, files });
        break;

      case 'stat':
        const stat = await fs.stat(testDir);
        res.json({
          operation,
          isDirectory: stat.isDirectory(),
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime
        });
        break;

      case 'remove':
        await fs.rmdir(testDir);
        res.json({ operation, result: 'Removed' });
        break;

      default:
        res.json({ error: 'Unknown operation' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: File watching
app.post('/api/files/watch-demo', async (req, res) => {
  const watchFile = path.join(__dirname, 'watch-test.txt');

  // Create test file
  await fs.writeFile(watchFile, 'initial');

  const watcher = fs.watch(watchFile, async (eventType, filename) => {
    watcher.close();

    res.json({
      eventType,
      filename,
      watcherClosed: true,
      uses: 'Monitor file changes, rebuild on change, hot reload'
    });
  });

  // Trigger change after brief delay
  setTimeout(async () => {
    await fs.appendFile(watchFile, '\nupdated');
  }, 100);

  // Cleanup
  setTimeout(async () => {
    await fs.unlink(watchFile).catch(() => {});
  }, 2000);
});

// Route: Stream patterns
app.post('/api/files/stream-demo', async (req, res) => {
  const { type } = req.body;
  const testFile = path.join(__dirname, 'stream-test.txt');

  // Create test file with data
  await fs.writeFile(testFile, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\n');

  if (type === 'read') {
    let lines = 0;
    const stream = fsSync.createReadStream(testFile);
    stream.on('data', () => lines++);
    stream.on('end', () => {
      res.json({
        method: 'createReadStream',
        linesRead: 5,
        benefit: 'Memory efficient for large files'
      });
      fs.unlink(testFile);
    });
  } else if (type === 'write') {
    const output = path.join(__dirname, 'stream-output.txt');
    const writeStream = fsSync.createWriteStream(output);
    writeStream.write('Line 1\nLine 2\nLine 3\n');
    writeStream.end();
    writeStream.on('finish', () => {
      res.json({
        method: 'createWriteStream',
        written: true,
        benefit: 'Backpressure handling, memory safe'
      });
      fs.unlink(testFile);
      fs.unlink(output);
    });
  }
});

// Route: Path operations
app.post('/api/files/path-ops', (req, res) => {
  const { operation, filePath } = req.body;
  const testPath = filePath || '/home/user/documents/file.txt';

  try {
    let result;
    switch (operation) {
      case 'parse':
        result = path.parse(testPath);
        break;
      case 'dirname':
        result = path.dirname(testPath);
        break;
      case 'basename':
        result = path.basename(testPath);
        break;
      case 'extname':
        result = path.extname(testPath);
        break;
      case 'relative':
        result = path.relative('/home/user', testPath);
        break;
      case 'resolve':
        result = path.resolve('./dir');
        break;
      default:
        result = 'Unknown operation';
    }

    res.json({ operation, input: testPath, result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: File permissions
app.post('/api/files/permissions', async (req, res) => {
  const { operation } = req.body;
  const testFile = path.join(__dirname, 'perm-test.txt');

  try {
    await fs.writeFile(testFile, 'test');

    switch (operation) {
      case 'chmod': {
        await fsSync.promises.chmod(testFile, 0o644);
        const stat = await fs.stat(testFile);
        res.json({
          operation: 'chmod',
          mode: (stat.mode & parseInt('777', 8)).toString(8),
          note: 'Changed to rw-r--r--'
        });
        break;
      }

      case 'access': {
        try {
          await fsSync.promises.access(testFile, fsSync.constants.R_OK);
          res.json({ operation: 'access', readable: true });
        } catch {
          res.json({ operation: 'access', readable: false });
        }
        break;
      }

      default:
        res.json({ error: 'Unknown operation' });
    }

    await fs.unlink(testFile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Best practices
app.get('/api/files/best-practices', (req, res) => {
  res.json({
    practices: [
      'Always use async/promises (never sync)',
      'Use fs.promises for async/await',
      'Handle errors properly',
      'Use streams for large files',
      'Watch for memory leaks with open files',
      'Use fs.copyFile instead of read+write',
      'Batch operations when possible',
      'Use fs.watch/watchFile carefully (platform dependent)'
    ],
    antiPatterns: [
      'fs.readFileSync in production',
      'Not closing file handles',
      'Reading entire large files into memory',
      'Not handling fs errors',
      'Using fs.watch without debouncing',
      'Not checking file existence before operations'
    ]
  });
});

// Route: Common patterns
app.get('/api/files/patterns', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Read & Process',
        code: 'const data = await fs.readFile(file, "utf8")',
        use: 'Parse JSON, YAML, read configs'
      },
      {
        name: 'Stream Large Files',
        code: 'fs.createReadStream(file).pipe(transform).pipe(out)',
        use: 'Process GB+ files efficiently'
      },
      {
        name: 'Watch for Changes',
        code: 'fs.watch(file, (event, file) => {})',
        use: 'Dev tools, auto-reload, rebuild'
      },
      {
        name: 'Directory Walk',
        code: 'fs.readdirSync(dir, {recursive: true})',
        use: 'File tree traversal'
      },
      {
        name: 'Atomic Write',
        code: 'fs.writeFile(tmpFile); fs.rename(tmpFile, target)',
        use: 'Prevent partial writes'
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 FileSystem APIs server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/files/read-comparison - Compare read methods');
  console.log('  POST /api/files/directory-ops - Directory operations');
  console.log('  POST /api/files/watch-demo - File watching');
  console.log('  POST /api/files/stream-demo - Stream patterns');
  console.log('  POST /api/files/path-ops - Path operations');
  console.log('  POST /api/files/permissions - File permissions');
  console.log('  GET /api/files/best-practices - Best practices');
  console.log('  GET /api/files/patterns - Common patterns');
});

module.exports = app;
