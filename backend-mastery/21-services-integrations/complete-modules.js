const fs = require('fs');
const path = require('path');

// Module configurations
const modules = [
  {
    id: '02',
    name: 'Stripe Webhooks',
    port: 6302,
    apiKey: 'STRIPE_SECRET_KEY',
    description: 'Process payments and subscriptions with Stripe webhooks'
  },
  {
    id: '03',
    name: 'Firebase Auth & Storage',
    port: 6303,
    apiKey: 'FIREBASE_API_KEY',
    description: 'User authentication and file storage using Firebase'
  },
  {
    id: '04',
    name: 'Transactional Email',
    port: 6304,
    apiKey: 'RESEND_API_KEY',
    description: 'Send transactional emails with Resend and SendGrid'
  },
  {
    id: '05',
    name: 'Supabase Storage',
    port: 6305,
    apiKey: 'SUPABASE_URL',
    description: 'Real-time database and file storage with Supabase'
  },
  {
    id: '06',
    name: 'Email Deliverability',
    port: 6306,
    apiKey: 'SENDGRID_API_KEY',
    description: 'Configure SPF, DKIM, DMARC for email authentication'
  },
  {
    id: '07',
    name: 'AWS S3 Presigned URLs',
    port: 6307,
    apiKey: 'AWS_ACCESS_KEY_ID',
    description: 'Upload/download files directly from S3 with presigned URLs'
  },
  {
    id: '08',
    name: 'Google Maps API',
    port: 6308,
    apiKey: 'GOOGLE_MAPS_API_KEY',
    description: 'Geolocation, maps, and directions using Google Maps'
  },
  {
    id: '09',
    name: 'Twilio SMS & OTP',
    port: 6309,
    apiKey: 'TWILIO_ACCOUNT_SID',
    description: 'Send SMS messages and OTP verification codes'
  },
  {
    id: '10',
    name: 'Speech to Text & TTS',
    port: 6310,
    apiKey: 'GOOGLE_CLOUD_KEY',
    description: 'Speech recognition and text-to-speech conversion'
  },
  {
    id: '11',
    name: 'PostHog Analytics',
    port: 6311,
    apiKey: 'POSTHOG_API_KEY',
    description: 'Event tracking and analytics with PostHog'
  },
  {
    id: '12',
    name: 'Cloudinary CDN',
    port: 6312,
    apiKey: 'CLOUDINARY_URL',
    description: 'Image optimization and CDN delivery with Cloudinary'
  }
];

// Generate App.jsx template
function generateAppJsx(moduleName, port) {
  return `import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:${port}/api';

function App() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!input.trim()) {
      setResponse('❌ Input required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(\`\${API_BASE}/test\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: input }),
      });
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>${moduleName}</h1>
      <div className="section">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter test data..."\n          rows="4"\n          disabled={loading}\n        />\n        <button onClick={handleTest} disabled={loading}>\n          {loading ? 'Testing...' : 'Send Request'}\n        </button>\n      </div>\n      <div className="section">\n        <h2>Response</h2>\n        <pre className="response">{response}</pre>\n      </div>\n    </div>\n  );\n}\n\nexport default App;`;
}

// Generate README.md template
function generateReadme(moduleNum, moduleName) {
  return `# ${moduleNum} - ${moduleName}\n\n## Overview\n${moduleName} integration for backend services.\n\n## Features\n- Full API integration\n- Webhook support\n- Error handling\n- Input validation\n\n## Quick Start\n\n\`\`\`bash\nnpm install\ncp .env.example .env\nnpm run dev\n\`\`\`\n\n## API Endpoints\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n| POST | \`/api/test\` | Test endpoint |\n\n## Environment Variables\n- Required API key in .env\n- See .env.example for details\n\n## Setup Instructions\n\nRefer to setup.md for detailed configuration.\n\n## Testing\n\nStart the server and use the React UI or curl:\n\n\`\`\`bash\ncurl -X POST http://localhost:6300/api/test -H \"Content-Type: application/json\" -d '{\"data\": \"test\"}'\n\`\`\`\n\n## Security\n\n- Store API keys in .env\n- Validate all inputs\n- Implement rate limiting\n- Use HTTPS in production\n\n## Next Steps\n\n- [ ] Implement all endpoints\n- [ ] Add database integration\n- [ ] Set up monitoring\n- [ ] Deploy to production\n`;
}

