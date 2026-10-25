import React, { useState, useEffect } from 'react';
import './App.css';

export default function SecurityLab() {
  const [token, setToken] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [formData, setFormData] = useState({
    username: 'alice',
    password: 'password123',
    userId: '1'
  });

  const BASE_URL = 'http://localhost:' + window.location.port.replace(/3/, '4');

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/demo-credentials`);
      const data = await res.json();
      setCredentials(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setResult({ success: true, message: 'Login successful!', data });
      } else {
        setResult({ success: false, message: data.error || 'Login failed' });
      }
    } catch (error) {
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  const testEndpoint = async (endpoint, method = 'GET', body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: body ? JSON.stringify(body) : undefined
      };
      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await res.json();
      setResult({
        success: res.ok,
        status: res.status,
        data
      });
    } catch (error) {
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="security-lab">
      <header>
        <h1>🔒 Security Lab</h1>
        <p>Module - Interactive Vulnerability Testing</p>
      </header>

      <div className="container">
        {/* Auth Section */}
        <section className="auth-section">
          <h2>Step 1: Authentication</h2>
          <div className="form-group">
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={!!token}
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={!!token}
            />
            {!token ? (
              <button onClick={login} disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            ) : (
              <button onClick={() => setToken(null)} style={{ backgroundColor: '#666' }}>
                Logout
              </button>
            )}
          </div>
          {token && <p className="success">✓ Authenticated: {token.substring(0, 20)}...</p>}
        </section>

        {/* Test Section */}
        <section className="test-section">
          <h2>Step 2: Test Endpoints</h2>
          <div className="endpoint-group">
            <h3>Vulnerable Endpoints</h3>
            <button 
              onClick={() => testEndpoint('/api/vulnerable/users/2')}
              disabled={!token || loading}
              className="btn-vulnerable"
            >
              Test Vulnerable Endpoint
            </button>
          </div>

          <div className="endpoint-group">
            <h3>Secure Endpoints</h3>
            <button 
              onClick={() => testEndpoint('/api/secure/users/1')}
              disabled={!token || loading}
              className="btn-secure"
            >
              Test Secure Endpoint
            </button>
          </div>
        </section>

        {/* Results Section */}
        {result && (
          <section className="results-section">
            <h2>Response</h2>
            <div className={`result ${result.success ? 'success' : 'error'}`}>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </section>
        )}
      </div>

      <footer>
        <small>Educational Security Training - Backend Mastery</small>
      </footer>
    </div>
  );
}
