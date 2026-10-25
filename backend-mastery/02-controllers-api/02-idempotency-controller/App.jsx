// ═════════════════════════════════════════════════════════════
// IDEMPOTENCY CONTROLLER - REACT COMPONENT
// Frontend for managing idempotent transactions and orders
// ═════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const IdempotencyController = () => {
  const [activeTab, setActiveTab] = useState('transaction');
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    amount: '',
    recipientId: '',
    description: '',
  });

  // Order form state
  const [orderForm, setOrderForm] = useState({
    items: [{ productId: '', productName: '', price: '', quantity: '' }],
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    paymentMethod: 'credit_card',
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Create transaction
  const handleCreateTransaction = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const idempotencyKey = uuidv4();
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(transactionForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      const data = await response.json();
      setTransactions([data.data, ...transactions]);
      setTransactionForm({ amount: '', recipientId: '', description: '' });
      showMessage('success', 'Transaction created successfully!');
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }, [transactionForm, transactions]);

  // Create order
  const handleCreateOrder = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const idempotencyKey = uuidv4();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(orderForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();
      setOrders([data.data, ...orders]);
      setOrderForm({
        items: [{ productId: '', productName: '', price: '', quantity: '' }],
        shippingAddress: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        },
        paymentMethod: 'credit_card',
      });
      showMessage('success', 'Order created successfully!');
    } catch (error) {
      showMessage('error', error.message);
    } finally {
      setLoading(false);
    }
  }, [orderForm, orders]);

  const updateTransactionField = (field, value) => {
    setTransactionForm(prev => ({ ...prev, [field]: value }));
  };

  const updateOrderField = (field, value) => {
    setOrderForm(prev => ({ ...prev, [field]: value }));
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setOrderForm(prev => ({ ...prev, items: newItems }));
  };

  const updateShippingAddress = (field, value) => {
    setOrderForm(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
  };

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', productName: '', price: '', quantity: '' }],
    }));
  };

  return (
    <div className="idempotency-controller" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>🔒 Idempotency Controller</h1>
      <p>Prevent duplicate requests with idempotency keys</p>

      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            margin: '12px 0',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setActiveTab('transaction')}
          style={{
            padding: '10px 16px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'transaction' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'transaction' ? 'white' : '#000',
            borderRadius: '4px 4px 0 0',
          }}
        >
          💱 Transactions
        </button>
        <button
          onClick={() => setActiveTab('order')}
          style={{
            padding: '10px 16px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: activeTab === 'order' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'order' ? 'white' : '#000',
            borderRadius: '4px 4px 0 0',
          }}
        >
          📦 Orders
        </button>
      </div>

      {activeTab === 'transaction' && (
        <div style={{ marginBottom: '40px' }}>
          <h2>Create Transaction</h2>
          <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="number"
              step="0.01"
              placeholder="Amount"
              value={transactionForm.amount}
              onChange={(e) => updateTransactionField('amount', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Recipient ID"
              value={transactionForm.recipientId}
              onChange={(e) => updateTransactionField('recipientId', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <input
              type="text"
              placeholder="Description"
              value={transactionForm.description}
              onChange={(e) => updateTransactionField('description', e.target.value)}
              required
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Create Transaction'}
            </button>
          </form>

          <h3 style={{ marginTop: '30px' }}>Recent Transactions</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {transactions.map((tx, idx) => (
              <div key={idx} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <p><strong>From:</strong> {tx.from}</p>
                <p><strong>To:</strong> {tx.to}</p>
                <p><strong>Amount:</strong> ${tx.amount}</p>
                <p><strong>Description:</strong> {tx.description}</p>
                <p><strong>Status:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{tx.status}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'order' && (
        <div style={{ marginBottom: '40px' }}>
          <h2>Create Order</h2>
          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h3>Items</h3>
              {orderForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    placeholder="Product ID"
                    value={item.productId}
                    onChange={(e) => updateOrderItem(idx, 'productId', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={item.productName}
                    onChange={(e) => updateOrderItem(idx, 'productName', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.price}
                    onChange={(e) => updateOrderItem(idx, 'price', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => updateOrderItem(idx, 'quantity', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addOrderItem}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                + Add Item
              </button>
            </div>

            <div>
              <h3>Shipping Address</h3>
              <input
                type="text"
                placeholder="Street"
                value={orderForm.shippingAddress.street}
                onChange={(e) => updateShippingAddress('street', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '8px' }}
              />
              <input
                type="text"
                placeholder="City"
                value={orderForm.shippingAddress.city}
                onChange={(e) => updateShippingAddress('city', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '8px' }}
              />
              <input
                type="text"
                placeholder="State"
                value={orderForm.shippingAddress.state}
                onChange={(e) => updateShippingAddress('state', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '8px' }}
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={orderForm.shippingAddress.postalCode}
                onChange={(e) => updateShippingAddress('postalCode', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginBottom: '8px' }}
              />
              <input
                type="text"
                placeholder="Country"
                value={orderForm.shippingAddress.country}
                onChange={(e) => updateShippingAddress('country', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
              />
            </div>

            <div>
              <label>Payment Method:</label>
              <select
                value={orderForm.paymentMethod}
                onChange={(e) => updateOrderField('paymentMethod', e.target.value)}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%', marginTop: '4px' }}
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Processing...' : 'Create Order'}
            </button>
          </form>

          <h3 style={{ marginTop: '30px' }}>Recent Orders</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {orders.map((order, idx) => (
              <div key={idx} style={{ padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}>
                <p><strong>Order ID:</strong> {order.orderId}</p>
                <p><strong>Items:</strong> {order.items.length}</p>
                <p><strong>Total:</strong> ${order.totalAmount}</p>
                <p><strong>Status:</strong> <span style={{ color: '#28a745', fontWeight: 'bold' }}>{order.status}</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IdempotencyController;

