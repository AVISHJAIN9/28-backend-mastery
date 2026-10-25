import React, { useState, useEffect } from 'react';

export default function I18nextApp() {
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translationKey, setTranslationKey] = useState('greeting');
  const [translateResult, setTranslateResult] = useState(null);
  const [interpolationData, setInterpolationData] = useState({});
  const [pluralCount, setPluralCount] = useState(1);
  const [batchKeys, setBatchKeys] = useState('greeting,login,welcome');
  const [batchResult, setBatchResult] = useState(null);
  const [allLanguagesFile, setAllLanguagesFile] = useState(null);
  const [selectedLangFile, setSelectedLangFile] = useState('en');

  useEffect(() => {
    fetch('http://localhost:5403/api/languages')
      .then(res => res.json())
      .then(data => setLanguages(data.languages))
      .catch(err => console.error('Failed to fetch languages:', err));
  }, []);

  const handleTranslate = async () => {
    try {
      let url = `http://localhost:5403/api/translate?language=${selectedLanguage}&key=${translationKey}`;
      
      if (translationKey.includes('items')) {
        url += `&count=${pluralCount}`;
      }
      
      Object.keys(interpolationData).forEach(key => {
        if (interpolationData[key]) {
          url += `&${key}=${interpolationData[key]}`;
        }
      });
      
      const res = await fetch(url);
      const data = await res.json();
      setTranslateResult(data);
    } catch (err) {
      setTranslateResult({ error: err.message });
    }
  };

  const handleBatchTranslate = async () => {
    try {
      const keys = batchKeys.split(',').map(k => k.trim());
      const url = `http://localhost:5403/api/translate/multiple?language=${selectedLanguage}&keys=${keys.join(',')}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setBatchResult(data);
    } catch (err) {
      setBatchResult({ error: err.message });
    }
  };

  const handleLoadLanguageFile = async () => {
    try {
      const res = await fetch(`http://localhost:5403/api/translation-file/${selectedLangFile}`);
      const data = await res.json();
      setAllLanguagesFile(data);
    } catch (err) {
      setAllLanguagesFile({ error: err.message });
    }
  };

  const handlePluralTest = async () => {
    try {
      const url = `http://localhost:5403/api/translate?language=${selectedLanguage}&key=items&count=${pluralCount}`;
      const res = await fetch(url);
      const data = await res.json();
      setTranslateResult(data);
    } catch (err) {
      setTranslateResult({ error: err.message });
    }
  };

  return (
    <div style={styles.container}>
      <h1>🌍 Module 23.3: i18next Translation API</h1>
      <p style={styles.subtitle}>Master multi-language support, interpolation, and translation management</p>

      {/* Section 1: Basic Translation */}
      <div style={styles.section}>
        <h2>1. Basic Translation</h2>
        <p>Translate a single key to different languages</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Language:</label>
            <select 
              value={selectedLanguage} 
              onChange={e => setSelectedLanguage(e.target.value)}
              style={styles.select}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <label>Translation Key:</label>
            <select 
              value={translationKey} 
              onChange={e => setTranslationKey(e.target.value)}
              style={styles.select}
            >
              <option value="greeting">greeting</option>
              <option value="welcome">welcome</option>
              <option value="login">login</option>
              <option value="logout">logout</option>
              <option value="signup">signup</option>
              <option value="auth.login">auth.login</option>
              <option value="auth.register">auth.register</option>
              <option value="auth.forgotPassword">auth.forgotPassword</option>
              <option value="auth.forms.email">auth.forms.email</option>
              <option value="auth.forms.password">auth.forms.password</option>
              <option value="checkout.pay">checkout.pay</option>
              <option value="checkout.shipping">checkout.shipping</option>
              <option value="checkout.total">checkout.total</option>
            </select>
          </div>

          <button onClick={handleTranslate} style={styles.button}>Translate</button>
        </div>

        {translateResult && (
          <div style={styles.result}>
            {translateResult.error ? (
              <p style={styles.error}>❌ {translateResult.error}</p>
            ) : (
              <div>
                <p><strong>Key:</strong> {translateResult.key}</p>
                <p><strong>Language:</strong> {translateResult.language}</p>
                <p style={{fontSize: '24px', fontWeight: 'bold', color: '#0066cc'}}>
                  Result: {translateResult.result}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Pluralization */}
      <div style={styles.section}>
        <h2>2. Pluralization Handler</h2>
        <p>Test singular vs plural forms automatically ("1 item" vs "5 items")</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Language:</label>
            <select 
              value={selectedLanguage} 
              onChange={e => setSelectedLanguage(e.target.value)}
              style={styles.select}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <label>Item Count:</label>
            <input 
              type="number" 
              min="0" 
              max="100" 
              value={pluralCount} 
              onChange={e => setPluralCount(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handlePluralTest} style={styles.button}>Test Plural</button>
        </div>

        {translateResult && translateResult.key === 'items' && (
          <div style={styles.result}>
            <p style={{fontSize: '18px', color: '#2e7d32'}}>
              ✅ {translateResult.result}
            </p>
            <p style={{fontSize: '12px', color: '#666'}}>
              Notice how the text changes from singular to plural!
            </p>
          </div>
        )}
        
        <div style={styles.tip}>
          <strong>💡 Try:</strong> Set count to 1 (singular "item") then 2+ (plural "items") in different languages
        </div>
      </div>

      {/* Section 3: Interpolation */}
      <div style={styles.section}>
        <h2>3. Variable Interpolation</h2>
        <p>Insert dynamic variables into translations: "Hello {{name}}"</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Your Email:</label>
            <input 
              type="email" 
              value={interpolationData.email || ''}
              onChange={e => setInterpolationData({...interpolationData, email: e.target.value})}
              placeholder="user@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>First Name:</label>
            <input 
              type="text" 
              value={interpolationData.firstName || ''}
              onChange={e => setInterpolationData({...interpolationData, firstName: e.target.value})}
              placeholder="John"
              style={styles.input}
            />
          </div>

          <button onClick={async () => {
            try {
              const url = `http://localhost:5403/api/translate/interpolate?language=${selectedLanguage}&key=emailSent&email=${interpolationData.email}`;
              const res = await fetch(url);
              const data = await res.json();
              setTranslateResult(data);
            } catch (err) {
              setTranslateResult({ error: err.message });
            }
          }} style={styles.button}>Interpolate</button>
        </div>

        {translateResult?.variables?.email && (
          <div style={styles.result}>
            <p style={{fontSize: '18px', fontWeight: 'bold'}}>
              {translateResult.result}
            </p>
          </div>
        )}
      </div>

      {/* Section 4: Batch Translation */}
      <div style={styles.section}>
        <h2>4. Batch Translation (Multiple Keys)</h2>
        <p>Translate multiple keys at once (comma-separated)</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Language:</label>
            <select 
              value={selectedLanguage} 
              onChange={e => setSelectedLanguage(e.target.value)}
              style={styles.select}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.row}>
            <label>Keys (comma-separated):</label>
            <textarea 
              value={batchKeys} 
              onChange={e => setBatchKeys(e.target.value)}
              placeholder="greeting,login,welcome"
              style={{...styles.input, minHeight: '60px'}}
            />
          </div>

          <button onClick={handleBatchTranslate} style={styles.button}>Translate All</button>
        </div>

        {batchResult && (
          <div style={styles.result}>
            {batchResult.error ? (
              <p style={styles.error}>❌ {batchResult.error}</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Translation</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(batchResult.translations).map(([key, value]) => (
                    <tr key={key}>
                      <td><code>{key}</code></td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Language Files */}
      <div style={styles.section}>
        <h2>5. Complete Translation Files</h2>
        <p>View the complete translation file for a language</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Select Language:</label>
            <select 
              value={selectedLangFile} 
              onChange={e => setSelectedLangFile(e.target.value)}
              style={styles.select}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleLoadLanguageFile} style={styles.button}>Load File</button>
        </div>

        {allLanguagesFile && (
          <div style={styles.result}>
            {allLanguagesFile.error ? (
              <p style={styles.error}>❌ {allLanguagesFile.error}</p>
            ) : (
              <div>
                <p><strong>Language:</strong> {allLanguagesFile.language}</p>
                <p><strong>Total Keys:</strong> {allLanguagesFile.keys}</p>
                <pre style={{backgroundColor: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px'}}>
                  {JSON.stringify(allLanguagesFile.translations, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Learnings */}
      <div style={{...styles.section, backgroundColor: '#f0f0f0'}}>
        <h2>🎯 Key Takeaways</h2>
        <ul style={styles.list}>
          <li><strong>Translation Keys:</strong> Use dot notation (auth.login) to organize by feature</li>
          <li><strong>Pluralization:</strong> Automatically handle singular/plural forms by language rules</li>
          <li><strong>Interpolation:</strong> Insert dynamic variables with {{variable}} syntax</li>
          <li><strong>Namespaces:</strong> Split translations by features (auth, checkout, profile)</li>
          <li><strong>Language Detection:</strong> Auto-detect from browser, URL, or localStorage</li>
          <li><strong>RTL Support:</strong> Arabic/Hebrew need direction: rtl CSS property</li>
          <li><strong>Performance:</strong> Lazy load translation files per feature, not all at once</li>
          <li><strong>Validation:</strong> Ensure all languages have same keys to prevent bugs</li>
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
    marginTop: '12px'
  },
  tip: {
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#e3f2fd',
    borderLeft: '4px solid #1976d2',
    borderRadius: '4px'
  },
  list: {
    lineHeight: '1.8',
    color: '#333'
  }
};
