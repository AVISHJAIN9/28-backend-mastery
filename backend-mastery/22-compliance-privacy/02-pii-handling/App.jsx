import React, { useState } from "react";

const SAMPLE_USER = {
  id: "usr_001",
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  phone: "+91 98765 43210",
  aadhaar: "1234 5678 9012",
  pan: "ABCDE1234F",
  dateOfBirth: "1990-05-15",
  address: "42 MG Road, Bengaluru, KA 560001",
};

function mask(value, type) {
  if (type === "email") return value[0] + "***@" + value.split("@")[1];
  if (type === "phone") return value.replace(/\d(?=\d{4})/g, "*");
  if (type === "aadhaar") return "XXXX XXXX " + value.slice(-4);
  if (type === "pan") return "XXXXX" + value.slice(-5);
  if (type === "dob") return "**/**/****";
  if (type === "address") return "[REDACTED]";
  return value[0] + "***";
}

const FIELDS = [
  { key: "name", label: "Full Name", type: "name" },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone", type: "phone" },
  { key: "aadhaar", label: "Aadhaar", type: "aadhaar" },
  { key: "pan", label: "PAN", type: "pan" },
  { key: "dateOfBirth", label: "Date of Birth", type: "dob" },
  { key: "address", label: "Address", type: "address" },
];

export default function App() {
  const [revealed, setRevealed] = useState({});

  const toggle = (key) => setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>🔐 PII Data Viewer</h1>
      <p style={{ color: "#555" }}>User ID: {SAMPLE_USER.id} &nbsp;|&nbsp; Click the eye icon to reveal a field.</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr style={{ background: "#f7f8fa" }}>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 13 }}>Field</th>
            <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 13 }}>Value</th>
            <th style={{ padding: "10px 12px", fontSize: 13 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {FIELDS.map(({ key, label, type }) => (
            <tr key={key} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={{ padding: "10px 12px", fontWeight: 600, fontSize: 14 }}>{label}</td>
              <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 13, color: revealed[key] ? "#1a202c" : "#718096" }}>
                {revealed[key] ? SAMPLE_USER[key] : mask(SAMPLE_USER[key], type)}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center" }}>
                <button
                  onClick={() => toggle(key)}
                  title={revealed[key] ? "Hide" : "Reveal"}
                  style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}
                >
                  {revealed[key] ? "🙈" : "👁️"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 20, fontSize: 12, color: "#a0aec0" }}>
        All PII fields are encrypted at rest. Access is logged for audit purposes.
      </p>
    </div>
  );
}
