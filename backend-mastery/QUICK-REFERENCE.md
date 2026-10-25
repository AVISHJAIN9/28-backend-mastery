# 🚀 Quick Reference Card

## One-Command Start
```bash
cd /Users/avishjain/Downloads/backend-mastery && node watcher.js
```

## Open Platform
**master-revisions.html** in any browser

## Live API (watcher running on)
```
http://localhost:4444
```

## 3 Main Tabs
1. **📊 Overview** - See all 30 modules
2. **📂 File Browser** - Code preview + errors
3. **⚠️ Error Scan** - Find & fix issues

## Edit Workflow
```
VS Code → Save → Auto-appears in browser
(auto-refresh every 3 seconds)
```

## Statistics in Real-Time
- 30 Modules
- 150+ Topics  
- 500+ Files
- Progress tracking
- Error detection

## Keyboard Shortcuts
- `F12` - Open console (errors)
- `Ctrl+K` / `Cmd+K` - Search (in devvault.html)
- Click module → View files

## API Endpoints
```
/catalog                           - All modules data
/topic-files?path=xx-name/topic    - List files
/file?path=xx-name/topic/file.js   - Get file content
/topic-errors?path=xx-name/topic   - Find errors
/ping                              - Health check
```

## Troubleshoot
```bash
# Port busy?
lsof -i :4444 | awk 'NR>1 {print $2}' | xargs kill -9

# Files not updating?
- Edit in /backend-mastery/ not /backend-mastery 2/
- Save the file (Ctrl+S)
- Refresh browser (F5)

# Check logs
tail watcher.log
```

## File Locations
```
~/Downloads/backend-mastery/
├── watcher.js                (Server)
├── master-revisions.html     (Platform)
├── devvault.html             (Original)
├── 01-authentication/        (Modules)
└── ... 02-30/
```

## Module Success Path
```
1. Pick a module
2. Browse files
3. Review errors
4. Edit in VS Code  
5. Errors auto-scan
6. Fix issues
7. Move to next
```

## Stats for Module 01 Right Now
- 34 Topics ✅
- 96% Complete ✅
- 19 Errors ⚠️ (fixable)

---

**Platform Status**: ✅ LIVE  
**Auto-Refresh**: ✅ ENABLED  
**Error Detection**: ✅ ACTIVE  
**Ready to Code**: ✅ YES!

Let's build your backend mastery! 🎓
