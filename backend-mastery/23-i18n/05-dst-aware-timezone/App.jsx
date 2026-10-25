import React, { useState, useEffect } from 'react';

export default function DSTApp() {
  const [timezones, setTimezones] = useState([]);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [selectedDate, setSelectedDate] = useState('2024-03-10');
  const [dstInfo, setDstInfo] = useState(null);
  const [dstBoundaries, setDstBoundaries] = useState(null);
  const [ambiguousTimes, setAmbiguousTimes] = useState(null);
  const [missingTimes, setMissingTimes] = useState(null);
  const [taskName, setTaskName] = useState('Scheduled Job');
  const [taskTime, setTaskTime] = useState('2024-03-10T02:30:00');
  const [scheduleResult, setScheduleResult] = useState(null);
  const [hoursToAdd, setHoursToAdd] = useState(2);
  const [addHoursResult, setAddHoursResult] = useState(null);

  // Load timezones
  useEffect(() => {
    fetch('http://localhost:5405/api/timezones')
      .then(res => res.json())
      .then(data => setTimezones(data.timezones))
      .catch(err => console.error('Failed to fetch timezones:', err));
  }, []);

  const handleGetDSTInfo = async () => {
    try {
      const res = await fetch(`http://localhost:5405/api/dst-info/${selectedDate}/${selectedTimezone}`);
      const data = await res.json();
      setDstInfo(data);
    } catch (err) {
      setDstInfo({ error: err.message });
    }
  };

  const handleGetBoundaries = async () => {
    try {
      const year = selectedDate.split('-')[0];
      const res = await fetch(`http://localhost:5405/api/dst-boundaries/${year}/${selectedTimezone}`);
      const data = await res.json();
      setDstBoundaries(data);
    } catch (err) {
      setDstBoundaries({ error: err.message });
    }
  };

  const handleGetAmbiguousTimes = async () => {
    try {
      res = await fetch(`http://localhost:5405/api/ambiguous-times/${selectedDate}/${selectedTimezone}`);
      const data = await res.json();
      setAmbiguousTimes(data);
    } catch (err) {
      setAmbiguousTimes({ error: err.message });
    }
  };

  const handleGetMissingTimes = async () => {
    try {
      const res = await fetch(`http://localhost:5405/api/missing-times/${selectedDate}/${selectedTimezone}`);
      const data = await res.json();
      setMissingTimes(data);
    } catch (err) {
      setMissingTimes({ error: err.message });
    }
  };

  const handleScheduleTask = async () => {
    try {
      const res = await fetch('http://localhost:5405/api/schedule-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskName, scheduledTime: taskTime, timezone: selectedTimezone })
      });
      const data = await res.json();
      setScheduleResult(data);
    } catch (err) {
      setScheduleResult({ error: err.message });
    }
  };

  const handleAddHours = async () => {
    try {
      const res = await fetch('http://localhost:5405/api/add-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: selectedDate + 'T12:00:00Z', hoursToAdd, timezone: selectedTimezone })
      });
      const data = await res.json();
      setAddHoursResult(data);
    } catch (err) {
      setAddHoursResult({ error: err.message });
    }
  };

  return (
    <div style={styles.container}>
      <h1>⏰ Module 23.5: DST-Aware Timezone Management</h1>
      <p style={styles.subtitle}>Master Daylight Saving Time edge cases and schedule reliably across timezones</p>

      {/* Section 1: DST Basics */}
      <div style={styles.section}>
        <h2>1. What is DST? (Daylight Saving Time)</h2>
        <p>
          Twice a year, clocks shift 1 hour to use daylight more efficiently. But this creates two catastrophic bugs:
        </p>
        <ul style={styles.list}>
          <li><strong>Spring Forward (March 10):</strong> 1:59:59 AM → 3:00:00 AM. Hour 2:00-2:59 AM DOESN'T EXIST.</li>
          <li><strong>Fall Back (November 3):</strong> 1:59:59 AM → 1:00:00 AM. Hour 1:00-1:59 AM HAPPENS TWICE.</li>
        </ul>
      </div>

      {/* Section 2: DST Info */}
      <div style={styles.section}>
        <h2>2. DST Status for a Date</h2>
        <p>Check if a specific date is near a DST boundary</p>

        <div style={styles.form}>
          <div style={styles.row}>
            <label>Date:</label>
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>Timezone:</label>
            <select 
              value={selectedTimezone} 
              onChange={e => setSelectedTimezone(e.target.value)}
              style={styles.select}
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <button onClick={handleGetDSTInfo} style={styles.button}>Check DST Status</button>
        </div>

        {dstInfo && (
          <div style={styles.result}>
            {dstInfo.error ? (
              <p style={styles.error}>❌ {dstInfo.error}</p>
            ) : (
              <div>
                <p><strong>Date:</strong> {dstInfo.date}</p>
                <p><strong>Timezone:</strong> {dstInfo.timezone}</p>
                <p><strong>DST Transition Day?</strong> {dstInfo.isDSTTransition ? '⚠️ YES' : '✅ No'}</p>
                <p><strong>Current Offset:</strong> UTC {(dstInfo.offset / -60).toFixed(0)} hours</p>
                {dstInfo.isDSTTransition && (
                  <p style={{color: '#d32f2f', fontWeight: 'bold'}}>
                    ⚠️ CAREFUL! This is a DST transition day—times are ambiguous or missing!
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: DST Boundaries */}
      <div style={styles.section}>
        <h2>3. Annual DST Boundaries</h2>
        <p>When does DST start and end for the year?</p>

        <div style={styles.form}>
          <button onClick={handleGetBoundaries} style={styles.button}>Show Boundaries for {selectedDate.split('-')[0]}</button>
        </div>

        {dstBoundaries && (
          <div style={styles.result}>
            {dstBoundaries.error ? (
              <p style={styles.error}>❌ {dstBoundaries.error}</p>
            ) : (
              <div>
                <p><strong>Year:</strong> {dstBoundaries.year}</p>
                <p><strong>Timezone:</strong> {dstBoundaries.timezone}</p>
                
                <div style={{marginTop: '12px', padding: '12px', backgroundColor: '#fff3e0', borderRadius: '4px'}}>
                  <p><strong>Spring Forward (missing hour):</strong></p>
                  <p>Date: {dstBoundaries.springForward.date}</p>
                  <p>Time: {dstBoundaries.springForward.time}</p>
                  <p style={{color: '#d32f2f'}}>❌ {dstBoundaries.springForward.description}</p>
                </div>

                <div style={{marginTop: '12px', padding: '12px', backgroundColor: '#f3e5f5', borderRadius: '4px'}}>
                  <p><strong>Fall Back (ambiguous hour):</strong></p>
                  <p>Date: {dstBoundaries.fallBack.date}</p>
                  <p>Time: {dstBoundaries.fallBack.time}</p>
                  <p style={{color: '#f57c00'}}>⚠️ {dstBoundaries.fallBack.description}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Ambiguous Times */}
      <div style={styles.section}>
        <h2>4. Ambiguous Times (Fall Back)</h2>
        <p>During fall back, some times happen TWICE. Which occurrence did you mean?</p>

        <div style={styles.form}>
          <button onClick={handleGetAmbiguousTimes} style={styles.button}>Show Ambiguous Times</button>
        </div>

        {ambiguousTimes && (
          <div style={styles.result}>
            {ambiguousTimes.error ? (
              <p style={styles.error}>❌ {ambiguousTimes.error}</p>
            ) : (
              <div>
                <p><strong>Date:</strong> {ambiguousTimes.date}</p>
                <p><strong>Timezone:</strong> {ambiguousTimes.timezone}</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Local Time</th>
                      <th>UTC</th>
                      <th>Occurrence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ambiguousTimes.times && ambiguousTimes.times.map((t, i) => (
                      <tr key={i}>
                        <td>{t.local}</td>
                        <td><code style={{fontSize: '11px'}}>{t.utc}</code></td>
                        <td>#{t.index}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{color: '#d32f2f', fontSize: '12px', marginTop: '8px'}}>
                  Note: All times have SAME local time but DIFFERENT UTC times. Your system must track which one!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Missing Times */}
      <div style={styles.section}>
        <h2>5. Missing Times (Spring Forward)</h2>
        <p>During spring forward, some times DON'T EXIST. Scheduling a 2:30 AM meeting? Too bad!</p>

        <div style={styles.form}>
          <button onClick={handleGetMissingTimes} style={styles.button}>Show Missing Times</button>
        </div>

        {missingTimes && (
          <div style={styles.result}>
            {missingTimes.error ? (
              <p style={styles.error}>❌ {missingTimes.error}</p>
            ) : (
              <div>
                <p><strong>Date:</strong> {missingTimes.date}</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Local Time (nonexistent)</th>
                      <th>Timezone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missingTimes.times && missingTimes.times.map((t, i) => (
                      <tr key={i} style={{backgroundColor: '#ffebee'}}>
                        <td>{t.local}</td>
                        <td>{missingTimes.timezone}</td>
                        <td style={{color: '#d32f2f', fontWeight: 'bold'}}>❌ {t.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 6: Schedule Task */}
      <div style={styles.section}>
        <h2>6. Schedule a Task with DST Awareness</h2>
        <p>Check if your scheduled task is near a DST boundary</p>

        <div style={styles.form}>
          <div style={styles.row}>
            <label>Task Name:</label>
            <input 
              type="text" 
              value={taskName} 
              onChange={e => setTaskName(e.target.value)}
              placeholder="Database backup, report generation, etc."
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>Scheduled Time:</label>
            <input 
              type="datetime-local" 
              value={taskTime} 
              onChange={e => setTaskTime(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleScheduleTask} style={styles.button}>Check Schedule Safety</button>
        </div>

        {scheduleResult && (
          <div style={styles.result}>
            {scheduleResult.error ? (
              <p style={styles.error}>❌ {scheduleResult.error}</p>
            ) : (
              <div>
                <p><strong>Task:</strong> {scheduleResult.taskName}</p>
                <p><strong>Time:</strong> {new Date(scheduleResult.scheduledTime).toLocaleString()}</p>
                <p><strong>Timezone:</strong> {scheduleResult.timezone}</p>
                
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: scheduleResult.isDSTBoundary ? '#ffebee' : '#e8f5e9',
                  borderRadius: '4px'
                }}>
                  <p style={{fontSize: '16px', fontWeight: 'bold'}}>
                    {scheduleResult.warning}
                  </p>
                  <p style={{fontSize: '12px', color: '#666'}}>
                    {scheduleResult.recommendation}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 7: Add Hours */}
      <div style={styles.section}>
        <h2>7. Add Hours Across DST Boundary</h2>
        <p>Adding hours during DST can change the wall-clock time differently</p>

        <div style={styles.form}>
          <div style={styles.row}>
            <label>Hours to Add:</label>
            <input 
              type="number" 
              min="1" 
              max="24" 
              value={hoursToAdd} 
              onChange={e => setHoursToAdd(parseInt(e.target.value))}
              style={styles.input}
            />
          </div>

          <button onClick={handleAddHours} style={styles.button}>Calculate Time Addition</button>
        </div>

        {addHoursResult && (
          <div style={styles.result}>
            {addHoursResult.error ? (
              <p style={styles.error}>❌ {addHoursResult.error}</p>
            ) : (
              <div>
                <p><strong>Start Time (UTC):</strong> {addHoursResult.startTime}</p>
                <p><strong>Add:</strong> {addHoursResult.hoursAdded} hours</p>
                <p><strong>End Time (UTC):</strong> {addHoursResult.result.after}</p>
                {addHoursResult.result.crossedDST && (
                  <p style={{color: '#d32f2f', fontWeight: 'bold'}}>
                    ⚠️ This calculation crossed a DST boundary! Wall-clock time difference may not match elapsed hours.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Learnings */}
      <div style={{...styles.section, backgroundColor: '#f0f0f0'}}>
        <h2>🎯 Critical DST Takeaways</h2>
        <ul style={styles.list}>
          <li><strong>Always use UTC internally</strong> - Never rely on local time for storage or comparison</li>
          <li><strong>Ambiguous hour problem:</strong> 1:30 AM happens twice during fall back—track which one!</li>
          <li><strong>Missing hour problem:</strong> 2:30 AM doesn't exist during spring forward—can't schedule it!</li>
          <li><strong>Never add hours to local time</strong> - Add to UTC, then convert to local</li>
          <li><strong>Use Intl APIs</strong> - JavaScript's Date object doesn't know about DST</li>
          <li><strong>Test near DST dates:</strong> March 10 (spring forward) and November 3 (fall back)</li>
          <li><strong>Store timezone context</strong> - Remember which timezone a time belongs to</li>
          <li><strong>Don't calculate DST yourself</strong> - Use date-fns-tz, day.js-tz, or similar libraries</li>
        </ul>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#fafafa'
  },
  subtitle: {
    color: '#666',
    fontSize: '16px',
    marginBottom: '30px'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px'
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  label: {
    minWidth: '140px',
    fontWeight: '500'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    flex: 1,
    cursor: 'pointer'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#d32f2f',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginTop: '8px'
  },
  result: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    borderLeft: '4px solid #d32f2f'
  },
  error: {
    color: '#d32f2f',
    margin: 0
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '12px'
  },
  list: {
    lineHeight: '1.8',
    color: '#333'
  }
};

