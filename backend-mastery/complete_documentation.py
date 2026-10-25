#!/usr/bin/env python3
"""
Complete remaining missing documentation files
Generates theory.md, README.md, .env.example, checklist.md, App.jsx, setup.md 
for folders that have server.js but are missing docs
"""

import os
from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

REQUIRED_DOCS = {
    'theory.md',
    'App.jsx',
    'README.md',
    '.env.example',
    'setup.md',
    'checklist.md',
}

def generate_theory_md(module_name, sub_folder_name):
    """Generate theory.md content"""
    return f"""# {sub_folder_name.replace('-', ' ').title()} - Theory

## Overview
This module covers the fundamentals of {sub_folder_name.replace('-', ' ').lower()}.

## Key Concepts

### 1. Main Concept
- Concept definition and importance
- Real-world applications
- Common pitfalls

### 2. Architecture
- How the system works
- Design decisions
- Trade-offs

### 3. Best Practices
- Implementation guidelines
- Performance optimization
- Security considerations

## Learning Resources

- Official documentation
- Community benchmarks
- Case studies

## Summary

This module provides hands-on experience with {sub_folder_name.replace('-', ' ').lower()} patterns.
"""

def generate_readme_md(module_name, sub_folder_name, port=3000):
    """Generate README.md content"""
    safe_name = sub_folder_name.replace('-', ' ').title()
    
    return f"""# {safe_name}

## Overview
Implementation of {sub_folder_name.replace('-', ' ').lower()} pattern.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env
```

### 3. Run the Server
```bash
npm run dev
```

The server will start on http://localhost:{port}

## API Endpoints

### Health Check
```
GET /health
```

Returns the health status of the server.

### Main API
```
GET /api
```

Access the main API endpoints at `/api`

## Testing

Use the provided React UI (`App.jsx`) to test endpoints interactively.

You can also test via curl:
```bash
curl http://localhost:{port}/health
```

## Files Structure

- `server.js` - Express server setup
- `routes.js` - API route definitions
- `controller.js` - Business logic
- `middleware.js` - Custom middleware
- `schema.js` - Data validation schemas
- `App.jsx` - React testing UI
- `theory.md` - Learning material

## License

MIT
"""

def generate_app_jsx(sub_folder_name):
    """Generate App.jsx content"""
    safe_name = sub_folder_name.replace('-', ' ').title()
    
    return """import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [endpoint, setEndpoint] = useState('/health');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const testEndpoint = async (path) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000${path}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
      setEndpoint(path);
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>""" + safe_name + """</h1>
        <p>Interactive API Testing UI</p>
      </header>

      <main>
        <section className="controls">
          <h2>Test Endpoints</h2>
          <div className="button-group">
            <button onClick={() => testEndpoint('/health')}>
              Health Check
            </button>
            <button onClick={() => testEndpoint('/api')}>
              API Root
            </button>
          </div>
        </section>

        <section className="results">
          <h2>Response</h2>
          {loading ? (
            <p>Loading...</p>
          ) : response ? (
            <pre>{response}</pre>
          ) : (
            <p>Click a button to test an endpoint</p>
          )}
        </section>
      </main>
    </div>
  );
}
"""

def generate_env_example():
    """Generate .env.example content"""
    return """# Server Configuration
HTTP_PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info

# Database
DB_URL=mongodb://localhost:27017/app

# Redis (if needed)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# Third-party APIs
API_URL=https://api.example.com
"""

def generate_setup_md():
    """Generate setup.md content"""
    return """# Setup Guide

## Prerequisites
- Node.js 16+
- npm or yarn
- Redis (if module uses caching)
- MongoDB (if module uses database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update .env with your configuration

## Local Development

```bash
npm run dev
```

Server will start with hot reload via nodemon.

## Production

```bash
npm start
```

## Testing

Run the React UI test application:
```bash
npm run test
```

Or test via API directly:
```bash
curl http://localhost:3000/health
```

## Troubleshooting

### Port Already in Use
```bash
lsof -ti:3000 | xargs kill -9
```

### Dependencies Issue
```bash
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables
Ensure all required env vars are set in .env file.
"""

