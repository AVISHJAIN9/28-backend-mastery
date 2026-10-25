import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:13001/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
      setApiResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:13001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setApiResponse(data);

      if (data.success) {
        setUsers([...users, data.data]);
        setFormData({ name: '', email: '', role: 'user' });
      } else {
        setError(data.error?.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:13001/api/users/${userId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      setApiResponse(data);

      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const promoteToAdmin = async (userId) => {
    try {
      setIsLoading(true);
      const res = await fetch(`http://localhost:13001/api/users/${userId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: ['create', 'read', 'update', 'delete'],
          department: 'Engineering'
        })
      });
      const data = await res.json();
      setApiResponse(data);

      if (data.success) {
        setUsers(users.map(u => u.id === userId ? data.data : u));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>📘 TypeScript: Types vs Interfaces</h1>
        <p>Explore the differences and use cases</p>
      </header>

      <div className="container">
        <div className="sidebar">
          <div className="info-card">
            <h3>When to Use Type?</h3>
            <ul>
              <li>❌ Primitives/unions</li>
              <li>❌ Tuples</li>
              <li>❌ Function signatures</li>
              <li>❌ Intersections</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>When to Use Interface?</h3>
            <ul>
              <li>✅ Object contracts</li>
              <li>✅ Classes</li>
              <li>✅ Inheritance</li>
              <li>✅ Declaration merging</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Example Types</h3>
            <pre className="code">
{`type Status = 
  | 'active'
  | 'inactive';

type User = \{
  id: number;
  name: string;
\}`}
            </pre>
          </div>

          <div className="info-card">
            <h3>Example Interface</h3>
            <pre className="code">
{`interface User \{
  id: number;
  name: string;
\}

interface Admin 
  extends User \{
  permissions: string[];
\}`}
            </pre>
          </div>
        </div>

        <div className="main">
          <div className="form-section">
            <h3>Create User (Type-Based)</h3>
            <form onSubmit={createUser}>
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create User'}
              </button>
            </form>
          </div>

          <div className="users-section">
            <h3>Users List (Interface Pattern)</h3>
            {error && <div className="error">{error}</div>}
            {isLoading && <p className="loading">Loading...</p>}
            <div className="users-grid">
              {users.map(user => (
                <div key={user.id} className={`user-card role-${user.role}`}>
                  <div className="user-header">
                    <strong>{user.name}</strong>
                    <span className={`role-badge ${user.role}`}>{user.role}</span>
                  </div>
                  <p className="email">{user.email}</p>
                  <p className="id">ID: {user.id}</p>
                  <p className="date">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  <div className="actions">
                    <button
                      className="btn btn-small btn-warning"
                      onClick={() => promoteToAdmin(user.id)}
                      disabled={user.role === 'admin'}
                    >
                      {user.role === 'admin' ? 'Admin' : 'Promote'}
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {users.length === 0 && <p className="empty">No users. Create one!</p>}
          </div>

          <div className="response-section">
            <h3>API Response (Type Example)</h3>
            {apiResponse && (
              <pre className="code-block">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

