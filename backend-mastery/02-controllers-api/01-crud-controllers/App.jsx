import React, { useState } from 'react';

export default function CRUDApp() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/crud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price: parseFloat(price), description })
      });
      const data = await res.json();
      if (res.ok) {
        setProducts([...products, data]);
        setName('');
        setPrice('');
        setDescription('');
        setError('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/crud/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h1>📦 CRUD Controller</h1>

      {error && <div style={{ background: '#fee', color: '#c33', padding: 15, borderRadius: 4, marginBottom: 20 }}>{error}</div>}

      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20 }}>
        <h2>Create Product</h2>
        <form onSubmit={handleCreate}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" style={{ width: '100%', padding: 10, marginBottom: 10 }} required />
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" step="0.01" style={{ width: '100%', padding: 10, marginBottom: 10 }} required />
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={{ width: '100%', padding: 10, marginBottom: 10 }} />
          <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            {loading ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div style={{ background: 'white', padding: 20, borderRadius: 8 }}>
        <h2>Products ({products.length})</h2>
        {products.map(p => (
          <div key={p.id} style={{ padding: 10, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{p.name}</strong> - ${p.price}
              {p.description && <div style={{ fontSize: 12, color: '#666' }}>{p.description}</div>}
            </div>
            <button onClick={() => handleDelete(p.id)} disabled={loading} style={{ padding: '5px 10px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
