import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentTime, setCurrentTime] = useState(null);
  const [convertInput, setConvertInput] = useState('2026-03-29T12:00:00Z');
  const [convertResult, setConvertResult] = useState(null);
  const [selectedTz, setSelectedTz] = useState('America/New_York');
  const [tzInfo, setTzInfo] = useState(null);
  const [dstYear, setDstYear] = useState(2026);
  const [dstInfo, setDstInfo] = useState(null);
  const [scheduleHour, setScheduleHour] = useState(9);
  const [scheduleMinute, setScheduleMinute] = useState(0);
  const [scheduleTz, setScheduleTz] = useState('America/New_York');
  const [scheduleResult, setScheduleResult] = useState(null);
  const [error, setError] = useState(null);

  const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney', 'Asia/Kolkata'
  ];

  // Get current time
  useEffect(() => {
    const fetchNow = async () => {
      try {
        const res = await fetch('/api/now');
        const data = await res.json();
        setCurrentTime(data);
      } catch (err) {
        setError('Failed to fetch current time');
      }
    };
    
    fetchNow();
    const interval = setInterval(fetchNow, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleConvert = async () => {
    try {
      const res = await fetch(`/api/convert?iso=${convertInput}`);
      if (!res.ok) throw new Error('Conversion failed');
      const data = await res.json();
      setConvertResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTzLookup = async () => {
    try {
      const res = await fetch(`/api/timezone/${selectedTz}`);
      if (!res.ok) throw new Error('Timezone lookup failed');
      const data = await res.json();
      setTzInfo(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDstInfo = async () => {
    try {
      const res = await fetch(`/api/dst-info?year=${dstYear}&tz=${selectedTz}`);
      if (!res.ok) throw new Error('DST info failed');
      const data = await res.json();
      setDstInfo(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSchedule = async () => {
    try {
      const res = await fetch('/api/schedule-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hour: scheduleHour,
          minute: scheduleMinute,
          timezone: scheduleTz
        })
      });
      if (!res.ok) throw new Error('Scheduling failed');
      const data = await res.json();
      setScheduleResult(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⏰ Module 23.1: Dates, UTC & Timezones</h1>
        <p>Master time handling across timezones and DST transitions</p>
      </header>

      {error && <div className="error-box">{error}</div>}

      {/* Current Time Section */}
      <section className="section">
        <h2>📍 Current Time Everywhere</h2>
        {currentTime && (
          <div className="card">
            <div className="time-display">
              <div className="utc-time">
                <strong>UTC:</strong> {currentTime.iso8601UTC}
              </div>
              <div className="timestamp">
                <strong>Unix Timestamp:</strong> {currentTime.timestamp}
              </div>
            </div>
            <div className="zones-grid">
              {Object.entries(currentTime.zones || {}).map(([tz, data]) => (
                <div key={tz} className="zone-box">
                  <div className="zone-name">{tz}</div>
                  <div className="zone-time">{data.formatted}</div>
                  <div className="zone-offset">Offset: {data.offset > 0 ? '+' : ''}{data.offset}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Convert ISO to Timezones */}
      <section className="section">
        <h2>🔄 Convert ISO 8601 Time</h2>
        <div className="card">
          <div className="form-group">
            <label>ISO 8601 String:</label>
            <input
              type="text"
              value={convertInput}
              onChange={(e) => setConvertInput(e.target.value)}
              placeholder="2026-03-29T12:00:00Z"
            />
            <button onClick={handleConvert}>Convert</button>
          </div>
          {convertResult && (
            <div className="result">
              <p><strong>Input:</strong> {convertResult.input}</p>
              <p><strong>Unix Timestamp:</strong> {convertResult.timestamp}</p>
              <div className="zones-grid">
                {Object.entries(convertResult.zones).map(([tz, data]) => (
                  <div key={tz} className="zone-box">
                    <div className="zone-name">{tz}</div>
                    <div className="zone-time">{data.formatted}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Timezone Specific Information */}
      <section className="section">
        <h2>🌍 Timezone Information</h2>
        <div className="card">
          <div className="form-group">
            <label>Select Timezone:</label>
            <select value={selectedTz} onChange={(e) => setSelectedTz(e.target.value)}>
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button onClick={handleTzLookup}>Get Info</button>
          </div>
          {tzInfo && (
            <div className="result">
              <p><strong>Timezone:</strong> {tzInfo.timezone}</p>
              <p><strong>Current Local Time:</strong> {tzInfo.formatted}</p>
              <p><strong>Unix Timestamp:</strong> {tzInfo.timestamp}</p>
              <p><strong>ISO 8601 UTC:</strong> {tzInfo.iso8601UTC}</p>
              <p><strong>In Daylight Saving Time:</strong> {tzInfo.isDST ? 'Yes ✅' : 'No ❌'}</p>
              <p><strong>Hours Until Midnight:</strong> {tzInfo.hoursUntilMidnight}</p>
            </div>
          )}
        </div>
      </section>

      {/* DST Information */}
      <section className="section">
        <h2>🕐 Daylight Saving Time Info</h2>
        <div className="card">
          <div className="form-group">
            <label>Year:</label>
            <input
              type="number"
              value={dstYear}
              onChange={(e) => setDstYear(parseInt(e.target.value))}
              min="1970"
              max="2100"
            />
            <label>Timezone:</label>
            <select value={selectedTz} onChange={(e) => setSelectedTz(e.target.value)}>
              {timezones.filter(tz => ['America/New_York', 'Europe/London'].includes(tz)).map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button onClick={handleDstInfo}>Get DST Info</button>
          </div>
          {dstInfo && (
            <div className="result">
              <p><strong>Year:</strong> {dstInfo.year}</p>
              <p><strong>Timezone:</strong> {dstInfo.timezone}</p>
              <div className="dst-transitions">
                {dstInfo.transitions.map((t, i) => (
                  <div key={i} className="transition">
                    <h4>{t.type === 'spring-forward' ? '⬆️ Spring Forward' : '⬇️ Fall Back'}</h4>
                    <p><strong>When:</strong> {new Date(t.iso8601UTC).toLocaleString()} UTC</p>
                    <p><strong>Change:</strong> {t.from} → {t.to}</p>
                    <p><strong>Note:</strong> {t.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Schedule Task */}
      <section className="section">
        <h2>📅 Schedule Task in Timezone</h2>
        <div className="card">
          <div className="form-group">
            <label>Hour (0-23):</label>
            <input
              type="number"
              value={scheduleHour}
              onChange={(e) => setScheduleHour(parseInt(e.target.value))}
              min="0"
              max="23"
            />
            <label>Minute (0-59):</label>
            <input
              type="number"
              value={scheduleMinute}
              onChange={(e) => setScheduleMinute(parseInt(e.target.value))}
              min="0"
              max="59"
            />
            <label>Timezone:</label>
            <select value={scheduleTz} onChange={(e) => setScheduleTz(e.target.value)}>
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <button onClick={handleSchedule}>Schedule Task</button>
          </div>
          {scheduleResult && (
            <div className="result">
              <p><strong>Task Time:</strong> {scheduleResult.scheduled.time} {scheduleResult.scheduled.timezone}</p>
              <p><strong>UTC Time:</strong> {scheduleResult.scheduled.iso8601UTC}</p>
              <p><strong>Unix Timestamp:</strong> {scheduleResult.scheduled.unixTimestamp}</p>
              <p><strong>Scheduled In:</strong> {scheduleResult.scheduling.hoursFromNow} hours</p>
            </div>
          )}
        </div>
      </section>

      {/* Key Concepts */}
      <section className="section">
        <h2>💡 Key Concepts</h2>
        <div className="concepts">
          <div className="concept-box">
            <h3>Unix Time</h3>
            <p>Seconds since Jan 1, 1970 UTC. Universal representation of every moment.</p>
          </div>
          <div className="concept-box">
            <h3>UTC = Zone 0</h3>
            <p>All other timezones are offsets from UTC. Store everything in UTC!</p>
          </div>
          <div className="concept-box">
            <h3>DST Matters</h3>
            <p>Daylight Saving Time shifts clocks. Always use libraries to handle this.</p>
          </div>
          <div className="concept-box">
            <h3>User Timezone</h3>
            <p>Store user preference, convert for display. Never assume local browser time.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
