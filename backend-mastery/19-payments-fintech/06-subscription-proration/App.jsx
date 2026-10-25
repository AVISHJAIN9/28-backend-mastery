import React, { useState } from 'react';
import './App.css';
function App() {
  const [formData, setFormData] = useState({ planId: 'starter', customerId: '' });
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [response, setResponse] = useState(null);
  const API_URL = 'http://localhost:6106/api';

  const handleCreateSubscription = async () => {
    try {
      const res = await fetch(`${API_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setResponse(data);
      setSubscriptions([...subscriptions, data]);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const handleCalculateProration = async () => {
    if (!selectedSub) return;
    const newPlan = selectedSub.planId === 'starter' ? 'professional' : 'enterprise';
    try {
      const res = await fetch(`${API_URL}/subscriptions/${selectedSub.subscriptionId}/calculate-proration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanId: newPlan })
      });
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  return (
    <div className="app-container">
      <header className="header"><h1>📅 Subscription Proration</h1><p>Fair billing when plans change</p></header>
      <div className="main-content">
        <section className="section">
          <h2>Create Subscription</h2>
          <div className="form-group">
            <select value={formData.planId} onChange={(e) => setFormData({ ...formData, planId: e.target.value })}>
              <option value="starter">Starter - $99</option>
              <option value="professional">Professional - $199</option>
              <option value="enterprise">Enterprise - $499</option>
            </select>
            <input type="text" placeholder="Customer ID" value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })} />
            <button onClick={handleCreateSubscription}>Create</button>
          </div>
        </section>
        <section className="section">
          <h2>Active Subscriptions</h2>
          <table className="data-table">
            <thead><tr><th>Sub ID</th><th>Plan</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {subscriptions.map((s) => (<tr key={s.subscriptionId}><td>{s.subscriptionId}</td><td>{s.planId}</td><td>{s.status}</td><td><button onClick={() => setSelectedSub(s)}>Calculate Prorat</button></td></tr>))}
            </tbody>
          </table>
        </section>
        {selectedSub && <section className="section"><h2>Upgrade Plan</h2><button onClick={handleCalculateProration}>Calculate Proration</button></section>}
        {response && <section className="section response-section"><h2>Response</h2><pre>{JSON.stringify(response, null, 2)}</pre></section>}
      </div>
    </div>
  );
}
export default App;
