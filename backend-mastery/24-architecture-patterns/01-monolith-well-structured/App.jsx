import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001/api';

const App = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/users/${editingId}` : `${API_BASE}/users`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        setMessage(data.message || 'Operation successful');
        setFormData({ name: '', email: '', role: 'user' });
        setEditingId(null);
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (user) => {
    setFormData({ name: user.name, email: user.email, role: user.role });
    setEditingId(user.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      const res = await fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('User deleted successfully');
        fetchUsers();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1>📦 Monolith Well Structured</h1>
      <p style={styles.subtitle}>CRUD operations on a well-structured monolith</p>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <input
          type="email"
          placeholder="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          style={styles.input}
          required
        />
        <select name="role" value={formData.role} onChange={handleInputChange} style={styles.input}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        <button type="submit" style={styles.button}>
          {editingId ? 'Update' : 'Create'} User
        </button>
        {editingId && (
          <button
            type="button"
            onClick={() => {
              setFormData({ name: '', email: '', role: 'user' });
              setEditingId(null);
            }}
            style={styles.buttonSecondary}
          >
            Cancel
          </button>
        )}
      </form>

      <div style={styles.usersList}>
        <h2>Users ({users.length})</h2>
        {users.length === 0 ? (
          <p>No users yet</p>
        ) : (
          <ul style={styles.list}>
            {users.map(user => (
              <li key={user.id} style={styles.listItem}>
                <span>
                  <strong>{user.name}</strong> ({user.role}) - {user.email}
                  <br />
                  Status: <em>{user.status}</em>
                </span>
                <div>
                  <button onClick={() => handleEdit(user)} style={styles.buttonSmall}>
                    Edit
                  </button>
                  <button onClick={() => handleDelete(user.id)} style={styles.buttonSmallDanger}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  subtitle: {
    color: '#666',
    marginBottom: '20px'
  },
  message: {
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  error: {
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    flex: '1',
    minWidth: '150px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  buttonSecondary: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  usersList: {
    marginTop: '30px'
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  listItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee'
  },
  buttonSmall: {
    padding: '4px 8px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px'
  },
  buttonSmallDanger: {
    padding: '4px 8px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default App;
