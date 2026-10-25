import React from "react";

const POLICIES = [
  { category: "User Accounts", retention: "2 years post-closure", action: "Anonymise", risk: "medium" },
  { category: "Transactions", retention: "7 years", action: "Archive", risk: "low" },
  { category: "Audit Logs", retention: "3 years", action: "Archive", risk: "low" },
  { category: "Marketing Data", retention: "2 years", action: "Delete", risk: "medium" },
  { category: "Support Tickets", retention: "3 years post-close", action: "Anonymise", risk: "medium" },
  { category: "Application Logs", retention: "90 days", action: "Delete", risk: "high" },
  { category: "Session Data", retention: "30 days", action: "Delete", risk: "high" },
];

const ACTION_COLORS = { Delete: "#e53e3e", Anonymise: "#d69e2e", Archive: "#3182ce" };
const RISK_COLORS = { high: "#fed7d7", medium: "#fefcbf", low: "#c6f6d5" };

export default function App() {
  return (
    <div style={{ maxWidth: 720, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>🗂️ Data Retention Policies</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>Active retention schedules. The purge job runs daily at 02:00 UTC.</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f7f8fa" }}>
            {["Data Category", "Retention Period", "Action", "Urgency"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 13, color: "#4a5568" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {POLICIES.map((p) => (
            <tr key={p.category} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "12px", fontWeight: 600, fontSize: 14 }}>{p.category}</td>
              <td style={{ padding: "12px", fontSize: 14, color: "#4a5568" }}>{p.retention}</td>
              <td style={{ padding: "12px" }}>
                <span style={{ background: ACTION_COLORS[p.action], color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>
                  {p.action}
                </span>
              </td>
              <td style={{ padding: "12px" }}>
                <span style={{ background: RISK_COLORS[p.risk], borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                  {p.risk}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0" }}>Last purge job run: Today 02:00 UTC · Next run: Tomorrow 02:00 UTC</p>
    </div>
  );
}
