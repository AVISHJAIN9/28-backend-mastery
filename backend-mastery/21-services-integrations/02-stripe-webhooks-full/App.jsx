import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6302/api';

function App() {
  const [amount, setAmount] = useState(50);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState([]);

  // ==================== Payment Intent ====================

  const createPaymentIntent = async () => {
    if (!amount || !paymentMethod) {
      setResponse('❌ Fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/payments/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod }),
      });
      const data = await res.json();
      if (data.error) {
        setResponse('❌ Error: ' + data.error);
      } else {
        setResponse(`✅ Payment ID: ${data.paymentIntentId} (${data.status})`);
      }
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Customer ====================

  const createCustomer = async () => {
    if (!email) {
      setResponse('❌ Email required');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: email.split('@')[0] }),
      });
      const data = await res.json();
      if (data.error) {
        setResponse('❌ Error: ' + data.error);
      } else {
        setCustomerId(data.customerId);
        setResponse(`✅ Customer Created: ${data.customerId}`);
      }
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Webhooks ====================

  const getWebhookEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/webhook/events`);
      const data = await res.json();
      setWebhookEvents(data.events);
      setResponse(`📊 ${data.totalEvents} webhook events received`);
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>💳 Stripe Webhooks Integration</h1>

      <div className="section">
        <h2>Payment Intent</h2>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
          placeholder="Amount (USD)"
          disabled={loading}
        />
        <input
          type="text"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="Payment Method ID"
          disabled={loading}
        />
        <button onClick={createPaymentIntent} disabled={loading}>
          {loading ? 'Creating...' : 'Create Payment'}
        </button>
      </div>

      <div className="section">
        <h2>Customer</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          disabled={loading}
        />
        <button onClick={createCustomer} disabled={loading}>
          {loading ? 'Creating...' : 'Create Customer'}
        </button>
        {customerId && <p>Customer ID: {customerId}</p>}
      </div>

      <div className="section">
        <h2>Webhook Events</h2>
        <button onClick={getWebhookEvents} disabled={loading}>
          Get Events
        </button>
        {webhookEvents.length > 0 && (
          <div className="events">
            {webhookEvents.map((evt, i) => (
              <div key={i} className="event">
                <strong>{evt.type}</strong>
                <small>{new Date(evt.timestamp).toLocaleString()}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section">
        <h2>Response</h2>
        <div className="response">{response}</div>
      </div>
    </div>
  );
}

export default App;
