import React, { useState } from 'react';

export default function RiskBasedAuthApp() {
  const [username, setUsername] = useState('user1');
  const [password, setPassword] = useState('password123');
  const [ip, setIp] = useState('192.168.1.1');
  const [deviceId, setDeviceId] = useState('device-' + Math.random().toString(36).substr(2, 9));
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/risk/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, ip, deviceId })
      });
      const data = await res.json();
      if (res.ok) {
        setRiskScore(data);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/risk/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ip, deviceId })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.challengeId) {
          setMfaRequired(true);
          setError('');
        } else {
          setToken(data.token);
          setError('');
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMFA = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/risk/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: riskScore?.challengeId, username, mfaCode })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setMfaRequired(false);
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🎯 Risk-Based Authentication</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20 }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
            <input type="text" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="IP" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
            <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="Device ID" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
            <button type="submit" disabled={loading || token} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', width: '100%' }}>
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
          <button onClick={handleEvaluate} style={{ width: '100%', marginTop: 10, padding: '10px 20px', background: '#999', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            Evaluate Risk
          </button>
        </div>

        {riskScore && (
          <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
            <h2>Risk Assessment</h2>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: riskScore.riskLevel === 'critical' ? '#e74c3c' : riskScore.riskLevel === 'high' ? '#f39c12' : '#27ae60', marginBottom: 10 }}>
              {riskScore.riskLevel.toUpperCase()} ({(riskScore.riskScore * 100).toFixed(1)}%)
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.8 }}>
              <div>IP Risk: {(riskScore.factors.ipRisk.score * 100).toFixed(0)}%</div>
              <div>Geo Risk: {(riskScore.factors.geoRisk.score * 100).toFixed(0)}%</div>
              <div>Device Risk: {(riskScore.factors.deviceRisk.score * 100).toFixed(0)}%</div>
              <div>Behavior Risk: {(riskScore.factors.behaviorRisk.score * 100).toFixed(0)}%</div>
              <div>Time Risk: {(riskScore.factors.timeRisk.score * 100).toFixed(0)}%</div>
              <div style={{ marginTop: 10, color: '#666' }}>MFA Required: {riskScore.requiresMFA ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </div>

      {mfaRequired && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
          <h2>Complete MFA Challenge</h2>
          <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="Enter 6-digit code" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
          <button onClick={handleCompleteMFA} disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {loading ? 'Verifying...' : 'Verify MFA'}
          </button>
        </div>
      )}

      {token && (
        <div style={{ background: '#efe', color: '#3c3', padding: 15, borderRadius: 4 }}>
          ✓ Authenticated! Token: {token.substr(0, 20)}...
        </div>
      )}
    </div>
  );
}
