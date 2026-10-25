import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6301/api';

function App() {
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [model, setModel] = useState('gpt-3.5-turbo');
  const [temperature, setTemperature] = useState(0.7);

  // ==================== Chat Session ====================

  const startSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/chat/start`, { method: 'POST' });
      const data = await res.json();
      setSessionId(data.sessionId);
      setHistory([]);
      setResponse('✅ Session started: ' + data.sessionId);
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!sessionId) {
      setResponse('❌ Start a session first');
      return;
    }
    if (!message.trim()) {
      setResponse('❌ Message cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/chat/${sessionId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, temperature }),
      });
      const data = await res.json();

      if (data.error) {
        setResponse('❌ Error: ' + data.error);
      } else {
        setHistory([
          ...history,
          { role: 'user', content: message },
          { role: 'assistant', content: data.message },
        ]);
        setResponse(data.message);
        setMessage('');
      }
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/chat/${sessionId}`, { method: 'DELETE' });
      const data = await res.json();
      setSessionId('');
      setHistory([]);
      setResponse('✅ Session ended');
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Completion ====================

  const getCompletion = async () => {
    if (!message.trim()) {
      setResponse('❌ Message cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, model, temperature }),
      });
      const data = await res.json();

      if (data.error) {
        setResponse('❌ Error: ' + data.error);
      } else {
        setResponse(data.completion);
      }
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Image Generation ====================

  const generateImage = async () => {
    if (!message.trim()) {
      setResponse('❌ Message cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message }),
      });
      const data = await res.json();

      if (data.error) {
        setResponse('❌ Error: ' + data.error);
      } else {
        setResponse(
          <div className="image-results">
            {data.images.map((img, i) => (
              <div key={i} className="image-item">
                <img src={img.url} alt={'Generated ' + i} />
                <p className="revised-prompt">Prompt: {img.revisedPrompt}</p>
              </div>
            ))}
          </div>
        );
      }
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== Get History ====================

  const getHistory = async () => {
    if (!sessionId) {
      setResponse('❌ Start a session first');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/chat/${sessionId}/history`);
      const data = await res.json();
      setResponse(
        <div className="history">
          <p><strong>Total Messages: {data.messages.length}</strong></p>
          {data.messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <strong>{msg.role}:</strong> {msg.content}
            </div>
          ))}
        </div>
      );
    } catch (error) {
      setResponse('❌ Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>🤖 OpenAI LLM Integration</h1>

      <div className="section">
        <h2>Chat Configuration</h2>
        <label>
          Model:
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            <option>gpt-3.5-turbo</option>
            <option>gpt-4</option>
            <option>gpt-4-turbo</option>
          </select>
        </label>
        <label>
          Temperature: {temperature}
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
        </label>
      </div>

      <div className="section">
        <h2>Session Management</h2>
        <div className="session-info">
          <p>Session ID: {sessionId || 'None'}</p>
        </div>
        <button onClick={startSession} disabled={loading}>
          Start Session
        </button>
        <button onClick={endSession} disabled={!sessionId || loading}>
          End Session
        </button>
      </div>

      <div className="section">
        <h2>Chat Message</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message..."
          rows="4"
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={!sessionId || loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      <div className="section">
        <h2>Other Services</h2>
        <button onClick={getCompletion} disabled={loading}>
          Get Completion
        </button>
        <button onClick={generateImage} disabled={loading}>
          Generate Image
        </button>
        <button onClick={getHistory} disabled={!sessionId || loading}>
          View History
        </button>
      </div>

      <div className="section">
        <h2>Response</h2>
        <div className="response">
          {typeof response === 'string' ? (
            <p>{response}</p>
          ) : (
            response
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
