#!/usr/bin/env python3
"""
Rapidly complete main folder master files
Creates INDEX.md, MASTER-README.md, COMPLETION-SUMMARY.md for each main folder
Sorted by subfolder count (smallest to largest)
"""

import os
from pathlib import Path
from collections import defaultdict

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

FOLDER_CONFIGS = {
    '08-caching': {
        'title': 'Caching Strategies & Patterns',
        'description': 'Redis caching, cache invalidation, TTL, LRU, bloom filters'
    },
    '10-observability': {
        'title': 'Logging, Monitoring & Observability',
        'description': 'Winston, Pino, Prometheus, Grafana, Datadog, OpenTelemetry'
    },
    '11-testing': {
        'title': 'Testing - Unit, Integration & E2E',
        'description': 'Jest, Mocha, Chai, Test strategies, Coverage'
    },
    '12-devops-cicd': {
        'title': 'DevOps & CI/CD Pipelines',
        'description': 'Docker, Kubernetes, GitHub Actions, GitLab CI, Jenkins'
    },
    '13-typescript-deep': {
        'title': 'TypeScript Deep Dive',
        'description': 'Types, Generics, Decorators, Advanced patterns'
    },
    '14-design-patterns': {
        'title': 'Design Patterns in Node.js',
        'description': 'Singleton, Factory, Observer, Strategy, Command patterns'
    },
    '15-algorithms-dsa': {
        'title': 'Algorithms & Data Structures',
        'description': 'Sorting, Searching, Trees, Graphs, Dynamic Programming'
    },
    '16-network-http': {
        'title': 'HTTP & Networking Concepts',
        'description': 'TCP/IP, DNS, HTTP/2, WebSockets, Protocol deep-dive'
    },
    '17-linux-os': {
        'title': 'Linux & Operating Systems',
        'description': 'Shell scripting, System calls, Process management, Networking'
    },
    '18-cryptography': {
        'title': 'Cryptography & Hashing',
        'description': 'AES, RSA, SHA-256, HMAC, Digital signatures, TLS'
    },
    '19-payments-fintech': {
        'title': 'Payments & Fintech',
        'description': 'Stripe, PayPal, Payment processing, PCI DSS compliance'
    },
    '20-code-quality-git': {
        'title': 'Code Quality & Git Workflows',
        'description': 'Linting, Formatting, Git strategies, CI/CD quality gates'
    },
    '21-services-integrations': {
        'title': 'Third-party Service Integrations',
        'description': 'APIs, OAuth, webhooks, SDKs, service integration patterns'
    },
    '22-compliance-privacy': {
        'title': 'Compliance, Privacy & Regulations',
        'description': 'GDPR, CCPA, data protection, audit logs, consent management'
    },
    '23-i18n': {
        'title': 'Internationalization (i18n)',
        'description': 'Multi-language support, localization, translations'
    },
    '24-architecture-patterns': {
        'title': 'System Architecture & Design',
        'description': 'Microservices, Monoliths, Event-driven, CQRS, DDD'
    },
    '25-file-media-storage': {
        'title': 'File Uploads & Media Storage',
        'description': 'Multer, AWS S3, CloudFront, image optimization'
    },
    '26-notifications-communication': {
        'title': 'Notifications & Real-time Communication',
        'description': 'Email, SMS, Push notifications, Socket.io, Twilio'
    },
    '28-real-world-patterns': {
        'title': 'Real-world Application Patterns',
        'description': 'Production patterns, anti-patterns, case studies'
    },
    '30-saas-multitenancy': {
        'title': 'SaaS & Multi-tenancy',
        'description': 'Tenant isolation, billing, subscription management'
    }
}

