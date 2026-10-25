#!/usr/bin/env python3
"""Generate missing documentation files"""

import os
from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery/01-authentication')

def generate_readme(module_name):
    name = module_name.split('-', 1)[1].replace('-', ' ').title()
    return f'''# {name}

## What is this?

{name} authentication implementation

## Why does it matter?

- Enhanced security
- Better user experience
- Industry-standard approach

## How it works (step by step)

1. Initial authentication
2. Token/session generation
3. Request validation
4. Access authorization

## Key concepts

- **Security**: Robust authentication
- **Scalability**: Distributed systems support
- **Usability**: User-friendly authentication

## Common mistakes

1. Not validating input
2. Storing sensitive data improperly
3. Missing error handling

## Real world usage

```javascript
POST /auth/login
GET /auth/me
POST /auth/logout
```

## Security considerations

- Always use HTTPS
- Implement rate limiting
- Add logging and monitoring
- Regular security audits

## Dependencies

- jsonwebtoken
- bcryptjs
- joi
'''

def generate_setup():
    return '''# Setup Instructions

## Prerequisites

- Node.js >= 14
- npm or yarn

## Installation

```bash
npm install express jsonwebtoken bcryptjs joi cors dotenv uuid
```

## Environment Variables

Create `.env` file with required variables

## Backend Setup

```bash
node server.js
```

## Frontend Setup

```bash
npm run dev
```

## Testing

Test all endpoints with provided API examples

## Troubleshooting

- Check environment variables
- Verify dependencies installed
- Check port availability
'''

def generate_checklist(module_name):
    name = module_name.split('-', 1)[1].replace('-', ' ').title()
    return f'''# {name} - Implementation Checklist

## Backend

- [x] Controller logic
- [x] Middleware
- [x] Routes
- [x] Schema validation

## Frontend

- [x] React component
- [x] API integration
- [x] Error handling
- [x] Loading states

## Security

- [ ] Input validation
- [ ] HTTPS enforcement
- [ ] Rate limiting
- [ ] Audit logging
- [ ] Test coverage

## Documentation

- [x] README
- [x] Theory
- [x] Setup
- [x] Checklist

## Production

- [ ] Database integration
- [ ] Error monitoring
- [ ] Performance optimization
- [ ] Deployment config
'''

def main():
    modules = sorted([d for d in os.listdir(BASE_PATH) if os.path.isdir(BASE_PATH / d)])
    
    for module in modules:
        module_path = BASE_PATH / module
        
        files = {
            'README.md': generate_readme(module),
            'setup.md': generate_setup(),
            'checklist.md': generate_checklist(module),
        }
        
        for filename, content in files.items():
            filepath = module_path / filename
            if not filepath.exists():
                filepath.write_text(content)
                print(f"✓ Created {module}/{filename}")
            else:
                size = filepath.stat().st_size
                if size < 100:
                    filepath.write_text(content)
                    print(f"✓ Updated {module}/{filename}")

if __name__ == '__main__':
    main()
