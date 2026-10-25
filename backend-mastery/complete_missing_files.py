#!/usr/bin/env python3
"""
Complete all missing package.json and server.js files across all modules
Usage: python3 complete_missing_files.py
"""

import os
import json
from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

# Map module names to their primary tech stack
MODULE_CONFIG = {
    '02-controllers-api': {
        'main': 'controller.js',
        'description': 'Controllers & API patterns',
        'keywords': ['controller', 'rest', 'api', 'routes'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'uuid'],
        'portBase': 5000
    },
    '03-middleware': {
        'main': 'middleware.js',
        'description': 'Express middleware patterns',
        'keywords': ['middleware', 'express', 'auth', 'validation'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'joi', 'jsonwebtoken'],
        'portBase': 4000
    },
    '04-models-database': {
        'main': 'controller.js',
        'description': 'Database models & queries',
        'keywords': ['database', 'model', 'mongoose', 'schema'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'mongoose', 'joi'],
        'portBase': 5100
    },
    '05-realtime-communication': {
        'main': 'controller.js',
        'description': 'Real-time features with WebSockets',
        'keywords': ['websocket', 'real-time', 'socket.io', 'live'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'socket.io'],
        'portBase': 5200
    },
    '06-nodejs-internals': {
        'main': 'controller.js',
        'description': 'Node.js internals & module system',
        'keywords': ['nodejs', 'internals', 'module', 'event-loop'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 3000
    },
    '08-caching': {
        'main': 'controller.js',
        'description': 'Redis caching patterns',
        'keywords': ['cache', 'redis', 'performance', 'optimization'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'redis', 'winston'],
        'portBase': 6400
    },
    '09-jobs-queues': {
        'main': 'controller.js',
        'description': 'Job queues & async processing',
        'keywords': ['queue', 'jobs', 'background', 'async'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'bull', 'bull-board'],
        'portBase': 5300
    },
    '10-observability': {
        'main': 'controller.js',
        'description': 'Logging, monitoring & observability',
        'keywords': ['logging', 'monitoring', 'observability', 'metrics'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'winston', 'pino'],
        'portBase': 4000
    },
    '11-testing': {
        'main': 'controller.js',
        'description': 'Testing strategies & frameworks',
        'keywords': ['testing', 'jest', 'mocha', 'unit-test'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 5400
    },
    '12-devops-cicd': {
        'main': 'controller.js',
        'description': 'DevOps & CI/CD pipelines',
        'keywords': ['devops', 'cicd', 'docker', 'kubernetes'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 5500
    },
    '14-design-patterns': {
        'main': 'controller.js',
        'description': 'Design patterns in Node.js',
        'keywords': ['design-pattern', 'architecture', 'structure'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 5600
    },
    '15-algorithms-dsa': {
        'main': 'controller.js',
        'description': 'Algorithms & data structures',
        'keywords': ['algorithm', 'dsa', 'data-structure', 'performance'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 5700
    },
    '16-network-http': {
        'main': 'controller.js',
        'description': 'HTTP & networking concepts',
        'keywords': ['http', 'network', 'protocol', 'socket'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'axios'],
        'portBase': 5800
    },
    '17-linux-os': {
        'main': 'controller.js',
        'description': 'Linux OS & system programming',
        'keywords': ['linux', 'os', 'system', 'shell'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 5900
    },
    '18-cryptography': {
        'main': 'controller.js',
        'description': 'Cryptography & hashing algorithms',
        'keywords': ['crypto', 'hashing', 'encryption', 'security'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'bcrypt', 'crypto-js'],
        'portBase': 6000
    },
    '19-payments-fintech': {
        'main': 'controller.js',
        'description': 'Payment processing & fintech',
        'keywords': ['payments', 'stripe', 'fintech', 'transactions'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'stripe'],
        'portBase': 6100
    },
    '20-code-quality-git': {
        'main': 'controller.js',
        'description': 'Code quality & Git workflows',
        'keywords': ['code-quality', 'git', 'linting', 'formatting'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 6200
    },
    '21-services-integrations': {
        'main': 'controller.js',
        'description': 'Third-party service integrations',
        'keywords': ['integration', 'api', 'service', 'external'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'axios'],
        'portBase': 6300
    },
    '22-compliance-privacy': {
        'main': 'controller.js',
        'description': 'Compliance, privacy & regulations',
        'keywords': ['compliance', 'privacy', 'gdpr', 'security'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 6400
    },
    '24-architecture-patterns': {
        'main': 'controller.js',
        'description': 'Architecture & system design',
        'keywords': ['architecture', 'system-design', 'pattern'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 6500
    },
    '25-file-media-storage': {
        'main': 'controller.js',
        'description': 'File uploads & media storage',
        'keywords': ['file', 'storage', 'media', 's3'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'multer', 'aws-sdk'],
        'portBase': 6600
    },
    '26-notifications-communication': {
        'main': 'controller.js',
        'description': 'Email, SMS & notifications',
        'keywords': ['notification', 'email', 'sms', 'messaging'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'nodemailer', 'twilio'],
        'portBase': 6700
    },
    '28-real-world-patterns': {
        'main': 'controller.js',
        'description': 'Real-world application patterns',
        'keywords': ['real-world', 'pattern', 'production', 'example'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'mongoose'],
        'portBase': 6800
    },
    '30-saas-multitenancy': {
        'main': 'controller.js',
        'description': 'SaaS & multi-tenancy patterns',
        'keywords': ['saas', 'multi-tenant', 'subscription', 'isolation'],
        'deps': ['express', 'cors', 'helmet', 'dotenv', 'mongoose'],
        'portBase': 6900
    },
}

def generate_package_json(module_name, module_number, sub_folder_name, sub_folder_number):
    """Generate package.json content based on module type"""
    config = MODULE_CONFIG.get(module_name, {
        'main': 'server.js',
        'description': 'Backend module',
        'keywords': ['module', 'backend', 'nodejs'],
        'deps': ['express', 'cors', 'helmet', 'dotenv'],
        'portBase': 4000 + (module_number * 100)
    })
    
    name = f"{module_name.lstrip('0123456789-').lower()}-{sub_folder_name.lstrip('0123456789-').lower()}"
    
    deps = {
        'express': '^4.18.2',
        'cors': '^2.8.5',
        'helmet': '^7.0.0',
        'dotenv': '^16.3.1',
    }
    
    # Add module-specific dependencies
    for dep in config.get('deps', []):
        if dep == 'uuid':
            deps['uuid'] = '^9.0.0'
        elif dep == 'jsonwebtoken':
            deps['jsonwebtoken'] = '^9.0.2'
        elif dep == 'joi':
            deps['joi'] = '^17.11.0'
        elif dep == 'mongoose':
            deps['mongoose'] = '^7.6.3'
        elif dep == 'socket.io':
            deps['socket.io'] = '^4.7.2'
        elif dep == 'redis':
            deps['redis'] = '^4.6.0'
        elif dep == 'winston':
            deps['winston'] = '^3.11.0'
        elif dep == 'pino':
            deps['pino'] = '^8.16.2'
        elif dep == 'bull':
            deps['bull'] = '^4.11.5'
        elif dep == 'bull-board':
            deps['bull-board'] = '^5.9.0'
        elif dep == 'axios':
            deps['axios'] = '^1.6.2'
        elif dep == 'bcrypt':
            deps['bcrypt'] = '^5.1.1'
        elif dep == 'crypto-js':
            deps['crypto-js'] = '^4.2.0'
        elif dep == 'stripe':
            deps['stripe'] = '^13.10.0'
        elif dep == 'multer':
            deps['multer'] = '^1.4.5-lts.1'
        elif dep == 'aws-sdk':
            deps['aws-sdk'] = '^2.1504.0'
        elif dep == 'nodemailer':
            deps['nodemailer'] = '^6.9.7'
        elif dep == 'twilio':
            deps['twilio'] = '^3.85.0'
    
    return {
        'name': name,
        'version': '1.0.0',
        'description': f'{module_name} - {sub_folder_name}: {config.get("description", "Module implementation")}',
        'main': config.get('main', 'server.js'),
        'scripts': {
            'start': 'node server.js',
            'dev': 'nodemon server.js',
            'test': 'echo "Run manual tests via API"'
        },
        'keywords': config.get('keywords', ['module', 'backend', 'nodejs']),
        'dependencies': deps,
        'devDependencies': {
            'nodemon': '^3.0.1'
        }
    }

def generate_server_js(module_name, module_number, sub_folder_name, sub_folder_number, port):
    """Generate server.js content"""
    
    config = MODULE_CONFIG.get(module_name, {
        'description': 'Backend module',
        'main': 'server.js'
    })
    safe_name = sub_folder_name.replace('-', ' ').title()
    module_safe_name = module_name.replace('-', ' ').title()
    
    return f"""require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');

const app = express();
const HTTP_PORT = process.env.HTTP_PORT || {port};

// ==================== Middleware ====================

// Security
app.use(helmet());
app.use(cors({{{{'origin': process.env.FRONTEND_URL || 'http://localhost:3000'}}}}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({{ extended: true }}));

// ==================== Routes ====================

app.use('/api', routes);

// ==================== Health Check ====================

app.get('/health', (req, res) => {{
  res.json({{ 
    status: 'ok',
    module: '{safe_name}',
    category: '{module_safe_name}',
    port: HTTP_PORT,
    timestamp: new Date().toISOString()
  }});
}});

// ==================== Root Endpoint ====================

app.get('/', (req, res) => {{
  res.json({{
    name: '{safe_name}',
    module: '{module_name} - {sub_folder_number}',
    description: '{config.get("description", "Backend module")}',
    version: '1.0.0',
    category: '{module_safe_name}',
    endpoints: {{
      health: '/health',
      api: '/api'
    }}
  }});
}});

// ==================== Error Handler ====================

app.use((err, req, res, next) => {{
  console.error('Error:', err.message);
  res.status(err.status || 500).json({{
    error: err.message || 'Internal server error',
    status: err.status || 500
  }});
}});

// ==================== Start Server ====================

const server = app.listen(HTTP_PORT, () => {{
  console.log(`✓ {safe_name} running on http://localhost:${{HTTP_PORT}}`);
  console.log(`✓ Health check: http://localhost:${{HTTP_PORT}}/health`);
  console.log(`✓ API root: http://localhost:${{HTTP_PORT}}/api`);
}});

process.on('SIGTERM', () => {{
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {{
    console.log('Server closed');
    process.exit(0);
  }});
}});

module.exports = app;
"""

def process_module(module_path):
    """Process a single module folder and create missing files"""
    module_name = module_path.name
    created_count = 0
    skipped_count = 0
    
    # Get module number from folder name (e.g., "02-controllers-api" -> 2)
    module_num = int(module_name.split('-')[0])
    
    # Skip 07-security and 29-ai-ml-backend
    if module_num in [7, 29]:
        print(f"⊘ Skipping {module_name} (excluded)")
        return 0, 0
    
    if not module_path.is_dir():
        return 0, 0
    
    # Get all subfolders
    subfolders = [d for d in module_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    for sub_idx, subfolder in enumerate(sorted(subfolders), 1):
        sub_name = subfolder.name
        
        # Check if package.json exists
        package_path = subfolder / 'package.json'
        server_path = subfolder / 'server.js'
        
        # Only create if both are missing
        if not package_path.exists() or not server_path.exists():
            try:
                # Get port number based on module config or generate default
                config = MODULE_CONFIG.get(module_name, {'portBase': 4000 + (module_num * 100)})
                port = config['portBase'] + sub_idx
                
                # Create package.json
                if not package_path.exists():
                    pkg_data = generate_package_json(module_name, module_num, sub_name, sub_idx)
                    with open(package_path, 'w') as f:
                        json.dump(pkg_data, f, indent=2)
                    created_count += 1
                    print(f"  ✓ Created {package_path.relative_to(BASE_PATH)}")
                
                # Create server.js
                if not server_path.exists():
                    server_content = generate_server_js(module_name, module_num, sub_name, sub_idx, port)
                    with open(server_path, 'w') as f:
                        f.write(server_content)
                    created_count += 1
                    print(f"  ✓ Created {server_path.relative_to(BASE_PATH)}")
                    
            except Exception as e:
                print(f"  ✗ Error in {sub_name}: {e}")
                skipped_count += 1
    
    return created_count, skipped_count

def main():
    """Main execution"""
    print("=" * 70)
    print("Backend Mastery - Completing Missing Files")
    print("=" * 70)
    print()
    
    total_created = 0
    total_skipped = 0
    
    # Get all main module folders
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    
    for module_path in modules:
        module_name = module_path.name
        print(f"📁 {module_name}")
        
        created, skipped = process_module(module_path)
        total_created += created
        total_skipped += skipped
        
        if created > 0:
            print(f"   → Created {created} files")
        print()
    
    print("=" * 70)
    print(f"✓ Summary: {total_created} files created")
    if total_skipped > 0:
        print(f"✗ {total_skipped} errors encountered")
    print("=" * 70)

if __name__ == '__main__':
    main()
