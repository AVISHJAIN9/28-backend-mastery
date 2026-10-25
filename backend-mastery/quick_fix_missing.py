#!/usr/bin/env python3
"""Quick fix for missing folders"""

from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

MISSING = {
    '06-nodejs-internals': 'Node.js Internals & Deep Dive',
    '09-jobs-queues': 'Job Queues & Background Processing'
}

def create_files(module_name, title):
    """Create all 3 master files"""
    folder = BASE_PATH / module_name
    subfolders = sorted([d for d in folder.iterdir() if d.is_dir() and not d.name.startswith('.')])
    
    # INDEX.md
    index_content = f"# {title}\n\n**Module:** {module_name}\n\n## Lessons\n\n"
    for i, sub in enumerate(subfolders, 1):
        index_content += f"{i}. [{sub.name}](./{sub.name}/README.md)\n"
    
    with open(folder / 'INDEX.md', 'w') as f:
        f.write(index_content)
    
    # MASTER-README.md
    readme_content = f"""# {title}

**Module:** {module_name}
**Lessons:** {len(subfolders)}

Comprehensive coverage of {title.lower()}.

## Topics Covered

"""
    for i, sub in enumerate(subfolders[:10], 1):
        readme_content += f"{i}. {sub.name.replace('-', ' ').title()}\n"
    
    if len(subfolders) > 10:
        readme_content += f"\n+ {len(subfolders) - 10} more lessons\n"
    
    with open(folder / 'MASTER-README.md', 'w') as f:
        f.write(readme_content)
    
    # COMPLETION-SUMMARY.md
    summary_content = f"""# {title} - Completion Summary

**Status:** ✅ Complete - {len(subfolders)} lessons

All lessons in this module are ready for learning.
"""
    
    with open(folder / 'COMPLETION-SUMMARY.md', 'w') as f:
        f.write(summary_content)
    
    return 3

total = 0
for module, title in MISSING.items():
    total += create_files(module, title)
    print(f"✓ {module}: Created 3 files")

print(f"\n✓ Total: {total} files created")
