import React, { useState } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('vehicles');
  const [response, setResponse] = useState(null);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Factory Pattern Demo</h1>
      <p>Testing factory pattern implementations</p>
    </div>
  );
};

export default App;