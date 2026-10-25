import React, { useState } from "react";

const SAMPLE = { id: "usr_001", name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", dateOfBirth: "1990-05-15", postcode: "560001", gender: "Female", country: "IN", salary: 85000 };

function anonymise(record) {
  const year = new Date().getFullYear();
  const age = year - new Date(record.dateOfBirth).getFullYear();
  const bucket = Math.floor(age / 10) * 10;
  return {
    id: "anon_a3f9b2c1d8",
    ageGroup: `${bucket}-${bucket + 9}`,
    postcodeArea: record.postcode.slice(0, 3) + "***",
    gender: record.gender,
    country: record.country,
    salaryBand: `₹${Math.floor(record.salary / 10000) * 10}k–₹${(Math.floor(record.salary / 10000) + 1) * 10}k`,
  };
}

export default function App() {
  const [view, setView] = useState("original");
  const data = view === "original" ? SAMPLE : anonymise(SAMPLE);
  const keys = Object.keys(data);

  return (
    <div style={{ maxWidth: 640, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>🔬 Anonymisation Demo</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["original", "anonymised"].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: "8px 20px", borderRadius: 20, border: "none", background: view === v ? "#4299e1" : "#e2e8f0", color: view === v ? "#fff" : "#4a5568", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
        ))}
      </div>
      <div style={{ background: view === "anonymised" ? "#f0fff4" : "#fff5f5", border: `1.5px solid ${view === "anonymised" ? "#9ae6b4" : "#feb2b2"}`, borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: view === "anonymised" ? "#276749" : "#c53030", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
          {view === "anonymised" ? "✅ Anonymised — No longer personal data" : "⚠️ Original — Contains PII"}
        </div>
        {keys.map(k => (
          <div key={k} style={{ display: "flex", borderBottom: "1px solid #e2e8f0", padding: "8px 0" }}>
            <span style={{ width: 160, fontWeight: 600, fontSize: 13, color: "#4a5568" }}>{k}</span>
            <span style={{ fontFamily: "monospace", fontSize: 13 }}>{String(data[k])}</span>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 16, fontSize: 12, color: "#a0aec0" }}>Anonymised data is outside GDPR scope. Direct identifiers are removed; quasi-identifiers are generalised.</p>
    </div>
  );
}
