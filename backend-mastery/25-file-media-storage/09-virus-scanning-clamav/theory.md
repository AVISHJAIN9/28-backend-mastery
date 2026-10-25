# Theory - Virus Scanning & Malware Detection

## Malware Types

### Viruses
- Self-replicating code
- Attaches to other programs
- Spreads through networks
- Example: Email worms

### Trojans
- Disguised as legitimate software
- Opens backdoors
- Steals information
- No self-replication

### Ransomware
- Encrypts user files
- Demands payment
- Destroys productivity
- Devastating impact

### Spyware
- Monitoring/tracking
- Password theft
- Data harvesting
- Privacy violation

## ClamAV Engine

### How It Works
1. Signature matching (99%)
2. Heuristics analysis
3. Archive examination
4. Email parsing
5. Bytecode execution

### Signature Database
- Updated daily
- 500K+ signatures
- Covers known threats
- Regular releases

## Scanning Strategies

### On-Upload Scan
```
User uploads file
  ↓
Store temporarily
  ↓
Run full virus scan
  ↓
If clean: Accept
If threat: Reject & quarantine
  ↓
Delete temporary file
```

### Background Scan
```
User upload immediately accepted
  ↓
File moved to quarantine
  ↓
Background scan starts
  ↓
Result: Safe or Infected
  ↓
Move to storage or delete
```

## Detection Methods

### Signature-Based (90%)
- Compare to known malware
- Fast detection
- Misses zero-days
- Database must stay updated

### Heuristic Analysis (5%)
- Pattern recognition
- Behavioral analysis
- Catches unknown threats
- More false positives

### Sandboxing (5%)
- Run in isolated environment
- Monitor behavior
- Very thorough
- Slow and resource-intensive

## Real-World Scenario

### E-commerce File Upload
```
1. Customer uploads receipt image
2. System receives file
3. Virus scan initiated (async)
4. File temporarily stored
5. If safe: Process image
   If infected: Alert, delete, log
6. Customer notified
```

### Security Impact
- **False Negatives**: Malware passes (dangerous)
- **False Positives**: Legitimate file blocked (annoying)
- **Rate**: 1-2% false positives acceptable

## Implementation Considerations

### Performance
- Scan time: 1-10 seconds typical
- Async scanning faster than sync
- Background processing recommended
- Queue system for high volume

### Cost
- Free: ClamAV (open source)
- Paid: Norton, McAfee APIs
- Cloud scanning services
- Depends on volume

## Best Practices

1. **Update regularly**: Daily signature updates
2. **Timeout scans**: Set 30-60 second limits
3. **Quarantine**: Isolate suspicious files
4. **Log everything**: Audit trail
5. **Alert on threats**: Notify admins
6. **User education**: Safe practices
7. **Defense layers**: Don't rely on one tool

## Summary

✅ Scan all untrusted uploads
✅ Use signature + heuristics
✅ Update databases daily
✅ Implement timeout
✅ Quarantine on detection
✅ Log for audit trail
