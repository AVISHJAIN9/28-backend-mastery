import React, { useState } from 'react';
import './App.css';
function App() {
  const [method, setMethod] = useState('razorpay');
  const [formData, setFormData] = useState({ amount: '', email: '', phone: '' });
  const [orders, setOrders] = useState([]);
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6105/api';

  const handleRazorpayOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/razorpay/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, currency: 'INR', description: 'Order' })
      });
      const data = await res.json();
      setResponse(data);
      setOrders([...orders, data]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handlePayUPayment = async () => {
    try {
      const res = await fetch(`${API_URL}/payu/payment-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header"><h1>🇮🇳 Indian Payment Gateways</h1><p>Razorpay & PayU Integration</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Payment Methods</h2>
          <div className="button-group">
            <button className={method === 'upi' ? 'active' : ''} onClick={() => setMethod('upi')}>UPI</button>
            <button className={method === 'netbanking' ? 'active' : ''} onClick={() => setMethod('netbanking')}>Net Banking</button>
            <button className={method === 'card' ? 'active' : ''} onClick={() => setMethod('card')}>Card</button>
          </div>
        </section>
        <section className="section">
          <h2>Razorpay Order</h2>
          <div className="form-group">
            <input type="number" placeholder="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            <button onClick={handleRazorpayOrder}>Create Razorpay Order</button>
          </div>
        </section>
        <section className="section">
          <h2>PayU Payment</h2>
          <div className="form-group">
            <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="tel" placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <button onClick={handlePayUPayment}>Create PayU Link</button>
          </div>
        </section>
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