def generate_checklist_md(sub_folder_name):
    """Generate checklist.md content"""
    safe_name = sub_folder_name.replace('-', ' ').title()
    
    return f"""# {safe_name} - Completion Checklist

## Learning Objectives
- [ ] Understand the core concepts
- [ ] Review the theory documentation
- [ ] Examine the server implementation
- [ ] Test the API endpoints
- [ ] Explore the React testing UI

## Implementation Tasks
- [ ] Set up the development environment
- [ ] Install all dependencies
- [ ] Configure environment variables
- [ ] Start the development server
- [ ] Access the React UI at http://localhost:3000

## Testing Checklist
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Verify error handling
- [ ] Check logging output
- [ ] Review response formats

## Code Review
- [ ] Review server.js structure
- [ ] Check routes.js implementation
- [ ] Examine controller.js logic
- [ ] Verify middleware usage
- [ ] Validate schema definitions

## Documentation
- [ ] Read theory.md
- [ ] Review README.md
- [ ] Check comments in code
- [ ] Understand architecture decisions

## Next Steps
- [ ] Extend the implementation
- [ ] Add additional endpoints
- [ ] Implement error handling improvements
- [ ] Optimize performance
"""

def find_incomplete_folders():
    """Find all folders that need doc completion"""
    incomplete = []
    
    # Get all main modules
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    
    for module_path in modules:
        module_num = int(module_path.name.split('-')[0])
        
        # Skip 07-security and 29-ai-ml-backend
        if module_num in [7, 29]:
            continue
        
        subfolders = sorted([d for d in module_path.iterdir() if d.is_dir() and not d.name.startswith('.')])
        
        for subfolder in subfolders:
            # Check if has server.js but missing docs
            if (subfolder / 'server.js').exists():
                missing_docs = []
                for doc in REQUIRED_DOCS:
                    if not (subfolder / doc).exists():
                        missing_docs.append(doc)
                
                if missing_docs:
                    incomplete.append({
                        'path': subfolder,
                        'module': module_path.name,
                        'folder': subfolder.name,
                        'missing': missing_docs
                    })
    
    return incomplete

def main():
    print("=" * 80)
    print("Backend Mastery - Completing Documentation Files")
    print("=" * 80)
    print()
    
    incomplete_folders = find_incomplete_folders()
    
    print(f"Found {len(incomplete_folders)} folders with missing documentation")
    print()
    
    total_created = 0
    
    for item in incomplete_folders:
        folder_path = item['path']
        module_name = item['module']
        folder_name = item['folder']
        
        print(f"📁 {module_name}/{folder_name}")
        
        # Generate missing files
        for missing_file in item['missing']:
            try:
                file_path = folder_path / missing_file
                
                if missing_file == 'theory.md':
                    content = generate_theory_md(module_name, folder_name)
                elif missing_file == 'README.md':
                    content = generate_readme_md(module_name, folder_name)
                elif missing_file == 'App.jsx':
                    content = generate_app_jsx(folder_name)
                elif missing_file == '.env.example':
                    content = generate_env_example()
                elif missing_file == 'setup.md':
                    content = generate_setup_md()
                elif missing_file == 'checklist.md':
                    content = generate_checklist_md(folder_name)
                else:
                    continue
                
                with open(file_path, 'w') as f:
                    f.write(content)
                
                print(f"  ✓ Created {missing_file}")
                total_created += 1
                
            except Exception as e:
                print(f"  ✗ Error creating {missing_file}: {e}")
        
        print()
    
    print("=" * 80)
    print(f"✓ Summary: {total_created} documentation files created")
    print("=" * 80)

if __name__ == '__main__':
    main()
