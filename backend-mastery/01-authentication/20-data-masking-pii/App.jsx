import React, { useState } from 'react';

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const API_BASE = 'http://localhost:3000/auth';

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      // Implement Data Masking PII authentication
      setUser({ email: 'user@example.com' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Data Masking PII</h2>
        {error && <div className="error">{error}</div>}
        {user ? (
          <div>
            <p>Welcome {user.email}</p>
            <button onClick={() => setUser(null)}>Logout</button>
          </div>
        ) : (
          <button onClick={handleAuth} disabled={loading}>
            {loading ? 'Loading...' : 'Authenticate'}
          </button>
        )}
      </div>
    </div>
  );
}
