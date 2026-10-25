import React, { useState } from 'react';
import './App.css';
function App() {
  const [seller, setSeller] = useState({ email: '', firstName: '', lastName: '', businessName: '' });
  const [charge, setCharge] = useState({ amount: '', sellerId: '', customerId: '', description: '' });
  const [sellers, setSellers] = useState([]);
  const [charges, setCharges] = useState([]);
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6108/api';

  const handleCreateSeller = async () => {
    try {
      const res = await fetch(`${API_URL}/sellers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seller)
      });
      const data = await res.json();
      setResponse(data);
      setSellers([...sellers, data]);
      setSeller({ email: '', firstName: '', lastName: '', businessName: '' });
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handleProcessCharge = async () => {
    try {
      const res = await fetch(`${API_URL}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(charge)
      });
      const data = await res.json();
      setResponse(data);
      setCharges([...charges, data]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header"><h1>🏪 Stripe Connect Marketplace</h1><p>Multi-seller payments & payouts</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Register Seller</h2>
          <div className="form-group">
            <input type="email" placeholder="Email" value={seller.email} onChange={(e) => setSeller({ ...seller, email: e.target.value })} />
            <input type="text" placeholder="First Name" value={seller.firstName} onChange={(e) => setSeller({ ...seller, firstName: e.target.value })} />
            <input type="text" placeholder="Last Name" value={seller.lastName} onChange={(e) => setSeller({ ...seller, lastName: e.target.value })} />
            <input type="text" placeholder="Business Name" value={seller.businessName} onChange={(e) => setSeller({ ...seller, businessName: e.target.value })} />
            <button onClick={handleCreateSeller}>Register</button>
          </div>
        </section>
        <section className="section">
          <h2>Sellers ({sellers.length})</h2>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Email</th><th>Business</th><th>Status</th></tr></thead>
            <tbody>
              {sellers.map((s) => (<tr key={s.sellerId}><td>{s.firstName} {s.lastName}</td><td>{s.email}</td><td>{s.businessName}</td><td>{s.status}</td></tr>))}
            </tbody>
          </table>
        </section>
        <section className="section">
          <h2>Process Charge</h2>
          <div className="form-group">
            <input type="number" placeholder="Amount" value={charge.amount} onChange={(e) => setCharge({ ...charge, amount: e.target.value })} />
            <input type="text" placeholder="Seller ID" value={charge.sellerId} onChange={(e) => setCharge({ ...charge, sellerId: e.target.value })} />
            <input type="text" placeholder="Customer ID" value={charge.customerId} onChange={(e) => setCharge({ ...charge, customerId: e.target.value })} />
            <input type="text" placeholder="Description" value={charge.description} onChange={(e) => setCharge({ ...charge, description: e.target.value })} />
            <button onClick={handleProcessCharge}>Charge</button>
          </div>
        </section>
        <section className="section">
          <h2>Charges ({charges.length})</h2>
          <table className="data-table">
            <thead><tr><th>ID</th><th>Amount</th><th>Fee</th><th>Seller Amount</th></tr></thead>
            <tbody>
              {charges.map((c) => (<tr key={c.chargeId}><td>{c.chargeId}</td><td>${c.amount}</td><td>${c.platformFee}</td><td>${c.sellerAmount}</td></tr>))}
            </tbody>
          </table>
        </section>
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
