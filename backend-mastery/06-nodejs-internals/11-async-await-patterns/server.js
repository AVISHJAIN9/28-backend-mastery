const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3011;

// Module 11: Async/Await Patterns

// Simulated async operations
async function fetchUser(userId) {
  return { id: userId, name: 'User ' + userId };
}

async function fetchPosts(userId) {
  return [{ id: 1, title: 'Post 1' }, { id: 2, title: 'Post 2' }];
}

async function fetchComments(postId) {
  return [{ id: 1, text: 'Comment 1' }];
}

// Route: Sequential vs Parallel
app.post('/api/async/sequential-vs-parallel', async (req, res) => {
  try {
    // Sequential (slow)
    const seqStart = Date.now();
    const user1 = await fetchUser(1);
    const posts1 = await fetchPosts(1);
    const comments1 = await fetchComments(1);
    const seqTime = Date.now() - seqStart;

    // Parallel (fast)
    const parStart = Date.now();
    const [user2, posts2, comments2] = await Promise.all([
      fetchUser(1),
      fetchPosts(1),
      fetchComments(1)
    ]);
    const parTime = Date.now() - parStart;

    res.json({
      sequential: { time: seqTime, data: { user: user1, posts: posts1 } },
      parallel: { time: parTime, data: { user: user2, posts: posts2 } },
      improvement: ((seqTime - parTime) / seqTime * 100).toFixed(1) + '%'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Error handling patterns
app.post('/api/async/error-patterns', async (req, res) => {
  const { pattern } = req.body;

  try {
    switch (pattern) {
      case 'try-catch': {
        try {
          throw new Error('Test error');
        } catch (error) {
          res.json({
            pattern: 'Try-Catch',
            caught: true,
            error: error.message
          });
        }
        break;
      }

      case 'promise-catch': {
        const result = await Promise.resolve()
          .then(() => { throw new Error('Test error'); })
          .catch(error => ({
            pattern: 'Promise.catch',
            caught: true,
            error: error.message
          }));
        res.json(result);
        break;
      }

      case 'unhandled': {
        Promise.reject('Unhandled').catch(() => {
          res.json({
            pattern: 'Unhandled rejection',
            note: 'Must always handle rejections'
          });
        });
        break;
      }

      default:
        res.json({ error: 'Unknown pattern' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Cleanup patterns
app.post('/api/async/cleanup', async (req, res) => {
  const { pattern } = req.body;

  try {
    switch (pattern) {
      case 'finally': {
        let cleaned = false;
        try {
          await fetchUser(1);
        } finally {
          cleaned = true;
        }
        res.json({
          pattern: 'Finally block',
          cleaned,
          guarantee: 'Finally runs always'
        });
        break;
      }

      case 'finally-error': {
        let executed = [];
        try {
          throw new Error('Test');
        } catch (e) {
          executed.push('catch');
        } finally {
          executed.push('finally');
        }
        res.json({
          pattern: 'Finally after catch',
          execution: executed,
          order: 'catch -> finally'
        });
        break;
      }

      default:
        res.json({ error: 'Unknown pattern' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Timeout pattern
app.post('/api/async/timeout-pattern', async (req, res) => {
  const { ms = 5000 } = req.body;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });

  try {
    const result = await Promise.race([
      fetchUser(1),
      timeoutPromise
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(408).json({ error: error.message, timeout: true });
  }
});

// Route: Retry pattern
app.post('/api/async/retry-pattern', async (req, res) => {
  const { maxRetries = 3 } = req.body;

  async function retryAsync(fn, retries = maxRetries) {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await new Promise(r => setTimeout(r, 100));
      return retryAsync(fn, retries - 1);
    }
  }

  try {
    const result = await retryAsync(() => fetchUser(1));
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Race pattern
app.post('/api/async/race-pattern', async (req, res) => {
  const promises = [
    new Promise(r => setTimeout(() => r('First'), 100)),
    new Promise(r => setTimeout(() => r('Second'), 200)),
    new Promise(r => setTimeout(() => r('Third'), 150))
  ];

  try {
    const winner = await Promise.race(promises);
    res.json({
      pattern: 'Promise.race',
      winner,
      note: 'Returns first resolved promise'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route: Patterns guide
app.get('/api/async/patterns-guide', (req, res) => {
  res.json({
    patterns: [
      {
        name: 'Sequential',
        code: 'const a = await fn1(); const b = await fn2();',
        use: 'When tasks depend on each other',
        pros: 'Clear, easy to debug',
        cons: 'Slow (waits for each)'
      },
      {
        name: 'Parallel',
        code: 'const [a, b] = await Promise.all([fn1(), fn2()]);',
        use: 'Independent tasks',
        pros: 'Fast',
        cons: 'All or nothing'
      },
      {
        name: 'Race',
        code: 'const winner = await Promise.race([...]);',
        use: 'First to complete',
        pros: 'No waiting for slowest',
        cons: 'May lose data'
      },
      {
        name: 'Timeout',
        code: 'Promise.race([operation, timeoutPromise])',
        use: 'Prevent infinite waits',
        pros: 'Prevents hanging',
        cons: 'May interrupt valid work'
      },
      {
        name: 'Retry',
        code: 'async function retry(fn, n) { ... }',
        use: 'Transient failures',
        pros: 'Improves reliability',
        cons: 'Can mask issues'
      }
    ],
    bestPractices: [
      'Always handle errors with try-catch',
      'Use finally for cleanup',
      'Parallel when possible',
      'Implement timeouts',
      'Use Promise.all() for independent tasks',
      'Use Promise.race() for fastest result',
      'Avoid uncaught rejections'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Async/Await Patterns server on http://localhost:${PORT}`);
  console.log('📚 API Endpoints:');
  console.log('  POST /api/async/sequential-vs-parallel - Compare approaches');
  console.log('  POST /api/async/error-patterns - Error handling');
  console.log('  POST /api/async/cleanup - Cleanup patterns');
  console.log('  POST /api/async/timeout-pattern - Timeout handling');
  console.log('  POST /api/async/retry-pattern - Retry logic');
  console.log('  POST /api/async/race-pattern - Race pattern');
  console.log('  GET /api/async/patterns-guide - Complete guide');
});

module.exports = app;
