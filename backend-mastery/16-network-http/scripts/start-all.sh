#!/bin/bash
# start-all.sh - Start all module servers in parallel

modules=(
  "01-http1-http2-http3:5801"
  "02-tcp-vs-udp:5802"
  "03-tls-handshake-https:5803"
  "04-http-headers-deep:5804"
  "05-status-codes-all-families:5805"
  "06-dns-how-it-resolves:5806"
  "07-proxy-vs-reverse-proxy:5807"
  "08-cdn-how-it-works:5808"
  "09-keep-alive-connections:5809"
  "10-content-negotiation:5810"
)

echo "🚀 Starting all modules..."

for module_port in "${modules[@]}"; do
  module="${module_port%:*}"
  port="${module_port#*:}"
  
  if [ -d "$module" ]; then
    echo "Starting $module (port $port)..."
    cd "$module"
    npm run dev > ../logs/"${module}.log" 2>&1 &
    cd ..
  fi
done

echo "✅ All modules started! Check logs/ folder for output."
echo "📍 Ports: 5801 (HTTP), 5802 (TCP/UDP), 5803-5810 (other modules)"
