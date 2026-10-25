# Linux CLI: grep, awk, curl

## What is this?
This module teaches three essential Linux command-line tools:
- **grep**: Search for patterns in text files
- **awk**: A powerful text processing language for data extraction
- **curl**: Transfer data from/to server using URLs

## Why does it matter?
These tools are fundamental for:
- Log file analysis
- Data extraction and transformation
- API testing and debugging
- System administration and monitoring
- Building shell scripts and automation

## How it works (step by step)

### grep
1. Takes a pattern and searches for matches
2. Returns matching lines from input
3. Supports regex patterns with -E flag
4. Can count matches with -c or pipe to wc

### awk
1. Processes input line by line
2. Splits lines into fields (default: spaces)
3. Applies patterns and actions
4. Useful for data extraction and formatting

### curl
1. Makes HTTP requests to URLs
2. Supports GET, POST, PUT, DELETE methods
3. Can send headers, data, and files
4. Used for API testing and debugging

## Key concepts
- **Regular expressions**: Pattern matching in grep
- **Field separators**: How awk splits records in awk
- **HTTP methods**: Different request types in curl
- **Pipes and redirection**: Chaining commands together

## Common mistakes
- Not escaping special characters in grep patterns
- Wrong field separator in awk (-F flag)
- Forgetting quotes around curl data
- Not using -d flag for POST data in curl

## Real world usage
- grep: "grep 'ERROR' app.log | wc -l"
- awk: "ps aux | awk '{print $1, $2}'"
- curl: "curl -X POST -d '{\"key\":\"value\"}' https://api.example.com/endpoint"
