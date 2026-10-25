import React, { useState } from "react";

const RIGHTS = [
  { key: "access", icon: "📋", title: "Access My Data", desc: "Request a copy of all personal data we hold about you.", sla: "30 days" },
  { key: "correction", icon: "✏️", title: "Correct My Data", desc: "Request correction of inaccurate or incomplete data.", sla: "30 days" },
  { key: "erasure", icon: "🗑️", title: "Erase My Data", desc: "Request deletion of your personal data.", sla: "30 days" },
  { key: "grievance", icon: "📣", title: "File a Grievance", desc: "Raise a complaint with our Grievance Officer.", sla: "7 days" },
  { key: "nomination", icon: "👤", title: "Nominate a Representative", desc: "Designate someone to exercise your rights on your behalf.", sla: "7 days" },
];

const LANGUAGES = [
  { code: "en", name: "English" }, { code: "hi", name: "हिन्दी" },
  { code: "bn", name: "বাংলা" }, { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" }, { code: "mr", name: "मराठी" },
];

export default function App() {
  const [lang, setLang] = useState("en");
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div style={{ maxWidth: 680, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>🇮🇳 DPDP Act 2023 – Your Data Rights</h1>
        <select value={lang} onChange={e => setLang(e.target.value)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
          {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
        </select>
      </div>
      <p style={{ color: "#555", marginBottom: 24 }}>Under the Digital Personal Data Protection Act 2023, you have the following rights:</p>
      <div style={{ display: "grid", gap: 12 }}>
        {RIGHTS.map(r => (
          <div key={r.key} onClick={() => { setSelected(r); setSubmitted(false); }}
            style={{ background: selected?.key === r.key ? "#ebf8ff" : "#fff", border: `1.5px solid ${selected?.key === r.key ? "#4299e1" : "#e2e8f0"}`, borderRadius: 10, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 14 }}>
            <span style={{ fontSize: 24 }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
              <div style={{ color: "#718096", fontSize: 13, marginTop: 2 }}>{r.desc}</div>
            </div>
            <span style={{ background: "#e2e8f0", borderRadius: 20, padding: "2px 10px", fontSize: 11, whiteSpace: "nowrap", alignSelf: "center" }}>SLA: {r.sla}</span>
          </div>
        ))}
      </div>
      {selected && !submitted && (
        <div style={{ marginTop: 24, background: "#f7f8fa", borderRadius: 10, padding: 20, border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 12px" }}>{selected.icon} {selected.title}</h3>
          <textarea rows={3} placeholder="Please provide additional details (optional)..."
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #e2e8f0", boxSizing: "border-box", marginBottom: 12 }} />
          <button onClick={() => setSubmitted(true)}
            style={{ padding: "10px 24px", background: "#f6ad55", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>
            Submit Request
          </button>
        </div>
      )}
      {submitted && (
        <div style={{ marginTop: 24, background: "#c6f6d5", borderRadius: 10, padding: 20, color: "#276749" }}>
          <strong>✅ Request Submitted</strong>
          <p style={{ margin: "4px 0 0", fontSize: 14 }}>We will respond within {selected.sla} as required by the DPDP Act 2023.</p>
        </div>
      )}
      <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0" }}>Grievance Officer: grievance@example.com · Data Protection Board of India appeals available.</p>
    </div>
  );
}
