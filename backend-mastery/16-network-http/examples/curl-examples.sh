#!/bin/bash
# curl-examples.sh - API testing examples

echo "🧪 API Testing Examples"
echo "======================"
echo ""

echo "📡 Module 01 - HTTP Versions (Port 5801)"
echo "----------------------------------------"
echo "curl http://localhost:5801/api/protocol-info"
echo "curl http://localhost:5801/api/compare"
echo "curl http://localhost:5801/api/multiplexing"
echo "curl http://localhost:5801/api/performance"
echo ""

echo "📡 Module 02 - TCP vs UDP (Port 5802)"
echo "-------------------------------------"
echo "curl http://localhost:5802/api/tcp-info"
echo "curl http://localhost:5802/api/udp-info"
echo "curl http://localhost:5802/api/compare"
echo "curl -X POST http://localhost:5802/api/simulate-loss \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"packetLossPercentage\": 5}'"
echo ""

echo "📡 Module 03-10 - Other Modules (Ports 5803-5810)"
echo "------------------------------------------------"
echo "curl http://localhost:580X/api/info"
echo "curl http://localhost:580X/api/test"
echo ""

echo "✅ Use these commands to test the APIs!"
echo ""
echo "💡 Tip: Use 'scripts/start-all.sh' to start all servers first"
