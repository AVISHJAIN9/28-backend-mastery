import React, { useState } from 'react';

export default function OAuthDemo() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = () => {
    setLoggedIn(false);
    setUser(null);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h1>OAuth/OIDC Demo</h1>
      {!loggedIn ? (
        <button onClick={handleLogin} style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Login with OAuth</button>
      ) : (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={handleLogout} style={{ width: '100%', padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Logout</button>
        </>
      )}
    </div>
  );
}
