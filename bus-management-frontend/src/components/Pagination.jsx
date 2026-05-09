export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pagination">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >‹</button>

      {pages.map((p) => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => onChange(p)}
        >{p}</button>
      ))}

      <button
        className="btn btn-outline btn-sm"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >›</button>
    </div>
  );
}
