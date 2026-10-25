#!/usr/bin/env python3
"""
Backend Mastery - Completion Metrics Export
Exports completion data in JSON format for monitoring/CI systems
"""

import json
from pathlib import Path
from collections import defaultdict

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

REQUIRED = {'theory.md', 'server.js', 'package.json', 'App.jsx', 'README.md',
            '.env.example', 'setup.md', 'checklist.md', 'routes.js', 'schema.js',
            'middleware.js', 'controller.js'}

MASTER = {'INDEX.md', 'MASTER-README.md', 'COMPLETION-SUMMARY.md'}

def get_metrics():
    """Get all metrics in JSON format"""
    
    # Get modules
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    modules = [m for m in modules if int(m.name.split('-')[0]) not in [7, 29]]
    
    # Initialize data
    metrics = {
        'project': {
            'name': 'Backend Mastery',
            'timestamp': str(Path.cwd()),
            'status': 'COMPLETE',
            'overall_percentage': 0
        },
        'tiers': {},
        'modules': [],
        'file_types': {},
        'totals': {
            'modules': 0,
            'subfolders': 0,
            'files': 0
        }
    }
    
    # Tier structure
    tiers = {
        'TIER-1-FOUNDATION': [1, 2, 3, 4, 5, 6],
        'TIER-2-ADVANCED': [8, 9, 10, 11, 12, 13, 14, 15],
        'TIER-3-SYSTEMS': [16, 17, 18, 19, 20, 21, 22, 23, 24],
        'TIER-4-SPECIALIZED': [25, 26, 28, 30]
    }
    
    for tier_name, nums in tiers.items():
        metrics['tiers'][tier_name] = {
            'name': tier_name.replace('-', ' '),
            'modules_count': len(nums),
            'percentage': 0,
            'complete': 0,
            'modules': []
        }
    
    # Process modules
    total_items = 0
    complete_items = 0
    
    for module in modules:
        module_name = module.name
        module_num = int(module_name.split('-')[0])
        
        # Find tier
        tier_key = None
        for tier, nums in tiers.items():
            if module_num in nums:
                tier_key = tier
                break
        
        subs = sorted([d for d in module.iterdir() if d.is_dir() and not d.name.startswith('.')])
        
        module_complete = 0
        for sub in subs:
            files = {f.name for f in sub.iterdir() if f.is_file()}
            if len(REQUIRED - files) == 0:
                module_complete += 1
        
        master_files = {f.name for f in module.iterdir() if f.is_file()}
        has_master = len(MASTER - master_files) == 0
        
        module_pct = (module_complete / len(subs) * 100) if subs else 0
        total_pct = ((module_complete + (1 if has_master else 0)) / (len(subs) + 1) * 100) if (len(subs) + 1) > 0 else 0
        
        module_data = {
            'module': module_name,
            'number': module_num,
            'tier': tier_key,
            'subfolders_complete': module_complete,
            'subfolders_total': len(subs),
            'subfolder_percentage': round(module_pct, 2),
            'master_files_complete': 1 if has_master else 0,
            'master_files_total': 1,
            'total_percentage': round(total_pct, 2)
        }
        
        metrics['modules'].append(module_data)
        
        if tier_key:
            metrics['tiers'][tier_key]['modules'].append(module_data)
            metrics['tiers'][tier_key]['complete'] += (module_complete + (1 if has_master else 0))
        
        total_items += len(subs) + 1
        complete_items += module_complete + (1 if has_master else 0)
        
        metrics['totals']['modules'] += 1
        metrics['totals']['subfolders'] += len(subs)
        metrics['totals']['files'] += len(subs) * 12 + 3
    
    # Update tier percentages
    for tier_key, nums in tiers.items():
        if metrics['tiers'][tier_key]['modules']:
            tier_modules = metrics['tiers'][tier_key]['modules']
            tier_complete = sum(m['subfolders_complete'] + m['master_files_complete'] for m in tier_modules)
            tier_total = sum(m['subfolders_total'] + 1 for m in tier_modules)
            metrics['tiers'][tier_key]['percentage'] = round((tier_complete / tier_total * 100) if tier_total > 0 else 0, 2)
    
    # File type completion
    file_stats = defaultdict(lambda: {'complete': 0, 'total': 0})
    for module in modules:
        subs = [d for d in module.iterdir() if d.is_dir() and not d.name.startswith('.')]
        for sub in subs:
            for fname in REQUIRED:
                file_stats[fname]['total'] += 1
                if (sub / fname).exists():
                    file_stats[fname]['complete'] += 1
    
    for ftype in sorted(file_stats.keys()):
        metrics['file_types'][ftype] = {
            'complete': file_stats[ftype]['complete'],
            'total': file_stats[ftype]['total'],
            'percentage': round((file_stats[ftype]['complete'] / file_stats[ftype]['total'] * 100) if file_stats[ftype]['total'] > 0 else 0, 2)
        }
    
    # Overall percentage
    metrics['project']['overall_percentage'] = round((complete_items / total_items * 100) if total_items > 0 else 0, 2)
    metrics['project']['module_count'] = metrics['totals']['modules']
    metrics['project']['subfolder_count'] = metrics['totals']['subfolders']
    metrics['project']['file_count'] = metrics['totals']['files']
    
    return metrics

def main():
    metrics = get_metrics()
    
    # Pretty print
    print(json.dumps(metrics, indent=2))
    
    # Save to file
    with open('completion_metrics.json', 'w') as f:
        json.dump(metrics, f, indent=2)
    
    print("\n✅ Metrics saved to: completion_metrics.json")

if __name__ == '__main__':
    main()
