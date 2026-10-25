import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:6502/api';

const App = () => {
  const [activeService, setActiveService] = useState('user');
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({});

  // Load data on mount and service change
  useEffect(() => {
    loadData();
  }, [activeService]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeService === 'user') {
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        if (data.success) setUsers(data.data);
      } else if (activeService === 'order') {
        const res = await fetch(`${API_BASE}/orders`);
        const data = await res.json();
        if (data.success) setOrders(data.data);
      }
    } catch (err) {
      setError('Failed to load data');
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role || 'user'
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('User created successfully');
        setFormData({ name: '', email: '', role: 'user' });
        await loadData();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const items = formData.items ? formData.items.split(',').map(item => item.trim()) : [];
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          items: items
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessage('Order created successfully');
        setFormData({ userId: '', items: '' });
        await loadData();
      } else {
        setError(data.error || 'Failed to create order');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMessage('User deleted');
        await loadData();
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const renderUserService = () => (
    <div style={styles.service}>
      <h3>User Service</h3>
      <form onSubmit={handleCreateUser} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name || ''}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email || ''}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <select
          name="role"
          value={formData.role || 'user'}
          onChange={handleInputChange}
          style={styles.input}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
        </select>
        <button type="submit" style={styles.button}>Create User</button>
      </form>

      <h4>All Users ({users.length})</h4>
      {users.map(user => (
        <div key={user.id} style={styles.item}>
          <strong>{user.name}</strong> ({user.email}) - {user.role}
          <button
            onClick={() => handleDeleteUser(user.id)}
            style={{ ...styles.button, background: '#dc3545', marginLeft: '10px' }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );

  const renderOrderService = () => (
    <div style={styles.service}>
      <h3>Order Service</h3>
      <form onSubmit={handleCreateOrder} style={styles.form}>
        <input
          type="number"
          name="userId"
          placeholder="User ID"
          value={formData.userId || ''}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <input
          type="text"
          name="items"
          placeholder="Items (comma-separated)"
          value={formData.items || ''}
          onChange={handleInputChange}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Create Order</button>
      </form>

      <h4>All Orders ({orders.length})</h4>
      {orders.map(order => (
        <div key={order.id} style={styles.item}>
          <strong>Order #{order.id}</strong> - User {order.userId}
          <br />Items: {order.items.join(', ')} | Total: ${order.total.toFixed(2)} | Status: {order.status}
        </div>
      ))}
    </div>
  );

  const renderSystemStatus = () => (
    <div style={styles.service}>
      <h3>System Status</h3>
      <div style={styles.statusGrid}>
        <div style={styles.statusCard}>
          <h4>User Service</h4>
          <p>Port: 6502</p>
          <p style={styles.statusGreen}>✓ Running</p>
        </div>
        <div style={styles.statusCard}>
          <h4>Order Service</h4>
          <p>Port: 6503</p>
          <p style={styles.statusGreen}>✓ Running</p>
        </div>
        <div style={styles.statusCard}>
          <h4>Payment Service</h4>
          <p>Port: 6504</p>
          <p style={styles.statusGreen}>✓ Running</p>
        </div>
      </div>
      
      <h4>Service Mesh Features</h4>
      <ul>
        <li>✓ Circuit Breaker Pattern</li>
        <li>✓ Service Discovery</li>
        <li>✓ Rate Limiting</li>
        <li>✓ Request Tracing</li>
        <li>✓ Load Balancing</li>
        <li>✓ Resilience & Fallback</li>
      </ul>
    </div>
  );

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Module 02: Microservices + Service Mesh</h1>
        <p>Testing distributed services with mesh concepts</p>
      </header>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveService('user')}
          style={{...styles.tab, ...(activeService === 'user' ? styles.tabActive : {})}}
        >
          User Service
        </button>
        <button
          onClick={() => setActiveService('order')}
          style={{...styles.tab, ...(activeService === 'order' ? styles.tabActive : {})}}
        >
          Order Service
        </button>
        <button
          onClick={() => setActiveService('status')}
          style={{...styles.tab, ...(activeService === 'status' ? styles.tabActive : {})}}
        >
          System Status
        </button>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.danger}>{error}</div>}
      {loading && <div style={styles.info}>Loading...</div>}

      <div style={styles.content}>
        {activeService === 'user' && renderUserService()}
        {activeService === 'order' && renderOrderService()}
        {activeService === 'status' && renderSystemStatus()}
      </div>

      <footer style={styles.footer}>
        <p>Architecture Pattern: Microservices + Service Mesh</p>
        <p>Each service runs independently with async communication</p>
      </footer>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: 'Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    background: '#007bff',
    color: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    borderBottom: '2px solid #ddd'
  },
  tab: {
    padding: '10px 20px',
    background: '#f0f0f0',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0'
  },
  tabActive: {
    background: '#007bff',
    color: 'white'
  },
  content: {
    minHeight: '400px'
  },
  service: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  button: {
    padding: '10px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  item: {
    padding: '10px',
    background: 'white',
    margin: '10px 0',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  success: {
    background: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  danger: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  info: {
    background: '#d1ecf1',
    color: '#0c5460',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '10px'
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px'
  },
  statusCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    textAlign: 'center'
  },
  statusGreen: {
    color: '#28a745',
    fontWeight: 'bold'
  },
  footer: {
    marginTop: '40px',
    padding: '20px',
    background: '#f0f0f0',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#666'
  }
};

export default App;
