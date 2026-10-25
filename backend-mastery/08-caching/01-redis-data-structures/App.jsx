import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:6401';

export default function App() {
  const [tab, setTab] = useState('string');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // STRING state
  const [stringKey, setStringKey] = useState('demo:string');
  const [stringValue, setStringValue] = useState('');
  const [stringTTL, setStringTTL] = useState('');

  // LIST state
  const [listKey, setListKey] = useState('demo:list');
  const [listValue, setListValue] = useState('');
  const [listPosition, setListPosition] = useState('left');

  // SET state
  const [setKey, setSetKey] = useState('demo:set');
  const [setMember, setSetMember] = useState('');

  // HASH state
  const [hashKey, setHashKey] = useState('demo:hash');
  const [hashField, setHashField] = useState('');
  const [hashValue, setHashValue] = useState('');

  // ZSET state
  const [zsetKey, setZsetKey] = useState('demo:zset');
  const [zsetMember, setZsetMember] = useState('');
  const [zsetScore, setZsetScore] = useState('');

  const makeRequest = async (method, endpoint, body = null) => {
    try {
      setLoading(true);
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      };
      const res = await fetch(`${API_URL}${endpoint}`, options);
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  // STRING operations
  const handleStringSet = () => {
    if (!stringValue) return alert('Enter value');
    makeRequest('POST', '/api/string/set', {
      key: stringKey,
      value: stringValue,
      ttl: stringTTL ? parseInt(stringTTL) : null
    });
  };

  const handleStringGet = () => {
    makeRequest('GET', `/api/string/${stringKey}`);
  };

  const handleStringIncr = () => {
    makeRequest('POST', `/api/string/${stringKey}/incr`, { amount: 1 });
  };

  // LIST operations
  const handleListPush = () => {
    if (!listValue) return alert('Enter value');
    makeRequest('POST', `/api/list/${listKey}/push`, {
      value: listValue,
      position: listPosition
    });
  };

  const handleListGet = () => {
    makeRequest('GET', `/api/list/${listKey}`);
  };

  const handleListPop = () => {
    makeRequest('DELETE', `/api/list/${listKey}/pop`, {
      position: listPosition
    });
  };

  // SET operations
  const handleSetAdd = () => {
    if (!setMember) return alert('Enter member');
    makeRequest('POST', `/api/set/${setKey}/add`, { member: setMember });
  };

  const handleSetGet = () => {
    makeRequest('GET', `/api/set/${setKey}`);
  };

  const handleSetCheck = () => {
    makeRequest('GET', `/api/set/${setKey}/member/${setMember}`);
  };

  // HASH operations
  const handleHashSet = () => {
    if (!hashField || !hashValue) return alert('Enter field and value');
    makeRequest('POST', `/api/hash/${hashKey}/set`, {
      fields: { [hashField]: hashValue }
    });
  };

  const handleHashGet = () => {
    makeRequest('GET', `/api/hash/${hashKey}`);
  };

  const handleHashGetField = () => {
    makeRequest('GET', `/api/hash/${hashKey}/${hashField}`);
  };

  // ZSET operations
  const handleZsetAdd = () => {
    if (!zsetMember || zsetScore === '') return alert('Enter member and score');
    makeRequest('POST', `/api/zset/${zsetKey}/add`, {
      member: zsetMember,
      score: parseFloat(zsetScore)
    });
  };

  const handleZsetGet = () => {
    makeRequest('GET', `/api/zset/${zsetKey}`);
  };

  const handleZsetRank = () => {
    makeRequest('GET', `/api/zset/${zsetKey}/rank/${zsetMember}`);
  };

  // Utility
  const handleLoadDemo = () => {
    makeRequest('GET', '/api/demo/load-data');
  };

  const handleViewDemo = () => {
    makeRequest('GET', '/api/demo');
  };

  return (
    <div className="container">
      <header>
        <h1>🗝️ Redis Data Structures</h1>
        <p>Interactive playground for String, List, Set, Hash, and Sorted Set</p>
      </header>

      <div className="tabs">
        {['string', 'list', 'set', 'hash', 'zset', 'demo'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab ${tab === t ? 'active' : ''}`}
          >
            {t === 'string' && '📝 String'}
            {t === 'list' && '📋 List'}
            {t === 'set' && '🎯 Set'}
            {t === 'hash' && '🗂️ Hash'}
            {t === 'zset' && '🏆 Sorted Set'}
            {t === 'demo' && '🎮 Demo'}
          </button>
        ))}
      </div>

      <div className="content">
        {/* STRING Tab */}
        {tab === 'string' && (
          <section>
            <h2>String - Key-Value Pairs</h2>
            <p className="description">
              Strings are the simplest data type. Use for caching, sessions, counters, feature flags.
            </p>

            <div className="panel">
              <h3>Set String with TTL</h3>
              <input
                type="text"
                placeholder="Key (e.g., user:1:name)"
                value={stringKey}
                onChange={(e) => setStringKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={stringValue}
                onChange={(e) => setStringValue(e.target.value)}
              />
              <input
                type="number"
                placeholder="TTL (seconds, optional)"
                value={stringTTL}
                onChange={(e) => setStringTTL(e.target.value)}
              />
              <button onClick={handleStringSet} disabled={loading}>
                SET {stringKey}
              </button>
            </div>

            <div className="panel">
              <h3>Get String</h3>
              <input
                type="text"
                placeholder="Key"
                value={stringKey}
                onChange={(e) => setStringKey(e.target.value)}
              />
              <button onClick={handleStringGet} disabled={loading}>
                GET {stringKey}
              </button>
            </div>

            <div className="panel">
              <h3>Counter Operations</h3>
              <input
                type="text"
                placeholder="Counter key (e.g., page:visits)"
                value={stringKey}
                onChange={(e) => setStringKey(e.target.value)}
              />
              <button onClick={handleStringIncr} disabled={loading}>
                INCR (increment by 1)
              </button>
            </div>
          </section>
        )}

        {/* LIST Tab */}
        {tab === 'list' && (
          <section>
            <h2>List - Ordered Queues</h2>
            <p className="description">
              Lists maintain ordered sequences. Use for queues, activity feeds, job processing with LPUSH/RPOP.
            </p>

            <div className="panel">
              <h3>Push to List</h3>
              <input
                type="text"
                placeholder="Key (e.g., queue:jobs)"
                value={listKey}
                onChange={(e) => setListKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={listValue}
                onChange={(e) => setListValue(e.target.value)}
              />
              <select value={listPosition} onChange={(e) => setListPosition(e.target.value)}>
                <option value="left">Left (LPUSH) - Add to head</option>
                <option value="right">Right (RPUSH) - Add to tail</option>
              </select>
              <button onClick={handleListPush} disabled={loading}>
                PUSH {listValue}
              </button>
            </div>

            <div className="panel">
              <h3>View List Range</h3>
              <input
                type="text"
                placeholder="Key"
                value={listKey}
                onChange={(e) => setListKey(e.target.value)}
              />
              <button onClick={handleListGet} disabled={loading}>
                LRANGE (all items)
              </button>
            </div>

            <div className="panel">
              <h3>Pop from List</h3>
              <select value={listPosition} onChange={(e) => setListPosition(e.target.value)}>
                <option value="left">Left (LPOP) - Remove from head</option>
                <option value="right">Right (RPOP) - Remove from tail</option>
              </select>
              <button onClick={handleListPop} disabled={loading}>
                POP
              </button>
            </div>
          </section>
        )}

        {/* SET Tab */}
        {tab === 'set' && (
          <section>
            <h2>Set - Unique Members</h2>
            <p className="description">
              Sets store unique, unordered values. Use for followers, tags, deduplication, membership checks.
            </p>

            <div className="panel">
              <h3>Add to Set</h3>
              <input
                type="text"
                placeholder="Key (e.g., tags:post:1)"
                value={setKey}
                onChange={(e) => setSetKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Member"
                value={setMember}
                onChange={(e) => setSetMember(e.target.value)}
              />
              <button onClick={handleSetAdd} disabled={loading}>
                SADD {setMember}
              </button>
            </div>

            <div className="panel">
              <h3>Get All Members</h3>
              <input
                type="text"
                placeholder="Key"
                value={setKey}
                onChange={(e) => setSetKey(e.target.value)}
              />
              <button onClick={handleSetGet} disabled={loading}>
                SMEMBERS {setKey}
              </button>
            </div>

            <div className="panel">
              <h3>Check Membership</h3>
              <input
                type="text"
                placeholder="Key"
                value={setKey}
                onChange={(e) => setSetKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Member to check"
                value={setMember}
                onChange={(e) => setSetMember(e.target.value)}
              />
              <button onClick={handleSetCheck} disabled={loading}>
                SISMEMBER {setMember}
              </button>
            </div>
          </section>
        )}

        {/* HASH Tab */}
        {tab === 'hash' && (
          <section>
            <h2>Hash - Object Storage</h2>
            <p className="description">
              Hashes store multiple field-value pairs. Perfect for user objects, game scores, shopping carts.
            </p>

            <div className="panel">
              <h3>Set Hash Field</h3>
              <input
                type="text"
                placeholder="Key (e.g., user:1)"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Field (e.g., name)"
                value={hashField}
                onChange={(e) => setHashField(e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={hashValue}
                onChange={(e) => setHashValue(e.target.value)}
              />
              <button onClick={handleHashSet} disabled={loading}>
                HSET {hashField}
              </button>
            </div>

            <div className="panel">
              <h3>Get All Hash Fields</h3>
              <input
                type="text"
                placeholder="Key"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
              />
              <button onClick={handleHashGet} disabled={loading}>
                HGETALL {hashKey}
              </button>
            </div>

            <div className="panel">
              <h3>Get Specific Field</h3>
              <input
                type="text"
                placeholder="Key"
                value={hashKey}
                onChange={(e) => setHashKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Field name"
                value={hashField}
                onChange={(e) => setHashField(e.target.value)}
              />
              <button onClick={handleHashGetField} disabled={loading}>
                HGET {hashField}
              </button>
            </div>
          </section>
        )}

        {/* ZSET Tab */}
        {tab === 'zset' && (
          <section>
            <h2>Sorted Set - Scored Rankings</h2>
            <p className="description">
              Sorted Sets maintain elements with scores. Essential for leaderboards, top-N queries, time-based events.
            </p>

            <div className="panel">
              <h3>Add to Sorted Set</h3>
              <input
                type="text"
                placeholder="Key (e.g., leaderboard:game:1)"
                value={zsetKey}
                onChange={(e) => setZsetKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Member"
                value={zsetMember}
                onChange={(e) => setZsetMember(e.target.value)}
              />
              <input
                type="number"
                placeholder="Score (numeric)"
                value={zsetScore}
                onChange={(e) => setZsetScore(e.target.value)}
                step="0.1"
              />
              <button onClick={handleZsetAdd} disabled={loading}>
                ZADD {zsetMember}
              </button>
            </div>

            <div className="panel">
              <h3>View Leaderboard (High to Low)</h3>
              <input
                type="text"
                placeholder="Key"
                value={zsetKey}
                onChange={(e) => setZsetKey(e.target.value)}
              />
              <button onClick={handleZsetGet} disabled={loading}>
                ZRANGE (highest scores first)
              </button>
            </div>

            <div className="panel">
              <h3>Get Member Rank & Score</h3>
              <input
                type="text"
                placeholder="Key"
                value={zsetKey}
                onChange={(e) => setZsetKey(e.target.value)}
              />
              <input
                type="text"
                placeholder="Member name"
                value={zsetMember}
                onChange={(e) => setZsetMember(e.target.value)}
              />
              <button onClick={handleZsetRank} disabled={loading}>
                ZREVRANK & ZSCORE
              </button>
            </div>
          </section>
        )}

        {/* DEMO Tab */}
        {tab === 'demo' && (
          <section>
            <h2>Demo Data</h2>
            <p className="description">
              Load pre-filled data examples to explore all 5 data structures.
            </p>

            <div className="panel">
              <button onClick={handleLoadDemo} disabled={loading} className="primary">
                Load Demo Data
              </button>
              <p className="hint">Creates sample data for all 5 structures with demo: prefix</p>
            </div>

            <div className="panel">
              <button onClick={handleViewDemo} disabled={loading} className="primary">
                View Loaded Demo Data
              </button>
              <p className="hint">Shows all demo data currently in Redis</p>
            </div>
          </section>
        )}

        {/* Response Display */}
        {response && (
          <section className="response">
            <h3>Response:</h3>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}
      </div>

      <footer>
        <p className="info">
          🚀 Module 08.1 - Redis Data Structures | Server: localhost:6401 | Make sure Redis is running!
        </p>
      </footer>
    </div>
  );
}