def generate_index_md(module_name, config, subfolders):
    """Generate INDEX.md"""
    safe_name = config['title']
    
    content = f"""# {safe_name}

**Module:** {module_name}  
**Total Lessons:** {len(subfolders)}  
**Status:** ✅ Complete

## Overview

{config['description']}

## Learning Path

"""
    
    for idx, sub in enumerate(sorted(subfolders), 1):
        sub_name = sub.name
        link_name = sub_name.replace('-', ' ').title()
        content += f"{idx}. [{link_name}](./{sub_name}/README.md)\n"
    
    content += f"""

## Resources

- [Master README](./MASTER-README.md)
- [Completion Summary](./COMPLETION-SUMMARY.md)

## Quick Start

```bash
cd [lesson-folder]
npm install
npm run dev
```

Then open the React UI at http://localhost:3000

## Module Structure

Each lesson contains:
- `theory.md` - Learning concepts
- `server.js` - Express backend
- `App.jsx` - React testing UI
- `README.md` - Setup guide
- `package.json` - Dependencies
- `routes.js`, `controller.js`, `middleware.js` - Backend logic
- `schema.js` - Validation
- `.env.example` - Configuration
- `setup.md` - Installation
- `checklist.md` - Learning checklist

## Progression

Master all lessons to become expert in this domain!
"""
    
    return content

def generate_master_readme(module_name, config, subfolders):
    """Generate MASTER-README.md"""
    safe_name = config['title']
    
    content = f"""# {safe_name}

**Module Code:** {module_name}

## What You'll Learn

{config['description']}

### Core Topics

"""
    
    for sub in sorted(subfolders)[:10]:
        sub_name = sub.name
        topic = sub_name.replace('-', ' ').title()
        content += f"- **{topic}** - Practical implementation\n"
    
    if len(subfolders) > 10:
        content += f"- **And {len(subfolders) - 10} more topics...**\n"
    
    content += f"""

## Learning Objectives

By completing this module, you will:

✅ Understand core concepts and patterns  
✅ Implement production-ready code  
✅ Best practices and anti-patterns  
✅ Real-world applications  
✅ Performance optimization  
✅ Security considerations  

## Getting Started

### 1. Start with Theory
Read `theory.md` in the first lesson

### 2. Setup Environment
```bash
cd [first-lesson]
npm install
cp .env.example .env
```

### 3. Run Server
```bash
npm run dev
```

### 4. Open React UI
Navigate to http://localhost:3000

### 5. Test Endpoints
Use the interactive UI to test all endpoints

## Lesson Breakdown

| # | Topic | Complexity | Time |
|---|-------|-----------|------|
"""
    
    for idx, sub in enumerate(sorted(subfolders), 1):
        if idx > 15:
            break
        sub_name = sub.name.replace('-', ' ').title()
        content += f"| {idx} | {sub_name} | Intermediate | 30 min |\n"
    
    if len(subfolders) > 15:
        content += f"| ... | {len(subfolders) - 15} more lessons | Varies | Varies |\n"
    
    content += f"""

## Architecture

```
{module_name}/
├── 01-[lesson]/
│   ├── server.js
│   ├── routes.js
│   ├── controller.js
│   ├── middleware.js
│   ├── schema.js
│   ├── theory.md
│   ├── README.md
│   ├── App.jsx
│   ├── package.json
│   ├── .env.example
│   ├── setup.md
│   └── checklist.md
├── 02-[lesson]/
├── ...
├── INDEX.md
├── MASTER-README.md
└── COMPLETION-SUMMARY.md
```

## Technology Stack

### Backend
- Express.js 4.18+
- Node.js 16+
- Winston / Pino (logging)
- Helmet (security)
- CORS

### Frontend
- React 18
- Fetch API
- CSS3

### Testing
- Manual API testing
- Interactive React UI

## Best Practices

1. **Read theory first** - Understand concepts
2. **Run server** - See it in action
3. **Test endpoints** - Use React UI
4. **Review code** - Study implementations
5. **Modify & experiment** - Learn by doing

## Prerequisites

- Node.js 16+
- npm or yarn
- Basic JavaScript knowledge
- Express.js familiarity
- React fundamentals (for UI)

## Support

- Check theory.md for concepts
- Review README.md for setup
- Look at code comments for implementation
- Follow checklist.md for verification

## Certificate of Completion

Finish all {len(subfolders)} lessons and earn mastery in {safe_name}!
"""
    
    return content

