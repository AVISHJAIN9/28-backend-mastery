import React, { useState } from 'react';

export default function StepUpApp() {
  const [operation, setOperation] = useState('change_password');
  const [sessionId, setSessionId] = useState('');
  const [password, setPassword] = useState('');
  const [stepUpToken, setStepUpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInitiate = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/stepup/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation })
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.sessionId);
        setSuccess('Step-up initiated. Enter credentials to verify.');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/stepup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, password })
      });
      const data = await res.json();
      if (res.ok) {
        setStepUpToken(data.stepUpToken);
        setSuccess('Verified! You can now perform sensitive operation.');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePerform = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/stepup/perform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-step-up-token': stepUpToken
        },
        body: JSON.stringify({ operation, data: {} })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Operation completed: ${data.message}`);
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🔐 Step-Up Authentication</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20 }}>{error}</div>}
      {success && <div style={{ background: '#efe', color: '#3c3', padding: 15, borderRadius: 4, marginBottom: 20 }}>{success}</div>}

      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h2>Select Operation</h2>
        <select value={operation} onChange={(e) => setOperation(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10 }}>
          <option value="change_password">Change Password</option>
          <option value="delete_account">Delete Account</option>
          <option value="modify_payment">Modify Payment</option>
          <option value="change_email">Change Email</option>
        </select>
        <button onClick={handleInitiate} disabled={loading || !!stepUpToken} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? 'Initiating...' : 'Initiate Operation'}
        </button>
      </div>

      {sessionId && !stepUpToken && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Verify Identity</h2>
          <form onSubmit={handleVerify}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" style={{ width: '100%', padding: 10, marginBottom: 10 }} required />
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        </div>
      )}

      {stepUpToken && (
        <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
          <h2>Perform Operation</h2>
          <button onClick={handlePerform} disabled={loading} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {loading ? 'Performing...' : 'Perform Sensitive Operation'}
          </button>
        </div>
      )}
    </div>
  );
}
