import React, { useState } from 'react';
import '../styles/PhaseExplainer.css';

const PhaseExplainer = () => {
  const [expandedPhase, setExpandedPhase] = useState(null);

  const phases = [
    {
      id: 'timers',
      name: 'Timers',
      position: 1,
      description: 'Execute setTimeout and setInterval callbacks whose delay has elapsed',
      details: [
        'Checks if any timer callbacks are ready to execute',
        'Timers are checked against the current time',
        'All ready callbacks are executed in FIFO order',
        'Example: setTimeout(callback, 1000)'
      ],
      code: `setTimeout(() => {
  console.log('Executed in Timers phase');
}, 1000);`,
      codeLanguage: 'javascript'
    },
    {
      id: 'pendingCallbacks',
      name: 'Pending Callbacks',
      position: 2,
      description: 'Execute deferred I/O callbacks from previous event loop iterations',
      details: [
        'Executes callbacks deferred from previous iterations',
        'Usually system-level errors and some I/O operations',
        'Not typically user-facing callbacks',
        'Example: TCP connection errors'
      ],
      code: `// This is handled internally by Node.js
// For TCP errors and system-level I/O callbacks`,
      codeLanguage: 'javascript'
    },
    {
      id: 'idlePrepare',
      name: 'Idle/Prepare',
      position: 3,
      description: 'Internal housekeeping - not typically relevant to user code',
      details: [
        'Used internally by Node.js for housekeeping',
        'Generally not visible to user code',
        'Prepares the event loop for the poll phase',
        'Rarely directly interacted with'
      ],
      code: `// Internal Node.js phase - usually not user-facing`,
      codeLanguage: 'javascript'
    },
    {
      id: 'poll',
      name: 'Poll',
      position: 4,
      description: 'Wait for I/O events (file reads, network requests, etc.)',
      details: [
        'The most important phase for I/O operations',
        'Waits for new I/O events to arrive',
        'Executes I/O-related callbacks (fs, http, etc.)',
        'Blocks here if no timers are pending and poll queue is empty'
      ],
      code: `fs.readFile('file.txt', (err, data) => {
  // Executed during Poll phase
  console.log(data);
});`,
      codeLanguage: 'javascript'
    },
    {
      id: 'check',
      name: 'Check (setImmediate)',
      position: 5,
      description: 'Execute setImmediate callbacks',
      details: [
        'Executes setImmediate callbacks',
        'Happens after the poll phase',
        'setImmediate guarantees execution after I/O',
        'Example: setImmediate(callback)'
      ],
      code: `setImmediate(() => {
  console.log('Executed in Check phase');
});`,
      codeLanguage: 'javascript'
    },
    {
      id: 'close',
      name: 'Close',
      position: 6,
      description: 'Close callbacks for closed connections (socket.destroy())',
      details: [
        'Executes close callbacks',
        'Called when a socket or handle is being closed',
        'Example: connection.on("close", callback)',
        'Cleans up resources'
      ],
      code: `socket.on('close', () => {
  console.log('Executed in Close phase');
});`,
      codeLanguage: 'javascript'
    }
  ];

  return (
    <div className="phase-explainer">
      <div className="timeline">
        {phases.map(phase => (
          <div 
            key={phase.id} 
            className={`timeline-item ${expandedPhase === phase.id ? 'expanded' : ''}`}
          >
            <div 
              className="timeline-header"
              onClick={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
            >
              <div className="phase-number">{phase.position}</div>
              <div className="phase-info">
                <h3>{phase.name}</h3>
                <p>{phase.description}</p>
              </div>
              <div className="expand-icon">
                {expandedPhase === phase.id ? '−' : '+'}
              </div>
            </div>

            {expandedPhase === phase.id && (
              <div className="timeline-content">
                <div className="details">
                  <h4>Details:</h4>
                  <ul>
                    {phase.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <div className="code-block">
                  <p className="code-label">Example:</p>
                  <pre>
                    <code className={phase.codeLanguage}>
                      {phase.code}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="phase-order-info">
        <h3>Event Loop Order</h3>
        <div className="order-list">
          <ol>
            <li>Timers</li>
            <li>Pending Callbacks</li>
            <li>Idle/Prepare</li>
            <li>Poll</li>
            <li>Check (setImmediate)</li>
            <li>Close</li>
            <li>Loop repeats...</li>
          </ol>
        </div>
      </div>

      <div className="microtask-info">
        <h3>⚡ Important: Microtasks</h3>
        <p>
          Between each phase, microtasks are executed (Promises, process.nextTick).
          These always run before the next phase begins!
        </p>
      </div>
    </div>
  );
};

export default PhaseExplainer;
