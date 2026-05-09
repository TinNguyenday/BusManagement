export default function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...' }) {
  return (
    <div className="search-input">
      <span className="search-icon">🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="search-clear" onClick={() => onChange('')}>✕</button>}
    </div>
  );
}
