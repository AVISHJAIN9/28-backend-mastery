# Child Processes - Setup & Integration

## Installation

```bash
npm init -y
npm install --save-dev mocha
```

## Creating Test Scripts

```bash
# Python script for exec example
cat > script.py << 'EOF'
print("Hello from Python")
EOF

# Shell script
cat > script.sh << 'EOF'
#!/bin/bash
echo "Hello from shell"
EOF
chmod +x script.sh
```

## Testing

```bash
npm test
# Observe output and timing
```

## Production Usage

Set up proper error handling and logging.
