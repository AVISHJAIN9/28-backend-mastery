import React, { useState } from "react";

export default function App() {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submitErasureRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/erasure/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason }),
      });
      const data = await res.json();
      setStatus({ success: res.ok, message: data.message, requestId: data.requestId });
    } catch (err) {
      setStatus({ success: false, message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "60px auto", fontFamily: "system-ui", padding: 24 }}>
      <h1>🗑️ GDPR Right to Erasure</h1>
      <p style={{ color: "#555" }}>
        Submit a data erasure request under Article 17 of the GDPR. Your request will be
        processed within 30 days.
      </p>
      <form onSubmit={submitErasureRequest} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <label>
          User ID
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            placeholder="e.g. usr_123456"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, boxSizing: "border-box" }}
          />
        </label>
        <label>
          Reason for Erasure
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            placeholder="e.g. Withdrawal of consent, data no longer necessary..."
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, boxSizing: "border-box" }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", background: "#e53e3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          {loading ? "Submitting..." : "Submit Erasure Request"}
        </button>
      </form>
      {status && (
        <div style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 4,
          background: status.success ? "#c6f6d5" : "#fed7d7",
          color: status.success ? "#276749" : "#c53030"
        }}>
          <strong>{status.success ? "✅ Request Submitted" : "❌ Error"}</strong>
          <p style={{ margin: "4px 0 0" }}>{status.message}</p>
          {status.requestId && <p style={{ fontSize: 12 }}>Request ID: {status.requestId}</p>}
        </div>
      )}
    </div>
  );
}
