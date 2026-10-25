import React, { useState } from 'react';
import './index.css';

export default function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('http://localhost:4001');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const API_BASE = baseUrl + '/auth';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setFormData({ email: '', password: '', name: '' });
      setIsLogin(true);
      setError('Registration successful! Please login.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setFormData({ email: '', password: '', name: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      localStorage.removeItem('token');
      setUser(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const pingBackend = async () => {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        setError(`✓ Backend is running on ${baseUrl}`);
      } else {
        setError('✗ Backend returned error');
      }
    } catch (err) {
      setError(`✗ Cannot connect to ${baseUrl}`);
    }
  };

  if (user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Welcome Back!</h2>
          <div className="user-info">
            <strong>Name:</strong> {user.name}<br />
            <strong>Email:</strong> {user.email}<br />
            <strong>ID:</strong> {user.id}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="base-card">
        <label>API BASE URL</label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="http://localhost:4001"
        />
        <button onClick={pingBackend} style={{ width: 'auto', marginTop: 0 }}>
          Ping
        </button>
      </div>

      <div className="container">
        <div className="card">
          <h2>{isLogin ? '🔐 Login' : '📝 Register'}</h2>
          
          {error && (
            <div className={`response ${error.includes('✓') || error.includes('successful') ? 'ok' : 'error'}`}>
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {!isLogin && (
              <>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Avish Jain"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </>
            )}

            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="avish@example.com"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={loading}
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="password123"
              value={formData.password}
              onChange={handleInputChange}
              required
              disabled={loading}
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Register'}
            </button>
          </form>

          <button
            className="toggle-btn"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setFormData({ email: '', password: '', name: '' });
            }}
          >
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </button>
        </div>

        <div className="card">
          <h2>Test Routes</h2>
          
          <label>User Profile (requires login)</label>
          <input
            type="text"
            placeholder="/api/profile"
            value="/api/profile"
            disabled
          />
          <button
            onClick={async () => {
              const token = localStorage.getItem('token');
              if (!token) {
                setError('Please login first');
                return;
              }
              try {
                const res = await fetch(`${baseUrl}/auth/me`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                setError(JSON.stringify(data, null, 2));
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            GET Profile
          </button>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            <h2>API Status</h2>
            {user ? (
              <div className="user-info">
                ✓ Logged in as {user.email}
              </div>
            ) : (
              <div className="response">
                Not logged in
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
