import React, { useState, useEffect } from 'react';
import './index.css';

export default function App() {
  const [stage, setStage] = useState('register'); // register, send-link, verify-link, dashboard
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    token: ''
  });
  const [magicToken, setMagicToken] = useState(null);

  const API_BASE = 'http://localhost:4006/auth';

  useEffect(() => {
    // Check if coming from magic link in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setMagicToken(token);
      setFormData(prev => ({ ...prev, token }));
      setStage('verify-link');
    }
  }, []);

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
        body: JSON.stringify({
          email: formData.email,
          name: formData.name
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      setFormData(prev => ({ ...prev, email: prev.email, name: prev.name, token: '' }));
      setStage('send-link');
      setError('Registration successful! Now send yourself a magic link.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/send-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      setMagicToken(data.token);
      setError('Magic link sent to your email! (Demo: token shown below)');
      setStage('verify-link');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/verify-magic-link/${formData.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      setStage('dashboard');
      setFormData({ email: '', name: '', token: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
    setStage('register');
    setFormData({ email: '', name: '', token: '' });
    setMagicToken(null);
  };

  // Register Form
  if (stage === 'register') {
    return (
      <div className="container">
        <div className="card">
          <h2>Register - Passwordless</h2>
          {error && <div className={error.includes('successful') ? 'success' : 'error'}>{error}</div>}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading...' : 'Register'}
            </button>
          </form>

          <p>
            Already registered?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStage('send-link');
                setError('');
                setFormData({ email: '', name: '', token: '' });
              }}
            >
              Send Magic Link
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Send Magic Link Form
  if (stage === 'send-link') {
    return (
      <div className="container">
        <div className="card">
          <h2>Send Magic Link</h2>
          {error && <div className={error.includes('sent') ? 'success' : 'error'}>{error}</div>}

          <form onSubmit={handleSendMagicLink}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
              <small>Enter your email to receive a magic link</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>

          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setStage('register');
                setError('');
                setFormData({ email: '', name: '', token: '' });
              }}
            >
              Register
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Verify Magic Link
  if (stage === 'verify-link') {
    return (
      <div className="container">
        <div className="card">
          <h2>Verify Magic Link</h2>
          {error && <div className="error">{error}</div>}

          <form onSubmit={handleVerifyMagicLink}>
            {magicToken && (
              <div className="info-box">
                <p><strong>Magic Token (for demo):</strong></p>
                <code>{magicToken}</code>
              </div>
            )}

            <div className="form-group">
              <label>Magic Link Token</label>
              <textarea
                name="token"
                value={formData.token}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows="4"
                placeholder="Paste the magic link token you received"
              />
              <small>Copy the token from the magic link sent to your email</small>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>

          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setStage('send-link');
              setError('');
              setFormData({ email: '', name: '', token: '' });
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Dashboard
  if (stage === 'dashboard') {
    return (
      <div className="container">
        <div className="card">
          <h2>Welcome, {user?.name}!</h2>
          <p>Email: {user?.email}</p>

          <div className="info-box">
            <h3>Passwordless Authentication</h3>
            <p>✓ You are logged in with a magic link.</p>
            <p>No password was used for this login!</p>
          </div>

          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
        </div>
      </div>
    );
  }
}
