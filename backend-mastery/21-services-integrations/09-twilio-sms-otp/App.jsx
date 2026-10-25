import React, { useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:6309';

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [response, setResponse] = useState(null);

  const callAPI = async (path, body) => {
    const res = await fetch(`${API_BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setResponse(await res.json());
  };

  return (
    <div className="app">
      <header className="header"><h1>📱 Twilio SMS & OTP</h1></header>
      <div className="container">
        <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1234567890" />
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
        <button onClick={() => callAPI('/sms/send', { phoneNumber, message })}>Send SMS</button>
        <hr />
        <button onClick={() => callAPI('/otp/send', { phoneNumber, length: 6 })}>Send OTP</button>
        <input type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="OTP Code" />
        <button onClick={() => callAPI('/otp/verify', { phoneNumber, code: otpCode })}>Verify OTP</button>
      </div>
      {response && <div className="response-panel"><pre>{JSON.stringify(response, null, 2)}</pre></div>}
    </div>
  );
}

export default App;
