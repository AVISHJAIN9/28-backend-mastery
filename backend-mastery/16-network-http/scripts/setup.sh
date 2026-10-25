#!/bin/bash
# Setup script - Install dependencies for all modules

modules=(
  "01-http1-http2-http3"
  "02-tcp-vs-udp"
  "03-tls-handshake-https"
  "04-http-headers-deep"
  "05-status-codes-all-families"
  "06-dns-how-it-resolves"
  "07-proxy-vs-reverse-proxy"
  "08-cdn-how-it-works"
  "09-keep-alive-connections"
  "10-content-negotiation"
)

echo "🚀 Installing dependencies for all modules..."

for module in "${modules[@]}"; do
  if [ -d "$module" ]; then
    echo "📦 Installing $module..."
    cd "$module"
    npm install
    cd ..
  else
    echo "⚠️  Skipping $module (directory not found)"
  fi
done

echo "✅ All dependencies installed!"
