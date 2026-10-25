import React, { useState, useEffect } from 'react';

export default function App() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '' });
  const [conflictData, setConflictData] = useState(null);

  const API_URL = 'http://localhost:4001/api';

  useEffect(() => {
    loadProducts();
  }, []);

  const callAPI = async (method, url, body = null) => {
    setLoading(true);
    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);

      const res = await fetch(`${API_URL}${url}`, options);
      const data = await res.json();
      setResponse({
        status: res.status,
        data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err) {
      setResponse({
        error: err.message,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  const loadProducts = () => {
    callAPI('GET', '/secure/products');
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentVersion(product.version);
    setFormData({ name: product.name, price: product.price });
    setConflictData(null);
  };

  const handleUpdateSecure = () => {
    if (!selectedProduct || currentVersion === null) return alert('Select a product first');
    if (!formData.name || !formData.price) return alert('Fill all fields');

    callAPI('PATCH', `/secure/products/${selectedProduct.id}`, {
      name: formData.name,
      price: parseFloat(formData.price),
      currentVersion: currentVersion
    });

    setTimeout(loadProducts, 500);
  };

  const handleUpdateVulnerable = () => {
    if (!selectedProduct) return alert('Select a product first');
    if (!formData.name || !formData.price) return alert('Fill all fields');

    callAPI('PATCH', `/vulnerable/products/${selectedProduct.id}`, {
      name: formData.name,
      price: parseFloat(formData.price)
    });

    setTimeout(loadProducts, 500);
  };

  const handleSimulateConflict = () => {
    if (!selectedProduct) return alert('Select a product first');

    // Simulate: update happens server-side by changing version
    setCurrentVersion(currentVersion - 1); // Stale version
    
    callAPI('POST', `/test/products/${selectedProduct.id}/concurrent-update`, {
      name: formData.name,
      price: parseFloat(formData.price),
      currentVersion: currentVersion - 1  // Wrong version
    });
  };

  const handleResolveConflict = () => {
    if (!conflictData) return;

    // Use server's latest version
    const latestVersion = conflictData.data.current?.version || conflictData.data.latestVersion;
    
    callAPI('PATCH', `/secure/products/${selectedProduct.id}`, {
      name: formData.name,
      price: parseFloat(formData.price),
      currentVersion: latestVersion
    });

    setConflictData(null);
    setTimeout(loadProducts, 500);
  };

  const handleGetVersionHistory = () => {
    if (!selectedProduct) return alert('Select a product first');
    callAPI('GET', `/secure/products/${selectedProduct.id}/history`);
  };

  const handleResetVersion = () => {
    if (!selectedProduct) return alert('Select a product first');
    callAPI('POST', `/test/products/${selectedProduct.id}/reset-version`);
    setCurrentVersion(1);
    setTimeout(loadProducts, 500);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h1>🔒 Optimistic Locking Pattern Demo</h1>
      <p>Learn how to handle concurrent updates with version-based locking</p>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr 350px', gap: '20px' }}>
        {/* Products List */}
        <div>
          <h3>Products</h3>
          <div style={{ border: '1px solid #ccc', borderRadius: '5px', padding: '10px', maxHeight: '400px', overflow: 'auto' }}>
            {products.data?.map(p => (
              <div
                key={p.id}
                onClick={() => handleSelectProduct(p)}
                style={{
                  padding: '10px',
                  margin: '5px 0',
                  background: selectedProduct?.id === p.id ? '#2196f3' : '#f5f5f5',
                  color: selectedProduct?.id === p.id ? 'white' : 'black',
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                <strong>{p.name}</strong>
                <div style={{ fontSize: '12px' }}>v{p.version} - ${p.price}</div>
              </div>
            ))}
          </div>
          <button onClick={loadProducts} style={{...buttonStyle, width: '100%', marginTop: '10px'}}>
            Refresh List
          </button>
        </div>

        {/* Edit Form */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>Edit Product</h3>
          {selectedProduct ? (
            <div>
              <p><strong>Product ID:</strong> {selectedProduct.id}</p>
              <p><strong>Current Version:</strong> {currentVersion} (Server: v{selectedProduct.version})</p>
              
              <input
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{...inputStyle, width: '100%'}}
              />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                style={{...inputStyle, width: '100%'}}
              />

              <h4>✅ Secure (with version)</h4>
              <button onClick={handleUpdateSecure} style={{...buttonStyle, width: '100%'}}>
                Update (Optimistic Lock)
              </button>
              <button onClick={handleGetVersionHistory} style={{...buttonStyle, width: '100%'}}>
                View History
              </button>

              <h4>⚠️ Testing</h4>
              <button onClick={handleSimulateConflict} style={{...buttonStyle, background: '#ff9800', width: '100%'}}>
                Simulate Conflict
              </button>
              {conflictData && (
                <button onClick={handleResolveConflict} style={{...buttonStyle, background: '#4caf50', width: '100%'}}>
                  Resolve & Retry
                </button>
              )}
              <button onClick={handleResetVersion} style={{...buttonStyle, background: '#9c27b0', width: '100%'}}>
                Reset Version (Test)
              </button>

              <h4>❌ Vulnerable (no version)</h4>
              <button onClick={handleUpdateVulnerable} style={{...buttonStyle, background: '#f44336', width: '100%'}}>
                Update (Lost Update Risk!)
              </button>
            </div>
          ) : (
            <p style={{color: '#999'}}>Select a product to edit...</p>
          )}
        </div>

        {/* Conflict Display */}
        <div style={{ border: '1px solid #ff9800', padding: '15px', borderRadius: '5px', background: conflictData ? '#fff3e0' : '#f5f5f5' }}>
          <h3>Conflict Detection</h3>
          {conflictData && conflictData.data?.conflict ? (
            <div>
              <p style={{color: '#f44336'}}>
                <strong>⚠️ Version Conflict Detected!</strong>
              </p>
              <p><strong>Your Version:</strong> v{conflictData.data.yourVersion}</p>
              <p><strong>Server Version:</strong> v{conflictData.data.latestVersion}</p>
              <p style={{fontSize: '12px', color: '#666'}}>
                Another user updated this product while you were editing.
              </p>
              <button onClick={handleResolveConflict} style={{...buttonStyle, background: '#4caf50', width: '100%'}}>
                Accept Server Changes & Retry
              </button>
            </div>
          ) : (
            <p style={{color: '#999'}}>Click "Simulate Conflict" to see version conflict handling</p>
          )}
        </div>

        {/* Response */}
        <div>
          <h3>Response</h3>
          <div style={{
            background: '#f5f5f5',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            minHeight: '300px',
            maxHeight: '600px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {loading ? (
              <p>Loading...</p>
            ) : response ? (
              <div>
                <p style={{color: response.status === 409 ? '#f44336' : '#4caf50'}}>
                  <strong>Status:</strong> {response.status}
                </p>
                <pre style={{
                  background: '#fff',
                  padding: '8px',
                  borderRadius: '3px',
                  overflow: 'auto',
                  fontSize: '11px',
                  margin: 0
                }}>
                  {JSON.stringify(response.data || response, null, 2)}
                </pre>
              </div>
            ) : (
              <p style={{color: '#999'}}>Responses appear here...</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#e3f2fd', padding: '15px', borderRadius: '5px' }}>
        <h3>📚 Key Concepts</h3>
        <ul>
          <li><strong>Version Field:</strong> Incremented on every update</li>
          <li><strong>Conflict Detection:</strong> Version mismatch = concurrent update</li>
          <li><strong>Client Provides Version:</strong> Server checks before updating</li>
          <li><strong>409 Conflict Response:</strong> Tells client to retry with latest</li>
          <li><strong>No Blocking:</strong> Reads never block, retries on write</li>
          <li><strong>Lost Update Prevention:</strong> Prevents one update from overwriting another</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle = {
  background: '#2196f3',
  color: 'white',
  padding: '8px 12px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  marginRight: '5px',
  marginBottom: '5px',
  fontSize: '12px'
};

const inputStyle = {
  padding: '8px',
  marginBottom: '10px',
  borderRadius: '4px',
  border: '1px solid #ddd',
  fontSize: '14px'
};

