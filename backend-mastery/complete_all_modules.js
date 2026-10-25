#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Module configurations
const modules = {
  '17-linux-os': {
    '02-file-permissions-chmod-chown': {
      title: 'File Permissions: chmod, chown',
      description: 'Master Linux file ownership and permission management',
      port: 5702
    },
    '03-process-management-ps-kill-htop': {
      title: 'Process Management: ps, kill, htop',
      description: 'Monitor and control running processes',
      port: 5703
    },
    '04-ssh-keys-config-tunneling': {
      title: 'SSH Keys, Config & Tunneling',
      description: 'Secure remote access and network tunneling',
      port: 5704
    },
    '05-cron-syntax': {
      title: 'Cron Syntax & Job Scheduling',
      description: 'Automate tasks with cron jobs',
      port: 5705
    },
    '06-systemd-service-management': {
      title: 'systemd Service Management',
      description: 'Manage services and system startup',
      port: 5706
    },
    '07-disk-memory-cpu-monitoring': {
      title: 'Disk, Memory, CPU Monitoring',
      description: 'Monitor system resources and performance',
      port: 5707
    },
    '08-firewall-ufw-basics': {
      title: 'Firewall: UFW Basics',
      description: 'Configure Linux firewall rules',
      port: 5708
    },
    '09-log-management-logrotate': {
      title: 'Log Management: logrotate',
      description: 'Manage system and application logs',
      port: 5709
    }
  },
  '18-cryptography': {
    '02-symmetric-encryption-aes': {
      title: 'Symmetric Encryption: AES',
      description: 'Encrypt data with AES encryption',
      port: 5802
    },
    '03-asymmetric-rsa-ecc-jwt-rs256': {
      title: 'Asymmetric Encryption: RSA, ECC, JWT',
      description: 'Public key cryptography and JWT tokens',
      port: 5803
    },
    '04-base64-encoding-not-encryption': {
      title: 'Base64 Encoding (Not Encryption!)',
      description: 'Understand the difference between encoding and encryption',
      port: 5804
    },
    '05-hmac-message-authentication': {
      title: 'HMAC: Message Authentication Codes',
      description: 'Verify message integrity with HMAC',
      port: 5805
    },
    '06-salting-rainbow-table-prevention': {
      title: 'Salting & Rainbow Table Prevention',
      description: 'Protect against common hashing attacks',
      port: 5806
    },
    '07-digital-signatures-sign-verify': {
      title: 'Digital Signatures: Sign & Verify',
      description: 'Sign and verify data authenticity',
      port: 5807
    },
    '08-envelope-encryption-kms': {
      title: 'Envelope Encryption & KMS',
      description: 'Key management and envelope encryption',
      port: 5808
    },
    '09-bcrypt-password-hashing': {
      title: 'bcrypt Password Hashing',
      description: 'Secure password hashing with bcrypt',
      port: 5809
    }
  }
};

// Template functions
function createReadme(title, description) {
  return `# ${title}

## What is this?
${description}

## Why does it matter?
Understanding these concepts is crucial for:
- Building secure systems
- Protecting user data
- Implementing best practices
- Passing security audits
- Writing production-ready code

## How it works (step by step)
See theory.md for detailed explanation

## Key concepts
- Refer to theory.md
- Check setup.md for examples
- Use preview.html for interactive testing

## Common mistakes
- See README.md and theory.md for details

## Real world usage
- Practical examples in controller.js
- Test endpoints in /api routes`;
}

function createTheory(title) {
  return `# ${title} - Theory

## Overview
This module covers the fundamental concepts and implementations of ${title.toLowerCase()}.

## Key Concepts
1. **Definition**: Understanding what this is and why it matters
2. **How it works**: Step-by-step explanation
3. **Best practices**: Industry standards and recommendations
4. **Common pitfalls**: What to avoid
5. **Real-world usage**: Practical applications

## Security Considerations
- Always validate input
- Use industry-standard implementations
- Keep dependencies updated
- Follow principle of least privilege
- Never hardcode secrets

## Testing
See setup.md for testing instructions
Use preview.html for interactive testing

## Further Reading
- Official documentation
- RFC standards
- Security best practices guides
- OWASP resources`;
}

function createSetup() {
  return `# Setup Guide

## Dependencies
\`\`\`bash
npm install
\`\`\`

Required packages installed:
- express
- cors
- helmet
- dotenv
- nodemon (dev)

## Environment Variables
Create .env file with:
\`\`\`
HTTP_PORT=PORT_NUMBER
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
\`\`\`

## How to run
\`\`\`bash
# Development mode
npm run dev

# Production mode
npm start
\`\`\`

## How to test
1. Access /health endpoint for status
2. Access /api/info for module information
3. Try test endpoints from preview.html
4. Use curl or Postman to test API endpoints

## Interactive UI
Open preview.html in your browser for interactive testing`;
}

function createSetupMd(port) {
  return createSetup().replace('PORT_NUMBER', port.toString());
}

// Populate a module directory
function populateModule(moduleDir, config) {
  const files = {
    'README.md': createReadme(config.title, config.description),
    'theory.md': createTheory(config.title),
    'setup.md': createSetupMd(config.port),
    'checklist.md': `# Checklist
- [ ] Understood the concept
- [ ] Read theory.md
- [ ] Set up environment
- [ ] Ran setup.md
- [ ] Tested all endpoints
- [ ] Tried interactive preview
- [ ] Tested edge cases
- [ ] Reviewed best practices`
  };

  Object.entries(files).forEach(([filename, content]) => {
    const filepath = path.join(moduleDir, filename);
    if (!fs.existsSync(filepath) || fs.statSync(filepath).size < 100) {
      fs.writeFileSync(filepath, content);
      console.log(`✓ ${filename}`);
    }
  });
}

// Main execution
console.log('🚀 Populating all modules with content...\n');

Object.entries(modules).forEach(([project, projectModules]) => {
  console.log(`\n📁 ${project}`);
  Object.entries(projectModules).forEach(([dirname, config]) => {
    const moduleDir = path.join(__dirname, project, dirname);
    if (fs.existsSync(moduleDir)) {
      console.log(`  📦 ${dirname}`);
      populateModule(moduleDir, config);
    }
  });
});

console.log('\n✅ All modules populated successfully!');
