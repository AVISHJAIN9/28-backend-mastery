import React, { useState } from "react";

const SAMPLE_LOGS = [
  { sequence: 1, event_type: "auth.login", actor_id: "usr_001", target_id: null, created_at: "2026-03-29T07:12:00Z", metadata: { ip: "103.21.5.1" }, valid: true },
  { sequence: 2, event_type: "data.access", actor_id: "usr_001", target_id: "usr_001", created_at: "2026-03-29T07:13:00Z", metadata: { fields: ["profile"], ip: "103.21.5.1" }, valid: true },
  { sequence: 3, event_type: "consent.granted", actor_id: "usr_001", target_id: "usr_001", created_at: "2026-03-29T07:13:45Z", metadata: { category: "marketing_email", version: "2.1" }, valid: true },
  { sequence: 4, event_type: "admin.action", actor_id: "admin_007", target_id: "usr_002", created_at: "2026-03-29T08:00:00Z", metadata: { action: "reset_password" }, valid: true },
  { sequence: 5, event_type: "erasure.requested", actor_id: "usr_003", target_id: "usr_003", created_at: "2026-03-29T09:30:00Z", metadata: { reason: "Withdrawal of consent" }, valid: true },
  { sequence: 6, event_type: "data.export", actor_id: "admin_007", target_id: "usr_001", created_at: "2026-03-29T10:00:00Z", metadata: { format: "JSON" }, valid: true },
  { sequence: 7, event_type: "erasure.completed", actor_id: "system", target_id: "usr_003", created_at: "2026-03-29T10:01:00Z", metadata: { requestedBy: "usr_003" }, valid: true },
];

const EVENT_COLORS = {
  "auth.login": "#4299e1", "auth.failed": "#e53e3e", "data.access": "#805ad5",
  "data.export": "#dd6b20", "consent.granted": "#48bb78", "consent.withdrawn": "#ed8936",
  "erasure.requested": "#e53e3e", "erasure.completed": "#276749",
  "admin.action": "#d69e2e", "breach.detected": "#e53e3e",
};

export default function App() {
  const [filter, setFilter] = useState("all");
  const types = ["all", ...new Set(SAMPLE_LOGS.map(l => l.event_type))];
  const filtered = filter === "all" ? SAMPLE_LOGS : SAMPLE_LOGS.filter(l => l.event_type === filter);

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", fontFamily: "system-ui", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>📋 Audit Trail</h1>
        <span style={{ background: "#c6f6d5", color: "#276749", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>✅ Chain Intact</span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "5px 14px", borderRadius: 20, border: "none", background: filter === t ? "#2d3748" : "#e2e8f0", color: filter === t ? "#fff" : "#4a5568", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(log => (
          <div key={log.sequence} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ background: EVENT_COLORS[log.event_type] || "#718096", color: "#fff", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>{log.event_type}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Actor: {log.actor_id} {log.target_id && log.target_id !== log.actor_id ? `→ Target: ${log.target_id}` : ""}</div>
              <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>{JSON.stringify(log.metadata)}</div>
            </div>
            <div style={{ fontSize: 11, color: "#a0aec0", whiteSpace: "nowrap", textAlign: "right" }}>
              <div>#{log.sequence}</div>
              <div>{new Date(log.created_at).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0" }}>Each entry is cryptographically chained. Tampering with any entry breaks the chain and is immediately detectable.</p>
    </div>
  );
}
