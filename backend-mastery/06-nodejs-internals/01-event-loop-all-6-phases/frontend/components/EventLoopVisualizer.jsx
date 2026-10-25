import React, { useState, useEffect } from 'react';
import '../styles/EventLoopVisualizer.css';

const EventLoopVisualizer = ({ stats }) => {
  const [phases, setPhases] = useState({
    timers: { active: false, tasks: 0, duration: 0 },
    pendingCallbacks: { active: false, tasks: 0, duration: 0 },
    idlePrepare: { active: false, tasks: 0, duration: 0 },
    poll: { active: false, tasks: 0, duration: 0 },
    check: { active: false, tasks: 0, duration: 0 },
    close: { active: false, tasks: 0, duration: 0 }
  });

  const [iteration, setIteration] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (stats) {
      setPhases(stats.phases);
      setIteration(stats.iteration);
      setTotalTime(stats.totalTime);
    }
  }, [stats]);

  const phaseNames = [
    { key: 'timers', label: 'Timers', color: '#FF6B6B' },
    { key: 'pendingCallbacks', label: 'Pending Callbacks', color: '#4ECDC4' },
    { key: 'idlePrepare', label: 'Idle/Prepare', color: '#45B7D1' },
    { key: 'poll', label: 'Poll', color: '#FFA07A' },
    { key: 'check', label: 'Check (setImmediate)', color: '#98D8C8' },
    { key: 'close', label: 'Close', color: '#C7CEEA' }
  ];

  return (
    <div className="visualizer">
      <div className="stats-summary">
        <div className="stat">
          <span className="label">Iteration:</span>
          <span className="value">{iteration}</span>
        </div>
        <div className="stat">
          <span className="label">Total Time:</span>
          <span className="value">{totalTime}ms</span>
        </div>
      </div>

      <div className="phases-container">
        {phaseNames.map(phase => (
          <div 
            key={phase.key} 
            className={`phase ${phases[phase.key]?.active ? 'active' : ''}`}
            style={{ borderLeftColor: phase.color }}
          >
            <div className="phase-header">
              <h3>{phase.label}</h3>
              <span className="indicator" style={{ backgroundColor: phase.color }}></span>
            </div>
            
            <div className="phase-details">
              <div className="detail">
                <span className="label">Tasks:</span>
                <span className="value">{phases[phase.key]?.tasks || 0}</span>
              </div>
              <div className="detail">
                <span className="label">Duration:</span>
                <span className="value">{phases[phase.key]?.duration || 0}ms</span>
              </div>
            </div>

            <div className="progress-bar">
              <div 
                className="progress"
                style={{ width: `${Math.min((phases[phase.key]?.duration || 0) / 10, 100)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="event-loop-flow">
        <div className="flow-diagram">
          <div className="flow-box timers">Timers</div>
          <div className="arrow">↓</div>
          <div className="flow-box pending">Pending Callbacks</div>
          <div className="arrow">↓</div>
          <div className="flow-box idle">Idle/Prepare</div>
          <div className="arrow">↓</div>
          <div className="flow-box poll">Poll</div>
          <div className="arrow">↓</div>
          <div className="flow-box check">Check</div>
          <div className="arrow">↓</div>
          <div className="flow-box close">Close</div>
          <div className="arrow loop">↻ (loop)</div>
        </div>
      </div>

      <div className="info-box">
        <h4>How to interpret the visualization:</h4>
        <ul>
          <li><strong>Active phase:</strong> Currently executing in the event loop</li>
          <li><strong>Tasks:</strong> Number of callbacks/tasks in this phase</li>
          <li><strong>Duration:</strong> Time spent executing this phase</li>
          <li><strong>Progress bar:</strong> Visual representation of execution time</li>
        </ul>
      </div>
    </div>
  );
};

export default EventLoopVisualizer;
