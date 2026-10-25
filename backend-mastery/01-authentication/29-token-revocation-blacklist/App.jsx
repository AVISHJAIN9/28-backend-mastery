import React, { useState } from 'react';

export default function TokenRevocationApp() {
  const [token, setToken] = useState('');
  const [reason, setReason] = useState('manual');
  const [revocationList, setRevocationList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRevoke = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reason })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Token revoked successfully');
        setToken('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('Logged out successfully');
        setToken('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/revocation-list');
      const data = await res.json();
      setRevocationList(data.revoked || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>🔴 Token Revocation & Blacklist</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20 }}>{error}</div>}
      {success && <div style={{ background: '#efe', color: '#3c3', padding: 15, borderRadius: 4, marginBottom: 20 }}>{success}</div>}

      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h3>Revoke Token</h3>
        <form onSubmit={handleRevoke}>
          <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token to revoke" style={{ width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ddd', borderRadius: 4 }} required />
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ddd', borderRadius: 4 }}>
            <option value="manual">Manual Revocation</option>
            <option value="logout">Logout</option>
            <option value="compromised">Compromised</option>
            <option value="expired">Expired</option>
          </select>
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {loading ? 'Revoking...' : 'Revoke Token'}
          </button>
          <button type="button" onClick={handleLogout} disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', marginLeft: 10 }}>
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
        <h3>Revocation List</h3>
        <button onClick={fetchList} disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          {loading ? 'Loading...' : 'Fetch List'}
        </button>
        {revocationList.map((item, i) => (
          <div key={i} style={{ background: '#f5f5f5', padding: 10, marginTop: 10, borderRadius: 4, borderLeft: '4px solid #e74c3c' }}>
            <p><strong>Reason:</strong> {item.reason} | <strong>Revoked:</strong> {new Date(item.revokedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
