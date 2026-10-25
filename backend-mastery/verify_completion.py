#!/usr/bin/env python3
"""
Verify completion status of all modules
Check that all required files exist in each subfolder
"""

import os
from pathlib import Path
from collections import defaultdict

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

# Required files for each module
REQUIRED_FILES = {
    'theory.md',
    'server.js',
    'package.json',
    'App.jsx',
    'README.md',
    '.env.example',
    'setup.md',
    'checklist.md',
    'routes.js',
    'schema.js',
    'middleware.js',
    'controller.js'
}

def check_folder_completion(folder_path):
    """Check completion of a single folder"""
    if not folder_path.is_dir() or folder_path.name.startswith('.'):
        return None
    
    files = {f.name for f in folder_path.iterdir() if f.is_file()}
    missing = REQUIRED_FILES - files
    
    return {
        'folder': folder_path.name,
        'path': folder_path,
        'total_required': len(REQUIRED_FILES),
        'files_present': len(REQUIRED_FILES - missing),
        'missing_count': len(missing),
        'missing_files': sorted(missing),
        'complete': len(missing) == 0
    }

def check_module(module_path):
    """Check completion of a module (main folder with subfolders)"""
    module_name = module_path.name
    module_num = int(module_name.split('-')[0])
    
    # Skip 07-security and 29-ai-ml-backend
    if module_num in [7, 29]:
        return None
    
    subfolders = [d for d in module_path.iterdir() if d.is_dir() and not d.name.startswith('.')]
    
    results = []
    for subfolder in sorted(subfolders):
        result = check_folder_completion(subfolder)
        if result:
            results.append(result)
    
    # Calculate module completion percentage
    if results:
        complete_count = sum(1 for r in results if r['complete'])
        completion_pct = (complete_count / len(results)) * 100
    else:
        completion_pct = 0
    
    return {
        'module': module_name,
        'num_subfolders': len(results),
        'complete_subfolders': sum(1 for r in results if r['complete']),
        'completion_pct': completion_pct,
        'subfolders': results
    }

def main():
    print("=" * 80)
    print("Backend Mastery - Completion Status Report")
    print("=" * 80)
    print()
    
    # Get all main modules
    modules = sorted([d for d in BASE_PATH.iterdir() if d.is_dir() and d.name[0].isdigit()])
    
    overall_stats = {
        'modules': 0,
        'subfolders': 0,
        'complete_subfolders': 0,
        'incomplete_subfolders': 0
    }
    
    module_results = []
    
    for module_path in modules:
        result = check_module(module_path)
        if result:
            module_results.append(result)
            overall_stats['modules'] += 1
            overall_stats['subfolders'] += result['num_subfolders']
            overall_stats['complete_subfolders'] += result['complete_subfolders']
            overall_stats['incomplete_subfolders'] += (result['num_subfolders'] - result['complete_subfolders'])
    
    # Display results by category
    categories = {
        '100%': [],
        '75-99%': [],
        '50-74%': [],
        '1-49%': [],
        '0%': []
    }
    
    for result in module_results:
        pct = result['completion_pct']
        if pct == 100:
            categories['100%'].append(result)
        elif pct >= 75:
            categories['75-99%'].append(result)
        elif pct >= 50:
            categories['50-74%'].append(result)
        elif pct > 0:
            categories['1-49%'].append(result)
        else:
            categories['0%'].append(result)
    
    # Print by category
    for category, modules in categories.items():
        if modules:
            print(f"\n📊 {category} Complete ({len(modules)} modules):")
            print("-" * 80)
            for m in modules:
                status = "✓" if m['completion_pct'] == 100 else "◐" if m['completion_pct'] > 0 else "✗"
                print(f"  {status} {m['module']:<30} {m['complete_subfolders']}/{m['num_subfolders']} subfolders ({m['completion_pct']:.0f}%)")
                
                # Show incomplete subfolders in detail for incomplete modules
                if m['completion_pct'] < 100:
                    incomplete = [s for s in m['subfolders'] if not s['complete']]
                    if len(incomplete) <= 5:  # Show details for small number
                        for subfolder in incomplete[:3]:
                            missing_str = ', '.join(subfolder['missing_files'][:3])
                            print(f"      • {subfolder['folder']:<30} missing: {missing_str}{'...' if len(subfolder['missing_files']) > 3 else ''}")
                    else:
                        print(f"      • {len(incomplete)} subfolders need completion")
    
    # Print overall statistics
    print(f"\n\n{'=' * 80}")
    print("📈 Overall Statistics")
    print(f"{'=' * 80}")
    print(f"  Total modules:              {overall_stats['modules']}")
    print(f"  Total subfolders:           {overall_stats['subfolders']}")
    print(f"  ✓ Complete subfolders:      {overall_stats['complete_subfolders']}")
    print(f"  ✗ Incomplete subfolders:    {overall_stats['incomplete_subfolders']}")
    
    if overall_stats['subfolders'] > 0:
        pct = (overall_stats['complete_subfolders'] / overall_stats['subfolders']) * 100
        print(f"  Overall completion:         {pct:.1f}%")
    print()

if __name__ == '__main__':
    main()
