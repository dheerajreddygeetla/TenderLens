import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div>
        <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
        <p style={{ color: "var(--tl-text-600)" }}>This page does not exist in TenderLens.</p>
        <Link to="/">Back to home</Link>
      </div>
    </div>
  );
}
