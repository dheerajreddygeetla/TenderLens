export default function Pagination({ page, totalPages, total, limit, onChange }) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="tl-pagination">
      <div>
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong>
      </div>
      <div className="tl-pagination-buttons">
        <button onClick={() => onChange(1)} disabled={page <= 1}>« First</button>
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}>‹ Prev</button>
        <button disabled style={{ cursor: "default" }}>
          Page {page} / {totalPages}
        </button>
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}>Next ›</button>
        <button onClick={() => onChange(totalPages)} disabled={page >= totalPages}>Last »</button>
      </div>
    </div>
  );
}
