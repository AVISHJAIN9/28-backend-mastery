#!/usr/bin/env python3
"""
Complete the final missing schema.js files
"""

from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

def generate_schema_js():
    """Generate schema.js content"""
    return """// Schema validation using Joi
const Joi = require('joi');

const schemas = {
  // Item schema for CRUD operations
  item: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(500),
    value: Joi.number(),
    createdAt: Joi.date(),
    updatedAt: Joi.date()
  }),

  // ID validation
  id: Joi.number().integer().positive().required(),

  // Query parameters
  query: Joi.object({
    limit: Joi.number().integer().positive().max(100),
    offset: Joi.number().integer().non-negative(),
    sort: Joi.string(),
    filter: Joi.string()
  })
};

module.exports = schemas;
"""

def find_missing_schema_files():
    """Find all folders missing schema.js"""
    missing = []
    
    # Get all main modules
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    
    for module_path in modules:
        module_num = int(module_path.name.split('-')[0])
        
        # Skip 07-security and 29-ai-ml-backend
        if module_num in [7, 29]:
            continue
        
        subfolders = sorted([d for d in module_path.iterdir() if d.is_dir() and not d.name.startswith('.')])
        
        for subfolder in subfolders:
            schema_path = subfolder / 'schema.js'
            # Check if server.js exists but schema.js doesn't
            if (subfolder / 'server.js').exists() and not schema_path.exists():
                missing.append({
                    'path': subfolder,
                    'module': module_path.name,
                    'folder': subfolder.name
                })
    
    return missing

def main():
    print("=" * 80)
    print("Backend Mastery - Completing Schema Files")
    print("=" * 80)
    print()
    
    missing_files = find_missing_schema_files()
    
    print(f"Found {len(missing_files)} folders with missing schema.js")
    print()
    
    total_created = 0
    
    for item in missing_files:
        folder_path = item['path']
        module_name = item['module']
        folder_name = item['folder']
        
        try:
            schema_path = folder_path / 'schema.js'
            content = generate_schema_js()
            
            with open(schema_path, 'w') as f:
                f.write(content)
            
            print(f"✓ {module_name}/{folder_name}")
            total_created += 1
            
        except Exception as e:
            print(f"✗ Error in {module_name}/{folder_name}: {e}")
    
    print()
    print("=" * 80)
    print(f"✓ Summary: {total_created} schema files created")
    print("=" * 80)

if __name__ == '__main__':
    main()
