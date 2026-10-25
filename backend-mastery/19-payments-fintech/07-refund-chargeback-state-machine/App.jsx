import React, { useState } from 'react';
import './App.css';
function App() {
  const [formData, setFormData] = useState({ chargeId: '', amount: '', reason: '' });
  const [refunds, setRefunds] = useState([]);
  const [chargebacks, setChargebacks] = useState([]);
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6107/api';

  const handleInitiateRefund = async () => {
    try {
      const res = await fetch(`${API_URL}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
      setRefunds([...refunds, data]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handleRecordChargeback = async () => {
    try {
      const res = await fetch(`${API_URL}/chargebacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
      setChargebacks([...chargebacks, data]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header"><h1>🔄 Refunds & Chargebacks</h1><p>Handle payment disputes with state machines</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Initiate Refund</h2>
          <div className="form-group">
            <input type="text" placeholder="Charge ID" value={formData.chargeId} onChange={(e) => setFormData({ ...formData, chargeId: e.target.value })} />
            <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            <input type="text" placeholder="Reason" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} />
            <button onClick={handleInitiateRefund}>Refund</button>
          </div>
        </section>
        <section className="section">
          <h2>Refunds</h2>
          <table className="data-table">
            <thead><tr><th>Refund ID</th><th>Amount</th><th>State</th></tr></thead>
            <tbody>
              {refunds.map((r) => (<tr key={r.refundId}><td>{r.refundId}</td><td>${r.amount}</td><td>{r.state}</td></tr>))}
            </tbody>
          </table>
        </section>
        <section className="section">
          <h2>Record Chargeback</h2>
          <button onClick={handleRecordChargeback}>Record Chargeback</button>
        </section>
        <section className="section">
          <h2>Chargebacks</h2>
          <table className="data-table">
            <thead><tr><th>Chargeback ID</th><th>Amount</th><th>State</th></tr></thead>
            <tbody>
              {chargebacks.map((c) => (<tr key={c.chargebackId}><td>{c.chargebackId}</td><td>${c.amount}</td><td>{c.state}</td></tr>))}
            </tbody>
          </table>
        </section>
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
