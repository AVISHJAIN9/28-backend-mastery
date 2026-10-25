import React, { useState, useRef } from 'react';
import './App.css';

export default function App() {
  // Transaction state
  const [transactionId, setTransactionId] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionResponse, setTransactionResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Batch payment state
  const [jobId, setJobId] = useState('');
  const [paymentCount, setPaymentCount] = useState(5);
  const [batchResponse, setBatchResponse] = useState(null);

  // Resource allocation state
  const [resourceName, setResourceName] = useState('inventory');
  const [resourceQuantity, setResourceQuantity] = useState(100);
  const [resourceDuration, setResourceDuration] = useState(3000);
  const [resourceResponse, setResourceResponse] = useState(null);

  // Active tabs and logs
  const [activeTab, setActiveTab] = useState('transaction');
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);

  const API_BASE = 'http://localhost:4003/api';

  // ==================== UTILITIES ==================== //

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const clearLogs = () => setLogs([]);

  // ==================== TRANSACTION TESTS ==================== //

  const testVulnerableTransaction = async () => {
    setLoading(true);
    try {
      addLog(`🟡 Testing VULNERABLE /vulnerable/process-transaction with ID: ${transactionId}`, 'warning');
      
      const response = await fetch(`${API_BASE}/vulnerable/process-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          amount: parseFloat(transactionAmount),
          description: 'Race condition test'
        })
      });

      const data = await response.json();
      setTransactionResponse(data);

      if (response.ok) {
        addLog(`⚠️  VULNERABLE: Transaction processed without lock (race condition possible)`, 'warning');
      } else {
        addLog(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const testSecureTransaction = async () => {
    setLoading(true);
    try {
      addLog(`🟢 Testing SECURE /secure/process-transaction with ID: ${transactionId}`, 'success');
      
      const response = await fetch(`${API_BASE}/secure/process-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          amount: parseFloat(transactionAmount),
          description: 'Locked transaction',
          lock_ttl: 5000
        })
      });

      const data = await response.json();
      setTransactionResponse(data);

      if (response.ok) {
        addLog(`✅ Transaction locked with SETNX and processed safely`, 'success');
      } else if (response.status === 409) {
        addLog(`🔒 Lock conflict: Transaction already processing (409 Conflict)`, 'warning');
      } else {
        addLog(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const simulateConcurrentTransactions = async () => {
    setLoading(true);
    try {
      const testId = `TX-${Date.now()}`;
      addLog(`🚀 Simulating 5 concurrent requests to same transaction ID: ${testId}`, 'info');

      const promises = Array(5).fill(null).map((_, i) =>
        fetch(`${API_BASE}/secure/process-transaction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transaction_id: testId,
            amount: 100 + i,
            description: `Concurrent request ${i + 1}`,
            lock_ttl: 5000
          })
        }).then(r => r.json())
      );

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const conflicts = results.filter(r => !r.success).length;

      addLog(`📊 Results: ${successful} succeeded, ${conflicts} got lock conflicts (409)`, 'success');
      setTransactionResponse({
        success: true,
        concurrent_test: true,
        total_requests: 5,
        successful,
        conflicts,
        message: 'Only 1 succeeded, others blocked by lock'
      });
    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  const getTransactionStatus = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const data = await response.json();

      if (endpoint.includes('secure')) {
        addLog(`🔒 Active locks: ${data.active_lock_count}`, 'info');
      }
      addLog(`📊 Total transactions: ${data.total_transactions}`, 'info');
      
      return data;
    } catch (error) {
      addLog(`❌ Failed to fetch status: ${error.message}`, 'error');
    }
  };

  // ==================== BATCH PAYMENT TESTS ==================== //

  const testBatchPaymentRedlock = async () => {
    setLoading(true);
    try {
      addLog(`🔐 Testing REDLOCK /advanced/batch-payment (multi-instance safety)`, 'success');

      const payments = Array(parseInt(paymentCount)).fill(null).map((_, i) => ({
        payee_id: `USER-${i + 1}`,
        amount: 100 + i,
        description: `Payment ${i + 1}`
      }));

      const response = await fetch(`${API_BASE}/advanced/batch-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          payments,
          lock_ttl: 15000
        })
      });

      const data = await response.json();
      setBatchResponse(data);

      if (response.ok) {
        addLog(`✅ Batch payment locked with Redlock - processed safely across instances`, 'success');
        addLog(`💰 Processed ${data.batch.processed} payments`, 'success');
      } else if (response.status === 409) {
        addLog(`🔐 Redlock conflict: Another instance already processing this batch`, 'warning');
      } else {
        addLog(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  // ==================== RESOURCE ALLOCATION TESTS ==================== //

  const testResourceAllocation = async () => {
    setLoading(true);
    try {
      addLog(`🏭 Testing resource allocation with lock extension...`, 'info');

      const response = await fetch(`${API_BASE}/advanced/allocate-resource`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_name: resourceName,
          quantity: parseInt(resourceQuantity),
          duration_ms: parseInt(resourceDuration)
        })
      });

      const data = await response.json();
      setResourceResponse(data);

      if (response.ok) {
        addLog(`✅ Resource locked and allocated: ${data.allocated} units`, 'success');
        addLog(`📦 Remaining inventory: ${data.remaining}`, 'info');
      } else if (response.status === 409) {
        addLog(`🔒 Resource already locked by another process`, 'warning');
      } else {
        addLog(`❌ Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Request failed: ${error.message}`, 'error');
    }
    setLoading(false);
  };

  // ==================== UTILITY FUNCTIONS ==================== //

  const clearAllData = async () => {
    try {
      await fetch(`${API_BASE}/clear`, { method: 'POST' });
      addLog(`🧹 All data cleared`, 'info');
      setTransactionResponse(null);
      setBatchResponse(null);
      setResourceResponse(null);
    } catch (error) {
      addLog(`❌ Clear failed: ${error.message}`, 'error');
    }
  };

  // ==================== RENDER ==================== //

  return (
    <div className="app">
      <header className="header">
        <h1>🔒 Distributed Locks Pattern</h1>
        <p>Redis SETNX & Redlock Implementation | Module 03</p>
      </header>

      <div className="main">
        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'transaction' ? 'active' : ''}`}
            onClick={() => setActiveTab('transaction')}
          >
            💳 Transactions
          </button>
          <button 
            className={`tab ${activeTab === 'batch' ? 'active' : ''}`}
            onClick={() => setActiveTab('batch')}
          >
            💰 Batch Payment
          </button>
          <button 
            className={`tab ${activeTab === 'resource' ? 'active' : ''}`}
            onClick={() => setActiveTab('resource')}
          >
            🏭 Resources
          </button>
          <button 
            className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            📋 Logs
          </button>
        </div>

        {/* Content */}
        <div className="content">
          {/* TRANSACTION TAB */}
          {activeTab === 'transaction' && (
            <div className="tab-content">
              <section className="section">
                <h2>Transaction Processing with Atomic Locks</h2>

                <div className="inputs">
                  <div className="input-group">
                    <label>Transaction ID:</label>
                    <input 
                      type="text" 
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="TX-001"
                    />
                  </div>

                  <div className="input-group">
                    <label>Amount:</label>
                    <input 
                      type="number" 
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      placeholder="500"
                    />
                  </div>
                </div>

                <div className="buttons">
                  <button 
                    className="btn btn-danger"
                    onClick={testVulnerableTransaction}
                    disabled={loading}
                  >
                    ⚠️ Test VULNERABLE (No Lock)
                  </button>

                  <button 
                    className="btn btn-success"
                    onClick={testSecureTransaction}
                    disabled={loading}
                  >
                    ✅ Test SECURE (SETNX Lock)
                  </button>

                  <button 
                    className="btn btn-primary"
                    onClick={simulateConcurrentTransactions}
                    disabled={loading}
                  >
                    🚀 Concurrent Requests (5x)
                  </button>

                  <button 
                    className="btn btn-secondary"
                    onClick={() => getTransactionStatus('/secure/transactions')}
                    disabled={loading}
                  >
                    🔍 Get Status
                  </button>
                </div>

                {transactionResponse && (
                  <div className={`response ${transactionResponse.success ? 'success' : 'error'}`}>
                    <pre>{JSON.stringify(transactionResponse, null, 2)}</pre>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* BATCH PAYMENT TAB */}
          {activeTab === 'batch' && (
            <div className="tab-content">
              <section className="section">
                <h2>Batch Payment with Redlock (Multi-Instance)</h2>

                <div className="inputs">
                  <div className="input-group">
                    <label>Job ID:</label>
                    <input 
                      type="text" 
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      placeholder="BATCH-001"
                    />
                  </div>

                  <div className="input-group">
                    <label>Number of Payments:</label>
                    <input 
                      type="number" 
                      value={paymentCount}
                      onChange={(e) => setPaymentCount(e.target.value)}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>

                <div className="buttons">
                  <button 
                    className="btn btn-success"
                    onClick={testBatchPaymentRedlock}
                    disabled={loading}
                  >
                    🔐 Process Batch with Redlock
                  </button>

                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const promises = Array(3).fill(null).map(() => testBatchPaymentRedlock());
                      addLog('Simulating 3 concurrent batch payment requests', 'info');
                    }}
                    disabled={loading}
                  >
                    🚀 Simulate Concurrent Batches
                  </button>
                </div>

                {batchResponse && (
                  <div className={`response ${batchResponse.success ? 'success' : 'error'}`}>
                    <pre>{JSON.stringify(batchResponse, null, 2)}</pre>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* RESOURCE TAB */}
          {activeTab === 'resource' && (
            <div className="tab-content">
              <section className="section">
                <h2>Resource Allocation with Lock Extension</h2>

                <div className="inputs">
                  <div className="input-group">
                    <label>Resource Name:</label>
                    <input 
                      type="text" 
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      placeholder="inventory"
                    />
                  </div>

                  <div className="input-group">
                    <label>Quantity to Allocate:</label>
                    <input 
                      type="number" 
                      value={resourceQuantity}
                      onChange={(e) => setResourceQuantity(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="input-group">
                    <label>Operation Duration (ms):</label>
                    <input 
                      type="number" 
                      value={resourceDuration}
                      onChange={(e) => setResourceDuration(e.target.value)}
                      min="1000"
                      step="1000"
                    />
                  </div>
                </div>

                <div className="buttons">
                  <button 
                    className="btn btn-success"
                    onClick={testResourceAllocation}
                    disabled={loading}
                  >
                    🏭 Allocate Resource
                  </button>
                </div>

                {resourceResponse && (
                  <div className={`response ${resourceResponse.success ? 'success' : 'error'}`}>
                    <pre>{JSON.stringify(resourceResponse, null, 2)}</pre>
                  </div>
                )}

                <div className="info-box">
                  <h3>💡 How Lock Extension Works:</h3>
                  <p>The server continuously extends the lock TTL while the operation runs.</p>
                  <p>This prevents premature expiry on long-running operations.</p>
                </div>
              </section>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="tab-content">
              <section className="section">
                <div className="logs-header">
                  <h2>📋 Operation Logs</h2>
                  <button className="btn btn-secondary" onClick={clearLogs}>Clear</button>
                </div>

                <div className="logs-container" ref={logsRef}>
                  {logs.length === 0 ? (
                    <p className="no-logs">No logs yet. Start a test to see output.</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className={`log-entry ${log.type}`}>
                        <span className="timestamp">{log.timestamp}</span>
                        <span className="message">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Utility Buttons */}
        <div className="utilities">
          <button className="btn btn-secondary" onClick={clearAllData}>
            🧹 Clear All Data
          </button>
          <a href="http://localhost:4003/health" target="_blank" rel="noopener noreferrer" className="btn btn-info">
            🏥 Server Health
          </a>
        </div>

        {/* Info Box */}
        <div className="info-container">
          <div className="info-box">
            <h3>🔒 SETNX Atomic Locks (Single Instance)</h3>
            <p>Uses Redis SET with NX flag for atomic lock acquisition. Perfect for single-server deployments.</p>
          </div>

          <div className="info-box">
            <h3>🔐 Redlock Algorithm (Multi-Instance)</h3>
            <p>Distributed lock coordination across multiple Redis instances. Fault-tolerant and safe for distributed systems.</p>
          </div>

          <div className="info-box">
            <h3>⚠️ Race Conditions Without Locks</h3>
            <p>Multiple concurrent requests can process the same transaction multiple times, leading to data corruption or duplicates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

