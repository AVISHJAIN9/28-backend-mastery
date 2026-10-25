#!/bin/bash
# stop-all.sh - Stop all running module servers

echo "🛑 Stopping all Node.js servers..."

pkill -f "npm run dev" || true
pkill -f "node " || true

sleep 2

echo "✅ All servers stopped!"