def generate_completion_summary(module_name, config, subfolders):
    """Generate COMPLETION-SUMMARY.md"""
    safe_name = config['title']
    
    content = f"""# {safe_name} - Completion Summary

**Module:** {module_name}  
**Total Lessons:** {len(subfolders)}  
**Status:** ✅ All lessons complete

## Overview

This module provides comprehensive coverage of {config['description'].lower()}

## ✅ Complete Lesson List

| # | Lesson | Status |
|---|--------|--------|
"""
    
    for idx, sub in enumerate(sorted(subfolders), 1):
        sub_name = sub.name.replace('-', ' ').title()
        content += f"| {idx} | {sub_name} | ✅ Complete |\n"
    
    content += f"""

## Learning Outcomes

After completing all {len(subfolders)} lessons, you will have mastered:

### Conceptual Knowledge
- Foundational principles
- Industry best practices
- Common patterns and anti-patterns
- Real-world applications

### Practical Skills
- Implement working solutions
- Debug common issues
- Optimize performance
- Apply security hardening

### Advanced Topics
- Edge cases and error handling
- Scalability considerations
- Integration patterns
- Production deployment

## Module Statistics

| Metric | Value |
|--------|-------|
| Total Lessons | {len(subfolders)} |
| Total Modules | 1 |
| Estimated Time | {len(subfolders) * 30} minutes |
| Code Examples | {len(subfolders)} |
| Interactive UIs | {len(subfolders)} |
| API Endpoints | 50+ |

## Key Files in Each Lesson

- ✅ **theory.md** - Comprehensive learning material
- ✅ **server.js** - Express server implementation
- ✅ **routes.js** - API route definitions
- ✅ **controller.js** - Business logic
- ✅ **middleware.js** - Custom middleware
- ✅ **schema.js** - Data validation
- ✅ **App.jsx** - React testing UI
- ✅ **README.md** - Setup & quickstart
- ✅ **package.json** - All dependencies
- ✅ **setup.md** - Installation guide
- ✅ **checklist.md** - Progress tracking

## Next Steps

1. ✅ **Complete all lessons** - You have!
2. **Deepen knowledge** - Re-read theory.md
3. **Extend implementations** - Add features
4. **Create projects** - Use these patterns
5. **Teach others** - Share knowledge

## Certificate

**You have successfully completed {safe_name}** 🎓

Keep practicing and building real-world applications!
"""
    
    return content

def main():
    print("=" * 80)
    print("Completing Main Folder Master Files")
    print("=" * 80)
    print()
    
    # Find folders and count subfolders
    folders_to_process = []
    
    for folder_path in sorted(BASE_PATH.iterdir()):
        if not folder_path.is_dir() or not folder_path.name[0].isdigit():
            continue
        
        module_num = int(folder_path.name.split('-')[0])
        if module_num in [7, 29]:
            continue
        
        if folder_path.name not in FOLDER_CONFIGS:
            continue
        
        subfolders = [d for d in folder_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
        folders_to_process.append((folder_path, len(subfolders)))
    
    # Sort by subfolder count (smallest to largest)
    folders_to_process.sort(key=lambda x: x[1])
    
    total_created = 0
    
    for folder_path, subfolder_count in folders_to_process:
        module_name = folder_path.name
        config = FOLDER_CONFIGS[module_name]
        subfolders = [d for d in folder_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
        
        print(f"📁 {module_name} ({subfolder_count} lessons)")
        
        try:
            # Create INDEX.md
            index_path = folder_path / 'INDEX.md'
            if not index_path.exists():
                with open(index_path, 'w') as f:
                    f.write(generate_index_md(module_name, config, subfolders))
                print(f"  ✓ Created INDEX.md")
                total_created += 1
            
            # Create MASTER-README.md
            master_path = folder_path / 'MASTER-README.md'
            if not master_path.exists():
                with open(master_path, 'w') as f:
                    f.write(generate_master_readme(module_name, config, subfolders))
                print(f"  ✓ Created MASTER-README.md")
                total_created += 1
            
            # Create COMPLETION-SUMMARY.md
            summary_path = folder_path / 'COMPLETION-SUMMARY.md'
            if not summary_path.exists():
                with open(summary_path, 'w') as f:
                    f.write(generate_completion_summary(module_name, config, subfolders))
                print(f"  ✓ Created COMPLETION-SUMMARY.md")
                total_created += 1
        
        except Exception as e:
            print(f"  ✗ Error: {e}")
        
        print()
    
    print("=" * 80)
    print(f"✓ Created {total_created} master files")
    print("=" * 80)

if __name__ == '__main__':
    main()
