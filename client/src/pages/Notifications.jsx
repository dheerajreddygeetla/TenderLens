import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../services/notification.js";
import { formatDateTime } from "../utils/format.js";
import { useNotifications } from "../hooks/useNotifications.js";
import { CheckCheck, Activity } from "lucide-react";

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

  useEffect(() => {
    load();
  }, [load]);

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
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontFamily: "var(--tl-font-mono)",
              color: "#38bdf8",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            <Activity size={14} />
            <span>REAL-TIME SURVEILLANCE TELEMETRY FEED</span>
          </div>
          <h1 className="tl-page-title">Executive Alert Telemetry</h1>
          <p className="tl-page-sub">
            Realtime security dispatches, neural analysis triggers, and collusion alerts.
          </p>
        </div>
        <button
          className="tl-btn-ghost"
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          onClick={markAllRead}
        >
          <CheckCheck size={15} />
          <span>Mark All as Acknowledged</span>
        </button>
      </div>

      {error && <div className="tl-error-bar">{error}</div>}

      <div className="tl-card">
        {loading ? (
          <div className="tl-loading">Querying active telemetry dispatches…</div>
        ) : rows.length === 0 ? (
          <div className="tl-empty">No telemetry notifications in queue.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {rows.map((n) => (
              <li
                key={n.id}
                style={{
                  padding: "16px 10px",
                  borderBottom: "1px solid var(--tl-glass-border)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  opacity: n.readAt ? 0.65 : 1,
                  transition: "background 0.15s ease",
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    marginTop: 6,
                    flexShrink: 0,
                    background: n.readAt ? "var(--tl-text-dim)" : "#38bdf8",
                    boxShadow: n.readAt ? "none" : "0 0 10px #38bdf8",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: n.readAt ? 500 : 700,
                      color: "var(--tl-text-primary)",
                    }}
                  >
                    {n.title}
                  </div>
                  {n.body && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--tl-text-secondary)",
                        marginTop: 4,
                        lineHeight: 1.5,
                      }}
                    >
                      {n.body}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--tl-text-muted)",
                      marginTop: 6,
                      fontFamily: "var(--tl-font-mono)",
                    }}
                  >
                    {n.kind?.toUpperCase()} · {formatDateTime(n.createdAt)}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {n.resourceType === "review_indicator" && n.resourceId && (
                    <Link
                      to={`/risks/${n.resourceId}`}
                      className="tl-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                    >
                      Investigate
                    </Link>
                  )}
                  {n.resourceType === "tender" && n.resourceId && (
                    <Link
                      to={`/tenders/${n.resourceId}`}
                      className="tl-btn-ghost"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                    >
                      Dossier
                    </Link>
                  )}
                  {!n.readAt && (
                    <button
                      onClick={() => markRead(n.id)}
                      style={{
                        background: "transparent",
                        border: 0,
                        color: "#38bdf8",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        padding: 4,
                      }}
                    >
                      Acknowledge
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
