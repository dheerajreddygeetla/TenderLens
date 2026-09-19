import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../services/notification.js";
import { formatDateTime } from "../utils/format.js";
import { useNotifications } from "../hooks/useNotifications.js";

export default function Notifications() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { refresh: refreshUnread } = useNotifications({ pollMs: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await notificationApi.list();
      setRows(res.data.data || []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id) => {
    await notificationApi.markRead(id);
    load();
    refreshUnread();
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    load();
    refreshUnread();
  };

  return (
    <div>
      <div className="tl-page-header">
        <div>
          <h1 className="tl-page-title">Notifications</h1>
          <p className="tl-page-sub">System alerts, analysis results, and review activity.</p>
        </div>
        <button className="tl-btn-ghost" onClick={markAllRead}>Mark all as read</button>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-card">
        {loading ? (
          <div className="tl-loading">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="tl-empty">No notifications yet.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: "12px 4px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  opacity: n.readAt ? 0.7 : 1,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 7, background: n.readAt ? "#cbd5e1" : "#2563eb" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12.5, color: "#475569", marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                    {n.kind} · {formatDateTime(n.createdAt)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {n.resourceType === "review_indicator" && n.resourceId && (
                    <Link to={`/risks/${n.resourceId}`} style={{ fontSize: 12.5 }}>Open</Link>
                  )}
                  {n.resourceType === "tender" && n.resourceId && (
                    <Link to={`/tenders/${n.resourceId}`} style={{ fontSize: 12.5 }}>Open</Link>
                  )}
                  {!n.readAt && (
                    <button
                      onClick={() => markRead(n.id)}
                      style={{ background: "transparent", border: 0, color: "#1d4ed8", fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