// Generate theory.md template
function generateTheory(moduleName) {
  return `# ${moduleName} - Theory\n\n## Overview\nThis module covers ${moduleName.toLowerCase()} integration.\n\n## Key Concepts\n\n### 1. Core Features\n- Feature overview\n- API capabilities\n- Use cases\n\n### 2. Security\n- API key management\n- Input validation\n- Rate limiting\n- Error handling\n\n### 3. Best Practices\n- Architecture patterns\n- Error handling\n- Monitoring\n- Cost optimization\n\n## Real-World Examples\n\n### Success Scenario\nImplementing proper integration reduces errors and improves reliability.\n\n### Common Pitfalls\n- Exposing API keys\n- No error handling\n- Missing input validation\n- Ignoring rate limits\n\n## Implementation Checklist\n\n- [ ] Get API credentials\n- [ ] Set up environment variables\n- [ ] Implement basic endpoints\n- [ ] Add error handling\n- [ ] Implement rate limiting\n- [ ] Add monitoring\n- [ ] Deploy to production\n\n## References\n\n- Official documentation\n- API reference guide\n`;
}

// Generate setup.md template\nfunction generateSetup(moduleName, port, apiKey) {\n  return `# Setup Guide - ${moduleName}\n\n## Step 1: Get API Credentials\n\n1. Sign up on the service platform\n2. Navigate to API section\n3. Create new API key\n4. Copy the key securely\n\n## Step 2: Install Dependencies\n\n\`\`\`bash\nnpm install\n\`\`\`\n\n## Step 3: Create Environment File\n\n\`\`\`bash\ncp .env.example .env\n\`\`\`\n\nEdit \`.env\`:\n\n\`\`\`env\n${apiKey}=your-api-key-here\nHTTP_PORT=${port}\nFRONTEND_URL=http://localhost:3000\nNODE_ENV=development\n\`\`\`\n\n## Step 4: Start Server\n\n\`\`\`bash\nnpm run dev\n\`\`\`\n\n## Step 5: Test Endpoints\n\n\`\`\`bash\ncurl http://localhost:${port}/health\ncurl -X POST http://localhost:${port}/api/test -H \"Content-Type: application/json\" -d '{\"data\": \"test\"}'\n\`\`\`\n\n## Troubleshooting\n\n### API Key Error\n- Verify .env file exists\n- Check API key is correct\n- Restart server\n\n### Connection Error\n- Check port is available\n- Verify API service is running\n- Check network connectivity\n\n## Production Deployment\n\n1. Store secrets in secure vault\n2. Enable HTTPS\n3. Set up monitoring\n4. Configure rate limiting\n5. Add logging\n6. Set up backups\n\n## Resources\n\n- Official docs\n- API reference\n- Community forums\n`;\n}\n\n// Main function\nfunction generateAllModules() {\n  const basePath = '/Users/avishjain/Downloads/backend-mastery/21-services-integrations';\n  \n  modules.forEach(module => {\n    const moduleDir = path.join(basePath, `${module.id}-*`);\n    // Note: This is a simple generator, actual implementation would need glob or similar\n    console.log(`Generating files for module ${module.id}: ${module.name}`);\n    console.log(`  Port: ${module.port}`);\n    console.log(`  API Key: ${module.apiKey}`);\n  });\n}\n\nconsole.log('Module Generator Ready');\nconsole.log('Run: node complete-modules.js');\n";
