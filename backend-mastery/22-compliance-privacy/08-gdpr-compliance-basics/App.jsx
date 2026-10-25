import React, { useState } from "react";

const SECTIONS = [
  { key: "principles", label: "Principles", icon: "⚖️" },
  { key: "rights", label: "Rights", icon: "🧑" },
  { key: "lawful", label: "Lawful Bases", icon: "📜" },
  { key: "breach", label: "Breach", icon: "🚨" },
];

const PRINCIPLES = [
  { name: "Lawfulness, Fairness & Transparency", art: "Art. 5(1)(a)", status: "ok" },
  { name: "Purpose Limitation", art: "Art. 5(1)(b)", status: "ok" },
  { name: "Data Minimisation", art: "Art. 5(1)(c)", status: "warning" },
  { name: "Accuracy", art: "Art. 5(1)(d)", status: "ok" },
  { name: "Storage Limitation", art: "Art. 5(1)(e)", status: "ok" },
  { name: "Integrity & Confidentiality", art: "Art. 5(1)(f)", status: "ok" },
  { name: "Accountability", art: "Art. 5(2)", status: "warning" },
];

const RIGHTS = [
  { name: "Right to be Informed", art: "Art. 13-14", implemented: true },
  { name: "Right of Access", art: "Art. 15", implemented: true },
  { name: "Right to Rectification", art: "Art. 16", implemented: true },
  { name: "Right to Erasure", art: "Art. 17", implemented: true },
  { name: "Right to Restrict Processing", art: "Art. 18", implemented: false },
  { name: "Right to Data Portability", art: "Art. 20", implemented: false },
  { name: "Right to Object", art: "Art. 21", implemented: false },
];

const BASES = [
  { name: "Consent", art: "Art. 6(1)(a)", use: "Marketing, optional features" },
  { name: "Contract", art: "Art. 6(1)(b)", use: "Account delivery, payments" },
  { name: "Legal Obligation", art: "Art. 6(1)(c)", use: "Tax, compliance reporting" },
  { name: "Legitimate Interests", art: "Art. 6(1)(f)", use: "Analytics, fraud prevention" },
];

const STATUS_COLORS = { ok: "#48bb78", warning: "#ed8936", error: "#e53e3e" };

export default function App() {
  const [tab, setTab] = useState("principles");

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>🇪🇺 GDPR Compliance Dashboard</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "2px solid #e2e8f0", paddingBottom: 8 }}>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setTab(s.key)} style={{ padding: "8px 18px", border: "none", background: tab === s.key ? "#3182ce" : "transparent", color: tab === s.key ? "#fff" : "#4a5568", borderRadius: 6, fontWeight: 600, cursor: "pointer" }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {tab === "principles" && (
        <div>
          <h2 style={{ marginTop: 0 }}>Data Protection Principles</h2>
          {PRINCIPLES.map(p => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#718096" }}>{p.art}</div>
              </div>
              <span style={{ background: STATUS_COLORS[p.status], color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                {p.status === "ok" ? "✓ Met" : "⚠ Review"}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "rights" && (
        <div>
          <h2 style={{ marginTop: 0 }}>Data Subject Rights Implementation</h2>
          {RIGHTS.map(r => (
            <div key={r.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "#718096" }}>{r.art}</div>
              </div>
              <span style={{ background: r.implemented ? "#48bb78" : "#e53e3e", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 }}>
                {r.implemented ? "✓ Done" : "✗ Needed"}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === "lawful" && (
        <div>
          <h2 style={{ marginTop: 0 }}>Lawful Bases in Use</h2>
          {BASES.map(b => (
            <div key={b.name} style={{ background: "#f7f8fa", borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>{b.name}</span>
                <span style={{ fontSize: 12, color: "#718096" }}>{b.art}</span>
              </div>
              <div style={{ fontSize: 13, color: "#4a5568", marginTop: 4 }}>Used for: {b.use}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "breach" && (
        <div>
          <h2 style={{ marginTop: 0 }}>Breach Notification Timeline</h2>
          {[
            { time: "0h", label: "Breach Detected", desc: "Incident response team alerted", color: "#e53e3e" },
            { time: "24h", label: "Internal Assessment", desc: "Scope, risk level, affected subjects determined", color: "#dd6b20" },
            { time: "72h", label: "Supervisory Authority", desc: "Notify ICO/DPA (Art. 33) — required for all breaches unless low risk", color: "#d69e2e" },
            { time: "ASAP", label: "Notify Data Subjects", desc: "Required if HIGH risk to individuals (Art. 34)", color: "#3182ce" },
            { time: "30d", label: "Post-Incident Review", desc: "Root cause, remediation, lessons learned documented", color: "#48bb78" },
          ].map(step => (
            <div key={step.time} style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, background: step.color, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{step.time}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{step.label}</div>
                <div style={{ fontSize: 13, color: "#718096" }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
