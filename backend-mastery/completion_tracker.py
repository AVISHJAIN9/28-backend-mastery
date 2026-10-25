#!/usr/bin/env python3
"""
Backend Mastery - Comprehensive Completion Tracker
Shows completion percentage at every level with detailed breakdowns
"""

import os
from pathlib import Path
from collections import defaultdict

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

# Required files for complete folder
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

# Required master files for main folders
MASTER_FILES = {
    'INDEX.md',
    'MASTER-README.md',
    'COMPLETION-SUMMARY.md'
}

def get_completion_percentage(count, total):
    """Calculate percentage"""
    if total == 0:
        return 0
    return (count / total) * 100

def check_subfolder_completion(folder_path):
    """Check if subfolder is complete"""
    if not folder_path.is_dir() or folder_path.name.startswith('.'):
        return False
    files = {f.name for f in folder_path.iterdir() if f.is_file()}
    return len(REQUIRED_FILES - files) == 0

def check_main_folder_completion(folder_path):
    """Check if main folder has all master files"""
    if not folder_path.is_dir():
        return False
    files = {f.name for f in folder_path.iterdir() if f.is_file()}
    return len(MASTER_FILES - files) == 0

def analyze_workspace():
    """Analyze entire workspace"""
    
    # Find all modules
    modules = sorted([d for d in BASE_PATH.iterdir() 
                     if d.is_dir() and d.name[0].isdigit()])
    
    total_subfolders = 0
    complete_subfolders = 0
    total_main_folders = 0
    complete_main_folders = 0
    module_stats = []
    
    for module_path in modules:
        module_name = module_path.name
        module_num = int(module_name.split('-')[0])
        
        # Skip excluded modules
        if module_num in [7, 29]:
            continue
        
        # Check main folder completion
        main_complete = check_main_folder_completion(module_path)
        total_main_folders += 1
        if main_complete:
            complete_main_folders += 1
        
        # Check subfolders
        subfolders = [d for d in module_path.iterdir() 
                     if d.is_dir() and not d.name.startswith('.')]
        
        module_complete = 0
        for subfolder in subfolders:
            total_subfolders += 1
            if check_subfolder_completion(subfolder):
                complete_subfolders += 1
                module_complete += 1
        
        completion_pct = get_completion_percentage(module_complete, len(subfolders))
        
        module_stats.append({
            'name': module_name,
            'num': module_num,
            'total': len(subfolders),
            'complete': module_complete,
            'percentage': completion_pct,
            'main_complete': main_complete
        })
    
    return {
        'total_subfolders': total_subfolders,
        'complete_subfolders': complete_subfolders,
        'subfolder_percentage': get_completion_percentage(complete_subfolders, total_subfolders),
        'total_main_folders': total_main_folders,
        'complete_main_folders': complete_main_folders,
        'main_folder_percentage': get_completion_percentage(complete_main_folders, total_main_folders),
        'module_stats': module_stats
    }

def print_progress_bar(percentage, width=40):
    """Print a visual progress bar"""
    filled = int(width * percentage / 100)
    bar = '█' * filled + '░' * (width - filled)
    return f"[{bar}] {percentage:.1f}%"

