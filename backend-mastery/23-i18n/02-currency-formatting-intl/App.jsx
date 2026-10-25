import React, { useState, useEffect } from 'react';

export default function CurrencyApp() {
  const [currencies, setCurrencies] = useState([]);
  const [locales, setLocales] = useState([]);
  
  const [formatAmount, setFormatAmount] = useState('10050');
  const [formatCurrency, setFormatCurrency] = useState('USD');
  const [formatLocale, setFormatLocale] = useState('en-US');
  const [formatResult, setFormatResult] = useState(null);
  
  const [convertAmount, setConvertAmount] = useState('10050');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('EUR');
  const [convertLocale, setConvertLocale] = useState('en-US');
  const [convertResult, setConvertResult] = useState(null);
  
  const [compareAmount, setCompareAmount] = useState('100');
  const [compareCurrency, setCompareCurrency] = useState('USD');
  const [compareTargets, setCompareTargets] = useState(['EUR', 'GBP', 'JPY']);
  const [compareResult, setCompareResult] = useState(null);
  
  const [calculateCents, setCalculateCents] = useState('10050');
  const [calculateCurrency, setCalculateCurrency] = useState('USD');
  const [calculateOperation, setCalculateOperation] = useState('add');
  const [calculateValue, setCalculateValue] = useState('5000');
  const [calculateResult, setCalculateResult] = useState(null);

  useEffect(() => {
    // Fetch currencies on mount
    fetch('http://localhost:5402/api/currencies')
      .then(res => res.json())
      .then(data => {
        if (data.currencies) {
          setCurrencies(Object.keys(data.currencies));
        }
      })
      .catch(err => console.error('Failed to fetch currencies:', err));

    // Fetch locale examples
    fetch('http://localhost:5402/api/locales')
      .then(res => res.json())
      .then(data => {
        if (data.locales) {
          setLocales(data.locales.map(l => l.locale));
        }
      })
      .catch(err => console.error('Failed to fetch locales:', err));
  }, []);

  const handleFormat = async () => {
    try {
      const res = await fetch(
        `http://localhost:5402/api/format?cents=${formatAmount}&currency=${formatCurrency}&locale=${formatLocale}&display=symbol`
      );
      const data = await res.json();
      setFormatResult(data);
    } catch (err) {
      setFormatResult({ error: err.message });
    }
  };

  const handleConvert = async () => {
    try {
      const res = await fetch(
        `http://localhost:5402/api/convert?amount=${convertAmount}&from=${convertFrom}&to=${convertTo}&locale=${convertLocale}`
      );
      const data = await res.json();
      setConvertResult(data);
    } catch (err) {
      setConvertResult({ error: err.message });
    }
  };

  const handleCompare = async () => {
    try {
      const targets = compareTargets.join(',');
      const res = await fetch(
        `http://localhost:5402/api/compare?amount=${compareAmount}&baseCurrency=${compareCurrency}&currencies=${targets}`
      );
      const data = await res.json();
      setCompareResult(data);
    } catch (err) {
      setCompareResult({ error: err.message });
    }
  };

  const handleCalculate = async () => {
    try {
      const res = await fetch('http://localhost:5402/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cents: parseInt(calculateCents),
          currency: calculateCurrency,
          operation: calculateOperation,
          operand: parseInt(calculateValue)
        })
      });
      const data = await res.json();
      setCalculateResult(data);
    } catch (err) {
      setCalculateResult({ error: err.message });
    }
  };

  return (
    <div style={styles.container}>
      <h1>💱 Module 23.2: Currency Formatting & Intl API</h1>
      <p style={styles.subtitle}>Master money handling, exchange rates, and locale-aware formatting</p>

      {/* Section 1: Format Currency */}
      <div style={styles.section}>
        <h2>1. Format Amount for Locale</h2>
        <p>Display money with proper symbols, separators, and decimal places</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Amount (in cents):</label>
            <input 
              type="number" 
              value={formatAmount} 
              onChange={e => setFormatAmount(e.target.value)}
              style={styles.input}
            />
          </div>
          
          <div style={styles.row}>
            <label>Currency:</label>
            <select 
              value={formatCurrency} 
              onChange={e => setFormatCurrency(e.target.value)}
              style={styles.select}
            >
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <label>Locale:</label>
            <select 
              value={formatLocale} 
              onChange={e => setFormatLocale(e.target.value)}
              style={styles.select}
            >
              <option>en-US</option>
              <option>de-DE</option>
              <option>fr-FR</option>
              <option>ja-JP</option>
              <option>es-ES</option>
              <option>it-IT</option>
              <option>pt-BR</option>
              <option>zh-CN</option>
            </select>
          </div>

          <button onClick={handleFormat} style={styles.button}>Format</button>
        </div>

        {formatResult && (
          <div style={styles.result}>
            {formatResult.error ? (
              <p style={styles.error}>❌ {formatResult.error}</p>
            ) : (
              <div>
                <p><strong>Formatted:</strong> {formatResult.formatted}</p>
                <p><strong>Decimal Places:</strong> {formatResult.details?.decimalPlaces}</p>
                <p><strong>Currency Name:</strong> {formatResult.details?.currencyName}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Convert Currency */}
      <div style={styles.section}>
        <h2>2. Convert Between Currencies</h2>
        <p>Convert amounts using real-time exchange rates</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Amount (in cents):</label>
            <input 
              type="number" 
              value={convertAmount} 
              onChange={e => setConvertAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>From Currency:</label>
            <select 
              value={convertFrom} 
              onChange={e => setConvertFrom(e.target.value)}
              style={styles.select}
            >
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <label>To Currency:</label>
            <select 
              value={convertTo} 
              onChange={e => setConvertTo(e.target.value)}
              style={styles.select}
            >
              {currencies.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <label>Locale:</label>
            <select 
              value={convertLocale} 
              onChange={e => setConvertLocale(e.target.value)}
              style={styles.select}
            >
              <option>en-US</option>
              <option>de-DE</option>
              <option>fr-FR</option>
            </select>
          </div>

          <button onClick={handleConvert} style={styles.button}>Convert</button>
        </div>

        {convertResult && (
          <div style={styles.result}>
            {convertResult.error ? (
              <p style={styles.error}>❌ {convertResult.error}</p>
            ) : (
              <div>
                <p><strong>Result:</strong> {convertResult.result}</p>
                <p><strong>Exchange Rate:</strong> 1 {convertFrom} = {convertResult.rate} {convertTo}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Compare Across Currencies */}
      <div style={styles.section}>
        <h2>3. Compare Amount in Multiple Currencies</h2>
        <p>See same amount formatted in different currencies at once</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Amount:</label>
            <input 
              type="number" 
              value={compareAmount} 
              onChange={e => setCompareAmount(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>Base Currency:</label>
            <select 
              value={compareCurrency} 
              onChange={e => setCompareCurrency(e.target.value)}
              style={styles.select}
            >
              {currencies.slice(0, 10).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <button onClick={handleCompare} style={styles.button}>Compare</button>
        </div>

        {compareResult && (
          <div style={styles.result}>
            {compareResult.error ? (
              <p style={styles.error}>❌ {compareResult.error}</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Currency</th>
                    <th>Formatted</th>
                    <th>Exchange Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {compareResult.comparisons && compareResult.comparisons.map((comp, i) => (
                    <tr key={i}>
                      <td>{comp.currency}</td>
                      <td>{comp.formatted}</td>
                      <td>{comp.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Section 4: Money Arithmetic */}
      <div style={styles.section}>
        <h2>4. Money Arithmetic (Integer Operation)</h2>
        <p>Perform arithmetic operations correctly on money (always integer cents)</p>
        
        <div style={styles.form}>
          <div style={styles.row}>
            <label>Amount (cents):</label>
            <input 
              type="number" 
              value={calculateCents} 
              onChange={e => setCalculateCents(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <label>Currency:</label>
            <select 
              value={calculateCurrency} 
              onChange={e => setCalculateCurrency(e.target.value)}
              style={styles.select}
            >
              {currencies.slice(0, 10).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={styles.row}>
            <label>Operation:</label>
            <select 
              value={calculateOperation} 
              onChange={e => setCalculateOperation(e.target.value)}
              style={styles.select}
            >
              <option value="add">Add (+)</option>
              <option value="subtract">Subtract (-)</option>
              <option value="multiply">Multiply (×)</option>
              <option value="divide">Divide (÷)</option>
            </select>
          </div>

          <div style={styles.row}>
            <label>Value:</label>
            <input 
              type="number" 
              value={calculateValue} 
              onChange={e => setCalculateValue(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={handleCalculate} style={styles.button}>Calculate</button>
        </div>

        {calculateResult && (
          <div style={styles.result}>
            {calculateResult.error ? (
              <p style={styles.error}>❌ {calculateResult.error}</p>
            ) : (
              <div>
                <p><strong>Result:</strong> {calculateResult.result} cents</p>
                <p><strong>Operation:</strong> {calculateResult.operation}</p>
                <p style={styles.tip}>✅ All arithmetic uses integer cents to avoid floating point errors!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 5: Supported Currencies */}
      <div style={styles.section}>
        <h2>5. Supported Currencies</h2>
        <p>26 major world currencies with proper decimal place handling</p>
        
        <div style={styles.currencyGrid}>
          {currencies.map(code => (
            <div key={code} style={styles.currencyCard}>
              <div style={styles.currencyCode}>{code}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Learnings */}
      <div style={styles.section} style={{...styles.section, backgroundColor: '#f0f0f0'}}>
        <h2>🎯 Key Takeaways</h2>
        <ul style={styles.list}>
          <li><strong>Store as cents</strong>: Always use integers (100 USD = 10000 cents), never floats</li>
          <li><strong>Use Intl.NumberFormat</strong>: Handles all locale-specific formatting automatically</li>
          <li><strong>Decimal places vary</strong>: USD=2, JPY=0, BHD=3 (different by currency)</li>
          <li><strong>Exchange rates change</strong>: Fetch from API, never hardcode rates</li>
          <li><strong>Avoid floating point</strong>: 0.1 + 0.2 ≠ 0.3 in JavaScript</li>
          <li><strong>Symbol position differs</strong>: $100.00 (US), 100,00€ (DE), 100 \u00a5 (JP)</li>
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
  currencyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '12px',
    marginTop: '16px'
  },
  currencyCard: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    textAlign: 'center',
    border: '1px solid #ddd'
  },
  currencyCode: {
    fontWeight: '600',
    fontSize: '16px'
  },
  tip: {
    color: '#2e7d32',
    fontSize: '14px',
    marginTop: '8px',
    padding: '8px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px'
  },
  list: {
    lineHeight: '1.8',
    color: '#333'
  }
};

