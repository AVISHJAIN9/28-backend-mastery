import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/auth';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedProviders, setLinkedProviders] = useState([]);

  useEffect(() => {
    // Check if returning from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      fetchCurrentUser();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (localStorage.getItem('accessToken')) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/me');
      setUser(response.data.user);
      setError('');
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const response = await api.get('/google/url');
      window.location.href = response.data.authUrl;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get login URL');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setLinkedProviders([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Logout failed');
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/providers');
      setLinkedProviders(response.data.linkedProviders);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch providers');
    }
  };

  if (!user) {
    return (
      <div className="container">
        <h1>Google OAuth 2.0 Social Login</h1>
        {error && <div className="error">{error}</div>}
        
        <button onClick={handleGoogleLogin} disabled={loading} className="google-btn">
          🔐 {loading ? 'Redirecting...' : 'Login with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>OAuth 2.0 Dashboard</h1>
      <div className="userCard">
        {user.picture && <img src={user.picture} alt="Profile" />}
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <p>Provider: {user.provider}</p>
      </div>

      <div className="actions">
        <button onClick={fetchProviders}>View Linked Providers</button>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      {linkedProviders.length > 0 && (
        <div className="providers">
          <h3>Linked Providers</h3>
          <ul>
            {linkedProviders.map(provider => (
              <li key={provider}>✅ {provider.charAt(0).toUpperCase() + provider.slice(1)}</li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        .container { max-width: 500px; margin: 50px auto; padding: 20px; font-family: Arial, sans-serif; }
        .error { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; margin: 10px 0; }
        .google-btn { width: 100%; padding: 12px; background: #1f2937; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        .google-btn:hover { background: #111827; }
        .userCard { text-align: center; background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .userCard img { width: 80px; height: 80px; border-radius: 50%; margin-bottom: 10px; }
        .actions { display: flex; gap: 10px; margin: 20px 0; }
        .actions button { flex: 1; padding: 10px; border: none; border-radius: 4px; cursor: pointer; }
        .logout-btn { background: #dc3545; color: white; }
        .logout-btn:hover { background: #c82333; }
        button { background: #007bff; color: white; }
        button:hover { background: #0056b3; }
        .providers { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
        .providers ul { list-style: none; padding: 0; }
        .providers li { padding: 8px; margin: 5px 0; background: white; border-radius: 4px; }
      `}</style>
    </div>
  );
}

