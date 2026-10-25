import React, { useState, useEffect } from 'react';
const API_BASE = 'http://localhost:6503/api';

const App = () => {
  const [userModule, setUserModule] = useState([]);
  const [orderModule, setOrderModule] = useState([]);
  const [productModule, setProductModule] = useState([]);
  const [activeModule, setActiveModule] = useState('user');
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadModules();
  }, [activeModule]);

  const loadModules = async () => {
    try {
      if (activeModule === 'user') {
        const res = await fetch(`${API_BASE}/users`);
        const data = await res.json();
        setUserModule(data.data || []);
      } else if (activeModule === 'order') {
        const res = await fetch(`${API_BASE}/orders`);
        const data = await res.json();
        setOrderModule(data.data || []);
      } else if (activeModule === 'product') {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        setProductModule(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load data');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const endpoint = activeModule === 'user' ? 'users' : activeModule === 'order' ? 'orders' : 'products';
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Created successfully');
        setFormData({});
        loadModules();
      }
    } catch (err) {
      setMessage('Error creating item');
    }
  };

  const renderModule = () => {
    if (activeModule === 'user') {
      return (
        <div>
          <h3>User Module</h3>
          <form onSubmit={handleCreate}>
            <input placeholder="Name" value={(formData.name || '')} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input placeholder="Email" value={(formData.email || '')} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <button>Create User</button>
          </form>
          <div>{userModule.map(u => <div key={u.id}>{u.name} ({u.email})</div>)}</div>
        </div>
      );
    }
    return <div>Module content here</div>;
  };

  return (
    <div style={{padding: '20px', fontFamily: 'Arial'}}>
      <h1>Module 03: Modular Monolith</h1>
      <div style={{marginBottom: '20px'}}>
        <button onClick={() => setActiveModule('user')} style={{marginRight: '10px', fontWeight: activeModule === 'user' ? 'bold' : 'normal'}}>User Module</button>
        <button onClick={() => setActiveModule('order')} style={{marginRight: '10px', fontWeight: activeModule === 'order' ? 'bold' : 'normal'}}>Order Module</button>
        <button onClick={() => setActiveModule('product')} style={{fontWeight: activeModule === 'product' ? 'bold' : 'normal'}}>Product Module</button>
      </div>
      {message && <p style={{color: 'green'}}>{message}</p>}
      {renderModule()}
    </div>
  );
};

export default App;
