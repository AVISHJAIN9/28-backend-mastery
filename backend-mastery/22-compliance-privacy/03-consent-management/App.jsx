import React, { useState } from "react";

const CONSENTS = [
  { key: "marketing_email", label: "Marketing Emails", description: "Receive product updates, offers, and newsletters." },
  { key: "analytics", label: "Analytics & Tracking", description: "Help us improve by allowing usage analytics." },
  { key: "third_party_sharing", label: "Third-Party Sharing", description: "Share your data with trusted partners." },
  { key: "personalisation", label: "Personalisation", description: "Customise your experience based on your activity." },
  { key: "research_profiling", label: "Research & Profiling", description: "Use your data for internal research purposes." },
];

export default function App() {
  const [consents, setConsents] = useState({ marketing_email: false, analytics: true, third_party_sharing: false, personalisation: true, research_profiling: false });
  const [saved, setSaved] = useState(false);

  const toggle = (key) => { setConsents((p) => ({ ...p, [key]: !p[key] })); setSaved(false); };

  const handleSave = async () => {
    try {
      await fetch("/api/consent/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(consents) });
      setSaved(true);
    } catch { setSaved(false); }
  };

  return (
    <div style={{ maxWidth: 580, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>⚙️ Privacy Preferences</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>Control how we use your data. You can update these at any time.</p>
      {CONSENTS.map(({ key, label, description }) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: "1px solid #e2e8f0" }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ color: "#718096", fontSize: 13, marginTop: 2 }}>{description}</div>
          </div>
          <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, flexShrink: 0 }}>
            <input type="checkbox" checked={consents[key]} onChange={() => toggle(key)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: "absolute", inset: 0, borderRadius: 24, cursor: "pointer", transition: ".2s",
              background: consents[key] ? "#48bb78" : "#cbd5e0",
            }}>
              <span style={{
                position: "absolute", left: consents[key] ? 22 : 2, top: 2, width: 20, height: 20,
                background: "#fff", borderRadius: "50%", transition: ".2s",
              }} />
            </span>
          </label>
        </div>
      ))}
      <button onClick={handleSave} style={{ marginTop: 24, padding: "10px 28px", background: "#4299e1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
        Save Preferences
      </button>
      {saved && <span style={{ marginLeft: 16, color: "#48bb78", fontWeight: 600 }}>✅ Saved!</span>}
      <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0" }}>Your choices are recorded with a timestamp and IP address for compliance purposes.</p>
    </div>
  );
}
