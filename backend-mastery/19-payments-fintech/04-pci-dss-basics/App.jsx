import React, { useState } from 'react';
import './App.css';
function App() {
  const [card, setCard] = useState({ cardNumber: '', expiry: '', name: '' });
  const [token, setToken] = useState('');
  const [payment, setPayment] = useState({ token: '', amount: '', currency: 'USD' });
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6104/api';

  const handleTokenize = async () => {
    try {
      const res = await fetch(`${API_URL}/tokenize-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card)
      });
      const data = await res.json();
      setResponse(data);
      if (data.token) setToken(data.token);
      setCard({ cardNumber: '', expiry: '', name: '' });
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handlePayment = async () => {
    try {
      const res = await fetch(`${API_URL}/process-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payment, token })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header"><h1>🔒 PCI DSS Compliance</h1><p>Never store card data - Use tokenization</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Step 1: Tokenize Card</h2>
          <div className="form-group">
            <input type="text" placeholder="Card Number" value={card.cardNumber} onChange={(e) => setCard({ ...card, cardNumber: e.target.value })} />
            <input type="text" placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} />
            <input type="text" placeholder="Cardholder Name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
            <button onClick={handleTokenize}>Tokenize Card</button>
          </div>
          {token && <p style={{color:'green'}}>✓ Token: {token}</p>}
        </section>
        <section className="section">
          <h2>Step 2: Process Payment with Token</h2>
          <div className="form-group">
            <input type="number" placeholder="Amount" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: parseFloat(e.target.value) })} />
            <button onClick={handlePayment} disabled={!token}>Process Payment</button>
          </div>
        </section>
        <section className="section">
          <h2>✓ PCI DSS Checklist</h2>
          <ul>
            <li>✓ No storage of full card numbers</li>
            <li>✓ No storage of CVV</li>
            <li>✓ Use tokenization</li>
            <li>✓ Encryption enabled</li>
            <li>✓ HTTPS/TLS</li>
          </ul>
        </section>
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
