import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'http://localhost:4002/api';

const CRON_PATTERNS = {
  'Every Minute': '* * * * *',
  'Every 5 Minutes': '*/5 * * * *',
  'Every Hour': '0 * * * *',
  'Daily (Midnight)': '0 0 * * *',
  'Every Monday': '0 0 * * 1',
  'Weekdays 9 AM': '0 9 * * 1-5',
  'Monthly': '0 0 1 * *',
  'Weekends': '0 0 * * 0,6'
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [cronPattern, setCronPattern] = useState('* * * * *');
  const [description, setDescription] = useState('');
  const [response, setResponse] = useState(null);
  const [selectedPattern, setSelectedPattern] = useState('Every Minute');

  useEffect(() => {
    loadTasks();
    loadLogs();
    const interval = setInterval(() => {
      loadTasks();
      loadLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs?limit=20`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const createTask = async () => {
    if (!taskName.trim() || !cronPattern.trim()) {
      setResponse({ error: 'Task name and cron expression required' });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskName,
          cronExpression: cronPattern,
          description
        })
      });
      const data = await res.json();
      setResponse(data);
      if (data.success) {
        setTaskName('');
        setDescription('');
        setCronPattern('* * * * *');
        loadTasks();
      }
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const triggerTask = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${name}/trigger`, {
        method: 'POST'
      });
      const data = await res.json();
      setResponse(data);
      loadTasks();
      loadLogs();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const pauseTask = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${name}/pause`, {
        method: 'PUT'
      });
      const data = await res.json();
      setResponse(data);
      loadTasks();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const resumeTask = async (name) => {
    try {
      const res = await fetch(`${API_BASE}/tasks/${name}/resume`, {
        method: 'PUT'
      });
      const data = await res.json();
      setResponse(data);
      loadTasks();
    } catch (error) {
      setResponse({ error: error.message });
    }
  };

  const deleteTask = async (name) => {
    if (window.confirm(`Delete task "${name}"?`)) {
      try {
        const res = await fetch(`${API_BASE}/tasks/${name}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        setResponse(data);
        loadTasks();
      } catch (error) {
        setResponse({ error: error.message });
      }
    }
  };

  return (
    <div className="app">
      <header>
        <h1>⏲️ Cron Jobs Manager</h1>
        <p>Schedule and monitor background tasks</p>
      </header>

      <main>
        <section className="create-section">
          <h2>Create New Task</h2>
          <div className="form">
            <div className="form-group">
              <label>Task Name</label>
              <input
                type="text"
                placeholder="e.g., Database Backup"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Cron Pattern</label>
              <select value={selectedPattern} onChange={(e) => {
                setSelectedPattern(e.target.value);
                setCronPattern(CRON_PATTERNS[e.target.value]);
              }}>
                {Object.entries(CRON_PATTERNS).map(([label, pattern]) => (
                  <option key={pattern} value={label}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="or custom: * * * * *"
                value={cronPattern}
                onChange={(e) => setCronPattern(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                placeholder="Task description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button onClick={createTask} className="btn-primary">Create Task</button>
          </div>
        </section>

        <section className="tasks-section">
          <h2>Scheduled Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p className="empty">No tasks scheduled</p>
          ) : (
            <div className="tasks-list">
              {tasks.map((task) => (
                <div key={task.name} className={`task-card ${task.active ? 'active' : 'inactive'}`}>
                  <div className="task-header">
                    <h3>{task.name}</h3>
                    <span className={`badge ${task.active ? 'active' : 'paused'}`}>
                      {task.active ? '⏳ Active' : '⏸️ Paused'}
                    </span>
                  </div>
                  <div className="task-details">
                    <p><strong>Pattern:</strong> {task.expression}</p>
                    <p><strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}</p>
                    <p><strong>Last Run:</strong> {task.lastRun ? new Date(task.lastRun).toLocaleString() : 'Never'}</p>
                    <p><strong>Total Runs:</strong> {task.totalRuns}</p>
                  </div>
                  <div className="task-actions">
                    <button onClick={() => triggerTask(task.name)} className="btn-small">▶️ Run Now</button>
                    {task.active ? (
                      <button onClick={() => pauseTask(task.name)} className="btn-small pause">⏸️ Pause</button>
                    ) : (
                      <button onClick={() => resumeTask(task.name)} className="btn-small resume">▶️ Resume</button>
                    )}
                    <button onClick={() => deleteTask(task.name)} className="btn-small delete">🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="logs-section">
          <h2>Execution Logs ({logs.length})</h2>
          <div className="logs-list">
            {logs.length === 0 ? (
              <p className="empty">No logs yet</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="log-entry">
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="log-task">{log.task}</span>
                  <span className="log-status">✓ {log.status}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {response && (
          <section className="response">
            <h3>Response</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}
      </main>
    </div>
  );
}

