const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const MODULES_ROOT = path.join(__dirname, '../../..');

// Map of module numbers to their display names
const moduleNames = {
  '01-authentication': 'Authentication & User Management',
  '02-controllers-api': 'Controllers & API Design',
  '03-middleware': 'Middleware & Express',
  '04-models-database': 'Models & Database',
  '05-realtime-communication': 'Realtime Communication',
  '06-nodejs-internals': 'Node.js Internals',
  '07-security': 'Security Best Practices',
  '08-caching': 'Caching Strategies',
  '09-jobs-queues': 'Jobs & Message Queues',
  '10-observability': 'Observability & Monitoring',
  '11-testing': 'Testing & QA',
  '12-devops-cicd': 'DevOps & CI/CD',
  '13-typescript-deep': 'TypeScript Deep Dive',
  '14-design-patterns': 'Design Patterns',
  '15-algorithms-dsa': 'Algorithms & DSA',
  '16-network-http': 'Network & HTTP',
  '17-linux-os': 'Linux & OS Fundamentals',
  '18-cryptography': 'Cryptography',
  '19-payments-fintech': 'Payments & Fintech',
  '20-code-quality-git': 'Code Quality & Git',
  '21-services-integrations': 'Services & Integrations',
  '22-compliance-privacy': 'Compliance & Privacy',
  '23-i18n': 'Internationalization (i18n)',
  '24-architecture-patterns': 'Architecture Patterns',
  '25-file-media-storage': 'File & Media Storage',
  '26-notifications-communication': 'Notifications & Communication',
  '28-real-world-patterns': 'Real-World Patterns',
  '29-ai-ml-backend': 'AI & Machine Learning',
  '30-saas-multitenancy': 'SaaS & Multi-Tenancy'
};

// Get all modules
router.get('/modules', (req, res) => {
  try {
    const modules = [];
    const items = fs.readdirSync(MODULES_ROOT);

    items.forEach((item, index) => {
      const fullPath = path.join(MODULES_ROOT, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && /^\d{2}-/.test(item)) {
        const moduleNum = item.substring(0, 2);
        const name = moduleNames[item] || item;

        // Get files from first sub-module
        let files = [];
        let subModuleCount = 0;
        
        try {
          const subItems = fs.readdirSync(fullPath);
          const subModules = subItems.filter(f => {
            try {
              return fs.statSync(path.join(fullPath, f)).isDirectory() && /^\d{2}-/.test(f);
            } catch (e) {
              return false;
            }
          });
          
          subModuleCount = subModules.length;
          
          const firstSubModule = subModules[0];
          if (firstSubModule) {
            const subPath = path.join(fullPath, firstSubModule);
            files = fs.readdirSync(subPath)
              .filter(f => /\.(js|jsx|html|md|json|ts|tsx)$/.test(f))
              .slice(0, 5);
          }
        } catch (e) {
          console.error(`Error reading submodules for ${item}:`, e.message);
        }

        modules.push({
          number: moduleNum,
          name,
          path: item,
          files,
          subModuleCount
        });
      }
    });

    res.json(modules.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
  } catch (error) {
    console.error('Error in /api/modules:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get module detail
router.get('/module/:modulePath', (req, res) => {
  try {
    const modulePath = req.params.modulePath;
    const fullPath = path.join(MODULES_ROOT, modulePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const name = moduleNames[modulePath] || modulePath;
    const files = fs.readdirSync(fullPath)
      .filter(f => /\.(js|jsx|html|md|json|ts|tsx)$/.test(f));

    res.json({
      name,
      path: modulePath,
      files
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get files in a module
router.get('/files/:modulePath', (req, res) => {
  try {
    const modulePath = req.params.modulePath;
    const fullPath = path.join(MODULES_ROOT, modulePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const files = [];
    const items = fs.readdirSync(fullPath);

    items.forEach(item => {
      const itemPath = path.join(fullPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile()) {
        files.push({
          name: item,
          size: `${(stat.size / 1024).toFixed(2)} KB`,
          type: path.extname(item).substring(1)
        });
      }
    });

    res.json(files.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file content
router.get('/file/:modulePath/:fileName', (req, res) => {
  try {
    const modulePath = req.params.modulePath;
    const fileName = decodeURIComponent(req.params.fileName);
    const filePath = path.join(MODULES_ROOT, modulePath, fileName);

    // Security check
    if (!filePath.startsWith(path.join(MODULES_ROOT, modulePath))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.type('text/plain').send(content);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sub-modules in a module
router.get('/submodules/:modulePath', (req, res) => {
  try {
    const modulePath = req.params.modulePath;
    const fullPath = path.join(MODULES_ROOT, modulePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const subModules = [];
    const items = fs.readdirSync(fullPath);

    items.forEach(item => {
      const itemPath = path.join(fullPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory() && /^\d{2}-/.test(item)) {
        const files = fs.readdirSync(itemPath)
          .filter(f => /\.(js|jsx|html|md|json|ts|tsx)$/.test(f));

        subModules.push({
          name: item,
          files,
          path: `${modulePath}/${item}`
        });
      }
    });

    res.json(subModules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
