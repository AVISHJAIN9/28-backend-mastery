// Get info about Linux CLI tools
const getInfo = (req, res) => {
  res.json({
    title: "Linux CLI: grep, awk, curl",
    description: "Master text processing and HTTP requests in the terminal",
    tools: {
      grep: "Search text patterns in files or streams",
      awk: "Pattern scanning and text processing language",
      curl: "Transfer data using URLs (HTTP/HTTPS)"
    },
    endpoints: {
      '/api/grep': 'Simulate grep command',
      '/api/awk': 'Simulate awk command',
      '/api/curl': 'Simulate curl command',
      '/api/test': 'Get test data'
    }
  });
};

// Get test endpoint
const getTest = (req, res) => {
  res.json({
    message: 'Test endpoint working',
    timestamp: new Date().toISOString(),
    examples: {
      grep: '/api/grep?pattern=error&text=Log%20file%20with%20error%20messages',
      awk: '/api/awk?data=name:age:city,John:25:NYC',
      curl: '/api/curl?url=https://api.example.com/data'
    }
  });
};

// Simulate grep functionality
const testGrep = (req, res) => {
  const { pattern, text } = req.query;
  
  if (!pattern || !text) {
    return res.status(400).json({ error: 'pattern and text query parameters required' });
  }

  try {
    const regex = new RegExp(pattern, 'gi');
    const matches = text.match(regex) || [];
    const lines = text.split('\n').filter(line => regex.test(line));
    
    res.json({
      tool: 'grep',
      pattern,
      matches: matches.length,
      matchedLines: lines,
      percentMatch: ((matches.length / text.length) * 100).toFixed(2),
      example: 'grep "error" logfile.txt | wc -l'
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid regex pattern' });
  }
};

// Simulate awk functionality
const testAwk = (req, res) => {
  const { data } = req.query;
  
  if (!data) {
    return res.status(400).json({ error: 'data query parameter required' });
  }

  try {
    const [header, ...rows] = data.split(';');
    const fields = header.split(':');
    const parsed = rows.map(row => {
      const values = row.split(':');
      const obj = {};
      fields.forEach((field, i) => {
        obj[field] = values[i];
      });
      return obj;
    });

    res.json({
      tool: 'awk',
      fields: fields.length,
      records: parsed.length,
      schema: fields,
      data: parsed,
      example: 'awk -F: \'{print $1, $3}\' file.txt'
    });
  } catch (err) {
    res.status(400).json({ error: 'Error parsing data' });
  }
};

// Simulate curl functionality
const testCurl = (req, res) => {
  const { url, method = 'GET' } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'url query parameter required' });
  }

  res.json({
    tool: 'curl',
    method,
    url,
    simulated: true,
    response: {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'Server': 'simulated-server/1.0'
      },
      body: { data: 'Sample response from ' + url }
    },
    timing: {
      total: '150ms',
      connect: '50ms',
      ttfb: '100ms'
    },
    example: 'curl -X GET https://api.example.com/users'
  });
};

module.exports = {
  getInfo,
  getTest,
  testGrep,
  testAwk,
  testCurl
  });
};

// Test grep functionality
const testGrep = (req, res) => {
  const { pattern, text } = req.query;
  const lines = text.split('\n');
  const matches = lines.filter(line => new RegExp(pattern).test(line));
  res.json({ pattern, matches, count: matches.length });
};

// Test awk field processing
const testAwk = (req, res) => {
  const { data } = req.query;
  const lines = data.split('\n');
  const fields = lines.map(line => line.split(/\s+/));
  res.json({ fields, summary: `Processed ${fields.length} lines` });
};

// Simulate curl request testing
const testCurl = (req, res) => {
  const { url, method = 'GET' } = req.query;
  res.json({
    method,
    url,
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    message: 'curl simulation successful'
  });
};

// Test endpoint
const getTest = (req, res) => {
  res.json({ status: "ok", module: "01-linux-cli-grep-awk-curl" });
};

module.exports = { getInfo, getTest, testGrep, testAwk, testCurl };