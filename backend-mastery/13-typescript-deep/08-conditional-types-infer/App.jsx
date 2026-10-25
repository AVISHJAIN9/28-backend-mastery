import React, { useState } from "react";

const API_URL = "http://localhost:13008/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("conditional");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const testConditionalTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/conditional-types/infer-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: [1, 2, 3] })
      });
      const data = await res.json();
      setResults([...results, { name: "Conditional Inference", output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: "Error", output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const testInferKeyword = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/conditional-types/users`, { method: "GET" });
      const data = await res.json();
      setResults([...results, { name: "Infer Keyword", output: JSON.stringify(data.data || {}, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: "Error", output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const testTypeGuards = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/conditional-types/validate-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: { id: 1, name: "John" }, expectedType: "object" })
      });
      const data = await res.json();
      setResults([...results, { name: "Type Guards", output: JSON.stringify(data.data, null, 2) }]);
    } catch (err) {
      setResults([...results, { name: "Error", output: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Module 13.8 - Conditional Types</h1>
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("conditional")} style={{ marginRight: "10px", padding: "8px 16px" }}>
          Conditional
        </button>
        <button onClick={() => setActiveTab("infer")} style={{ marginRight: "10px", padding: "8px 16px" }}>
          Infer
        </button>
        <button onClick={() => setActiveTab("patterns")} style={{ padding: "8px 16px" }}>
          Patterns
        </button>
      </div>

      {activeTab === "conditional" && (
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <h3>Conditional Types</h3>
          <button onClick={testConditionalTypes} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Test
          </button>
          <button onClick={testTypeGuards} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer", marginLeft: "10px" }}>
            Guards
          </button>
        </div>
      )}

      {activeTab === "infer" && (
        <div style={{ border: "1px solid #ccc", padding: "15px" }}>
          <h3>Infer Keyword</h3>
          <button onClick={testInferKeyword} disabled={loading} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Test
          </button>
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: "20px", border: "1px solid #ccc", padding: "15px" }}>
          <h3>Results</h3>
          {results.map((r, idx) => (
            <div key={idx} style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f9f9f9" }}>
              <strong>{r.name}</strong>
              <pre style={{ fontSize: "12px", overflow: "auto" }}>{r.output}</pre>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "30px", fontSize: "12px", color: "#666" }}>
        <p>API: {API_URL}</p>
      </div>
    </div>
  );
}
