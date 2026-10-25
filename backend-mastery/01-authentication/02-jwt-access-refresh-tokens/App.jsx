import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/auth';

// Create axios instance with interceptor for JWT
const api = axios.create({ baseURL: API_URL });

let refreshPromise = null;

// Request interceptor - add access token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const response = await axios.post(`${API_URL}/refresh`, {
              refreshToken
            });

            localStorage.setItem('accessToken', response.data.accessToken);
            api.defaults.headers.common.Authorization = `Bearer ${response.data.accessToken}`;
            return response.data.accessToken;
          } catch (err) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            throw err;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      await refreshPromise;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [sessions, setSessions] = useState([]);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', name: '' });

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data.user);
      setSuccess('Logged in successfully!');
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError('Session expired. Please login again.');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/register', registerForm);
      
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${response.data.tokens.accessToken}`;
      
      setUser(response.data.user);
      setSuccess('Registration successful!');
      setRegisterForm({ email: '', password: '', name: '' });
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/login', loginForm);
      
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${response.data.tokens.accessToken}`;
      
      setUser(response.data.user);
      setSuccess('Login successful!');
      setLoginForm({ email: '', password: '' });
      setActiveTab('dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/logout', { refreshToken });
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setSessions([]);
      setSuccess('Logged out successfully!');
      setActiveTab('login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.post('/logout-all');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setSessions([]);
      setSuccess('Logged out from all devices!');
      setActiveTab('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to logout from all devices');
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.sessions);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch sessions');
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>JWT Access/Refresh Tokens Authentication</h1>
        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Login
          </button>
          <button
            className={`tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' && (
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}

        {activeTab === 'register' && (
          <form onSubmit={handleRegister}>
            <h2>Register</h2>
            <input
              type="text"
              placeholder="Full Name"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password (min 8 chars, uppercase, lowercase, numbers)"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>JWT Authentication Dashboard</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="userInfo">
        <h2>Welcome, {user.name}!</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>

      <div className="buttons">
        <button onClick={fetchSessions}>View Active Sessions</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
        <button onClick={handleLogoutAll} className="logout-all-btn">Logout from All Devices</button>
      </div>

      {sessions.length > 0 && (
        <div className="sessions">
          <h3>Active Sessions ({sessions.length})</h3>
          <ul>
            {sessions.map((session, idx) => (
              <li key={idx}>
                <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
                <p><strong>Expires:</strong> {new Date(session.expiresAt).toLocaleString()}</p>
                <p><strong>Status:</strong> {session.isExpired ? '❌ Expired' : '✅ Active'}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }
        h1 { color: #333; }
        .error { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; margin: 10px 0; }
        .success { background: #d4edda; color: #155724; padding: 12px; border-radius: 4px; margin: 10px 0; }
        .tabs { display: flex; gap: 10px; margin: 20px 0; }
        .tab { padding: 10px 20px; border: none; background: #e0e0e0; cursor: pointer; border-radius: 4px; }
        .tab.active { background: #007bff; color: white; }
        form { background: #f5f5f5; padding: 20px; border-radius: 4px; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 10px 0; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .logout-btn { background: #dc3545; }
        .logout-btn:hover { background: #c82333; }
        .logout-all-btn { background: #fd7e14; }
        .logout-all-btn:hover { background: #e56a00; }
        .userInfo { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .buttons { display: flex; gap: 10px; margin: 20px 0; }
        .buttons button { flex: 1; }
        .sessions { background: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .sessions ul { list-style: none; padding: 0; }
        .sessions li { background: white; padding: 10px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #007bff; }
      `}</style>
    </div>
  );
}

