# Risk Scoring Framework

Risk is calculated by aggregating multiple factors:

1. **IP Reputation (30%)**: Known-bad IPs, data center IPs, VPN/proxy usage
2. **Geolocation (25%)**: Impossible travel detection, high-risk countries, location changes
3. **Device (20%)**: New devices, device fingerprinting, trusted device status
4. **Behavior (15%)**: Failed login attempts, unusual usage patterns, velocity checks
5. **Time (10%)**: Unusual hours, weekend activity deviations

## Risk Levels

- **Low (<0.2)**: Standard login, direct token issuance
- **Medium (0.2-0.4)**: Additional logging, no extra checks
- **High (0.4-0.7)**: MFA required, device challenge
- **Critical (>0.7)**: MFA + email verification + manual review required

## Machine Learning Integration

Can integrate ML models for anomaly detection, behavior clustering, and predictive risk scoring.
