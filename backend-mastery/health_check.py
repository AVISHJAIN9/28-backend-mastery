#!/usr/bin/env python3
"""
Backend Mastery - Completion Alert Monitor
For CI/CD integration to alert if completion drops below threshold
"""

import json
import sys
from pathlib import Path

BASE_PATH = Path('/Users/avishjain/Downloads/backend-mastery')

def get_quick_status():
    """Get quick completion status"""
    
    # Load metrics if available
    metrics_file = BASE_PATH / 'completion_metrics.json'
    
    if not metrics_file.exists():
        return {'status': 'INCOMPLETE', 'percentage': 0, 'error': 'Metrics file not found'}
    
    with open(metrics_file) as f:
        metrics = json.load(f)
    
    return {
        'status': 'COMPLETE' if metrics['project']['overall_percentage'] >= 100 else 'IN_PROGRESS',
        'percentage': metrics['project']['overall_percentage'],
        'modules_complete': metrics['project']['module_count'],
        'subfolders_complete': metrics['project']['subfolder_count'],
        'files_complete': metrics['project']['file_count'],
        'timestamp': metrics['project']['timestamp']
    }

def check_thresholds(status, min_percentage=100):
    """Check if completion meets threshold"""
    
    if status['percentage'] < min_percentage:
        return {
            'alert': True,
            'severity': 'CRITICAL' if status['percentage'] < 95 else 'WARNING',
            'message': f"Completion below {min_percentage}%: {status['percentage']}%",
            'status': status
        }
    
    return {
        'alert': False,
        'severity': 'OK',
        'message': f"All systems operational. Completion: {status['percentage']}%",
        'status': status
    }

def main():
    # Get status
    status = get_quick_status()
    
    # Check thresholds
    result = check_thresholds(status, min_percentage=100)
    
    # Output
    print(json.dumps(result, indent=2))
    
    # Exit code for CI/CD
    if result['alert']:
        if result['severity'] == 'CRITICAL':
            sys.exit(2)  # Critical error
        else:
            sys.exit(1)  # Warning
    else:
        sys.exit(0)  # Success

if __name__ == '__main__':
    main()
