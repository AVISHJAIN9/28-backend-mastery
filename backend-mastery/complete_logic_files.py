#!/usr/bin/env python3
"""
Complete remaining backend logic files
Generates controller.js, middleware.js, and routes.js for incomplete modules
"""

from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

def generate_routes_js(folder_name):
    """Generate routes.js content"""
    safe_name = folder_name.replace('-', ' ').title()
    
    return f"""// Routes for {safe_name}
const express = require('express');
const controller = require('./controller');
const middleware = require('./middleware');

const router = express.Router();

// ==================== Middleware ====================

router.use(middleware.validateRequest);

// ==================== Routes ====================

// Health check
router.get('/health', (req, res) => {{
  res.json({{ status: 'ok', module: '{safe_name}' }});
}});

// Main routes
router.get('/', controller.getAll);
router.post('/', controller.create);
router.get('/:id', controller.getOne);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

// ==================== Error Handler ====================

router.use((err, req, res, next) => {{
  console.error('Route error:', err.message);
  res.status(err.status || 500).json({{'error': err.message}});
}});

module.exports = router;
"""

def generate_controller_js(folder_name):
    """Generate controller.js content"""
    safe_name = folder_name.replace('-', ' ').title()
    
    return f"""// Controller for {safe_name}
// Contains business logic for {folder_name}

const items = {{}};
let nextId = 1;

const controller = {{
  getAll: (req, res) => {{
    try {{
      res.json({{
        data: Object.values(items),
        count: Object.keys(items).length
      }});
    }} catch (error) {{
      res.status(500).json({{ error: error.message }});
    }}
  }},

  getOne: (req, res) => {{
    try {{
      const item = items[req.params.id];
      if (!item) {{
        return res.status(404).json({{ error: 'Not found' }});
      }}
      res.json({{ data: item }});
    }} catch (error) {{
      res.status(500).json({{ error: error.message }});
    }}
  }},

  create: (req, res) => {{
    try {{
      const id = nextId++;
      const newItem = {{
        id,
        ...req.body,
        createdAt: new Date()
      }};
      items[id] = newItem;
      res.status(201).json({{ data: newItem }});
    }} catch (error) {{
      res.status(400).json({{ error: error.message }});
    }}
  }},

  update: (req, res) => {{
    try {{
      const item = items[req.params.id];
      if (!item) {{
        return res.status(404).json({{ error: 'Not found' }});
      }}
      const updated = {{ ...item, ...req.body, updatedAt: new Date() }};
      items[req.params.id] = updated;
      res.json({{ data: updated }});
    }} catch (error) {{
      res.status(400).json({{ error: error.message }});
    }}
  }},

  delete: (req, res) => {{
    try {{
      if (!items[req.params.id]) {{
        return res.status(404).json({{ error: 'Not found' }});
      }}
      delete items[req.params.id];
      res.json({{ message: 'Deleted successfully' }});
    }} catch (error) {{
      res.status(500).json({{ error: error.message }});
    }}
  }}
}};

module.exports = controller;
"""

def generate_middleware_js(folder_name):
    """Generate middleware.js content"""
    return """// Middleware for route handlers

const middleware = {
  validateRequest: (req, res, next) => {
    // Validate incoming request
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ error: 'Request body is required' });
      }
    }
    next();
  },

  authenticate: (req, res, next) => {
    // Check for authentication token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    // Add user to request
    req.user = { id: 1 };
    next();
  },

  errorHandler: (err, req, res, next) => {
    console.error('Middleware error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });
  }
};

module.exports = middleware;
"""

def find_incomplete_folders():
    """Find all folders missing core logic files"""
    incomplete = []
    
    required_logic = {'controller.js', 'middleware.js', 'routes.js'}
    
    # Get all main modules
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    
    for module_path in modules:
        module_num = int(module_path.name.split('-')[0])
        
        # Skip 07-security and 29-ai-ml-backend
        if module_num in [7, 29]:
            continue
        
        subfolders = sorted([d for d in module_path.iterdir() if d.is_dir() and not d.name.startswith('.')])
        
        for subfolder in subfolders:
            # Check if has server.js but missing logic files
            if (subfolder / 'server.js').exists():
                missing = []
                for logic_file in required_logic:
                    if not (subfolder / logic_file).exists():
                        missing.append(logic_file)
                
                if missing:
                    incomplete.append({
                        'path': subfolder,
                        'module': module_path.name,
                        'folder': subfolder.name,
                        'missing': missing
                    })
    
    return incomplete

def main():
    print("=" * 80)
    print("Backend Mastery - Completing Core Logic Files")
    print("=" * 80)
    print()
    
    incomplete_folders = find_incomplete_folders()
    
    print(f"Found {len(incomplete_folders)} folders with missing core logic files")
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
                
                if missing_file == 'routes.js':
                    content = generate_routes_js(folder_name)
                elif missing_file == 'controller.js':
                    content = generate_controller_js(folder_name)
                elif missing_file == 'middleware.js':
                    content = generate_middleware_js(folder_name)
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
    print(f"✓ Summary: {total_created} core logic files created")
    print("=" * 80)

if __name__ == '__main__':
    main()
