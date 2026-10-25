# Linux CLI: grep, awk, curl - Theory

## 1. grep (Global Regular Expression Print)

### What it does
Searches for lines matching a pattern in text

### Syntax
```bash
grep [options] pattern [file...]
```

### Common options
- `-i`: Case-insensitive search
- `-r`: Recursive search in directories
- `-n`: Show line numbers
- `-c`: Count matches
- `-v`: Invert match (show non-matching lines)
- `-E`: Use extended regex

### Examples
```bash
grep "error" logfile.txt
grep -i "ERROR" logfile.txt
grep -r "config" .
grep -E "^[0-9]+" file.txt
```

## 2. awk (Aho, Weinberger, Kernighan)

### What it does
A text processing language that processes input line by line

### Syntax
```bash
awk [options] 'pattern { action }' [file...]
```

### Common features
- `-F`: Field separator (default: space)
- `NF`: Number of fields in current record
- `NR`: Number of records processed
- `$1, $2, ...`: Access fields by number
- `BEGIN`: Run before processing
- `END`: Run after processing

### Examples
```bash
awk '{print $1}' file.txt # Print first field
awk -F: '{print $1}' /etc/passwd
awk 'NR > 5' file.txt # Skip first 5 lines
awk '{sum += $1} END {print sum}' numbers.txt
```

## 3. curl (Client URL)

### What it does
Transfers data to or from a server using URLs

### Syntax
```bash
curl [options] [URL...]
```

### Common options
- `-X`: HTTP method (GET, POST, PUT, DELETE)
- `-d`: POST data
- `-H`: Add header
- `-i`: Include response headers
- `-o`: Save output to file
- `-u`: Username:password for auth
- `-L`: Follow redirects

### Examples
```bash
curl https://api.example.com/users
curl -X POST -d 'name=John' https://api.example.com/create
curl -H 'Authorization: Bearer token' https://api.example.com/protected
curl -i https://api.example.com/users # Include headers
```

## Piping and combining
These tools work together:
```bash
curl https://api.example.com/logs | grep ERROR | awk -F: '{print $2}'
```
