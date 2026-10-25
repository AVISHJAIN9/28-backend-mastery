/**
 * React UI for Generics & API Response Patterns
 * Demonstrates generic type usage and Result<T> discriminated unions
 */

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:13002/api';

function App() {
  // User CRUD state
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'user' });
  const [selectedId, setSelectedId] = useState(null);
  const [updateForm, setUpdateForm] = useState({ name: '', email: '', role: '' });

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [pagination, setPagination] = useState(null);

  // Response display
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Generic Result<T> response wrapper - shows structure
  const ResultTypeExample = () => (
    <div
      style={{
        background: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px',
        marginBottom: '20px',
        fontSize: '12px'
      }}
    >
      <strong>Result&lt;T&gt; Type Pattern:</strong>
      <pre style={{ marginTop: '5px' }}>
{`// Success Response
{
  "ok": true,
  "data": T,           // Your generic data
  "timestamp": number,
  "duration": number   // milliseconds
}

// Error Response
{
  "ok": false,
  "error": {
    "message": string,
    "code": string
  },
  "timestamp": number
}`}
      </pre>
    </div>
  );

  // Fetch users with pagination
  const fetchUsers = async (p = 1, ps = 5) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users?page=${p}&pageSize=${ps}`);
      const data = await res.json();
      setResponse(data);

      if (data.ok) {
        setUsers(data.data.items);
        setPagination(data.data);
      }
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'FETCH_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Create user
  const createUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      setResponse(data);

      if (data.ok) {
        setNewUser({ name: '', email: '', role: 'user' });
        fetchUsers(page, pageSize);
      }
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'CREATE_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      setResponse(data);

      if (data.ok) {
        fetchUsers(page, pageSize);
      }
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'DELETE_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const updateUser = async (id) => {
    if (!updateForm.name && !updateForm.email && !updateForm.role) {
      setResponse({ ok: false, error: { message: 'No fields to update', code: 'NO_UPDATE' } });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm)
      });
      const data = await res.json();
      setResponse(data);

      if (data.ok) {
        setUpdateForm({ name: '', email: '', role: '' });
        setSelectedId(null);
        fetchUsers(page, pageSize);
      }
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'UPDATE_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Promote to admin
  const promoteToAdmin = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/${id}/promote`, { method: 'POST' });
      const data = await res.json();
      setResponse(data);

      if (data.ok) {
        fetchUsers(page, pageSize);
      }
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'PROMOTE_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const search = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/users/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setResponse(data);
      setSearchResults(data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'SEARCH_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  // Get stats
  const getStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stats`);
      const data = await res.json();
      setResponse(data);
      setStats(data.data);
    } catch (error) {
      setResponse({ ok: false, error: { message: error.message, code: 'STATS_ERROR' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>13.2: Generics & API Response Patterns</h1>

      <ResultTypeExample />

      {/* Pagination Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>
          Page Size:
          <input
            type="number"
            value={pageSize}
            onChange={e => setPageSize(parseInt(e.target.value))}
            min="1"
            max="100"
          />
        </label>
        <button onClick={() => setPage(Math.max(1, page - 1))}>← Previous</button>
        <span>
          Page {page} of {pagination?.hasMore ? 'multiple' : page}
        </span>
        <button onClick={() => setPage(page + 1)}>Next →</button>
        <button onClick={() => fetchUsers(page, pageSize)}>Refresh</button>
        <button onClick={getStats}>Stats</button>
      </div>

      {/* Create User */}
      <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '20px' }}>
        <h3>Create User (Result&lt;User&gt;)</h3>
        <input
          placeholder="Name"
          value={newUser.name}
          onChange={e => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={newUser.email}
          onChange={e => setNewUser({ ...newUser, email: e.target.value })}
        />
        <select
          value={newUser.role}
          onChange={e => setNewUser({ ...newUser, role: e.target.value })}
        >
          <option>user</option>
          <option>admin</option>
          <option>moderator</option>
        </select>
        <button onClick={createUser} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>

      {/* Search Users */}
      <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '20px' }}>
        <h3>Search Users (Result&lt;User[]&gt;)</h3>
        <input
          placeholder="Search by name"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button onClick={search} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        {searchResults && searchResults.ok && (
          <p>Found {searchResults.count} results</p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
          <strong>Repository Stats:</strong>
          <p>Total Users: {stats.total}</p>
        </div>
      )}

      {/* Users List */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Users List (PaginatedResponse&lt;User&gt;)</h3>
        {loading && <p>Loading...</p>}
        {users.length === 0 && !loading && <p>No users</p>}
        {users.map(user => (
          <div
            key={user.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              marginBottom: '10px',
              background: selectedId === user.id ? '#fff9e6' : '#f9f9f9'
            }}
          >
            <strong>{user.name}</strong> ({user.role})
            <p style={{ margin: '5px 0', fontSize: '12px' }}>{user.email}</p>
            <div style={{ display: 'flex', gap: '5px', fontSize: '12px' }}>
              <button onClick={() => promoteToAdmin(user.id)} disabled={user.role === 'admin'}>
                Promote
              </button>
              <button
                onClick={() => {
                  setSelectedId(user.id);
                  setUpdateForm({ name: user.name, email: user.email, role: user.role });
                }}
              >
                Edit
              </button>
              <button onClick={() => deleteUser(user.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Update Form */}
      {selectedId && (
        <div style={{ border: '2px solid #ffcc00', padding: '10px', marginBottom: '20px' }}>
          <h3>Update User (Result&lt;User&gt;)</h3>
          <input
            placeholder="Name"
            value={updateForm.name}
            onChange={e => setUpdateForm({ ...updateForm, name: e.target.value })}
          />
          <input
            placeholder="Email"
            value={updateForm.email}
            onChange={e => setUpdateForm({ ...updateForm, email: e.target.value })}
          />
          <select
            value={updateForm.role}
            onChange={e => setUpdateForm({ ...updateForm, role: e.target.value })}
          >
            <option value="">No change</option>
            <option>user</option>
            <option>admin</option>
            <option>moderator</option>
          </select>
          <button onClick={() => updateUser(selectedId)} disabled={loading}>
            {loading ? 'Updating...' : 'Update'}
          </button>
          <button onClick={() => setSelectedId(null)}>Cancel</button>
        </div>
      )}

      {/* Response Display */}
      <div style={{ border: '1px solid #red', padding: '10px', marginTop: '20px' }}>
        <h3>Latest Response:</h3>
        <pre
          style={{
            background: response?.ok ? '#e6ffe6' : '#ffe6e6',
            padding: '10px',
            borderRadius: '4px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default App;

