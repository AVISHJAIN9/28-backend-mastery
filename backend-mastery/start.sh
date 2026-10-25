#!/bin/bash
# Quick start script for Backend Mastery Platform

echo "🚀 Backend Mastery Unified Platform - Quick Start"
echo "================================================="
echo ""

# Get directory
cd /Users/avishjain/Downloads/backend-mastery

# Kill any existing watcher
echo "🧹 Cleaning up old processes..."
lsof -i :4444 | awk 'NR>1 {print $2}' | xargs kill -9 2>/dev/null || true

# Start watcher
echo "⚡ Starting watcher server..."
nohup node watcher.js > watcher.log 2>&1 &
WATCHER_PID=$!

# Wait for startup
sleep 2

# Check if it started
if ps -p $WATCHER_PID > /dev/null; then
    echo "✅ Watcher running (PID: $WATCHER_PID)"
    echo ""
    echo "📊 Platform URLs:"
    echo "   Master Dashboard: file://$(pwd)/master-revisions.html"
    echo "   Original DevVault: file://$(pwd)/devault.html"
    echo ""
    echo "⚡ Server: http://localhost:4444"
    echo ""
    echo "📚 Documentation:"
    echo "   Quick Guide: MASTER-PLATFORM-GUIDE.md"
    echo "   Integration: INTEGRATION-GUIDE.md"
    echo "   Setup Info: SETUP-COMPLETE.md"
    echo ""
    echo "✨ You're ready to start your backend mastery journey!"
    echo "   Open master-revisions.html in your browser now."
else
    echo "❌ Failed to start watcher!"
    echo "   Check watcher.log for details"
    tail watcher.log
fi