def main():
    print("\n" + "=" * 90)
    print("BACKEND MASTERY - COMPLETION TRACKER")
    print("=" * 90 + "\n")
    
    data = analyze_workspace()
    
    # Overall completion
    overall_items = (data['complete_subfolders'] + data['complete_main_folders'])
    total_items = (data['total_subfolders'] + data['total_main_folders'])
    overall_percentage = get_completion_percentage(overall_items, total_items)
    
    print("🎯 OVERALL COMPLETION")
    print("-" * 90)
    print(f"Total Items:        {overall_items}/{total_items}")
    print(f"Completion:         {print_progress_bar(overall_percentage, 50)}")
    print(f"Status:             {'✅ COMPLETE' if overall_percentage == 100 else f'🔄 {overall_percentage:.1f}% Done'}")
    print()
    
    # Subfolder completion
    print("📁 SUBFOLDER COMPLETION")
    print("-" * 90)
    print(f"Subfolders:         {data['complete_subfolders']}/{data['total_subfolders']} complete")
    print(f"Completion:         {print_progress_bar(data['subfolder_percentage'], 50)}")
    print()
    
    # Main folder completion
    print("📚 MAIN FOLDER MASTER FILES")
    print("-" * 90)
    print(f"Master Files:       {data['complete_main_folders']}/{data['total_main_folders']} complete")
    print(f"Completion:         {print_progress_bar(data['main_folder_percentage'], 50)}")
    print()
    
    # Module breakdown
    print("📊 MODULE COMPLETION BREAKDOWN")
    print("-" * 90)
    
    # Organize by completion percentage
    by_percentage = defaultdict(list)
    for mod in data['module_stats']:
        pct = int(mod['percentage'])
        by_percentage[pct].append(mod)
    
    for pct in sorted(by_percentage.keys(), reverse=True):
        modules = by_percentage[pct]
        print(f"\n{pct}% COMPLETE ({len(modules)} modules):")
        for mod in sorted(modules, key=lambda x: x['num']):
            status = "✅" if mod['percentage'] == 100 else "🔄"
            master_status = "✓" if mod['main_complete'] else "✗"
            print(f"  {status} {mod['name']:<30} {mod['complete']}/{mod['total']} "
                  f"({mod['percentage']:5.1f}%) | Master files: {master_status}")
    
    # Summary by tier
    print("\n" + "=" * 90)
    print("📈 COMPLETION SUMMARY BY TIER")
    print("=" * 90)
    
    tiers = {
        'TIER 1: Foundation': [1, 2, 3, 4, 5, 6],
        'TIER 2: Advanced Patterns': [8, 9, 10, 11, 12, 13, 14, 15],
        'TIER 3: Systems & Infrastructure': [16, 17, 18, 19, 20, 21, 22, 23, 24],
        'TIER 4: Specialized Topics': [25, 26, 28, 30]
    }
    
    for tier_name, module_nums in tiers.items():
        tier_modules = [m for m in data['module_stats'] if m['num'] in module_nums]
        if not tier_modules:
            continue
        
        tier_complete = sum(1 for m in tier_modules if m['percentage'] == 100)
        tier_pct = get_completion_percentage(tier_complete, len(tier_modules))
        
        print(f"\n{tier_name}")
        print(f"  Modules: {tier_complete}/{len(tier_modules)} ({tier_pct:.0f}%)")
        print(f"  {print_progress_bar(tier_pct, 40)}")
    
    # File type statistics
    print("\n" + "=" * 90)
    print("📄 FILE COMPLETION STATISTICS")
    print("=" * 90)
    
    file_counts = defaultdict(lambda: {'total': 0, 'complete': 0})
    
    for module_path in [d for d in BASE_PATH.iterdir() 
                        if d.is_dir() and d.name[0].isdigit()]:
        module_num = int(module_path.name.split('-')[0])
        if module_num in [7, 29]:
            continue
        
        subfolders = [d for d in module_path.iterdir() 
                     if d.is_dir() and not d.name.startswith('.')]
        
        for subfolder in subfolders:
            for file_type in ['theory.md', 'server.js', 'package.json', 'App.jsx',
                            'README.md', '.env.example', 'setup.md', 'checklist.md',
                            'routes.js', 'schema.js', 'middleware.js', 'controller.js']:
                file_counts[file_type]['total'] += 1
                if (subfolder / file_type).exists():
                    file_counts[file_type]['complete'] += 1
    
    print("\nFile Type Status:")
    for file_type in sorted(file_counts.keys()):
        counts = file_counts[file_type]
        pct = get_completion_percentage(counts['complete'], counts['total'])
        status = "✅" if pct == 100 else "🔄"
        print(f"  {status} {file_type:<25} {counts['complete']:3}/{counts['total']:3} ({pct:5.1f}%)")
    
    # Project completion metrics
    print("\n" + "=" * 90)
    print("📊 PROJECT COMPLETION METRICS")
    print("=" * 90)
    
    total_files_required = 350 * 12 + 27 * 3  # 350 subfolders * 12 files + 27 main folders * 3 files
    
    files_present = sum(fc['complete'] for fc in file_counts.values()) + (data['complete_main_folders'] * 3)
    project_percentage = get_completion_percentage(files_present, total_files_required)
    
    print(f"\nTotal Required Files:       {total_files_required}")
    print(f"Files Complete:             {files_present}")
    print(f"Files Remaining:            {total_files_required - files_present}")
    print(f"\n🎯 PROJECT COMPLETION:      {print_progress_bar(project_percentage, 50)}")
    print(f"\n{'🎉 PROJECT 100% COMPLETE!' if project_percentage == 100 else f'Status: {project_percentage:.1f}% Complete'}")
    
    print("\n" + "=" * 90 + "\n")

if __name__ == '__main__':
    main()
