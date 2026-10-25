import React, { useState, useEffect } from 'react';

export default function UnicodeApp() {
  const [testStrings, setTestStrings] = useState([]);
  const [selectedString, setSelectedString] = useState('emoji');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [customText, setCustomText] = useState('');
  const [graphemes, setGraphemes] = useState(null);
  const [normalizedForms, setNormalizedForms] = useState(null);
  const [truncateLength, setTruncateLength] = useState(3);
  const [truncateResult, setTruncateResult] = useState(null);
  const [sortLocale, setSortLocale] = useState('en');
  const [sortResult, setSortResult] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5404/api/test-strings')
      .then(res => res.json())
      .then(data => setTestStrings(data.strings))
      .catch(err => console.error('Failed to fetch test strings:', err));
  }, []);

  const handleAnalyze = async () => {
    try {
      let url = selectedString 
        ? `http://localhost:5404/api/analyze/${selectedString}`
        : `http://localhost:5404/api/analyze`;
      
      const options = {
        method: customText ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (customText) {
        options.body = JSON.stringify({ text: customText });
      }
      
      const res = await fetch(url, options);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisResult({ error: err.message });
    }
  };

  const handleSegmentGraphemes = async () => {
    try {
      const key = selectedString || 'emoji';
      const res = await fetch(`http://localhost:5404/api/graphemes/${key}`);
      const data = await res.json();
      setGraphemes(data);
    } catch (err) {
      setGraphemes({ error: err.message });
    }
  };

  const handleNormalize = async () => {
    try {
      const key = selectedString || 'emoji';
      const res = await fetch(`http://localhost:5404/api/normalize/${key}`);
      const data = await res.json();
      setNormalizedForms(data);
    } catch (err) {
      setNormalizedForms({ error: err.message });
    }
  };

  const handleTruncate = async () => {
    try {
      const key = selectedString || 'emoji';
      const res = await fetch(`http://localhost:5404/api/truncate/${key}/${truncateLength}`);
      const data = await res.json();
      setTruncateResult(data);
    } catch (err) {
      setTruncateResult({ error: err.message });
    }
  };

  const handleSort = async () => {
    try {
      const res = await fetch(`http://localhost:5404/api/sort?locale=${sortLocale}`);
      const data = await res.json();
      setSortResult(data);
    } catch (err) {
      setSortResult({ error: err.message });
    }
  };

  return (
    <div style={styles.container}>
      <h1>🌐 Module 23.4: Unicode Edge Cases & Character Encoding</h1>
      <p style={styles.subtitle}>Master code points, grapheme clusters, normalization, and string handling</p>

      {/* Section 1: Basic Analysis */}
      <div style={styles.section}>
        <h2>1. String Analysis (Bytes vs Characters)</h2>
        <p>Compare .length, spread operator, bytes, and code points</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Test String:</label>
            <select 
              value={selectedString} 
              onChange={e => setSelectedString(e.target.value)}
              style={styles.select}
            >
              <option value="">--- Select ---</option>
              {testStrings.map(str => (
                <option key={str} value={str}>{str}</option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <label>Or Custom Text:</label>
            <input 
              type="text" 
              value={customText} 
              onChange={e => setCustomText(e.target.value)}
              placeholder="Type emoji, accents, emoji or text"
              style={styles.input}
            />
          </div>

          <button onClick={handleAnalyze} style={styles.button}>Analyze</button>
        </div>

        {analysisResult && (
          <div style={styles.result}>
            {analysisResult.error ? (
              <p style={styles.error}>❌ {analysisResult.error}</p>
            ) : (
              <table style={styles.metricTable}>
                <tbody>
                  <tr>
                    <td><strong>Original:</strong></td>
                    <td style={{fontSize: '20px'}}>{analysisResult.original}</td>
                  </tr>
                  <tr>
                    <td><strong>UTF-8 Bytes:</strong></td>
                    <td>{analysisResult.byteLength}</td>
                  </tr>
                  <tr>
                    <td><strong>JS .length:</strong></td>
                    <td>{analysisResult.jsLength} (code units, not characters!)</td>
                  </tr>
                  <tr>
                    <td><strong>[...str].length:</strong></td>
                    <td>{analysisResult.spreadLength} (better)</td>
                  </tr>
                  <tr>
                    <td><strong>RTL Text:</strong></td>
                    <td>{analysisResult.isRTL ? '✅ Yes (needs dir=rtl)' : 'No'}</td>
                  </tr>
                  <tr>
                    <td><strong>Code Points:</strong></td>
                    <td><code>{analysisResult.codePoints.map(cp => `U+${cp.toString(16).toUpperCase()}`).join(', ')}</code></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={styles.tip}>
          <strong>💡 Key Insight:</strong> "hello".length = 5 ✓ BUT "👀".length = 2 ✗ (it's 1 character!)
        </div>
      </div>

      {/* Section 2: Grapheme Clusters */}
      <div style={styles.section}>
        <h2>2. Grapheme Cluster Segmentation</h2>
        <p>Break text into user-perceived characters (handles emoji with ZWJ sequences)</p>
        
        <div style={styles.form}>
          <button onClick={handleSegmentGraphemes} style={styles.button}>Segment Graphemes</button>
        </div>

        {graphemes && (
          <div style={styles.result}>
            {graphemes.error ? (
              <p style={styles.error}>❌ {graphemes.error}</p>
            ) : (
              <div>
                <p><strong>Original:</strong> {graphemes.original}</p>
                <p><strong>Grapheme Count:</strong> {graphemes.graphemeCount}</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Character</th>
                      <th>JS Length</th>
                      <th>UTF-8 Bytes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {graphemes.graphemes.map((g, i) => (
                      <tr key={i}>
                        <td style={{fontSize: '18px'}}>{g.char}</td>
                        <td>{g.length}</td>
                        <td>{g.bytes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Unicode Normalization */}
      <div style={styles.section}>
        <h2>3. Unicode Normalization (NFC, NFD, NFKC, NFKD)</h2>
        <p>Different ways to represent the same text (é as U+00E9 vs e + ́)</p>
        
        <div style={styles.form}>
          <button onClick={handleNormalize} style={styles.button}>Show Normalization Forms</button>
        </div>

        {normalizedForms && (
          <div style={styles.result}>
            {normalizedForms.error ? (
              <p style={styles.error}>❌ {normalizedForms.error}</p>
            ) : (
              <div>
                <p><strong>Original:</strong> {normalizedForms.original}</p>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th>Form</th>
                      <th>Result</th>
                      <th>Length</th>
                      <th>Same?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>NFC</strong> (composed)</td>
                      <td>{normalizedForms.nfc.value}</td>
                      <td>{normalizedForms.nfc.length}</td>
                      <td>{normalizedForms.nfc.matches ? '✅' : '❌'}</td>
                    </tr>
                    <tr>
                      <td><strong>NFD</strong> (decomposed)</td>
                      <td>{normalizedForms.nfd.value}</td>
                      <td>{normalizedForms.nfd.length}</td>
                      <td>{normalizedForms.nfd.matches ? '✅' : '❌'}</td>
                    </tr>
                    <tr>
                      <td><strong>NFKC</strong> (compat)</td>
                      <td>{normalizedForms.nfkc.value}</td>
                      <td>{normalizedForms.nfkc.length}</td>
                      <td>{normalizedForms.nfkc.matches ? '✅' : '❌'}</td>
                    </tr>
                    <tr>
                      <td><strong>NFKD</strong> (compat decomp)</td>
                      <td>{normalizedForms.nfkd.value}</td>
                      <td>{normalizedForms.nfkd.length}</td>
                      <td>{normalizedForms.nfkd.matches ? '✅' : '❌'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div style={styles.tip}>
          <strong>⚠️ Database Gotcha:</strong> User enters "café" (one way), stored as "café" (another way). Search breaks! Always normalize before compare.
        </div>
      </div>

      {/* Section 4: Safe Truncation */}
      <div style={styles.section}>
        <h2>4. Safe Text Truncation (Avoid Breaking Emoji)</h2>
        <p>Naive substring breaks emoji. Safe truncation uses grapheme clusters.</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Target Length:</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={truncateLength} 
              onChange={e => setTruncateLength(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleTruncate} style={styles.button}>Truncate</button>
        </div>

        {truncateResult && (
          <div style={styles.result}>
            {truncateResult.error ? (
              <p style={styles.error}>❌ {truncateResult.error}</p>
            ) : (
              <div>
                <p><strong>Original:</strong> "{truncateResult.original}"</p>
                <p><strong>❌ Naive (broken):</strong> "{truncateResult.naiveTruncate}"</p>
                <p><strong>✅ Safe:</strong> "{truncateResult.safeTruncate}"</p>
                <p style={{color: '#d32f2f', fontWeight: 'bold'}}>
                  The naive version breaks emoji! The safe version preserves them correctly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Locale-Aware Sorting */}
      <div style={styles.section}>
        <h2>5. Locale-Aware Sorting</h2>
        <p>Basic sort breaks non-ASCII. Intl.Collator handles locale-specific rules.</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Locale:</label>
            <select 
              value={sortLocale} 
              onChange={e => setSortLocale(e.target.value)}
              style={styles.select}
            >
              <option value="en">English (en)</option>
              <option value="de">German (de)</option>
              <option value="sv">Swedish (sv)</option>
              <option value="fr">French (fr)</option>
            </select>
          </div>

          <button onClick={handleSort} style={styles.button}>Sort Words</button>
        </div>

        {sortResult && (
          <div style={styles.result}>
            {sortResult.error ? (
              <p style={styles.error}>❌ {sortResult.error}</p>
            ) : (
              <div>
                <p><strong>Original:</strong> {sortResult.original.join(', ')}</p>
                <p><strong>❌ Basic JavaScript sort():</strong> {sortResult.basicSort.join(', ')}</p>
                <p><strong>✅ Intl.Collator (locale '{sortLocale}'):</strong> {sortResult.intlSort.join(', ')}</p>
                <p style={{fontSize: '12px', color: '#666'}}>
                  Notice how German and Swedish sort 'ä' and 'ö' differently!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Learnings */}
      <div style={{...styles.section, backgroundColor: '#f0f0f0'}}>
        <h2>🎯 Critical Takeaways</h2>
        <ul style={styles.list}>
          <li><strong>.length lies!</strong> "😀".length = 2, but it's 1 character. Use [...str].length</li>
          <li><strong>Emoji ≠ 1 byte:</strong> Family emoji 👨‍👩‍👧‍👦 = 25 bytes! (ZWJ sequences)</li>
          <li><strong>Normalization matters:</strong> é can be U+00E9 OR e+´. Must normalize before comparing</li>
          <li><strong>Truncation breaks emoji:</strong> Use grapheme clusters, not substring()</li>
          <li><strong>Never use basic .sort():</strong> Use Intl.Collator for non-ASCII</li>
          <li><strong>Database UTF-8:</strong> Must be CHARACTER SET utf8mb4, not utf8</li>
          <li><strong>Regex needs /u flag:</strong> /pattern/gu for Unicode > BMP</li>
          <li><strong>RTL text needs CSS:</strong> Arabic/Hebrew need direction: rtl</li>
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
    backgroundColor: '#0066cc',
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
    borderLeft: '4px solid #0066cc'
  },
  error: {
    color: '#d32f2f',
    margin: 0
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '14px'
  },
  metricTable: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tip: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#fff3e0',
    borderLeft: '4px solid #ff9800',
    borderRadius: '4px',
    fontSize: '14px'
  },
  list: {
    lineHeight: '1.8',
    color: '#333'
  }
};

