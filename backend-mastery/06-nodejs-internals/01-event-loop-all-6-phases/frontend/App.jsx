import React, { useState, useEffect } from 'react';
import './App.css';
import EventLoopVisualizer from './components/EventLoopVisualizer';
import PhaseExplainer from './components/PhaseExplainer';
import BlockingExample from './components/BlockingExample';
import TaskMetrics from './components/TaskMetrics';

function App() {
  const [activeTab, setActiveTab] = useState('visualizer');
  const [eventLoopStats, setEventLoopStats] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/event-loop/stats');
        const data = await response.json();
        setEventLoopStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    if (isMonitoring) {
      const interval = setInterval(fetchStats, 1000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔄 Node.js Event Loop Visualizer</h1>
        <p>Understand all 6 phases of the event loop</p>
      </header>

      <div className="controls">
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={isMonitoring ? 'active' : ''}
        >
          {isMonitoring ? '⏹ Stop Monitoring' : '▶ Start Monitoring'}
        </button>
      </div>

      <nav className="tabs">
        <button 
          className={activeTab === 'visualizer' ? 'active' : ''}
          onClick={() => setActiveTab('visualizer')}
        >
          Visualizer
        </button>
        <button 
          className={activeTab === 'phases' ? 'active' : ''}
          onClick={() => setActiveTab('phases')}
        >
          Phases Explained
        </button>
        <button 
          className={activeTab === 'blocking' ? 'active' : ''}
          onClick={() => setActiveTab('blocking')}
        >
          Blocking Examples
        </button>
        <button 
          className={activeTab === 'metrics' ? 'active' : ''}
          onClick={() => setActiveTab('metrics')}
        >
          Metrics
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'visualizer' && <EventLoopVisualizer stats={eventLoopStats} />}
        {activeTab === 'phases' && <PhaseExplainer />}
        {activeTab === 'blocking' && <BlockingExample />}
        {activeTab === 'metrics' && <TaskMetrics stats={eventLoopStats} />}
      </main>

      <footer className="app-footer">
        <p>Event Loop phases: Timers → Pending callbacks → Idle/Prepare → Poll → Check → Close</p>
      </footer>
    </div>
  );
}

export default App;
